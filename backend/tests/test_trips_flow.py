import json
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.dependencies.auth import get_current_user

client = TestClient(app)


def run_unauthenticated_tests():
    """Verify missing tokens are rejected with 401 across all trip endpoints."""
    # List trips
    res_list = client.get("/api/trips")
    assert res_list.status_code == 401, f"Expected 401, got {res_list.status_code}"
    assert "Authentication required" in res_list.json()["detail"]

    # Save trip
    res_save = client.post(
        "/api/trips",
        json={"title": "Unauthorized Trip", "destination": "Goa", "content": {}},
    )
    assert res_save.status_code == 401, f"Expected 401, got {res_save.status_code}"
    assert "Authentication required" in res_save.json()["detail"]

    # Get single trip
    res_get = client.get("/api/trips/00000000-0000-0000-0000-000000000000")
    assert res_get.status_code == 401, f"Expected 401, got {res_get.status_code}"
    assert "Authentication required" in res_get.json()["detail"]
    print("[PASS] Unauthenticated request rejection tests passed (401)")


def run_authenticated_tests():
    """
    Test successful trip creation, retrieval, daily data preservation,
    and cross-user privacy isolation.
    """
    user_a = MagicMock()
    user_a.id = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
    user_a.email = "user_a@example.com"
    user_a.token = "mock_jwt_token_user_a"

    user_b = MagicMock()
    user_b.id = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
    user_b.email = "user_b@example.com"
    user_b.token = "mock_jwt_token_user_b"

    mock_db = []

    class MockTable:
        def __init__(self, table_name):
            self.table_name = table_name
            self._filters = []
            self._order = None

        def insert(self, row):
            # Strict PostgreSQL type check: "budget" is numeric in public.trips schema
            if "budget" in row and row["budget"] is not None:
                if not isinstance(row["budget"], (int, float)):
                    raise Exception(f'invalid input syntax for type numeric: "{row["budget"]}"')

            inserted = dict(row)
            # Alternate simulating PostgreSQL TEXT column (JSON string) vs JSONB column (dict)
            if len(mock_db) % 2 == 1 and isinstance(inserted.get("itinerary"), dict):
                inserted["itinerary"] = json.dumps(inserted["itinerary"])

            inserted["id"] = f"{len(mock_db) + 1}1111111-1111-1111-1111-111111111111"
            inserted["created_at"] = "2026-10-22T00:00:00Z"
            inserted["updated_at"] = "2026-10-22T00:00:00Z"
            mock_db.append(inserted)

            mock_res = MagicMock()
            mock_res.data = [inserted]
            mock_exec = MagicMock()
            mock_exec.execute.return_value = mock_res
            return mock_exec

        def select(self, *cols):
            self._filters = []
            return self

        def eq(self, col, val):
            self._filters.append((col, val))
            return self

        def order(self, col, desc=True):
            self._order = (col, desc)
            return self

        def execute(self):
            results = list(mock_db)
            for col, val in self._filters:
                results = [r for r in results if str(r.get(col)) == str(val)]
            mock_res = MagicMock()
            mock_res.data = results
            return mock_res

    mock_supabase = MagicMock()
    mock_supabase.table.side_effect = lambda t: MockTable(t)

    import app.routes.trips as trips_module

    original_supabase = trips_module.supabase
    trips_module.supabase = mock_supabase

    try:
        # Authenticate as User A
        app.dependency_overrides[get_current_user] = lambda: user_a

        # 1. User A saves a representative 3-day Jaipur trip with multiple activities per day
        jaipur_payload = {
            "title": "3 days in Jaipur",
            "destination": "Jaipur",
            "start_date": "2026-11-01",
            "end_date": "2026-11-03",
            "preferences": {
                "budget": "moderate",
                "pace": "balanced",
                "interests": ["Historical sites", "Culture", "Local food"],
            },
            "content": {
                "destination": "Jaipur",
                "day_count": 3,
                "days": [
                    {
                        "day_number": 1,
                        "title": "Amber Fort & Royal Heritage",
                        "date": "2026-11-01",
                        "notes": "Start early to beat the tourist crowds at the fort.",
                        "activities": [
                            "Morning jeep ascent to Amber Fort & Sheesh Mahal",
                            "Explore subterranean passages and water harvesting at Jaigarh Fort",
                            "Sunset tea with panorama of the Pink City from Nahargarh Fort",
                        ],
                    },
                    {
                        "day_number": 2,
                        "title": "Palaces and Astronomical Marvels",
                        "date": "2026-11-02",
                        "notes": "Composite ticket covers multiple monuments.",
                        "activities": [
                            "Early morning photography at iconic Hawa Mahal honeycomb facade",
                            "Guided museum and courtyards tour inside City Palace",
                            "Examine sundials and celestial instruments at Jantar Mantar",
                        ],
                    },
                    {
                        "day_number": 3,
                        "title": "Bazaars, Crafts & Royal Gardens",
                        "date": "2026-11-03",
                        "notes": "Try authentic Dal Baati Churma at Laxmi Mishthan Bhandar.",
                        "activities": [
                            "Brocades, gemstones and blue pottery shopping in Johari Bazaar",
                            "Traditional Rajasthani thali lunch in the Old City",
                            "Evening illuminated boat view and stroll near Jal Mahal water palace",
                        ],
                    },
                ],
                "itinerary": "# Travel Itinerary: Jaipur\n\n## Day 1: Amber Fort\n## Day 2: City Palace\n## Day 3: Bazaars",
            },
        }

        res_create = client.post("/api/trips", json=jaipur_payload)
        assert res_create.status_code == 201, f"Expected 201, got {res_create.status_code}"
        data = res_create.json()
        jaipur_id = data["id"]

        # Step 2 Verification: Check full daily itinerary data preservation in response
        assert data["title"] == "3 days in Jaipur"
        assert data["destination"] == "Jaipur"
        assert data["user_id"] == str(user_a.id)
        assert data["preferences"]["budget"] == "moderate"

        # Content must contain full daily breakdown with activities
        assert "content" in data
        assert len(data["content"]["days"]) == 3
        day1 = data["content"]["days"][0]
        assert day1["day_number"] == 1
        assert "Amber Fort" in day1["title"]
        assert len(day1["activities"]) == 3
        assert "Amber Fort" in day1["activities"][0]

        # Verify numeric budget is None for category "moderate" (nullable schema compliant)
        assert mock_db[0]["budget"] is None
        print("[PASS] Authenticated Save 3-day Jaipur trip passed (201 Created, full days & activities preserved)")

        # 1b. User A saves trip with explicit numeric budget (simulating PostgreSQL TEXT column serialization)
        payload_num = dict(jaipur_payload)
        payload_num["title"] = "Trip with numeric budget"
        payload_num["preferences"] = {
            "budget": 25000,
            "pace": "fast",
        }
        res_create_num = client.post("/api/trips", json=payload_num)
        assert res_create_num.status_code == 201
        data_num = res_create_num.json()
        assert data_num["preferences"]["budget"] == 25000
        assert mock_db[1]["budget"] == 25000.0
        # Days must be preserved even if database stores itinerary as JSON string
        assert len(data_num["content"]["days"]) == 3
        print("[PASS] Authenticated Save Trip with numeric budget passed (201 Created, numeric budget is 25000.0)")

        # 1c. User A saves trip with formatted currency budget string
        payload_curr = dict(jaipur_payload)
        payload_curr["title"] = "Trip with currency formatted budget"
        payload_curr["preferences"] = {
            "budget": "₹15,000",
            "pace": "relaxed",
        }
        res_create_curr = client.post("/api/trips", json=payload_curr)
        assert res_create_curr.status_code == 201
        assert mock_db[2]["budget"] == 15000.0
        print("[PASS] Authenticated Save Trip with formatted currency string passed (201 Created, numeric budget is 15000.0)")

        # 2. User A lists their trips (GET /api/trips)
        res_list_a = client.get("/api/trips")
        assert res_list_a.status_code == 200, f"Expected 200, got {res_list_a.status_code}"
        trips_a = res_list_a.json()
        assert len(trips_a) == 3
        jaipur_trip_listed = next(t for t in trips_a if t["id"] == jaipur_id)

        # Verify GET /api/trips returns the complete saved daily data
        assert len(jaipur_trip_listed["content"]["days"]) == 3
        assert jaipur_trip_listed["content"]["days"][0]["day_number"] == 1
        assert len(jaipur_trip_listed["content"]["days"][0]["activities"]) == 3
        print("[PASS] GET /api/trips verified: all 3 days & activities returned for list view")

        # 3. User A retrieves specific trip (GET /api/trips/{trip_id})
        res_get_a = client.get(f"/api/trips/{jaipur_id}")
        assert res_get_a.status_code == 200, f"Expected 200, got {res_get_a.status_code}"
        trip_single = res_get_a.json()
        assert trip_single["id"] == jaipur_id
        assert len(trip_single["content"]["days"]) == 3
        assert len(trip_single["content"]["days"][1]["activities"]) == 3
        assert "Palaces" in trip_single["content"]["days"][1]["title"]
        assert "City Palace" in trip_single["content"]["days"][1]["activities"][1]
        print("[PASS] GET /api/trips/{id} verified: single trip retrieved with complete days & activities")

        # 4. Frontend Reopening Simulation: verify structure expected by ItineraryResult.jsx
        reopened_itinerary = trip_single["content"]
        assert isinstance(reopened_itinerary["days"], list)
        assert len(reopened_itinerary["days"]) == 3
        assert reopened_itinerary["day_count"] == 3
        assert reopened_itinerary["destination"] == "Jaipur"
        print("[PASS] Frontend Reopen Contract verified: days array and count match expected shape (no 0 days)")

        # 5. Legacy format support: row with raw markdown string in 'itinerary'
        legacy_row = {
            "id": "99999999-9999-9999-9999-999999999999",
            "user_id": str(user_a.id),
            "title": "Legacy Goa Trip",
            "destination": "Goa",
            "start_date": "2026-12-01",
            "end_date": "2026-12-03",
            "budget": None,
            "days": 2,
            "status": "planned",
            "preferences": {"budget": "moderate"},
            "itinerary": "## Day 1: North Goa Beaches\n- Anjuna Flea Market\n- Baga Beach sunset\n## Day 2: Panaji Churches\n- Basilica of Bom Jesus",
        }
        mock_db.append(legacy_row)

        res_get_legacy = client.get(f"/api/trips/{legacy_row['id']}")
        assert res_get_legacy.status_code == 200
        legacy_data = res_get_legacy.json()
        assert len(legacy_data["content"]["days"]) == 2
        assert "North Goa" in legacy_data["content"]["days"][0]["title"]
        assert len(legacy_data["content"]["days"][0]["activities"]) == 2
        print("[PASS] Legacy Raw Markdown Itinerary support verified: auto-parsed into structured days")

        # 6. Cross-user isolation: User B attempts to access User A's trips
        app.dependency_overrides[get_current_user] = lambda: user_b

        res_list_b = client.get("/api/trips")
        assert res_list_b.status_code == 200
        assert len(res_list_b.json()) == 0  # Cannot see User A's trips
        print("[PASS] Cross-user list privacy isolation verified")

        res_get_b = client.get(f"/api/trips/{jaipur_id}")
        assert res_get_b.status_code == 404
        assert "not found or you do not have permission" in res_get_b.json()["detail"]
        print("[PASS] Cross-user unauthorized access rejection verified (404)")

    finally:
        trips_module.supabase = original_supabase
        app.dependency_overrides.clear()


def run_day_count_and_itinerary_parser_tests():
    """
    Test day-count validation, complete day extraction up to 16 days,
    and missing day detection logic.
    """
    from app.services.ai_service import extract_itinerary_days
    from app.routes.itinerary import parse_markdown_to_days

    # 1. Complete 16-day sequential Markdown text
    sixteen_day_md = "\n\n".join(
        f"## Day {i}: Milestone Day {i}\n- Activity {i}.1\n- Activity {i}.2"
        for i in range(1, 17)
    )
    extracted_16 = extract_itinerary_days(sixteen_day_md)
    assert len(extracted_16) == 16, f"Expected 16 days, got {len(extracted_16)}"
    assert extracted_16 == list(range(1, 17))
    print("[PASS] 16-day itinerary day extraction verified: exactly 16 sequential days detected")

    # 2. Incomplete generation detection: only 14 days when 16 requested
    fourteen_day_md = "\n\n".join(
        f"## Day {i}: Milestone Day {i}\n- Activity {i}.1"
        for i in range(1, 15)
    )
    extracted_14 = extract_itinerary_days(fourteen_day_md)
    assert len(extracted_14) == 14
    requested_days = 16
    missing = [d for d in range(1, requested_days + 1) if d not in extracted_14]
    assert missing == [15, 16], f"Expected missing [15, 16], got {missing}"
    print("[PASS] Incomplete itinerary detection verified: detected missing days [15, 16]")

    # 3. Parse Markdown into structured DayPlan models
    parsed_days = parse_markdown_to_days(sixteen_day_md, start_date_str="2026-11-01")
    assert len(parsed_days) == 16
    assert parsed_days[0].day_number == 1
    assert parsed_days[15].day_number == 16
    assert len(parsed_days[0].activities) == 2
    assert parsed_days[0].date == "2026-11-01"
    assert parsed_days[15].date == "2026-11-16"
    print("[PASS] Structured DayPlan parser verified: all 16 days with dates and activities parsed")


if __name__ == "__main__":
    run_unauthenticated_tests()
    run_authenticated_tests()
    run_day_count_and_itinerary_parser_tests()
    print("\nALL BACKEND TRIP PERSISTENCE, REOPEN & DAY-COUNT TESTS PASSED SUCCESSFULLY!")

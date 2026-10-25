from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.dependencies.auth import get_current_user

client = TestClient(app)


def test_unauthenticated_rejections():
    """Verify all protected endpoints reject missing or invalid tokens."""
    # 1. Missing Authorization header
    res1 = client.get("/api/trips")
    assert res1.status_code == 401
    assert "Authentication required" in res1.json()["detail"]

    res2 = client.post("/api/trips", json={"title": "Test", "destination": "Goa", "content": {}})
    assert res2.status_code == 401
    assert "Authentication required" in res2.json()["detail"]

    res3 = client.get("/api/auth/me")
    assert res3.status_code == 401

    # 2. Malformed / invalid bearer token
    res_bad = client.get("/api/trips", headers={"Authorization": "Bearer malformed.token.value"})
    assert res_bad.status_code == 401
    assert "Invalid or expired session token" in res_bad.json()["detail"]
    print("[PASS] Unauthenticated and invalid token rejections verified (401)")


def test_authenticated_trips_workflow():
    """
    Test full flow:
    - User A saves trip (POST /api/trips)
    - User A lists trips (GET /api/trips)
    - User A gets trip by ID (GET /api/trips/{id})
    - User B cannot see or get User A's trip (cross-user isolation)
    """
    user_a = MagicMock()
    user_a.id = "11111111-1111-1111-1111-111111111111"
    user_a.email = "traveler_a@voyageplan.com"

    user_b = MagicMock()
    user_b.id = "22222222-2222-2222-2222-222222222222"
    user_b.email = "traveler_b@voyageplan.com"

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
            inserted["id"] = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
            inserted["created_at"] = "2026-10-22T01:00:00Z"
            inserted["updated_at"] = "2026-10-22T01:00:00Z"
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

        payload = {
            "title": "4 Days in Kyoto",
            "destination": "Kyoto",
            "start_date": "2026-11-10",
            "end_date": "2026-11-14",
            "preferences": {
                "budget": "moderate",
                "pace": "balanced",
                "interests": ["Culture", "Local food"],
            },
            "content": {
                "destination": "Kyoto",
                "days": [
                    {"day_number": 1, "title": "Arashiyama Bamboo Grove"},
                    {"day_number": 2, "title": "Fushimi Inari Shrine"},
                    {"day_number": 3, "title": "Kinkaku-ji Temple"},
                    {"day_number": 4, "title": "Gion District"},
                ],
            },
        }

        # 1. Save trip
        res_create = client.post("/api/trips", json=payload)
        assert res_create.status_code == 201
        created = res_create.json()
        assert created["destination"] == "Kyoto"
        assert created["user_id"] == str(user_a.id)
        assert created["content"]["days"][0]["title"] == "Arashiyama Bamboo Grove"
        trip_id = created["id"]
        print("[PASS] User A save trip verified (201 Created)")

        # 2. List trips as User A
        res_list_a = client.get("/api/trips")
        assert res_list_a.status_code == 200
        trips_list_a = res_list_a.json()
        assert len(trips_list_a) == 1
        assert trips_list_a[0]["id"] == trip_id
        assert trips_list_a[0]["user_id"] == str(user_a.id)
        print("[PASS] User A list trips verified (200 OK)")

        # 3. Retrieve single trip as User A
        res_get_a = client.get(f"/api/trips/{trip_id}")
        assert res_get_a.status_code == 200
        assert res_get_a.json()["id"] == trip_id
        print("[PASS] User A get trip by ID verified (200 OK)")

        # 4. Cross-user isolation: User B accesses /api/trips
        app.dependency_overrides[get_current_user] = lambda: user_b

        res_list_b = client.get("/api/trips")
        assert res_list_b.status_code == 200
        assert len(res_list_b.json()) == 0
        print("[PASS] User B list isolation verified (0 trips shown)")

        # 5. Cross-user isolation: User B accesses User A's trip by ID -> 404
        res_get_b = client.get(f"/api/trips/{trip_id}")
        assert res_get_b.status_code == 404
        assert "not found or you do not have permission" in res_get_b.json()["detail"]
        print("[PASS] User B unauthorized access denied (404)")

    finally:
        trips_module.supabase = original_supabase
        app.dependency_overrides.clear()


if __name__ == "__main__":
    test_unauthenticated_rejections()
    test_authenticated_trips_workflow()
    print("\nALL BACKEND AUTH & TRIPS TESTS PASSED SUCCESSFULLY!")

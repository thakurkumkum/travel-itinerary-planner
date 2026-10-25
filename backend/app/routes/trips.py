from typing import Any, Optional
import json
import logging
import re
from fastapi import APIRouter, Depends, HTTPException, status
from app.dependencies.auth import get_current_user
from app.routes.itinerary import parse_markdown_to_days
from app.schemas.trip import TripCreateRequest, TripResponse
from app.supabase_client import supabase, get_user_supabase_client
import app.supabase_client as sc

logger = logging.getLogger("trips")

router = APIRouter(
    prefix="/api/trips",
    tags=["Trips"],
)


def _get_db(current_user: Any = None):
    """
    Resolves the database client for the current request.
    If supabase has been mocked in tests (e.g. trips_module.supabase = mock_supabase),
    the mock takes precedence so offline unit tests run without alteration.
    In live execution, returns a client scoped with current_user.token so PostgreSQL
    Row Level Security (RLS) policies (e.g. auth.uid() = user_id) succeed.
    """
    if supabase is not sc.supabase:
        return supabase

    token = getattr(current_user, "token", None) if current_user else None
    client = sc.get_user_supabase_client(token)
    return client or supabase


def _parse_numeric_budget(val: Any) -> Optional[float]:
    """
    Safely extracts a numeric budget amount if provided by the user.
    Returns None if the value is a category string (e.g. 'moderate', 'budget', 'luxury')
    or cannot be parsed into a valid finite number.
    Does NOT invent an amount if none was provided.
    """
    if val is None:
        return None
    if isinstance(val, (int, float)):
        return float(val)
    if isinstance(val, str):
        cleaned = val.strip().replace(",", "")
        if re.search(r"\d", cleaned):
            cleaned_num = re.sub(r"[^\d.]", "", cleaned)
            try:
                return float(cleaned_num)
            except ValueError:
                return None
    return None


def _normalize_itinerary_payload(payload: Any, row: dict[str, Any]) -> dict[str, Any]:
    """
    Robustly deserializes and normalizes the stored itinerary data into
    a complete dictionary with 'days', 'day_count', 'destination', and 'itinerary' (markdown).
    Handles:
    - Dict with 'days' and/or 'itinerary'
    - JSON-encoded string containing structured itinerary (e.g. from PostgreSQL TEXT column)
    - Double-JSON-encoded string
    - Raw markdown string (automatically parsed into structured days with activities)
    - Older records wrapped in 'raw' or 'content'
    - Fallback from row columns (destination, days, start_date, end_date)
    """
    if payload is None:
        payload = row.get("content") or {}

    # 1. If payload is a string, attempt JSON decoding (up to twice for double-encoded JSON)
    if isinstance(payload, str):
        payload_str = payload.strip()
        if (payload_str.startswith("{") and payload_str.endswith("}")) or (
            payload_str.startswith("[") and payload_str.endswith("]")
        ):
            try:
                decoded = json.loads(payload_str)
                if isinstance(decoded, str):
                    try:
                        decoded = json.loads(decoded)
                    except Exception:
                        pass
                if isinstance(decoded, dict):
                    payload = decoded
                elif isinstance(decoded, list):
                    payload = {"days": decoded}
            except Exception:
                pass

    # 2. If payload is still a string (e.g. raw markdown itinerary text)
    if isinstance(payload, str):
        raw_text = payload.strip()
        parsed_days = parse_markdown_to_days(raw_text, row.get("start_date"))
        day_dicts = [
            d.model_dump() if hasattr(d, "model_dump") else d.__dict__
            for d in parsed_days
        ]
        payload = {
            "destination": row.get("destination", ""),
            "days": day_dicts,
            "day_count": len(day_dicts) or row.get("days") or 1,
            "itinerary": raw_text,
            "start_date": str(row.get("start_date")) if row.get("start_date") else None,
            "end_date": str(row.get("end_date")) if row.get("end_date") else None,
        }

    # 3. If payload is not a dict, wrap as empty dict
    if not isinstance(payload, dict):
        payload = {}

    # 4. If payload contains nested 'raw' or 'content' key
    if "raw" in payload and isinstance(payload["raw"], (str, dict)) and len(payload) == 1:
        nested = payload["raw"]
        if isinstance(nested, dict):
            payload = nested
        elif isinstance(nested, str):
            return _normalize_itinerary_payload(nested, row)

    if "content" in payload and isinstance(payload["content"], dict) and "days" not in payload:
        payload = payload["content"]

    # 5. Ensure structured 'days' array exists and is populated
    days_list = payload.get("days")
    if not isinstance(days_list, list) or len(days_list) == 0:
        md_text = payload.get("itinerary") or payload.get("raw") or ""
        if isinstance(md_text, str) and md_text.strip():
            parsed_days = parse_markdown_to_days(
                md_text, row.get("start_date") or payload.get("start_date")
            )
            days_list = [
                d.model_dump() if hasattr(d, "model_dump") else d.__dict__
                for d in parsed_days
            ]
            payload["days"] = days_list
        else:
            payload["days"] = []

    # 6. Ensure destination, day_count, start_date, end_date are populated
    if not payload.get("destination"):
        payload["destination"] = row.get("destination", "")

    actual_days_count = len(payload.get("days", []))
    if not payload.get("day_count") or payload.get("day_count") == 0:
        payload["day_count"] = actual_days_count or row.get("days") or 0

    if not payload.get("start_date") and row.get("start_date"):
        payload["start_date"] = str(row["start_date"])

    if not payload.get("end_date") and row.get("end_date"):
        payload["end_date"] = str(row["end_date"])

    return payload


def _row_to_response(row: dict[str, Any]) -> TripResponse:
    """
    Normalizes a row from public.trips into the standard TripResponse schema.
    Ensures backward compatibility with frontend consumers expecting 'content'.
    """
    itinerary_payload = _normalize_itinerary_payload(row.get("itinerary"), row)

    preferences_payload = row.get("preferences") or {}
    if not isinstance(preferences_payload, dict):
        preferences_payload = {}
    else:
        preferences_payload = dict(preferences_payload)

    # If preferences is missing budget or pace, fall back to column values
    if "budget" not in preferences_payload and row.get("budget") is not None:
        preferences_payload["budget"] = row.get("budget")

    return TripResponse(
        id=str(row["id"]),
        user_id=str(row["user_id"]),
        title=row.get("title", ""),
        destination=row.get("destination", ""),
        start_date=str(row.get("start_date")) if row.get("start_date") else None,
        end_date=str(row.get("end_date")) if row.get("end_date") else None,
        preferences=preferences_payload,
        content=itinerary_payload,
        itinerary=itinerary_payload,
        created_at=str(row.get("created_at")) if row.get("created_at") else None,
        updated_at=str(row.get("updated_at")) if row.get("updated_at") else None,
    )


@router.post("", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
def save_trip(
    trip_data: TripCreateRequest,
    current_user=Depends(get_current_user),
):
    """
    Save an itinerary into public.trips for the authenticated user.
    The user_id is derived strictly from current_user.id (from the verified Supabase JWT).
    Database calls are executed within the authenticated user's security context
    to satisfy PostgreSQL Row Level Security (RLS) policies.
    """
    db = _get_db(current_user)
    if not db:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database service unavailable. Please check backend configuration.",
        )

    user_id = str(current_user.id)

    # Derive day count from content or preferences
    days_val = None
    if isinstance(trip_data.content, dict):
        if "day_count" in trip_data.content and isinstance(trip_data.content["day_count"], int):
            days_val = trip_data.content["day_count"]
        elif "days" in trip_data.content and isinstance(trip_data.content["days"], list):
            days_val = len(trip_data.content["days"])

    # public.trips.budget is a PostgreSQL numeric column.
    # Extract a valid numeric amount only if the user actually supplied a number.
    # Do NOT pass category strings like "moderate" to numeric column, and do NOT invent amounts.
    raw_budget = trip_data.preferences.get("budget")
    numeric_budget = _parse_numeric_budget(raw_budget)
    if numeric_budget is None:
        numeric_budget = _parse_numeric_budget(trip_data.preferences.get("budget_amount"))

    # Prepare insert payload strictly matching public.trips schema
    trip_row = {
        "user_id": user_id,
        "title": trip_data.title.strip(),
        "destination": trip_data.destination.strip(),
        "start_date": trip_data.start_date,
        "end_date": trip_data.end_date,
        "budget": numeric_budget,
        "days": days_val,
        "status": "planned",
        "preferences": trip_data.preferences,
        "itinerary": trip_data.content,
    }

    try:
        response = db.table("trips").insert(trip_row).execute()
        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save trip record.",
            )

        saved_trip = response.data[0]
        return _row_to_response(saved_trip)

    except HTTPException:
        raise
    except Exception as exc:
        err_msg = getattr(exc, "message", str(exc))
        err_code = getattr(exc, "code", "")
        logger.error(
            f"Save trip database error: code={err_code}, message={err_msg}, exc={repr(exc)}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unable to save itinerary to database: {err_msg}",
        ) from exc


@router.get("", response_model=list[TripResponse])
def list_trips(current_user=Depends(get_current_user)):
    """
    List all saved trips belonging to the authenticated user from public.trips,
    ordered by creation date descending.
    """
    db = _get_db(current_user)
    if not db:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database service unavailable. Please check backend configuration.",
        )

    user_id = str(current_user.id)

    try:
        response = (
            db.table("trips")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )

        return [_row_to_response(item) for item in (response.data or [])]

    except Exception as exc:
        err_msg = getattr(exc, "message", str(exc))
        logger.error(f"List trips database error: {err_msg}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to fetch saved trips from database.",
        ) from exc


@router.get("/{trip_id}", response_model=TripResponse)
def get_trip(trip_id: str, current_user=Depends(get_current_user)):
    """
    Retrieve a single saved itinerary by ID from public.trips.
    Enforces ownership: only returns the trip if user_id matches the authenticated user.
    """
    db = _get_db(current_user)
    if not db:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database service unavailable. Please check backend configuration.",
        )

    user_id = str(current_user.id)

    try:
        response = (
            db.table("trips")
            .select("*")
            .eq("id", trip_id)
            .eq("user_id", user_id)
            .execute()
        )

        if not response.data or len(response.data) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trip not found or you do not have permission to access it.",
            )

        return _row_to_response(response.data[0])

    except HTTPException:
        raise
    except Exception as exc:
        err_msg = getattr(exc, "message", str(exc))
        logger.error(f"Get trip database error: {err_msg}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to fetch trip details from database.",
        ) from exc

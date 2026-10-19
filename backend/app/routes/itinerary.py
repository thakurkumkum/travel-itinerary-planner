
from fastapi import APIRouter, HTTPException

from app.schemas.itinerary import (
    ItineraryRequest,
    ItineraryResponse,
)
from app.services.ai_service import generate_itinerary

router = APIRouter(
    prefix="/api/itinerary",
    tags=["Itinerary"],
)


@router.post("/generate", response_model=ItineraryResponse)
def create_itinerary(request: ItineraryRequest):
    try:
        itinerary = generate_itinerary(
            destination=request.destination,
            days=request.days,
            budget=request.budget,
            interests=request.interests,
            travelers=request.travelers,
        )

        return ItineraryResponse(
            destination=request.destination,
            days=request.days,
            itinerary=itinerary,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        print(f"Groq API error: {type(exc).__name__}: {exc}")
        raise HTTPException(
            status_code=502,
            detail="Failed to generate itinerary. Check backend terminal.",
        ) from exc

from pydantic import BaseModel, Field


class ItineraryRequest(BaseModel):
    destination: str = Field(..., min_length=2, max_length=100)
    days: int = Field(..., ge=1, le=30)
    budget: str = Field(..., min_length=1, max_length=50)
    interests: list[str] = Field(..., min_length=1)
    travelers: int = Field(default=1, ge=1, le=20)


class ItineraryResponse(BaseModel):
    destination: str
    days: int
    itinerary: str
from typing import Optional
from pydantic import BaseModel, Field


class ItineraryRequest(BaseModel):
    destination: str = Field(..., min_length=2, max_length=100)
    days: Optional[int] = Field(default=None, ge=1, le=30)
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    budget: str = Field(default="moderate", min_length=1, max_length=50)
    interests: list[str] = Field(..., min_length=1)
    travelers: int = Field(default=1, ge=1, le=20)
    pace: Optional[str] = "balanced"


class DayPlan(BaseModel):
    day_number: int
    title: str
    date: Optional[str] = None
    notes: Optional[str] = ""
    activities: list[str] = Field(default_factory=list)


class ItineraryResponse(BaseModel):
    destination: str
    days: list[DayPlan] = Field(default_factory=list)
    day_count: int
    budget: Optional[str] = None
    pace: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    itinerary: str  # Markdown text

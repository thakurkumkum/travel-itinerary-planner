from typing import Any, Optional
from pydantic import BaseModel, Field


class TripCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    destination: str = Field(..., min_length=1, max_length=150)
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    preferences: dict[str, Any] = Field(default_factory=dict)
    content: dict[str, Any] = Field(..., description="Structured or raw itinerary content")


class TripResponse(BaseModel):
    id: str
    user_id: str
    title: str
    destination: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    preferences: dict[str, Any] = Field(default_factory=dict)
    content: dict[str, Any] = Field(default_factory=dict)
    itinerary: Optional[Any] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

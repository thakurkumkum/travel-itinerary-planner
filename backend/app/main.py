
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.itinerary import router as itinerary_router

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

# Create the app BEFORE registering routes
app = FastAPI(
    title="Personalized Travel Itinerary Planner",
    description="API for generating personalized travel itineraries",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes AFTER creating app
app.include_router(itinerary_router)


@app.get("/")
def home():
    return {
        "message": "Travel Itinerary Planner API is running!"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}

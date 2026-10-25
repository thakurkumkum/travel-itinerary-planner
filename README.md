<div align="center">

# ✈️ VoyagePlan | AI TRAVEL PLANNER

### Plan smarter. Explore more. Travel better.

**An AI-powered travel itinerary planner personalized to your preferences.**

[🌐 Live Demo](https://travel-itinerary-planner-0023-b9jioymcx-kumkum18.vercel.app/) ·
[💻 GitHub Repository](https://github.com/thakurkumkum/travel-itinerary-planner) ·
[🩺 API Health](https://travel-itinerary-planner-1ysc.onrender.com/health)

<img alt="React" src="https://img.shields.io/badge/React-UI-61DAFB?logo=react&logoColor=black">
<img alt="Vite" src="https://img.shields.io/badge/Vite-Build-646CFF?logo=vite&logoColor=white">
<img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-Backend-009688?logo=fastapi&logoColor=white">
<img alt="Supabase" src="https://img.shields.io/badge/Supabase-Auth%20%26%20Data-3FCF8E?logo=supabase&logoColor=white">
<img alt="Vercel" src="https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel">
<img alt="Render" src="https://img.shields.io/badge/Backend-Render-46E3B7?logo=render&logoColor=black">

</div>

---

## 🌍 Overview

**Trip Genius AI** helps travelers create personalized itineraries using their **destination, travel dates, interests, budget, and preferred pace**. Users can generate a plan, save trips, revisit them in **My Trips**, and edit saved preferences.

## ✨ Key Features

- 🧭 **Personalized planning** based on destination and travel preferences.
- 🤖 **AI-assisted itinerary generation** through the backend integration.
- 🔐 **Authentication** with Supabase Auth.
- 💾 **Save and revisit trips** in My Trips.
- ✏️ **Edit saved preferences** without starting from scratch.
- 🔄 **Persistent saved trips** across browser refreshes, as reported in production tests.

## 🛠️ Tech Stack

| Technology | Role |
|---|---|
| React + Vite | Frontend and build tooling |
| Python + FastAPI | Backend API and request handling |
| Pydantic | Input validation |
| Groq | AI inference integration |
| Supabase | Authentication and PostgreSQL data services |
| Vercel + Render | Frontend and backend hosting |

## 🔄 How It Works

1. **Enter preferences** — destination, dates, interests, budget, and pace.
2. **Generate** — the frontend sends the request to FastAPI.
3. **Personalize** — the backend validates inputs and calls the configured AI integration.
4. **Save** — review the itinerary and save the trip.
5. **Revisit** — open My Trips, edit preferences, and return to saved plans.

## 🏗️ Architecture

```text
Traveler
   ↓
React + Vite Frontend
   ↓ HTTP API
FastAPI Backend ─────→ Groq AI
   │
   └───────────────→ Supabase Auth / Data
```

## 🚀 Run Locally

**Prerequisites:** Git, Node.js/npm, Python, and the required Supabase and Groq configuration.

```bash
git clone https://github.com/thakurkumkum/travel-itinerary-planner.git
cd travel-itinerary-planner
```

**Frontend** — in one terminal:

```bash
cd frontend
npm install
npm run dev
```

**Backend** — in a separate terminal:

```bash
cd backend
python -m venv .venv
# Activate the virtual environment
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## 🔑 Environment & Security

Configure the environment variables required by your code.

**Frontend examples:**

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_public_anon_key
```

Configure your **Groq API key** and required Supabase settings on the backend.

> **Security:** Never commit `.env` files or secrets. Keep Groq credentials and Supabase service-role keys on the server, and verify access controls for saved trips.

## ☁️ Live Deployment

| Service | Link |
|---|---|
| **Live application** | [Open Trip Genius AI](https://travel-itinerary-planner-0023-b9jioymcx-kumkum18.vercel.app/) |
| **Backend health** | [Check API status](https://travel-itinerary-planner-1ysc.onrender.com/health) |
| **Source code** | [GitHub repository](https://github.com/thakurkumkum/travel-itinerary-planner) |

## ✅ Production Smoke Tests

The project owner reports that these tests passed:

- Sign-up and sign-in
- Itinerary generation
- Saving and listing trips
- Loading saved preferences for editing
- Persistence after browser refresh
- No critical browser-console errors during the reported test session

## 🚀 Future Improvements

Interactive maps, PDF itinerary export, richer budget summaries, live travel information, improved AI error handling, and collaborative planning.

## ⚠️ Note

AI-generated travel suggestions may be incomplete or outdated. Verify current prices, opening hours, transportation details, and safety information before traveling. Trip Genius AI does not guarantee live availability or booking prices.

---

<div align="center">

**Trip Genius AI** · *Plan smarter. Explore more. Travel better. ✈️*

</div>

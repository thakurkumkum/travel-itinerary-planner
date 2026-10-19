# Architecture — Personalized Travel Itinerary Planner

## Overview

This application follows a classic **client-server** architecture with a managed database.  
The frontend and backend are deployed independently and communicate over HTTPS REST APIs.

---

## High-Level Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                       │
│                                                             │
│   React + Vite (Vercel)                                     │
│   ┌───────────┐  ┌───────────┐  ┌───────────────────────┐  │
│   │  pages/   │  │components/│  │      services/        │  │
│   │ (routes)  │  │ (UI parts)│  │ supabase.js | api.js  │  │
│   └─────┬─────┘  └─────┬─────┘  └──────────┬────────────┘  │
└─────────┼──────────────┼─────────────────── ┼ ─────────────┘
          │              │                     │
          │      Supabase Auth SDK             │ Axios HTTP
          │      (direct from browser)         │ calls
          ▼                                    ▼
┌─────────────────────┐            ┌───────────────────────┐
│   Supabase (Cloud)  │            │  FastAPI (Render)      │
│                     │            │                        │
│  ┌───────────────┐  │            │  ┌─────────────────┐  │
│  │  Auth service │  │◄──────────►│  │ routes/         │  │
│  ├───────────────┤  │  JWT token │  │ (API endpoints) │  │
│  │  PostgreSQL   │  │  validation│  ├─────────────────┤  │
│  │  (tables +    │  │            │  │ services/       │  │
│  │   RLS)        │  │◄──────────►│  │ (Groq, Supabase)│  │
│  └───────────────┘  │  DB reads/ │  ├─────────────────┤  │
└─────────────────────┘  writes    │  │ prompts/        │  │
                                   │  │ (AI templates)  │  │
                                   │  └─────────────────┘  │
                                   │           │            │
                                   └───────────┼────────────┘
                                               │
                                               ▼
                                   ┌───────────────────────┐
                                   │   Groq API (Cloud)    │
                                   │  LLM inference        │
                                   └───────────────────────┘
```

---

## Component Responsibilities

### Frontend (`frontend/`)
| Folder         | Purpose                                                      |
|----------------|--------------------------------------------------------------|
| `pages/`       | Top-level route components (Home, Login, Dashboard, etc.)    |
| `components/`  | Reusable UI pieces (Navbar, ItineraryCard, forms, etc.)      |
| `services/`    | `supabase.js` — Supabase client init & auth helpers; `api.js` — Axios wrapper for backend calls |

### Backend (`backend/app/`)
| Folder       | Purpose                                                        |
|--------------|----------------------------------------------------------------|
| `routes/`    | FastAPI routers — one file per feature (e.g. `itinerary.py`)  |
| `schemas/`   | Pydantic models for request/response validation                |
| `services/`  | Business logic: Groq calls, Supabase admin queries             |
| `prompts/`   | Plain-text or Python prompt templates for AI generation        |

### Database (`database/`)
- **Supabase PostgreSQL** with Row Level Security (RLS) so users can only access their own data.
- Schema is defined in `schema.sql` and applied via the Supabase SQL editor.

---

## Data Flow — Itinerary Generation

```
1. User fills in travel preferences form  →  Frontend
2. Frontend sends POST /itinerary/generate →  FastAPI (with JWT)
3. FastAPI validates JWT with Supabase     →  Supabase Auth
4. FastAPI builds AI prompt from template →  prompts/
5. FastAPI calls Groq API                 →  Groq (LLM)
6. FastAPI saves result to Supabase DB    →  Supabase PostgreSQL
7. FastAPI returns itinerary JSON         →  Frontend
8. Frontend displays the itinerary        →  User
```

---

## Security Notes

- All Supabase table access is protected with **Row Level Security** policies.
- The backend uses the **service role key** (server-side only, never exposed to the browser).
- The frontend uses the **anon key** (safe for public) and relies on Supabase Auth JWTs.
- CORS is restricted to the Vercel frontend domain in production.

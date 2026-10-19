# Personalized Travel Itinerary Planner

> A college project that uses AI (Groq) to generate personalized travel itineraries.  
> Users sign in via Supabase Auth, enter their travel preferences, and receive a detailed day-by-day plan.

---

## Tech Stack

| Layer        | Technology                        |
|--------------|-----------------------------------|
| Frontend     | React 18 + Vite + JavaScript      |
| Backend      | Python 3.11 + FastAPI             |
| Database     | Supabase (PostgreSQL)             |
| Auth         | Supabase Auth                     |
| AI           | Groq (LLM inference)              |
| FE Deploy    | Vercel                            |
| BE Deploy    | Render                            |

---

## Project Structure

```
personalized-travel-itinerary-planner/
├── frontend/           # React + Vite app
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Page-level components (routes)
│   │   └── services/   # API calls and Supabase client
│   ├── .env.example    # Required environment variables
│   └── package.json
├── backend/            # FastAPI app
│   ├── app/
│   │   ├── routes/     # API endpoint routers
│   │   ├── schemas/    # Pydantic request/response models
│   │   ├── services/   # Business logic (Groq, Supabase)
│   │   └── prompts/    # AI prompt templates
│   ├── requirements.txt
│   └── .env.example    # Required environment variables
├── database/
│   └── schema.sql      # Supabase SQL schema + RLS policies
├── .gitignore
├── README.md
├── ARCHITECTURE.md     # System design overview
└── DEPLOYMENT.md       # Step-by-step deployment guide
```

---

## Getting Started (Local Development)

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd personalized-travel-itinerary-planner
```

### 2. Set up the backend
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env   # Fill in your real values
uvicorn app.main:app --reload
```

### 3. Set up the frontend
```bash
cd frontend
npm install
cp .env.example .env.local   # Fill in your real values
npm run dev
```

### 4. Set up the database
- Create a project on [Supabase](https://supabase.com).
- Open the **SQL Editor** and run `database/schema.sql`.

---

## Environment Variables

Copy the `.env.example` files and fill in your credentials.  
**Never commit real `.env` files to version control.**

| File                    | Key variables                                      |
|-------------------------|----------------------------------------------------|
| `frontend/.env.example` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_BASE_URL` |
| `backend/.env.example`  | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY` |

---

## License

MIT — free to use for educational purposes.

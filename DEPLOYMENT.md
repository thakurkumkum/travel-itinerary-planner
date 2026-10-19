# Deployment Guide — Personalized Travel Itinerary Planner

This guide walks you through deploying the frontend to **Vercel** and the backend to **Render**.

---

## Prerequisites

- [ ] Supabase project created and `schema.sql` applied
- [ ] Groq API key obtained from [console.groq.com](https://console.groq.com)
- [ ] Code pushed to a GitHub repository

---

## 1 — Database Setup (Supabase)

1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Navigate to **SQL Editor** and paste the contents of `database/schema.sql`. Run it.
3. Under **Project Settings → API**, copy:
   - **Project URL** → `SUPABASE_URL` / `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`
   - **service_role secret key** → `SUPABASE_SERVICE_ROLE_KEY` *(keep this private!)*

---

## 2 — Backend Deployment (Render)

1. Go to [render.com](https://render.com) → **New Web Service**.
2. Connect your GitHub repository and select the repo.
3. Configure the service:
   | Setting          | Value                          |
   |------------------|--------------------------------|
   | Root Directory   | `backend`                      |
   | Runtime          | `Python 3`                     |
   | Build Command    | `pip install -r requirements.txt` |
   | Start Command    | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
4. Under **Environment**, add all variables from `backend/.env.example` with real values.
5. Set `ALLOWED_ORIGINS` to your Vercel frontend URL (fill in after frontend is deployed).
6. Click **Deploy**. Note the service URL (e.g. `https://your-app.onrender.com`).

---

## 3 — Frontend Deployment (Vercel)

1. Go to [vercel.com](https://vercel.com) → **Add New Project**.
2. Import your GitHub repository.
3. Configure the project:
   | Setting       | Value        |
   |---------------|--------------|
   | Framework     | Vite         |
   | Root Directory| `frontend`   |
   | Build Command | `npm run build` |
   | Output Dir    | `dist`       |
4. Under **Environment Variables**, add all variables from `frontend/.env.example` with real values.
   - Set `VITE_API_BASE_URL` to your Render backend URL.
5. Click **Deploy**.

---

## 4 — Post-Deployment Checklist

- [ ] Visit the Vercel URL — the app should load.
- [ ] Test sign-up / login via Supabase Auth.
- [ ] Generate a sample itinerary end-to-end.
- [ ] Go back to Render → update `ALLOWED_ORIGINS` with the exact Vercel URL.
- [ ] Enable Supabase **Email Confirmations** in Auth settings for production.

---

## Local vs Production Environment Variables

| Variable                   | Local value              | Production value                  |
|----------------------------|--------------------------|-----------------------------------|
| `VITE_API_BASE_URL`        | `http://localhost:8000`  | `https://your-app.onrender.com`   |
| `ALLOWED_ORIGINS`          | `http://localhost:5173`  | `https://your-app.vercel.app`     |
| `SUPABASE_URL`             | Same in both             | Same in both                      |
| `GROQ_API_KEY`             | Same in both             | Same in both                      |

---

> **Tip:** Both Vercel and Render redeploy automatically when you push to the `main` branch on GitHub.

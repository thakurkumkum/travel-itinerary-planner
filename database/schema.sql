-- ============================================================
-- Personalized Travel Itinerary Planner — Database Schema
-- Platform: Supabase (PostgreSQL)
-- ============================================================
-- NOTE: Run this file inside the Supabase SQL editor to
--       initialize your project's tables.
-- ============================================================

-- Users are managed by Supabase Auth; this table stores
-- extra profile data linked to auth.users.
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Stores each generated travel itinerary.
CREATE TABLE IF NOT EXISTS itineraries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  destination  TEXT NOT NULL,
  start_date   DATE,
  end_date     DATE,
  preferences  JSONB,         -- budget, travel style, interests, etc.
  content      JSONB,         -- AI-generated day-by-day plan
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Row Level Security ──────────────────────────────────────
ALTER TABLE profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;

-- Profiles: each user can only read/write their own row.
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Itineraries: each user can only access their own records.
CREATE POLICY "Users can view their own itineraries"
  ON itineraries FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own itineraries"
  ON itineraries FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own itineraries"
  ON itineraries FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own itineraries"
  ON itineraries FOR DELETE USING (auth.uid() = user_id);

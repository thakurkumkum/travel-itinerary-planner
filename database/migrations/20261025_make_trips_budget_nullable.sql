-- ============================================================
-- Migration: Make public.trips.budget column nullable
-- Date: 2026-10-25
-- Purpose:
--   VoyagePlan natively uses budget categories ('budget', 'moderate',
--   'premium', 'luxury') stored inside preferences (JSONB).
--   The numeric column public.trips.budget previously had a NOT NULL
--   constraint, preventing category-only itineraries from saving.
--   This migration allows NULL for public.trips.budget while preserving
--   numeric amount storage if a numerical budget is explicitly provided.
-- ============================================================

-- 1. Remove NOT NULL constraint on public.trips.budget
ALTER TABLE public.trips ALTER COLUMN budget DROP NOT NULL;

-- 2. Ensure default value is NULL
ALTER TABLE public.trips ALTER COLUMN budget SET DEFAULT NULL;

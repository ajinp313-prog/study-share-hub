-- Execute this script in your Supabase Dashboard SQL Editor to allow semester tracking.

ALTER TABLE public.papers ADD COLUMN IF NOT EXISTS semester INTEGER;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS semester INTEGER;

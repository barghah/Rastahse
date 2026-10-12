-- -----------------------------------------------------------------------------
-- Rastahse — delivery_settings table
-- Run in Supabase SQL Editor
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.delivery_settings (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed with default dispatch days: Sunday=0, Tuesday=2
INSERT INTO public.delivery_settings (key, value)
VALUES ('dispatch_days', '[0, 2]'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Service role has full access (bypasses RLS)
ALTER TABLE public.delivery_settings ENABLE ROW LEVEL SECURITY;

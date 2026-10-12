-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Admin-managed product catalog table + storage bucket
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Create db_products table for admin-added products
CREATE TABLE IF NOT EXISTS public.db_products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku         text NOT NULL UNIQUE,
  title       text NOT NULL,
  slug        text NOT NULL UNIQUE,
  category    text NOT NULL DEFAULT 'bags',
  price       integer NOT NULL DEFAULT 0,        -- stored in paise (₹ × 100)
  stock       integer NOT NULL DEFAULT 0,
  description text,
  tags        text[] NOT NULL DEFAULT '{}',
  images      jsonb NOT NULL DEFAULT '[]',       -- [{url, alt}]
  is_visible  boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz
);

-- Enable Row Level Security (admin client bypasses RLS)
ALTER TABLE public.db_products ENABLE ROW LEVEL SECURITY;

-- Public read access (storefront can read visible products)
CREATE POLICY "Public can read visible db_products"
  ON public.db_products
  FOR SELECT
  USING (is_visible = true);

-- 2. Create product-images Storage Bucket
-- Run this via Supabase Dashboard → Storage → New Bucket, OR via the API.
-- The bucket should be named: product-images
-- Make it PUBLIC so images can be served directly.

-- If using SQL (Supabase Storage extension):
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read policy for the bucket
CREATE POLICY "Public read access for product-images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'product-images');

-- Service role (admin) can upload
CREATE POLICY "Service role can upload product images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Service role can update product images"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'product-images');

CREATE POLICY "Service role can delete product images"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'product-images');

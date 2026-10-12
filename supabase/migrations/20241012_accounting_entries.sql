-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Simple double-entry accounting ledger
-- Paste the SQL below (NOT the file path) into Supabase → SQL Editor → Run.
-- Amounts are stored in RUPEES (numeric), unlike orders/db_products (paise).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.accounting_entries (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  type         text NOT NULL CHECK (type IN ('debit', 'credit')),
  category     text NOT NULL CHECK (category IN (
                 'inventory_purchase',
                 'sales_revenue',
                 'shipping_expense',
                 'vendor_payable',
                 'customer_receivable'
               )),
  amount       numeric(14, 2) NOT NULL CHECK (amount >= 0),
  reference_id text,            -- order id or product id
  notes        text
);

CREATE INDEX IF NOT EXISTS accounting_entries_created_at_idx
  ON public.accounting_entries (created_at DESC);
CREATE INDEX IF NOT EXISTS accounting_entries_reference_idx
  ON public.accounting_entries (category, reference_id);

-- Admin-only: RLS on with no policies; the service-role client bypasses RLS.
ALTER TABLE public.accounting_entries ENABLE ROW LEVEL SECURITY;

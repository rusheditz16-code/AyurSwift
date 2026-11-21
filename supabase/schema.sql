-- ==============================================================================
-- AyurSwift Supabase Schema (Hardened Production RLS)
-- Dark Store Micro-Fulfillment for Ayurvedic & Primary OTC
-- ==============================================================================
-- IMPORTANT: Run this script in Supabase Dashboard -> SQL Editor to lock down
-- your live database and remove open demo policies.
-- ==============================================================================

-- 1. Products & Dark Store Inventory
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL,
  manufacturer TEXT DEFAULT '',
  form TEXT DEFAULT 'Tablet',
  pack_size TEXT NOT NULL,
  agency_cost_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  mrp NUMERIC(10,2) NOT NULL DEFAULT 0,
  selling_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  is_live BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  indications TEXT,
  dosage TEXT,
  composition TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Storefront query index (strictly only in-stock and live items)
CREATE INDEX IF NOT EXISTS idx_products_storefront ON products (is_live, stock_quantity)
  WHERE is_live = true AND stock_quantity > 0;

-- 2. Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY, -- Random unpredictable ID e.g. '#AS-7K4M9X2P'
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_type TEXT NOT NULL, -- 'RAPIDO_CITY' or 'COURIER_OUTSIDE'
  delivery_address TEXT NOT NULL,
  landmark TEXT,
  city TEXT NOT NULL,
  pincode TEXT NOT NULL,
  items JSONB NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL, -- 'COD' or 'UPI'
  payment_status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING' or 'VERIFIED'
  order_status TEXT NOT NULL DEFAULT 'NEW', -- 'NEW', 'PACKED', 'DISPATCHED', 'DELIVERED', 'CANCELLED'
  rapido_copied BOOLEAN DEFAULT false,
  utr_number TEXT,
  courier_tracking TEXT,
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Idempotent column migrations for existing databases
ALTER TABLE orders ADD COLUMN IF NOT EXISTS utr_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_tracking TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_note TEXT;

-- 3. Shared Rate Limits Table (Server-only via service_role)
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  reset_at TIMESTAMPTZ NOT NULL
);

-- 4. Server-Only Admin Credentials & Reset OTPs (service_role ONLY)
CREATE TABLE IF NOT EXISTS admin_credentials (
  id TEXT PRIMARY KEY DEFAULT 'primary',
  admin_emails TEXT[] NOT NULL,
  pin_hash TEXT NOT NULL,
  token_version INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_otps (
  id TEXT PRIMARY KEY,
  purpose TEXT NOT NULL, -- 'PIN' | 'EMAIL' | 'BOTH'
  otp_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Row Level Security (RLS) — LOCKED DOWN
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_otps ENABLE ROW LEVEL SECURITY;

-- Drop any legacy open/demo policies immediately
DROP POLICY IF EXISTS "Full access with anon for demo" ON products;
DROP POLICY IF EXISTS "Full access with anon for demo orders" ON orders;
DROP POLICY IF EXISTS "Public can place orders" ON orders;
DROP POLICY IF EXISTS "Public can view live in-stock products" ON products;

-- Revoke excessive default grants from anon/authenticated roles
REVOKE ALL ON TABLE orders FROM anon, authenticated;
REVOKE ALL ON TABLE rate_limits FROM anon, authenticated;
REVOKE ALL ON TABLE admin_credentials FROM anon, authenticated;
REVOKE ALL ON TABLE admin_otps FROM anon, authenticated;
REVOKE ALL ON TABLE products FROM anon, authenticated;

-- Column-level SELECT grant only: hides wholesale agency_cost_price and raw stock_quantity from public anon queries
GRANT SELECT (
  id, name, brand, category, manufacturer, form, pack_size,
  mrp, selling_price, is_live, image_url, images,
  indications, dosage, composition
) ON TABLE products TO anon, authenticated;

-- Allow public read-only access ONLY to live, in-stock products
-- Note: All order reads/writes, admin inventory writes, and rate limiting run
-- exclusively on the Next.js server using SUPABASE_SERVICE_ROLE_KEY.
CREATE POLICY "Public can view live in-stock products" ON products
  FOR SELECT TO anon, authenticated
  USING (is_live = true AND stock_quantity > 0);

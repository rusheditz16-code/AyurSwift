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
  safety_advice TEXT,
  badge_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS safety_advice TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS badge_text TEXT;

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

-- All storefront and admin requests flow exclusively through Next.js API routes authenticated via private.is_ayurswift_server()
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE products TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE orders TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE rate_limits TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE admin_credentials TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE admin_otps TO anon, authenticated;

-- 6. Server-Only HMAC Verification Bridge (in non-exposed `private` schema)
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO anon, authenticated;

CREATE TABLE IF NOT EXISTS private.server_secrets (
  id TEXT PRIMARY KEY DEFAULT 'primary',
  key_hash TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION private.is_ayurswift_server()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public
AS $$
DECLARE
  hdr_token TEXT;
  computed_hash TEXT;
  expected_hash TEXT;
BEGIN
  BEGIN
    hdr_token := coalesce(current_setting('request.headers', true)::json->>'x-ayurswift-server-key', '');
  EXCEPTION WHEN OTHERS THEN
    RETURN false;
  END;

  IF hdr_token = '' OR length(hdr_token) < 32 THEN
    RETURN false;
  END IF;

  computed_hash := encode(sha256(convert_to(hdr_token, 'UTF8')), 'hex');

  SELECT key_hash INTO expected_hash
  FROM private.server_secrets
  WHERE id = 'primary'
  LIMIT 1;

  IF expected_hash IS NULL THEN
    RETURN false;
  END IF;

  RETURN computed_hash = expected_hash;
END;
$$;

GRANT EXECUTE ON FUNCTION private.is_ayurswift_server() TO anon, authenticated;

CREATE POLICY "Server full access products" ON products
  FOR ALL TO anon, authenticated
  USING (private.is_ayurswift_server())
  WITH CHECK (private.is_ayurswift_server());

CREATE POLICY "Server full access orders" ON orders
  FOR ALL TO anon, authenticated
  USING (private.is_ayurswift_server())
  WITH CHECK (private.is_ayurswift_server());

CREATE POLICY "Server full access rate_limits" ON rate_limits
  FOR ALL TO anon, authenticated
  USING (private.is_ayurswift_server())
  WITH CHECK (private.is_ayurswift_server());

CREATE POLICY "Server full access admin_credentials" ON admin_credentials
  FOR ALL TO anon, authenticated
  USING (private.is_ayurswift_server())
  WITH CHECK (private.is_ayurswift_server());

CREATE POLICY "Server full access admin_otps" ON admin_otps
  FOR ALL TO anon, authenticated
  USING (private.is_ayurswift_server())
  WITH CHECK (private.is_ayurswift_server());

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
ALTER TABLE products ADD COLUMN IF NOT EXISTS hsn_code TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS gst_rate NUMERIC(5,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS batch_no TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS expiry_date TEXT;

-- Storefront query indexes
CREATE INDEX IF NOT EXISTS idx_products_storefront ON products (is_live, stock_quantity)
  WHERE is_live = true AND stock_quantity > 0;
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON products (updated_at DESC);

-- 1b. Content-Addressed Product Images (offloads base64 blobs from catalog JSON for Vercel Edge CDN)
CREATE TABLE IF NOT EXISTS product_images (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  data_b64 TEXT NOT NULL,
  byte_size INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images (product_id);

-- 2. Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY, -- Random unpredictable ID e.g. '#AS-7K4M9X2P'
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_type TEXT NOT NULL, -- 'RAPIDO_CITY' or 'COURIER_OUTSIDE'
  delivery_slot TEXT, -- e.g. '22 Nov 2026 • 9:00 AM – 10:00 AM'
  slot_rescheduled_count INTEGER NOT NULL DEFAULT 0,
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
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_slot TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS slot_rescheduled_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS utr_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_tracking TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_note TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_invoice_number ON orders (invoice_number)
  WHERE invoice_number IS NOT NULL;

-- High-scale order lookup & Option A unpaid-slot sweeper indexes
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders (customer_phone, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_unpaid_active ON orders (created_at DESC)
  WHERE order_status = 'NEW' AND payment_status = 'PENDING' AND delivery_type = 'RAPIDO_CITY' AND payment_method = 'UPI' AND utr_number IS NULL;

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

-- 4b. Zero-Fee FamApp / Android Notification UPI Credits Ledger
CREATE TABLE IF NOT EXISTS upi_webhook_credits (
  txn_id TEXT PRIMARY KEY,
  amount NUMERIC(10,2) NOT NULL,
  sender_name TEXT DEFAULT '',
  order_id_hint TEXT,
  matched_order_id TEXT,
  raw_summary TEXT DEFAULT '',
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_upi_webhook_credits_unmatched
  ON upi_webhook_credits (amount, received_at DESC)
  WHERE matched_order_id IS NULL;

-- 4c. Server-Persisted Merchant & Dual Legal Billing Settings + Atomic Invoice Sequence
CREATE TABLE IF NOT EXISTS store_settings (
  id TEXT PRIMARY KEY DEFAULT 'primary',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE store_settings TO anon, authenticated;

CREATE SEQUENCE IF NOT EXISTS public.ayurswift_invoice_seq START WITH 1 INCREMENT BY 1;
GRANT USAGE, SELECT ON SEQUENCE public.ayurswift_invoice_seq TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.next_invoice_number(p_created_at timestamptz DEFAULT now())
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private', 'pg_temp'
AS $function$
DECLARE
  v_ist TIMESTAMP;
  v_year INTEGER;
  v_month INTEGER;
  v_fy_start INTEGER;
  v_fy_end INTEGER;
  v_seq BIGINT;
BEGIN
  IF NOT private.is_ayurswift_server() THEN
    RAISE EXCEPTION 'Forbidden: server authorization required';
  END IF;

  v_ist := (COALESCE(p_created_at, now()) AT TIME ZONE 'Asia/Kolkata');
  v_year := EXTRACT(YEAR FROM v_ist)::INTEGER;
  v_month := EXTRACT(MONTH FROM v_ist)::INTEGER;

  IF v_month >= 4 THEN
    v_fy_start := v_year % 100;
  ELSE
    v_fy_start := (v_year - 1) % 100;
  END IF;
  v_fy_end := (v_fy_start + 1) % 100;

  v_seq := nextval('public.ayurswift_invoice_seq');

  RETURN format(
    'AS/%s-%s/%s',
    lpad(v_fy_start::text, 2, '0'),
    lpad(v_fy_end::text, 2, '0'),
    lpad(v_seq::text, 4, '0')
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.next_invoice_number(timestamptz) TO anon, authenticated;

-- 5. Row Level Security (RLS) — LOCKED DOWN
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
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
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE product_images TO anon, authenticated;
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

CREATE POLICY "Server full access product_images" ON product_images
  FOR ALL TO anon, authenticated
  USING (private.is_ayurswift_server())
  WITH CHECK (private.is_ayurswift_server());

CREATE POLICY "Server full access store_settings" ON store_settings
  FOR ALL TO anon, authenticated
  USING (private.is_ayurswift_server())
  WITH CHECK (private.is_ayurswift_server());

-- 7. Atomic Concurrency-Safe Stock RPCs (FOR UPDATE deterministic row locking — zero overselling)
CREATE OR REPLACE FUNCTION public.reserve_order_stock(p_items jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private', 'pg_temp'
AS $function$
DECLARE
  v_item RECORD;
  v_prod RECORD;
  v_verified JSONB := '[]'::jsonb;
  v_now TIMESTAMPTZ := now();
BEGIN
  IF NOT private.is_ayurswift_server() THEN
    RAISE EXCEPTION 'Forbidden: server authorization required';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Order must contain at least one item.');
  END IF;

  FOR v_item IN
    SELECT
      (elem->>'productId')::TEXT AS product_id,
      SUM((elem->>'quantity')::INTEGER)::INTEGER AS qty
    FROM jsonb_array_elements(p_items) AS elem
    GROUP BY elem->>'productId'
    ORDER BY elem->>'productId'
  LOOP
    IF v_item.product_id IS NULL OR v_item.qty IS NULL OR v_item.qty < 1 OR v_item.qty > 20 THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Each item must have an integer quantity between 1 and 20.');
    END IF;

    SELECT id, name, brand, pack_size, mrp, selling_price, stock_quantity, is_live,
           hsn_code, gst_rate, batch_no, expiry_date
      INTO v_prod
      FROM public.products
      WHERE id = v_item.product_id
      FOR UPDATE;

    IF NOT FOUND OR NOT v_prod.is_live OR v_prod.stock_quantity <= 0 THEN
      RETURN jsonb_build_object('ok', false, 'error', 'One or more requested items are currently unavailable.');
    END IF;

    IF v_prod.stock_quantity < v_item.qty THEN
      RETURN jsonb_build_object(
        'ok', false,
        'error', format('Only %s unit(s) left for %s.', v_prod.stock_quantity, v_prod.name)
      );
    END IF;

    v_verified := v_verified || jsonb_build_array(
      jsonb_build_object(
        'productId', v_prod.id,
        'name', v_prod.name,
        'brand', v_prod.brand,
        'packSize', v_prod.pack_size,
        'quantity', v_item.qty,
        'mrp', v_prod.mrp,
        'unitPrice', v_prod.selling_price,
        'totalPrice', round((v_prod.selling_price * v_item.qty)::numeric, 2),
        'hsnCode', v_prod.hsn_code,
        'gstRate', v_prod.gst_rate,
        'batchNo', v_prod.batch_no,
        'expiryDate', v_prod.expiry_date
      )
    );
  END LOOP;

  FOR v_item IN
    SELECT
      (elem->>'productId')::TEXT AS product_id,
      (elem->>'quantity')::INTEGER AS qty
    FROM jsonb_array_elements(v_verified) AS elem
    ORDER BY elem->>'productId'
  LOOP
    UPDATE public.products
       SET stock_quantity = stock_quantity - v_item.qty,
           is_live = CASE WHEN (stock_quantity - v_item.qty) > 0 THEN is_live ELSE false END,
           updated_at = v_now
     WHERE id = v_item.product_id;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'items', v_verified);
END;
$function$;

CREATE OR REPLACE FUNCTION public.restore_order_stock(p_items jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private', 'pg_temp'
AS $function$
DECLARE
  v_item RECORD;
  v_now TIMESTAMPTZ := now();
BEGIN
  IF NOT private.is_ayurswift_server() THEN
    RAISE EXCEPTION 'Forbidden: server authorization required';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
    RETURN jsonb_build_object('ok', true);
  END IF;

  FOR v_item IN
    SELECT
      (elem->>'productId')::TEXT AS product_id,
      SUM((elem->>'quantity')::INTEGER)::INTEGER AS qty
    FROM jsonb_array_elements(p_items) AS elem
    GROUP BY elem->>'productId'
    ORDER BY elem->>'productId'
  LOOP
    IF v_item.product_id IS NOT NULL AND v_item.qty IS NOT NULL AND v_item.qty > 0 THEN
      UPDATE public.products
         SET stock_quantity = stock_quantity + v_item.qty,
             is_live = CASE WHEN stock_quantity = 0 THEN true ELSE is_live END,
             updated_at = v_now
       WHERE id = v_item.product_id;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('ok', true);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.reserve_order_stock(jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.restore_order_stock(jsonb) TO anon, authenticated;

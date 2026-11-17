-- ==============================================================================
-- AyurSwift 🌿⚡ Supabase Schema (100% Free Tier)
-- Dark Store Micro-Fulfillment for Ayurvedic & Primary OTC
-- ==============================================================================

-- 1. Products & Dark Store Inventory
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL,
  pack_size TEXT NOT NULL,
  agency_cost_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  mrp NUMERIC(10,2) NOT NULL DEFAULT 0,
  selling_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  is_live BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
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
  id TEXT PRIMARY KEY, -- e.g. '#AS-1001'
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_type TEXT NOT NULL, -- 'RAPIDO_CITY' or 'COURIER_OUTSIDE'
  delivery_address TEXT NOT NULL,
  landmark TEXT,
  city TEXT NOT NULL,
  pincode TEXT NOT NULL,
  items JSONB NOT NULL, -- [{productId, name, brand, packSize, quantity, unitPrice, totalPrice}]
  subtotal NUMERIC(10,2) NOT NULL,
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL, -- 'COD' or 'UPI'
  payment_status TEXT NOT NULL DEFAULT 'PENDING',
  order_status TEXT NOT NULL DEFAULT 'NEW', -- 'NEW', 'PACKED', 'DISPATCHED', 'DELIVERED', 'CANCELLED'
  rapido_copied BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Allow public read access to live, in-stock products
CREATE POLICY "Public can view live in-stock products" ON products
  FOR SELECT USING (is_live = true AND stock_quantity > 0);

-- Allow public to insert orders from the storefront
CREATE POLICY "Public can place orders" ON orders
  FOR INSERT WITH CHECK (true);

-- Allow merchant full access
CREATE POLICY "Full access with anon for demo" ON products
  FOR ALL USING (true);

CREATE POLICY "Full access with anon for demo orders" ON orders
  FOR ALL USING (true);

# 🌿⚡ AyurSwift

> **Genuine Ayurveda & Primary Health, Delivered Swiftly.**
> Target Domain: `ayurswift.in` | Hosted on Vercel (100% Free Tier) | Direct UPI Zero Fees

---

## 🎯 Concept & Business Model
AyurSwift is a home-based micro-fulfillment "dark store" for fast-moving Ayurvedic and primary OTC medicines:
- **Procurement:** Wholesale agency contacts with GST billing, stocked safely at home.
- **Acquisition Engine:** QR flyers inserted into the 800–1,000 carry bags given out daily at the retail pharmacy.
- **Logistics Architecture:**
  - **In-City Rapid Delivery (30–45 mins):** Dispatched via **Rapido Parcel** bike rider directly from home. ₹35 (Free above ₹499). COD or UPI.
  - **Outside-City Delivery (2–4 days):** Dispatched via **Courier** (DTDC / Speed Post / Delhivery). **100% Prepaid via UPI only** (No COD to prevent return transit losses).
  - **Store Pickup Removed:** Deliberately omitted to prevent queue confusion and counter congestion at the retail shop.

---

## 🚀 Key Features

### 1. Customer Storefront (`/`)
- **"Ayur-Quick Commerce" Hybrid UX:** Combines the blazing ergonomics of Zepto/Blinkit (instant `+ ADD` steppers, sticky bottom cart bar) with the clinical trust of Tata 1mg/Apollo (Health Concern grouping, indications, pack sizes).
- **Strict Availability Guarantee:** Customers **ONLY** see items currently in stock at home (`stockQuantity > 0 && isLive`). Zero out-of-stock clutter.
- **1-Click WhatsApp Ordering:** Generates a unique order ID (`#AS-1001`), pre-fills customer address, items, and total, and opens WhatsApp immediately.
- **Dynamic Zero-Fee UPI QR Code:** Generates universal scannable Bharat QR codes with exact order amount and order reference, plus 1-tap mobile intent (`GPay`, `PhonePe`, `Paytm`).

### 2. Personal Admin Dashboard (`/admin`)
- **PIN Protected:** Default PIN `1234` (configurable).
- **Profit & Margin Calculator:** Real-time tracking of Agency Cost Price, MRP, and Selling Price with profit in ₹ and % margin.
- **Inventory Management:** Instant stock stepper (`+` / `-`), visibility toggle `[🟢 Live]` vs `[⚪ Hidden]`, and automatic auto-hide when stock reaches `0`.
- **Rapido Dispatch Tool:**
  - Incoming order feed with status management.
  - **"1-Click Copy for Rapido" button:** Copies customer name, phone number, and drop address in 1 tap to paste directly into the Rapido app.
- **Zero Running Cost:** Designed for Vercel Free Tier + Supabase Free Tier + Direct UPI QR (₹0 monthly software fees).

---

## 🛠️ Tech Stack
- **Framework:** Next.js 16 (React 19, App Router)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Database:** Supabase (PostgreSQL with RLS) + persistent offline localStorage fallback
- **Hosting:** Vercel

---

## 💻 Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) for the storefront and [http://localhost:3000/admin](http://localhost:3000/admin) for the merchant hub.

3. Build for production:
   ```bash
   npm run build
   ```

---

## 🗄️ Supabase Setup (Optional - Zero Config Needed for Local)
AyurSwift runs out-of-the-box with persistent local storage. To connect your cloud PostgreSQL database:
1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** and run the contents of [`supabase/schema.sql`](file:///d:/pharmacy%20store/supabase/schema.sql).
3. Add your credentials in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

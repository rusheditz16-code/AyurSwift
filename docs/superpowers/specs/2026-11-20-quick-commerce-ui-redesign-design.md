# AyurSwift Quick-Commerce UI/UX Redesign (Approach A: Blinkit × Tata 1mg)

**Date:** 2026-11-20  
**Status:** Draft (Pending Review & Approval)  
**Scope:** Full visual and interactive UX redesign of the Customer Storefront (`/`) and Admin Dark-Store Console (`/admin`) in `d:\pharmacy store`.

---

## 1. Intent & Why

AyurSwift is a hyperlocal Ayurvedic & OTC micro-fulfillment dark store ("Tradition Meets Speed") serving Bhavnagar via 30–45 minute Rapido bike dispatch and pan-India via prepaid tracked courier.

Today, both the storefront (`src/app/page.tsx` + 14 components) and the admin portal (`src/components/admin/AdminDashboard.tsx`, a 2,273-line monolith) share a muted cream/sage (`#f8f8f3` / `#e9efdf`) brochure layout with Georgia serif typography, raw emoji category tiles, an old-school desktop left radio filter sidebar, and a basic 3-tab admin header.

This redesign transforms AyurSwift into a **high-speed, modern Indian quick-commerce application** modeled on the ergonomics of **Blinkit / Swiggy Instamart** and the clinical trustworthiness of **Tata 1mg**:
- **Customers** get instant delivery clarity ("Delivery in 30 mins"), zero-friction product discovery (rotating live search with direct `+ ADD`, horizontal quick-commerce shelves, sticky filter pills, dense responsive product cards), impulse checkout upsells, and tactile spring micro-interactions.
- **The Store Owner** gets a fast, modular dark-store operations console with a collapsible sidebar, executive overview & 7-day interactive revenue chart, a dual Kanban + Day-by-Day dispatch desk for packing and Rapido booking, fast low-stock restock controls, a slide-over SKU editor with live profit preview, and a Light/Dark workspace toggle.

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals
- Completely replace the cream/sage/Georgia-serif visual identity across both `/` and `/admin` with a crisp, high-contrast quick-commerce design system (`#FFFFFF` / `#F5F7FA` surfaces, `#0C831F` quick-commerce emerald, `#F59E0B` warm saffron accents, `Plus Jakarta Sans` with `tabular-nums` pricing).
- Deliver genuine quick-commerce interaction patterns: animated rotating search placeholders, instant search dropdown with direct `+ ADD` buttons, horizontal category & curated product rails, sticky filter pill bar, morphing `ADD` ↔ `- 1 +` steppers, free-delivery progress tracker, and "Before You Checkout" add-on strip in the cart drawer.
- Add smooth, spring-physics micro-interactions using `framer-motion` (wrapped in `<MotionConfig reducedMotion="user">`).
- Refactor `AdminDashboard.tsx` (2,273 lines) into clean, maintainable modular components under `src/components/admin/`.
- Introduce an **Overview** dashboard tab with interactive charts and low-stock restock queues, plus a **Kanban Pipeline View** (`NEW → PACKED → DISPATCHED → DELIVERED`) alongside the existing Day-by-Day order view.
- Add an Admin-only **Light / Dark mode toggle** persisted in `localStorage`.

### Non-Goals
- No changes to database schema (`supabase/schema.sql`), API contracts (`/api/orders`), authentication credentials/rules, or pricing/tax calculation formulas (`src/lib/billing.ts`).
- No new payment gateway integrations (direct zero-fee UPI QR + mobile UPI intent + COD rules stay identical).
- No customer login/account database system (customer orders continue to sync via `localStorage` + `/api/orders` cross-device lookup).
- No dark mode on the customer storefront (storefront stays crisp light clinical-quick-commerce for maximum legibility and pharmacy trust).

### Anti-Goals (Failure Modes to Avoid)
- **Breaking print outputs:** A4 tax invoices and 80mm thermal POS receipts (`InvoiceModal.tsx` & `@media print` in `globals.css`) must continue printing cleanly in black-on-white regardless of Admin dark mode or UI restyling.
- **Losing existing functionality:** Every working feature — Supabase + `localStorage` fallback, 10s live order polling + Web Audio chime, dual-factor Gmail+PIN login with 5-attempt 30s lockout, 1-click Rapido copy, WhatsApp order confirmation & customer alert, outside-city prepaid-UPI-only enforcement, multi-image SKU upload/cover-pinning, CSV export, and catalog reset — must remain 100% functional.
- **Showing out-of-stock items to customers:** Storefront strict availability guarantee (`isLive && stockQuantity > 0`) must never be violated, including in search results, shelves, and cart upsells.
- **Over-animating at the cost of speed:** Animations must feel snappy (150–250ms springs) and never block rapid tapping of `+`/`-` steppers or admin order status buttons.

---

## 3. Technical Constraints

- **Stack:** Next.js `16.4.6` (App Router, `cacheComponents: true`, `partialPrefetching: true`), React `19.3.0`, TypeScript 5, Tailwind CSS v4 (`@tailwindcss/postcss` / `@tailwindcss/turbopack`), `lucide-react`, `@supabase/supabase-js`.
- **New Dependency:** Add `framer-motion` for app-grade modal/drawer spring transitions, `AnimatePresence`, cart badge bounce, and shared-element tab pills. No heavy chart library needed — build clean interactive SVG/CSS charts directly to keep bundle size lean and fully styled to theme tokens.
- **Fonts:** Load `Plus Jakarta Sans` via `next/font/google` in `src/app/layout.tsx` (CSS variable `--font-sans` mapped in `@theme inline` in `globals.css`, with system geometric sans fallback). Retire Georgia `.font-serif` usage across all redesigned screens.
- **Build Command:** `npm run build` uses `next build --webpack`. Must pass TypeScript + production build and `npm run lint` with zero errors.
- **Preserved Storage Keys & Contracts:**
  - `localStorage`: `ayurswift_products_v3`, `ayurswift_orders_v1`, `ayurswift_settings_v2`, `ayurswift_saved_address`
  - `sessionStorage`: `ayurswift_cart`, `ayurswift_location`, `ayurswift_admin_session`, `ayurswift_admin_email`
  - New `localStorage` key: `ayurswift_admin_theme` (`'light' | 'dark'`, defaults to `'light'`)
  - `/api/orders` headers (`x-ayurswift-admin-key`, `x-admin-role`) untouched.

---

## 4. Approaches Considered

| Approach | Summary | Trade-offs |
|---|---|---|
| **Approach A: Blinkit × Tata 1mg "Speed & Clinical Trust" (Selected)** | Pure white/slate storefront with `#0C831F` emerald, Blinkit-style ETA top bar, horizontal shelves, sticky filter pills, dense 2–5 col cards, spring cart upsells + modular Admin Console with sidebar, Overview analytics, Kanban + Day-by-Day dispatch, and Light/Dark toggle. | Larger refactor across all storefront & admin files, but achieves true Indian quick-commerce muscle memory plus clinical pharmacy trust and real dark-store ops speed. |
| **Approach B: Zepto "Vibrant Gradient & Dark Command"** | Deep emerald-to-teal gradient storefront header, carousel-heavy hero, dark-first obsidian Admin console. | Higher visual flash, but bold gradients and dark-only admin feel less clinical for everyday medicine buyers and daytime pharmacy lighting. |
| **Approach C: Visual Refresh Only** | Restyle colors, fonts, and shadows while keeping the current left radio sidebar, flat storefront grid, and 3-tab AdminDashboard. | Fastest and lowest risk, but still feels like a traditional brochure website rather than a big quick-commerce app. |

**Selected:** **Approach A** (approved by user).

---

## 5. Design System & Visual Tokens

### Palette
- **Storefront (Crisp Light):**
  - Page canvas: `#F5F7FA` (soft cool gray)
  - Elevated cards / header / drawers: `#FFFFFF`
  - Primary Brand Emerald: `#0C831F` (hover `#096B19`, soft tint `#ECFDF3`, border tint `#BBF7D0`)
  - Express / Discount Accent (Saffron/Amber): `#F59E0B` / `#D97706` (soft tint `#FEF3C7`)
  - Primary Text: `#111827` (Slate/Gray 900)
  - Secondary Text: `#4B5563` / `#6B7280`
  - Subtle Dividers & Borders: `#E5E7EB` / `#EEF2F6`
  - Semantic Status: Success `#16A34A`, Warning `#D97706`, Danger `#DC2626`, Info `#2563EB`
- **Admin Console (Scoped Light & Dark Mode):**
  - **Light mode (default):** Slate-50 canvas (`#F8FAFC`), White cards (`#FFFFFF`), Slate-200 borders (`#E2E8F0`), Emerald `#0C831F` primary actions.
  - **Dark mode (`.admin-dark` scope on admin root wrapper):** Slate-950 canvas (`#090D16`), Slate-900 cards/sidebar (`#111827`), Slate-800 elevated inputs (`#1F2937`), Slate-800 borders (`#1E293B`), bright Emerald-500 (`#10B981`) highlights, crisp `#F8FAFC` / `#94A3B8` text.
  - Scoped strictly inside `/admin` so Storefront and `@media print` are completely isolated.

### Typography & Numerals
- Primary Font: `Plus Jakarta Sans` (weights 400, 500, 600, 700, 800) via `next/font/google`.
- Monospace (Order IDs, UPI VPAs, Pincodes): `ui-monospace, SFMono-Regular, Menlo, monospace`.
- All currency amounts, counts, discounts, and KPIs use `tabular-nums` so counters and totals never jitter during live stepper taps.

### Surfaces, Radius & Motion
- Cards: `rounded-2xl` (16px) with `1px solid #E5E7EB`, subtle elevation on hover (`shadow-md` + `border-emerald-500/40`).
- Buttons & Steppers: `rounded-xl` (12px) with crisp press feedback (`whileTap={{ scale: 0.96 }}`).
- Modals/Drawers: Backdrop `bg-slate-950/50 backdrop-blur-xs`; desktop dialogs scale+fade in (`0.96 → 1`), right drawers slide smoothly (`x: '100%' → 0`), mobile modals anchor cleanly as bottom sheets with grab-handle aesthetics where appropriate.
- Global `<MotionConfig reducedMotion="user">` wrapper at app root.

---

## 6. Customer Storefront Architecture (`/`)

### 6.1 App-Grade Sticky Top Header (`src/components/Header.tsx`)
Single crisp white sticky bar (`border-b border-gray-200/80 bg-white/95 backdrop-blur-md`) with clear Blinkit-inspired hierarchy:
1. **Brand Mark:** `/ayurswift-logo.png` cleanly sized on left (clicking resets filters & scrolls top).
2. **Delivery ETA & Location Trigger (Blinkit Hero Anchor):**
   - Two-line clickable block:
     - Top bold line: `⚡ Delivery in 30 mins` (when `RAPIDO_CITY`) or `📦 Express Courier (2–4d)` (when `COURIER_OUTSIDE`)
     - Bottom subtle line: `{currentLocation.area} - {currentLocation.pincode} ▾`
   - Opens `LocationModal`.
3. **Interactive Live Search Bar:**
   - Full-width centered pill/rounded-xl search box (`bg-gray-100 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0C831F]/25 focus-within:border-[#0C831F]`).
   - **Rotating animated placeholder** when input is empty & unfocused (cycles smoothly every 3s through: `Search "Zandu Balm"`, `Search "Pudin Hara"`, `Search "Joint pain oil"`, `Search "Chyawanprash"`, `Search "Liv.52"`).
   - **Rich Instant Search Dropdown:**
     - Trending quick-search chips shown on focus before typing.
     - Matching Categories & Brands as clickable pills.
     - Matching In-Stock Products showing thumbnail/pack visual, name, pack size, price, discount badge, AND a **direct inline `ADD` / `- 1 +` stepper** right inside the search dropdown (so shoppers can add without leaving search!). Clicking the row opens `MedicineDetailModal`.
4. **Right Action Cluster:**
   - **Quick Buy** button (lightning icon pill, opens `QuickBuyModal`).
   - **Track / Account** button (desktop icon+label button opening `AccountModal`, giving desktop users easy access to order tracking & reorder alongside mobile bottom nav).
   - **Live Green Cart Button:** When empty: crisp outlined `"My Cart"`; when populated: solid `#0C831F` pill showing animated item count (`2 items`) + total (`₹340`) with spring pop on item add.
5. **Mobile Search Row:** On `< md`, clean full-width search bar sits neatly beneath the compact top row (Brand/ETA + Account/Cart).

### 6.2 Merchandising Home View (When No Search/Filter Is Active)
Replaces the old editorial SVG banner and desktop left sidebar with fast, scannable quick-commerce blocks:
1. **Compact Quick-Commerce Hero Bento Grid (3-card responsive row):**
   - **Primary Promo Card (2 cols on desktop):** Rich emerald gradient card (`from-[#0A6B19] via-[#0C831F] to-[#15803D]`) with crisp typography: *"Authentic Ayurveda in 30 Minutes"*, dynamic location promise (`Free delivery above ₹499 in Bhavnagar`), primary CTA `"Explore Fast Relief"` + secondary `"Quick Buy List"`. Clean geometric/icon badge accent (no dated clip-art mortar SVG).
   - **Right Stacked/Twin Trust Mini-Cards (1 col on desktop, 2-col strip on mobile):**
     - *Direct UPI Zero Fees* (Instant Bharat QR • COD available locally)
     - *100% Genuine Stock* (Dabur, Zandu, Himalaya, Baidyanath — live home dark-store stock)
2. **Shop by Health Concern — Visual Category Strip:**
   - Clean horizontal scrollable strip on mobile / 6-column crisp grid on desktop covering all **6** categories (`Joint & Muscle Pain`, `Digestion & Acidity`, `Immunity & Cold`, `Skin & Hair`, `Daily Wellness`, `Liver & Detox`) plus `All Remedies`.
   - Uses crisp themed Lucide icon medallions inside soft pastel botanical containers (replacing raw emojis `🦵🍃🍯💆🌿`), product count badge per category, and active emerald ring + checkmark indicator.
3. **Curated Horizontal Quick-Commerce Product Shelves (`ProductShelf` component):**
   - Clean horizontal carousels with subtle left/right scroll buttons on desktop, snap-scroll on mobile, and `"See all →"` links that jump to the filtered catalog:
     - **Shelf 1: ⚡ Fast Relief in 30 Mins** (Bestsellers & Joint/Muscle Pain essentials)
     - **Shelf 2: 🏷️ Top Value Deals** (Highest discount % in-stock items)
     - **Shelf 3: 🌿 Daily Immunity & Digestion** (Digestion, Immunity & Liver care)
   - Clicking `"See all"` sets the relevant filter/sort and scrolls smoothly to the catalog section.

### 6.3 Sticky Filter Bar & Dense Catalog Grid
Replaces the heavy 256px desktop left radio-button sidebar (`<aside>`) with a modern quick-commerce filter & browse strip:
- **Sticky Filter Pill Bar** (`sticky top-[68px]` desktop):
  - Category horizontal pills (`All`, plus all live categories)
  - Brand popover/pills (`All Brands`, `Dabur`, `Zandu`, `Himalaya`, `Baidyanath`, `Dr. Ortho`, etc.)
  - Price Range quick chips (`Under ₹100`, `₹100–₹200`, `Above ₹200`)
  - Sort dropdown (`Popular`, `Price: Low → High`, `Price: High → Low`, `Biggest Discount`, `Top Rated`)
  - Mobile `"Filters"` button with active count badge opening the restyled `MobileFilterDrawer`
  - Removable active-filter chips + `"Reset all"` when any filter is active.
- **Dense Responsive Product Grid:**
  - `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4`.
  - When no filters are active, displays the complete in-stock catalog cleanly under *"All In-Stock Remedies"* with accurate item count (`Showing X in-stock medicines`).

### 6.4 Quick-Commerce `ProductCard` (`src/components/ProductCard.tsx`)
Redesigned around Blinkit's iconic high-conversion card geometry:
- **Top-left discount ribbon** (`15% OFF` in crisp blue/emerald or saffron pill) + **top-right subtle rating chip** (`★ 4.8`).
- **Clean Packshot Stage:** Square-ish `aspect-[4/3]` light neutral frame (`bg-gray-50/80 rounded-xl`) with smooth image hover zoom, multi-photo count indicator (`2 photos`), and fallback to `MedicinePackVisual`.
- **Delivery ETA Pill:** Crisp micro-pill right below image: `⚡ 30 MINS` (or `📦 2–4 DAYS` if courier location is selected).
- **Tight Typography Stack:**
  - Brand micro-label (`Zandu`)
  - 2-line bold title (`text-[13px] sm:text-sm font-bold text-gray-900 leading-snug line-clamp-2 min-h-[2.4rem]`)
  - Pack size (`25g Jar`) in crisp gray-500
- **Bottom Price + Morphing CTA Row:**
  - Left: Bold selling price (`₹75` in `tabular-nums`) + struck MRP (`₹85`) right beneath/beside.
  - Right: Iconic crisp Blinkit-style **`ADD`** button (`border border-[#0C831F] text-[#0C831F] bg-[#F2FBF4] hover:bg-[#0C831F] hover:text-white font-extrabold px-4 py-1.5 rounded-lg text-xs tracking-wide`) that morphs cleanly into a solid `#0C831F` `- 1 +` stepper with animated quantity transition and stock-cap protection.

### 6.5 Interactive Slide-Over `CartDrawer` & Checkout
- **Smooth Framer Motion slide-over drawer** (right-docked on desktop `max-w-md`, full-height on mobile).
- **Sticky Top Header:** `"My Cart"` + delivery ETA chip (`⚡ Shipment in 30 mins`) + item count + Close.
- **Free Delivery Progress Card:** Animated emerald progress bar showing exact remaining ₹ to unlock Free Local Delivery (`₹499`), celebrating with green check when unlocked.
- **Cart Item Cards:** Packshot thumbnail, title, pack size, unit price, total line price, and compact emerald `- qty +` stepper.
- **"Before You Checkout" Impulse Add-On Rail (NEW):** Horizontal mini-cards of up to 6 in-stock essentials *not currently in cart* with 1-tap `+ ADD` button — classic Blinkit/Zepto basket-builder UX.
- **Collapsible / Clean Bill Summary Card:** Items MRP total, Instant Savings pill (`You save ₹XX!`), Delivery Fee (Free badge or ₹35/₹60), Grand Total in bold tabular-nums.
- **Streamlined Checkout Form inside Drawer:**
  - Two-pill Delivery Mode toggle (`⚡ Local Rapido 30–45m` vs `📦 Outside-City Courier 2–4d`) — synced with header location by default and editable here.
  - Saved address auto-fill notice (`Saved address loaded • Edit`).
  - Clean grouped form inputs (Name, 10-digit Mobile, Street Address, Landmark, City, 6-digit Pincode) with inline validation.
  - Payment Method Cards (`📱 UPI Instant QR — Zero Fee` vs `💵 Cash on Delivery` — COD automatically disabled with clear inline explanation when Outside-City Courier is selected).
- **Sticky Bottom Checkout CTA:** Solid `#0C831F` bar showing Grand Total on left and `Place Order →` on right.

### 6.6 Upgraded Storefront Modals, Bottom Bar & Toasts
All existing modals restyled cohesively to the new crisp white + emerald + Plus Jakarta Sans system with Framer Motion transitions:
- **`MedicineDetailModal.tsx`:** Upgraded gallery with dot/thumbnail switcher, rating & verified badge, clinical accordion/cards for Indications, Dosage, Composition, Safety Advice, and sticky bottom price + `ADD`/`- qty +` bar.
- **`PaymentModal.tsx`:** Crisp confirmation header with animated check icon, order ID badge, high-contrast UPI QR card with 1-tap UPI app button + Copy UPI ID, COD confirmation card, prominent WhatsApp confirmation button, and `"View & Print Official Bill"` trigger (opening `InvoiceModal`).
- **`LocationModal.tsx`:** Fast pincode/area search with quick-select Bhavnagar area cards (showing `⚡ 30–45 mins`) and All-India Courier card (`📦 2–4 days`).
- **`QuickBuyModal.tsx`:** Fast 1-tap top essentials list with live steppers + WhatsApp custom medicine list composer.
- **`AccountModal.tsx` & `OrderTrackingModal.tsx`:** Clean visual step tracker (`New → Packed → Dispatched → Delivered`), live cross-device search by Order ID or phone, 1-click Reorder, Invoice view, and pre-packing cancel option.
- **`MobileFilterDrawer.tsx`:** Smooth slide-up bottom sheet with rounded-t-3xl grab handle and chip selectors.
- **`InvoiceModal.tsx`:** Modernized modal toolbar chrome (`A4 Tax Invoice` vs `80mm Thermal POS` segmented switcher, Print button, Close), while keeping `#printable-bill-document` and `@media print` CSS 100% preserved.
- **Floating Sticky Cart Dock (Mobile & Desktop):** Sleek floating `#0C831F` pill bar positioned cleanly above the mobile bottom navigation (`bottom-18` on mobile, `bottom-5` on desktop) showing stacked thumbnail previews of items in cart, total + savings badge, and `View Cart →`.
- **Mobile Bottom Nav:** 4 clean tabs (`Home`, `Categories`, `Orders`, `Account`) with active emerald pill indicator; `Orders` opens `OrderTrackingModal` directly for 1-tap order tracking!
- **WhatsApp Assistance Strip & Footer:** Clean white card strip for quick WhatsApp callback + sleek compact footer with subtle `Merchant Hub` lock link.

---

## 7. Admin Dark-Store Command Center (`/admin`)

### 7.1 Modular Component Architecture
Decompose the 2,273-line `src/components/admin/AdminDashboard.tsx` into focused, clean modules:
- `src/components/admin/AdminDashboard.tsx` — Root container: auth state, products/orders/settings state, 10s live polling + Web Audio new-order chime, theme state (`light`/`dark`), keyboard shortcut (`Ctrl+K` / `Cmd+K`), active tab routing, and shared `InvoiceModal`.
- `src/components/admin/AdminAuthPortal.tsx` — Modern dual-factor security portal (Authorized Gmail + 4-digit PIN, show/hide PIN, 5-attempt 30-second lockout timer, clean enterprise lock aesthetic).
- `src/components/admin/AdminSidebar.tsx` — Collapsible left navigation rail on desktop + slide-over drawer on mobile (`Overview`, `Live Dispatch` with pulsing red badge for `NEW` orders, `Inventory` with low-stock count pill, `Store Settings`, plus Back to Storefront & Logout).
- `src/components/admin/AdminTopbar.tsx` — Sticky operations header: mobile menu toggle, page title + breadcrumb, global quick-search input (`Ctrl+K` focuses/filters active view or jumps to order/SKU), Live Sync indicator pill (`Live 10s` toggle), manual Refresh button, Light/Dark theme switcher, and primary `+ Add SKU` CTA.
- `src/components/admin/AdminOverviewTab.tsx` — **NEW** Dark-Store Executive Dashboard:
  - **4 KPI Stat Cards:** Today's Revenue (with COD vs UPI split), Active Orders Queue (`New` + `Packed` pending dispatch), Total Catalog Value & Realized Margin %, Stock Health (`Live SKUs`, `Low Stock ≤5`, `Out of Stock`).
  - **Interactive 7-Day Revenue & Orders Chart:** Pure SVG/HTML responsive bar chart computing daily totals from real `orders` data, with metric toggle (`Revenue ₹` vs `Order Count`) and interactive hover/tap tooltip per day.
  - **Live Fulfillment Pipeline Strip:** Visual proportional breakdown of `NEW`, `PACKED`, `DISPATCHED`, `DELIVERED`, `CANCELLED` with click-through directly to `Dispatch` filtered by that status.
  - **Low-Stock Quick-Restock Widget:** Lists SKUs with `stockQuantity <= 5` (including `0`) with inline `+5` / `+10` quick restock buttons and live toggle right from Overview.
  - **Recent Orders Feed:** Last 5 orders with 1-click jump to Dispatch or Print Bill.
- `src/components/admin/AdminDispatchTab.tsx` — Live Orders & Rapido Dispatch Console:
  - Floating New-Order arrival alert banner (with sound chime & `"Jump to Order"`).
  - View mode switcher:
    1. **Kanban Pipeline View (Default on Desktop):** 4 columns (`NEW`, `PACKED`, `DISPATCHED`, `DELIVERED`, with a collapsible toggle/pill for `CANCELLED`). Each card displays Order ID, elapsed time since order (`12m ago`, highlighting amber >15m / red >30m for `NEW` orders), Rapido vs Courier badge, COD vs Prepaid UPI badge, customer name + clickable phone + address, compact item list, Grand Total, **1-click primary next-step button** (`Mark Packed →`, `Mark Dispatched →`, `Mark Delivered ✓`), **1-click Copy for Rapido**, WhatsApp customer, and Bill/Thermal Print buttons.
    2. **Day-by-Day List View (Default on Mobile, toggleable on Desktop):** Preserves the full day-grouped view (`Today`, `Yesterday`, custom date picker, daily revenue/COD/UPI headers) with upgraded crisp card design.
  - Shared toolbar: Date filter chips (`All`, `Today`, `Yesterday`, Date Picker), Status filter pills, Order search input, and `Export CSV` button.
- `src/components/admin/AdminInventoryTab.tsx` — Fast Inventory & Margin Manager:
  - Inventory KPI summary row (Total SKUs, Physical Units, Wholesale Cost Value, Estimated Profit & Avg Margin %).
  - Quick filter tabs: `All`, `Live`, `Low Stock (≤5)`, `Out of Stock (0)`, `Hidden` + Category filter + Search + `Reset Real Catalog` button.
  - Dense, crisp responsive table (with clean stacked cards on small mobile screens): Thumbnail (with multi-photo count badge), Name/Brand/Category, Pack Size, Cost / MRP / Selling Price, Unit Profit & Margin % pill, tactile `- qty +` inline stock stepper (with auto-hide guarantee when hitting `0`), smooth pill toggle switch for `Live` / `Hidden`, and Edit / Delete buttons.
- `src/components/admin/AdminProductDrawer.tsx` — Slide-over right drawer for Add & Edit Medicine SKU:
  - Multi-image uploader + URL adder + Cover star pinning + remove photo.
  - Grouped form sections: Basic Info, Pricing & Stock, Clinical Metadata (Indications, Dosage, Composition).
  - **Live Margin & Customer Savings Preview Strip:** Dynamically calculates and displays Unit Profit (`+₹X`), Margin (`X%`), and Customer Discount (`X% OFF`) in real time as the admin edits Cost, MRP, and Selling Price.
- `src/components/admin/AdminSettingsTab.tsx` — Store Configuration & UPI Console:
  - Clean 2-column layout:
    - Left: WhatsApp number, UPI ID & Account Holder Name, In-City Delivery Fee, Free Delivery Threshold, Outside-City Courier Fee, Admin Security PIN, Save button + toast.
    - Right: Live Auto-Generated Bharat UPI QR Preview Card (with copy VPA button) + Authorized Administrator Dual-Factor Security card.

---

## 8. Edge Cases & Quality Safeguards

1. **Hydration safety:** All `localStorage`/`sessionStorage` reads (`products`, `orders`, `cart`, `location`, `admin_theme`) happen inside `useEffect` (with clean SSR defaults matching `INITIAL_PRODUCTS` / `DEFAULT_SETTINGS`) to prevent React 19 hydration mismatch errors.
2. **Empty states:** Clean illustrated empty states for empty search results (with 1-click Reset Filters), empty cart (with quick popular suggestion CTA), empty Kanban columns, and zero-order dates in the 7-day chart.
3. **Stock cap enforcement:** Incrementing quantity on ProductCard, Search Dropdown, MedicineDetailModal, or CartDrawer always respects `product.stockQuantity` and disables `+` at max stock.
4. **Outside-city COD protection:** Changing delivery type to `COURIER_OUTSIDE` in `CartDrawer` automatically locks payment method to `UPI` and clearly indicates why COD is disabled.
5. **Print isolation:** `InvoiceModal` renders `#printable-bill-document` with explicit light-mode black/white styles inside `@media print`, completely unaffected by `.admin-dark`.
6. **Keyboard accessibility:** Escape key closes active modals/drawers; `Ctrl+K` / `Cmd+K` focuses Admin global search; all interactive buttons have accessible labels and focus rings.

---

## 9. Left to the Builder

- Exact Tailwind utility classes, shadow intensities, and responsive breakpoint fine-tuning within the defined tokens.
- Exact `framer-motion` spring stiffness/damping curves (keep snappy: ~150–260ms perceived duration).
- Internal SVG coordinate math for the 7-day interactive revenue/order bar chart.
- Whether `CategoryFilter.tsx` (currently unused in `page.tsx`) is repurposed as the new sticky filter pill bar component or replaced cleanly with zero dead files left behind.

---

## 10. Verification Plan

After implementation:
1. Run `npm run lint` and `npm run build` — must pass with zero TypeScript or ESLint errors.
2. Verify Customer Storefront (`/`) flows: location switch (`364001` Rapido vs `Rest of India` Courier), rotating search + direct `+ ADD` in dropdown, category strip & horizontal shelves, sticky filters & sort, morphing `ADD` ↔ stepper, cart drawer + "Before You Checkout" upsell + free-delivery bar + checkout validation, PaymentModal QR/WhatsApp/Bill, Account/OrderTracking modal, and mobile responsive layout.
3. Verify Admin Console (`/admin`) flows: dual-factor login (`ayurswift.care@gmail.com` / `1602`), Overview KPIs + 7-day chart + quick restock, Dispatch Kanban 1-click status advance + Day-by-Day toggle + 1-click Rapido copy + A4/Thermal bill print + CSV export, Inventory quick filters + inline stepper + live toggle + slide-over Add/Edit SKU drawer with live margin preview, Settings save + live QR preview, and Light/Dark mode toggle persistence.

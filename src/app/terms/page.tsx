import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service & Refund Policy | AyurSwift',
  description:
    'Terms of ordering, delivery, cancellation, refunds, and OTC wellness guidance for AyurSwift.',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f8f8f3] text-[#1c2e24] py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-gray-200 shadow-xs p-6 sm:p-10 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <Link href="/" className="inline-flex items-center gap-2">
            <img
              src="/ayurswift-logo.png"
              alt="AyurSwift"
              className="h-8 w-auto object-contain"
            />
          </Link>
          <Link
            href="/"
            className="text-xs font-bold text-[#0C831F] hover:underline"
          >
            ← Back to Store
          </Link>
        </div>

        <header className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-950">
            Terms of Service &amp; Refund Policy
          </h1>
          <p className="text-xs text-gray-500">
            Effective Date: November 2026 • AyurSwift (India)
          </p>
        </header>

        <section className="space-y-4 text-sm leading-relaxed text-gray-700">
          <div>
            <h2 className="font-bold text-gray-950 text-base mb-1">
              1. Eligibility &amp; Scope
            </h2>
            <p>
              By placing an order on AyurSwift, you confirm that you are at least
              18 years old and ordering for delivery within India. AyurSwift
              retails authentic over-the-counter (OTC) Ayurvedic and primary
              wellness products from established manufacturers.
            </p>
          </div>

          <div>
            <h2 className="font-bold text-gray-950 text-base mb-1">
              2. Order Acceptance &amp; Pricing
            </h2>
            <p>
              All product prices and delivery charges are calculated and verified
              on our server at checkout. An order is confirmed once our dark
              store verifies physical stock and payment (for prepaid UPI orders).
              If an item becomes unavailable after you order, we will contact you
              immediately and refund any prepaid amount in full.
            </p>
          </div>

          <div>
            <h2 className="font-bold text-gray-950 text-base mb-1">
              3. Delivery Policy
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Local Delivery (Bhavnagar):</strong> Flat ₹35 delivery
                fee (free above ₹499). Dispatched rapidly once packed.
              </li>
              <li>
                <strong>Outside-City Courier (India):</strong> Flat ₹60 courier
                charge. Outside-city orders require prepaid UPI payment.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="font-bold text-gray-950 text-base mb-1">
              4. Cancellation &amp; Refund Policy
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Before Packing:</strong> You may cancel any order in{' '}
                <em>Order Placed</em> status directly from the Orders screen
                before packing begins.
              </li>
              <li>
                <strong>After Packing / Dispatch:</strong> Once packed or handed
                to a rider/courier, cancellation is closed for hygiene and
                product safety.
              </li>
              <li>
                <strong>Damaged, Wrong, or Expired Items:</strong> Report within
                24 hours of delivery with a clear photo on WhatsApp (+91 96247
                66242) or email{' '}
                <a
                  href="mailto:ayurswift.care@gmail.com"
                  className="text-[#0C831F] font-semibold underline"
                >
                  ayurswift.care@gmail.com
                </a>{' '}
                for a full replacement or UPI refund within 2–3 business days.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="font-bold text-gray-950 text-base mb-1">
              5. Wellness Disclaimer
            </h2>
            <p>
              Product descriptions reflect manufacturer packaging only and are
              not a substitute for professional medical advice. Always read the
              label and consult a qualified doctor if you are pregnant, nursing,
              or under medical care.
            </p>
          </div>
        </section>

        <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <Link href="/privacy" className="text-[#0C831F] font-bold hover:underline">
            ← Read Privacy Policy
          </Link>
          <span>Support: ayurswift.care@gmail.com</span>
        </div>
      </div>
    </main>
  );
}

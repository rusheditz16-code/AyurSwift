import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | AyurSwift',
  description:
    'How AyurSwift collects, uses, protects, and erases customer data under India DPDP Act guidelines.',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#f8f8f3] text-[#1c2e24] py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-gray-200 shadow-xs p-6 sm:p-10 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <Link href="/" className="inline-flex items-center gap-2 rounded-lg">
            <img
              src="/ayurswift-logo.png"
              alt="AyurSwift"
              width={128}
              height={32}
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
            Privacy Policy
          </h1>
          <p className="text-xs text-gray-500">
            Effective Date: November 2026 • Applies to AyurSwift (India, 18+ users)
          </p>
        </header>

        <section className="space-y-4 text-sm leading-relaxed text-gray-700">
          <div>
            <h2 className="font-bold text-gray-950 text-base mb-1">
              1. Information We Collect
            </h2>
            <p>
              When you place an order on AyurSwift, we collect only the details
              strictly required to pack, verify payment, and deliver your order:
              your name, 10-digit Indian mobile number, delivery address, city,
              PIN code, optional landmark, and the items in your order. We do not
              store credit/debit card numbers, bank passwords, or Aadhaar/ID
              documents.
            </p>
          </div>

          <div>
            <h2 className="font-bold text-gray-950 text-base mb-1">
              2. How We Use Your Information
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Confirm stock availability and pack your Ayurvedic &amp; OTC items.</li>
              <li>Coordinate local delivery (Bhavnagar) or courier shipping across India.</li>
              <li>Verify UPI payments and send order updates or cash memos via WhatsApp.</li>
              <li>Maintain statutory order and billing records as required under Indian law.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-bold text-gray-950 text-base mb-1">
              3. Data Sharing &amp; Third Parties
            </h2>
            <p>
              We do not sell your personal information, and we do not run
              third-party advertising trackers or analytics pixels. Your name,
              phone number, and delivery address are shared only with the
              assigned delivery partner (e.g. Rapido Parcel or courier carrier)
              strictly to complete your delivery, and stored securely on our
              hosting and database infrastructure (Vercel &amp; Supabase).
            </p>
          </div>

          <div>
            <h2 className="font-bold text-gray-950 text-base mb-1">
              4. Data Protection &amp; Retention
            </h2>
            <p>
              All traffic uses HTTPS encryption. Public order lookups mask your
              phone number and street address. Order details are retained only as
              long as needed for delivery support and applicable Indian
              bookkeeping/tax compliance.
            </p>
          </div>

          <div>
            <h2 className="font-bold text-gray-950 text-base mb-1">
              5. Your Rights &amp; Data Erasure (India DPDP Act)
            </h2>
            <p>
              You can clear locally saved device addresses anytime inside{' '}
              <strong>Account → Store &amp; Privacy</strong>, or request erasure
              of your personal details on completed/cancelled orders directly
              from the Account panel or by emailing{' '}
              <a
                href="mailto:ayurswift.care@gmail.com"
                className="text-[#0C831F] font-semibold underline"
              >
                ayurswift.care@gmail.com
              </a>
              . Upon verification of your Order ID and registered mobile number,
              your name, phone, and address will be permanently anonymized on our
              servers.
            </p>
          </div>

          <div>
            <h2 className="font-bold text-gray-950 text-base mb-1">
              6. Age Requirement
            </h2>
            <p>
              AyurSwift is intended solely for customers aged 18 years and older
              located in India. We do not knowingly collect personal data from
              individuals under 18.
            </p>
          </div>

          <div>
            <h2 className="font-bold text-gray-950 text-base mb-1">
              7. Contact &amp; Grievance Officer
            </h2>
            <p>
              For privacy questions, security disclosures, or data deletion
              requests, contact us at{' '}
              <a
                href="mailto:ayurswift.care@gmail.com"
                className="text-[#0C831F] font-semibold underline"
              >
                ayurswift.care@gmail.com
              </a>{' '}
              or WhatsApp helpline <strong>+91 96247 66242</strong>.
            </p>
          </div>
        </section>

        <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <Link href="/terms" className="text-[#0C831F] font-bold hover:underline">
            View Terms &amp; Refund Policy →
          </Link>
          <span>AyurSwift • Bhavnagar, Gujarat</span>
        </div>
      </div>
    </main>
  );
}

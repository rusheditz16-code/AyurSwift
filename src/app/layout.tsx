import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AyurSwift 🌿⚡ | Authentic Ayurveda & Primary Healthcare Micro-Fulfillment',
  description: 'Home dark store for authentic Ayurvedic & primary OTC medicines. 30-45m Rapido rapid delivery in-city, 1-click WhatsApp order, zero-fee direct UPI.',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌿</text></svg>',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-[#060908] text-gray-100 font-sans selection:bg-emerald-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AyurSwift | Authentic Ayurvedic & OTC Pharmacy — Scheduled Bhavnagar Slot Delivery',
  description:
    'Order genuine Ayurvedic & everyday wellness essentials. Choose flexible Bhavnagar delivery slots (9–10 AM, 10–11 AM, 6–7 PM, 7–8 PM) or 2–4 day All-India tracked courier.',
  icons: {
    icon: '/ayurswift-icon.png',
    apple: '/ayurswift-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#F5F7FA] text-[#111827] font-sans selection:bg-[#DCFCE7] selection:text-[#0A5C16]">
        {children}
      </body>
    </html>
  );
}

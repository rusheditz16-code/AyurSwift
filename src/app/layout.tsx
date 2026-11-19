import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AyurSwift 🌿⚡ | Tradition Meets Speed | Quick Ayurvedic Store',
  description: 'Instant delivery of authentic Ayurvedic & primary wellness products in 30-45 mins. Tradition Meets Speed.',
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
      <body className="min-h-full flex flex-col bg-[#f8f8f3] text-[#1c2e24] font-sans selection:bg-[#e9efdf] selection:text-[#143d29]">
        {children}
      </body>
    </html>
  );
}

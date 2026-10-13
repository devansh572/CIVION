import type { Metadata } from 'next';
import Script from 'next/script';
import { NextAuthProvider } from '@/components/NextAuthProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Civion — Shared Civic Promise Ledger',
  description:
    'A real-time loop connecting resident signals directly to field teams and city administration.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        />
        {/* Leaflet JS */}
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" async={false}></script>
      </head>
      <body className="min-h-screen bg-[#0d1117] text-[#e6edf3] font-sans antialiased selection:bg-coral-500 selection:text-white">
        <NextAuthProvider>
          {children}
        </NextAuthProvider>
        {/* Chatling AI Chatbot Integration */}
        <Script id="chatling-config" strategy="afterInteractive">
          {`window.chtlConfig = { chatbotId: "6593945637" };`}
        </Script>
        <Script
          id="chtl-script"
          strategy="afterInteractive"
          src="https://chatling.ai/js/embed.js"
          data-id="6593945637"
        />
      </body>
    </html>
  );
}

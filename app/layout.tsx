import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SI PANTAI GIZI - Puskesmas Rawat Inap',
  description: 'Sistem Pemantauan Asupan Nutrisi, Tagihan, dan Distribusi Gizi SOP Rawat Inap Puskesmas dengan Integrasi Google Apps Script & Spreadsheet',
  openGraph: {
    title: 'SI PANTAI GIZI - Puskesmas Rawat Inap',
    description: 'Sistem Pemantauan Asupan Nutrisi, Tagihan, dan Distribusi Gizi SOP Rawat Inap Puskesmas',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SI PANTAI GIZI - Puskesmas Rawat Inap',
    description: 'Sistem Pemantauan Asupan Nutrisi, Tagihan, dan Distribusi Gizi SOP Rawat Inap Puskesmas',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0f766e',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${plusJakarta.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-teal-100 selection:text-teal-900" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

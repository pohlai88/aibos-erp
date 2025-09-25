import type { Metadata } from 'next';

import { ClientProviders } from '../components/ClientProviders';
import { Navigation } from '../components/Navigation';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

// Constants for metadata to avoid duplication
const APP_TITLE = 'AI-BOS ERP';
const APP_DESCRIPTION = 'AI-BOS Enterprise Resource Planning System';

export const metadata: Metadata = {
  title: APP_TITLE,
  description: APP_DESCRIPTION,
  keywords: ['ERP', 'Enterprise', 'Business', 'Management', 'AI'],
  authors: [{ name: 'AI-BOS Team' }],
  creator: 'AI-BOS',
  publisher: 'AI-BOS',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://aibos-erp.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://aibos-erp.com',
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    siteName: APP_TITLE,
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    creator: '@aibos_erp',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <ClientProviders>
          <Navigation />
          <main>{children}</main>
        </ClientProviders>
      </body>
    </html>
  );
}

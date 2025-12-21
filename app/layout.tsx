import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'

export const metadata: Metadata = {
  title: {
    default: 'ExpiryCare - Never Miss an Expiry Date | Track Warranties, Insurance & More',
    template: '%s | ExpiryCare',
  },
  description: 'ExpiryCare helps Indians track warranties, insurance policies, medicines, and subscriptions. Get smart reminders before expiry. Free to start.',
  keywords: ['expiry tracker', 'warranty tracker', 'insurance reminder', 'medicine expiry', 'subscription tracker', 'life admin', 'India'],
  authors: [{ name: 'ExpiryCare' }],
  creator: 'ExpiryCare',
  publisher: 'ExpiryCare',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://expirycare.com'),
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://expirycare.com',
    siteName: 'ExpiryCare',
    title: 'ExpiryCare - Never Miss an Expiry Date',
    description: 'Track warranties, insurance, medicines & subscriptions. Get smart reminders before expiry.',
    images: [
      {
        url: '/og-image.png', // You'll need to create this image
        width: 1200,
        height: 630,
        alt: 'ExpiryCare - Never Miss an Expiry Date',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ExpiryCare - Never Miss an Expiry Date',
    description: 'Track warranties, insurance, medicines & subscriptions. Get smart reminders.',
    images: ['/og-image.png'],
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
    // Add these after setting up Google Search Console
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-IN">
      <body>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  )
}

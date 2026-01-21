import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://prometheus-obfuscator.vercel.app'),
  title: 'Prometheus Obfuscator - Lua Obfuscation for Roblox',
  description: 'The most advanced open-source Lua obfuscator by Levno_710. Protect your Roblox scripts with XOR encryption, control flow obfuscation, and anti-tamper protection. 100% compatible with Delta, Velocity, Xeno, and all 2026 executors.',
  keywords: [
    'lua obfuscator',
    'roblox obfuscator',
    'prometheus',
    'levno_710',
    'script protection',
    'lua encryption',
    'roblox scripts',
    'luau obfuscator',
    'delta executor',
    'velocity executor',
    'xeno executor',
    'wave executor',
    'rayfield',
    'fluent ui',
  ],
  authors: [{ name: 'Levno_710', url: 'https://github.com/prometheus-lua' }],
  creator: 'Levno_710',
  publisher: 'Prometheus',
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
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://prometheus-obfuscator.vercel.app',
    siteName: 'Prometheus Obfuscator',
    title: 'Prometheus Obfuscator',
    description: 'Advanced Lua obfuscation for Roblox by Levno_710',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Prometheus Lua Obfuscator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prometheus Obfuscator - Lua Obfuscation',
    description: 'The most advanced open-source Lua obfuscator by Levno_710.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: 'https://prometheus-obfuscator.vercel.app',
  },
}

export const viewport: Viewport = {
  themeColor: '#09090b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="theme-color" content="#09090b" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}

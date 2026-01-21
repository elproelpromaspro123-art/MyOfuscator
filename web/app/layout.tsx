import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://prometheus-obfuscator.vercel.app'),
  title: 'Prometheus 2026 - Professional Lua Obfuscator for Roblox',
  description: 'Protect your Roblox scripts with professional-grade obfuscation. Free Lua obfuscator compatible with Delta, Velocity, Xeno, Wave, and all 2026 executors. Multi-key XOR, control flow flattening, anti-tamper protection.',
  keywords: [
    'lua obfuscator 2026',
    'roblox obfuscator',
    'luau obfuscator',
    'roblox script protection',
    'lua encryption',
    'roblox executor 2026',
    'delta executor',
    'velocity executor',
    'xeno executor',
    'wave executor',
    'free lua obfuscator',
    'script obfuscation',
    'code protection',
    'control flow flattening',
    'multi-key xor',
  ],
  authors: [{ name: 'Prometheus', url: 'https://prometheus-obfuscator.vercel.app' }],
  creator: 'Prometheus',
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
    siteName: 'Prometheus Lua Obfuscator 2026',
    title: 'Prometheus 2026 - Professional Lua Obfuscator for Roblox',
    description: 'Protect your Roblox scripts with professional-grade obfuscation. Free, fast, and compatible with all 2026 executors.',
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
    title: 'Prometheus 2026 - Professional Lua Obfuscator',
    description: 'Free professional Lua obfuscator for Roblox. Compatible with all 2026 executors.',
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

import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://prometheus-obfuscator.vercel.app'),
  title: 'Prometheus Obfuscator - Advanced Lua Obfuscation for Roblox',
  description: 'The most powerful open-source Lua obfuscator. Protect your Roblox scripts with Vmify, string encryption, control flow flattening, and more. Compatible with Delta, Velocity, Xeno executors. Originally by Levno_710.',
  keywords: [
    'lua obfuscator',
    'roblox obfuscator',
    'prometheus',
    'script protection',
    'lua encryption',
    'roblox scripts',
    'vmify',
    'executor compatible',
    'luau obfuscator',
    'delta executor',
    'velocity executor',
    'xeno executor',
    'control flow flattening',
  ],
  authors: [{ name: 'Levno_710' }, { name: 'Prometheus Contributors' }],
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
    description: 'Advanced Lua obfuscation for Roblox executors',
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
    title: 'Prometheus Obfuscator - Advanced Lua Obfuscation',
    description: 'The most powerful open-source Lua obfuscator for Roblox. Originally by Levno_710.',
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

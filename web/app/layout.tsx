import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Prometheus Obfuscator | Lua Code Protection',
  description: 'Professional Lua obfuscator with VM protection, string encryption, control flow flattening, and more. Protect your Lua and Roblox scripts.',
  keywords: 'lua obfuscator, roblox obfuscator, lua protection, code obfuscation, prometheus',
  authors: [{ name: 'Prometheus Team' }],
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'Prometheus Obfuscator',
    description: 'Professional Lua code protection',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <div className="scanline" />
        {children}
        <SpeedInsights />
      </body>
    </html>
  )
}

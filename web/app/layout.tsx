import type { Metadata } from 'next'
import { Inter, Orbitron } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron' })

export const metadata: Metadata = {
  title: 'Prometheus Obfuscator | Lua Code Protection',
  description: 'Professional Lua obfuscator with VM protection, string encryption, control flow flattening, and more. Protect your Lua and Roblox scripts.',
  keywords: 'lua obfuscator, roblox obfuscator, lua protection, code obfuscation, prometheus',
  authors: [{ name: 'Prometheus Team' }],
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
    <html lang="en" className={`${inter.variable} ${orbitron.variable}`}>
      <body className={`${inter.className} antialiased`}>
        <div className="scanline" />
        {children}
      </body>
    </html>
  )
}

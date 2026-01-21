'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import StatsPanel from '@/components/StatsPanel'
import { obfuscateCode } from '@/lib/obfuscator'

const CodeEditor = dynamic(() => import('@/components/CodeEditor'), { 
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-[#0f0f12] rounded-xl flex items-center justify-center">
      <div className="flex items-center gap-3 text-zinc-500">
        <div className="spinner"></div>
        <span>Loading editor...</span>
      </div>
    </div>
  )
})

const defaultCode = `-- Paste your Lua/LuaU script here
local Players = game:GetService("Players")
local Player = Players.LocalPlayer

local function greet(name)
    print("Hello, " .. name)
end

greet(Player.Name)`

export default function Home() {
  const [input, setInput] = useState(defaultCode)
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<{ originalSize: number; obfuscatedSize: number; processingTime: number } | null>(null)

  const handleObfuscate = useCallback(async () => {
    if (!input.trim()) {
      setError('Please enter some code to obfuscate')
      return
    }
    setLoading(true)
    setError(null)
    const start = performance.now()
    try {
      const result = await obfuscateCode(input)
      setOutput(result.code)
      setStats({
        originalSize: result.stats.originalSize,
        obfuscatedSize: result.stats.obfuscatedSize,
        processingTime: Math.round(performance.now() - start),
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred during obfuscation')
      setOutput('')
    } finally {
      setLoading(false)
    }
  }, [input])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(output)
  }, [output])

  const handleDownload = useCallback(() => {
    const blob = new Blob([output], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'obfuscated.lua'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [output])

  return (
    <div className="min-h-screen flex flex-col bg-grid">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-radial pointer-events-none"></div>
        <div className="container mx-auto px-4 pt-16 pb-8 max-w-5xl relative">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#151519] border border-[#1f1f28] text-sm text-zinc-400 mb-6">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              2026 Edition • Open Source
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              <span className="gradient-text">Prometheus</span>
              <br />
              <span className="text-white">Obfuscator</span>
            </h1>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-6">
              The most advanced open-source Lua obfuscator by Levno_710.
              <br />
              Optimized for all 2026 Roblox executors.
            </p>
            <div className="flex flex-wrap justify-center gap-3 text-sm">
              <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">✓ Maximum Protection</span>
              <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">✓ 100% Compatible</span>
              <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">✓ Client-Side Only</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Editor Section */}
      <main className="container mx-auto px-4 pb-16 max-w-5xl">
        <div className="space-y-4">
          {/* Input Editor */}
          <div className="editor-wrapper">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1f1f28]">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#eab308]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#22c55e]"></div>
                </div>
                <span className="text-sm text-zinc-400 font-medium">Input Script</span>
              </div>
              <span className="text-xs text-zinc-600 font-mono">{input.length} chars</span>
            </div>
            <CodeEditor
              value={input}
              onChange={(v) => setInput(v || '')}
              language="lua"
              height="400px"
            />
          </div>

          {/* Obfuscate Button */}
          <div className="flex justify-center py-3">
            <button
              onClick={handleObfuscate}
              disabled={loading}
              className="btn-primary flex items-center gap-3 px-12 py-4 text-lg font-semibold"
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  <span>Obfuscating...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Obfuscate</span>
                </>
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="card p-4 border-red-900/50 bg-red-950/20 text-red-400 text-sm fade-in flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Output */}
          {output && stats && (
            <>
              <StatsPanel stats={stats} />
              
              <div className="editor-wrapper fade-in">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#1f1f28]">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div>
                      <div className="w-3 h-3 rounded-full bg-[#eab308]"></div>
                      <div className="w-3 h-3 rounded-full bg-[#22c55e]"></div>
                    </div>
                    <span className="text-sm text-zinc-400 font-medium">Protected Output</span>
                    <span className="badge badge-success">Ready</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleCopy} className="btn-secondary text-xs py-2 px-4 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </button>
                    <button onClick={handleDownload} className="btn-secondary text-xs py-2 px-4 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </button>
                  </div>
                </div>
                <CodeEditor
                  value={output}
                  language="lua"
                  height="400px"
                  readOnly
                />
              </div>
            </>
          )}
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-20 border-t border-[#1f1f28]">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Protection Features</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              All protections applied automatically for maximum security and compatibility.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: '🔐',
                title: 'XOR String Encryption',
                desc: 'All strings are encrypted with pseudo-random XOR cipher and decrypted at runtime.'
              },
              {
                icon: '🔀',
                title: 'Control Flow Obfuscation',
                desc: 'State-machine dispatcher pattern makes code flow analysis nearly impossible.'
              },
              {
                icon: '📦',
                title: 'Constant Array',
                desc: 'All constants extracted to shuffled array with Base64 encoding.'
              },
              {
                icon: '🛡️',
                title: 'Anti-Tamper',
                desc: 'Runtime integrity checks detect and prevent code modification.'
              },
              {
                icon: '⚡',
                title: 'Variable Mangling',
                desc: 'All local variables renamed with shuffled character patterns.'
              },
              {
                icon: '🚀',
                title: 'IIFE Wrapping',
                desc: 'Double IIFE wrapper ensures executor compatibility.'
              },
            ].map((feature, i) => (
              <div key={i} className="card-glow p-6">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compatibility Section */}
      <section id="compatibility" className="py-20 border-t border-[#1f1f28] bg-[#0a0a0c]">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">100% Compatible</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Tested and optimized for all modern Roblox executors and UI libraries.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="card p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <span className="text-green-400">✓</span>
                Supported Executors
              </h3>
              <div className="flex flex-wrap gap-2">
                {['Delta', 'Velocity', 'Xeno', 'Wave', 'Synapse Z', 'Fluxus', 'Krnl', 'Script-Ware'].map(e => (
                  <span key={e} className="px-3 py-1 text-sm rounded-full bg-[#151519] border border-[#1f1f28] text-zinc-300">
                    {e}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="card p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <span className="text-green-400">✓</span>
                Supported UI Libraries
              </h3>
              <div className="flex flex-wrap gap-2">
                {['Rayfield', 'Fluent', 'Orion', 'Kavo', 'Venyx', 'Material', 'Drawing API'].map(e => (
                  <span key={e} className="px-3 py-1 text-sm rounded-full bg-[#151519] border border-[#1f1f28] text-zinc-300">
                    {e}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 border-t border-[#1f1f28]">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
          </div>
          
          <div className="space-y-4">
            {[
              {
                q: 'Does this work with all executors?',
                a: 'Yes. The obfuscator is optimized for all 2026 executors including Delta, Velocity, Xeno, Wave, and more. It uses LuaU-safe techniques only.'
              },
              {
                q: 'Will my loadstring scripts work?',
                a: 'Absolutely. Scripts using loadstring(game:HttpGet(...))() work perfectly. URLs and strings are encrypted but decrypted correctly at runtime.'
              },
              {
                q: 'Is my code stored anywhere?',
                a: 'No. All obfuscation happens 100% in your browser. Your code never leaves your device.'
              },
              {
                q: 'Why is the output larger than input?',
                a: 'The obfuscator adds encryption, anti-tamper checks, and control flow protection. This increases size but provides strong security.'
              },
              {
                q: 'What is Prometheus?',
                a: 'Prometheus is an open-source Lua obfuscator created by Levno_710. This is a web port optimized for Roblox executors.'
              },
            ].map((faq, i) => (
              <div key={i} className="card p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#6366f1]/20 text-[#6366f1] text-sm flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  {faq.q}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed pl-9">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 border-t border-[#1f1f28]">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-2xl font-bold mb-4">Looking for Roblox Scripts?</h2>
          <p className="text-zinc-400 mb-8">
            Check out our collection of premium scripts for popular games.
          </p>
          <a 
            href="https://templo-steel.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex items-center gap-2"
          >
            Visit Scripts Hub
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </section>

      <Footer />
    </div>
  )
}

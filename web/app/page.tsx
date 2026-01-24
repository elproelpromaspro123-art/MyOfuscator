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

interface Stats {
  originalSize: number
  obfuscatedSize: number
  processingTime: number
}

export default function Home() {
  const [input, setInput] = useState(defaultCode)
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [copied, setCopied] = useState(false)

  const handleObfuscate = useCallback(async () => {
    if (!input.trim()) {
      setError('Please enter some code to obfuscate')
      return
    }
    setLoading(true)
    setError(null)
    setCopied(false)
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
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#151519] border border-[#1f1f28] text-sm text-zinc-400 mb-6 glow-animate">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              v3.0 Ultimate • 2026 Edition
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              <span className="gradient-text">Prometheus</span>
              <br />
              <span className="text-white">Obfuscator</span>
            </h1>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-6">
              The most advanced open-source Lua obfuscator with
              <span className="text-[#6366f1]"> MBA</span>,
              <span className="text-[#a855f7]"> CFG</span>, and
              <span className="text-[#22c55e]"> Multi-Layer Encryption</span>.
              <br />
              Optimized for all 2026 Roblox executors.
            </p>
            <div className="flex flex-wrap justify-center gap-3 text-sm">
              <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">✓ MBA Obfuscation</span>
              <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">✓ 4-Layer Encryption</span>
              <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">✓ Control Flow Flatten</span>
              <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">✓ Anti-Tamper</span>
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
              className="btn-primary flex items-center gap-3 px-12 py-4 text-lg font-semibold group"
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  <span>Obfuscating...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      {copied ? (
                        <>
                          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Copied!
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy
                        </>
                      )}
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
            <h2 className="text-3xl font-bold mb-4">Advanced Protection Features</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              State-of-the-art obfuscation techniques for 2026 and beyond.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: '⚡',
                title: 'MBA Obfuscation',
                desc: 'Mixed Boolean-Arithmetic transformations that convert simple operations into complex bit operations.'
              },
              {
                icon: '🔀',
                title: 'Control Flow Flattening',
                desc: 'State-machine dispatcher pattern with closures and encoded state transitions.'
              },
              {
                icon: '🔐',
                title: '4-Layer String Encryption',
                desc: 'XOR + rotation + permutation + chunking with multiple decryptor variants.'
              },
              {
                icon: '🧮',
                title: 'Opaque Predicates',
                desc: 'Number theory-based always-true/false conditions using Fermat and modular arithmetic.'
              },
              {
                icon: '👁️',
                title: 'Reference Hiding',
                desc: 'Localize and obfuscate all global references through indirect access patterns.'
              },
              {
                icon: '🛡️',
                title: 'Anti-Tamper',
                desc: 'Runtime integrity checks with silent corruption mode to waste attacker time.'
              },
            ].map((feature, i) => (
              <div key={i} className="card-glow p-6">
                <div className="feature-icon float">{feature.icon}</div>
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
                Supported Executors (2026)
              </h3>
              <div className="flex flex-wrap gap-2">
                {['Delta', 'Velocity', 'Xeno', 'Wave', 'Synapse Z', 'Fluxus', 'Krnl', 'Solara', 'Arceus X', 'Codex'].map(e => (
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
                {['Rayfield', 'Fluent', 'Orion', 'Kavo', 'Venyx', 'Material', 'Drawing API', 'Linoria'].map(e => (
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
                q: 'What is MBA Obfuscation?',
                a: 'MBA (Mixed Boolean-Arithmetic) obfuscation transforms simple expressions like x+y into complex bit operations that are equivalent but much harder to understand.'
              },
              {
                q: 'Does this work with all executors?',
                a: 'Yes. The obfuscator is optimized for all 2026 executors including Delta, Velocity, Xeno, Wave, and more. It uses LuaU-safe techniques only.'
              },
              {
                q: 'What are the 4 layers of string encryption?',
                a: 'Layer 1: XOR with derived key. Layer 2: Byte rotation. Layer 3: Add with carry. Layer 4: Byte permutation. Each string is also split into chunks.'
              },
              {
                q: 'Is my code stored anywhere?',
                a: 'No. All obfuscation happens 100% in your browser. Your code never leaves your device.'
              },
              {
                q: 'Why is the output larger than input?',
                a: 'The obfuscator adds encryption, anti-tamper checks, control flow, and junk code. This increases size but provides strong security.'
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

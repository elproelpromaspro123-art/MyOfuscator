'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SettingsPanel from '@/components/SettingsPanel'
import StatsPanel from '@/components/StatsPanel'
import { obfuscateCode, ObfuscationSettings } from '@/lib/obfuscator'

const CodeEditor = dynamic(() => import('@/components/CodeEditor'), { 
  ssr: false,
  loading: () => (
    <div className="h-[350px] bg-[#0f0f12] rounded-xl flex items-center justify-center">
      <div className="flex items-center gap-3 text-zinc-500">
        <div className="spinner"></div>
        <span>Loading editor...</span>
      </div>
    </div>
  )
})

const defaultCode = `-- Paste your Lua code here
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
  const [stats, setStats] = useState({ originalSize: 0, obfuscatedSize: 0, processingTime: 0, stepsApplied: 0 })
  const [settings, setSettings] = useState<ObfuscationSettings>({ preset: 'Medium' })

  const handleObfuscate = useCallback(async () => {
    if (!input.trim()) {
      setError('Please enter some code to obfuscate')
      return
    }
    setLoading(true)
    setError(null)
    const start = performance.now()
    try {
      const result = await obfuscateCode(input, settings)
      setOutput(result.code)
      setStats({
        originalSize: input.length,
        obfuscatedSize: result.code.length,
        processingTime: Math.round(performance.now() - start),
        stepsApplied: result.stepsApplied,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred')
      setOutput('')
    } finally {
      setLoading(false)
    }
  }, [input, settings])

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
        <div className="container mx-auto px-4 pt-16 pb-8 max-w-6xl relative">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#151519] border border-[#1f1f28] text-sm text-zinc-400 mb-6">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              2026 Edition • Professional Obfuscation
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              <span className="gradient-text">Professional Lua</span>
              <br />
              <span className="text-white">Obfuscator</span>
            </h1>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-6">
              Protect your Roblox scripts with professional-grade obfuscation.
              Compatible with Delta, Velocity, Xeno, Wave, and all 2026 executors.
            </p>
            <div className="flex flex-wrap justify-center gap-3 text-sm">
              <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">✓ 100% Free</span>
              <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">✓ No Signup</span>
              <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">✓ Client-Side</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Editor Section */}
      <main className="container mx-auto px-4 pb-16 max-w-6xl">
        <div className="grid lg:grid-cols-[320px_1fr] gap-6">
          {/* Settings */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <SettingsPanel settings={settings} onChange={setSettings} />
          </div>

          {/* Editor Area */}
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
                  <span className="text-sm text-zinc-400 font-medium">Input</span>
                </div>
                <span className="text-xs text-zinc-600 font-mono">{input.length} chars</span>
              </div>
              <CodeEditor
                value={input}
                onChange={(v) => setInput(v || '')}
                language="lua"
                height="350px"
              />
            </div>

            {/* Obfuscate Button */}
            <div className="flex justify-center py-2">
              <button
                onClick={handleObfuscate}
                disabled={loading}
                className="btn-primary flex items-center gap-3 px-10 py-4 text-base"
              >
                {loading ? (
                  <>
                    <div className="spinner" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Obfuscate Code</span>
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
            {output && (
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
                      <span className="text-sm text-zinc-400 font-medium">Output</span>
                      <span className="badge badge-success">Obfuscated</span>
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
                    height="350px"
                    readOnly
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-20 border-t border-[#1f1f28]">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose Prometheus?</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Built specifically for Roblox executors with cutting-edge obfuscation techniques.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: '🔐',
                title: 'Multi-Key XOR Encryption',
                desc: 'Up to 4 rolling XOR keys with string caching. Professional-grade encryption.'
              },
              {
                icon: '⚡',
                title: '100% Executor Compatible',
                desc: 'Tested with Delta, Velocity, Xeno, Synapse, and all modern 2026 executors.'
              },
              {
                icon: '🛡️',
                title: 'Anti-Tamper & Env Checks',
                desc: 'Runtime integrity verification and environment validation protect your code.'
              },
              {
                icon: '🔀',
                title: 'Control Flow Flattening',
                desc: 'State-machine dispatch with shuffled states defeats static analysis tools.'
              },
              {
                icon: '📦',
                title: 'Complete String Hiding',
                desc: 'All strings including URLs and API keys are encrypted and invisible.'
              },
              {
                icon: '🚀',
                title: 'Private & Secure',
                desc: '100% client-side processing. Your code never leaves your browser.'
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

      {/* Comparison Section */}
      <section id="comparison" className="py-20 border-t border-[#1f1f28] bg-[#0a0a0c]">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How We Compare</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              See how Prometheus stacks up against other obfuscators.
            </p>
          </div>
          
          <div className="card overflow-hidden">
            <table className="comparison-table">
              <thead>
                <tr className="bg-[#151519]">
                  <th>Feature</th>
                  <th className="text-center">
                    <span className="gradient-text font-semibold">Prometheus</span>
                  </th>
                  <th className="text-center text-zinc-500">Others</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: '2026 Executor Compatible', prometheus: true, others: 'partial' },
                  { feature: 'Complete String Encryption', prometheus: true, others: false },
                  { feature: 'Multi-Key XOR (up to 4)', prometheus: true, others: false },
                  { feature: 'Control Flow Flattening', prometheus: true, others: 'partial' },
                  { feature: 'Anti-Tamper + Env Checks', prometheus: true, others: 'partial' },
                  { feature: '100% Client-Side', prometheus: true, others: 'partial' },
                  { feature: 'Completely Free', prometheus: true, others: 'partial' },
                  { feature: 'No Rate Limits', prometheus: true, others: false },
                  { feature: 'Opaque Predicates', prometheus: true, others: false },
                ].map((row, i) => (
                  <tr key={i}>
                    <td className="text-zinc-300">{row.feature}</td>
                    <td className="text-center">
                      {row.prometheus ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20 text-green-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      ) : (
                        <span className="text-red-400">✕</span>
                      )}
                    </td>
                    <td className="text-center">
                      {row.others === true ? (
                        <span className="text-green-400">✓</span>
                      ) : row.others === 'partial' ? (
                        <span className="text-yellow-400">~</span>
                      ) : (
                        <span className="text-red-400">✕</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                q: 'Which executors are supported?',
                a: 'Prometheus 2026 works with all modern executors including Delta, Velocity, Xeno, Synapse, Wave, and more. We use bit32 operations and IIFE wrappers for maximum compatibility.'
              },
              {
                q: 'Why isn\'t my script working after obfuscation?',
                a: 'Try a lower protection level first (Low or Medium). Complex scripts with dynamic loading usually work best at Medium. If issues persist, ensure your original script runs correctly first.'
              },
              {
                q: 'Is my code stored anywhere?',
                a: 'No. All obfuscation happens 100% in your browser. Your code never leaves your device and is never sent to any server. We have zero logging.'
              },
              {
                q: 'Can obfuscated code be reversed?',
                a: 'While no obfuscation is theoretically unbreakable, Prometheus uses professional techniques (multi-key XOR, control flow flattening, opaque predicates) that make reverse engineering extremely difficult and time-consuming.'
              },
              {
                q: 'What\'s the difference between protection levels?',
                a: 'Low: Single-key XOR + junk code. Medium: Multi-key XOR + variable renaming. High: Control flow flattening + anti-tamper. Maximum: All techniques + quad-key encryption + triple IIFE nesting.'
              },
              {
                q: 'Does this work with loadstring scripts?',
                a: 'Yes! Scripts that use loadstring(game:HttpGet(...))() work perfectly. The obfuscator encrypts all strings including URLs while preserving script functionality.'
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
            Check out our collection of premium scripts for popular Roblox games.
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

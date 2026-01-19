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
    <div className="h-[400px] bg-zinc-900 rounded-lg flex items-center justify-center">
      <div className="text-zinc-500">Loading editor...</div>
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
      setError('Enter some code first')
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
      setError(e instanceof Error ? e.message : 'Error')
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
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3">Lua Obfuscator</h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Protect your Roblox scripts with executor-compatible obfuscation.
            Works with Delta, Velocity, Xeno, and more.
          </p>
        </div>

        {/* Editor Section */}
        <div className="grid lg:grid-cols-4 gap-6 mb-16">
          <div className="lg:col-span-1">
            <SettingsPanel settings={settings} onChange={setSettings} />
          </div>

          <div className="lg:col-span-3 space-y-4">
            <div className="editor-wrapper">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                <span className="text-sm text-zinc-400">Input</span>
                <span className="text-xs text-zinc-600">{input.length} chars</span>
              </div>
              <CodeEditor
                value={input}
                onChange={(v) => setInput(v || '')}
                language="lua"
                height="280px"
              />
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleObfuscate}
                disabled={loading}
                className="btn-primary flex items-center gap-2 px-8"
              >
                {loading ? (
                  <>
                    <div className="spinner" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Obfuscate</span>
                )}
              </button>
            </div>

            {error && (
              <div className="card p-4 border-red-900 bg-red-950/30 text-red-400 text-sm fade-in">
                {error}
              </div>
            )}

            {output && (
              <>
                <StatsPanel stats={stats} />
                
                <div className="editor-wrapper fade-in">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                    <span className="text-sm text-zinc-400">Output</span>
                    <div className="flex gap-2">
                      <button onClick={handleCopy} className="btn-secondary text-xs py-2 px-3">
                        Copy
                      </button>
                      <button onClick={handleDownload} className="btn-secondary text-xs py-2 px-3">
                        Download
                      </button>
                    </div>
                  </div>
                  <CodeEditor
                    value={output}
                    language="lua"
                    height="280px"
                    readOnly
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Why Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Why Prometheus?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card p-6">
              <div className="text-blue-400 text-2xl mb-3">⚡</div>
              <h3 className="font-semibold mb-2">Executor Compatible</h3>
              <p className="text-sm text-zinc-400">
                Built specifically for modern executors. Uses bit32 operations and avoids 
                sandboxed functions like loadstring in the output.
              </p>
            </div>
            <div className="card p-6">
              <div className="text-blue-400 text-2xl mb-3">🛡️</div>
              <h3 className="font-semibold mb-2">Smart String Protection</h3>
              <p className="text-sm text-zinc-400">
                Encrypts strings while preserving URLs, escape sequences, and API calls 
                that would break if modified.
              </p>
            </div>
            <div className="card p-6">
              <div className="text-blue-400 text-2xl mb-3">🔧</div>
              <h3 className="font-semibold mb-2">4 Protection Levels</h3>
              <p className="text-sm text-zinc-400">
                From minimal wrapping to multi-layer protection. Choose the right balance 
                of security and performance.
              </p>
            </div>
          </div>
        </section>

        {/* Comparison Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">How We Compare</h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left p-4 text-zinc-400">Feature</th>
                  <th className="p-4 text-center text-blue-400">Prometheus</th>
                  <th className="p-4 text-center text-zinc-500">Others</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                <tr>
                  <td className="p-4 text-zinc-300">Executor Compatible</td>
                  <td className="p-4 text-center text-green-400">✓</td>
                  <td className="p-4 text-center text-red-400">Often breaks</td>
                </tr>
                <tr>
                  <td className="p-4 text-zinc-300">Preserves loadstring() calls</td>
                  <td className="p-4 text-center text-green-400">✓</td>
                  <td className="p-4 text-center text-red-400">Wraps everything</td>
                </tr>
                <tr>
                  <td className="p-4 text-zinc-300">Safe string handling</td>
                  <td className="p-4 text-center text-green-400">✓</td>
                  <td className="p-4 text-center text-yellow-400">Partial</td>
                </tr>
                <tr>
                  <td className="p-4 text-zinc-300">LuaU/Roblox focused</td>
                  <td className="p-4 text-center text-green-400">✓</td>
                  <td className="p-4 text-center text-yellow-400">Generic Lua</td>
                </tr>
                <tr>
                  <td className="p-4 text-zinc-300">Free to use</td>
                  <td className="p-4 text-center text-green-400">✓</td>
                  <td className="p-4 text-center text-yellow-400">Varies</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">FAQ</h2>
          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="card p-5">
              <h3 className="font-semibold mb-2">Which executors are supported?</h3>
              <p className="text-sm text-zinc-400">
                Delta, Velocity, Xeno, Synapse, and most modern executors. We use bit32 
                operations and avoid Lua 5.3+ syntax.
              </p>
            </div>
            <div className="card p-5">
              <h3 className="font-semibold mb-2">Why isn't my script working after obfuscation?</h3>
              <p className="text-sm text-zinc-400">
                Try a lower protection level. Some complex scripts with loadstring or 
                dynamic code generation work better with Low or Medium presets.
              </p>
            </div>
            <div className="card p-5">
              <h3 className="font-semibold mb-2">Is my code stored anywhere?</h3>
              <p className="text-sm text-zinc-400">
                No. All obfuscation happens in your browser. Your code never leaves your device.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

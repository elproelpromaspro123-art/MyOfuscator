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
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">Lua Obfuscator</h1>
          <p className="text-zinc-500">Protect your Roblox scripts with advanced obfuscation</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
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
      </main>

      <Footer />
    </div>
  )
}

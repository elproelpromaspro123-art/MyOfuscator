'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SettingsPanel from '@/components/SettingsPanel'
import StatsPanel from '@/components/StatsPanel'
import { obfuscateCode, ObfuscationSettings } from '@/lib/obfuscator'

const CodeEditor = dynamic(() => import('@/components/CodeEditor'), { 
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-gray-900/50 rounded-lg flex items-center justify-center">
      <div className="text-cyan-400 animate-pulse">Loading editor...</div>
    </div>
  )
})

const defaultCode = `-- Your Lua code here
local function greet(name)
    print("Hello, " .. name .. "!")
end

local message = "This is a secret message"
local password = "super_secure_password_123"

for i = 1, 10 do
    greet("User " .. tostring(i))
end

return {
    greet = greet,
    version = "1.0.0"
}`

export default function Home() {
  const [inputCode, setInputCode] = useState(defaultCode)
  const [outputCode, setOutputCode] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    originalSize: 0,
    obfuscatedSize: 0,
    processingTime: 0,
    stepsApplied: 0,
  })
  const [settings, setSettings] = useState<ObfuscationSettings>({
    preset: 'Medium',
  })

  const handleObfuscate = useCallback(async () => {
    if (!inputCode.trim()) {
      setError('Please enter some Lua code to obfuscate')
      return
    }

    setIsProcessing(true)
    setError(null)

    const startTime = performance.now()

    try {
      const result = await obfuscateCode(inputCode, settings)
      const endTime = performance.now()

      setOutputCode(result.code)
      setStats({
        originalSize: inputCode.length,
        obfuscatedSize: result.code.length,
        processingTime: Math.round(endTime - startTime),
        stepsApplied: result.stepsApplied,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during obfuscation')
      setOutputCode('')
    } finally {
      setIsProcessing(false)
    }
  }, [inputCode, settings])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(outputCode)
  }, [outputCode])

  const handleDownload = useCallback(() => {
    const blob = new Blob([outputCode], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'obfuscated.lua'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [outputCode])

  return (
    <div className="min-h-screen bg-grid">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="glow-text text-cyan-400">PROMETHEUS</span>
            <span className="glow-text-pink text-pink-500 ml-3">OBFUSCATOR</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Professional Lua code protection for Roblox with string encryption, 
            anti-tamper, and advanced obfuscation techniques.
          </p>
        </motion.section>

        <div className="grid lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <SettingsPanel settings={settings} onChange={setSettings} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-3 space-y-6"
          >
            <div className="card-cyber p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  INPUT CODE
                </h2>
                <span className="text-sm text-gray-500">{inputCode.length} characters</span>
              </div>
              <div className="editor-container">
                <CodeEditor
                  value={inputCode}
                  onChange={(value) => setInputCode(value || '')}
                  language="lua"
                  height="350px"
                />
              </div>
            </div>

            <div className="flex justify-center">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleObfuscate}
                disabled={isProcessing}
                className="btn-cyber text-lg px-12 py-4 flex items-center gap-3"
              >
                {isProcessing ? (
                  <>
                    <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    PROCESSING...
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    OBFUSCATE
                  </>
                )}
              </motion.button>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 text-red-400"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {outputCode && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                >
                  <StatsPanel stats={stats} />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {outputCode && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="card-cyber p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-pink-400 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      OBFUSCATED OUTPUT
                    </h2>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCopy}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-cyan-500/30 rounded text-sm flex items-center gap-2 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </button>
                      <button
                        onClick={handleDownload}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-sm flex items-center gap-2 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </button>
                    </div>
                  </div>
                  <div className="editor-container">
                    <CodeEditor
                      value={outputCode}
                      language="lua"
                      height="350px"
                      readOnly
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16"
        >
          <h2 className="text-3xl font-bold text-center mb-8">
            <span className="glow-text text-cyan-400">PROTECTION</span>
            <span className="text-gray-400 ml-2">FEATURES</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '🔒', title: 'String Encryption', description: 'XOR-based encryption with unique keys per string' },
              { icon: '🛡️', title: 'Anti-Tamper', description: 'Environment validation to detect modifications' },
              { icon: '🔢', title: 'Number Obfuscation', description: 'Converts numbers to computed expressions' },
              { icon: '📝', title: 'Junk Code', description: 'Injects dead code to confuse analysis' },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="card-cyber p-6 text-center hover:border-cyan-400/50 transition-colors"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-bold text-cyan-400 mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </main>

      <Footer />
    </div>
  )
}

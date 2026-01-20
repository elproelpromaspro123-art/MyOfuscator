'use client'

import { ObfuscationSettings } from '@/lib/obfuscator'

interface Props {
  settings: ObfuscationSettings
  onChange: (s: ObfuscationSettings) => void
}

const presets = [
  { value: 'Low', label: 'Low', desc: 'Basic protection', strength: 25, color: '#22c55e' },
  { value: 'Medium', label: 'Medium', desc: 'XOR + Name obfuscation', strength: 50, color: '#eab308' },
  { value: 'High', label: 'High', desc: 'Control flow + Anti-dump', strength: 75, color: '#f97316' },
  { value: 'Maximum', label: 'Maximum', desc: 'VM wrapper + Full protection', strength: 100, color: '#ef4444' },
] as const

const features = [
  { name: 'String Encryption', levels: [1, 2, 3, 4] },
  { name: 'UTF-8 Encoding', levels: [1, 2, 3, 4] },
  { name: 'Junk Code Injection', levels: [1, 2, 3, 4] },
  { name: 'IIFE Wrapping', levels: [1, 2, 3, 4] },
  { name: 'Multi-Key XOR', levels: [2, 3, 4] },
  { name: 'Name Obfuscation', levels: [2, 3, 4] },
  { name: 'Environment Check', levels: [2, 3, 4] },
  { name: 'Opaque Predicates', levels: [2, 3, 4] },
  { name: 'Anti-Dump Protection', levels: [3, 4] },
  { name: 'Heavy Control Flow', levels: [3, 4] },
  { name: 'String Table Shuffle', levels: [3, 4] },
  { name: 'VM Wrapper', levels: [4] },
  { name: 'Runtime Mutation', levels: [4] },
  { name: 'Quad-Key Encryption', levels: [4] },
]

export default function SettingsPanel({ settings, onChange }: Props) {
  const current = presets.find(p => p.value === settings.preset) || presets[1]
  const currentLevel = presets.findIndex(p => p.value === settings.preset) + 1

  return (
    <div className="card p-6 space-y-6">
      {/* Target */}
      <div>
        <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Target Platform</h3>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-[#151519] border border-[#1f1f28]">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#a855f7] flex items-center justify-center">
            <span className="text-white text-xs font-bold">R</span>
          </div>
          <div>
            <div className="font-medium text-sm">Roblox / LuaU</div>
            <div className="text-xs text-zinc-500">All Executors Supported</div>
          </div>
          <div className="ml-auto">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse"></span>
          </div>
        </div>
      </div>

      {/* Protection Level */}
      <div>
        <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Protection Level</h3>
        <div className="space-y-2">
          {presets.map((p) => (
            <button
              key={p.value}
              onClick={() => onChange({ preset: p.value })}
              className={`preset-btn ${settings.preset === p.value ? 'active' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="font-semibold">{p.label}</span>
                </div>
                <span className="text-xs text-zinc-500">{p.strength}%</span>
              </div>
              <p className="text-xs text-zinc-500 mt-1 ml-6">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Strength Bar */}
      <div>
        <div className="flex justify-between text-xs text-zinc-500 mb-2">
          <span>Obfuscation Strength</span>
          <span className="font-mono">{current.strength}%</span>
        </div>
        <div className="h-2 bg-[#1f1f28] rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ 
              width: `${current.strength}%`,
              background: `linear-gradient(90deg, #22c55e 0%, #eab308 33%, #f97316 66%, #ef4444 100%)`
            }}
          />
        </div>
      </div>

      {/* Features List */}
      <div>
        <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
          Active Features ({features.filter(f => f.levels.includes(currentLevel)).length}/{features.length})
        </h3>
        <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {features.map(f => {
            const isActive = f.levels.includes(currentLevel)
            return (
              <div 
                key={f.name} 
                className={`flex items-center gap-3 py-2 px-3 rounded-lg transition-all ${isActive ? 'bg-[#151519]' : ''}`}
              >
                <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${
                  isActive ? 'bg-gradient-to-br from-[#6366f1] to-[#a855f7]' : 'bg-[#1f1f28]'
                }`}>
                  {isActive && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={`text-sm ${isActive ? 'text-white' : 'text-zinc-600'}`}>{f.name}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Info */}
      <div className="pt-4 border-t border-[#1f1f28] space-y-2">
        <div className="flex items-center gap-2 text-xs text-green-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>All strings encrypted & hidden</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-green-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>100% executor compatible</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-green-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>Client-side processing only</span>
        </div>
      </div>
    </div>
  )
}

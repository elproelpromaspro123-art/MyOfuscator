'use client'

import { ObfuscationSettings } from '@/lib/obfuscator'

interface Props {
  settings: ObfuscationSettings
  onChange: (s: ObfuscationSettings) => void
}

const presets = [
  { value: 'Low', label: 'Low', desc: 'Octal strings, basic wrap', strength: 25 },
  { value: 'Medium', label: 'Medium', desc: 'XOR encryption, var rename', strength: 50 },
  { value: 'High', label: 'High', desc: 'Custom Base64 + XOR', strength: 75 },
  { value: 'Maximum', label: 'Maximum', desc: 'Max layers, full protection', strength: 100 },
] as const

export default function SettingsPanel({ settings, onChange }: Props) {
  const current = presets.find(p => p.value === settings.preset) || presets[1]

  const features = [
    { name: 'Comment Removal', active: true },
    { name: 'Octal String Encoding', active: true },
    { name: 'XOR Encryption', active: settings.preset !== 'Low' },
    { name: 'Variable Renaming', active: settings.preset !== 'Low' },
    { name: 'Custom Base64', active: settings.preset === 'High' || settings.preset === 'Maximum' },
    { name: 'Opaque Predicates', active: settings.preset === 'High' || settings.preset === 'Maximum' },
    { name: 'Multi-Layer Wrap', active: settings.preset === 'High' || settings.preset === 'Maximum' },
    { name: 'Environment Checks', active: settings.preset !== 'Low' },
  ]

  return (
    <div className="card p-5 space-y-5">
      <div>
        <h3 className="text-sm font-medium text-zinc-400 mb-1">Target</h3>
        <div className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          <span>Roblox / LuaU</span>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-zinc-400 mb-3">Protection Level</h3>
        <div className="space-y-2">
          {presets.map(p => (
            <button
              key={p.value}
              onClick={() => onChange({ preset: p.value })}
              className={`preset-btn ${settings.preset === p.value ? 'active' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{p.label}</span>
                <span className="text-xs text-zinc-500">{p.strength}%</span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs text-zinc-500 mb-2">
          <span>Strength</span>
          <span>{current.strength}%</span>
        </div>
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${current.strength}%` }}
          />
        </div>
      </div>

      <div className="text-xs text-zinc-600 space-y-1 pt-2 border-t border-zinc-800">
        {features.map(f => (
          <div key={f.name} className="flex gap-2">
            <span className={f.active ? 'text-green-500' : 'text-zinc-700'}>●</span>
            <span>{f.name}</span>
          </div>
        ))}
      </div>

      <div className="text-xs text-zinc-600 pt-2 border-t border-zinc-800 space-y-1">
        <p>All strings encoded in octal format (\xxx)</p>
        <p>No loadstring in output - executor safe</p>
      </div>
    </div>
  )
}

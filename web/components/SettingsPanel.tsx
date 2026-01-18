'use client'

import { motion } from 'framer-motion'
import { ObfuscationSettings } from '@/lib/obfuscator'

interface SettingsPanelProps {
  settings: ObfuscationSettings
  onChange: (settings: ObfuscationSettings) => void
}

const presets = [
  { 
    value: 'Low', 
    label: 'Low', 
    color: 'from-green-500 to-green-600',
    description: 'String encryption + function wrap',
    strength: 25,
  },
  { 
    value: 'Medium', 
    label: 'Medium', 
    color: 'from-yellow-500 to-orange-500',
    description: 'Encryption + numbers + anti-tamper',
    strength: 50,
  },
  { 
    value: 'High', 
    label: 'High', 
    color: 'from-orange-500 to-red-500',
    description: 'All protections + junk code',
    strength: 75,
  },
  { 
    value: 'Maximum', 
    label: 'Maximum', 
    color: 'from-red-500 to-purple-600',
    description: 'Maximum protection layers',
    strength: 100,
  },
] as const

export default function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  const currentPreset = presets.find(p => p.value === settings.preset) || presets[1]

  return (
    <div className="card-cyber p-6 space-y-6">
      <h2 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        SETTINGS
      </h2>

      <div>
        <label className="block text-sm text-gray-400 mb-2 uppercase tracking-wider">Target</label>
        <div className="flex items-center gap-2 p-3 bg-gray-800/50 rounded-lg border border-pink-500/30">
          <span className="text-2xl">🎮</span>
          <div>
            <div className="text-pink-400 font-bold">Roblox / LuaU</div>
            <div className="text-xs text-gray-500">Optimized for modern executors</div>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-3 uppercase tracking-wider">Protection Level</label>
        <div className="space-y-2">
          {presets.map((preset) => (
            <motion.button
              key={preset.value}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChange({ preset: preset.value })}
              className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                settings.preset === preset.value
                  ? 'border-cyan-400 bg-cyan-500/10'
                  : 'border-gray-700 hover:border-gray-600 bg-gray-800/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${preset.color}`} />
                  <span className={`font-bold ${
                    settings.preset === preset.value ? 'text-cyan-400' : 'text-gray-300'
                  }`}>
                    {preset.label}
                  </span>
                </div>
                {settings.preset === preset.value && (
                  <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-6">{preset.description}</p>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-cyan-500/20">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-400">Protection Strength</span>
          <span className="text-cyan-400 font-bold">{currentPreset.strength}%</span>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${currentPreset.strength}%` }}
            transition={{ duration: 0.3 }}
            className={`h-full bg-gradient-to-r ${currentPreset.color}`}
          />
        </div>
      </div>

      <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700">
        <div className="text-xs text-gray-400 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>String Encryption</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={settings.preset !== 'Low' ? 'text-green-400' : 'text-gray-600'}>
              {settings.preset !== 'Low' ? '✓' : '○'}
            </span>
            <span className={settings.preset === 'Low' ? 'text-gray-600' : ''}>Number Obfuscation</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={settings.preset !== 'Low' ? 'text-green-400' : 'text-gray-600'}>
              {settings.preset !== 'Low' ? '✓' : '○'}
            </span>
            <span className={settings.preset === 'Low' ? 'text-gray-600' : ''}>Anti-Tamper</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={settings.preset === 'High' || settings.preset === 'Maximum' ? 'text-green-400' : 'text-gray-600'}>
              {settings.preset === 'High' || settings.preset === 'Maximum' ? '✓' : '○'}
            </span>
            <span className={settings.preset !== 'High' && settings.preset !== 'Maximum' ? 'text-gray-600' : ''}>Junk Code</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={settings.preset === 'High' || settings.preset === 'Maximum' ? 'text-green-400' : 'text-gray-600'}>
              {settings.preset === 'High' || settings.preset === 'Maximum' ? '✓' : '○'}
            </span>
            <span className={settings.preset !== 'High' && settings.preset !== 'Maximum' ? 'text-gray-600' : ''}>Opaque Predicates</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={settings.preset === 'Maximum' ? 'text-green-400' : 'text-gray-600'}>
              {settings.preset === 'Maximum' ? '✓' : '○'}
            </span>
            <span className={settings.preset !== 'Maximum' ? 'text-gray-600' : ''}>Extra Wrap Layer</span>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { motion } from 'framer-motion'
import { ObfuscationSettings } from '@/lib/obfuscator'

interface SettingsPanelProps {
  settings: ObfuscationSettings
  onChange: (settings: ObfuscationSettings) => void
}

const presets = [
  { value: 'Minify', label: 'Minify', color: 'green', description: 'Just minification, no obfuscation' },
  { value: 'Weak', label: 'Weak', color: 'yellow', description: 'Light obfuscation' },
  { value: 'Medium', label: 'Medium', color: 'orange', description: 'Balanced protection' },
  { value: 'Strong', label: 'Strong', color: 'red', description: 'Strong protection' },
  { value: 'Maximum', label: 'Maximum', color: 'purple', description: 'Maximum security' },
  { value: 'Performance', label: 'Performance', color: 'blue', description: 'Fast execution' },
  { value: 'LuaU', label: 'LuaU/Roblox', color: 'pink', description: 'Roblox optimized' },
  { value: 'Custom', label: 'Custom', color: 'gray', description: 'Configure manually' },
]

const luaVersions = [
  { value: 'Lua51', label: 'Lua 5.1' },
  { value: 'LuaU', label: 'LuaU (Roblox)' },
]

const nameGenerators = [
  { value: 'MangledShuffled', label: 'Mangled Shuffled' },
  { value: 'Mangled', label: 'Mangled' },
  { value: 'Il', label: 'Il (lI1)' },
  { value: 'Number', label: 'Numbers' },
  { value: 'Confuse', label: 'Confusing' },
  { value: 'Homoglyph', label: 'Homoglyph' },
  { value: 'Dictionary', label: 'Dictionary' },
  { value: 'Minimal', label: 'Minimal' },
]

const steps = [
  { key: 'encryptStrings', label: 'Encrypt Strings', icon: '🔒' },
  { key: 'vmify', label: 'Custom VM', icon: '🔐' },
  { key: 'antiTamper', label: 'Anti-Tamper', icon: '🛡️' },
  { key: 'controlFlowFlatten', label: 'Control Flow Flatten', icon: '🌀' },
  { key: 'opaquePredicates', label: 'Opaque Predicates', icon: '🎭' },
  { key: 'junkCode', label: 'Junk Code', icon: '📝' },
  { key: 'constantArray', label: 'Constant Array', icon: '📦' },
  { key: 'numbersToExpressions', label: 'Numbers → Expressions', icon: '🔢' },
  { key: 'wrapInFunction', label: 'Wrap In Function', icon: '📎' },
] as const

export default function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  const updatePreset = (preset: string) => {
    const newSteps = { ...settings.steps }
    
    // Apply preset configurations
    if (preset === 'Minify') {
      Object.keys(newSteps).forEach(key => {
        newSteps[key as keyof typeof newSteps] = false
      })
    } else if (preset === 'Weak') {
      Object.keys(newSteps).forEach(key => {
        newSteps[key as keyof typeof newSteps] = false
      })
      newSteps.vmify = true
      newSteps.constantArray = true
      newSteps.wrapInFunction = true
    } else if (preset === 'Medium') {
      Object.keys(newSteps).forEach(key => {
        newSteps[key as keyof typeof newSteps] = false
      })
      newSteps.encryptStrings = true
      newSteps.vmify = true
      newSteps.constantArray = true
      newSteps.numbersToExpressions = true
      newSteps.wrapInFunction = true
    } else if (preset === 'Strong') {
      Object.keys(newSteps).forEach(key => {
        newSteps[key as keyof typeof newSteps] = true
      })
      newSteps.controlFlowFlatten = false
      newSteps.opaquePredicates = false
      newSteps.junkCode = false
    } else if (preset === 'Maximum') {
      Object.keys(newSteps).forEach(key => {
        newSteps[key as keyof typeof newSteps] = true
      })
    } else if (preset === 'Performance') {
      Object.keys(newSteps).forEach(key => {
        newSteps[key as keyof typeof newSteps] = false
      })
      newSteps.encryptStrings = true
      newSteps.constantArray = true
      newSteps.wrapInFunction = true
    } else if (preset === 'LuaU') {
      Object.keys(newSteps).forEach(key => {
        newSteps[key as keyof typeof newSteps] = false
      })
      newSteps.encryptStrings = true
      newSteps.vmify = true
      newSteps.constantArray = true
      newSteps.numbersToExpressions = true
      newSteps.wrapInFunction = true
      onChange({
        ...settings,
        preset,
        luaVersion: 'LuaU',
        steps: newSteps,
      })
      return
    }

    onChange({
      ...settings,
      preset,
      steps: newSteps,
    })
  }

  const toggleStep = (key: keyof typeof settings.steps) => {
    onChange({
      ...settings,
      preset: 'Custom',
      steps: {
        ...settings.steps,
        [key]: !settings.steps[key],
      },
    })
  }

  return (
    <div className="card-cyber p-6 space-y-6">
      <h2 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        SETTINGS
      </h2>

      {/* Preset Selection */}
      <div>
        <label className="block text-sm text-gray-400 mb-2 uppercase tracking-wider">Preset</label>
        <select
          value={settings.preset}
          onChange={(e) => updatePreset(e.target.value)}
          className="select-cyber"
        >
          {presets.map((preset) => (
            <option key={preset.value} value={preset.value}>
              {preset.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          {presets.find(p => p.value === settings.preset)?.description}
        </p>
      </div>

      {/* Lua Version */}
      <div>
        <label className="block text-sm text-gray-400 mb-2 uppercase tracking-wider">Lua Version</label>
        <select
          value={settings.luaVersion}
          onChange={(e) => onChange({ ...settings, luaVersion: e.target.value })}
          className="select-cyber"
        >
          {luaVersions.map((version) => (
            <option key={version.value} value={version.value}>
              {version.label}
            </option>
          ))}
        </select>
      </div>

      {/* Name Generator */}
      <div>
        <label className="block text-sm text-gray-400 mb-2 uppercase tracking-wider">Name Generator</label>
        <select
          value={settings.nameGenerator}
          onChange={(e) => onChange({ ...settings, nameGenerator: e.target.value })}
          className="select-cyber"
        >
          {nameGenerators.map((gen) => (
            <option key={gen.value} value={gen.value}>
              {gen.label}
            </option>
          ))}
        </select>
      </div>

      {/* Steps */}
      <div>
        <label className="block text-sm text-gray-400 mb-3 uppercase tracking-wider">Obfuscation Steps</label>
        <div className="space-y-2">
          {steps.map((step) => (
            <motion.label
              key={step.key}
              whileHover={{ x: 4 }}
              className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-gray-800/50 transition-colors"
            >
              <input
                type="checkbox"
                checked={settings.steps[step.key]}
                onChange={() => toggleStep(step.key)}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                settings.steps[step.key] 
                  ? 'bg-cyan-500 border-cyan-400' 
                  : 'border-gray-600 hover:border-cyan-500/50'
              }`}>
                {settings.steps[step.key] && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-lg">{step.icon}</span>
              <span className="text-sm text-gray-300">{step.label}</span>
            </motion.label>
          ))}
        </div>
      </div>

      {/* Active Steps Count */}
      <div className="pt-4 border-t border-cyan-500/20">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Active Steps</span>
          <span className="text-cyan-400 font-bold">
            {Object.values(settings.steps).filter(Boolean).length} / {steps.length}
          </span>
        </div>
        <div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ 
              width: `${(Object.values(settings.steps).filter(Boolean).length / steps.length) * 100}%` 
            }}
            className="h-full bg-gradient-to-r from-cyan-500 to-pink-500"
          />
        </div>
      </div>
    </div>
  )
}

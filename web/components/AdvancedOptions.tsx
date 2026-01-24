'use client'

import { useState } from 'react'
import type { ObfuscationOptions } from '@/lib/obfuscator'

interface Props {
  options: ObfuscationOptions
  onChange: (options: ObfuscationOptions) => void
}

const presets = [
  {
    name: 'Ultimate 2026',
    description: 'Maximum protection with all features enabled',
    options: {
      mbaLevel: 5,
      controlFlowDensity: 0.9,
      stringEncryptionLayers: 4,
      opaquePredicateDensity: 0.7,
      junkCodeDensity: 0.5,
      referenceHiding: true,
      antiTamper: true,
    }
  },
  {
    name: 'Performance',
    description: 'Fast execution with essential protection',
    options: {
      mbaLevel: 2,
      controlFlowDensity: 0.3,
      stringEncryptionLayers: 2,
      opaquePredicateDensity: 0.2,
      junkCodeDensity: 0.1,
      referenceHiding: true,
      antiTamper: false,
    }
  },
  {
    name: 'Stealth',
    description: 'Code looks legitimate but protected',
    options: {
      mbaLevel: 3,
      controlFlowDensity: 0.5,
      stringEncryptionLayers: 3,
      opaquePredicateDensity: 0.3,
      junkCodeDensity: 0.2,
      referenceHiding: true,
      antiTamper: true,
    }
  },
  {
    name: 'Balanced',
    description: 'Good balance of protection and size',
    options: {
      mbaLevel: 3,
      controlFlowDensity: 0.6,
      stringEncryptionLayers: 3,
      opaquePredicateDensity: 0.4,
      junkCodeDensity: 0.3,
      referenceHiding: true,
      antiTamper: true,
    }
  },
]

export default function AdvancedOptions({ options, onChange }: Props) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<string | null>('Balanced')

  const handlePresetSelect = (preset: typeof presets[0]) => {
    setSelectedPreset(preset.name)
    onChange(preset.options as ObfuscationOptions)
  }

  const handleSliderChange = (key: keyof ObfuscationOptions, value: number) => {
    setSelectedPreset(null)
    onChange({ ...options, [key]: value })
  }

  const handleToggleChange = (key: keyof ObfuscationOptions, value: boolean) => {
    setSelectedPreset(null)
    onChange({ ...options, [key]: value })
  }

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#151519] transition-colors"
      >
        <div className="flex items-center gap-3">
          <svg 
            className={`w-5 h-5 text-[#6366f1] transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="font-medium">Advanced Options</span>
          <span className="badge badge-success text-xs">2026 Edition</span>
        </div>
        <span className="text-sm text-zinc-500">
          {selectedPreset || 'Custom'}
        </span>
      </button>

      {isExpanded && (
        <div className="px-5 pb-5 border-t border-[#1f1f28] fade-in">
          {/* Presets */}
          <div className="py-4">
            <h4 className="text-sm font-medium text-zinc-400 mb-3">Presets</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handlePresetSelect(preset)}
                  className={`preset-btn text-center py-3 ${selectedPreset === preset.name ? 'active' : ''}`}
                >
                  <div className="font-medium text-sm">{preset.name}</div>
                  <div className="text-xs text-zinc-500 mt-1">{preset.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-5 py-4 border-t border-[#1f1f28]">
            <h4 className="text-sm font-medium text-zinc-400">Fine-tune Protection</h4>
            
            {/* MBA Level */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm text-zinc-300">MBA Obfuscation Level</label>
                <span className="text-sm text-[#6366f1] font-mono">{options.mbaLevel}/5</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                value={options.mbaLevel}
                onChange={(e) => handleSliderChange('mbaLevel', parseInt(e.target.value))}
                className="w-full accent-[#6366f1]"
              />
              <p className="text-xs text-zinc-500 mt-1">
                Transforms arithmetic expressions using Mixed Boolean-Arithmetic identities
              </p>
            </div>

            {/* Control Flow Density */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm text-zinc-300">Control Flow Density</label>
                <span className="text-sm text-[#6366f1] font-mono">{Math.round(options.controlFlowDensity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={options.controlFlowDensity * 100}
                onChange={(e) => handleSliderChange('controlFlowDensity', parseInt(e.target.value) / 100)}
                className="w-full accent-[#6366f1]"
              />
              <p className="text-xs text-zinc-500 mt-1">
                Probability of applying state-machine dispatcher pattern
              </p>
            </div>

            {/* String Encryption Layers */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm text-zinc-300">String Encryption Layers</label>
                <span className="text-sm text-[#6366f1] font-mono">{options.stringEncryptionLayers}/4</span>
              </div>
              <input
                type="range"
                min="1"
                max="4"
                value={options.stringEncryptionLayers}
                onChange={(e) => handleSliderChange('stringEncryptionLayers', parseInt(e.target.value))}
                className="w-full accent-[#6366f1]"
              />
              <p className="text-xs text-zinc-500 mt-1">
                Number of encryption layers (XOR, rotation, permutation)
              </p>
            </div>

            {/* Opaque Predicate Density */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm text-zinc-300">Opaque Predicates</label>
                <span className="text-sm text-[#6366f1] font-mono">{Math.round(options.opaquePredicateDensity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={options.opaquePredicateDensity * 100}
                onChange={(e) => handleSliderChange('opaquePredicateDensity', parseInt(e.target.value) / 100)}
                className="w-full accent-[#6366f1]"
              />
              <p className="text-xs text-zinc-500 mt-1">
                Complex always-true/false conditions based on number theory
              </p>
            </div>

            {/* Junk Code Density */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm text-zinc-300">Junk Code Density</label>
                <span className="text-sm text-[#6366f1] font-mono">{Math.round(options.junkCodeDensity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={options.junkCodeDensity * 100}
                onChange={(e) => handleSliderChange('junkCodeDensity', parseInt(e.target.value) / 100)}
                className="w-full accent-[#6366f1]"
              />
              <p className="text-xs text-zinc-500 mt-1">
                Polymorphic dead code to confuse static analysis
              </p>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3 py-4 border-t border-[#1f1f28]">
            <h4 className="text-sm font-medium text-zinc-400">Features</h4>
            
            <label className="flex items-center justify-between cursor-pointer group">
              <div>
                <span className="text-sm text-zinc-300">Reference Hiding</span>
                <p className="text-xs text-zinc-500">Localize and obfuscate global references</p>
              </div>
              <div className={`relative w-12 h-6 rounded-full transition-colors ${options.referenceHiding ? 'bg-[#6366f1]' : 'bg-[#1f1f28]'}`}>
                <input
                  type="checkbox"
                  checked={options.referenceHiding}
                  onChange={(e) => handleToggleChange('referenceHiding', e.target.checked)}
                  className="sr-only"
                />
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${options.referenceHiding ? 'translate-x-7' : 'translate-x-1'}`} />
              </div>
            </label>

            <label className="flex items-center justify-between cursor-pointer group">
              <div>
                <span className="text-sm text-zinc-300">Anti-Tamper</span>
                <p className="text-xs text-zinc-500">Runtime integrity checks with silent corruption</p>
              </div>
              <div className={`relative w-12 h-6 rounded-full transition-colors ${options.antiTamper ? 'bg-[#6366f1]' : 'bg-[#1f1f28]'}`}>
                <input
                  type="checkbox"
                  checked={options.antiTamper}
                  onChange={(e) => handleToggleChange('antiTamper', e.target.checked)}
                  className="sr-only"
                />
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${options.antiTamper ? 'translate-x-7' : 'translate-x-1'}`} />
              </div>
            </label>
          </div>

          {/* Protection Level Indicator */}
          <div className="py-4 border-t border-[#1f1f28]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-400">Protection Level</span>
              <span className="text-sm font-bold text-[#6366f1]">
                {calculateProtectionLevel(options)}%
              </span>
            </div>
            <div className="h-2 bg-[#1f1f28] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-full transition-all"
                style={{ width: `${calculateProtectionLevel(options)}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function calculateProtectionLevel(options: ObfuscationOptions): number {
  let level = 0
  level += (options.mbaLevel / 5) * 20
  level += options.controlFlowDensity * 20
  level += (options.stringEncryptionLayers / 4) * 20
  level += options.opaquePredicateDensity * 15
  level += options.junkCodeDensity * 10
  level += options.referenceHiding ? 10 : 0
  level += options.antiTamper ? 5 : 0
  return Math.round(Math.min(100, level))
}

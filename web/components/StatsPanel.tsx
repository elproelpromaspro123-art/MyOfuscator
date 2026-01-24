'use client'

import type { ProtectionStats } from '@/lib/obfuscator'

interface Props {
  stats: {
    originalSize: number
    obfuscatedSize: number
    processingTime: number
    protections?: ProtectionStats
  }
}

export default function StatsPanel({ stats }: Props) {
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  const expansion = stats.originalSize > 0 
    ? ((stats.obfuscatedSize / stats.originalSize)).toFixed(1)
    : '0'

  const protectionLevel = stats.protections 
    ? Math.min(100, Math.round(
        (stats.protections.stringsEncrypted * 3 +
         stats.protections.controlFlowBlocks * 8 +
         stats.protections.opaquePredicates * 5 +
         stats.protections.mbaTransformations * 2 +
         stats.protections.junkCodeInserted * 2 +
         stats.protections.referencesHidden * 0.5) / 2
      ))
    : 85

  return (
    <div className="space-y-3 fade-in">
      {/* Main Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="card p-4 text-center group hover:border-[#6366f1]/50 transition-all">
          <div className="flex items-center justify-center gap-2 mb-1">
            <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-xs text-zinc-500">Original</span>
          </div>
          <div className="text-2xl font-bold gradient-text">{formatBytes(stats.originalSize)}</div>
        </div>
        <div className="card p-4 text-center group hover:border-[#6366f1]/50 transition-all">
          <div className="flex items-center justify-center gap-2 mb-1">
            <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-xs text-zinc-500">Protected</span>
          </div>
          <div className="text-2xl font-bold gradient-text">{formatBytes(stats.obfuscatedSize)}</div>
        </div>
        <div className="card p-4 text-center group hover:border-[#6366f1]/50 transition-all">
          <div className="flex items-center justify-center gap-2 mb-1">
            <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-xs text-zinc-500">Time</span>
          </div>
          <div className="text-2xl font-bold gradient-text">{stats.processingTime}ms</div>
        </div>
        <div className="card p-4 text-center group hover:border-[#6366f1]/50 transition-all">
          <div className="flex items-center justify-center gap-2 mb-1">
            <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-xs text-zinc-500">Security</span>
          </div>
          <div className="text-2xl font-bold gradient-text">{protectionLevel}%</div>
        </div>
      </div>

      {/* Protection Breakdown */}
      {stats.protections && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-[#6366f1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-sm font-medium text-zinc-300">Protection Breakdown</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <ProtectionItem 
              label="Strings Encrypted" 
              value={stats.protections.stringsEncrypted}
              icon="🔐"
            />
            <ProtectionItem 
              label="Control Flow Blocks" 
              value={stats.protections.controlFlowBlocks}
              icon="🔀"
            />
            <ProtectionItem 
              label="Opaque Predicates" 
              value={stats.protections.opaquePredicates}
              icon="🧮"
            />
            <ProtectionItem 
              label="MBA Transforms" 
              value={stats.protections.mbaTransformations}
              icon="⚡"
            />
            <ProtectionItem 
              label="Junk Code" 
              value={stats.protections.junkCodeInserted}
              icon="📦"
            />
            <ProtectionItem 
              label="Hidden Refs" 
              value={stats.protections.referencesHidden}
              icon="👁️"
            />
          </div>
        </div>
      )}

      {/* Expansion info */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#0f0f12] rounded-lg text-sm">
        <span className="text-zinc-500">Size expansion</span>
        <span className="text-zinc-300 font-mono">{expansion}x</span>
      </div>
    </div>
  )
}

function ProtectionItem({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-[#0f0f12]">
      <span className="text-lg">{icon}</span>
      <div>
        <div className="text-lg font-bold text-white">{value}</div>
        <div className="text-xs text-zinc-500">{label}</div>
      </div>
    </div>
  )
}

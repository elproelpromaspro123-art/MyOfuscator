'use client'

interface Props {
  stats: {
    originalSize: number
    obfuscatedSize: number
    processingTime: number
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

  return (
    <div className="space-y-3 fade-in">
      {/* Main Stats */}
      <div className="grid grid-cols-3 gap-3">
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
      </div>

      {/* Expansion info */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#0f0f12] rounded-lg text-sm">
        <span className="text-zinc-500">Size expansion</span>
        <span className="text-zinc-300 font-mono">{expansion}x</span>
      </div>
    </div>
  )
}

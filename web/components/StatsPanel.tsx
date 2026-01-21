'use client'

interface Props {
  stats: {
    originalSize: number
    obfuscatedSize: number
    processingTime: number
    stepsApplied: number
  }
}

export default function StatsPanel({ stats }: Props) {
  const ratio = stats.originalSize > 0 
    ? ((stats.obfuscatedSize / stats.originalSize) * 100).toFixed(0) 
    : '0'
  
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  const expansion = stats.originalSize > 0 
    ? ((stats.obfuscatedSize / stats.originalSize)).toFixed(1)
    : '0'

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 fade-in">
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <span className="text-xs text-zinc-500">Expansion</span>
        </div>
        <div className="text-2xl font-bold gradient-text">{expansion}x</div>
      </div>
      <div className="card p-4 text-center group hover:border-[#6366f1]/50 transition-all">
        <div className="flex items-center justify-center gap-2 mb-1">
          <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="text-xs text-zinc-500">Layers</span>
        </div>
        <div className="text-2xl font-bold gradient-text">{stats.stepsApplied}</div>
      </div>
    </div>
  )
}

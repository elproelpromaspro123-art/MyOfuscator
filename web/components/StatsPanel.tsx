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

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 fade-in">
      <div className="card p-4 text-center">
        <div className="text-2xl font-bold gradient-text">{formatBytes(stats.originalSize)}</div>
        <div className="text-xs text-zinc-500 mt-1">Original Size</div>
      </div>
      <div className="card p-4 text-center">
        <div className="text-2xl font-bold gradient-text">{formatBytes(stats.obfuscatedSize)}</div>
        <div className="text-xs text-zinc-500 mt-1">Obfuscated Size</div>
      </div>
      <div className="card p-4 text-center">
        <div className="text-2xl font-bold gradient-text">{ratio}%</div>
        <div className="text-xs text-zinc-500 mt-1">Size Ratio</div>
      </div>
      <div className="card p-4 text-center">
        <div className="text-2xl font-bold gradient-text">{stats.stepsApplied}</div>
        <div className="text-xs text-zinc-500 mt-1">Steps Applied</div>
      </div>
    </div>
  )
}

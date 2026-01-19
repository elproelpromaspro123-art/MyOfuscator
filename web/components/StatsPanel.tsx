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

  return (
    <div className="card p-4 fade-in">
      <div className="grid grid-cols-4 gap-4 text-center">
        <div>
          <p className="text-2xl font-semibold">{stats.originalSize}</p>
          <p className="text-xs text-zinc-500">Original</p>
        </div>
        <div>
          <p className="text-2xl font-semibold">{stats.obfuscatedSize}</p>
          <p className="text-xs text-zinc-500">Obfuscated</p>
        </div>
        <div>
          <p className="text-2xl font-semibold">{ratio}%</p>
          <p className="text-xs text-zinc-500">Ratio</p>
        </div>
        <div>
          <p className="text-2xl font-semibold">{stats.processingTime}ms</p>
          <p className="text-xs text-zinc-500">Time</p>
        </div>
      </div>
    </div>
  )
}

'use client'

import { motion } from 'framer-motion'

interface StatsPanelProps {
  stats: {
    originalSize: number
    obfuscatedSize: number
    processingTime: number
    stepsApplied: number
  }
}

export default function StatsPanel({ stats }: StatsPanelProps) {
  const sizeIncrease = stats.originalSize > 0 
    ? ((stats.obfuscatedSize / stats.originalSize) * 100).toFixed(1)
    : '0'

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const statsItems = [
    {
      label: 'Original Size',
      value: formatBytes(stats.originalSize),
      icon: '📄',
      color: 'cyan',
    },
    {
      label: 'Obfuscated Size',
      value: formatBytes(stats.obfuscatedSize),
      icon: '🔐',
      color: 'pink',
    },
    {
      label: 'Size Ratio',
      value: `${sizeIncrease}%`,
      icon: '📊',
      color: 'yellow',
    },
    {
      label: 'Processing Time',
      value: `${stats.processingTime}ms`,
      icon: '⚡',
      color: 'green',
    },
    {
      label: 'Steps Applied',
      value: stats.stepsApplied.toString(),
      icon: '🔧',
      color: 'purple',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {statsItems.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="stats-card"
        >
          <div className="text-2xl mb-2">{item.icon}</div>
          <div className={`stats-value text-${item.color}-400`}>
            {item.value}
          </div>
          <div className="stats-label">{item.label}</div>
        </motion.div>
      ))}
    </div>
  )
}

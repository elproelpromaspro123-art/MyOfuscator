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

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0 }}
        className="stats-card"
      >
        <div className="text-2xl mb-2">📄</div>
        <div className="stats-value text-cyan-400">{formatBytes(stats.originalSize)}</div>
        <div className="stats-label">Original Size</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="stats-card"
      >
        <div className="text-2xl mb-2">🔐</div>
        <div className="stats-value text-pink-400">{formatBytes(stats.obfuscatedSize)}</div>
        <div className="stats-label">Obfuscated Size</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="stats-card"
      >
        <div className="text-2xl mb-2">📊</div>
        <div className="stats-value text-yellow-400">{sizeIncrease}%</div>
        <div className="stats-label">Size Ratio</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="stats-card"
      >
        <div className="text-2xl mb-2">⚡</div>
        <div className="stats-value text-green-400">{stats.processingTime}ms</div>
        <div className="stats-label">Processing Time</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="stats-card"
      >
        <div className="text-2xl mb-2">🔧</div>
        <div className="stats-value text-purple-400">{stats.stepsApplied}</div>
        <div className="stats-label">Steps Applied</div>
      </motion.div>
    </div>
  )
}

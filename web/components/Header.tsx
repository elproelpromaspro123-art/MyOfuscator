'use client'

export default function Header() {
  return (
    <header className="border-b border-zinc-800">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-6xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="font-semibold text-lg">Prometheus</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-zinc-500">
          <a 
            href="https://github.com/prometheus-lua/Prometheus" 
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </header>
  )
}

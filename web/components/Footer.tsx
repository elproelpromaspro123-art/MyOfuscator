'use client'

export default function Footer() {
  return (
    <footer className="border-t border-[#1f1f28] py-8 bg-[#0a0a0c]">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold bg-gradient-to-r from-[#6366f1] to-[#a855f7] bg-clip-text text-transparent">Prometheus</span>
            <span className="text-zinc-500 text-sm">• by Levno_710</span>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-zinc-400">
            <a 
              href="https://github.com/prometheus-lua/Prometheus" 
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
            <a 
              href="https://levno-710.gitbook.io/prometheus" 
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Documentation
            </a>
            <a 
              href="https://templo-steel.vercel.app/" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
            >
              Scripts Hub
              <span>↗</span>
            </a>
          </div>
          
          <div className="text-zinc-500 text-sm">
            © 2026 Prometheus Obfuscator
          </div>
        </div>
      </div>
    </footer>
  )
}

'use client'

export default function Footer() {
  return (
    <footer className="border-t border-[#1f1f28] mt-20">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#a855f7] flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <span className="font-bold text-lg">Prometheus</span>
            </div>
            <p className="text-sm text-zinc-500 max-w-sm leading-relaxed">
              Professional Lua obfuscator designed specifically for Roblox executors. 
              Protect your scripts with military-grade encryption.
            </p>
          </div>
          
          {/* Links */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-zinc-300">Resources</h4>
            <ul className="space-y-3 text-sm text-zinc-500">
              <li>
                <a href="#features" className="hover:text-white transition-colors">Features</a>
              </li>
              <li>
                <a href="#comparison" className="hover:text-white transition-colors">Comparison</a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
              </li>
            </ul>
          </div>
          
          {/* External */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-zinc-300">Links</h4>
            <ul className="space-y-3 text-sm text-zinc-500">
              <li>
                <a 
                  href="https://templo-steel.vercel.app/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-2"
                >
                  Scripts Hub
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com/prometheus-lua/Prometheus" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-2"
                >
                  GitHub
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom */}
        <div className="pt-8 border-t border-[#1f1f28] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-zinc-600">
            <span>© 2026 Prometheus Obfuscator</span>
            <span className="text-zinc-700">•</span>
            <span>Built for Roblox / LuaU</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-xs text-zinc-500">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

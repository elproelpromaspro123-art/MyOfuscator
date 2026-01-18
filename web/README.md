# 🔥 Prometheus Obfuscator Web

A beautiful cyberpunk-themed web interface for the Prometheus Lua Obfuscator.

![Prometheus Web Interface](https://img.shields.io/badge/Next.js-14.2-black?logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwindcss)

## ✨ Features

- 🎨 **Cyberpunk UI** - Beautiful neon-themed design with animations
- 📝 **Monaco Editor** - Full-featured code editor with Lua syntax highlighting
- ⚙️ **Configurable** - All obfuscation steps can be toggled individually
- 📊 **Statistics** - Real-time stats showing size changes and processing time
- 📱 **Responsive** - Works on desktop and mobile devices
- 🚀 **Fast** - Instant client-side obfuscation

## 🛠️ Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Monaco Editor** - VS Code's editor

## 🚀 Quick Start

### Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

## 🌐 Deploy to Vercel

### Option 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/Prometheus&root-directory=web)

### Option 2: Manual Deploy

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. **Important:** Set Root Directory to `web`
5. Click Deploy!

### Option 3: Vercel CLI

```bash
npm i -g vercel
cd web
vercel
```

## 📋 Available Presets

| Preset | Description |
|--------|-------------|
| Minify | Just minification, no obfuscation |
| Weak | Light obfuscation |
| Medium | Balanced protection (default) |
| Strong | Strong protection with VM |
| Maximum | Maximum security with all steps |
| Performance | Fast execution, minimal overhead |
| LuaU/Roblox | Optimized for Roblox environment |

## 🔧 Obfuscation Steps

| Step | Description |
|------|-------------|
| Encrypt Strings | Multi-layer XOR encryption for strings |
| Custom VM | Compiles to custom bytecode |
| Anti-Tamper | Detects code modifications |
| Control Flow Flatten | Transforms to state machines |
| Opaque Predicates | Adds complex always-true conditions |
| Junk Code | Inserts dead code |
| Constant Array | Pools constants together |
| Numbers → Expressions | Replaces numbers with math |
| Wrap In Function | Wraps code in closure |

## 📁 Project Structure

```
web/
├── app/
│   ├── globals.css      # Global styles
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Main page
├── components/
│   ├── CodeEditor.tsx   # Monaco editor wrapper
│   ├── Footer.tsx       # Page footer
│   ├── Header.tsx       # Page header
│   ├── SettingsPanel.tsx # Obfuscation settings
│   └── StatsPanel.tsx   # Statistics display
├── lib/
│   └── obfuscator.ts    # Client-side obfuscation
├── public/
│   └── favicon.svg      # Site icon
└── ...config files
```

## 📄 License

GNU AGPL v3 - See [LICENSE](../LICENSE)

# Prometheus Obfuscator Web

A modern web interface for the Prometheus Lua Obfuscator.

## Features

- 🎨 Beautiful cyberpunk-themed UI
- 📝 Monaco code editor with Lua syntax highlighting
- ⚙️ Configurable obfuscation settings
- 📊 Real-time statistics
- 📱 Fully responsive design
- 🚀 Ready for Vercel deployment

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Monaco Editor** - Code editing

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
cd web
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
```

## Deployment to Vercel

### Option 1: Vercel CLI

```bash
npm i -g vercel
vercel
```

### Option 2: GitHub Integration

1. Push this repository to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import the repository
4. Set the root directory to `web`
5. Deploy!

## Available Presets

| Preset | Description |
|--------|-------------|
| Minify | Just minification, no obfuscation |
| Weak | Light obfuscation |
| Medium | Balanced protection |
| Strong | Strong protection with VM |
| Maximum | Maximum security with all steps |
| Performance | Fast execution, minimal overhead |
| LuaU/Roblox | Optimized for Roblox environment |

## Obfuscation Steps

- **Encrypt Strings** - Multi-layer string encryption
- **Custom VM** - Compiles to custom bytecode
- **Anti-Tamper** - Detects code modifications
- **Control Flow Flatten** - Converts to state machine
- **Opaque Predicates** - Complex always-true conditions
- **Junk Code** - Dead code insertion
- **Constant Array** - Moves constants to array
- **Numbers → Expressions** - Replaces numbers with math
- **Wrap In Function** - Wraps code in closure

## License

GNU AGPL v3 - See [LICENSE](../LICENSE)

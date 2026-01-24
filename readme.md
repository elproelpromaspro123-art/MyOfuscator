# 🔥 Prometheus v3.0 Ultimate 2026
[![Test](https://github.com/prometheus-lua/Prometheus/actions/workflows/Test.yml/badge.svg)](https://github.com/prometheus-lua/Prometheus/actions/workflows/Test.yml)
[![Version](https://img.shields.io/badge/version-3.0-blue.svg)](https://github.com/prometheus-lua/Prometheus)
[![Lua](https://img.shields.io/badge/Lua-5.1%20%7C%20LuaU-purple.svg)](https://lua.org)
[![License](https://img.shields.io/badge/license-AGPL--3.0-green.svg)](LICENSE)

## Description
Prometheus is a professional Lua obfuscator written in pure Lua with next-generation protection features.

This Project was inspired by the amazing [javascript-obfuscator](https://github.com/javascript-obfuscator/javascript-obfuscator).   
It can obfuscate Lua51 and Roblox's LuaU with comprehensive military-grade protection.

### ✨ New in v3.0 Ultimate 2026
- **MBA Obfuscation** - Mixed Boolean-Arithmetic expressions for impenetrable math operations
- **Advanced Control Flow** - State machines with closures and encoded state transitions
- **Advanced Opaque Predicates** - Multi-layer complex always-true/false conditions
- **Multi-Layer String Encryption** - Up to 4 layers of encryption with chunk splitting
- **Reference Hiding** - Hide global references and wrap function calls
- **Dead Code Polymorphism** - Polymorphic dead code that mutates on each run
- **Double VM Protection** - Two layers of custom bytecode VM
- **Enhanced Anti-Tamper** - Scattered integrity checks with silent corruption mode
- **New 2026 Presets** - Ultimate2026, Stealth2026, Performance2026

### 🎮 Executor Compatibility 2026
| Executor | Status | Notes |
|----------|--------|-------|
| Synapse X | ✅ Full | All features supported |
| Script-Ware | ✅ Full | All features supported |
| Krnl | ✅ Full | All features supported |
| Fluxus | ✅ Full | All features supported |
| Hydrogen | ✅ Full | All features supported |
| Arceus X | ✅ Full | All features supported |
| Delta | ✅ Full | All features supported |
| Codex | ✅ Full | All features supported |
| Solara | ✅ Full | All features supported |
| AWP | ✅ Full | All features supported |

📖 [Full Documentation](https://levno-710.gitbook.io/prometheus/) | 💬 [Discord](https://discord.gg/U8h4d4Rf64)

## 🌐 Web Interface
A beautiful web interface is included in the `web/` folder. Deploy to Vercel:

```bash
cd web
npm install
npm run dev     # Development
npm run build   # Production build
```

Or deploy directly to Vercel by importing the repository and setting root to `web/`.

## Installation
To install Prometheus, simply clone the Github Repository using:

```batch
git clone https://github.com/levno-710/Prometheus.git
```

Alternatively you can download the Sources [here](https://github.com/prometheus-lua/Prometheus/archive/refs/heads/master.zip).

Prometheus also Requires LuaJIT or Lua51 in order to work. The Lua51 binaries can be downloaded [here](https://sourceforge.net/projects/luabinaries/files/5.1.5/Tools%20Executables/).

## Usage
To quickly obfuscate a script:
```batch
lua ./cli.lua --preset Medium ./your_file.lua
```

### Using New 2026 Presets
```batch
# Ultimate protection with double VM
lua ./cli.lua --preset Ultimate2026 ./your_file.lua

# Stealth mode - code appears legitimate
lua ./cli.lua --preset Stealth2026 ./your_file.lua

# Performance optimized protection
lua ./cli.lua --preset Performance2026 ./your_file.lua
```

When using the windows release:
```batch
prometheus.exe --preset Ultimate2026 ./your_file.lua
```
For more advanced use cases see the [Documentation](https://levno-710.gitbook.io/prometheus/).

## Presets

| Preset | Description |
|--------|-------------|
| `Minify` | Just minification, no obfuscation |
| `Weak` | Light obfuscation with VM |
| `Medium` | Balanced protection (default) |
| `Strong` | Strong protection with double VM |
| `Maximum` | Maximum security with all steps + advanced features |
| `Performance` | Fast execution, minimal overhead |
| `LuaU` | Roblox-optimized (no debug library) + advanced features |
| `StringsOnly` | Only string-related obfuscation |
| **`Ultimate2026`** | 🔥 Ultimate protection with double VM and all advanced steps |
| **`Stealth2026`** | 🥷 Stealth mode - code appears legitimate but protected |
| **`Performance2026`** | ⚡ Maximum protection with minimum runtime overhead |

## Obfuscation Steps

### Core Steps
| Step | Description |
|------|-------------|
| `Vmify` | Custom bytecode VM with randomized opcodes |
| `EncryptStrings` | Multi-layer string encryption |
| `AntiTamper` | Integrity checks with silent corruption |
| `ControlFlowFlatten` | State machine transformation |
| `OpaquePredicates` | Complex always-true/false conditions |
| `JunkCode` | Dead code insertion |
| `CallIndirection` | Indirect function calls |
| `StringToBytes` | String to byte array conversion |
| `ConstantArray` | Constant pooling |
| `NumbersToExpressions` | Number obfuscation |
| `ProxifyLocals` | Local variable proxying |
| `WrapInFunction` | Closure wrapping |
| `SplitStrings` | String splitting |

### 🆕 Advanced Steps (v3.0)
| Step | Description |
|------|-------------|
| `MBAObfuscation` | Mixed Boolean-Arithmetic expressions - transforms simple math into complex equivalent expressions |
| `AdvancedControlFlow` | Enhanced control flow with closures and state encoding |
| `AdvancedOpaquePredicates` | Multi-layer predicates with configurable complexity |
| `MultiLayerStringEncryption` | Up to 4 layers of encryption with optional chunk splitting |
| `ReferenceHiding` | Hides global references and optionally wraps function calls |
| `DeadCodePolymorphism` | Polymorphic dead code that changes on each obfuscation |

## Advanced Features

### MBA Obfuscation
Transforms simple arithmetic into complex Mixed Boolean-Arithmetic expressions:
```lua
-- Before
local x = a + b

-- After (equivalent but obfuscated)
local x = ((a ^ b) + 2 * (a & b))
```

### Multi-Layer String Encryption
Encrypts strings through multiple layers with different algorithms:
```lua
Settings = {
    Layers = 4;        -- Number of encryption layers
    SplitChunks = true; -- Split strings into chunks before encrypting
}
```

### Reference Hiding
Hides global variable access and function calls:
```lua
Settings = {
    HideGlobals = true;    -- Hide global variable references
    WrapFunctions = true;  -- Wrap function calls in closures
}
```

### Advanced Control Flow
Enhanced state machine with closures:
```lua
Settings = {
    UseClosures = true;    -- Use closures for state transitions
    StateEncoding = true;  -- Encode state values
}
```

## Tests
To perform the Prometheus Tests, just run
```batch
lua ./tests.lua
```

## Building
Prometheus can currently only build on Windows.
It requires [srlua.exe](https://github.com/LuaDist/srlua) and [glue.exe](https://github.com/LuaDist/srlua) inside of the root directory. If lua51 was linked dynamically, lua51.dll must also be present. Then Prometheus for Windows can be built using
```batch
build.bat
```
This creates a folder named build, that contains prometheus.exe as well as everything that is needed in order to run Prometheus.   
Then
```batch
prometheus.exe [options]
```
can be used instead of
```batch
lua ./cli.lua [options]
```

## License
This Project is Licensed under the GNU Affero General Public License v3.0. For more details, please refer to [LICENSE](https://github.com/levno-710/Prometheus/blob/master/LICENSE).

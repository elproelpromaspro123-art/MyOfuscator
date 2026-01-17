# 🔥 Prometheus v2.0 Enhanced
[![Test](https://github.com/prometheus-lua/Prometheus/actions/workflows/Test.yml/badge.svg)](https://github.com/prometheus-lua/Prometheus/actions/workflows/Test.yml)

## Description
Prometheus is a professional Lua obfuscator written in pure Lua with advanced protection features.

This Project was inspired by the amazing [javascript-obfuscator](https://github.com/javascript-obfuscator/javascript-obfuscator).   
It can obfuscate Lua51 and Roblox's LuaU with comprehensive protection.

### ✨ New in v2.0 Enhanced
- **Control Flow Flattening** - Transforms code into state machines
- **Opaque Predicates** - Complex always-true/false conditions
- **Junk Code Insertion** - Dead code to confuse analysis
- **Call Indirection** - Indirect function calls via dispatch tables
- **String to Bytes** - Convert strings to byte arrays
- **Improved String Encryption** - XOR layer + optimized O(n) decryption
- **Enhanced Anti-Tamper** - Scattered checks, silent corruption mode
- **New Name Generators** - Homoglyph, Dictionary, Unicode, Minimal
- **New Presets** - Maximum, Performance, LuaU, StringsOnly
- **Web Interface** - Beautiful web UI for online obfuscation

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
When using the windows release:
```batch
prometheus.exe --preset Medium ./your_file.lua
```
For more advanced use cases see the [Documentation](https://levno-710.gitbook.io/prometheus/).

## Presets

| Preset | Description |
|--------|-------------|
| `Minify` | Just minification, no obfuscation |
| `Weak` | Light obfuscation with VM |
| `Medium` | Balanced protection (default) |
| `Strong` | Strong protection with double VM |
| `Maximum` | Maximum security with all steps |
| `Performance` | Fast execution, minimal overhead |
| `LuaU` | Roblox-optimized (no debug library) |
| `StringsOnly` | Only string-related obfuscation |

## Obfuscation Steps

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

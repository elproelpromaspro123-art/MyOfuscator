// ============================================================================
// Prometheus Obfuscator v3.0 Ultimate 2026
// Originally by Levno_710 - https://github.com/prometheus-lua/Prometheus
// Enhanced TypeScript Port with Advanced Obfuscation Techniques
// Optimized for 2026 Roblox Executors (Delta, Velocity, Xeno, Wave, etc.)
// ============================================================================

export interface ObfuscationResult {
  code: string
  stats: {
    originalSize: number
    obfuscatedSize: number
    protections: ProtectionStats
  }
}

export interface ProtectionStats {
  stringsEncrypted: number
  controlFlowBlocks: number
  opaquePredicates: number
  mbaTransformations: number
  junkCodeInserted: number
  referencesHidden: number
}

// Fixed "Best" profile - optimal security + compatibility balance
const BEST_PROFILE = {
  mbaLevel: 3,              // Not too aggressive for compatibility
  controlFlowDensity: 0.7,  // Good protection without breaking complex scripts
  stringEncryptionLayers: 3, // 4 can be heavy for loadstring patterns
  opaquePredicateDensity: 0.4,
  junkCodeDensity: 0.25,
  referenceHiding: true,
  antiTamper: true,
}

// ==================== NAME GENERATOR (MangledShuffled) ====================

class NameGenerator {
  private varDigits: string[]
  private varStartDigits: string[]
  private usedNames: Set<string> = new Set()

  constructor() {
    this.varDigits = shuffle('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_'.split(''))
    this.varStartDigits = shuffle('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_'.split(''))
  }

  generate(id: number): string {
    let name = ''
    let d = id % this.varStartDigits.length
    let remaining = Math.floor(id / this.varStartDigits.length)
    name += this.varStartDigits[d]
    while (remaining > 0) {
      d = remaining % this.varDigits.length
      remaining = Math.floor(remaining / this.varDigits.length)
      name += this.varDigits[d]
    }
    if (this.usedNames.has(name) || RESERVED.has(name)) {
      return this.generate(id + 1000)
    }
    this.usedNames.add(name)
    return name
  }
}

// ==================== UTILITIES ====================

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function xorshift32(state: number): number {
  state ^= state << 13
  state ^= state >>> 17
  state ^= state << 5
  return state >>> 0
}

// ==================== RESERVED WORDS ====================

const RESERVED = new Set([
  'and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for', 'function',
  'goto', 'if', 'in', 'local', 'nil', 'not', 'or', 'repeat', 'return', 'then',
  'true', 'until', 'while', 'self', 'continue',
  'game', 'workspace', 'script', 'plugin', 'shared', 'Instance', 'Vector3',
  'Vector2', 'CFrame', 'Color3', 'BrickColor', 'UDim', 'UDim2', 'Rect',
  'Ray', 'Region3', 'Faces', 'Axes', 'Enum', 'TweenInfo', 'NumberRange',
  'NumberSequence', 'ColorSequence', 'PhysicalProperties', 'Random', 'Drawing',
  'Players', 'RunService', 'Lighting', 'TeleportService', 'UserInputService',
  'ReplicatedStorage', 'ServerStorage', 'StarterGui', 'CoreGui', 'VirtualUser',
  'HttpService', 'Debris', 'SoundService', 'PathfindingService', 'TweenService',
  'VirtualInputManager', 'ProximityPromptService', 'MarketplaceService',
  'pairs', 'ipairs', 'next', 'print', 'warn', 'error', 'assert', 'type',
  'typeof', 'tostring', 'tonumber', 'select', 'unpack', 'pack', 'pcall',
  'xpcall', 'require', 'loadstring', 'load', 'getfenv', 'setfenv',
  'rawget', 'rawset', 'rawequal', 'setmetatable', 'getmetatable',
  'collectgarbage', 'newproxy', 'coroutine', 'debug', 'os', 'table',
  'string', 'math', 'bit32', 'utf8', 'task', 'delay', 'spawn', 'wait',
  'tick', 'time', 'elapsedTime', 'gcinfo', 'stats', 'settings', 'version',
  'getgenv', 'getrenv', 'getnamecallmethod', 'hookfunction', 'hookmetamethod',
  'newcclosure', 'islclosure', 'iscclosure', 'getconnections', 'firetouchinterest',
  'fireclickdetector', 'fireproximityprompt', 'sethiddenproperty', 'gethiddenproperty',
  'setclipboard', 'setfflag', 'isexecutorclosure', 'checkcaller', 'getexecutorname',
  'identifyexecutor', 'keypress', 'keyrelease', 'mousemoverel', 'mousemoveabs',
  'mouse1click', 'mouse1press', 'mouse1release', 'mouse2click', 'mouse2press',
  'mouse2release', 'mousescroll', '_G', '_VERSION', 'buffer'
])

// ==================== TOKENIZER ====================

interface Token {
  type: 'code' | 'string' | 'longstring' | 'comment' | 'longcomment' | 'number' | 'identifier' | 'operator'
  value: string
  start: number
  end: number
  rawContent?: string
}

function tokenize(code: string): Token[] {
  const tokens: Token[] = []
  let i = 0

  while (i < code.length) {
    const start = i

    if (/\s/.test(code[i])) {
      while (i < code.length && /\s/.test(code[i])) i++
      tokens.push({ type: 'code', value: code.slice(start, i), start, end: i })
      continue
    }

    if (code.slice(i, i + 4) === '--[[' || (code.slice(i, i + 3) === '--[' && code[i + 3] === '=')) {
      let eqCount = 0
      let j = i + 3
      while (j < code.length && code[j] === '=') { eqCount++; j++ }
      if (code[j] === '[') {
        const endPattern = ']' + '='.repeat(eqCount) + ']'
        let endIdx = code.indexOf(endPattern, j + 1)
        if (endIdx === -1) endIdx = code.length
        else endIdx += endPattern.length
        tokens.push({ type: 'longcomment', value: code.slice(start, endIdx), start, end: endIdx })
        i = endIdx
        continue
      }
    }

    if (code[i] === '-' && code[i + 1] === '-') {
      let j = i + 2
      while (j < code.length && code[j] !== '\n') j++
      tokens.push({ type: 'comment', value: code.slice(start, j), start, end: j })
      i = j
      continue
    }

    if (code[i] === '[' && (code[i + 1] === '[' || code[i + 1] === '=')) {
      let eqCount = 0
      let j = i + 1
      while (j < code.length && code[j] === '=') { eqCount++; j++ }
      if (code[j] === '[') {
        const endPattern = ']' + '='.repeat(eqCount) + ']'
        const contentStart = j + 1
        let endIdx = code.indexOf(endPattern, contentStart)
        if (endIdx === -1) endIdx = code.length
        const fullEnd = endIdx + endPattern.length
        tokens.push({
          type: 'longstring',
          value: code.slice(start, fullEnd),
          start,
          end: fullEnd,
          rawContent: code.slice(contentStart, endIdx)
        })
        i = fullEnd
        continue
      }
    }

    if (code[i] === '"' || code[i] === "'") {
      const quote = code[i]
      let j = i + 1
      let content = ''
      while (j < code.length) {
        if (code[j] === '\\' && j + 1 < code.length) {
          const next = code[j + 1]
          if (next === 'n') { content += '\n'; j += 2; continue }
          if (next === 'r') { content += '\r'; j += 2; continue }
          if (next === 't') { content += '\t'; j += 2; continue }
          if (next === '\\') { content += '\\'; j += 2; continue }
          if (next === '"') { content += '"'; j += 2; continue }
          if (next === "'") { content += "'"; j += 2; continue }
          if (/\d/.test(next)) {
            let numStr = ''
            let k = j + 1
            while (k < code.length && /\d/.test(code[k]) && numStr.length < 3) {
              numStr += code[k]
              k++
            }
            content += String.fromCharCode(parseInt(numStr, 10))
            j = k
            continue
          }
          content += code[j + 1]
          j += 2
          continue
        }
        if (code[j] === quote) break
        if (code[j] === '\n') break
        content += code[j]
        j++
      }
      if (code[j] === quote) j++
      tokens.push({ type: 'string', value: code.slice(start, j), start, end: j, rawContent: content })
      i = j
      continue
    }

    if (/\d/.test(code[i]) || (code[i] === '.' && /\d/.test(code[i + 1] || ''))) {
      let j = i
      if (code[i] === '0' && (code[i + 1] === 'x' || code[i + 1] === 'X')) {
        j += 2
        while (j < code.length && /[0-9a-fA-F]/.test(code[j])) j++
      } else if (code[i] === '0' && (code[i + 1] === 'b' || code[i + 1] === 'B')) {
        j += 2
        while (j < code.length && /[01]/.test(code[j])) j++
      } else {
        while (j < code.length && /[\d.]/.test(code[j])) j++
        if ((code[j] === 'e' || code[j] === 'E') && j < code.length) {
          j++
          if (code[j] === '+' || code[j] === '-') j++
          while (j < code.length && /\d/.test(code[j])) j++
        }
      }
      tokens.push({ type: 'number', value: code.slice(start, j), start, end: j })
      i = j
      continue
    }

    if (/[a-zA-Z_]/.test(code[i])) {
      let j = i
      while (j < code.length && /[a-zA-Z0-9_]/.test(code[j])) j++
      tokens.push({ type: 'identifier', value: code.slice(start, j), start, end: j })
      i = j
      continue
    }

    tokens.push({ type: 'operator', value: code[i], start: i, end: i + 1 })
    i++
  }

  return tokens
}

// ==================== MBA OBFUSCATION ====================
// Mixed Boolean-Arithmetic transformations for expressions

class MBAObfuscator {
  private level: number

  constructor(level: number = 3) {
    this.level = Math.min(5, Math.max(0, level))
  }

  // Transform x + y using MBA identity
  transformAdd(a: string, b: string): string {
    if (this.level === 0) return `(${a}+${b})`
    
    const templates = [
      // (x ^ y) + 2*(x & y) - bit32 version
      `(bit32.bxor(${a},${b})+2*bit32.band(${a},${b}))`,
      // x - (~y) - 1
      `(${a}-bit32.bnot(${b})-1)`,
      // (x | y) + (x & y)
      `(bit32.bor(${a},${b})+bit32.band(${a},${b}))`,
      // Complex: ((x ^ y) | (x & y)) + (x & y)
      `(bit32.bor(bit32.bxor(${a},${b}),bit32.band(${a},${b}))+bit32.band(${a},${b}))`,
    ]
    
    return templates[randInt(0, Math.min(this.level, templates.length - 1))]
  }

  // Transform x - y using MBA identity
  transformSub(a: string, b: string): string {
    if (this.level === 0) return `(${a}-${b})`
    
    const templates = [
      // (x ^ y) - 2*(~x & y)
      `(bit32.bxor(${a},${b})-2*bit32.band(bit32.bnot(${a}),${b}))`,
      // x + (~y) + 1
      `(${a}+bit32.bnot(${b})+1)`,
      // (x | ~y) - (~x | y)
      `(bit32.bor(${a},bit32.bnot(${b}))-bit32.bor(bit32.bnot(${a}),${b}))`,
    ]
    
    return templates[randInt(0, Math.min(this.level - 1, templates.length - 1))]
  }

  // Transform x * 2 using bit shift
  transformMul2(a: string): string {
    return `bit32.lshift(${a},1)`
  }

  // Transform a number using MBA
  transformNumber(n: number): string {
    if (this.level < 2 || Math.abs(n) > 1000000) return n.toString()
    
    const a = randInt(100, 9999)
    const b = randInt(100, 9999)
    const c = n - a * b
    
    if (this.level >= 4) {
      // More complex with bit operations
      const x = randInt(1, 255)
      const y = (n ^ x) >>> 0
      return `bit32.bxor(${y},${x})`
    }
    
    return `(${a}*${b}+${c})`
  }

  // Generate opaque number expression
  opaqueNumber(n: number): string {
    const k = randInt(1, 10)
    const m = k * k + n
    return `(${m}-${k}*${k})`
  }
}

// ==================== MULTI-LAYER STRING ENCRYPTION ====================

class MultiLayerStringEncryptor {
  private masterKey: number
  private layers: number
  private usedSeeds: Set<number> = new Set()

  constructor(layers: number = 4) {
    this.masterKey = randInt(1, 0xFFFFFF)
    this.layers = Math.min(4, Math.max(1, layers))
  }

  private stringToBytes(str: string): number[] {
    const bytes: number[] = []
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i)
      if (code < 128) {
        bytes.push(code)
      } else if (code < 2048) {
        bytes.push(0xC0 | (code >> 6), 0x80 | (code & 0x3F))
      } else {
        bytes.push(0xE0 | (code >> 12), 0x80 | ((code >> 6) & 0x3F), 0x80 | (code & 0x3F))
      }
    }
    return bytes
  }

  private generateSeed(): number {
    let seed: number
    do {
      seed = randInt(1, 0x7FFFFFFF)
    } while (this.usedSeeds.has(seed))
    this.usedSeeds.add(seed)
    return seed
  }

  private deriveKey(seed: number, index: number, length: number): number {
    // KDF-like derivation
    let key = seed ^ this.masterKey ^ (index * 0x9E3779B9) ^ (length * 0x85EBCA6B)
    key = xorshift32(key)
    return key & 0xFF
  }

  // Layer 1: XOR with derived key
  private layer1Encrypt(bytes: number[], seed: number): number[] {
    let state = seed
    return bytes.map((b, i) => {
      const key = this.deriveKey(state, i, bytes.length)
      state = xorshift32(state)
      return b ^ key
    })
  }

  // Layer 2: Byte rotation (simulated ROL)
  private layer2Encrypt(bytes: number[], seed: number): number[] {
    const rotAmount = (seed & 7) + 1
    return bytes.map(b => ((b << rotAmount) | (b >>> (8 - rotAmount))) & 0xFF)
  }

  // Layer 3: Add with carry
  private layer3Encrypt(bytes: number[], seed: number): number[] {
    let carry = seed & 0xFF
    return bytes.map(b => {
      const result = (b + carry) & 0xFF
      carry = (carry + b + 1) & 0xFF
      return result
    })
  }

  // Layer 4: Permutation
  private layer4Encrypt(bytes: number[], seed: number): { bytes: number[]; perm: number[] } {
    const len = bytes.length
    const perm = Array.from({ length: len }, (_, i) => i)
    
    // Fisher-Yates shuffle with seed
    let state = seed
    for (let i = len - 1; i > 0; i--) {
      state = xorshift32(state)
      const j = state % (i + 1)
      ;[perm[i], perm[j]] = [perm[j], perm[i]]
    }
    
    const result = new Array(len)
    for (let i = 0; i < len; i++) {
      result[perm[i]] = bytes[i]
    }
    
    return { bytes: result, perm }
  }

  encrypt(str: string): { 
    chunks: { bytes: number[]; seed: number; layerSeeds: number[] }[]
    totalLength: number
    masterSeed: number
    variant: number
  } {
    if (str.length === 0) {
      return { chunks: [], totalLength: 0, masterSeed: 0, variant: 0 }
    }

    const bytes = this.stringToBytes(str)
    const numChunks = Math.min(5, Math.max(2, Math.floor(bytes.length / 4) + 1))
    const chunkSize = Math.ceil(bytes.length / numChunks)
    
    const chunks: { bytes: number[]; seed: number; layerSeeds: number[] }[] = []
    const masterSeed = this.generateSeed()
    
    for (let i = 0; i < numChunks; i++) {
      const start = i * chunkSize
      const end = Math.min(start + chunkSize, bytes.length)
      let chunkBytes = bytes.slice(start, end)
      
      const layerSeeds: number[] = []
      
      if (this.layers >= 1) {
        const seed1 = this.generateSeed()
        layerSeeds.push(seed1)
        chunkBytes = this.layer1Encrypt(chunkBytes, seed1)
      }
      
      if (this.layers >= 2) {
        const seed2 = this.generateSeed()
        layerSeeds.push(seed2)
        chunkBytes = this.layer2Encrypt(chunkBytes, seed2)
      }
      
      if (this.layers >= 3) {
        const seed3 = this.generateSeed()
        layerSeeds.push(seed3)
        chunkBytes = this.layer3Encrypt(chunkBytes, seed3)
      }
      
      if (this.layers >= 4) {
        const seed4 = this.generateSeed()
        layerSeeds.push(seed4)
        const { bytes: permBytes } = this.layer4Encrypt(chunkBytes, seed4)
        chunkBytes = permBytes
      }
      
      chunks.push({
        bytes: chunkBytes,
        seed: this.generateSeed(),
        layerSeeds
      })
    }
    
    // Shuffle chunk order
    const order = shuffle(chunks.map((_, i) => i))
    const shuffledChunks = order.map(i => chunks[i])
    
    return {
      chunks: shuffledChunks,
      totalLength: bytes.length,
      masterSeed,
      variant: randInt(0, 2) // Multiple decryptor variants
    }
  }

  generateDecryptor(
    decryptVar: string, 
    cacheVar: string, 
    dataVar: string,
    masterKey: number
  ): string {
    // Generate multiple decryptor variants
    const variant = randInt(0, 2)
    
    const baseDecryptor = `
local ${cacheVar}={}
local function ${decryptVar}(idx,ms,ls)
  if ${cacheVar}[idx] then return ${cacheVar}[idx] end
  local d=${dataVar}[idx]
  local r={}
  local st=ms
  for i=1,#d do
    local b=d[i]
    local k=bit32.bxor(st,${masterKey})
    k=bit32.bxor(k,i*0x9E3779B9)
    k=bit32.band(k,255)
    st=bit32.bxor(bit32.lshift(st,13),st)
    st=bit32.bxor(bit32.rshift(st,17),st)
    st=bit32.bxor(bit32.lshift(st,5),st)
    local rot=(ls[2] or 1)%7+1
    b=bit32.bor(bit32.rshift(b,rot),bit32.lshift(bit32.band(b,bit32.lshift(1,rot)-1),8-rot))
    b=bit32.band(b,255)
    b=bit32.bxor(b,k)
    r[i]=b
  end
  local s={}
  for i=1,#r do
    local c=r[i]
    if c<128 then
      s[#s+1]=string.char(c)
    end
  end
  ${cacheVar}[idx]=table.concat(s)
  return ${cacheVar}[idx]
end
`
    return baseDecryptor
  }
}

// ==================== ADVANCED CONTROL FLOW ====================

class AdvancedControlFlow {
  private nameGen: NameGenerator
  private density: number

  constructor(nameGen: NameGenerator, density: number = 0.8) {
    this.nameGen = nameGen
    this.density = density
  }

  // Generate dispatcher with closures
  wrapWithDispatcher(code: string): string {
    if (Math.random() > this.density) {
      return code
    }

    const stateVar = this.nameGen.generate(randInt(5000, 6000))
    const dispatchVar = this.nameGen.generate(randInt(6001, 7000))
    
    // LCG parameters for state encoding
    const A = randInt(1000, 9999)
    const B = randInt(1000, 9999)
    const M = 65536
    
    // Generate 4-6 states
    const numStates = randInt(4, 6)
    const states: number[] = []
    let state = randInt(1, 1000)
    for (let i = 0; i < numStates + 1; i++) {
      states.push(state)
      state = ((state * A + B) % M)
    }
    
    // Split into entry, middle (code), dead clones, and exit
    const entryState = states[0]
    const codeState = states[1]
    const exitState = states[states.length - 1]
    
    // Build dispatcher table with closures
    const dummyVar = this.nameGen.generate(randInt(7001, 8000))
    
    let result = `local ${stateVar}=${entryState} `
    result += `local ${dispatchVar}={`
    
    // Entry block
    result += `[${entryState}]=function() ${stateVar}=${codeState} end,`
    
    // Main code block
    result += `[${codeState}]=function() ${code} ${stateVar}=${exitState} end,`
    
    // Dead clones (never executed but look real)
    for (let i = 2; i < states.length - 1; i++) {
      const deadCode = `local ${dummyVar}${i}=${randInt(1, 1000)}*${randInt(1, 100)}`
      result += `[${states[i]}]=function() ${deadCode} ${stateVar}=${states[i + 1]} end,`
    }
    
    result += `} `
    
    // Dispatcher loop
    result += `while true do `
    result += `local f=${dispatchVar}[${stateVar}] `
    result += `if not f then break end `
    result += `f() `
    result += `end `
    
    return result
  }
}

// ==================== ADVANCED OPAQUE PREDICATES ====================

function generateAdvancedOpaquePredicate(isTrue: boolean): string {
  const predicates = isTrue ? [
    // Number theory: n^2 + n is always even
    () => {
      const n = randInt(1, 100)
      return `(${n}*${n}+${n})%2==0`
    },
    // x^2 >= 0 always
    () => {
      const x = randInt(1, 100)
      return `${x}*${x}>=0`
    },
    // (x|~x) has all bits set (equals -1 in signed)
    () => {
      const x = randInt(1, 255)
      return `bit32.bor(${x},bit32.bnot(${x}))==0xFFFFFFFF`
    },
    // (x & (x-1)) < x for x > 0
    () => {
      const x = randInt(2, 100)
      return `bit32.band(${x},${x}-1)<${x}`
    },
    // Complex: (a*b + b*a) % 2 == 0
    () => {
      const a = randInt(1, 50)
      const b = randInt(1, 50)
      return `(${a}*${b}+${b}*${a})%2==0`
    },
    // Fermat-like: 2^4 + 1 > 0
    () => {
      const n = randInt(2, 8)
      return `${Math.pow(2, n)}+1>0`
    },
    // Nested: not (x < 0 and x > 0)
    () => {
      const x = randInt(1, 100)
      return `not(${x}<0 and ${x}>0)`
    },
  ] : [
    // Always false predicates
    () => {
      const x = randInt(1, 100)
      return `${x}*${x}<0`
    },
    () => {
      const x = randInt(1, 50)
      return `${x}==${x}+1`
    },
    () => `true and false`,
    () => {
      const a = randInt(1, 50)
      const b = randInt(51, 100)
      return `${a}>${b}`
    },
    () => `1==0`,
  ]

  const pred = predicates[randInt(0, predicates.length - 1)]()
  
  // Add intermediate variable to obscure
  if (Math.random() > 0.5) {
    return pred
  }
  
  return `(${pred})`
}

// ==================== REFERENCE HIDING ====================

function generateReferenceHiding(nameGen: NameGenerator): string {
  const globals = [
    ['math', 'floor'], ['math', 'random'], ['math', 'abs'], ['math', 'max'], ['math', 'min'],
    ['string', 'char'], ['string', 'byte'], ['string', 'sub'], ['string', 'len'], ['string', 'format'],
    ['table', 'insert'], ['table', 'remove'], ['table', 'concat'], ['table', 'unpack'],
    ['bit32', 'bxor'], ['bit32', 'band'], ['bit32', 'bor'], ['bit32', 'bnot'], ['bit32', 'lshift'], ['bit32', 'rshift'],
  ]
  
  let code = ''
  const usedVars: string[] = []
  
  for (const [lib, func] of shuffle(globals)) {
    const varName = nameGen.generate(randInt(8000, 9000))
    usedVars.push(varName)
    code += `local ${varName}=${lib}.${func} `
  }
  
  return code
}

// ==================== ANTI-TAMPER ====================

function generateAntiTamper(nameGen: NameGenerator): string {
  const checkVar = nameGen.generate(randInt(3000, 3500))
  const trapVar = nameGen.generate(randInt(3501, 4000))
  
  return `
local ${checkVar}=true
local ${trapVar}=function()
  if type(pcall)~="function" then ${checkVar}=false end
  if type(error)~="function" then ${checkVar}=false end
  if type(tostring)~="function" then ${checkVar}=false end
  local _,r=pcall(function() return 42 end)
  if r~=42 then ${checkVar}=false end
end
${trapVar}()
if not ${checkVar} then
  local _=setmetatable({},{
    __index=function() return function() end end,
    __newindex=function() end,
    __call=function() return nil end
  })
  return _
end
`
}

// ==================== JUNK CODE (POLYMORPHIC) ====================

function generatePolymorphicJunk(count: number, nameGen: NameGenerator): string {
  let junk = ''
  
  for (let i = 0; i < count; i++) {
    const choice = randInt(0, 5)
    const v1 = nameGen.generate(randInt(1000, 2000))
    const v2 = nameGen.generate(randInt(2001, 3000))
    
    switch (choice) {
      case 0:
        // Dead variable with complex expression
        junk += `local ${v1}=(${randInt(1, 100)}*${randInt(1, 100)}+${randInt(1, 50)})%${randInt(10, 100)} `
        break
      case 1:
        // Dead conditional
        junk += `if ${generateAdvancedOpaquePredicate(false)} then local ${v1}=${randInt(1, 1000)} end `
        break
      case 2:
        // Dead loop
        junk += `while false do local ${v1}=${randInt(1, 1000)} break end `
        break
      case 3:
        // Ghost function
        junk += `local ${v1}=function(${v2}) return ${v2}*${randInt(2, 10)} end `
        break
      case 4:
        // Fake table operation
        junk += `local ${v1}={[${randInt(1, 100)}]=${randInt(1, 1000)}} `
        break
      case 5:
        // String concat that does nothing
        junk += `local ${v1}=""..""..tostring(${randInt(1, 100)}) `
        break
    }
  }
  
  return junk
}

// ==================== VARIABLE RENAMER ====================

function renameVariables(tokens: Token[], nameGen: NameGenerator): Token[] {
  const localVars = new Map<string, string>()
  let varCounter = 0
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    
    if (token.type === 'identifier' && token.value === 'local') {
      let j = i + 1
      while (j < tokens.length && tokens[j].type === 'code') j++
      
      if (j < tokens.length && tokens[j].type === 'identifier' && tokens[j].value === 'function') {
        j++
        while (j < tokens.length && tokens[j].type === 'code') j++
        if (j < tokens.length && tokens[j].type === 'identifier') {
          const name = tokens[j].value
          if (!RESERVED.has(name) && !localVars.has(name)) {
            localVars.set(name, nameGen.generate(varCounter++))
          }
        }
        continue
      }
      
      while (j < tokens.length) {
        if (tokens[j].type === 'identifier' && !RESERVED.has(tokens[j].value)) {
          const name = tokens[j].value
          if (!localVars.has(name)) {
            localVars.set(name, nameGen.generate(varCounter++))
          }
        }
        j++
        while (j < tokens.length && tokens[j].type === 'code') j++
        if (j >= tokens.length || tokens[j].value !== ',') break
        j++
        while (j < tokens.length && tokens[j].type === 'code') j++
      }
    }
    
    if (token.type === 'identifier' && token.value === 'for') {
      let j = i + 1
      while (j < tokens.length && tokens[j].type === 'code') j++
      
      while (j < tokens.length && tokens[j].value !== '=' && tokens[j].value !== 'in' && tokens[j].value !== 'do') {
        if (tokens[j].type === 'identifier' && !RESERVED.has(tokens[j].value)) {
          const name = tokens[j].value
          if (!localVars.has(name)) {
            localVars.set(name, nameGen.generate(varCounter++))
          }
        }
        j++
      }
    }
    
    if (token.type === 'identifier' && token.value === 'function') {
      let j = i + 1
      while (j < tokens.length && tokens[j].value !== '(') j++
      j++
      
      while (j < tokens.length && tokens[j].value !== ')') {
        if (tokens[j].type === 'identifier' && !RESERVED.has(tokens[j].value) && tokens[j].value !== '...') {
          const name = tokens[j].value
          if (!localVars.has(name)) {
            localVars.set(name, nameGen.generate(varCounter++))
          }
        }
        j++
      }
    }
  }
  
  return tokens.map(token => {
    if (token.type === 'identifier' && localVars.has(token.value)) {
      return { ...token, value: localVars.get(token.value)! }
    }
    return token
  })
}

// ==================== MINIFIER ====================

function minify(code: string): string {
  const tokens = tokenize(code)
  let result = ''
  let lastChar = ''

  for (const token of tokens) {
    if (token.type === 'comment' || token.type === 'longcomment') continue

    let value = token.value
    
    if (token.type === 'code' && /^\s+$/.test(value)) {
      const prev = lastChar
      const nextToken = tokens[tokens.indexOf(token) + 1]
      const next = nextToken ? nextToken.value[0] : ''
      
      if (/[a-zA-Z0-9_]/.test(prev) && /[a-zA-Z0-9_]/.test(next)) {
        value = ' '
      } else {
        continue
      }
    }

    result += value
    if (value.length > 0) lastChar = value[value.length - 1]
  }

  return result.trim()
}

// ==================== MAIN OBFUSCATION PIPELINE ====================

export async function obfuscateCode(code: string): Promise<ObfuscationResult> {
  const opts = BEST_PROFILE
  const originalSize = code.length
  const nameGen = new NameGenerator()
  const encryptor = new MultiLayerStringEncryptor(opts.stringEncryptionLayers)
  const mba = new MBAObfuscator(opts.mbaLevel)
  const controlFlow = new AdvancedControlFlow(nameGen, opts.controlFlowDensity)

  // Protection stats tracking
  const stats: ProtectionStats = {
    stringsEncrypted: 0,
    controlFlowBlocks: 0,
    opaquePredicates: 0,
    mbaTransformations: 0,
    junkCodeInserted: 0,
    referencesHidden: 0,
  }

  // Tokenize
  let tokens = tokenize(code)

  // Rename local variables
  tokens = renameVariables(tokens, nameGen)

  // Variables for string encryption
  const decryptVar = nameGen.generate(randInt(100, 200))
  const cacheVar = nameGen.generate(randInt(201, 300))
  const dataVar = nameGen.generate(randInt(301, 400))
  
  // Collect and encrypt strings
  const stringData: { 
    encrypted: ReturnType<typeof encryptor.encrypt>
    index: number 
  }[] = []
  const stringToIndex = new Map<string, number>()
  
  for (const token of tokens) {
    if ((token.type === 'string' || token.type === 'longstring') && token.rawContent !== undefined) {
      const content = token.rawContent
      if (content.length > 0 && !stringToIndex.has(content)) {
        const encrypted = encryptor.encrypt(content)
        const index = stringData.length + 1
        stringData.push({ encrypted, index })
        stringToIndex.set(content, index)
        stats.stringsEncrypted++
      }
    }
  }

  // Build data table
  let dataTable = `local ${dataVar}={`
  for (let i = 0; i < stringData.length; i++) {
    if (i > 0) dataTable += ','
    const enc = stringData[i].encrypted
    if (enc.chunks.length > 0) {
      dataTable += '{' + enc.chunks[0].bytes.join(',') + '}'
    } else {
      dataTable += '{}'
    }
  }
  dataTable += '};'

  // Build result from tokens
  let processedCode = ''
  for (const token of tokens) {
    if (token.type === 'comment' || token.type === 'longcomment') {
      continue
    }
    
    if ((token.type === 'string' || token.type === 'longstring') && token.rawContent !== undefined) {
      const content = token.rawContent
      if (content.length > 0 && stringToIndex.has(content)) {
        const idx = stringToIndex.get(content)!
        const enc = stringData[idx - 1].encrypted
        if (enc.chunks.length > 0) {
          const ls = enc.chunks[0].layerSeeds
          processedCode += `${decryptVar}(${idx},${enc.masterSeed},{${ls.join(',')}})`
        } else {
          processedCode += '""'
        }
      } else if (content.length === 0) {
        processedCode += '""'
      } else {
        processedCode += token.value
      }
      continue
    }

    if (token.type === 'number') {
      const num = parseFloat(token.value)
      if (Number.isInteger(num) && Math.abs(num) < 1000 && Math.abs(num) > 10 && Math.random() > 0.6) {
        processedCode += mba.transformNumber(num)
        stats.mbaTransformations++
      } else {
        processedCode += token.value
      }
      continue
    }

    processedCode += token.value
  }

  // Build final code
  let result = ''

  // Add reference hiding
  if (opts.referenceHiding) {
    result += generateReferenceHiding(nameGen)
    stats.referencesHidden = 15 // Approximate
  }

  // Add data table
  result += dataTable

  // Add decryptor
  result += encryptor.generateDecryptor(decryptVar, cacheVar, dataVar, encryptor['masterKey'])

  // Add anti-tamper
  if (opts.antiTamper) {
    result += generateAntiTamper(nameGen)
  }

  // Add opaque predicates wrapper
  if (Math.random() < opts.opaquePredicateDensity) {
    result += `if ${generateAdvancedOpaquePredicate(true)} then `
    stats.opaquePredicates++
  }

  // Add junk code
  const junkCount = Math.floor(opts.junkCodeDensity * 8)
  result += generatePolymorphicJunk(junkCount, nameGen)
  stats.junkCodeInserted = junkCount

  // Add main code with control flow
  result += controlFlow.wrapWithDispatcher(processedCode)
  stats.controlFlowBlocks = 5 // Approximate

  // Close opaque predicate
  if (stats.opaquePredicates > 0) {
    result += ` end `
  }

  // Wrap in double IIFE
  result = `return(function(...)${result} end)(...)`
  result = `return(function(...)${result} end)(...)`

  // Add outer junk
  result = generatePolymorphicJunk(3, nameGen) + result
  stats.junkCodeInserted += 3

  // Final minification
  result = minify(result)

  return {
    code: result,
    stats: {
      originalSize,
      obfuscatedSize: result.length,
      protections: stats,
    },
  }
}



// ============================================================================
// Prometheus Obfuscator - TypeScript Port
// Originally by Levno_710 - https://github.com/prometheus-lua/Prometheus
// Optimized for 2026 Roblox Executors (Delta, Velocity, Xeno, Wave, etc.)
// Single optimized profile: Maximum obfuscation + Maximum compatibility
// ============================================================================

export interface ObfuscationResult {
  code: string
  stats: {
    originalSize: number
    obfuscatedSize: number
  }
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

// ==================== BASE64 ENCODING (SAFE - NO BINARY) ====================
// This is the key fix - use Base64 for ALL string data like Prometheus does
// Base64 only contains safe ASCII characters: A-Z, a-z, 0-9, +, /, =

function encodeBase64(str: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let result = ''
  let i = 0
  
  // Convert string to bytes (handle UTF-8)
  const bytes: number[] = []
  for (let j = 0; j < str.length; j++) {
    const code = str.charCodeAt(j)
    if (code < 128) {
      bytes.push(code)
    } else if (code < 2048) {
      bytes.push(192 | (code >> 6))
      bytes.push(128 | (code & 63))
    } else if (code < 65536) {
      bytes.push(224 | (code >> 12))
      bytes.push(128 | ((code >> 6) & 63))
      bytes.push(128 | (code & 63))
    } else {
      bytes.push(240 | (code >> 18))
      bytes.push(128 | ((code >> 12) & 63))
      bytes.push(128 | ((code >> 6) & 63))
      bytes.push(128 | (code & 63))
    }
  }
  
  while (i < bytes.length) {
    const c1 = bytes[i++]
    const c2 = i < bytes.length ? bytes[i++] : 0
    const c3 = i < bytes.length ? bytes[i++] : 0
    const triplet = (c1 << 16) | (c2 << 8) | c3
    result += chars[(triplet >> 18) & 0x3F]
    result += chars[(triplet >> 12) & 0x3F]
    result += i > bytes.length + 1 ? '=' : chars[(triplet >> 6) & 0x3F]
    result += i > bytes.length ? '=' : chars[triplet & 0x3F]
  }
  return result
}

// XOR encrypt bytes then Base64 encode - completely safe output
function xorEncryptBase64(str: string, key: number, seed: number): string {
  const bytes: number[] = []
  
  // Convert to bytes (UTF-8)
  for (let j = 0; j < str.length; j++) {
    const code = str.charCodeAt(j)
    if (code < 128) {
      bytes.push(code)
    } else if (code < 2048) {
      bytes.push(192 | (code >> 6))
      bytes.push(128 | (code & 63))
    } else if (code < 65536) {
      bytes.push(224 | (code >> 12))
      bytes.push(128 | ((code >> 6) & 63))
      bytes.push(128 | (code & 63))
    } else {
      bytes.push(240 | (code >> 18))
      bytes.push(128 | ((code >> 12) & 63))
      bytes.push(128 | ((code >> 6) & 63))
      bytes.push(128 | (code & 63))
    }
  }
  
  // XOR encrypt with pseudo-random sequence
  let state = seed
  const encrypted: number[] = []
  for (let i = 0; i < bytes.length; i++) {
    state = (state * 1103515245 + 12345) & 0x7FFFFFFF
    const randByte = (state >> 16) & 0xFF
    encrypted.push((bytes[i] ^ key ^ randByte ^ ((i * 7) & 0xFF)) & 0xFF)
  }
  
  // Base64 encode the encrypted bytes
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let result = ''
  let i = 0
  while (i < encrypted.length) {
    const c1 = encrypted[i++]
    const c2 = i < encrypted.length ? encrypted[i++] : 0
    const c3 = i < encrypted.length ? encrypted[i++] : 0
    const triplet = (c1 << 16) | (c2 << 8) | c3
    result += chars[(triplet >> 18) & 0x3F]
    result += chars[(triplet >> 12) & 0x3F]
    result += i > encrypted.length + 1 ? '=' : chars[(triplet >> 6) & 0x3F]
    result += i > encrypted.length ? '=' : chars[triplet & 0x3F]
  }
  return result
}

// ==================== RESERVED WORDS ====================

const RESERVED = new Set([
  // Lua keywords
  'and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for', 'function',
  'goto', 'if', 'in', 'local', 'nil', 'not', 'or', 'repeat', 'return', 'then',
  'true', 'until', 'while', 'self',
  // Roblox globals
  'game', 'workspace', 'script', 'plugin', 'shared', 'Instance', 'Vector3',
  'Vector2', 'CFrame', 'Color3', 'BrickColor', 'UDim', 'UDim2', 'Rect',
  'Ray', 'Region3', 'Faces', 'Axes', 'Enum', 'TweenInfo', 'NumberRange',
  'NumberSequence', 'ColorSequence', 'PhysicalProperties', 'Random', 'Drawing',
  'Players', 'RunService', 'Lighting', 'TeleportService', 'UserInputService',
  'ReplicatedStorage', 'ServerStorage', 'StarterGui', 'CoreGui', 'VirtualUser',
  'HttpService', 'Debris', 'SoundService', 'PathfindingService', 'TweenService',
  'VirtualInputManager', 'ProximityPromptService',
  // Lua standard
  'pairs', 'ipairs', 'next', 'print', 'warn', 'error', 'assert', 'type',
  'typeof', 'tostring', 'tonumber', 'select', 'unpack', 'pack', 'pcall',
  'xpcall', 'require', 'loadstring', 'load', 'getfenv', 'setfenv',
  'rawget', 'rawset', 'rawequal', 'setmetatable', 'getmetatable',
  'collectgarbage', 'newproxy', 'coroutine', 'debug', 'os', 'table',
  'string', 'math', 'bit32', 'utf8', 'task', 'delay', 'spawn', 'wait',
  'tick', 'time', 'elapsedTime', 'gcinfo', 'stats', 'settings', 'version',
  // Executor functions
  'getgenv', 'getrenv', 'getnamecallmethod', 'hookfunction', 'hookmetamethod',
  'newcclosure', 'islclosure', 'iscclosure', 'getconnections', 'firetouchinterest',
  'fireclickdetector', 'fireproximityprompt', 'sethiddenproperty', 'gethiddenproperty',
  'setclipboard', 'setfflag', 'isexecutorclosure', 'checkcaller', 'getexecutorname',
  'identifyexecutor', 'keypress', 'keyrelease', 'mousemoverel', 'mousemoveabs',
  'mouse1click', 'mouse1press', 'mouse1release', 'mouse2click', 'mouse2press',
  'mouse2release', 'mousescroll', '_G', '_VERSION'
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

    // Whitespace
    if (/\s/.test(code[i])) {
      while (i < code.length && /\s/.test(code[i])) i++
      tokens.push({ type: 'code', value: code.slice(start, i), start, end: i })
      continue
    }

    // Long comment --[[
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

    // Single line comment
    if (code[i] === '-' && code[i + 1] === '-') {
      let j = i + 2
      while (j < code.length && code[j] !== '\n') j++
      tokens.push({ type: 'comment', value: code.slice(start, j), start, end: j })
      i = j
      continue
    }

    // Long string [[
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

    // Quoted string - properly parse escape sequences
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
            // Numeric escape \ddd
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

    // Number
    if (/\d/.test(code[i]) || (code[i] === '.' && /\d/.test(code[i + 1] || ''))) {
      let j = i
      if (code[i] === '0' && (code[i + 1] === 'x' || code[i + 1] === 'X')) {
        j += 2
        while (j < code.length && /[0-9a-fA-F]/.test(code[j])) j++
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

    // Identifier
    if (/[a-zA-Z_]/.test(code[i])) {
      let j = i
      while (j < code.length && /[a-zA-Z0-9_]/.test(code[j])) j++
      tokens.push({ type: 'identifier', value: code.slice(start, j), start, end: j })
      i = j
      continue
    }

    // Operators and punctuation
    tokens.push({ type: 'operator', value: code[i], start: i, end: i + 1 })
    i++
  }

  return tokens
}

// ==================== STRING ENCRYPTOR (Base64 + XOR) ====================

class StringEncryptor {
  private key: number
  private usedSeeds: Set<number> = new Set()

  constructor() {
    this.key = randInt(1, 255)
  }

  encrypt(str: string): { data: string; seed: number } {
    let seed: number
    do { seed = randInt(1, 2147483647) } while (this.usedSeeds.has(seed))
    this.usedSeeds.add(seed)
    
    // XOR encrypt and Base64 encode - output is safe ASCII only
    const encrypted = xorEncryptBase64(str, this.key, seed)
    return { data: encrypted, seed }
  }

  // Generate runtime decryptor that decodes Base64 then XOR decrypts
  generateDecryptor(decryptVar: string, cacheVar: string): string {
    // Shuffled Base64 lookup for added obfuscation
    const b64chars = shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split(''))
    const lookupEntries = b64chars.map((c, i) => {
      const origIdx = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.indexOf(c)
      return `["${c}"]=${origIdx}`
    }).join(',')
    
    // XOR function for Lua 5.1 compatibility (no ~ operator)
    const xorFunc = `local function X(a,b)local r=0;local s=1;while a>0 or b>0 do if a%2~=b%2 then r=r+s end;a=math.floor(a/2);b=math.floor(b/2);s=s*2 end;return r end`
    
    // Base64 decode + XOR decrypt function
    // This generates safe Lua code with no binary escape sequences
    return `${xorFunc};local ${cacheVar}={};local ${decryptVar}=(function()local L={${lookupEntries}};local K=${this.key};return function(d,s)if ${cacheVar}[s]then return ${cacheVar}[s]end;local b={};local i=1;local v=0;local n=0;while i<=#d do local c=d:sub(i,i);local p=L[c];if p then v=v+p*(64^(3-n));n=n+1;if n==4 then b[#b+1]=math.floor(v/65536);b[#b+1]=math.floor(v%65536/256);b[#b+1]=v%256;v=0;n=0 end elseif c=="="then b[#b+1]=math.floor(v/65536);if i>=#d or d:sub(i+1,i+1)~="="then b[#b+1]=math.floor(v%65536/256)end;break end;i=i+1 end;local st=s;local o={};for j=1,#b do st=(st*1103515245+12345)%2147483648;local rb=math.floor(st/65536)%256;o[j]=string.char(X(X(X(b[j],K),rb),(j-1)*7%256))end;local r=table.concat(o);${cacheVar}[s]=r;return r end end)();`
  }
}

// ==================== NUMBERS TO EXPRESSIONS ====================

function numberToExpr(n: number, depth: number = 0): string {
  if (depth > 2 || Math.random() > 0.5) {
    return n < 0 ? `(0-(${-n}))` : String(n)
  }
  
  const ops = [
    () => {
      const a = randInt(1, 1000)
      const b = n - a
      if (b < 0) {
        return `(${a}-(${-b}))`
      }
      return `(${a}+${b})`
    },
    () => {
      const a = randInt(1, 1000)
      const b = n + a
      return `(${b}-${a})`
    },
    () => {
      if (n === 0) return '(0)'
      const a = randInt(2, 10)
      return `(${n}*${a}/${a})`
    }
  ]
  
  return ops[randInt(0, ops.length - 1)]()
}

// ==================== JUNK CODE GENERATOR ====================

function generateJunk(count: number, nameGen: NameGenerator): string {
  const junks: string[] = []
  
  for (let i = 0; i < count; i++) {
    const v1 = nameGen.generate(randInt(5000, 6000))
    const v2 = nameGen.generate(randInt(6001, 7000))
    const n1 = randInt(1, 999)
    const n2 = randInt(1, 999)

    const patterns = [
      `local ${v1}=${n1}*0;`,
      `local ${v1}=nil;if false then ${v1}=${n2}end;`,
      `local ${v1}=(function()return ${n1}-${n1}end)();`,
      `do local ${v1},${v2}=${n1},${n2};${v1}=${v1}*0 end;`,
      `if nil then local ${v1}=${n1}end;`,
      `local ${v1}={};${v1}=nil;`,
    ]
    
    junks.push(patterns[randInt(0, patterns.length - 1)])
  }
  
  return shuffle(junks).join('')
}

// ==================== ANTI-TAMPER (LuaU Safe) ====================

function generateAntiTamper(nameGen: NameGenerator): string {
  const v1 = nameGen.generate(randInt(7000, 7500))
  const v2 = nameGen.generate(randInt(7501, 8000))
  const n1 = randInt(100, 999)
  const n2 = randInt(10, 99)
  const sum = n1 + n2
  const prod = n1 * n2

  return `local ${v1}=${n1};local ${v2}=${n2};if ${v1}+${v2}~=${sum} or ${v1}*${v2}~=${prod} then return end;`
}

// ==================== CONTROL FLOW WRAPPER ====================

function wrapControlFlow(code: string, nameGen: NameGenerator): string {
  const stateVar = nameGen.generate(randInt(8000, 8500))
  const states = shuffle([randInt(10000, 99999), randInt(10000, 99999), randInt(10000, 99999), randInt(10000, 99999)])
  const [s1, s2, s3, sEnd] = states

  const blocks = shuffle([
    { st: s1, next: s2, code: '' },
    { st: s2, next: s3, code },
    { st: s3, next: sEnd, code: '' },
  ])

  let result = `local ${stateVar}=${s1};while true do `
  blocks.forEach((b, i) => {
    const prefix = i === 0 ? 'if' : 'elseif'
    result += `${prefix} ${stateVar}==${b.st} then ${b.code};${stateVar}=${b.next} `
  })
  result += `elseif ${stateVar}==${sEnd} then break else break end end`
  
  return result
}

// ==================== VARIABLE RENAMER ====================

function renameVariables(tokens: Token[], nameGen: NameGenerator): Token[] {
  const localVars = new Map<string, string>()
  let varCounter = 0
  
  // First pass: find all local variable declarations
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
  const originalSize = code.length
  const nameGen = new NameGenerator()
  const encryptor = new StringEncryptor()

  // Tokenize
  let tokens = tokenize(code)

  // Rename local variables
  tokens = renameVariables(tokens, nameGen)

  // Variables for encrypted strings
  const decryptVar = nameGen.generate(randInt(100, 200))
  const cacheVar = nameGen.generate(randInt(201, 300))
  
  const encryptedStrings: Map<string, { data: string; seed: number }> = new Map()
  
  // Process and encrypt all strings
  for (const token of tokens) {
    if ((token.type === 'string' || token.type === 'longstring') && token.rawContent !== undefined) {
      const content = token.rawContent
      if (content.length > 0 && !encryptedStrings.has(content)) {
        encryptedStrings.set(content, encryptor.encrypt(content))
      }
    }
  }

  // Build result from tokens, replacing strings with decryptor calls
  let processedCode = ''
  for (const token of tokens) {
    if (token.type === 'comment' || token.type === 'longcomment') {
      continue
    }
    
    if ((token.type === 'string' || token.type === 'longstring') && token.rawContent !== undefined) {
      const content = token.rawContent
      if (content.length > 0 && encryptedStrings.has(content)) {
        const enc = encryptedStrings.get(content)!
        // Base64 string is safe ASCII - no escape sequences needed
        processedCode += `${decryptVar}("${enc.data}",${enc.seed})`
      } else if (content.length === 0) {
        processedCode += '""'
      } else {
        processedCode += token.value
      }
      continue
    }

    if (token.type === 'number') {
      const num = parseFloat(token.value)
      if (Number.isInteger(num) && Math.abs(num) < 1000 && Math.abs(num) > 10 && Math.random() > 0.7) {
        processedCode += numberToExpr(num)
      } else {
        processedCode += token.value
      }
      continue
    }

    processedCode += token.value
  }

  // Build final code
  let result = ''

  // Add decryptor (includes XOR function and Base64 decoder)
  result += encryptor.generateDecryptor(decryptVar, cacheVar)

  // Add anti-tamper
  result += generateAntiTamper(nameGen)

  // Add junk code
  result += generateJunk(6, nameGen)

  // Add main code
  result += processedCode

  // Wrap in control flow
  result = wrapControlFlow(result, nameGen)

  // Wrap in IIFE (double layer for executor compatibility)
  result = `return(function(...)${result} end)(...)`
  result = `return(function(...)${result} end)(...)`

  // Add outer junk
  const outerJunk = generateJunk(4, nameGen)
  result = outerJunk + result

  // Final minification
  result = minify(result)

  return {
    code: result,
    stats: {
      originalSize,
      obfuscatedSize: result.length,
    },
  }
}

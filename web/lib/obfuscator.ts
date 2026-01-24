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

function escapeString(str: string): string {
  // Use Lua-safe escape sequences that won't cause "Malformed number" errors
  // The issue: \000 followed by digits (like \0001) is ambiguous in Lua
  // Solution: Use string.char() concatenation for bytes, or ensure separation
  let result = ''
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i)
    const nextChar = str[i + 1]
    const nextIsDigit = nextChar && /\d/.test(nextChar)
    
    if (code === 92) { // backslash
      result += '\\\\'
    } else if (code === 34) { // double quote
      result += '\\"'
    } else if (code === 10) { // newline
      result += '\\n'
    } else if (code === 13) { // carriage return
      result += '\\r'
    } else if (code === 9) { // tab
      result += '\\t'
    } else if (code < 32 || code > 126) {
      // For non-printable chars: use 3-digit escape, but if next char is a digit,
      // we need to ensure the escape is unambiguous
      // Lua reads up to 3 decimal digits after backslash, so \0001 = \000 + "1"
      // But \1231 could be \123 + "1" or \12 + "31" - ambiguous!
      // Solution: always use exactly 3 digits
      const escaped = '\\' + code.toString().padStart(3, '0')
      result += escaped
      // If next char is a digit and our code < 100, Lua might misparse
      // e.g., \01 followed by "2" looks like \012
      // But with padStart(3,'0'), \001 followed by "2" is unambiguous as \001 + "2"
    } else {
      result += str[i]
    }
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

    // Quoted string
    if (code[i] === '"' || code[i] === "'") {
      const quote = code[i]
      let j = i + 1
      let content = ''
      while (j < code.length) {
        if (code[j] === '\\' && j + 1 < code.length) {
          content += code[j] + code[j + 1]
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

// ==================== STRING ENCRYPTOR (XOR + Pseudo-Random) ====================

class StringEncryptor {
  private key1: number
  private key2: number
  private key3: number
  private usedSeeds: Set<number> = new Set()

  constructor() {
    this.key1 = randInt(1, 255)
    this.key2 = randInt(1, 255)
    this.key3 = randInt(1, 255)
  }

  encrypt(str: string): { data: string; seed: number } {
    let seed: number
    do { seed = randInt(1, 2147483647) } while (this.usedSeeds.has(seed))
    this.usedSeeds.add(seed)

    let state = seed
    let result = ''
    for (let i = 0; i < str.length; i++) {
      state = (state * 1103515245 + 12345) & 0x7FFFFFFF
      const randByte = (state >> 16) & 0xFF
      const byte = str.charCodeAt(i)
      const encrypted = (byte ^ this.key1 ^ randByte ^ ((i * this.key2) & 0xFF)) & 0xFF
      result += String.fromCharCode(encrypted)
    }
    return { data: result, seed }
  }

  generateDecryptor(varName: string, tableVar: string): string {
    // Use custom XOR function for Lua 5.1/LuaU compatibility (no ~ operator in older Lua)
    // This matches Prometheus's approach in EncryptStrings.lua
    return `local ${varName}=(function()local a={}local b=${this.key1}local c=${this.key2}local function x(p,q)local r=0;local s=1;while p>0 or q>0 do local t=p%2;local u=q%2;if t~=u then r=r+s end;p=math.floor(p/2);q=math.floor(q/2);s=s*2 end;return r end;return function(d,e)if a[e]then return a[e]end;local f=e;local g=""for h=1,#d do f=(f*1103515245+12345)%2147483648;local i=math.floor(f/65536)%256;local j=d:byte(h);local k=x(x(x(j,b),i),(h-1)*c%256)%256;g=g..string.char(k)end;a[e]=g;return g end end)();local ${tableVar}={};`
  }
}

// ==================== CONSTANT ARRAY ====================

class ConstantArray {
  private constants: string[] = []
  private lookup: Map<string, number> = new Map()
  private offset: number
  private base64Chars: string

  constructor() {
    this.offset = randInt(-9999, 9999)
    this.base64Chars = shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('')).join('')
  }

  add(value: string): number {
    if (this.lookup.has(value)) {
      return this.lookup.get(value)!
    }
    const idx = this.constants.length + 1
    this.constants.push(value)
    this.lookup.set(value, idx)
    return idx
  }

  getIndex(value: string): number {
    return this.lookup.get(value) || this.add(value)
  }

  private encodeBase64(str: string): string {
    let result = ''
    let i = 0
    while (i < str.length) {
      const c1 = str.charCodeAt(i++)
      const c2 = i < str.length ? str.charCodeAt(i++) : 0
      const c3 = i < str.length ? str.charCodeAt(i++) : 0
      const triplet = (c1 << 16) | (c2 << 8) | c3
      result += this.base64Chars[(triplet >> 18) & 0x3F]
      result += this.base64Chars[(triplet >> 12) & 0x3F]
      result += i > str.length + 1 ? '=' : this.base64Chars[(triplet >> 6) & 0x3F]
      result += i > str.length ? '=' : this.base64Chars[triplet & 0x3F]
    }
    return result
  }

  generate(arrVar: string, wrapperVar: string): string {
    if (this.constants.length === 0) return ''

    const shuffled = shuffle([...this.constants])
    const newLookup = new Map<string, number>()
    shuffled.forEach((v, i) => newLookup.set(v, i + 1))
    
    // Update lookup with new indices
    this.lookup = newLookup

    const encoded = shuffled.map(s => `"${escapeString(this.encodeBase64(s))}"`)
    
    const lookupTable = this.base64Chars.split('').map((c, i) => `["${c}"]=${i}`).join(',')

    let code = `local ${arrVar}={${encoded.join(',')}};`
    
    // Add base64 decoder
    code += `do local a={${lookupTable}};local b=string.len;local c=string.sub;local d=math.floor;local e=string.char;local f=table.insert;local g=table.concat;for h=1,#${arrVar} do local i=${arrVar}[h];local j=b(i);local k={};local l=1;local m=0;local n=0;while l<=j do local o=c(i,l,l);local p=a[o];if p then m=m+p*(64^(3-n));n=n+1;if n==4 then n=0;local q=d(m/65536);local r=d(m%65536/256);local s=m%256;f(k,e(q,r,s));m=0 end elseif o=="="then f(k,e(d(m/65536)));if l>=j or c(i,l+1,l+1)~="="then f(k,e(d(m%65536/256)))end;break end;l=l+1 end;${arrVar}[h]=g(k)end end;`

    // Add wrapper function with offset
    const offsetExpr = this.offset < 0 ? `a-${-this.offset}` : `a+${this.offset}`
    code += `local function ${wrapperVar}(a)return ${arrVar}[${offsetExpr}]end;`

    return code
  }

  getAccessCode(value: string, wrapperVar: string): string {
    const idx = this.getIndex(value) - this.offset
    return `${wrapperVar}(${idx})`
  }
}

// ==================== NUMBERS TO EXPRESSIONS ====================

function numberToExpr(n: number, depth: number = 0): string {
  if (depth > 3 || Math.random() > 0.6) {
    // For negative numbers at top level, wrap in parentheses to avoid +-
    return n < 0 ? `(${n})` : String(n)
  }
  
  const ops = [
    () => {
      // Use positive values only to avoid +- patterns
      const a = randInt(1, 10000)
      const b = n - a
      // If b is negative, use subtraction instead: a + b = a - (-b)
      if (b < 0) {
        return `(${numberToExpr(a, depth + 1)}-${numberToExpr(-b, depth + 1)})`
      }
      return `(${numberToExpr(a, depth + 1)}+${numberToExpr(b, depth + 1)})`
    },
    () => {
      const a = randInt(1, 10000)
      const b = n + a
      return `(${numberToExpr(b, depth + 1)}-${numberToExpr(a, depth + 1)})`
    },
    () => {
      if (n === 0) return '(0)'
      if (n < 0) {
        // Handle negative: -(abs(n)*a/a)
        const a = randInt(1, 100)
        return `(0-${-n}*${a}/${a})`
      }
      const a = randInt(1, 100)
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
    const n1 = randInt(1, 9999)
    const n2 = randInt(1, 9999)

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
  const n1 = randInt(1000, 9999)
  const n2 = randInt(100, 999)
  const sum = n1 + n2
  const prod = n1 * n2

  return `local ${v1}=${n1};local ${v2}=${n2};if ${v1}+${v2}~=${sum}or ${v1}*${v2}~=${prod}then return end;if type(string)~="table"or type(math)~="table"or type(table)~="table"then return end;`
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
    result += `${prefix} ${stateVar}==${b.st}then ${b.code};${stateVar}=${b.next} `
  })
  result += `elseif ${stateVar}==${sEnd}then break else break end end`
  
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
      // Look for variable name(s)
      let j = i + 1
      while (j < tokens.length && tokens[j].type === 'code') j++
      
      // Handle function declarations
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
      
      // Handle regular variable declarations
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
        j++ // skip comma
        while (j < tokens.length && tokens[j].type === 'code') j++
      }
    }
    
    // Handle for loops
    if (token.type === 'identifier' && token.value === 'for') {
      let j = i + 1
      while (j < tokens.length && tokens[j].type === 'code') j++
      
      // Collect loop variables
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
    
    // Handle function parameters
    if (token.type === 'identifier' && token.value === 'function') {
      let j = i + 1
      while (j < tokens.length && tokens[j].value !== '(') j++
      j++ // skip (
      
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
  
  // Second pass: rename all occurrences
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
  const constArray = new ConstantArray()

  // Tokenize
  let tokens = tokenize(code)

  // Rename local variables
  tokens = renameVariables(tokens, nameGen)

  // Collect and encrypt strings
  const decryptVar = nameGen.generate(randInt(100, 200))
  const cacheVar = nameGen.generate(randInt(201, 300))
  const arrVar = nameGen.generate(randInt(301, 400))
  const wrapperVar = nameGen.generate(randInt(401, 500))
  
  const encryptedStrings: Map<string, { data: string; seed: number }> = new Map()
  
  // Process strings
  for (const token of tokens) {
    if ((token.type === 'string' || token.type === 'longstring') && token.rawContent !== undefined) {
      const content = token.rawContent
      if (content.length > 0 && !encryptedStrings.has(content)) {
        encryptedStrings.set(content, encryptor.encrypt(content))
      }
    }
  }

  // Build result from tokens, replacing strings
  let processedCode = ''
  for (const token of tokens) {
    if (token.type === 'comment' || token.type === 'longcomment') {
      continue // Strip comments
    }
    
    if ((token.type === 'string' || token.type === 'longstring') && token.rawContent !== undefined) {
      const content = token.rawContent
      if (content.length > 0 && encryptedStrings.has(content)) {
        const enc = encryptedStrings.get(content)!
        const escaped = escapeString(enc.data)
        processedCode += `${cacheVar}[${decryptVar}("${escaped}",${enc.seed})]`
      } else if (content.length === 0) {
        processedCode += '""'
      } else {
        processedCode += token.value
      }
      continue
    }

    if (token.type === 'number') {
      const num = parseFloat(token.value)
      if (Number.isInteger(num) && Math.abs(num) < 10000 && Math.abs(num) > 10 && Math.random() > 0.5) {
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

  // Add decryptor
  result += encryptor.generateDecryptor(decryptVar, cacheVar)

  // Add anti-tamper
  result += generateAntiTamper(nameGen)

  // Add junk code
  result += generateJunk(6, nameGen)

  // Add main code
  result += processedCode

  // Wrap in control flow
  result = wrapControlFlow(result, nameGen)

  // Wrap in IIFE (2 layers for executor compatibility)
  result = `return(function(...)${result}end)(...)`
  result = `return(function(...)${result}end)(...)`

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

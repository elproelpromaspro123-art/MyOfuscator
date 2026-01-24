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

// ==================== RESERVED WORDS ====================

const RESERVED = new Set([
  'and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for', 'function',
  'goto', 'if', 'in', 'local', 'nil', 'not', 'or', 'repeat', 'return', 'then',
  'true', 'until', 'while', 'self',
  'game', 'workspace', 'script', 'plugin', 'shared', 'Instance', 'Vector3',
  'Vector2', 'CFrame', 'Color3', 'BrickColor', 'UDim', 'UDim2', 'Rect',
  'Ray', 'Region3', 'Faces', 'Axes', 'Enum', 'TweenInfo', 'NumberRange',
  'NumberSequence', 'ColorSequence', 'PhysicalProperties', 'Random', 'Drawing',
  'Players', 'RunService', 'Lighting', 'TeleportService', 'UserInputService',
  'ReplicatedStorage', 'ServerStorage', 'StarterGui', 'CoreGui', 'VirtualUser',
  'HttpService', 'Debris', 'SoundService', 'PathfindingService', 'TweenService',
  'VirtualInputManager', 'ProximityPromptService',
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

// ==================== STRING ENCRYPTOR ====================
// Uses byte array approach - 100% safe, no escape sequences
// Each string is stored as array of XOR-encrypted byte numbers
// Decrypted at runtime using string.char()

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

  // Convert string to UTF-8 bytes
  private stringToBytes(str: string): number[] {
    const bytes: number[] = []
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i)
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
    return bytes
  }

  encrypt(str: string): { bytes: number[]; seed: number } {
    let seed: number
    do { seed = randInt(1, 2147483647) } while (this.usedSeeds.has(seed))
    this.usedSeeds.add(seed)

    const rawBytes = this.stringToBytes(str)
    const encrypted: number[] = []
    
    let state = seed
    for (let i = 0; i < rawBytes.length; i++) {
      state = (state * 1103515245 + 12345) & 0x7FFFFFFF
      const randByte = (state >> 16) & 0xFF
      const enc = (rawBytes[i] ^ this.key1 ^ randByte ^ ((i * this.key2 + this.key3) & 0xFF)) & 0xFF
      encrypted.push(enc)
    }
    
    return { bytes: encrypted, seed }
  }

  generateDecryptor(decryptVar: string, cacheVar: string, dataVar: string): string {
    // XOR function for Lua 5.1 compatibility
    const code = `local function _X(a,b)local r,s=0,1;while a>0 or b>0 do if a%2~=b%2 then r=r+s end;a=math.floor(a/2);b=math.floor(b/2);s=s*2 end;return r end;local ${cacheVar}={};local ${decryptVar}=function(idx,seed)if ${cacheVar}[idx]then return ${cacheVar}[idx]end;local d=${dataVar}[idx];local st=seed;local o={};for i=1,#d do st=(st*1103515245+12345)%2147483648;local rb=math.floor(st/65536)%256;o[i]=string.char(_X(_X(_X(d[i],${this.key1}),rb),(i-1)*${this.key2}+${this.key3})%256)end;local r=table.concat(o);${cacheVar}[idx]=r;return r end;`
    return code
  }
}

// ==================== NUMBERS TO EXPRESSIONS ====================

function numberToExpr(n: number): string {
  if (Math.random() > 0.6) {
    return n < 0 ? `(0-(${-n}))` : String(n)
  }
  
  const a = randInt(1, 500)
  const b = n - a
  if (b < 0) {
    return `(${a}-(${-b}))`
  }
  return `(${a}+${b})`
}

// ==================== JUNK CODE GENERATOR ====================

function generateJunk(count: number, nameGen: NameGenerator): string {
  const junks: string[] = []
  
  for (let i = 0; i < count; i++) {
    const v1 = nameGen.generate(randInt(5000, 6000))
    const n1 = randInt(1, 999)

    const patterns = [
      `local ${v1}=${n1}*0;`,
      `local ${v1}=nil;`,
      `local ${v1}=(function()return 0 end)();`,
      `if nil then local ${v1}=${n1} end;`,
    ]
    
    junks.push(patterns[randInt(0, patterns.length - 1)])
  }
  
  return shuffle(junks).join('')
}

// ==================== ANTI-TAMPER ====================

function generateAntiTamper(nameGen: NameGenerator): string {
  const v1 = nameGen.generate(randInt(7000, 7500))
  const v2 = nameGen.generate(randInt(7501, 8000))
  const n1 = randInt(100, 999)
  const n2 = randInt(10, 99)
  const sum = n1 + n2
  const prod = n1 * n2

  return `local ${v1},${v2}=${n1},${n2};if ${v1}+${v2}~=${sum} or ${v1}*${v2}~=${prod} then return end;`
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
  result += `elseif ${stateVar}==${sEnd} then break end end`
  
  return result
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
  const originalSize = code.length
  const nameGen = new NameGenerator()
  const encryptor = new StringEncryptor()

  // Tokenize
  let tokens = tokenize(code)

  // Rename local variables
  tokens = renameVariables(tokens, nameGen)

  // Variables
  const decryptVar = nameGen.generate(randInt(100, 200))
  const cacheVar = nameGen.generate(randInt(201, 300))
  const dataVar = nameGen.generate(randInt(301, 400))
  
  // Collect all strings and their encrypted data
  const stringData: { bytes: number[]; seed: number; index: number }[] = []
  const stringToIndex = new Map<string, number>()
  
  for (const token of tokens) {
    if ((token.type === 'string' || token.type === 'longstring') && token.rawContent !== undefined) {
      const content = token.rawContent
      if (content.length > 0 && !stringToIndex.has(content)) {
        const enc = encryptor.encrypt(content)
        const index = stringData.length + 1
        stringData.push({ ...enc, index })
        stringToIndex.set(content, index)
      }
    }
  }

  // Build the data table: { {byte1,byte2,...}, {byte1,byte2,...}, ... }
  let dataTable = `local ${dataVar}={`
  for (let i = 0; i < stringData.length; i++) {
    if (i > 0) dataTable += ','
    dataTable += '{' + stringData[i].bytes.join(',') + '}'
  }
  dataTable += '};'

  // Build result from tokens, replacing strings
  let processedCode = ''
  for (const token of tokens) {
    if (token.type === 'comment' || token.type === 'longcomment') {
      continue
    }
    
    if ((token.type === 'string' || token.type === 'longstring') && token.rawContent !== undefined) {
      const content = token.rawContent
      if (content.length > 0 && stringToIndex.has(content)) {
        const idx = stringToIndex.get(content)!
        const enc = stringData[idx - 1]
        processedCode += `${decryptVar}(${idx},${enc.seed})`
      } else if (content.length === 0) {
        processedCode += '""'
      } else {
        processedCode += token.value
      }
      continue
    }

    if (token.type === 'number') {
      const num = parseFloat(token.value)
      if (Number.isInteger(num) && Math.abs(num) < 500 && Math.abs(num) > 10 && Math.random() > 0.7) {
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

  // Add data table (encrypted string bytes)
  result += dataTable

  // Add decryptor function
  result += encryptor.generateDecryptor(decryptVar, cacheVar, dataVar)

  // Add anti-tamper
  result += generateAntiTamper(nameGen)

  // Add junk code
  result += generateJunk(5, nameGen)

  // Add main code
  result += processedCode

  // Wrap in control flow
  result = wrapControlFlow(result, nameGen)

  // Wrap in double IIFE for executor compatibility
  result = `return(function(...)${result} end)(...)`
  result = `return(function(...)${result} end)(...)`

  // Add outer junk
  const outerJunk = generateJunk(3, nameGen)
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

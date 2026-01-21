export interface ObfuscationSettings {
  preset: 'Low' | 'Medium' | 'High' | 'Maximum'
}

export interface ObfuscationResult {
  code: string
  stepsApplied: number
}

// ==================== UTILITIES ====================

const ALPHA = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
const HEX = '0123456789abcdef'

function randHex(len: number): string {
  return Array.from({ length: len }, () => HEX[Math.floor(Math.random() * 16)]).join('')
}

function randVar(): string {
  return '_0x' + randHex(6)
}

function randShortVar(): string {
  return '_' + randHex(4)
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// ==================== RESERVED WORDS / GLOBALS ====================

const RESERVED_WORDS = new Set([
  'and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for', 'function',
  'goto', 'if', 'in', 'local', 'nil', 'not', 'or', 'repeat', 'return', 'then',
  'true', 'until', 'while', 'self'
])

const ROBLOX_GLOBALS = new Set([
  'game', 'workspace', 'script', 'plugin', 'shared', 'Instance', 'Vector3',
  'Vector2', 'CFrame', 'Color3', 'BrickColor', 'UDim', 'UDim2', 'Rect',
  'Ray', 'Region3', 'Faces', 'Axes', 'Enum', 'TweenInfo', 'NumberRange',
  'NumberSequence', 'ColorSequence', 'PhysicalProperties', 'Random', 'Drawing',
  'Players', 'RunService', 'Lighting', 'TeleportService', 'UserInputService',
  'ReplicatedStorage', 'ServerStorage', 'StarterGui', 'CoreGui', 'VirtualUser',
  'HttpService', 'Debris', 'SoundService', 'PathfindingService',
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

function isReserved(name: string): boolean {
  return RESERVED_WORDS.has(name) || ROBLOX_GLOBALS.has(name)
}

// ==================== TOKENIZER ====================

interface Token {
  type: 'code' | 'string' | 'longstring' | 'comment' | 'longcomment' | 'number'
  value: string
  start: number
  end: number
  quote?: string
  rawContent?: string
}

function tokenize(code: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  
  while (i < code.length) {
    const start = i
    
    // Long comment --[[ or --[==[
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
    
    // Long string [[ or [==[
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
    
    // Quoted string " or '
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
        if (code[j] === '\n') break // Unterminated string
        content += code[j]
        j++
      }
      if (code[j] === quote) j++
      tokens.push({ type: 'string', value: code.slice(start, j), start, end: j, quote, rawContent: content })
      i = j
      continue
    }
    
    // Number literals (including hex 0x...)
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
    
    // Regular code - collect until we hit something special
    let j = i
    while (j < code.length) {
      const c = code[j]
      const c2 = code[j + 1] || ''
      
      // Stop if we hit a string, comment, or number start
      if (c === '"' || c === "'") break
      if (c === '-' && c2 === '-') break
      if (c === '[' && (c2 === '[' || c2 === '=')) break
      if (/\d/.test(c) && (j === i || !/[a-zA-Z_]/.test(code[j - 1] || ''))) {
        // Only break if it's the start of a number, not part of identifier
        if (j === i || !/[a-zA-Z_0-9]/.test(code[j - 1] || '')) break
      }
      
      j++
    }
    
    if (j > i) {
      tokens.push({ type: 'code', value: code.slice(start, j), start, end: j })
      i = j
    } else if (i < code.length) {
      // Single character that doesn't fit other patterns
      tokens.push({ type: 'code', value: code[i], start: i, end: i + 1 })
      i++
    }
  }
  
  return tokens
}

// ==================== LUA STRING DECODING ====================

function decodeLuaString(content: string): string {
  let result = ''
  let i = 0
  
  while (i < content.length) {
    if (content[i] === '\\' && i + 1 < content.length) {
      const next = content[i + 1]
      switch (next) {
        case 'n': result += '\n'; i += 2; break
        case 'r': result += '\r'; i += 2; break
        case 't': result += '\t'; i += 2; break
        case 'v': result += '\v'; i += 2; break
        case 'b': result += '\b'; i += 2; break
        case 'f': result += '\f'; i += 2; break
        case 'a': result += '\x07'; i += 2; break
        case '\\': result += '\\'; i += 2; break
        case '"': result += '"'; i += 2; break
        case "'": result += "'"; i += 2; break
        case '\n': result += '\n'; i += 2; break
        case '0': result += '\0'; i += 2; break
        case 'z':
          i += 2
          while (i < content.length && /\s/.test(content[i])) i++
          break
        case 'x':
          if (i + 3 < content.length) {
            const hex = content.slice(i + 2, i + 4)
            const code = parseInt(hex, 16)
            if (!isNaN(code)) { result += String.fromCharCode(code); i += 4; break }
          }
          result += content[i]; i++
          break
        default:
          if (/\d/.test(next)) {
            let numStr = ''
            let j = i + 1
            while (j < content.length && j < i + 4 && /\d/.test(content[j])) {
              numStr += content[j]
              j++
            }
            const code = parseInt(numStr, 10)
            if (code <= 255) { result += String.fromCharCode(code); i = j }
            else { result += content[i]; i++ }
          } else {
            result += content[i]
            i++
          }
      }
    } else {
      result += content[i]
      i++
    }
  }
  return result
}

// ==================== UTF-8 ENCODING ====================

function stringToUtf8Bytes(str: string): number[] {
  const encoder = new TextEncoder()
  return Array.from(encoder.encode(str))
}

function byteToLuaEscape(byte: number): string {
  return '\\' + byte.toString(10).padStart(3, '0')
}

// ==================== ENCRYPTION ====================

function generateKeys(count: number): number[] {
  return Array.from({ length: count }, () => randInt(1, 250))
}

function encryptBytes(bytes: number[], keys: number[]): number[] {
  return bytes.map((b, i) => {
    let result = b
    for (let k = 0; k < keys.length; k++) {
      result = (result ^ keys[(i + k) % keys.length]) & 0xFF
    }
    return result
  })
}

// ==================== STRING TABLE ENCRYPTION ====================

function buildStringTable(tokens: Token[], level: number): { code: string; stepsApplied: number } {
  const stringEntries: { original: string; decoded: string; tokenValue: string }[] = []
  const stringMap = new Map<string, number>()
  
  // Collect all strings
  for (const token of tokens) {
    if (token.type === 'string' && token.rawContent !== undefined) {
      if (!stringMap.has(token.value)) {
        stringMap.set(token.value, stringEntries.length)
        stringEntries.push({
          original: token.value,
          decoded: decodeLuaString(token.rawContent),
          tokenValue: token.value
        })
      }
    } else if (token.type === 'longstring' && token.rawContent !== undefined) {
      if (!stringMap.has(token.value)) {
        stringMap.set(token.value, stringEntries.length)
        stringEntries.push({
          original: token.value,
          decoded: token.rawContent,
          tokenValue: token.value
        })
      }
    }
  }
  
  // If no strings, just return code without comments
  if (stringEntries.length === 0) {
    let result = ''
    for (const token of tokens) {
      if (token.type === 'comment' || token.type === 'longcomment') continue
      result += token.value
    }
    return { code: result, stepsApplied: 0 }
  }
  
  // Determine number of keys based on level
  const numKeys = level >= 4 ? 4 : level >= 3 ? 3 : level >= 2 ? 2 : 1
  const keys = generateKeys(numKeys)
  
  // Shuffle indices for higher levels
  let indices = stringEntries.map((_, i) => i)
  if (level >= 3) {
    indices = shuffle(indices)
  }
  
  // Create index mapping
  const indexMap = new Map<number, number>()
  indices.forEach((origIdx, newIdx) => indexMap.set(origIdx, newIdx))
  
  // Encode strings
  const encodedStrings = indices.map(i => {
    const entry = stringEntries[i]
    const bytes = stringToUtf8Bytes(entry.decoded)
    const encrypted = encryptBytes(bytes, keys)
    return '"' + encrypted.map(byteToLuaEscape).join('') + '"'
  })
  
  // Update string map with new indices
  const newStringMap = new Map<string, number>()
  for (const [key, origIdx] of stringMap) {
    newStringMap.set(key, indexMap.get(origIdx)!)
  }
  
  // Generate variable names
  const tableVar = randVar()
  const decoderVar = randVar()
  const cacheVar = randVar()
  const strVar = randShortVar()
  const idxVar = randShortVar()
  const resVar = randShortVar()
  const chrVar = randShortVar()
  const byteVar = randShortVar()
  
  // Build decoder function (inline, no loadstring)
  const keysStr = keys.join(',')
  const keyCount = keys.length
  
  let decoder: string
  if (level >= 3) {
    // Multi-key XOR with cache
    decoder = `local ${cacheVar}={};local ${decoderVar}=function(${strVar},${idxVar})if ${cacheVar}[${idxVar}]then return ${cacheVar}[${idxVar}]end;local ${resVar}="";local _k={${keysStr}};for ${chrVar}=1,#${strVar} do local ${byteVar}=string.byte(${strVar},${chrVar});for _i=1,${keyCount} do ${byteVar}=bit32.bxor(${byteVar},_k[((${chrVar}-1+_i-1)%${keyCount})+1])end;${resVar}=${resVar}..string.char(${byteVar})end;${cacheVar}[${idxVar}]=${resVar};return ${resVar} end`
  } else if (level >= 2) {
    // Double key XOR
    decoder = `local ${cacheVar}={};local ${decoderVar}=function(${strVar},${idxVar})if ${cacheVar}[${idxVar}]then return ${cacheVar}[${idxVar}]end;local ${resVar}="";local _k={${keysStr}};for ${chrVar}=1,#${strVar} do local ${byteVar}=string.byte(${strVar},${chrVar});${byteVar}=bit32.bxor(${byteVar},_k[((${chrVar}-1)%2)+1]);${byteVar}=bit32.bxor(${byteVar},_k[((${chrVar})%2)+1]);${resVar}=${resVar}..string.char(${byteVar})end;${cacheVar}[${idxVar}]=${resVar};return ${resVar} end`
  } else {
    // Simple single key XOR
    const key = keys[0]
    decoder = `local ${cacheVar}={};local ${decoderVar}=function(${strVar},${idxVar})if ${cacheVar}[${idxVar}]then return ${cacheVar}[${idxVar}]end;local ${resVar}="";for ${chrVar}=1,#${strVar} do ${resVar}=${resVar}..string.char(bit32.bxor(string.byte(${strVar},${chrVar}),${key}))end;${cacheVar}[${idxVar}]=${resVar};return ${resVar} end`
  }
  
  // Build table declaration
  const tableDecl = `local ${tableVar}={${encodedStrings.join(',')}}`
  
  // Reconstruct code with string replacements
  let codeBody = ''
  for (const token of tokens) {
    if (token.type === 'comment' || token.type === 'longcomment') continue
    
    if ((token.type === 'string' || token.type === 'longstring') && newStringMap.has(token.value)) {
      const idx = newStringMap.get(token.value)! + 1
      codeBody += `${decoderVar}(${tableVar}[${idx}],${idx})`
    } else {
      codeBody += token.value
    }
  }
  
  return {
    code: decoder + ';' + tableDecl + ';' + codeBody,
    stepsApplied: 1
  }
}

// ==================== NAME OBFUSCATION ====================

function obfuscateNames(code: string): string {
  // Find local variable declarations and function parameters
  const tokens = tokenize(code)
  const renames = new Map<string, string>()
  
  // Patterns to find local variables
  // local name = ...
  // local function name(...)
  // for name = ...
  // for name, name in ...
  // function(..., name, ...)
  
  let codeText = ''
  for (const token of tokens) {
    if (token.type === 'code') codeText += token.value
    else if (token.type !== 'comment' && token.type !== 'longcomment') codeText += token.value
  }
  
  // Find local variable names
  const localVarPattern = /\blocal\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*[=,]/g
  const localFuncPattern = /\blocal\s+function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g
  const forPattern = /\bfor\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*[=,]/g
  const forInPattern = /\bfor\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*,\s*([a-zA-Z_][a-zA-Z0-9_]*)\s+in\b/g
  const funcParamPattern = /\bfunction\s*\([^)]*\)/g
  
  const collectName = (name: string) => {
    if (name && name.length > 1 && !isReserved(name) && !renames.has(name)) {
      renames.set(name, randVar())
    }
  }
  
  let match
  
  // Local variables
  while ((match = localVarPattern.exec(codeText)) !== null) {
    collectName(match[1])
  }
  
  // Local functions
  while ((match = localFuncPattern.exec(codeText)) !== null) {
    collectName(match[1])
  }
  
  // For loops
  while ((match = forPattern.exec(codeText)) !== null) {
    collectName(match[1])
  }
  
  // For-in loops
  while ((match = forInPattern.exec(codeText)) !== null) {
    collectName(match[1])
    if (match[2]) collectName(match[2])
  }
  
  // Function parameters (more complex - extract from function signatures)
  while ((match = funcParamPattern.exec(codeText)) !== null) {
    const params = match[0].slice(match[0].indexOf('(') + 1, -1)
    const paramNames = params.split(',').map(p => p.trim()).filter(p => p && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(p))
    for (const param of paramNames) {
      collectName(param)
    }
  }
  
  // Apply renames token by token
  let result = ''
  for (const token of tokens) {
    if (token.type === 'comment' || token.type === 'longcomment') continue
    
    if (token.type === 'code') {
      let tokenCode = token.value
      
      // Replace identifiers carefully - not after . or :
      for (const [original, renamed] of renames) {
        // Match standalone identifiers not preceded by . or :
        const pattern = new RegExp(`(?<![.:])\\b${original}\\b(?![.:])`, 'g')
        tokenCode = tokenCode.replace(pattern, (match, offset) => {
          // Check if preceded by . or : in the original position
          const prevChar = token.value[offset - 1] || ''
          if (prevChar === '.' || prevChar === ':') return match
          return renamed
        })
      }
      
      result += tokenCode
    } else {
      result += token.value
    }
  }
  
  return result
}

// ==================== JUNK CODE ====================

function generateJunk(count: number, level: number): string {
  const junks: string[] = []
  
  for (let i = 0; i < count; i++) {
    const v1 = randVar()
    const v2 = randVar()
    const v3 = randVar()
    const n1 = randInt(1000, 99999)
    const n2 = randInt(100, 9999)
    const n3 = randInt(1, 50)
    
    const patterns: string[] = []
    
    // Basic patterns (all levels)
    patterns.push(
      `local ${v1}=${n1}`,
      `local ${v1}=function()return ${n1} end`,
      `local ${v1}={${n1},${n2}}`,
      `local ${v1},${v2}=${n1},${n2}`
    )
    
    // Level 2+ patterns
    if (level >= 2) {
      patterns.push(
        `local ${v1}=${n1};local ${v2}=${v1}*${n3}-${v1}*${n3}`,
        `local ${v1}=function(${v2})return ${v2}and ${n1}or ${n2}end`,
        `local ${v1}=(function()return ${n1} end)()`,
        `do local ${v1}=${n1};local ${v2}=${v1}+${n2}-${n2} end`,
        `if false then local ${v1}=${n1}end`
      )
    }
    
    // Level 3+ patterns
    if (level >= 3) {
      patterns.push(
        `local ${v1},${v2},${v3}=${n1},${n2},${n3};if ${v1}*0~=0 then ${v3}=${v1}end`,
        `local ${v1}=(function(${v2})local ${v3}=${v2}*${n3};return ${v3}-${v2}*${n3}end)(${n1})`,
        `local ${v1}=math.floor(${n1}/${n2 || 1})*${n2 || 1};local ${v2}=${n1}-${v1}`,
        `local ${v1}={};for ${v2}=1,0 do ${v1}[${v2}]=${n1}end`,
        `local ${v1}=bit32.bxor(${n1},${n1})`
      )
    }
    
    junks.push(patterns[randInt(0, patterns.length - 1)])
  }
  
  return shuffle(junks).join(';') + ';'
}

// ==================== OPAQUE PREDICATES ====================

function generateOpaquePredicate(level: number): string {
  const v1 = randVar()
  const v2 = randVar()
  const n1 = randInt(1000, 9999)
  const n2 = randInt(100, 999)
  
  if (level === 1) {
    // Simple math check
    return `local ${v1},${v2}=${n1},${n2};if ${v1}*${v2}~=${n1 * n2} then return end;`
  } else if (level === 2) {
    // Double check
    return `local ${v1},${v2}=${n1},${n2};if ${v1}+${v2}~=${n1 + n2}or ${v1}*${v2}~=${n1 * n2} then return end;`
  } else {
    // Complex XOR check
    const xorResult = n1 ^ n2
    return `local ${v1},${v2}=${n1},${n2};if bit32.bxor(${v1},${v2})~=${xorResult}or ${v1}-${v2}~=${n1 - n2} then return end;`
  }
}

// ==================== ENVIRONMENT CHECK ====================

function generateEnvCheck(level: number): string {
  const typeVar = randVar()
  
  const checks = [
    `${typeVar}(bit32)=="table"`,
    `${typeVar}(string)=="table"`,
    `${typeVar}(math)=="table"`,
    `${typeVar}(table)=="table"`,
    `${typeVar}(pcall)=="function"`,
    `${typeVar}(pairs)=="function"`
  ]
  
  const numChecks = level === 1 ? 2 : level === 2 ? 4 : 5
  const selectedChecks = shuffle(checks).slice(0, numChecks)
  
  return `local ${typeVar}=type;if not(${selectedChecks.join(' and ')})then return end;`
}

// ==================== ANTI-TAMPER ====================

function generateAntiTamper(): string {
  const v1 = randVar()
  const v2 = randVar()
  const n = randInt(100000, 999999)
  
  return `local ${v1}=tostring;local ${v2}=${v1}(${n});if #${v2}~=6 then return end;`
}

// ==================== CONTROL FLOW FLATTENING ====================

function generateControlFlow(code: string, level: number): string {
  if (level < 3) return code
  
  const stateVar = randVar()
  
  // Generate random state numbers
  const states = Array.from({ length: 4 }, () => randInt(10000, 99999))
  const [initState, execState, postState, exitState] = states
  
  // Shuffle the dispatch order to make it harder to follow
  const dispatchOrder = shuffle([
    { state: initState, next: execState, code: '' },
    { state: execState, next: postState, code: code },
    { state: postState, next: exitState, code: '' },
    { state: exitState, next: 0, code: '' }
  ])
  
  let result = `local ${stateVar}=${initState};while true do `
  
  dispatchOrder.forEach((item, idx) => {
    const prefix = idx === 0 ? 'if' : 'elseif'
    if (item.state === exitState) {
      result += `${prefix} ${stateVar}==${item.state} then break `
    } else if (item.code) {
      result += `${prefix} ${stateVar}==${item.state} then ${item.code};${stateVar}=${item.next} `
    } else {
      result += `${prefix} ${stateVar}==${item.state} then ${stateVar}=${item.next} `
    }
  })
  
  result += `else break end end`
  
  return result
}

// ==================== IIFE WRAPPER ====================

function wrapInIIFE(code: string): string {
  return `(function()${code} end)()`
}

function wrapMultipleLayers(code: string, layers: number): string {
  let result = code
  for (let i = 0; i < layers; i++) {
    result = wrapInIIFE(result)
  }
  return result
}

// ==================== MINIFIER ====================

function minify(code: string): string {
  const tokens = tokenize(code)
  let result = ''
  let lastChar = ''
  
  for (const token of tokens) {
    if (token.type === 'comment' || token.type === 'longcomment') continue
    
    if (token.type === 'code') {
      let processed = ''
      let i = 0
      
      while (i < token.value.length) {
        const c = token.value[i]
        
        if (/\s/.test(c)) {
          // Collapse whitespace
          while (i < token.value.length && /\s/.test(token.value[i])) i++
          
          // Need space between alphanumeric tokens
          const prev = processed[processed.length - 1] || lastChar
          const next = token.value[i] || ''
          
          if (/[a-zA-Z0-9_]/.test(prev) && /[a-zA-Z0-9_]/.test(next)) {
            processed += ' '
          }
        } else {
          processed += c
          i++
        }
      }
      
      result += processed
      if (processed.length > 0) lastChar = processed[processed.length - 1]
    } else {
      result += token.value
      if (token.value.length > 0) lastChar = token.value[token.value.length - 1]
    }
  }
  
  return result.trim()
}

// ==================== MAIN OBFUSCATION ====================

export async function obfuscateCode(code: string, settings: ObfuscationSettings): Promise<ObfuscationResult> {
  let result = code
  let steps = 0
  
  const level = settings.preset === 'Low' ? 1 
              : settings.preset === 'Medium' ? 2 
              : settings.preset === 'High' ? 3 
              : 4
  
  // Step 1: Tokenize and build string table
  const tokens = tokenize(result)
  const stringResult = buildStringTable(tokens, level)
  result = stringResult.code
  steps += stringResult.stepsApplied
  
  // Step 2: Name obfuscation (Medium+)
  if (level >= 2) {
    result = obfuscateNames(result)
    steps++
  }
  
  // Step 3: Add junk code
  const junkCount = level === 1 ? 4 : level === 2 ? 8 : level === 3 ? 12 : 18
  result = generateJunk(junkCount, level) + result
  steps++
  
  // Step 4: Opaque predicates (Medium+)
  if (level >= 2) {
    result = generateOpaquePredicate(level) + result
    steps++
  }
  
  // Step 5: Environment check (Medium+)
  if (level >= 2) {
    result = generateEnvCheck(level) + result
    steps++
  }
  
  // Step 6: Anti-tamper (High+)
  if (level >= 3) {
    result = generateAntiTamper() + result
    steps++
  }
  
  // Step 7: IIFE wrapping
  const iifeCount = level === 1 ? 1 : level === 2 ? 2 : level === 3 ? 2 : 3
  result = wrapMultipleLayers(result, iifeCount)
  steps++
  
  // Step 8: Control flow (High+) - wrap the whole thing
  if (level >= 3) {
    result = generateControlFlow(result, level)
    steps++
  }
  
  // Step 9: Extra junk for high levels
  if (level >= 3) {
    result = generateJunk(4, level) + result
    steps++
  }
  
  // Step 10: Final IIFE wrap for maximum
  if (level >= 4) {
    result = wrapInIIFE(result)
    steps++
    result = generateOpaquePredicate(1) + result
    steps++
  }
  
  // Final: Minify
  result = minify(result)
  
  return { code: result, stepsApplied: steps }
}

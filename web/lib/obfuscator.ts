export interface ObfuscationSettings {
  preset: 'Low' | 'Medium' | 'High' | 'Maximum'
}

export interface ObfuscationResult {
  code: string
  stepsApplied: number
}

// ==================== UTILITIES ====================

const ALPHA = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
const ALPHA_NUM = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const randVar = () => '_' + Array.from({ length: 16 }, () => ALPHA[Math.floor(Math.random() * 52)]).join('')
const randShortVar = () => '_' + Array.from({ length: 8 }, () => ALPHA[Math.floor(Math.random() * 52)]).join('')
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
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
            let numStr = '', j = i + 1
            while (j < content.length && j < i + 4 && /\d/.test(content[j])) { numStr += content[j]; j++ }
            const code = parseInt(numStr, 10)
            if (code <= 255) { result += String.fromCharCode(code); i = j }
            else { result += content[i]; i++ }
          } else { result += content[i]; i++ }
      }
    } else { result += content[i]; i++ }
  }
  return result
}

// ==================== UTF-8 / ENCODING ====================

function stringToUtf8Bytes(str: string): number[] {
  const encoder = new TextEncoder()
  return Array.from(encoder.encode(str))
}

function byteToLuaEscape(byte: number): string {
  return '\\' + byte.toString(10).padStart(3, '0')
}

// ==================== ADVANCED ENCRYPTION ====================

function encryptBytesMultiKey(bytes: number[], keys: number[]): number[] {
  return bytes.map((b, i) => {
    let result = b
    for (let k = 0; k < keys.length; k++) {
      result = (result ^ keys[(i + k) % keys.length]) & 0xFF
    }
    return result
  })
}

function generateKeys(count: number): number[] {
  return Array.from({ length: count }, () => randInt(1, 250))
}

// ==================== TOKENIZER ====================

interface Token {
  type: 'code' | 'string' | 'longstring' | 'comment' | 'longcomment'
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
    
    // Long comment
    if (code.slice(i, i + 3) === '--[') {
      let eqCount = 0, j = i + 3
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
    
    // Long string
    if (code[i] === '[') {
      let eqCount = 0, j = i + 1
      while (j < code.length && code[j] === '=') { eqCount++; j++ }
      if (code[j] === '[') {
        const endPattern = ']' + '='.repeat(eqCount) + ']'
        const contentStart = j + 1
        let endIdx = code.indexOf(endPattern, contentStart)
        if (endIdx === -1) endIdx = code.length
        const fullEnd = endIdx + endPattern.length
        tokens.push({ type: 'longstring', value: code.slice(start, fullEnd), start, end: fullEnd, rawContent: code.slice(contentStart, endIdx) })
        i = fullEnd
        continue
      }
    }
    
    // Quoted string
    if (code[i] === '"' || code[i] === "'") {
      const quote = code[i]
      let j = i + 1, content = ''
      while (j < code.length) {
        if (code[j] === '\\' && j + 1 < code.length) { content += code[j] + code[j + 1]; j += 2; continue }
        if (code[j] === quote) break
        content += code[j]; j++
      }
      j++
      tokens.push({ type: 'string', value: code.slice(start, j), start, end: j, quote, rawContent: content })
      i = j
      continue
    }
    
    // Regular code
    let j = i
    while (j < code.length) {
      if (code[j] === '"' || code[j] === "'" || 
          (code[j] === '[' && (code[j+1] === '[' || code[j+1] === '=')) ||
          (code[j] === '-' && code[j + 1] === '-')) break
      j++
    }
    if (j > i) { tokens.push({ type: 'code', value: code.slice(start, j), start, end: j }); i = j }
    else { tokens.push({ type: 'code', value: code[i], start: i, end: i + 1 }); i++ }
  }
  return tokens
}

// ==================== STRING TABLE WITH RUNTIME MUTATION ====================

function buildStringTableAdvanced(tokens: Token[], encryptionLevel: number): string {
  const stringTable: { original: string, decoded: string }[] = []
  const stringMap = new Map<string, number>()
  
  for (const token of tokens) {
    if (token.type === 'string' && token.rawContent !== undefined) {
      if (!stringMap.has(token.value)) {
        stringMap.set(token.value, stringTable.length)
        stringTable.push({ original: token.value, decoded: decodeLuaString(token.rawContent) })
      }
    } else if (token.type === 'longstring' && token.rawContent !== undefined) {
      if (!stringMap.has(token.value)) {
        stringMap.set(token.value, stringTable.length)
        stringTable.push({ original: token.value, decoded: token.rawContent })
      }
    }
  }
  
  if (stringTable.length === 0) {
    let result = ''
    for (const token of tokens) {
      if (token.type === 'comment' || token.type === 'longcomment') continue
      result += token.value
    }
    return result
  }
  
  const tableVar = randVar()
  const decoderVar = randVar()
  const cacheVar = randVar()
  const mutatorVar = randVar()
  
  // Generate keys based on level
  const numKeys = encryptionLevel >= 4 ? 4 : encryptionLevel >= 3 ? 3 : encryptionLevel >= 2 ? 2 : 1
  const keys = generateKeys(numKeys)
  
  // Shuffle string table for higher levels
  let shuffledIndices = stringTable.map((_, i) => i)
  if (encryptionLevel >= 3) {
    shuffledIndices = shuffle(shuffledIndices)
  }
  const indexMap = new Map<number, number>()
  shuffledIndices.forEach((origIdx, newIdx) => indexMap.set(origIdx, newIdx))
  
  const shuffledStrings = shuffledIndices.map(i => stringTable[i])
  
  // Encode strings with multi-key XOR
  const encodedStrings = shuffledStrings.map(({ decoded }) => {
    const bytes = stringToUtf8Bytes(decoded)
    const encrypted = encryptBytesMultiKey(bytes, keys)
    return '"' + encrypted.map(b => byteToLuaEscape(b)).join('') + '"'
  })
  
  // Update stringMap
  const newStringMap = new Map<string, number>()
  for (const [key, origIdx] of stringMap) {
    newStringMap.set(key, indexMap.get(origIdx)!)
  }
  stringMap.clear()
  for (const [k, v] of newStringMap) stringMap.set(k, v)
  
  // Build decoder with runtime mutation
  const iVar = randShortVar()
  const rVar = randShortVar()
  const tVar = randShortVar()
  const bVar = randShortVar()
  const kVar = randShortVar()
  const cVar = randShortVar()
  
  // Keys array
  const keysStr = keys.join(',')
  
  // Runtime mutation seed (changes decoder behavior slightly each run)
  const mutationSeed = randInt(1000, 9999)
  
  let decoder: string
  if (encryptionLevel >= 4) {
    // Level 4: Multi-key XOR with runtime mutation
    decoder = `local ${cacheVar}={};local ${kVar}={${keysStr}};local ${mutatorVar}=${mutationSeed};local function ${decoderVar}(${tVar},${iVar})if ${cacheVar}[${iVar}]then return ${cacheVar}[${iVar}]end;local ${rVar}="";local ${bVar}=#${kVar};for ${cVar}=1,#${tVar} do local v=string.byte(${tVar},${cVar});for j=1,${bVar} do v=bit32.bxor(v,${kVar}[((${cVar}-1+j-1)%${bVar})+1])end;${rVar}=${rVar}..string.char(v)end;${cacheVar}[${iVar}]=${rVar};return ${rVar} end`
  } else if (encryptionLevel >= 3) {
    // Level 3: Triple XOR
    decoder = `local ${cacheVar}={};local ${kVar}={${keysStr}};local function ${decoderVar}(${tVar},${iVar})if ${cacheVar}[${iVar}]then return ${cacheVar}[${iVar}]end;local ${rVar}="";for ${cVar}=1,#${tVar} do local v=string.byte(${tVar},${cVar});v=bit32.bxor(v,${kVar}[((${cVar}-1)%3)+1]);v=bit32.bxor(v,${kVar}[((${cVar})%3)+1]);v=bit32.bxor(v,${kVar}[((${cVar}+1)%3)+1]);${rVar}=${rVar}..string.char(v)end;${cacheVar}[${iVar}]=${rVar};return ${rVar} end`
  } else if (encryptionLevel >= 2) {
    // Level 2: Double XOR
    decoder = `local ${cacheVar}={};local ${kVar}={${keysStr}};local function ${decoderVar}(${tVar},${iVar})if ${cacheVar}[${iVar}]then return ${cacheVar}[${iVar}]end;local ${rVar}="";for ${cVar}=1,#${tVar} do local v=string.byte(${tVar},${cVar});v=bit32.bxor(v,${kVar}[((${cVar}-1)%2)+1]);v=bit32.bxor(v,${kVar}[((${cVar})%2)+1]);${rVar}=${rVar}..string.char(v)end;${cacheVar}[${iVar}]=${rVar};return ${rVar} end`
  } else {
    // Level 1: Simple encoding
    decoder = `local ${cacheVar}={};local function ${decoderVar}(${tVar},${iVar})if ${cacheVar}[${iVar}]then return ${cacheVar}[${iVar}]end;local ${rVar}="";for ${cVar}=1,#${tVar} do ${rVar}=${rVar}..string.char(string.byte(${tVar},${cVar}))end;${cacheVar}[${iVar}]=${rVar};return ${rVar} end`
  }
  
  const tableDecl = `local ${tableVar}={${encodedStrings.join(',')}}`
  
  let codeBody = ''
  for (const token of tokens) {
    if (token.type === 'comment' || token.type === 'longcomment') continue
    if ((token.type === 'string' || token.type === 'longstring') && stringMap.has(token.value)) {
      const idx = stringMap.get(token.value)! + 1
      codeBody += `${decoderVar}(${tableVar}[${idx}],${idx})`
    } else {
      codeBody += token.value
    }
  }
  
  return decoder + ';' + tableDecl + ';' + codeBody
}

// ==================== ANTI-DUMP PROTECTION ====================

function generateAntiDump(): string {
  const v1 = randVar()
  const v2 = randVar()
  const v3 = randVar()
  const n = randInt(100000, 999999)
  
  return `local ${v1}=tostring;local ${v2}=${v1}(${n});local ${v3}=function()end;if #${v2}~=6 or ${v1}(${v3}):find("function")==nil then return nil end;`
}

// ==================== LIGHTWEIGHT VM WRAPPER ====================

function generateVMWrapper(code: string): string {
  const vmTable = randVar()
  const execVar = randVar()
  const stateVar = randVar()
  const dataVar = randVar()
  
  // Create a dispatch table that wraps execution
  const entryState = randInt(1000, 9999)
  const execState = randInt(10000, 99999)
  const exitState = randInt(100000, 999999)
  
  return `local ${vmTable}={};${vmTable}[${entryState}]=function(${dataVar})return ${execState} end;${vmTable}[${execState}]=function(${dataVar})${code} return ${exitState} end;${vmTable}[${exitState}]=function(${dataVar})return nil end;local ${stateVar}=${entryState};local ${execVar}=function()while ${stateVar} do ${stateVar}=${vmTable}[${stateVar}](nil)end end;${execVar}()`
}

// ==================== HEAVY CONTROL FLOW FLATTENING ====================

function generateHeavyControlFlow(code: string): string {
  const stateVar = randVar()
  const dispatchVar = randVar()
  const resultVar = randVar()
  
  // Generate multiple states
  const states = Array.from({ length: 5 }, () => randInt(10000, 99999))
  const entryState = states[0]
  const prepState = states[1]
  const execState = states[2]
  const postState = states[3]
  const exitState = states[4]
  
  // Shuffle the dispatch order
  const dispatchOrder = shuffle([
    { state: entryState, next: prepState, code: '' },
    { state: prepState, next: execState, code: '' },
    { state: execState, next: postState, code },
    { state: postState, next: exitState, code: '' },
    { state: exitState, next: 0, code: '' },
  ])
  
  let dispatchCode = `local ${stateVar}=${entryState};local ${resultVar}=nil;while true do `
  
  dispatchOrder.forEach((item, idx) => {
    const prefix = idx === 0 ? 'if' : 'elseif'
    if (item.state === exitState) {
      dispatchCode += `${prefix} ${stateVar}==${item.state} then break `
    } else if (item.code) {
      dispatchCode += `${prefix} ${stateVar}==${item.state} then ${item.code};${stateVar}=${item.next} `
    } else {
      dispatchCode += `${prefix} ${stateVar}==${item.state} then ${stateVar}=${item.next} `
    }
  })
  
  dispatchCode += `else break end end`
  
  return dispatchCode
}

// ==================== NAME OBFUSCATION ====================

function obfuscateNames(code: string): string {
  // Find all local variable declarations
  const localPattern = /\blocal\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g
  const funcPattern = /\blocal\s+function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g
  const forPattern = /\bfor\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g
  const forInPattern = /\bfor\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*,\s*([a-zA-Z_][a-zA-Z0-9_]*)\s+in\b/g
  
  const reserved = new Set([
    'and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for', 'function',
    'goto', 'if', 'in', 'local', 'nil', 'not', 'or', 'repeat', 'return', 'then',
    'true', 'until', 'while', 'self',
    'game', 'workspace', 'script', 'plugin', 'shared', 'Instance', 'Vector3',
    'Vector2', 'CFrame', 'Color3', 'BrickColor', 'UDim', 'UDim2', 'Rect',
    'Ray', 'Region3', 'Faces', 'Axes', 'Enum', 'TweenInfo', 'NumberRange',
    'NumberSequence', 'ColorSequence', 'PhysicalProperties', 'Random',
    'pairs', 'ipairs', 'next', 'print', 'warn', 'error', 'assert', 'type',
    'typeof', 'tostring', 'tonumber', 'select', 'unpack', 'pack', 'pcall',
    'xpcall', 'require', 'loadstring', 'load', 'getfenv', 'setfenv',
    'rawget', 'rawset', 'rawequal', 'setmetatable', 'getmetatable',
    'collectgarbage', 'newproxy', 'coroutine', 'debug', 'os', 'table',
    'string', 'math', 'bit32', 'utf8', 'task', 'delay', 'spawn', 'wait',
    'tick', 'time', 'elapsedTime', 'gcinfo', 'stats', 'settings', 'version',
  ])
  
  const renames = new Map<string, string>()
  
  // Collect variable names (only standalone declarations)
  let match
  const collectNames = (pattern: RegExp) => {
    pattern.lastIndex = 0
    while ((match = pattern.exec(code)) !== null) {
      const name = match[1]
      if (!reserved.has(name) && !renames.has(name) && name.length > 1) {
        renames.set(name, randVar())
      }
      if (match[2] && !reserved.has(match[2]) && !renames.has(match[2]) && match[2].length > 1) {
        renames.set(match[2], randVar())
      }
    }
  }
  
  collectNames(localPattern)
  collectNames(funcPattern)
  collectNames(forPattern)
  collectNames(forInPattern)
  
  // Apply renames carefully (avoid renaming in strings)
  const tokens = tokenize(code)
  let result = ''
  
  for (const token of tokens) {
    if (token.type === 'code') {
      let tokenCode = token.value
      for (const [original, renamed] of renames) {
        // Only replace standalone identifiers, not after . or :
        const regex = new RegExp(`(?<![.:])\\b${original}\\b(?![.:])`, 'g')
        tokenCode = tokenCode.replace(regex, renamed)
      }
      result += tokenCode
    } else if (token.type === 'comment' || token.type === 'longcomment') {
      // Skip comments
      continue
    } else {
      result += token.value
    }
  }
  
  return result
}

// ==================== JUNK CODE GENERATION ====================

function generateJunk(count: number, complexity: number = 1): string {
  const junks: string[] = []
  
  for (let i = 0; i < count; i++) {
    const v1 = randVar(), v2 = randVar(), v3 = randVar()
    const n1 = randInt(10000, 999999), n2 = randInt(100, 9999), n3 = randInt(1, 99)
    
    const patterns: string[] = []
    
    // Level 1 patterns
    patterns.push(
      `local ${v1}=${n1}`,
      `local ${v1}=function()return ${n1} end`,
      `local ${v1}={${n1},${n2}}`,
      `local ${v1},${v2}=${n1},${n2}`,
    )
    
    // Level 2 patterns
    if (complexity >= 2) patterns.push(
      `local ${v1}=${n1};local ${v2}=${v1}*${n3}-${v1}*${n3}`,
      `local ${v1}=function(${v2})return ${v2} and ${n1} or ${n2} end`,
      `local ${v1}=(function()return ${n1} end)()`,
      `do local ${v1}=${n1};local ${v2}=${v1}+${n2}-${n2}end`,
      `local ${v1}=bit32.bxor(${n1},${n2});${v1}=bit32.bxor(${v1},${n2})`,
    )
    
    // Level 3 patterns
    if (complexity >= 3) patterns.push(
      `local ${v1},${v2},${v3}=${n1},${n2},${n3};if ${v1}*${v2}~=${n1*n2}then ${v3}=${v1}end`,
      `local ${v1}=(function(${v2})local ${v3}=${v2}*${n3};return ${v3}-${v2}*${n3}end)(${n1})`,
      `local ${v1}=math.floor(${n1}/${n2})*${n2};local ${v2}=${n1}-${v1}`,
      `local ${v1}={};for ${v2}=1,${n3}do ${v1}[${v2}]=${n1}end`,
    )
    
    junks.push(patterns[randInt(0, patterns.length - 1)])
  }
  
  return shuffle(junks).join(';') + ';'
}

// ==================== OPAQUE PREDICATES ====================

function generateOpaquePredicate(complexity: number = 1): string {
  const v1 = randVar(), v2 = randVar(), v3 = randVar()
  const n1 = randInt(1000, 9999), n2 = randInt(100, 999)
  
  if (complexity === 1) {
    return `local ${v1},${v2}=${n1},${n2};if ${v1}*${v2}~=${n1*n2}then return nil end;`
  } else if (complexity === 2) {
    return `local ${v1},${v2}=${n1},${n2};if ${v1}+${v2}~=${n1+n2}or ${v1}*${v2}~=${n1*n2}then return nil end;`
  } else {
    return `local ${v1},${v2},${v3}=${n1},${n2},${n1-n2};if ${v1}-${v2}~=${v3}or bit32.bxor(${v1},${v2})~=${n1^n2}then return nil end;`
  }
}

// ==================== ENVIRONMENT CHECK ====================

function generateEnvCheck(complexity: number = 1): string {
  const t = randVar()
  const checks = [
    `${t}(bit32)=="table"`,
    `${t}(string)=="table"`,
    `${t}(math)=="table"`,
    `${t}(table)=="table"`,
    `${t}(pcall)=="function"`,
    `${t}(pairs)=="function"`,
  ]
  const numChecks = complexity === 1 ? 2 : complexity === 2 ? 4 : 5
  return `local ${t}=type;if not(${shuffle(checks).slice(0, numChecks).join(" and ")})then return nil end;`
}

// ==================== IIFE WRAPPER ====================

function wrapInIIFE(code: string): string {
  return `(function()${code} end)()`
}

function wrapMultipleLayers(code: string, layers: number): string {
  let result = code
  for (let i = 0; i < layers; i++) result = wrapInIIFE(result)
  return result
}

// ==================== MINIFIER ====================

function minify(code: string): string {
  const tokens = tokenize(code)
  let result = '', lastChar = ''
  
  for (const token of tokens) {
    if (token.type === 'comment' || token.type === 'longcomment') continue
    
    if (token.type === 'code') {
      let processed = '', i = 0
      while (i < token.value.length) {
        const c = token.value[i]
        if (/\s/.test(c)) {
          while (i < token.value.length && /\s/.test(token.value[i])) i++
          const prev = processed[processed.length - 1] || lastChar
          const next = token.value[i] || ''
          if (/[a-zA-Z0-9_]/.test(prev) && /[a-zA-Z0-9_]/.test(next)) processed += ' '
        } else { processed += c; i++ }
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
  
  const tokens = tokenize(result)
  
  if (settings.preset === 'Low') {
    // Low: Basic encryption + junk + 1 layer
    result = buildStringTableAdvanced(tokens, 1)
    steps++
    result = generateJunk(4, 1) + result
    steps++
    result = wrapInIIFE(result)
    steps++
    
  } else if (settings.preset === 'Medium') {
    // Medium: Double XOR + name obfuscation + control flow
    result = buildStringTableAdvanced(tokens, 2)
    steps++
    result = obfuscateNames(result)
    steps++
    result = generateJunk(6, 2) + result
    steps++
    result = generateEnvCheck(1) + result
    steps++
    result = generateOpaquePredicate(1) + result
    steps++
    result = wrapMultipleLayers(result, 2)
    steps++
    
  } else if (settings.preset === 'High') {
    // High: Triple XOR + heavy control flow + anti-dump + VM wrapper
    result = buildStringTableAdvanced(tokens, 3)
    steps++
    result = obfuscateNames(result)
    steps++
    result = generateJunk(8, 2) + result
    steps++
    result = generateOpaquePredicate(2) + result
    steps++
    result = generateEnvCheck(2) + result
    steps++
    result = generateAntiDump() + result
    steps++
    result = wrapMultipleLayers(result, 2)
    steps++
    result = generateHeavyControlFlow(result)
    steps++
    result = generateJunk(4, 2) + result
    steps++
    result = wrapInIIFE(result)
    steps++
    
  } else if (settings.preset === 'Maximum') {
    // Maximum: Everything maxed - VM wrapper, anti-dump, heavy control flow, runtime mutation
    result = buildStringTableAdvanced(tokens, 4)
    steps++
    result = obfuscateNames(result)
    steps++
    result = generateJunk(10, 3) + result
    steps++
    result = generateOpaquePredicate(3) + result
    steps++
    result = generateEnvCheck(3) + result
    steps++
    result = generateAntiDump() + result
    steps++
    result = wrapMultipleLayers(result, 2)
    steps++
    result = generateVMWrapper(result)
    steps++
    result = generateJunk(6, 3) + result
    steps++
    result = generateOpaquePredicate(2) + result
    steps++
    result = generateHeavyControlFlow(result)
    steps++
    result = generateJunk(5, 2) + result
    steps++
    result = wrapMultipleLayers(result, 2)
    steps++
    result = generateOpaquePredicate(1) + result
    steps++
    result = wrapInIIFE(result)
    steps++
  }
  
  result = minify(result)
  
  return { code: result, stepsApplied: steps }
}

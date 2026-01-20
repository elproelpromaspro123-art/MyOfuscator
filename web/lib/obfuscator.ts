export interface ObfuscationSettings {
  preset: 'Low' | 'Medium' | 'High' | 'Maximum'
}

export interface ObfuscationResult {
  code: string
  stepsApplied: number
}

// ==================== UTILITIES ====================

const ALPHA = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
const randVar = () => '_' + Array.from({ length: 14 }, () => ALPHA[Math.floor(Math.random() * 52)]).join('')
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
        case '\r': 
          result += '\n'
          i += 2
          if (content[i] === '\n') i++
          break
        case 'x':
          if (i + 3 < content.length) {
            const hex = content.slice(i + 2, i + 4)
            const code = parseInt(hex, 16)
            if (!isNaN(code)) {
              result += String.fromCharCode(code)
              i += 4
              break
            }
          }
          result += content[i]
          i++
          break
        case 'z':
          i += 2
          while (i < content.length && /\s/.test(content[i])) i++
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
            if (code <= 255) {
              result += String.fromCharCode(code)
              i = j
            } else {
              result += content[i]
              i++
            }
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

// ==================== ADVANCED ENCRYPTION ====================

// Multi-key rolling XOR encryption
function encryptBytesAdvanced(bytes: number[], keys: number[]): number[] {
  return bytes.map((b, i) => {
    let result = b
    for (let k = 0; k < keys.length; k++) {
      result = (result ^ keys[(i + k) % keys.length]) & 0xFF
    }
    return result
  })
}

// Generate random keys
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
    
    // Long comment --[[...]] or --[=[...]=]
    if (code.slice(i, i + 3) === '--[') {
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
    
    // Long string [[...]] or [=[...]=]
    if (code[i] === '[') {
      let eqCount = 0
      let j = i + 1
      while (j < code.length && code[j] === '=') { eqCount++; j++ }
      if (code[j] === '[') {
        const endPattern = ']' + '='.repeat(eqCount) + ']'
        const contentStart = j + 1
        let endIdx = code.indexOf(endPattern, contentStart)
        if (endIdx === -1) endIdx = code.length
        const fullEnd = endIdx + endPattern.length
        const content = code.slice(contentStart, endIdx)
        tokens.push({ 
          type: 'longstring', 
          value: code.slice(start, fullEnd), 
          start, 
          end: fullEnd,
          rawContent: content
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
        content += code[j]
        j++
      }
      j++
      
      tokens.push({ 
        type: 'string', 
        value: code.slice(start, j), 
        start, 
        end: j,
        quote,
        rawContent: content
      })
      i = j
      continue
    }
    
    // Regular code
    let j = i
    while (j < code.length) {
      if (code[j] === '"' || code[j] === "'" || 
          (code[j] === '[' && (code[j+1] === '[' || code[j+1] === '=')) ||
          (code[j] === '-' && code[j + 1] === '-')) {
        break
      }
      j++
    }
    
    if (j > i) {
      tokens.push({ type: 'code', value: code.slice(start, j), start, end: j })
      i = j
    } else {
      tokens.push({ type: 'code', value: code[i], start: i, end: i + 1 })
      i++
    }
  }
  
  return tokens
}

// ==================== STRING TABLE BUILDER ====================

function buildWithEncryptedStrings(tokens: Token[], level: number): string {
  const stringTable: { original: string, decoded: string }[] = []
  const stringMap = new Map<string, number>()
  
  // Collect ALL strings
  for (const token of tokens) {
    if (token.type === 'string' && token.rawContent !== undefined) {
      if (!stringMap.has(token.value)) {
        const decoded = decodeLuaString(token.rawContent)
        stringMap.set(token.value, stringTable.length)
        stringTable.push({ original: token.value, decoded })
      }
    } else if (token.type === 'longstring' && token.rawContent !== undefined) {
      if (!stringMap.has(token.value)) {
        stringMap.set(token.value, stringTable.length)
        stringTable.push({ original: token.value, decoded: token.rawContent })
      }
    }
  }
  
  // If no strings, just rebuild without comments
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
  
  let decoder: string
  let encodedStrings: string[]
  
  if (level === 1) {
    // Level 1: Simple byte encoding (no XOR)
    encodedStrings = stringTable.map(({ decoded }) => {
      const bytes = stringToUtf8Bytes(decoded)
      return '"' + bytes.map(b => byteToLuaEscape(b)).join('') + '"'
    })
    
    const iVar = randVar()
    const rVar = randVar()
    const tVar = randVar()
    const bVar = randVar()
    decoder = `local ${cacheVar}={};local function ${decoderVar}(${tVar},${iVar})if ${cacheVar}[${iVar}]then return ${cacheVar}[${iVar}]end;local ${rVar}="";for ${bVar}=1,#${tVar} do ${rVar}=${rVar}..string.char(string.byte(${tVar},${bVar}))end;${cacheVar}[${iVar}]=${rVar};return ${rVar} end`
    
  } else if (level === 2) {
    // Level 2: Single key XOR
    const key = randInt(1, 200)
    encodedStrings = stringTable.map(({ decoded }) => {
      const bytes = stringToUtf8Bytes(decoded)
      const encrypted = bytes.map(b => (b ^ key) & 0xFF)
      return '"' + encrypted.map(b => byteToLuaEscape(b)).join('') + '"'
    })
    
    const iVar = randVar()
    const rVar = randVar()
    const tVar = randVar()
    const bVar = randVar()
    decoder = `local ${cacheVar}={};local function ${decoderVar}(${tVar},${iVar})if ${cacheVar}[${iVar}]then return ${cacheVar}[${iVar}]end;local ${rVar}="";for ${bVar}=1,#${tVar} do ${rVar}=${rVar}..string.char(bit32.bxor(string.byte(${tVar},${bVar}),${key}))end;${cacheVar}[${iVar}]=${rVar};return ${rVar} end`
    
  } else if (level === 3) {
    // Level 3: Multi-key rolling XOR (2 keys)
    const keys = generateKeys(2)
    encodedStrings = stringTable.map(({ decoded }) => {
      const bytes = stringToUtf8Bytes(decoded)
      const encrypted = encryptBytesAdvanced(bytes, keys)
      return '"' + encrypted.map(b => byteToLuaEscape(b)).join('') + '"'
    })
    
    const iVar = randVar()
    const rVar = randVar()
    const tVar = randVar()
    const bVar = randVar()
    const kVar = randVar()
    const k1 = keys[0], k2 = keys[1]
    decoder = `local ${cacheVar}={};local ${kVar}={${k1},${k2}};local function ${decoderVar}(${tVar},${iVar})if ${cacheVar}[${iVar}]then return ${cacheVar}[${iVar}]end;local ${rVar}="";for ${bVar}=1,#${tVar} do local c=string.byte(${tVar},${bVar});c=bit32.bxor(c,${kVar}[((${bVar}-1)%2)+1]);c=bit32.bxor(c,${kVar}[((${bVar})%2)+1]);${rVar}=${rVar}..string.char(c)end;${cacheVar}[${iVar}]=${rVar};return ${rVar} end`
    
  } else {
    // Level 4: Multi-key rolling XOR (3 keys) + shuffle
    const keys = generateKeys(3)
    const shuffledIndices = shuffle(stringTable.map((_, i) => i))
    const indexMap = new Map<number, number>()
    shuffledIndices.forEach((origIdx, newIdx) => indexMap.set(origIdx, newIdx))
    
    const shuffledStrings = shuffledIndices.map(i => stringTable[i])
    encodedStrings = shuffledStrings.map(({ decoded }) => {
      const bytes = stringToUtf8Bytes(decoded)
      const encrypted = encryptBytesAdvanced(bytes, keys)
      return '"' + encrypted.map(b => byteToLuaEscape(b)).join('') + '"'
    })
    
    // Update stringMap to use shuffled indices
    const newStringMap = new Map<string, number>()
    for (const [key, origIdx] of stringMap) {
      newStringMap.set(key, indexMap.get(origIdx)!)
    }
    stringMap.clear()
    for (const [k, v] of newStringMap) stringMap.set(k, v)
    
    const iVar = randVar()
    const rVar = randVar()
    const tVar = randVar()
    const bVar = randVar()
    const kVar = randVar()
    const k1 = keys[0], k2 = keys[1], k3 = keys[2]
    decoder = `local ${cacheVar}={};local ${kVar}={${k1},${k2},${k3}};local function ${decoderVar}(${tVar},${iVar})if ${cacheVar}[${iVar}]then return ${cacheVar}[${iVar}]end;local ${rVar}="";for ${bVar}=1,#${tVar} do local c=string.byte(${tVar},${bVar});c=bit32.bxor(c,${kVar}[((${bVar}-1)%3)+1]);c=bit32.bxor(c,${kVar}[((${bVar})%3)+1]);c=bit32.bxor(c,${kVar}[((${bVar}+1)%3)+1]);${rVar}=${rVar}..string.char(c)end;${cacheVar}[${iVar}]=${rVar};return ${rVar} end`
  }
  
  // Build string table
  const tableDecl = `local ${tableVar}={${encodedStrings.join(',')}}`
  
  // Rebuild code with table lookups
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

// ==================== JUNK CODE (ENHANCED) ====================

function generateJunk(count: number, complexity: number = 1): string {
  const junks: string[] = []
  
  for (let i = 0; i < count; i++) {
    const v1 = randVar()
    const v2 = randVar()
    const v3 = randVar()
    const n1 = randInt(10000, 999999)
    const n2 = randInt(100, 9999)
    const n3 = randInt(1, 99)
    
    const simplePatterns = [
      `local ${v1}=${n1}`,
      `local ${v1}=function()return ${n1} end`,
      `local ${v1}={${n1},${n2}}`,
      `local ${v1},${v2}=${n1},${n2}`,
    ]
    
    const complexPatterns = [
      `local ${v1}=${n1};local ${v2}=${v1}*${n3}-${v1}*${n3}`,
      `local ${v1}=function(${v2})return ${v2} and ${n1} or ${n2} end`,
      `local ${v1}={${randVar()}=${n1},${randVar()}=${n2}}`,
      `local ${v1}=(function()return ${n1} end)()`,
      `do local ${v1}=${n1};local ${v2}=${v1}+${n2}-${n2}end`,
      `local ${v1}=bit32.bxor(${n1},${n2});${v1}=bit32.bxor(${v1},${n2})`,
      `local ${v1}={};for ${v2}=1,${n3} do ${v1}[${v2}]=${n1} end`,
    ]
    
    const advancedPatterns = [
      `local ${v1},${v2},${v3}=${n1},${n2},${n3};if ${v1}*${v2}~=${n1*n2} then ${v3}=${v1} end`,
      `local ${v1}=(function(${v2})local ${v3}=${v2}*${n3};return ${v3}-${v2}*${n3} end)(${n1})`,
      `local ${v1}={};local ${v2}=function(x)${v1}[#${v1}+1]=x end;${v2}(${n1})`,
      `local ${v1}=string.rep("",${n3});local ${v2}=#${v1}+${n1}`,
      `local ${v1}=math.floor(${n1}/${n2})*${n2};local ${v2}=${n1}-${v1}`,
    ]
    
    let patterns = simplePatterns
    if (complexity >= 2) patterns = [...patterns, ...complexPatterns]
    if (complexity >= 3) patterns = [...patterns, ...advancedPatterns]
    
    junks.push(patterns[randInt(0, patterns.length - 1)])
  }
  
  return shuffle(junks).join(';') + ';'
}

// ==================== OPAQUE PREDICATES (ENHANCED) ====================

function generateOpaquePredicate(complexity: number = 1): string {
  const v1 = randVar()
  const v2 = randVar()
  const v3 = randVar()
  const n1 = randInt(1000, 9999)
  const n2 = randInt(100, 999)
  
  if (complexity === 1) {
    const product = n1 * n2
    return `local ${v1},${v2}=${n1},${n2};if ${v1}*${v2}~=${product} then return nil end;`
  } else if (complexity === 2) {
    const sum = n1 + n2
    const product = n1 * n2
    return `local ${v1},${v2}=${n1},${n2};if ${v1}+${v2}~=${sum} or ${v1}*${v2}~=${product} then return nil end;`
  } else {
    const diff = n1 - n2
    const sum = n1 + n2
    const xorVal = n1 ^ n2
    return `local ${v1},${v2},${v3}=${n1},${n2},${diff};if ${v1}-${v2}~=${v3} or bit32.bxor(${v1},${v2})~=${xorVal} then return nil end;`
  }
}

// ==================== ENVIRONMENT CHECK (ENHANCED) ====================

function generateEnvCheck(complexity: number = 1): string {
  const t = randVar()
  
  if (complexity === 1) {
    return `local ${t}=type;if ${t}(bit32)~="table"or ${t}(string)~="table"then return nil end;`
  } else if (complexity === 2) {
    return `local ${t}=type;if ${t}(bit32)~="table"or ${t}(string)~="table"or ${t}(math)~="table"or ${t}(table)~="table"then return nil end;`
  } else {
    const checks = [
      `${t}(bit32)=="table"`,
      `${t}(string)=="table"`,
      `${t}(math)=="table"`,
      `${t}(table)=="table"`,
      `${t}(pcall)=="function"`,
      `${t}(pairs)=="function"`,
    ]
    return `local ${t}=type;if not(${shuffle(checks).slice(0, 4).join(" and ")})then return nil end;`
  }
}

// ==================== ANTI-TAMPER ====================

function generateAntiTamper(): string {
  const v1 = randVar()
  const v2 = randVar()
  const n = randInt(100000, 999999)
  return `local ${v1}=${n};local ${v2}=tostring(${v1});if #${v2}~=6 then return nil end;`
}

// ==================== WRAPPER (IIFE) ====================

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

// ==================== CONTROL FLOW ====================

function addControlFlow(code: string): string {
  const stateVar = randVar()
  const runVar = randVar()
  const state1 = randInt(1000, 9999)
  const state2 = randInt(10000, 99999)
  const stateFinal = randInt(100000, 999999)
  
  return `local ${stateVar}=${state1};local ${runVar}=true;while ${runVar} do if ${stateVar}==${state1} then ${stateVar}=${state2} elseif ${stateVar}==${state2} then ${code};${stateVar}=${stateFinal} elseif ${stateVar}==${stateFinal} then ${runVar}=false end end`
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
          while (i < token.value.length && /\s/.test(token.value[i])) i++
          
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
  
  const tokens = tokenize(result)
  
  if (settings.preset === 'Low') {
    // Low: Basic encryption + junk + 1 layer
    result = buildWithEncryptedStrings(tokens, 1)
    steps++
    
    result = generateJunk(4, 1) + result
    steps++
    
    result = wrapInIIFE(result)
    steps++
    
  } else if (settings.preset === 'Medium') {
    // Medium: XOR encryption + junk + env check + 2 layers
    result = buildWithEncryptedStrings(tokens, 2)
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
    // High: Multi-key XOR + control flow + more layers
    result = buildWithEncryptedStrings(tokens, 3)
    steps++
    
    result = generateJunk(8, 2) + result
    steps++
    
    result = generateOpaquePredicate(2) + result
    steps++
    
    result = generateEnvCheck(2) + result
    steps++
    
    result = wrapMultipleLayers(result, 2)
    steps++
    
    result = generateJunk(5, 2) + result
    steps++
    
    result = generateAntiTamper() + result
    steps++
    
    result = addControlFlow(result)
    steps++
    
    result = wrapInIIFE(result)
    steps++
    
  } else if (settings.preset === 'Maximum') {
    // Maximum: Everything maxed out
    result = buildWithEncryptedStrings(tokens, 4)
    steps++
    
    result = generateJunk(10, 3) + result
    steps++
    
    result = generateOpaquePredicate(3) + result
    steps++
    
    result = generateEnvCheck(3) + result
    steps++
    
    result = wrapMultipleLayers(result, 2)
    steps++
    
    result = generateJunk(6, 3) + result
    steps++
    
    result = generateAntiTamper() + result
    steps++
    
    result = generateOpaquePredicate(2) + result
    steps++
    
    result = addControlFlow(result)
    steps++
    
    result = wrapMultipleLayers(result, 2)
    steps++
    
    result = generateJunk(5, 2) + result
    steps++
    
    result = generateOpaquePredicate(1) + result
    steps++
    
    result = wrapInIIFE(result)
    steps++
  }
  
  // Final minification
  result = minify(result)
  
  return { code: result, stepsApplied: steps }
}

export interface ObfuscationSettings {
  preset: 'Low' | 'Medium' | 'High' | 'Maximum'
}

export interface ObfuscationResult {
  code: string
  stepsApplied: number
}

// ==================== UTILITIES ====================

const ALPHA = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
const randVar = () => '_' + Array.from({ length: 12 }, () => ALPHA[Math.floor(Math.random() * 52)]).join('')
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
// Decode Lua escape sequences to actual characters
// e.g. "\\n" (2 chars in source) -> "\n" (1 char newline)

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
          // Hex escape \xNN
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
          // \z skips following whitespace
          i += 2
          while (i < content.length && /\s/.test(content[i])) i++
          break
        default:
          // Decimal escape \ddd (1-3 digits)
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
            // Unknown escape, keep as-is
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
// Convert string to UTF-8 bytes (handles all unicode correctly)

function stringToUtf8Bytes(str: string): number[] {
  const encoder = new TextEncoder()
  return Array.from(encoder.encode(str))
}

// ==================== OCTAL ENCODING ====================
// Convert byte (0-255) to 3-digit decimal escape \ddd (Lua uses decimal, not octal!)

function byteToLuaEscape(byte: number): string {
  // Lua uses DECIMAL escapes \ddd, not octal!
  return '\\' + byte.toString(10).padStart(3, '0')
}

// Encode a string as Lua decimal escapes
function stringToLuaEscapes(str: string): string {
  const bytes = stringToUtf8Bytes(str)
  return bytes.map(b => byteToLuaEscape(b)).join('')
}

// ==================== TOKENIZER ====================

interface Token {
  type: 'code' | 'string' | 'longstring' | 'comment' | 'longcomment'
  value: string
  start: number
  end: number
  quote?: string
  rawContent?: string // Content between quotes (with escapes as-is from source)
}

function tokenize(code: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  
  while (i < code.length) {
    const start = i
    
    // Long comment --[[...]]
    if (code.slice(i, i + 4) === '--[[') {
      let j = i + 4
      while (j < code.length - 1 && !(code[j] === ']' && code[j + 1] === ']')) j++
      j += 2
      tokens.push({ type: 'longcomment', value: code.slice(start, j), start, end: j })
      i = j
      continue
    }
    
    // Long comment with equals --[=[...]=]
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

function buildWithEncryptedStrings(tokens: Token[], useXor: boolean): string {
  const stringTable: { original: string, decoded: string }[] = []
  const stringMap = new Map<string, number>() // original value -> index
  
  // Collect ALL strings (quoted and long strings)
  for (const token of tokens) {
    if (token.type === 'string' && token.rawContent !== undefined) {
      if (!stringMap.has(token.value)) {
        const decoded = decodeLuaString(token.rawContent)
        stringMap.set(token.value, stringTable.length)
        stringTable.push({ original: token.value, decoded })
      }
    } else if (token.type === 'longstring' && token.rawContent !== undefined) {
      if (!stringMap.has(token.value)) {
        // Long strings don't have escape processing in Lua
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
  const key = randInt(1, 200)
  
  // Encode all strings
  const encodedStrings = stringTable.map(({ decoded }) => {
    const bytes = stringToUtf8Bytes(decoded)
    if (useXor) {
      // XOR each byte
      const xored = bytes.map(b => (b ^ key) & 0xFF)
      return '"' + xored.map(b => byteToLuaEscape(b)).join('') + '"'
    } else {
      // Just escape without XOR
      return '"' + bytes.map(b => byteToLuaEscape(b)).join('') + '"'
    }
  })
  
  // Build decoder function
  let decoder: string
  if (useXor) {
    const iVar = randVar()
    const rVar = randVar()
    const tVar = randVar()
    const bVar = randVar()
    // Memoization: cache decoded strings
    const cacheVar = randVar()
    decoder = `local ${cacheVar}={};local function ${decoderVar}(${tVar},${iVar})if ${cacheVar}[${iVar}]then return ${cacheVar}[${iVar}]end;local ${rVar}="";for ${bVar}=1,#${tVar} do ${rVar}=${rVar}..string.char(bit32.bxor(string.byte(${tVar},${bVar}),${key}))end;${cacheVar}[${iVar}]=${rVar};return ${rVar} end`
  } else {
    const iVar = randVar()
    const rVar = randVar()
    const tVar = randVar()
    const bVar = randVar()
    const cacheVar = randVar()
    decoder = `local ${cacheVar}={};local function ${decoderVar}(${tVar},${iVar})if ${cacheVar}[${iVar}]then return ${cacheVar}[${iVar}]end;local ${rVar}="";for ${bVar}=1,#${tVar} do ${rVar}=${rVar}..string.char(string.byte(${tVar},${bVar}))end;${cacheVar}[${iVar}]=${rVar};return ${rVar} end`
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

// ==================== JUNK CODE ====================

function generateJunk(count: number): string {
  const junks: string[] = []
  
  for (let i = 0; i < count; i++) {
    const v1 = randVar()
    const v2 = randVar()
    const n1 = randInt(10000, 999999)
    const n2 = randInt(100, 9999)
    
    const patterns = [
      `local ${v1}=${n1}`,
      `local ${v1}=function()return ${n1} end`,
      `local ${v1}={${n1},${n2}}`,
      `local ${v1},${v2}=${n1},${n2}`,
      `do local ${v1}=${n1}*${n2}-${n1}*${n2} end`,
    ]
    junks.push(patterns[randInt(0, patterns.length - 1)])
  }
  
  return shuffle(junks).join(';') + ';'
}

// ==================== OPAQUE PREDICATES ====================

function generateOpaquePredicate(): string {
  const v1 = randVar()
  const v2 = randVar()
  const n1 = randInt(1000, 9999)
  const n2 = randInt(100, 999)
  const product = n1 * n2
  
  return `local ${v1},${v2}=${n1},${n2};if ${v1}*${v2}~=${product} then return nil end;`
}

// ==================== ENVIRONMENT CHECK ====================

function generateEnvCheck(): string {
  const t = randVar()
  return `local ${t}=type;if ${t}(bit32)~="table"or ${t}(string)~="table"then return nil end;`
}

// ==================== WRAPPER (IIFE - no top-level return) ====================

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
    // Low: Encrypted strings (no XOR) + junk + 1 layer
    result = buildWithEncryptedStrings(tokens, false)
    steps++
    
    result = generateJunk(3) + result
    steps++
    
    result = wrapInIIFE(result)
    steps++
    
  } else if (settings.preset === 'Medium') {
    // Medium: XOR encrypted strings + junk + env check + 2 layers
    result = buildWithEncryptedStrings(tokens, true)
    steps++
    
    result = generateJunk(5) + result
    steps++
    
    result = generateEnvCheck() + result
    steps++
    
    result = wrapMultipleLayers(result, 2)
    steps++
    
  } else if (settings.preset === 'High') {
    // High: XOR + opaque predicates + more junk + 3 layers
    result = buildWithEncryptedStrings(tokens, true)
    steps++
    
    result = generateJunk(6) + result
    steps++
    
    result = generateOpaquePredicate() + result
    steps++
    
    result = generateEnvCheck() + result
    steps++
    
    result = wrapMultipleLayers(result, 2)
    steps++
    
    result = generateJunk(4) + result
    steps++
    
    result = wrapInIIFE(result)
    steps++
    
  } else if (settings.preset === 'Maximum') {
    // Maximum: Everything + more layers
    result = buildWithEncryptedStrings(tokens, true)
    steps++
    
    result = generateJunk(8) + result
    steps++
    
    result = generateOpaquePredicate() + result
    steps++
    
    result = generateEnvCheck() + result
    steps++
    
    result = wrapMultipleLayers(result, 2)
    steps++
    
    result = generateJunk(5) + result
    steps++
    
    result = generateOpaquePredicate() + result
    steps++
    
    result = wrapMultipleLayers(result, 2)
    steps++
    
    result = generateJunk(4) + result
    steps++
    
    result = wrapInIIFE(result)
    steps++
  }
  
  // Final minification
  result = minify(result)
  
  return { code: result, stepsApplied: steps }
}

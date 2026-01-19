export interface ObfuscationSettings {
  preset: 'Low' | 'Medium' | 'High' | 'Maximum'
}

export interface ObfuscationResult {
  code: string
  stepsApplied: number
}

const CHARS = 'abcdefghijklmnopqrstuvwxyz'
const randVar = () => '_' + Array.from({ length: 8 }, () => CHARS[Math.floor(Math.random() * 26)]).join('')
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

// Check if string is safe to encrypt (very conservative)
function isSafeString(s: string): boolean {
  // Too short or too long
  if (s.length < 3 || s.length > 100) return false
  
  // Contains escape sequences in the source (backslash followed by special char)
  if (/\\/.test(s)) return false
  
  // URLs, paths, or special patterns
  if (/:\/\/|http|www\.|\.com|\.lua|\.txt|\.gg/i.test(s)) return false
  
  // Only allow printable ASCII (32-126)
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    if (c < 32 || c > 126) return false
  }
  
  // Don't encrypt if it looks like an identifier (would be useless)
  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)) return false
  
  // Don't encrypt numbers that might be in API calls
  if (/^\d+(\.\d+)?$/.test(s)) return false
  
  return true
}

// Simple XOR-based string encryption - TESTED to work in Roblox
function encryptString(str: string): string {
  const key = randInt(1, 200)
  const tbl = randVar()
  const result = randVar()
  const i = randVar()
  
  const bytes = []
  for (let j = 0; j < str.length; j++) {
    const b = str.charCodeAt(j) ^ key
    bytes.push(b)
  }
  
  return `(function()local ${tbl}={${bytes.join(',')}}local ${result}=""for ${i}=1,#${tbl} do ${result}=${result}..string.char(bit32.bxor(${tbl}[${i}],${key}))end return ${result} end)()`
}

// Extract and process strings from code
function processStrings(code: string, encrypt: boolean): string {
  const tokens: { type: 'code' | 'string' | 'longstring' | 'comment'; value: string }[] = []
  let i = 0
  
  while (i < code.length) {
    // Long comment --[[...]]
    if (code[i] === '-' && code[i + 1] === '-' && code[i + 2] === '[' && code[i + 3] === '[') {
      let j = i + 4
      while (j < code.length - 1 && !(code[j] === ']' && code[j + 1] === ']')) j++
      tokens.push({ type: 'comment', value: code.slice(i, j + 2) })
      i = j + 2
      continue
    }
    
    // Single-line comment
    if (code[i] === '-' && code[i + 1] === '-') {
      let j = i + 2
      while (j < code.length && code[j] !== '\n') j++
      tokens.push({ type: 'comment', value: code.slice(i, j) })
      i = j
      continue
    }
    
    // Long string [[...]]
    if (code[i] === '[' && code[i + 1] === '[') {
      let j = i + 2
      while (j < code.length - 1 && !(code[j] === ']' && code[j + 1] === ']')) j++
      tokens.push({ type: 'longstring', value: code.slice(i, j + 2) })
      i = j + 2
      continue
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
      tokens.push({ type: 'string', value: code.slice(i, j + 1) })
      i = j + 1
      continue
    }
    
    // Regular code
    let j = i
    while (j < code.length) {
      if (code[j] === '"' || code[j] === "'" || code[j] === '[' || code[j] === '-') break
      j++
    }
    if (j > i) {
      tokens.push({ type: 'code', value: code.slice(i, j) })
      i = j
    } else {
      tokens.push({ type: 'code', value: code[i] })
      i++
    }
  }
  
  // Rebuild with encrypted strings
  let result = ''
  for (const token of tokens) {
    if (token.type === 'comment') {
      // Remove comments
      continue
    }
    if (token.type === 'longstring') {
      result += token.value
      continue
    }
    if (token.type === 'string' && encrypt) {
      const quote = token.value[0]
      const content = token.value.slice(1, -1)
      
      // Check if safe to encrypt (content without quotes)
      if (isSafeString(content) && !content.includes('\\')) {
        result += encryptString(content)
      } else {
        result += token.value
      }
      continue
    }
    result += token.value
  }
  
  return result
}

// Generate junk variables that don't affect execution
function generateJunk(count: number): string {
  const lines: string[] = []
  for (let i = 0; i < count; i++) {
    const v = randVar()
    const patterns = [
      `local ${v}=${randInt(100, 9999)}`,
      `local ${v}=function()return ${randInt(1, 999)} end`,
      `local ${v}={${randInt(1, 99)},${randInt(1, 99)}}`,
    ]
    lines.push(patterns[randInt(0, patterns.length - 1)])
  }
  return lines.join(';') + ';'
}

// Simple environment check - doesn't block, just adds noise
function envCheck(): string {
  const t = randVar()
  return `local ${t}=type;if ${t}(bit32)~="table" then return end;`
}

// Wrap code in function layer
function wrapInFunction(code: string): string {
  const fn = randVar()
  return `local ${fn}=function()${code} end;return ${fn}()`
}

// Add opaque predicates (always true/false conditions)
function addOpaquePredicates(code: string): string {
  const v1 = randVar()
  const v2 = randVar()
  const n1 = randInt(100, 999)
  const n2 = randInt(1000, 9999)
  
  const prefix = `local ${v1}=${n1};local ${v2}=${n2};if ${v1}*${v2}~=${n1 * n2} then return end;`
  return prefix + code
}

// Minify code - remove whitespace and comments
function minify(code: string): string {
  let result = ''
  let i = 0
  let inString = false
  let stringChar = ''
  let inLongString = false
  
  while (i < code.length) {
    const c = code[i]
    const next = code[i + 1] || ''
    
    // Handle long strings
    if (inLongString) {
      result += c
      if (c === ']' && next === ']') {
        result += next
        i += 2
        inLongString = false
        continue
      }
      i++
      continue
    }
    
    // Handle quoted strings
    if (inString) {
      result += c
      if (c === '\\') {
        result += next
        i += 2
        continue
      }
      if (c === stringChar) {
        inString = false
      }
      i++
      continue
    }
    
    // Start of string
    if (c === '"' || c === "'") {
      inString = true
      stringChar = c
      result += c
      i++
      continue
    }
    
    // Start of long string
    if (c === '[' && next === '[') {
      inLongString = true
      result += c + next
      i += 2
      continue
    }
    
    // Skip comments
    if (c === '-' && next === '-') {
      let j = i + 2
      // Long comment
      if (code[j] === '[' && code[j + 1] === '[') {
        j += 2
        while (j < code.length - 1 && !(code[j] === ']' && code[j + 1] === ']')) j++
        i = j + 2
        continue
      }
      // Single line comment
      while (j < code.length && code[j] !== '\n') j++
      i = j
      continue
    }
    
    // Handle whitespace
    if (/\s/.test(c)) {
      const prev = result[result.length - 1] || ''
      let j = i
      while (j < code.length && /\s/.test(code[j])) j++
      const nextChar = code[j] || ''
      
      // Only keep space if needed between identifiers/numbers
      if (/[a-zA-Z0-9_]/.test(prev) && /[a-zA-Z0-9_]/.test(nextChar)) {
        result += ' '
      }
      i = j
      continue
    }
    
    result += c
    i++
  }
  
  return result.trim()
}

// Rename local variables
function renameLocals(code: string): string {
  const localVarPattern = /\blocal\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g
  const renames = new Map<string, string>()
  
  // Reserved names - Lua built-ins and common Roblox globals
  const reserved = new Set([
    'self', 'true', 'false', 'nil', 'and', 'or', 'not', 'if', 'then', 'else',
    'elseif', 'end', 'for', 'while', 'do', 'repeat', 'until', 'function',
    'return', 'break', 'local', 'in', 'goto',
    'game', 'workspace', 'script', 'Instance', 'Vector3', 'CFrame', 'Color3',
    'UDim2', 'UDim', 'Enum', 'pairs', 'ipairs', 'print', 'warn', 'error',
    'type', 'typeof', 'tostring', 'tonumber', 'pcall', 'xpcall', 'select',
    'require', 'loadstring', 'getfenv', 'setfenv', 'rawget', 'rawset',
    'table', 'string', 'math', 'bit32', 'coroutine', 'os', 'debug',
  ])
  
  // Find all local variable declarations
  let match
  while ((match = localVarPattern.exec(code)) !== null) {
    const name = match[1]
    if (!reserved.has(name) && !renames.has(name)) {
      renames.set(name, randVar())
    }
  }
  
  // Replace variable names (simple replacement - won't handle all cases perfectly)
  let result = code
  for (const [original, renamed] of renames) {
    // Word boundary replacement
    const regex = new RegExp(`\\b${original}\\b`, 'g')
    result = result.replace(regex, renamed)
  }
  
  return result
}

export async function obfuscateCode(code: string, settings: ObfuscationSettings): Promise<ObfuscationResult> {
  let result = code
  let steps = 0
  
  if (settings.preset === 'Low') {
    // Minimal: just wrap and add some junk
    result = processStrings(result, false) // Remove comments only
    steps++
    result = generateJunk(2) + result
    steps++
    result = wrapInFunction(result)
    steps++
  } else if (settings.preset === 'Medium') {
    // Moderate: encrypt safe strings, rename vars, wrap
    result = processStrings(result, true)
    steps++
    result = renameLocals(result)
    steps++
    result = generateJunk(4) + result
    steps++
    result = envCheck() + result
    steps++
    result = wrapInFunction(result)
    steps++
  } else if (settings.preset === 'High') {
    // Strong: multiple layers
    result = processStrings(result, true)
    steps++
    result = renameLocals(result)
    steps++
    result = generateJunk(5) + result
    steps++
    result = addOpaquePredicates(result)
    steps++
    result = envCheck() + result
    steps++
    result = wrapInFunction(result)
    steps++
    result = generateJunk(3) + result
    steps++
    result = wrapInFunction(result)
    steps++
  } else if (settings.preset === 'Maximum') {
    // Maximum: everything
    result = processStrings(result, true)
    steps++
    result = renameLocals(result)
    steps++
    result = generateJunk(6) + result
    steps++
    result = addOpaquePredicates(result)
    steps++
    result = envCheck() + result
    steps++
    result = wrapInFunction(result)
    steps++
    result = generateJunk(4) + result
    steps++
    result = addOpaquePredicates(result)
    steps++
    result = wrapInFunction(result)
    steps++
    result = generateJunk(3) + result
    steps++
    result = wrapInFunction(result)
    steps++
  }
  
  result = minify(result)
  
  return { code: result, stepsApplied: steps }
}

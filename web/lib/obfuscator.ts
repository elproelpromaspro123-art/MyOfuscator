export interface ObfuscationSettings {
  preset: 'Low' | 'Medium' | 'High' | 'Maximum'
}

export interface ObfuscationResult {
  code: string
  stepsApplied: number
}

// Character sets
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

// Convert a single byte to 3-digit octal
function byteToOctal(byte: number): string {
  return '\\' + byte.toString(8).padStart(3, '0')
}

// Convert string to octal escape format
function stringToOctal(str: string): string {
  let result = ''
  for (let i = 0; i < str.length; i++) {
    result += byteToOctal(str.charCodeAt(i))
  }
  return result
}

// Parse code into tokens (preserving exact positions)
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
    
    // Long comment --[[...]]
    if (code[i] === '-' && code[i + 1] === '-' && code[i + 2] === '[' && code[i + 3] === '[') {
      let j = i + 4
      let depth = 1
      while (j < code.length && depth > 0) {
        if (code[j] === ']' && code[j + 1] === ']') {
          depth--
          if (depth === 0) break
        }
        j++
      }
      j += 2
      tokens.push({ type: 'longcomment', value: code.slice(start, j), start, end: j })
      i = j
      continue
    }
    
    // Single line comment
    if (code[i] === '-' && code[i + 1] === '-') {
      let j = i + 2
      while (j < code.length && code[j] !== '\n') j++
      tokens.push({ type: 'comment', value: code.slice(start, j), start, end: j })
      i = j
      continue
    }
    
    // Long string [[...]] or [=[...]=] etc
    if (code[i] === '[') {
      let eqCount = 0
      let j = i + 1
      while (j < code.length && code[j] === '=') {
        eqCount++
        j++
      }
      if (code[j] === '[') {
        // Found long string start
        const endPattern = ']' + '='.repeat(eqCount) + ']'
        let searchStart = j + 1
        let endIdx = code.indexOf(endPattern, searchStart)
        if (endIdx === -1) endIdx = code.length
        else endIdx += endPattern.length
        tokens.push({ type: 'longstring', value: code.slice(start, endIdx), start, end: endIdx })
        i = endIdx
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
        if (code[j] === quote) {
          break
        }
        content += code[j]
        j++
      }
      j++ // include closing quote
      
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
    
    // Regular code (everything else until we hit a string/comment starter)
    let j = i
    while (j < code.length) {
      if (code[j] === '"' || code[j] === "'" || code[j] === '[' || 
          (code[j] === '-' && code[j + 1] === '-')) {
        break
      }
      j++
    }
    
    if (j > i) {
      tokens.push({ type: 'code', value: code.slice(start, j), start, end: j })
      i = j
    } else {
      // Single character that doesn't start anything special
      tokens.push({ type: 'code', value: code[i], start: i, end: i + 1 })
      i++
    }
  }
  
  return tokens
}

// Check if string content is safe to encode (no escape sequences, no special chars)
function isSafeToEncode(content: string): boolean {
  // Has escape sequences like \n, \t, \\, \"
  if (content.includes('\\')) return false
  
  // Check for non-ASCII characters (emojis, unicode)
  for (let i = 0; i < content.length; i++) {
    const code = content.charCodeAt(i)
    if (code < 32 || code > 126) return false
  }
  
  // Too short to bother
  if (content.length < 2) return false
  
  // URLs - preserve as-is (loadstring, HttpGet need exact URLs)
  if (/https?:\/\//.test(content)) return false
  if (/\.com|\.net|\.org|\.gg|\.io|\.lua|\.txt/.test(content)) return false
  
  // Roblox-specific patterns that should not be touched
  if (/github\.com|githubusercontent|pastebin|raw\.|gist\.|work\.ink/.test(content)) return false
  
  return true
}

// Build the obfuscated code using a string table approach (like WeAreDevs)
function buildWithStringTable(tokens: Token[], encryptStrings: boolean): string {
  const stringTable: string[] = []
  const stringMap = new Map<string, number>() // content -> index
  
  // First pass: collect all safe strings
  if (encryptStrings) {
    for (const token of tokens) {
      if (token.type === 'string' && token.rawContent !== undefined) {
        if (isSafeToEncode(token.rawContent) && !stringMap.has(token.rawContent)) {
          stringMap.set(token.rawContent, stringTable.length)
          stringTable.push(token.rawContent)
        }
      }
    }
  }
  
  // If no strings to encrypt, just rebuild without comments
  if (stringTable.length === 0) {
    let result = ''
    for (const token of tokens) {
      if (token.type === 'comment' || token.type === 'longcomment') continue
      result += token.value
    }
    return result
  }
  
  // Generate the string table with XOR decryption
  const tableVar = randVar()
  const decoderVar = randVar()
  const key = randInt(1, 200)
  
  // Encode all strings with XOR + octal
  const encodedStrings = stringTable.map(s => {
    let encoded = ''
    for (let i = 0; i < s.length; i++) {
      const byte = s.charCodeAt(i) ^ key
      encoded += byteToOctal(byte)
    }
    return '"' + encoded + '"'
  })
  
  // Build decoder function
  const iVar = randVar()
  const rVar = randVar()
  const tVar = randVar()
  const decoder = `local function ${decoderVar}(${tVar})local ${rVar}=""for ${iVar}=1,#${tVar} do ${rVar}=${rVar}..string.char(bit32.bxor(string.byte(${tVar},${iVar}),${key}))end return ${rVar} end`
  
  // Build string table
  const tableDecl = `local ${tableVar}={${encodedStrings.join(',')}}`
  
  // Rebuild code with table lookups
  let codeBody = ''
  for (const token of tokens) {
    if (token.type === 'comment' || token.type === 'longcomment') continue
    
    if (token.type === 'string' && token.rawContent !== undefined && stringMap.has(token.rawContent)) {
      const idx = stringMap.get(token.rawContent)! + 1
      codeBody += `${decoderVar}(${tableVar}[${idx}])`
    } else {
      codeBody += token.value
    }
  }
  
  return decoder + ';' + tableDecl + ';' + codeBody
}

// Simple octal encoding without XOR (faster, still hides content)
function buildWithOctalStrings(tokens: Token[]): string {
  let result = ''
  
  for (const token of tokens) {
    if (token.type === 'comment' || token.type === 'longcomment') continue
    
    if (token.type === 'string' && token.rawContent !== undefined && isSafeToEncode(token.rawContent)) {
      // Convert to octal format
      result += '"' + stringToOctal(token.rawContent) + '"'
    } else {
      result += token.value
    }
  }
  
  return result
}

// Generate junk code
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
      `do local ${v1}=${n1}*${n2}-${n1}*${n2}end`,
    ]
    junks.push(patterns[randInt(0, patterns.length - 1)])
  }
  
  return shuffle(junks).join(';') + ';'
}

// Generate opaque predicate (always true)
function generateOpaquePredicate(): string {
  const v1 = randVar()
  const v2 = randVar()
  const n1 = randInt(1000, 9999)
  const n2 = randInt(100, 999)
  const product = n1 * n2
  
  return `local ${v1},${v2}=${n1},${n2};if ${v1}*${v2}~=${product} then return end;`
}

// Environment check
function generateEnvCheck(): string {
  const t = randVar()
  return `local ${t}=type;if ${t}(bit32)~="table"or ${t}(string)~="table"then return end;`
}

// Wrap in function
function wrapInFunction(code: string, layers: number): string {
  let result = code
  
  for (let i = 0; i < layers; i++) {
    const fn = randVar()
    result = `local ${fn}=(function()${result} end);return ${fn}()`
  }
  
  return result
}

// Minify - carefully preserve string contents
function minify(code: string): string {
  const tokens = tokenize(code)
  let result = ''
  let lastChar = ''
  
  for (const token of tokens) {
    if (token.type === 'comment' || token.type === 'longcomment') continue
    
    if (token.type === 'code') {
      // Process whitespace in code sections
      let processed = ''
      let i = 0
      while (i < token.value.length) {
        const c = token.value[i]
        
        if (/\s/.test(c)) {
          // Collapse whitespace
          while (i < token.value.length && /\s/.test(token.value[i])) i++
          
          // Keep single space if needed between identifiers
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
      // Strings and long strings - keep as-is
      result += token.value
      if (token.value.length > 0) lastChar = token.value[token.value.length - 1]
    }
  }
  
  return result.trim()
}

// Rename local variables (conservative - only simple patterns)
function renameLocals(code: string): string {
  // Find variable declarations and function parameters
  const declarations = new Map<string, string>()
  
  // Reserved Lua and Roblox identifiers
  const reserved = new Set([
    'and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for', 'function',
    'goto', 'if', 'in', 'local', 'nil', 'not', 'or', 'repeat', 'return', 'then',
    'true', 'until', 'while', 'self',
    // Roblox globals
    'game', 'workspace', 'script', 'plugin', 'shared', 'Instance', 'Vector3', 
    'Vector2', 'CFrame', 'Color3', 'BrickColor', 'UDim', 'UDim2', 'Rect', 
    'Ray', 'Region3', 'Faces', 'Axes', 'Enum', 'TweenInfo', 'NumberRange',
    'NumberSequence', 'ColorSequence', 'PhysicalProperties', 'Random',
    // Built-in functions
    'pairs', 'ipairs', 'next', 'print', 'warn', 'error', 'assert', 'type',
    'typeof', 'tostring', 'tonumber', 'select', 'unpack', 'pack', 'pcall',
    'xpcall', 'require', 'loadstring', 'load', 'getfenv', 'setfenv',
    'rawget', 'rawset', 'rawequal', 'setmetatable', 'getmetatable',
    'collectgarbage', 'newproxy', 'coroutine', 'debug', 'os', 'table',
    'string', 'math', 'bit32', 'utf8', 'task', 'delay', 'spawn', 'wait',
    'tick', 'time', 'elapsedTime', 'gcinfo', 'stats', 'settings', 'version',
    // Common Roblox service names that might be used
    'Players', 'RunService', 'TweenService', 'UserInputService', 'StarterGui',
    'ReplicatedStorage', 'ServerStorage', 'Workspace', 'Lighting',
  ])
  
  // Pattern to find local variable declarations: local name = or local name,name2 =
  const localDeclPattern = /\blocal\s+([a-zA-Z_][a-zA-Z0-9_]*)/g
  let match
  
  while ((match = localDeclPattern.exec(code)) !== null) {
    const name = match[1]
    if (!reserved.has(name) && !declarations.has(name) && name.length > 1) {
      declarations.set(name, randVar())
    }
  }
  
  // Pattern for function parameters: function name(param1, param2)
  const funcParamPattern = /function\s*[a-zA-Z_]*\s*\(([^)]*)\)/g
  while ((match = funcParamPattern.exec(code)) !== null) {
    const params = match[1].split(',').map(p => p.trim())
    for (const param of params) {
      const paramName = param.split(':')[0].trim() // Handle type annotations
      if (paramName && !reserved.has(paramName) && !declarations.has(paramName) && paramName.length > 1) {
        declarations.set(paramName, randVar())
      }
    }
  }
  
  // Replace all occurrences
  let result = code
  for (const [original, renamed] of declarations) {
    // Word boundary replacement - be careful with patterns
    const regex = new RegExp(`\\b${original}\\b`, 'g')
    result = result.replace(regex, renamed)
  }
  
  return result
}

// Main obfuscation function
export async function obfuscateCode(code: string, settings: ObfuscationSettings): Promise<ObfuscationResult> {
  let result = code
  let steps = 0
  
  // Tokenize the code
  const tokens = tokenize(result)
  
  if (settings.preset === 'Low') {
    // Low: Just octal strings + junk + simple wrap
    result = buildWithOctalStrings(tokens)
    steps++
    
    result = generateJunk(3) + result
    steps++
    
    result = wrapInFunction(result, 1)
    steps++
    
  } else if (settings.preset === 'Medium') {
    // Medium: XOR string table + rename + junk + wrap
    result = buildWithStringTable(tokens, true)
    steps++
    
    result = renameLocals(result)
    steps++
    
    result = generateJunk(5) + result
    steps++
    
    result = generateEnvCheck() + result
    steps++
    
    result = wrapInFunction(result, 2)
    steps++
    
  } else if (settings.preset === 'High') {
    // High: Everything + opaque predicates + more layers
    result = buildWithStringTable(tokens, true)
    steps++
    
    result = renameLocals(result)
    steps++
    
    result = generateJunk(6) + result
    steps++
    
    result = generateOpaquePredicate() + result
    steps++
    
    result = generateEnvCheck() + result
    steps++
    
    result = wrapInFunction(result, 2)
    steps++
    
    result = generateJunk(4) + result
    steps++
    
    result = wrapInFunction(result, 1)
    steps++
    
  } else if (settings.preset === 'Maximum') {
    // Maximum: Maximum protection
    result = buildWithStringTable(tokens, true)
    steps++
    
    result = renameLocals(result)
    steps++
    
    result = generateJunk(8) + result
    steps++
    
    result = generateOpaquePredicate() + result
    steps++
    
    result = generateEnvCheck() + result
    steps++
    
    result = wrapInFunction(result, 2)
    steps++
    
    result = generateJunk(5) + result
    steps++
    
    result = generateOpaquePredicate() + result
    steps++
    
    result = wrapInFunction(result, 2)
    steps++
    
    result = generateJunk(4) + result
    steps++
  }
  
  // Final minification
  result = minify(result)
  
  return { code: result, stepsApplied: steps }
}

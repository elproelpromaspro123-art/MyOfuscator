export interface ObfuscationSettings {
  preset: 'Low' | 'Medium' | 'High' | 'Maximum'
}

export interface ObfuscationResult {
  code: string
  stepsApplied: number
}

const CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
const randVar = () => '_' + Array.from({ length: 10 }, () => CHARS[Math.floor(Math.random() * 52)]).join('')
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// Convert string to octal escape sequence like \120\056\053
function toOctal(str: string): string {
  let result = ''
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i)
    result += '\\' + code.toString(8).padStart(3, '0')
  }
  return '"' + result + '"'
}

// Convert string to decimal byte array
function toByteArray(str: string): number[] {
  const bytes: number[] = []
  for (let i = 0; i < str.length; i++) {
    bytes.push(str.charCodeAt(i))
  }
  return bytes
}

// XOR encrypt bytes with key
function xorEncrypt(bytes: number[], key: number): number[] {
  return bytes.map(b => b ^ key)
}

// Generate Base64 alphabet (shuffled for each obfuscation)
function generateBase64Alphabet(): string {
  const standard = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  return shuffle(standard.split('')).join('')
}

// Encode string to custom base64
function customBase64Encode(str: string, alphabet: string): string {
  const bytes = toByteArray(str)
  let result = ''
  
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i]
    const b2 = bytes[i + 1] || 0
    const b3 = bytes[i + 2] || 0
    
    const c1 = b1 >> 2
    const c2 = ((b1 & 3) << 4) | (b2 >> 4)
    const c3 = ((b2 & 15) << 2) | (b3 >> 6)
    const c4 = b3 & 63
    
    result += alphabet[c1] + alphabet[c2]
    result += (i + 1 < bytes.length) ? alphabet[c3] : '='
    result += (i + 2 < bytes.length) ? alphabet[c4] : '='
  }
  
  return result
}

// Extract all strings from Lua code
function extractStrings(code: string): { strings: string[], positions: { start: number, end: number, content: string }[] } {
  const strings: string[] = []
  const positions: { start: number, end: number, content: string }[] = []
  let i = 0
  
  while (i < code.length) {
    // Skip comments
    if (code[i] === '-' && code[i + 1] === '-') {
      if (code[i + 2] === '[' && code[i + 3] === '[') {
        let j = i + 4
        while (j < code.length - 1 && !(code[j] === ']' && code[j + 1] === ']')) j++
        i = j + 2
        continue
      }
      while (i < code.length && code[i] !== '\n') i++
      continue
    }
    
    // Long strings [[...]] - preserve as-is
    if (code[i] === '[' && code[i + 1] === '[') {
      let j = i + 2
      while (j < code.length - 1 && !(code[j] === ']' && code[j + 1] === ']')) j++
      i = j + 2
      continue
    }
    
    // Quoted strings
    if (code[i] === '"' || code[i] === "'") {
      const quote = code[i]
      const start = i
      let j = i + 1
      let content = ''
      let hasEscape = false
      
      while (j < code.length) {
        if (code[j] === '\\') {
          hasEscape = true
          content += code[j] + (code[j + 1] || '')
          j += 2
          continue
        }
        if (code[j] === quote) break
        content += code[j]
        j++
      }
      
      const fullString = code.slice(start, j + 1)
      const rawContent = content
      
      // Only add to extraction if it's safe to encrypt
      if (!hasEscape && 
          rawContent.length >= 2 && 
          rawContent.length <= 200 &&
          !/[\x00-\x1f\x7f-\xff]/.test(rawContent)) {
        strings.push(rawContent)
        positions.push({ start, end: j + 1, content: rawContent })
      }
      
      i = j + 1
      continue
    }
    
    i++
  }
  
  return { strings, positions }
}

// Generate the string table and decoder
function generateStringTable(strings: string[], level: number): { table: string, decoder: string, varName: string } {
  const tableVar = randVar()
  const decoderVar = randVar()
  const key = randInt(1, 250)
  
  if (level === 1) {
    // Simple: just octal encoding
    const encoded = strings.map(s => toOctal(s))
    return {
      table: `local ${tableVar}={${encoded.join(',')}}`,
      decoder: '',
      varName: tableVar
    }
  }
  
  if (level === 2) {
    // Medium: XOR + byte array
    const iVar = randVar()
    const jVar = randVar()
    const rVar = randVar()
    const cVar = randVar()
    const tVar = randVar()
    
    const encoded = strings.map(s => {
      const bytes = xorEncrypt(toByteArray(s), key)
      return `{${bytes.join(',')}}`
    })
    
    const decoder = `local function ${decoderVar}(${tVar})local ${rVar}=""for ${iVar}=1,#${tVar} do ${rVar}=${rVar}..string.char(bit32.bxor(${tVar}[${iVar}],${key}))end return ${rVar} end`
    
    return {
      table: `local ${tableVar}={${encoded.join(',')}}`,
      decoder,
      varName: tableVar,
    }
  }
  
  // High/Maximum: Custom Base64 + XOR
  const alphabet = generateBase64Alphabet()
  const alphaVar = randVar()
  const iVar = randVar()
  const jVar = randVar()
  const rVar = randVar()
  const bVar = randVar()
  const cVar = randVar()
  const pVar = randVar()
  const lVar = randVar()
  
  const encoded = strings.map(s => {
    const xored = String.fromCharCode(...xorEncrypt(toByteArray(s), key))
    return toOctal(customBase64Encode(xored, alphabet))
  })
  
  // Generate reverse lookup for alphabet
  const decoder = `local ${alphaVar}=${toOctal(alphabet)}
local function ${decoderVar}(${cVar})
local ${rVar}=""
local ${bVar}={}
for ${iVar}=1,64 do ${bVar}[string.sub(${alphaVar},${iVar},${iVar})]=${iVar}-1 end
local ${pVar}=1
local ${lVar}=#${cVar}
while ${pVar}<=${lVar} do
local c1,c2,c3,c4=${bVar}[string.sub(${cVar},${pVar},${pVar})],${bVar}[string.sub(${cVar},${pVar}+1,${pVar}+1)],${bVar}[string.sub(${cVar},${pVar}+2,${pVar}+2)],${bVar}[string.sub(${cVar},${pVar}+3,${pVar}+3)]
if c1 and c2 then
${rVar}=${rVar}..string.char(bit32.bxor(bit32.bor(bit32.lshift(c1,2),bit32.rshift(c2,4)),${key}))
if c3 and string.sub(${cVar},${pVar}+2,${pVar}+2)~="=" then ${rVar}=${rVar}..string.char(bit32.bxor(bit32.bor(bit32.lshift(bit32.band(c2,15),4),bit32.rshift(c3,2)),${key}))end
if c4 and string.sub(${cVar},${pVar}+3,${pVar}+3)~="=" then ${rVar}=${rVar}..string.char(bit32.bxor(bit32.bor(bit32.lshift(bit32.band(c3,3),6),c4),${key}))end
end
${pVar}=${pVar}+4
end
return ${rVar}
end`
  
  return {
    table: `local ${tableVar}={${encoded.join(',')}}`,
    decoder,
    varName: tableVar,
  }
}

// Replace strings in code with table lookups
function replaceStrings(
  code: string, 
  positions: { start: number, end: number, content: string }[], 
  strings: string[],
  tableVar: string,
  hasDecoder: boolean,
  decoderVar: string
): string {
  // Sort positions in reverse order to replace from end to start
  const sorted = [...positions].sort((a, b) => b.start - a.start)
  
  let result = code
  for (const pos of sorted) {
    const idx = strings.indexOf(pos.content) + 1
    if (idx > 0) {
      const replacement = hasDecoder 
        ? `${decoderVar}(${tableVar}[${idx}])`
        : `${tableVar}[${idx}]`
      result = result.slice(0, pos.start) + replacement + result.slice(pos.end)
    }
  }
  
  return result
}

// Remove comments from code
function removeComments(code: string): string {
  let result = ''
  let i = 0
  
  while (i < code.length) {
    if (code[i] === '-' && code[i + 1] === '-') {
      if (code[i + 2] === '[' && code[i + 3] === '[') {
        let j = i + 4
        while (j < code.length - 1 && !(code[j] === ']' && code[j + 1] === ']')) j++
        i = j + 2
        continue
      }
      while (i < code.length && code[i] !== '\n') i++
      continue
    }
    
    // Preserve strings
    if (code[i] === '"' || code[i] === "'") {
      const quote = code[i]
      result += code[i]
      i++
      while (i < code.length) {
        if (code[i] === '\\') {
          result += code[i] + (code[i + 1] || '')
          i += 2
          continue
        }
        result += code[i]
        if (code[i] === quote) {
          i++
          break
        }
        i++
      }
      continue
    }
    
    // Long strings
    if (code[i] === '[' && code[i + 1] === '[') {
      let j = i + 2
      while (j < code.length - 1 && !(code[j] === ']' && code[j + 1] === ']')) j++
      result += code.slice(i, j + 2)
      i = j + 2
      continue
    }
    
    result += code[i]
    i++
  }
  
  return result
}

// Generate junk code
function generateJunk(count: number): string {
  const junks: string[] = []
  
  for (let i = 0; i < count; i++) {
    const v1 = randVar()
    const v2 = randVar()
    const n1 = randInt(1000, 999999)
    const n2 = randInt(100, 9999)
    
    const patterns = [
      `local ${v1}=${n1}`,
      `local ${v1}=function()return ${n1} end`,
      `local ${v1}={${n1},${n2}}`,
      `local ${v1},${v2}=${n1},${n2}`,
      `do local ${v1}=${n1} end`,
      `local ${v1}=${n1}*${n2}-${n1}*${n2}`,
    ]
    junks.push(patterns[randInt(0, patterns.length - 1)])
  }
  
  return shuffle(junks).join(';') + ';'
}

// Generate opaque predicates (always true conditions)
function generateOpaqueCheck(): string {
  const v1 = randVar()
  const v2 = randVar()
  const n1 = randInt(100, 9999)
  const n2 = randInt(10, 99)
  const product = n1 * n2
  
  return `local ${v1},${v2}=${n1},${n2};if ${v1}*${v2}~=${product} then return end;`
}

// Environment check
function generateEnvCheck(): string {
  const t = randVar()
  const checks = shuffle([
    `${t}(bit32)=="table"`,
    `${t}(string)=="table"`,
    `${t}(math)=="table"`,
    `${t}(table)=="table"`,
  ]).slice(0, 2)
  
  return `local ${t}=type;if not(${checks.join(' and ')})then return end;`
}

// Wrap code in function layers
function wrapInFunction(code: string, layers: number = 1): string {
  let result = code
  
  for (let i = 0; i < layers; i++) {
    const fn = randVar()
    const arg = randVar()
    const key = randInt(1000, 99999)
    
    if (i === layers - 1) {
      // Outermost layer - the one that gets called
      result = `local ${fn}=function()${result} end;return ${fn}()`
    } else {
      // Inner layers with key check
      result = `local ${fn}=function(${arg})if ${arg}~=${key} then return end;${result} end;${fn}(${key})`
    }
  }
  
  return result
}

// Minify code
function minify(code: string): string {
  let result = ''
  let i = 0
  let inString = false
  let stringChar = ''
  let inLongString = false
  
  while (i < code.length) {
    const c = code[i]
    const next = code[i + 1] || ''
    
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
    
    if (inString) {
      result += c
      if (c === '\\') {
        result += next
        i += 2
        continue
      }
      if (c === stringChar) inString = false
      i++
      continue
    }
    
    if (c === '"' || c === "'") {
      inString = true
      stringChar = c
      result += c
      i++
      continue
    }
    
    if (c === '[' && next === '[') {
      inLongString = true
      result += c + next
      i += 2
      continue
    }
    
    if (/\s/.test(c)) {
      const prev = result[result.length - 1] || ''
      let j = i
      while (j < code.length && /\s/.test(code[j])) j++
      const nextChar = code[j] || ''
      
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
  const localPattern = /\blocal\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g
  const funcPattern = /\blocal\s+function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g
  const renames = new Map<string, string>()
  
  const reserved = new Set([
    'self', 'true', 'false', 'nil', 'and', 'or', 'not', 'if', 'then', 'else',
    'elseif', 'end', 'for', 'while', 'do', 'repeat', 'until', 'function',
    'return', 'break', 'local', 'in', 'goto',
    'game', 'workspace', 'script', 'Instance', 'Vector3', 'CFrame', 'Color3',
    'UDim2', 'UDim', 'Enum', 'pairs', 'ipairs', 'print', 'warn', 'error',
    'type', 'typeof', 'tostring', 'tonumber', 'pcall', 'xpcall', 'select',
    'require', 'loadstring', 'getfenv', 'setfenv', 'rawget', 'rawset',
    'table', 'string', 'math', 'bit32', 'coroutine', 'os', 'debug',
    'wait', 'spawn', 'delay', 'tick', 'time', 'typeof',
  ])
  
  let match
  while ((match = localPattern.exec(code)) !== null) {
    const name = match[1]
    if (!reserved.has(name) && !renames.has(name)) {
      renames.set(name, randVar())
    }
  }
  
  while ((match = funcPattern.exec(code)) !== null) {
    const name = match[1]
    if (!reserved.has(name) && !renames.has(name)) {
      renames.set(name, randVar())
    }
  }
  
  let result = code
  for (const [original, renamed] of renames) {
    const regex = new RegExp(`\\b${original}\\b`, 'g')
    result = result.replace(regex, renamed)
  }
  
  return result
}

// Main obfuscation function
export async function obfuscateCode(code: string, settings: ObfuscationSettings): Promise<ObfuscationResult> {
  let result = code
  let steps = 0
  
  // Remove comments first
  result = removeComments(result)
  steps++
  
  // Extract strings for encryption
  const { strings, positions } = extractStrings(result)
  
  if (settings.preset === 'Low') {
    // Low: Octal strings + junk + wrap
    if (strings.length > 0) {
      const { table, decoder, varName } = generateStringTable(strings, 1)
      result = replaceStrings(result, positions, strings, varName, false, '')
      result = table + ';' + result
      steps++
    }
    
    result = generateJunk(3) + result
    steps++
    
    result = wrapInFunction(result, 1)
    steps++
  } else if (settings.preset === 'Medium') {
    // Medium: XOR encrypted strings + rename + junk + wrap
    if (strings.length > 0) {
      const { table, decoder, varName } = generateStringTable(strings, 2)
      const decoderMatch = decoder.match(/local function ([a-zA-Z_]+)\(/)
      const actualDecoderVar = decoderMatch ? decoderMatch[1] : randVar()
      result = replaceStrings(result, positions, strings, varName, true, actualDecoderVar)
      result = decoder + ';' + table + ';' + result
      steps++
    }
    
    result = renameLocals(result)
    steps++
    
    result = generateJunk(5) + result
    steps++
    
    result = generateEnvCheck() + result
    steps++
    
    result = wrapInFunction(result, 2)
    steps++
  } else if (settings.preset === 'High') {
    // High: Base64 + XOR strings + opaque predicates + multi-wrap
    if (strings.length > 0) {
      const { table, decoder, varName } = generateStringTable(strings, 3)
      const decoderMatch = decoder.match(/local function ([a-zA-Z_]+)\(/)
      const actualDecoderVar = decoderMatch ? decoderMatch[1] : randVar()
      result = replaceStrings(result, positions, strings, varName, true, actualDecoderVar)
      result = decoder + ';' + table + ';' + result
      steps++
    }
    
    result = renameLocals(result)
    steps++
    
    result = generateJunk(6) + result
    steps++
    
    result = generateOpaqueCheck() + result
    steps++
    
    result = generateEnvCheck() + result
    steps++
    
    result = wrapInFunction(result, 3)
    steps++
    
    result = generateJunk(4) + result
    steps++
  } else if (settings.preset === 'Maximum') {
    // Maximum: Everything + extra layers
    if (strings.length > 0) {
      const { table, decoder, varName } = generateStringTable(strings, 3)
      const decoderMatch = decoder.match(/local function ([a-zA-Z_]+)\(/)
      const actualDecoderVar = decoderMatch ? decoderMatch[1] : randVar()
      result = replaceStrings(result, positions, strings, varName, true, actualDecoderVar)
      result = decoder + ';' + table + ';' + result
      steps++
    }
    
    result = renameLocals(result)
    steps++
    
    result = generateJunk(8) + result
    steps++
    
    result = generateOpaqueCheck() + result
    steps++
    
    result = generateEnvCheck() + result
    steps++
    
    result = wrapInFunction(result, 2)
    steps++
    
    result = generateJunk(5) + result
    steps++
    
    result = generateOpaqueCheck() + result
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

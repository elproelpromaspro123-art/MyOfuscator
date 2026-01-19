export interface ObfuscationSettings {
  preset: 'Low' | 'Medium' | 'High' | 'Maximum'
}

export interface ObfuscationResult {
  code: string
  stepsApplied: number
}

function randomVar(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz'
  let name = '_'
  for (let i = 0; i < 8 + Math.floor(Math.random() * 8); i++) {
    name += chars[Math.floor(Math.random() * 26)]
  }
  return name
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function isSafeToEncrypt(str: string): boolean {
  if (str.length < 4 || str.length > 200) return false
  if (str.includes('://') || str.includes('http')) return false
  if (str.includes('\\n') || str.includes('\\r') || str.includes('\\t')) return false
  if (str.includes('\n') || str.includes('\r') || str.includes('\t')) return false
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i)
    if (code > 127 || code < 32) return false
  }
  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(str)) return false
  if (/^[A-Z][a-z]+$/.test(str)) return false
  return true
}

function encryptString(str: string): string {
  const key = randomInt(50, 200)
  const bytes: number[] = []
  for (let i = 0; i < str.length; i++) {
    bytes.push(str.charCodeAt(i) ^ key)
  }
  const v = randomVar()
  return `(function()local ${v}=""for _,c in ipairs({${bytes.join(',')}})do ${v}=${v}..string.char(bit32.bxor(c,${key}))end return ${v} end)()`
}

function processStrings(code: string, encrypt: boolean): string {
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
      let j = i + 2
      while (j < code.length && code[j] !== '\n') j++
      i = j
      continue
    }

    if (code[i] === '[' && code[i + 1] === '[') {
      let j = i + 2
      while (j < code.length - 1 && !(code[j] === ']' && code[j + 1] === ']')) j++
      result += code.slice(i, j + 2)
      i = j + 2
      continue
    }

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

      if (encrypt && isSafeToEncrypt(content)) {
        result += encryptString(content)
      } else {
        result += code.slice(i, j + 1)
      }
      i = j + 1
      continue
    }

    result += code[i]
    i++
  }

  return result
}

function addJunkVariables(code: string, count: number): string {
  const vars: string[] = []
  for (let i = 0; i < count; i++) {
    const v = randomVar()
    const val = randomInt(1, 9999)
    vars.push(`local ${v}=${val}`)
  }
  return vars.join(';') + ';' + code
}

function addAntiTamper(code: string): string {
  const v = randomVar()
  return `local ${v}=type;if ${v}(pcall)~="function"or ${v}(error)~="function"then return end;${code}`
}

function wrapCode(code: string, layers: number): string {
  let result = code
  for (let i = 0; i < layers; i++) {
    const f = randomVar()
    result = `local ${f}=(function()${result} end)();return ${f}`
  }
  return result
}

function addControlFlow(code: string): string {
  const s = randomVar()
  const r = randomVar()
  const v1 = randomInt(100, 999)
  const v2 = randomInt(1000, 9999)
  return `local ${s}=${v1};local ${r}=true;while ${r} do if ${s}==${v1} then ${code};${s}=${v2} elseif ${s}==${v2} then ${r}=false end end`
}

function minify(code: string): string {
  let result = ''
  let i = 0
  let inStr = false
  let strChar = ''
  let inLong = false

  while (i < code.length) {
    const c = code[i]
    const n = code[i + 1] || ''

    if (inLong) {
      result += c
      if (c === ']' && n === ']') {
        result += n
        i += 2
        inLong = false
        continue
      }
      i++
      continue
    }

    if (inStr) {
      result += c
      if (c === '\\') {
        result += n
        i += 2
        continue
      }
      if (c === strChar) inStr = false
      i++
      continue
    }

    if (c === '"' || c === "'") {
      inStr = true
      strChar = c
      result += c
      i++
      continue
    }

    if (c === '[' && n === '[') {
      inLong = true
      result += c + n
      i += 2
      continue
    }

    if (c === '-' && n === '-') {
      let j = i + 2
      if (code[j] === '[' && code[j + 1] === '[') {
        j += 2
        while (j < code.length - 1 && !(code[j] === ']' && code[j + 1] === ']')) j++
        i = j + 2
        continue
      }
      while (j < code.length && code[j] !== '\n') j++
      i = j
      continue
    }

    if (/\s/.test(c)) {
      const prev = result[result.length - 1] || ''
      let j = i
      while (j < code.length && /\s/.test(code[j])) j++
      const next = code[j] || ''
      if (/[a-zA-Z0-9_]/.test(prev) && /[a-zA-Z0-9_]/.test(next)) {
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

export async function obfuscateCode(
  code: string,
  settings: ObfuscationSettings
): Promise<ObfuscationResult> {
  let result = code
  let steps = 0

  if (settings.preset === 'Low') {
    result = processStrings(result, false)
    result = wrapCode(result, 1)
    steps = 1
  } else if (settings.preset === 'Medium') {
    result = processStrings(result, true)
    steps++
    result = addJunkVariables(result, 3)
    steps++
    result = addAntiTamper(result)
    steps++
    result = wrapCode(result, 1)
    steps++
  } else if (settings.preset === 'High') {
    result = processStrings(result, true)
    steps++
    result = addJunkVariables(result, 5)
    steps++
    result = addAntiTamper(result)
    steps++
    result = addControlFlow(result)
    steps++
    result = wrapCode(result, 2)
    steps++
  } else if (settings.preset === 'Maximum') {
    result = processStrings(result, true)
    steps++
    result = addJunkVariables(result, 8)
    steps++
    result = addAntiTamper(result)
    steps++
    result = addControlFlow(result)
    steps++
    result = wrapCode(result, 3)
    steps++
    result = addJunkVariables(result, 4)
    steps++
  }

  result = minify(result)

  return { code: result, stepsApplied: steps }
}

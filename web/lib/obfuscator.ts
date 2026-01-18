export interface ObfuscationSettings {
  preset: 'Low' | 'Medium' | 'High' | 'Maximum'
}

export interface ObfuscationResult {
  code: string
  stepsApplied: number
}

function xorEncrypt(str: string, key: number): number[] {
  const bytes: number[] = []
  for (let i = 0; i < str.length; i++) {
    bytes.push(str.charCodeAt(i) ^ key)
  }
  return bytes
}

function randomVar(): string {
  const chars = 'lI1'
  let name = 'l'
  const len = 6 + Math.floor(Math.random() * 6)
  for (let i = 0; i < len; i++) {
    name += chars[Math.floor(Math.random() * chars.length)]
  }
  return name
}

function encryptStrings(code: string): string {
  const stringRegex = /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/g
  return code.replace(stringRegex, (match) => {
    const content = match.slice(1, -1)
    if (content.length < 2) return match
    const key = Math.floor(Math.random() * 200) + 50
    const bytes = xorEncrypt(content, key)
    return `(function()local k=${key} local t={${bytes.join(',')}} local s="" for i=1,#t do s=s..string.char(t[i]~k)end return s end)()`
  })
}

function wrapInFunction(code: string): string {
  const v = randomVar()
  return `local ${v}=function()${code} end return ${v}()`
}

function addAntiTamper(code: string): string {
  const v1 = randomVar()
  const v2 = randomVar()
  return `local ${v1}=type local ${v2}=${v1}(pcall)=="function"and ${v1}(error)=="function"and ${v1}(tostring)=="function" if not ${v2} then return end ${code}`
}

function obfuscateNumbers(code: string): string {
  return code.replace(/\b(\d+)\b/g, (match) => {
    const num = parseInt(match, 10)
    if (num >= 0 && num < 10000 && Math.random() > 0.4) {
      const a = Math.floor(Math.random() * 50) + 1
      return `(${num + a}-${a})`
    }
    return match
  })
}

function addJunkCode(code: string): string {
  const junks: string[] = []
  for (let i = 0; i < 3; i++) {
    const v = randomVar()
    const patterns = [
      `local ${v}=${Math.floor(Math.random() * 999)}`,
      `local ${v}=function()end`,
      `if false then local ${v}=nil end`,
    ]
    junks.push(patterns[Math.floor(Math.random() * patterns.length)])
  }
  return junks.join(' ') + ' ' + code
}

function addOpaquePredicates(code: string): string {
  const predicates = [
    '(1+1==2)',
    '(type("")=="string")',
    '(not false)',
    '(true and true)',
  ]
  const pred = predicates[Math.floor(Math.random() * predicates.length)]
  return `if ${pred} then ${code} end`
}

function minifyLua(code: string): string {
  let result = ''
  let i = 0
  let inString = false
  let stringChar = ''
  let inLongString = false
  let longStringLevel = 0

  while (i < code.length) {
    const char = code[i]
    const next = code[i + 1] || ''

    if (inLongString) {
      result += char
      if (char === ']') {
        let level = 0
        let j = i + 1
        while (code[j] === '=') { level++; j++ }
        if (code[j] === ']' && level === longStringLevel) {
          result += code.slice(i + 1, j + 1)
          i = j
          inLongString = false
        }
      }
      i++
      continue
    }

    if (inString) {
      result += char
      if (char === '\\') {
        result += next
        i += 2
        continue
      }
      if (char === stringChar) {
        inString = false
      }
      i++
      continue
    }

    if (char === '"' || char === "'") {
      inString = true
      stringChar = char
      result += char
      i++
      continue
    }

    if (char === '[' && (next === '[' || next === '=')) {
      let level = 0
      let j = i + 1
      while (code[j] === '=') { level++; j++ }
      if (code[j] === '[') {
        inLongString = true
        longStringLevel = level
        result += code.slice(i, j + 1)
        i = j + 1
        continue
      }
    }

    if (char === '-' && next === '-') {
      let j = i + 2
      if (code[j] === '[') {
        let level = 0
        let k = j + 1
        while (code[k] === '=') { level++; k++ }
        if (code[k] === '[') {
          k++
          while (k < code.length) {
            if (code[k] === ']') {
              let endLevel = 0
              let m = k + 1
              while (code[m] === '=') { endLevel++; m++ }
              if (code[m] === ']' && endLevel === level) {
                i = m + 1
                break
              }
            }
            k++
          }
          continue
        }
      }
      while (j < code.length && code[j] !== '\n') j++
      i = j
      continue
    }

    if (/\s/.test(char)) {
      const prevChar = result[result.length - 1] || ''
      let j = i
      while (j < code.length && /\s/.test(code[j])) j++
      const nextChar = code[j] || ''
      const needsSpace = /[a-zA-Z0-9_]/.test(prevChar) && /[a-zA-Z0-9_]/.test(nextChar)
      if (needsSpace) result += ' '
      i = j
      continue
    }

    result += char
    i++
  }

  return result.trim()
}

export async function obfuscateCode(
  code: string,
  settings: ObfuscationSettings
): Promise<ObfuscationResult> {
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300))

  let result = code
  let stepsApplied = 0

  if (settings.preset === 'Low') {
    result = encryptStrings(result)
    stepsApplied++
    result = wrapInFunction(result)
    stepsApplied++
  } else if (settings.preset === 'Medium') {
    result = encryptStrings(result)
    stepsApplied++
    result = obfuscateNumbers(result)
    stepsApplied++
    result = addAntiTamper(result)
    stepsApplied++
    result = wrapInFunction(result)
    stepsApplied++
  } else if (settings.preset === 'High') {
    result = encryptStrings(result)
    stepsApplied++
    result = obfuscateNumbers(result)
    stepsApplied++
    result = addJunkCode(result)
    stepsApplied++
    result = addAntiTamper(result)
    stepsApplied++
    result = addOpaquePredicates(result)
    stepsApplied++
    result = wrapInFunction(result)
    stepsApplied++
  } else if (settings.preset === 'Maximum') {
    result = encryptStrings(result)
    stepsApplied++
    result = obfuscateNumbers(result)
    stepsApplied++
    result = addJunkCode(result)
    stepsApplied++
    result = addAntiTamper(result)
    stepsApplied++
    result = addOpaquePredicates(result)
    stepsApplied++
    result = wrapInFunction(result)
    stepsApplied++
    const v = randomVar()
    result = `local ${v}=function()${result} end return ${v}()`
    stepsApplied++
  }

  result = minifyLua(result)

  return {
    code: result,
    stepsApplied,
  }
}

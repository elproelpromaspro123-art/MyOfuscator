export interface ObfuscationSettings {
  preset: 'Low' | 'Medium' | 'High' | 'Maximum'
}

export interface ObfuscationResult {
  code: string
  stepsApplied: number
}

function randomVar(): string {
  const chars = 'lI1'
  let name = '_'
  const len = 8 + Math.floor(Math.random() * 8)
  for (let i = 0; i < len; i++) {
    name += chars[Math.floor(Math.random() * chars.length)]
  }
  return name
}

function extractStrings(code: string): { code: string; strings: string[]; placeholders: string[] } {
  const strings: string[] = []
  const placeholders: string[] = []
  let result = ''
  let i = 0

  while (i < code.length) {
    const char = code[i]

    if (char === '[' && code[i + 1] === '[') {
      let j = i + 2
      while (j < code.length - 1) {
        if (code[j] === ']' && code[j + 1] === ']') {
          result += code.slice(i, j + 2)
          i = j + 2
          break
        }
        j++
      }
      if (j >= code.length - 1) {
        result += code.slice(i)
        break
      }
      continue
    }

    if (char === '-' && code[i + 1] === '-') {
      let j = i + 2
      if (code[j] === '[' && code[j + 1] === '[') {
        j += 2
        while (j < code.length - 1) {
          if (code[j] === ']' && code[j + 1] === ']') {
            i = j + 2
            break
          }
          j++
        }
        continue
      }
      while (j < code.length && code[j] !== '\n') j++
      i = j
      continue
    }

    if (char === '"' || char === "'") {
      const quote = char
      let j = i + 1
      let str = ''
      while (j < code.length) {
        if (code[j] === '\\' && j + 1 < code.length) {
          str += code[j] + code[j + 1]
          j += 2
          continue
        }
        if (code[j] === quote) {
          break
        }
        str += code[j]
        j++
      }

      const fullStr = code.slice(i, j + 1)
      
      if (str.length < 3 || str.includes('://') || str.includes('\\n') || /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(str)) {
        result += fullStr
      } else {
        const placeholder = `__STR${strings.length}__`
        strings.push(str)
        placeholders.push(placeholder)
        result += placeholder
      }
      i = j + 1
      continue
    }

    result += char
    i++
  }

  return { code: result, strings, placeholders }
}

function encryptString(str: string): string {
  const key = Math.floor(Math.random() * 200) + 50
  const bytes: number[] = []
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i)
    bytes.push(c ^ key)
  }
  const v = randomVar()
  return `(function()local ${v}={${bytes.join(',')}}local s=""for i=1,#${v} do s=s..string.char(${v}[i]~${key})end return s end)()`
}

function restoreStrings(code: string, strings: string[], placeholders: string[], encrypt: boolean): string {
  let result = code
  for (let i = 0; i < strings.length; i++) {
    if (encrypt) {
      result = result.replace(placeholders[i], encryptString(strings[i]))
    } else {
      result = result.replace(placeholders[i], `"${strings[i]}"`)
    }
  }
  return result
}

function wrapInFunction(code: string): string {
  const v = randomVar()
  return `local ${v}=(function()${code} end)()return ${v}`
}

function addAntiTamper(code: string): string {
  const v1 = randomVar()
  return `local ${v1}=type if ${v1}(pcall)~="function"or ${v1}(error)~="function"then return end ${code}`
}

function obfuscateNumbers(code: string, strings: string[], placeholders: string[]): string {
  let tempCode = code
  for (let i = 0; i < placeholders.length; i++) {
    tempCode = tempCode.replace(placeholders[i], `"__PLACEHOLDER_${i}__"`)
  }

  tempCode = tempCode.replace(/\b(\d+)\b/g, (match, num, offset) => {
    const before = tempCode.slice(Math.max(0, offset - 20), offset)
    if (before.includes('PlaceId') || before.includes('==') || before.includes('~=')) {
      return match
    }
    const n = parseInt(num, 10)
    if (n >= 2 && n <= 500 && Math.random() > 0.5) {
      const a = Math.floor(Math.random() * 20) + 1
      return `(${n + a}-${a})`
    }
    return match
  })

  for (let i = 0; i < placeholders.length; i++) {
    tempCode = tempCode.replace(`"__PLACEHOLDER_${i}__"`, placeholders[i])
  }

  return tempCode
}

function addJunkCode(code: string): string {
  const junks: string[] = []
  for (let i = 0; i < 2; i++) {
    const v = randomVar()
    junks.push(`local ${v}=${Math.floor(Math.random() * 999)}`)
  }
  return junks.join(';') + ';' + code
}

function addOpaqueCheck(code: string): string {
  const checks = ['(1==1)', '(true)', '(not false)']
  const check = checks[Math.floor(Math.random() * checks.length)]
  return `if ${check} then ${code} end`
}

function minifyLua(code: string): string {
  let result = ''
  let i = 0
  let inString = false
  let stringChar = ''
  let inLongString = false

  while (i < code.length) {
    const char = code[i]
    const next = code[i + 1] || ''

    if (inLongString) {
      result += char
      if (char === ']' && next === ']') {
        result += next
        i += 2
        inLongString = false
        continue
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

    if (char === '[' && next === '[') {
      inLongString = true
      result += char + next
      i += 2
      continue
    }

    if (char === '-' && next === '-') {
      let j = i + 2
      if (code[j] === '[' && code[j + 1] === '[') {
        j += 2
        while (j < code.length - 1) {
          if (code[j] === ']' && code[j + 1] === ']') {
            i = j + 2
            break
          }
          j++
        }
        continue
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
      if (/[a-zA-Z0-9_]/.test(prevChar) && /[a-zA-Z0-9_]/.test(nextChar)) {
        result += ' '
      }
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
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))

  const { code: processedCode, strings, placeholders } = extractStrings(code)
  
  let result = processedCode
  let stepsApplied = 0
  const shouldEncrypt = settings.preset !== 'Low'

  if (settings.preset === 'Low') {
    result = restoreStrings(result, strings, placeholders, false)
    result = wrapInFunction(result)
    stepsApplied = 1
  } else if (settings.preset === 'Medium') {
    result = obfuscateNumbers(result, strings, placeholders)
    stepsApplied++
    result = restoreStrings(result, strings, placeholders, true)
    stepsApplied++
    result = addAntiTamper(result)
    stepsApplied++
    result = wrapInFunction(result)
    stepsApplied++
  } else if (settings.preset === 'High') {
    result = obfuscateNumbers(result, strings, placeholders)
    stepsApplied++
    result = restoreStrings(result, strings, placeholders, true)
    stepsApplied++
    result = addJunkCode(result)
    stepsApplied++
    result = addAntiTamper(result)
    stepsApplied++
    result = addOpaqueCheck(result)
    stepsApplied++
    result = wrapInFunction(result)
    stepsApplied++
  } else if (settings.preset === 'Maximum') {
    result = obfuscateNumbers(result, strings, placeholders)
    stepsApplied++
    result = restoreStrings(result, strings, placeholders, true)
    stepsApplied++
    result = addJunkCode(result)
    stepsApplied++
    result = addAntiTamper(result)
    stepsApplied++
    result = addOpaqueCheck(result)
    stepsApplied++
    result = wrapInFunction(result)
    stepsApplied++
    const v = randomVar()
    result = `local ${v}=(function()${result} end)()return ${v}`
    stepsApplied++
  }

  result = minifyLua(result)

  return {
    code: result,
    stepsApplied,
  }
}

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
  const len = 6 + Math.floor(Math.random() * 6)
  for (let i = 0; i < len; i++) {
    name += chars[Math.floor(Math.random() * chars.length)]
  }
  return name
}

function escapeLuaString(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
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

      if (str.length < 4 || str.includes('://') || str.includes('\\n') || str.includes('\\r')) {
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
  
  const unescaped = str
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, '\\')
  
  for (let i = 0; i < unescaped.length; i++) {
    bytes.push(unescaped.charCodeAt(i) ^ key)
  }

  const arr = randomVar()
  const out = randomVar()

  return `(function() local ${arr}={${bytes.join(',')}} local ${out}={} for i=1,#${arr} do ${out}[i]=string.char(bit32.bxor(${arr}[i],${key})) end return table.concat(${out}) end)()`
}

function restoreStrings(code: string, strings: string[], placeholders: string[], encrypt: boolean): string {
  let result = code
  for (let i = 0; i < strings.length; i++) {
    if (encrypt) {
      result = result.replace(placeholders[i], encryptString(strings[i]))
    } else {
      result = result.replace(placeholders[i], `"${escapeLuaString(strings[i])}"`)
    }
  }
  return result
}

function wrapInFunction(code: string): string {
  const v = randomVar()
  return `local ${v}=(function() ${code} end)() return ${v}`
}

function addAntiTamper(code: string): string {
  const v1 = randomVar()
  return `local ${v1}=type; if ${v1}(pcall)~="function" or ${v1}(error)~="function" then return end; ${code}`
}

function obfuscateNumbers(code: string, placeholders: string[]): string {
  let tempCode = code
  
  for (let i = 0; i < placeholders.length; i++) {
    tempCode = tempCode.replace(placeholders[i], `"__PH${i}__"`)
  }

  tempCode = tempCode.replace(/(\b)(\d+)(\b)/g, (match, before, num, after, offset) => {
    const context = tempCode.slice(Math.max(0, offset - 30), offset)
    if (context.includes('PlaceId') || context.includes('==') || context.includes('~=') || context.includes('bit32')) {
      return match
    }
    const n = parseInt(num, 10)
    if (n >= 2 && n <= 200 && Math.random() > 0.6) {
      const a = Math.floor(Math.random() * 10) + 1
      return `${before}(${n + a}-${a})${after}`
    }
    return match
  })

  for (let i = 0; i < placeholders.length; i++) {
    tempCode = tempCode.replace(`"__PH${i}__"`, placeholders[i])
  }

  return tempCode
}

function addJunkCode(code: string): string {
  const junks: string[] = []
  for (let i = 0; i < 2; i++) {
    const v = randomVar()
    junks.push(`local ${v}=${Math.floor(Math.random() * 999)};`)
  }
  return junks.join(' ') + ' ' + code
}

function addOpaqueCheck(code: string): string {
  return `if true then ${code} end`
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
  await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100))

  const { code: processedCode, strings, placeholders } = extractStrings(code)

  let result = processedCode
  let stepsApplied = 0

  if (settings.preset === 'Low') {
    result = restoreStrings(result, strings, placeholders, false)
    result = wrapInFunction(result)
    stepsApplied = 1
  } else if (settings.preset === 'Medium') {
    result = restoreStrings(result, strings, placeholders, true)
    stepsApplied++
    result = addAntiTamper(result)
    stepsApplied++
    result = wrapInFunction(result)
    stepsApplied++
  } else if (settings.preset === 'High') {
    result = obfuscateNumbers(result, placeholders)
    stepsApplied++
    result = restoreStrings(result, strings, placeholders, true)
    stepsApplied++
    result = addJunkCode(result)
    stepsApplied++
    result = addAntiTamper(result)
    stepsApplied++
    result = wrapInFunction(result)
    stepsApplied++
  } else if (settings.preset === 'Maximum') {
    result = obfuscateNumbers(result, placeholders)
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
  }

  result = minifyLua(result)

  return {
    code: result,
    stepsApplied,
  }
}

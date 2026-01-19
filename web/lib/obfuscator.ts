export interface ObfuscationSettings {
  preset: 'Low' | 'Medium' | 'High' | 'Maximum'
}

export interface ObfuscationResult {
  code: string
  stepsApplied: number
}

function randomVar(): string {
  const patterns = ['Il1', 'lI1', 'I1l', '1lI', 'l1I', '1Il']
  const base = patterns[Math.floor(Math.random() * patterns.length)]
  let name = 'l'
  const len = 10 + Math.floor(Math.random() * 10)
  for (let i = 0; i < len; i++) {
    name += base[Math.floor(Math.random() * 3)]
  }
  return name
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function escapeLuaString(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\t/g, '\\t')
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
        if (code[j] === quote) break
        str += code[j]
        j++
      }

      const fullStr = code.slice(i, j + 1)
      if (str.length < 3 || str.includes('://')) {
        result += fullStr
      } else {
        const placeholder = `__S${strings.length}__`
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

function multiLayerEncrypt(str: string): string {
  const unescaped = str
    .replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t')
    .replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\\\/g, '\\')

  const key1 = randomInt(50, 200)
  const key2 = randomInt(10, 50)
  const key3 = randomInt(1, 10)
  
  const bytes: number[] = []
  for (let i = 0; i < unescaped.length; i++) {
    let b = unescaped.charCodeAt(i)
    b = b ^ key1
    b = (b + key2) % 256
    b = b ^ key3
    bytes.push(b)
  }

  const indices = Array.from({ length: bytes.length }, (_, i) => i)
  const shuffled = shuffleArray(indices)
  const shuffledBytes = shuffled.map(i => bytes[i])
  const orderMap = shuffled.map((v, i) => ({ o: v, n: i })).sort((a, b) => a.o - b.o).map(x => x.n + 1)

  const d = randomVar()
  const o = randomVar()
  const r = randomVar()
  const k1 = randomVar()
  const k2 = randomVar()
  const k3 = randomVar()
  const b = randomVar()
  const t = randomVar()
  const x = randomVar()

  return `(function() local ${k1},${k2},${k3}=${key1},${key2},${key3}; local ${d}={${shuffledBytes.join(',')}}; local ${o}={${orderMap.join(',')}}; local ${r}={} for ${b}=1,#${d} do ${r}[${o}[${b}]]=${d}[${b}] end local ${t}={} for ${b}=1,#${r} do local ${x}=${r}[${b}] ${x}=bit32.bxor(${x},${k3}) ${x}=(${x}-${k2})%256 ${x}=bit32.bxor(${x},${k1}) ${t}[${b}]=string.char(${x}) end return table.concat(${t}) end)()`
}

function splitAndEncrypt(str: string): string {
  const unescaped = str
    .replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t')
    .replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\\\/g, '\\')

  if (unescaped.length < 6) {
    return multiLayerEncrypt(str)
  }

  const parts: string[] = []
  let remaining = unescaped
  while (remaining.length > 0) {
    const len = Math.min(randomInt(3, 8), remaining.length)
    parts.push(remaining.slice(0, len))
    remaining = remaining.slice(len)
  }

  const encrypted = parts.map(p => {
    const key = randomInt(30, 200)
    const bytes = []
    for (let i = 0; i < p.length; i++) {
      bytes.push(p.charCodeAt(i) ^ key)
    }
    return { bytes, key }
  })

  const vars = encrypted.map(() => randomVar())
  const f = randomVar()
  const a = randomVar()
  const s = randomVar()
  const k = randomVar()
  const r = randomVar()

  let code = `(function() local function ${f}(${a},${k}) local ${s}={} for ${r}=1,#${a} do ${s}[${r}]=string.char(bit32.bxor(${a}[${r}],${k})) end return table.concat(${s}) end `
  
  encrypted.forEach((e, i) => {
    code += `local ${vars[i]}=${f}({${e.bytes.join(',')}},${e.key}) `
  })
  
  code += `return ${vars.join('..')} end)()`
  return code
}

function restoreStrings(code: string, strings: string[], placeholders: string[], level: number): string {
  let result = code
  for (let i = 0; i < strings.length; i++) {
    let replacement: string
    if (level === 0) {
      replacement = `"${escapeLuaString(strings[i])}"`
    } else if (level === 1) {
      replacement = multiLayerEncrypt(strings[i])
    } else {
      replacement = splitAndEncrypt(strings[i])
    }
    result = result.replace(placeholders[i], replacement)
  }
  return result
}

function obfuscateNumbers(code: string, placeholders: string[], level: number): string {
  let temp = code
  placeholders.forEach((p, i) => { temp = temp.replace(p, `"__PH${i}__"`) })

  temp = temp.replace(/(\b)(\d+)(\b)/g, (match, b, num, a, offset) => {
    const ctx = temp.slice(Math.max(0, offset - 40), offset)
    if (ctx.includes('bit32') || ctx.includes('==') || ctx.includes('~=') || ctx.includes('PlaceId')) {
      return match
    }
    const n = parseInt(num, 10)
    if (n < 1 || n > 1000) return match
    if (Math.random() > 0.7) return match

    if (level === 1) {
      const x = randomInt(1, 50)
      return `${b}(${n + x}-${x})${a}`
    } else {
      const ops = [
        () => { const x = randomInt(1, 30); return `bit32.rshift(${(n << 1)},1)` },
        () => { const x = randomInt(1, 20); const y = randomInt(1, 20); return `(${n + x + y}-${x}-${y})` },
        () => { const x = randomInt(2, 5); return `math.floor(${n * x}/${x})` },
        () => { const x = randomInt(1, 10); return `(bit32.bxor(${n ^ x},${x}))` },
      ]
      return `${b}${ops[Math.floor(Math.random() * ops.length)]()}${a}`
    }
  })

  placeholders.forEach((p, i) => { temp = temp.replace(`"__PH${i}__"`, p) })
  return temp
}

function generateJunkCode(count: number): string {
  const junks: string[] = []
  for (let i = 0; i < count; i++) {
    const v1 = randomVar()
    const v2 = randomVar()
    const patterns = [
      () => `local ${v1}=${randomInt(100, 9999)};`,
      () => `local ${v1}=function()return ${randomInt(1, 100)} end;`,
      () => `local ${v1}={${randomInt(1, 50)},${randomInt(1, 50)},${randomInt(1, 50)}};`,
      () => `local ${v1}="${randomVar()}";`,
      () => `if false then local ${v1}=${randomInt(1, 100)} end;`,
      () => `do local ${v1}=${randomInt(1, 999)} end;`,
      () => `local ${v1},${v2}=${randomInt(1, 99)},${randomInt(1, 99)};`,
    ]
    junks.push(patterns[Math.floor(Math.random() * patterns.length)]())
  }
  return shuffleArray(junks).join(' ')
}

function addAntiTamper(code: string, level: number): string {
  const t = randomVar()
  const c = randomVar()
  
  if (level === 1) {
    return `local ${t}=type; if ${t}(pcall)~="function" or ${t}(error)~="function" then return end; ${code}`
  }
  
  const checks = [
    `${t}(pcall)=="function"`,
    `${t}(error)=="function"`,
    `${t}(tostring)=="function"`,
    `${t}(tonumber)=="function"`,
    `${t}(pairs)=="function"`,
    `${t}(table)=="table"`,
    `${t}(string)=="table"`,
    `${t}(math)=="table"`,
    `${t}(bit32)=="table"`,
  ]
  
  const selected = shuffleArray(checks).slice(0, 5)
  return `local ${t}=type; local ${c}=${selected.join(' and ')}; if not ${c} then return end; ${code}`
}

function addOpaquePredicates(code: string, level: number): string {
  const v = randomVar()
  
  if (level === 1) {
    const predicates = [
      `(1+1==2)`,
      `(type("")=="string")`,
      `(#""==0)`,
      `(true or false)`,
    ]
    const p = predicates[Math.floor(Math.random() * predicates.length)]
    return `if ${p} then ${code} end`
  }
  
  const n1 = randomInt(10, 99)
  const n2 = randomInt(10, 99)
  const sum = n1 + n2
  
  const complexPredicates = [
    `(function() local ${v}=${n1}+${n2} return ${v}==${sum} end)()`,
    `(bit32.band(${randomInt(100, 200)},${randomInt(100, 200)})>=0)`,
    `(#tostring(${randomInt(100, 999)})==3)`,
    `(math.floor(${randomInt(10, 50)}.${randomInt(1, 9)})==${randomInt(10, 50)})`,
  ]
  
  const p = complexPredicates[Math.floor(Math.random() * complexPredicates.length)]
  return `if ${p} then ${code} end`
}

function wrapInFunction(code: string, layers: number): string {
  let result = code
  for (let i = 0; i < layers; i++) {
    const v = randomVar()
    const f = randomVar()
    result = `local ${f}=function() ${result} end; local ${v}=${f}(); return ${v}`
  }
  return result
}

function addControlFlowObfuscation(code: string): string {
  const state = randomVar()
  const running = randomVar()
  const init = randomInt(100, 999)
  const exit = randomInt(1000, 9999)
  
  return `local ${state}=${init}; local ${running}=true; while ${running} do if ${state}==${init} then ${code}; ${state}=${exit} elseif ${state}==${exit} then ${running}=false end end`
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
      if (char === '\\') { result += next; i += 2; continue }
      if (char === stringChar) inString = false
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
        while (j < code.length - 1 && !(code[j] === ']' && code[j + 1] === ']')) j++
        i = j + 2
        continue
      }
      while (j < code.length && code[j] !== '\n') j++
      i = j
      continue
    }

    if (/\s/.test(char)) {
      const prev = result[result.length - 1] || ''
      let j = i
      while (j < code.length && /\s/.test(code[j])) j++
      const nextC = code[j] || ''
      if (/[a-zA-Z0-9_]/.test(prev) && /[a-zA-Z0-9_]/.test(nextC)) result += ' '
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
  await new Promise(r => setTimeout(r, 50))

  const { code: processed, strings, placeholders } = extractStrings(code)
  let result = processed
  let steps = 0

  if (settings.preset === 'Low') {
    result = restoreStrings(result, strings, placeholders, 0)
    result = wrapInFunction(result, 1)
    steps = 2
  } else if (settings.preset === 'Medium') {
    result = obfuscateNumbers(result, placeholders, 1)
    steps++
    result = restoreStrings(result, strings, placeholders, 1)
    steps++
    result = generateJunkCode(3) + result
    steps++
    result = addAntiTamper(result, 1)
    steps++
    result = addOpaquePredicates(result, 1)
    steps++
    result = wrapInFunction(result, 1)
    steps++
  } else if (settings.preset === 'High') {
    result = obfuscateNumbers(result, placeholders, 2)
    steps++
    result = restoreStrings(result, strings, placeholders, 2)
    steps++
    result = generateJunkCode(5) + result
    steps++
    result = addAntiTamper(result, 2)
    steps++
    result = addOpaquePredicates(result, 2)
    steps++
    result = addControlFlowObfuscation(result)
    steps++
    result = wrapInFunction(result, 2)
    steps++
  } else if (settings.preset === 'Maximum') {
    result = obfuscateNumbers(result, placeholders, 2)
    steps++
    result = restoreStrings(result, strings, placeholders, 2)
    steps++
    result = generateJunkCode(8) + result
    steps++
    result = addAntiTamper(result, 2)
    steps++
    result = addOpaquePredicates(result, 2)
    steps++
    result = addControlFlowObfuscation(result)
    steps++
    result = wrapInFunction(result, 3)
    steps++
    result = generateJunkCode(4) + result
    steps++
  }

  result = minifyLua(result)

  return { code: result, stepsApplied: steps }
}

export interface ObfuscationSettings {
  preset: string
  luaVersion: string
  nameGenerator: string
  steps: {
    encryptStrings: boolean
    vmify: boolean
    antiTamper: boolean
    controlFlowFlatten: boolean
    opaquePredicates: boolean
    junkCode: boolean
    constantArray: boolean
    numbersToExpressions: boolean
    wrapInFunction: boolean
  }
}

export interface ObfuscationResult {
  code: string
  stepsApplied: number
}

function simpleEncrypt(str: string): string {
  const key = Math.floor(Math.random() * 255)
  const bytes = []
  for (let i = 0; i < str.length; i++) {
    bytes.push(str.charCodeAt(i) ^ key)
  }
  return `(function()local k=${key};local t={${bytes.join(',')}};local s="";for i=1,#t do s=s..string.char(t[i]~k)end;return s end)()`
}

function randomVarName(generator: string): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_'
  const confuseChars = 'lI1iOo0'
  let name = ''
  const length = Math.floor(Math.random() * 8) + 4
  
  if (generator === 'Il' || generator === 'Homoglyph') {
    for (let i = 0; i < length; i++) {
      name += confuseChars[Math.floor(Math.random() * confuseChars.length)]
    }
    name = 'l' + name
  } else if (generator === 'Number') {
    name = '_' + Math.floor(Math.random() * 1000000).toString()
  } else if (generator === 'Minimal') {
    const minChars = 'abcdefghijklmnopqrstuvwxyz'
    name = minChars[Math.floor(Math.random() * 26)]
    if (Math.random() > 0.5) {
      name += minChars[Math.floor(Math.random() * 26)]
    }
  } else {
    for (let i = 0; i < length; i++) {
      name += chars[Math.floor(Math.random() * chars.length)]
    }
  }
  
  return name
}

function generateOpaquePredicate(): string {
  const predicates = [
    '((1+1)==2)',
    '((0*0)==0)',
    '(type("")=="string")',
    '(type(1)=="number")',
    '(true and true)',
    '(not false)',
    '((#"")==0)',
    '(1<2)',
    '(math.abs(-1)==1)',
    '((2^2)==4)',
  ]
  return predicates[Math.floor(Math.random() * predicates.length)]
}

function generateJunkCode(): string {
  const junkPatterns = [
    () => `local ${randomVarName('Mangled')}=${Math.floor(Math.random() * 1000)};`,
    () => `local ${randomVarName('Mangled')}="${randomVarName('Mangled')}";`,
    () => `if false then local ${randomVarName('Mangled')}=nil end;`,
    () => `do local ${randomVarName('Mangled')}={} end;`,
    () => `(function()end)();`,
  ]
  return junkPatterns[Math.floor(Math.random() * junkPatterns.length)]()
}

function numberToExpression(num: number): string {
  const a = Math.floor(Math.random() * 100) + 1
  const b = num + a
  const expressions = [
    `(${b}-${a})`,
    `(${num * 2}/2)`,
    `(${num + 10}-10)`,
    `(math.floor(${num}.0))`,
    `(${a}+${num - a})`,
  ]
  return expressions[Math.floor(Math.random() * expressions.length)]
}

export async function obfuscateCode(
  code: string, 
  settings: ObfuscationSettings
): Promise<ObfuscationResult> {
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700))
  
  let result = code
  let stepsApplied = 0

  if (settings.steps.encryptStrings) {
    const stringRegex = /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/g
    result = result.replace(stringRegex, (match) => {
      const content = match.slice(1, -1)
      if (content.length < 2) return match
      return simpleEncrypt(content)
    })
    stepsApplied++
  }

  if (settings.steps.controlFlowFlatten) {
    const funcVar = randomVarName(settings.nameGenerator)
    result = `local ${funcVar}=function()${result} end;${funcVar}()`
    stepsApplied++
  }

  if (settings.steps.opaquePredicates) {
    const predicate = generateOpaquePredicate()
    result = `if ${predicate} then ${result} end`
    stepsApplied++
  }

  if (settings.steps.junkCode) {
    const junkBefore = Array.from({ length: 3 }, () => generateJunkCode()).join('')
    const junkAfter = Array.from({ length: 3 }, () => generateJunkCode()).join('')
    result = junkBefore + result + junkAfter
    stepsApplied++
  }

  if (settings.steps.numbersToExpressions) {
    result = result.replace(/\b(\d+)\b/g, (match) => {
      const num = parseInt(match, 10)
      if (num > 0 && num < 10000 && Math.random() > 0.5) {
        return numberToExpression(num)
      }
      return match
    })
    stepsApplied++
  }

  if (settings.steps.constantArray) {
    stepsApplied++
  }

  if (settings.steps.antiTamper) {
    const checkVar = randomVarName(settings.nameGenerator)
    result = `local ${checkVar}=type(pcall)=="function"and type(error)=="function";if not ${checkVar} then return end;${result}`
    stepsApplied++
  }

  if (settings.steps.vmify) {
    const funcVar = randomVarName(settings.nameGenerator)
    const xorKey = Math.floor(Math.random() * 200) + 50
    const bytes: number[] = []
    for (let i = 0; i < result.length; i++) {
      bytes.push(result.charCodeAt(i) ^ xorKey)
    }
    result = `local ${funcVar}=(function()local k=${xorKey};local d={${bytes.join(',')}};local s="";for i=1,#d do s=s..string.char(d[i]~k)end;return(loadstring or load)(s)end)();return ${funcVar}()`
    stepsApplied++
  }

  if (settings.steps.wrapInFunction) {
    const funcVar = randomVarName(settings.nameGenerator)
    result = `local ${funcVar}=function()${result} end;return ${funcVar}()`
    stepsApplied++
  }

  result = minifyLua(result)

  return {
    code: result,
    stepsApplied,
  }
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

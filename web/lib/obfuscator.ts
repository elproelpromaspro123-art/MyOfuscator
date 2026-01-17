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

// Simple string encryption for demo (in production, this would run actual Lua via WASM or API)
function simpleEncrypt(str: string): string {
  const key = Math.floor(Math.random() * 255)
  const bytes = []
  for (let i = 0; i < str.length; i++) {
    bytes.push(str.charCodeAt(i) ^ key)
  }
  return `(function()local k=${key};local t={${bytes.join(',')}};local s="";for i=1,#t do s=s..string.char(t[i]~k)end;return s end)()`
}

// Generate random variable name
function randomVarName(generator: string): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_'
  const confuseChars = 'lI1iOo0'
  let name = ''
  const length = Math.floor(Math.random() * 8) + 4
  
  if (generator === 'Il' || generator === 'Homoglyph') {
    for (let i = 0; i < length; i++) {
      name += confuseChars[Math.floor(Math.random() * confuseChars.length)]
    }
    // Ensure it starts with a letter
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

// Generate opaque predicate
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

// Generate junk code
function generateJunkCode(varNames: string[]): string {
  const junkPatterns = [
    () => `local ${randomVarName('Mangled')}=${Math.floor(Math.random() * 1000)};`,
    () => `local ${randomVarName('Mangled')}="${randomVarName('Mangled')}";`,
    () => `if false then local ${randomVarName('Mangled')}=nil end;`,
    () => `do local ${randomVarName('Mangled')}={} end;`,
    () => `(function()end)();`,
  ]
  return junkPatterns[Math.floor(Math.random() * junkPatterns.length)]()
}

// Number to expression
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

// Simulate obfuscation (in production, this would call actual Prometheus via API or WASM)
export async function obfuscateCode(
  code: string, 
  settings: ObfuscationSettings
): Promise<ObfuscationResult> {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))
  
  let result = code
  let stepsApplied = 0

  // Extract strings and replace with encrypted versions
  if (settings.steps.encryptStrings) {
    const stringRegex = /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/g
    result = result.replace(stringRegex, (match) => {
      const content = match.slice(1, -1)
      if (content.length < 2) return match
      return simpleEncrypt(content)
    })
    stepsApplied++
  }

  // Add control flow flattening wrapper
  if (settings.steps.controlFlowFlatten) {
    const stateVar = randomVarName(settings.nameGenerator)
    const stateInit = Math.floor(Math.random() * 1000) + 1
    result = `local ${stateVar}=${stateInit};while true do if ${stateVar}==${stateInit} then ${result};${stateVar}=0 elseif ${stateVar}==0 then break end end`
    stepsApplied++
  }

  // Add opaque predicates
  if (settings.steps.opaquePredicates) {
    const predicate = generateOpaquePredicate()
    result = `if ${predicate} then ${result} end`
    stepsApplied++
  }

  // Add junk code
  if (settings.steps.junkCode) {
    const junkBefore = Array.from({ length: 3 }, () => generateJunkCode([])).join('')
    const junkAfter = Array.from({ length: 3 }, () => generateJunkCode([])).join('')
    result = junkBefore + result + junkAfter
    stepsApplied++
  }

  // Replace numbers with expressions
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

  // Wrap constants in array
  if (settings.steps.constantArray) {
    // Simple constant array simulation
    stepsApplied++
  }

  // Add anti-tamper
  if (settings.steps.antiTamper) {
    const checkVar = randomVarName(settings.nameGenerator)
    result = `local ${checkVar}=type(pcall)=="function"and type(error)=="function";if not ${checkVar} then return end;${result}`
    stepsApplied++
  }

  // Wrap in VM simulation
  if (settings.steps.vmify) {
    const vmVar = randomVarName(settings.nameGenerator)
    const dataVar = randomVarName(settings.nameGenerator)
    result = `-- Prometheus VM Protected\nlocal ${vmVar},${dataVar}=(function()local _ENV=_ENV or getfenv();return function(code)return assert(loadstring(code))()end end)(),[[${btoa(result)}]];return ${vmVar}((function(s)local t={};for i=1,#s do t[i]=string.char(((string.byte(s,i)-65)%256))end;return table.concat(t)end)(${dataVar}:gsub(".",function(c)return string.char(string.byte(c)+65-65)end)))`
    stepsApplied++
  }

  // Wrap in function
  if (settings.steps.wrapInFunction) {
    const funcVar = randomVarName(settings.nameGenerator)
    result = `local ${funcVar}=function()${result} end;return ${funcVar}()`
    stepsApplied++
  }

  // Minify - remove unnecessary whitespace and newlines
  result = result
    .replace(/\s+/g, ' ')
    .replace(/\s*([=+\-*/<>~,;{}()\[\]])\s*/g, '$1')
    .replace(/\s*\.\.\s*/g, '..')
    .trim()

  // Add header comment
  result = `-- Obfuscated with Prometheus v2.0 Enhanced\n-- https://github.com/prometheus-lua/Prometheus\n${result}`

  return {
    code: result,
    stepsApplied,
  }
}

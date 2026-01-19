export interface ObfuscationSettings {
  preset: 'Low' | 'Medium' | 'High' | 'Maximum'
}

export interface ObfuscationResult {
  code: string
  stepsApplied: number
}

const CHARS = 'abcdefghijklmnopqrstuvwxyz'
const randVar = () => '_' + Array.from({length: 12}, () => CHARS[Math.floor(Math.random() * 26)]).join('')
const randInt = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a
const shuffle = <T>(arr: T[]): T[] => {
  const r = [...arr]
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[r[i], r[j]] = [r[j], r[i]]
  }
  return r
}

function isSafe(s: string): boolean {
  if (s.length < 4 || s.length > 150) return false
  if (/:\/\/|http|\.com|\.lua|\.txt/.test(s)) return false
  if (/\\[nrt"]/.test(s)) return false
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    if (c < 32 || c > 126) return false
  }
  return !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)
}

function encryptVM(str: string): string {
  const k1 = randInt(30, 120), k2 = randInt(10, 50), k3 = randInt(5, 25)
  const bytes: number[] = []
  for (let i = 0; i < str.length; i++) {
    let b = str.charCodeAt(i)
    b = (b + k1) % 256
    b = b ^ k2
    b = (b + k3) % 256
    bytes.push(b)
  }
  const idx = bytes.map((_, i) => i)
  const shuf = shuffle(idx)
  const sBytes = shuf.map(i => bytes[i])
  const order = shuf.map((v, i) => ({o: v, n: i})).sort((a, b) => a.o - b.o).map(x => x.n + 1)

  const [vD, vO, vR, vT, vI, vC] = [randVar(), randVar(), randVar(), randVar(), randVar(), randVar()]
  return `(function()local ${vD}={${sBytes.join(',')}}local ${vO}={${order.join(',')}}local ${vR}={}for ${vI}=1,#${vD} do ${vR}[${vO}[${vI}]]=${vD}[${vI}]end local ${vT}={}for ${vI}=1,#${vR} do local ${vC}=${vR}[${vI}]${vC}=(${vC}-${k3})%256 ${vC}=bit32.bxor(${vC},${k2})${vC}=(${vC}-${k1})%256 ${vT}[${vI}]=string.char(${vC})end return table.concat(${vT})end)()`
}

function processStrings(code: string, level: number): string {
  let r = '', i = 0
  while (i < code.length) {
    if (code[i] === '-' && code[i+1] === '-') {
      if (code[i+2] === '[' && code[i+3] === '[') {
        let j = i + 4
        while (j < code.length - 1 && !(code[j] === ']' && code[j+1] === ']')) j++
        i = j + 2
        continue
      }
      while (i < code.length && code[i] !== '\n') i++
      continue
    }
    if (code[i] === '[' && code[i+1] === '[') {
      let j = i + 2
      while (j < code.length - 1 && !(code[j] === ']' && code[j+1] === ']')) j++
      r += code.slice(i, j + 2)
      i = j + 2
      continue
    }
    if (code[i] === '"' || code[i] === "'") {
      const q = code[i]
      let j = i + 1, s = ''
      while (j < code.length) {
        if (code[j] === '\\' && j + 1 < code.length) { s += code[j] + code[j+1]; j += 2; continue }
        if (code[j] === q) break
        s += code[j]; j++
      }
      if (level > 0 && isSafe(s)) {
        r += encryptVM(s)
      } else {
        r += code.slice(i, j + 1)
      }
      i = j + 1
      continue
    }
    r += code[i]; i++
  }
  return r
}

function genJunk(n: number): string {
  const j: string[] = []
  for (let i = 0; i < n; i++) {
    const v1 = randVar(), v2 = randVar()
    const patterns = [
      `local ${v1}=${randInt(100, 9999)}`,
      `local ${v1}=function()return ${randInt(1, 999)}end`,
      `local ${v1}={${randInt(1, 99)},${randInt(1, 99)}}`,
      `local ${v1},${v2}=${randInt(1, 99)},${randInt(1, 99)}`,
      `do local ${v1}=${randInt(1, 999)}end`,
    ]
    j.push(patterns[randInt(0, patterns.length - 1)])
  }
  return shuffle(j).join(';') + ';'
}

function antiTamper(code: string, level: number): string {
  const t = randVar(), c = randVar()
  const checks = shuffle([
    `${t}(pcall)=="function"`,
    `${t}(error)=="function"`,
    `${t}(tostring)=="function"`,
    `${t}(pairs)=="function"`,
    `${t}(table)=="table"`,
    `${t}(string)=="table"`,
    `${t}(math)=="table"`,
    `${t}(bit32)=="table"`,
  ]).slice(0, level > 1 ? 6 : 3)
  return `local ${t}=type;local ${c}=${checks.join(' and ')};if not ${c} then return end;${code}`
}

function controlFlow(code: string, complexity: number): string {
  const states: number[] = []
  for (let i = 0; i < complexity + 2; i++) states.push(randInt(1000, 99999))
  
  const s = randVar(), r = randVar()
  let result = `local ${s}=${states[0]};local ${r}=true;while ${r} do `
  
  const cases = shuffle(states.slice(0, -1).map((state, idx) => {
    if (idx === 0) return `if ${s}==${state} then ${code};${s}=${states[states.length - 1]}`
    return `elseif ${s}==${state} then ${s}=${states[idx + 1] || states[states.length - 1]}`
  }))
  
  result += cases.join(' ')
  result += ` elseif ${s}==${states[states.length - 1]} then ${r}=false end end`
  return result
}

function wrapLayers(code: string, layers: number): string {
  let r = code
  for (let i = 0; i < layers; i++) {
    const f = randVar(), v = randVar()
    const k = randInt(10, 99)
    r = `local ${f}=(function(${v})if ${v}~=${k} then return end;${r} end)(${k});return ${f}`
  }
  return r
}

function bytecodeVM(code: string): string {
  const vm = randVar(), data = randVar(), exec = randVar()
  const key = randInt(50, 200)
  
  const encoded: number[] = []
  for (let i = 0; i < code.length; i++) {
    encoded.push(code.charCodeAt(i) ^ key)
  }
  
  const chunk = 200
  const chunks: string[] = []
  for (let i = 0; i < encoded.length; i += chunk) {
    chunks.push(encoded.slice(i, i + chunk).join(','))
  }
  
  const parts = chunks.map(() => randVar())
  let init = parts.map((p, i) => `local ${p}={${chunks[i]}}`).join(';')
  const concat = parts.length > 1 
    ? `local ${data}={};for _,t in ipairs({${parts.join(',')}})do for _,v in ipairs(t)do ${data}[#${data}+1]=v end end`
    : `local ${data}=${parts[0]}`
  
  const i = randVar(), s = randVar(), c = randVar()
  
  return `(function()${init};${concat};local ${s}="";for ${i}=1,#${data} do local ${c}=bit32.bxor(${data}[${i}],${key});${s}=${s}..string.char(${c})end;local ${exec}=loadstring or load;return ${exec}(${s})()end)()`
}

function minify(code: string): string {
  let r = '', i = 0, inStr = false, strC = '', inLong = false
  while (i < code.length) {
    const c = code[i], n = code[i + 1] || ''
    if (inLong) { r += c; if (c === ']' && n === ']') { r += n; i += 2; inLong = false; continue }; i++; continue }
    if (inStr) { r += c; if (c === '\\') { r += n; i += 2; continue }; if (c === strC) inStr = false; i++; continue }
    if (c === '"' || c === "'") { inStr = true; strC = c; r += c; i++; continue }
    if (c === '[' && n === '[') { inLong = true; r += c + n; i += 2; continue }
    if (c === '-' && n === '-') {
      let j = i + 2
      if (code[j] === '[' && code[j + 1] === '[') { j += 2; while (j < code.length - 1 && !(code[j] === ']' && code[j + 1] === ']')) j++; i = j + 2; continue }
      while (j < code.length && code[j] !== '\n') j++; i = j; continue
    }
    if (/\s/.test(c)) {
      const p = r[r.length - 1] || ''
      let j = i; while (j < code.length && /\s/.test(code[j])) j++
      const nx = code[j] || ''
      if (/[a-zA-Z0-9_]/.test(p) && /[a-zA-Z0-9_]/.test(nx)) r += ' '
      i = j; continue
    }
    r += c; i++
  }
  return r.trim()
}

export async function obfuscateCode(code: string, settings: ObfuscationSettings): Promise<ObfuscationResult> {
  let r = code, steps = 0

  if (settings.preset === 'Low') {
    r = processStrings(r, 1); steps++
    r = genJunk(2) + r; steps++
    r = wrapLayers(r, 1); steps++
  } else if (settings.preset === 'Medium') {
    r = processStrings(r, 2); steps++
    r = genJunk(5) + r; steps++
    r = antiTamper(r, 1); steps++
    r = controlFlow(r, 1); steps++
    r = wrapLayers(r, 2); steps++
  } else if (settings.preset === 'High') {
    r = processStrings(r, 2); steps++
    r = genJunk(8) + r; steps++
    r = antiTamper(r, 2); steps++
    r = controlFlow(r, 2); steps++
    r = wrapLayers(r, 3); steps++
    r = genJunk(3) + r; steps++
  } else if (settings.preset === 'Maximum') {
    r = processStrings(r, 2); steps++
    r = genJunk(6) + r; steps++
    r = antiTamper(r, 2); steps++
    r = controlFlow(r, 3); steps++
    r = wrapLayers(r, 2); steps++
    r = minify(r)
    r = bytecodeVM(r); steps++
    r = genJunk(4) + r; steps++
    r = wrapLayers(r, 1); steps++
  }

  r = minify(r)
  return { code: r, stepsApplied: steps }
}

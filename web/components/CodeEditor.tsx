'use client'

import Editor, { OnMount, Monaco } from '@monaco-editor/react'
import { useCallback } from 'react'

interface CodeEditorProps {
  value: string
  onChange?: (value: string | undefined) => void
  language?: string
  height?: string
  readOnly?: boolean
}

export default function CodeEditor({ 
  value, 
  onChange, 
  language = 'lua', 
  height = '400px',
  readOnly = false 
}: CodeEditorProps) {

  const handleMount: OnMount = useCallback((editor, monaco: Monaco) => {
    monaco.editor.defineTheme('prometheus-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '525266', fontStyle: 'italic' },
        { token: 'keyword', foreground: '818cf8' },
        { token: 'string', foreground: 'c084fc' },
        { token: 'number', foreground: 'fbbf24' },
        { token: 'operator', foreground: '71717a' },
        { token: 'identifier', foreground: 'e4e4e7' },
        { token: 'string.escape', foreground: 'f472b6' },
      ],
      colors: {
        'editor.background': '#0f0f12',
        'editor.foreground': '#e4e4e7',
        'editor.lineHighlightBackground': '#15151a',
        'editor.selectionBackground': '#6366f133',
        'editorLineNumber.foreground': '#2a2a35',
        'editorLineNumber.activeForeground': '#525266',
        'editorCursor.foreground': '#6366f1',
        'editorIndentGuide.background': '#1f1f28',
        'editor.lineHighlightBorder': '#1f1f28',
      }
    })

    monaco.editor.setTheme('prometheus-dark')

    monaco.languages.setMonarchTokensProvider('lua', {
      defaultToken: '',
      tokenPostfix: '.lua',
      keywords: [
        'and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for', 
        'function', 'goto', 'if', 'in', 'local', 'nil', 'not', 'or', 
        'repeat', 'return', 'then', 'true', 'until', 'while'
      ],
      operators: ['+', '-', '*', '/', '%', '^', '#', '==', '~=', '<=', '>=', '<', '>', '=', ';', ':', ',', '.', '..', '...'],
      brackets: [
        { open: '{', close: '}', token: 'delimiter.curly' },
        { open: '[', close: ']', token: 'delimiter.square' },
        { open: '(', close: ')', token: 'delimiter.parenthesis' },
      ],
      tokenizer: {
        root: [
          [/--\[([=]*)\[/, { token: 'comment', next: '@comment.$1' }],
          [/--.*$/, 'comment'],
          [/"/, 'string', '@string."'],
          [/'/, 'string', "@string.'"],
          [/\[([=]*)\[/, { token: 'string', next: '@multiline.$1' }],
          [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
          [/0[xX][0-9a-fA-F]+/, 'number.hex'],
          [/\d+/, 'number'],
          [/[,:;]/, 'delimiter'],
          [/[{}()\[\]]/, '@brackets'],
          [/@?[a-zA-Z_]\w*/, { cases: { '@keywords': 'keyword', '@default': 'identifier' } }],
          [/[+\-*/%^#]=?/, 'operator'],
          [/[=~<>]=?/, 'operator'],
          [/\.\.\.?/, 'operator'],
        ],
        comment: [
          [/\]([=]*)\]/, { cases: { '$1==$S2': { token: 'comment', next: '@pop' }, '@default': 'comment' } }],
          [/./, 'comment'],
        ],
        string: [
          [/[^\\"']+/, 'string'],
          [/\\./, 'string.escape'],
          [/"/, { cases: { '$S2=="': { token: 'string', next: '@pop' }, '@default': 'string' } }],
          [/'/, { cases: { "$S2=='": { token: 'string', next: '@pop' }, '@default': 'string' } }],
        ],
        multiline: [
          [/\]([=]*)\]/, { cases: { '$1==$S2': { token: 'string', next: '@pop' }, '@default': 'string' } }],
          [/./, 'string'],
        ],
      },
    })
  }, [])

  return (
    <Editor
      height={height}
      defaultLanguage={language}
      value={value}
      onChange={onChange}
      onMount={handleMount}
      options={{
        readOnly,
        minimap: { enabled: false },
        fontSize: 13,
        fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
        lineNumbers: 'on',
        lineNumbersMinChars: 3,
        renderLineHighlight: 'line',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: 'on',
        padding: { top: 12, bottom: 12 },
        cursorBlinking: 'smooth',
        smoothScrolling: true,
        contextmenu: false,
        folding: false,
        scrollbar: {
          vertical: 'auto',
          horizontal: 'auto',
          verticalScrollbarSize: 8,
          horizontalScrollbarSize: 8,
        },
      }}
      loading={
        <div className="h-full flex items-center justify-center bg-zinc-900">
          <span className="text-zinc-500 text-sm">Loading...</span>
        </div>
      }
    />
  )
}

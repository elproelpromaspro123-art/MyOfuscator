'use client'

import Editor, { OnMount } from '@monaco-editor/react'
import { useCallback, useRef } from 'react'
import type { editor } from 'monaco-editor'

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
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  const handleMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor

    // Define custom Lua theme
    monaco.editor.defineTheme('prometheus-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: '00FFFF' },
        { token: 'string', foreground: 'FF6B9D' },
        { token: 'number', foreground: 'FFD700' },
        { token: 'operator', foreground: '00FFFF' },
        { token: 'identifier', foreground: 'FFFFFF' },
        { token: 'function', foreground: '00FF00' },
        { token: 'variable', foreground: '87CEEB' },
        { token: 'type', foreground: 'FF00FF' },
      ],
      colors: {
        'editor.background': '#0D0D12',
        'editor.foreground': '#FFFFFF',
        'editor.lineHighlightBackground': '#1a1a24',
        'editor.selectionBackground': '#00FFFF33',
        'editor.inactiveSelectionBackground': '#00FFFF22',
        'editorLineNumber.foreground': '#00FFFF55',
        'editorLineNumber.activeForeground': '#00FFFF',
        'editorCursor.foreground': '#00FFFF',
        'editor.selectionHighlightBackground': '#00FFFF22',
        'editorIndentGuide.background': '#1a1a24',
        'editorIndentGuide.activeBackground': '#00FFFF33',
      }
    })

    monaco.editor.setTheme('prometheus-dark')

    // Configure Lua language
    monaco.languages.setMonarchTokensProvider('lua', {
      defaultToken: '',
      tokenPostfix: '.lua',
      keywords: [
        'and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for', 
        'function', 'goto', 'if', 'in', 'local', 'nil', 'not', 'or', 
        'repeat', 'return', 'then', 'true', 'until', 'while'
      ],
      operators: [
        '+', '-', '*', '/', '%', '^', '#',
        '==', '~=', '<=', '>=', '<', '>', '=',
        ';', ':', ',', '.', '..', '...'
      ],
      brackets: [
        { open: '{', close: '}', token: 'delimiter.curly' },
        { open: '[', close: ']', token: 'delimiter.square' },
        { open: '(', close: ')', token: 'delimiter.parenthesis' },
      ],
      tokenizer: {
        root: [
          [/--\[([=]*)\[/, { token: 'comment', next: '@comment.$1' }],
          [/--.*$/, 'comment'],
          [/"([^"\\]|\\.)*$/, 'string.invalid'],
          [/'([^'\\]|\\.)*$/, 'string.invalid'],
          [/"/, 'string', '@string."'],
          [/'/, 'string', "@string.'"],
          [/\[([=]*)\[/, { token: 'string', next: '@multiline.$1' }],
          [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
          [/0[xX][0-9a-fA-F]+/, 'number.hex'],
          [/\d+/, 'number'],
          [/[,:;]/, 'delimiter'],
          [/[{}()\[\]]/, '@brackets'],
          [/@?[a-zA-Z_]\w*/, {
            cases: {
              '@keywords': 'keyword',
              '@default': 'identifier',
            },
          }],
          [/[+\-*/%^#]=?/, 'operator'],
          [/[=~<>]=?/, 'operator'],
          [/\.\.\.?/, 'operator'],
        ],
        comment: [
          [/\]([=]*)\]/, {
            cases: {
              '$1==$S2': { token: 'comment', next: '@pop' },
              '@default': 'comment',
            },
          }],
          [/./, 'comment'],
        ],
        string: [
          [/[^\\"']+/, 'string'],
          [/\\./, 'string.escape'],
          [/"/, { cases: { '$S2=="': { token: 'string', next: '@pop' }, '@default': 'string' } }],
          [/'/, { cases: { "$S2=='": { token: 'string', next: '@pop' }, '@default': 'string' } }],
        ],
        multiline: [
          [/\]([=]*)\]/, {
            cases: {
              '$1==$S2': { token: 'string', next: '@pop' },
              '@default': 'string',
            },
          }],
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
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
        fontLigatures: true,
        lineNumbers: 'on',
        lineNumbersMinChars: 3,
        renderLineHighlight: 'line',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 4,
        wordWrap: 'on',
        padding: { top: 16, bottom: 16 },
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        smoothScrolling: true,
        contextmenu: false,
        folding: true,
        bracketPairColorization: { enabled: true },
        guides: {
          indentation: true,
          bracketPairs: true,
        },
        scrollbar: {
          vertical: 'auto',
          horizontal: 'auto',
          verticalScrollbarSize: 10,
          horizontalScrollbarSize: 10,
        },
      }}
      loading={
        <div className="h-full flex items-center justify-center bg-gray-900/50">
          <div className="flex items-center gap-2 text-cyan-400">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading editor...
          </div>
        </div>
      }
    />
  )
}

import React, { useRef, useContext } from 'react';
import Editor from '@monaco-editor/react';
import { AppContext } from '../context/AppContext';

const LANGUAGE_MAP = {
  python:     'python',
  javascript: 'javascript',
  typescript: 'typescript',
  csharp:     'csharp',
  java:       'java',
  cpp:        'cpp',
  c:          'c',
  go:         'go',
  rust:       'rust',
  php:        'php',
  ruby:       'ruby',
  sql:        'sql',
};

const MonacoEditor = ({
  code,
  onChange,
  language = 'python',
  height = '100%',
  readOnly = false,
  fontSize = 14,
}) => {
  const { theme } = useContext(AppContext);
  const editorRef = useRef(null);

  const handleMount = (editor) => {
    editorRef.current = editor;
    // Focus editor on mount
    editor.focus();
  };

  const monacoLanguage = LANGUAGE_MAP[language?.toLowerCase()] || 'plaintext';

  const options = {
    fontSize,
    fontFamily: "'Fira Code', 'Cascadia Code', Consolas, 'Courier New', monospace",
    fontLigatures: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    lineNumbers: 'on',
    renderLineHighlight: 'gutter',
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    smoothScrolling: true,
    padding: { top: 16, bottom: 16 },
    tabSize: 4,
    wordWrap: 'off',
    readOnly,
    automaticLayout: true,
    bracketPairColorization: { enabled: true },
    suggest: { showKeywords: true },
    quickSuggestions: { other: true, comments: false, strings: false },
    scrollbar: {
      verticalScrollbarSize: 6,
      horizontalScrollbarSize: 6,
    },
    overviewRulerLanes: 0,
  };

  return (
    <Editor
      height={height}
      language={monacoLanguage}
      value={code}
      onChange={onChange}
      onMount={handleMount}
      theme={theme === 'light' ? 'vs-light' : 'vs-dark'}
      options={options}
      loading={
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'var(--text-muted)',
          fontSize: '0.9rem',
          gap: '10px'
        }}>
          <div style={{
            width: '20px', height: '20px',
            border: '2px solid var(--brand-glow)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          Загрузка редактора...
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      }
    />
  );
};

export default MonacoEditor;

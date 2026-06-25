import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { io } from 'socket.io-client';
import '@xterm/xterm/css/xterm.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const TerminalPanel = ({ activeProjectId, activeProjectFiles, theme }) => {
  const terminalRef = useRef(null);
  const socketRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!terminalRef.current || !activeProjectId) return;

    // Initialize xterm.js
    const term = new Terminal({
      cursorBlink: true,
      fontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace',
      fontSize: 14,
      allowTransparency: true,
      theme: {
        background: theme === 'light' ? '#ffffff' : '#000000',
        foreground: theme === 'light' ? '#334155' : '#e2e8f0',
        cursor: theme === 'light' ? '#334155' : '#e2e8f0',
        selectionBackground: theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)',
      }
    });
    
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    
    term.open(terminalRef.current);
    try {
      fitAddon.fit();
    } catch (e) {}
    
    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Connect to Socket.IO
    const socketUrl = API_BASE_URL.replace('/api', '');
    const socket = io(socketUrl);
    socketRef.current = socket;

    socket.on('connect', () => {
      term.writeln('\x1b[32m[Connected to Interactive Terminal]\x1b[0m');
      
      // Sync files to the backend workspace
      socket.emit('sync_files', { projectId: activeProjectId, files: activeProjectFiles });
      setIsReady(true);
      
      // Trigger initial resize sync
      try {
        fitAddon.fit();
        socket.emit('terminal.resize', { cols: term.cols, rows: term.rows });
      } catch (e) {}
    });

    // Write incoming data from pty to xterm
    socket.on('terminal.incData', (data) => {
      term.write(data);
    });

    // Send keystrokes to pty
    term.onData((data) => {
      socket.emit('terminal.toTerm', data);
    });

    // Handle Resize using ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit();
        socket.emit('terminal.resize', { cols: term.cols, rows: term.rows });
      } catch (e) {}
    });
    
    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    term.onResize(({ cols, rows }) => {
      socket.emit('terminal.resize', { cols, rows });
    });

    return () => {
      resizeObserver.disconnect();
      socket.disconnect();
      term.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProjectId]);

  // Sync files whenever they change (debounce to prevent spam)
  useEffect(() => {
    if (isReady && socketRef.current && activeProjectFiles) {
      const timer = setTimeout(() => {
        socketRef.current.emit('sync_files', { projectId: activeProjectId, files: activeProjectFiles });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [activeProjectFiles, activeProjectId, isReady]);

  // Update terminal theme dynamically
  useEffect(() => {
    if (xtermRef.current) {
      xtermRef.current.options.theme = {
        background: theme === 'light' ? '#ffffff' : '#000000',
        foreground: theme === 'light' ? '#334155' : '#e2e8f0',
        cursor: theme === 'light' ? '#334155' : '#e2e8f0',
        selectionBackground: theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)',
      };
    }
  }, [theme]);

  // Expose socket for external commands (like "Run Code" button)
  useEffect(() => {
    window.__terminalSocket = socketRef.current;
  }, [isReady]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <div ref={terminalRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
    </div>
  );
};

export default TerminalPanel;

import React, { useState, useContext, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import MonacoEditor from '../components/MonacoEditor';
import WelcomeScreen from '../components/WelcomeScreen';
import { Play, Save, Code2, X } from 'lucide-react';
import { WorkspaceContext } from '../context/WorkspaceContext';
import { AppContext } from '../context/AppContext';
import { apiCall } from '../utils/api';
import { FileIcon } from '../components/FileIcon';

const LANGUAGES = [
  { id: 'python',     label: 'Python',     ext: '.py'  },
  { id: 'javascript', label: 'JavaScript', ext: '.js'  },
  { id: 'typescript', label: 'TypeScript', ext: '.ts'  },
  { id: 'csharp',     label: 'C#',         ext: '.cs'  },
  { id: 'java',       label: 'Java',       ext: '.java'},
  { id: 'cpp',        label: 'C++',        ext: '.cpp' },
  { id: 'go',         label: 'Go',         ext: '.go'  },
  { id: 'rust',       label: 'Rust',       ext: '.rs'  },
  { id: 'php',        label: 'PHP',        ext: '.php' },
  { id: 'sql',        label: 'SQL',        ext: '.sql' },
];

const IDE = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get('project');

  const {
    setShowPanel, setActivePanelTab,
    setTerminalOutput, setIsTerminalRunning,
    setShowSideBar,
    showSideBar, toggleSideBar,
    showSecondarySideBar, toggleSecondarySideBar,
    showPanel, togglePanel,
    setTriggerAiChat,
    activeProjectFiles, setActiveProjectFiles,
    originalProjectFiles, setOriginalProjectFiles,
    activeProjectId, setActiveProjectId,
    activeFileId, setActiveFileId,
    stdin
  } = useContext(WorkspaceContext);
  const { t } = useContext(AppContext);

  const [projects, setProjects] = useState([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!activeProjectId) return;
    setSaving(true);
    try {
      await apiCall(`/projects/${activeProjectId}`, { 
        method: 'PUT', 
        body: JSON.stringify({ code: JSON.stringify(activeProjectFiles) }) 
      });
      setOriginalProjectFiles(activeProjectFiles); // Reset original state to current after save
    } catch (e) {
      console.error("Save failed", e);
    } finally {
      setSaving(false);
    }
  };

  // Autosave timer
  useEffect(() => {
    if (!activeProjectId || activeProjectFiles.length === 0) return;
    const t = setTimeout(() => handleSave(), 3000);
    return () => clearTimeout(t);
  }, [activeProjectFiles, activeProjectId]);

  // Defined before useEffect to avoid hoisting issues with const arrow functions
  const loadProject = async (id) => {
    try {
      const data = await apiCall(`/projects/${id}`);
      if (data && data.code) {
        let parsedFiles = [];
        try {
          parsedFiles = JSON.parse(data.code);
          if (!Array.isArray(parsedFiles)) throw new Error("Not array");
        } catch (e) {
          // Fallback for legacy string code
          parsedFiles = [{ id: `proj-${id}`, title: data.title || 'main.py', language: data.language || 'python', code: data.code || '' }];
        }
        
        // Ensure legacy files have type and parentId
        parsedFiles = parsedFiles.map(f => ({
          ...f,
          type: f.type || 'file',
          parentId: f.parentId || null
        }));
        
        setActiveProjectFiles(parsedFiles);
        setOriginalProjectFiles(parsedFiles);
        if (parsedFiles.length > 0) setActiveFileId(parsedFiles[0].id);
      }
    } catch (e) {
      console.error("Failed to load project details", e);
    }
  };

  useEffect(() => {
    const initIDE = async () => {
      try {
        const data = await apiCall('/projects');
        const ideProjects = data.filter(p => p.type === 'ide');
        setProjects(ideProjects);

        if (projectId) {
          localStorage.setItem('lastActiveProjectId', projectId);
          setActiveProjectId(projectId);
          await loadProject(projectId);
          setShowSideBar(true);
          setShowPanel(true);
        } else {
          // Only auto-restore if we are actually on the /ide route
          if (window.location.pathname !== '/ide') return;
          
          const lastProjectId = localStorage.getItem('lastActiveProjectId');
          // Only auto-restore if the project actually still exists in the user's list
          if (lastProjectId && ideProjects.find(p => p.id.toString() === lastProjectId)) {
            navigate(`/ide?project=${lastProjectId}`, { replace: true });
            return;
          }
          
          setActiveProjectId(null);
          setActiveProjectFiles([]);
          setOriginalProjectFiles([]);
          setActiveFileId(null);
          // No project loaded, show welcome state
          setShowSideBar(false);
          setShowPanel(false);
        }
      } catch (e) {
        console.error("Failed to load projects", e);
      } finally {
        setIsInitializing(false);
      }
    };
    initIDE();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleRunCode = async () => {
    const activeTab = activeProjectFiles.find(t => t.id === activeFileId);
    if (!activeTab) return;

    setActivePanelTab('terminal');
    setShowPanel(true);

    // Save current file state to backend right before running
    if (window.__terminalSocket) {
      window.__terminalSocket.emit('sync_files', { projectId: activeProjectId, files: activeProjectFiles });
      
      const filename = activeTab.name || activeTab.title;
      let cmd = '';
      if (filename.endsWith('.py')) cmd = `python "${filename}"\r\n`;
      else if (filename.endsWith('.js')) cmd = `node "${filename}"\r\n`;
      else cmd = `echo "Cannot automatically run ${filename}."\r\n`;
      
      // Ctrl+C to stop any running process
      window.__terminalSocket.emit('terminal.toTerm', '\x03');
      
      // Wait for PowerShell to show new prompt, clear any ghost characters with Escape, then run
      setTimeout(() => {
        window.__terminalSocket.emit('terminal.toTerm', '\x1b' + cmd);
      }, 500);
    }
  };

  const closeTab = (id) => {
    setActiveProjectFiles(prev => {
      const filtered = prev.filter(t => t.id !== id);
      if (activeFileId === id) setActiveFileId(filtered.length > 0 ? filtered[filtered.length - 1].id : null);
      
      // If we close the last tab, revert back to WelcomeScreen-like state but keep Explorer open
      if (filtered.length === 0) {
        setShowPanel(false);
      }
      return filtered;
    });
  };

  const activeTab = activeProjectFiles.find(t => t.id === activeFileId && t.type !== 'folder');

  const colors = {
    editorBg: '#1e1e1e',
    tabActiveBg: '#1e1e1e',
    tabInactiveBg: '#2d2d2d',
    tabBorderTop: '#007fd4',
    border: '#3c3c3c'
  };

  if (isInitializing) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: colors.editorBg }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--overlay-bg-hover)', borderTopColor: 'var(--brand-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  const getMonacoLanguage = (langOrExt) => {
    if (!langOrExt) return 'plaintext';
    const normalized = langOrExt.toLowerCase();
    const match = LANGUAGES.find(l => l.id === normalized || l.ext.replace('.', '') === normalized);
    return match ? match.id : normalized;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      {/* Tabs Bar */}
      <div style={{ height: '35px', background: colors.tabInactiveBg, display: 'flex', overflowX: 'auto', flexShrink: 0 }}>
        {activeProjectFiles.filter(tab => tab.type !== 'folder').map(tab => (
          <div 
            key={tab.id}
            onClick={() => setActiveFileId(tab.id)}
            style={{ 
              background: activeFileId === tab.id ? colors.tabActiveBg : 'transparent',
              borderTop: activeFileId === tab.id ? `1px solid ${colors.tabBorderTop}` : '1px solid transparent',
              borderRight: `1px solid ${colors.border}`,
              padding: '0 15px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px',
              color: activeFileId === tab.id ? '#fff' : '#888',
              minWidth: '120px', cursor: 'pointer'
            }}
          >
            <FileIcon filename={tab.title || tab.name} size={14} />
            <span style={{ whiteSpace: 'nowrap' }}>{tab.title || tab.name}</span>
            <div style={{ flex: 1 }} />
            <X size={14} style={{ opacity: activeFileId === tab.id ? 1 : 0.5 }} onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }} />
          </div>
        ))}
        <div style={{ flex: 1, borderBottom: `1px solid ${colors.border}` }} />
        
        {/* Editor Action Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', gap: '12px', borderBottom: `1px solid ${colors.border}`, background: colors.editorBg }}>
          {saving && <span style={{ fontSize: '11px', color: 'var(--brand-primary)' }}>Saving...</span>}
          <Save size={16} color="#ccc" style={{ cursor: 'pointer' }} onClick={handleSave} title={t('saveCode') || "Save"} />
          {activeTab && <Play size={16} color="#89d185" style={{ cursor: 'pointer' }} onClick={handleRunCode} title={t('runCode') || "Run Code"} />}
          <div style={{ width: '1px', height: '16px', background: colors.border, margin: '0 2px' }} />
          <div style={{ cursor: 'pointer', display: 'flex' }} onClick={toggleSideBar} title={t('toggleExplorer') || "Toggle Explorer (Папки)"}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1.5" y="1.5" width="13" height="13" rx="1.5" stroke={showSideBar ? "#ffffff" : "#888888"} strokeWidth="1.5"/>
              <path d="M5.5 1.5V14.5" stroke={showSideBar ? "#ffffff" : "#888888"} strokeWidth="1.5"/>
              {showSideBar && <path d="M1.5 3C1.5 2.17157 2.17157 1.5 3 1.5H5.5V14.5H3C2.17157 14.5 1.5 13.8284 1.5 13V3Z" fill="#ffffff"/>}
            </svg>
          </div>
          <div style={{ cursor: 'pointer', display: 'flex' }} onClick={togglePanel} title={t('toggleTerminal') || "Toggle Terminal"}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1.5" y="1.5" width="13" height="13" rx="1.5" stroke={showPanel ? "#ffffff" : "#888888"} strokeWidth="1.5"/>
              <path d="M1.5 10.5H14.5" stroke={showPanel ? "#ffffff" : "#888888"} strokeWidth="1.5"/>
              {showPanel && <path d="M1.5 10.5H14.5V13C14.5 13.8284 13.8284 14.5 13 14.5H3C2.17157 14.5 1.5 13.8284 1.5 13V10.5Z" fill="#ffffff"/>}
            </svg>
          </div>
          <div style={{ cursor: 'pointer', display: 'flex' }} onClick={toggleSecondarySideBar} title={t('toggleAiChat') || "Toggle AI Chat"}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1.5" y="1.5" width="13" height="13" rx="1.5" stroke={showSecondarySideBar ? "#ffffff" : "#888888"} strokeWidth="1.5"/>
              <path d="M10.5 1.5V14.5" stroke={showSecondarySideBar ? "#ffffff" : "#888888"} strokeWidth="1.5"/>
              {showSecondarySideBar && <path d="M10.5 1.5H13C13.8284 1.5 14.5 2.17157 14.5 3V13C14.5 13.8284 13.8284 14.5 13 14.5H10.5V1.5Z" fill="#ffffff"/>}
            </svg>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div style={{ flex: 1, position: 'relative' }}>
        {activeProjectFiles.length === 0 ? (
          <WelcomeScreen projects={projects} />
        ) : activeTab ? (
          <MonacoEditor
            code={activeTab.code || activeTab.content || ''}
            onChange={val => {
              setActiveProjectFiles(prev => prev.map(t => t.id === activeTab.id ? { ...t, content: val, code: val } : t));
            }}
            language={getMonacoLanguage(activeTab.language)}
            height="100%"
            fontSize={14}
            theme="vs-dark"
            options={{ minimap: { enabled: false } }}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666', background: colors.editorBg }}>
            {t('noFileOpened') || "No file opened."}
          </div>
        )}
      </div>
    </div>
  );
};

export default IDE;

import React, { useState, useEffect, useRef, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Save, Plus, FolderOpen, Code2, Terminal,
  Sparkles, Send, X, Copy, Check, BarChart2, Search,
  Settings, Files, XCircle, ArrowRightSquare,
  PanelBottom, Bell, UserCircle, BookOpen, Map, GraduationCap
} from 'lucide-react';
import MonacoEditor from '../components/MonacoEditor';
import { AppContext } from '../context/AppContext';
import { WorkspaceContext } from '../context/WorkspaceContext';
import { apiCall } from '../utils/api';
import ModelSelector from '../components/ModelSelector';
import useAiStream from '../hooks/useAiStream';

// Import Pages to render in Tabs
import Dashboard from './Dashboard';
import CourseCatalog from './Courses';
import Profile from './Profile';
import SettingsPage from './Settings';
import Challenges from './Challenges';
import Projects from './Projects';
import LearningPaths from './LearningPaths';
import AdminDashboard from './AdminDashboard';
import TeacherStudio from './TeacherStudio';

const LANGUAGES = [
  { id: 'python',     label: 'Python',     icon: '🐍', ext: '.py'  },
  { id: 'javascript', label: 'JavaScript', icon: '⚡', ext: '.js'  },
  { id: 'typescript', label: 'TypeScript', icon: '🔷', ext: '.ts'  },
  { id: 'csharp',     label: 'C#',         icon: '🔷', ext: '.cs'  },
  { id: 'java',       label: 'Java',       icon: '☕', ext: '.java'},
  { id: 'cpp',        label: 'C++',        icon: '⚙️', ext: '.cpp' },
  { id: 'go',         label: 'Go',         icon: '🐹', ext: '.go'  },
  { id: 'rust',       label: 'Rust',       icon: '🦀', ext: '.rs'  },
  { id: 'php',        label: 'PHP',        icon: '🐘', ext: '.php' },
  { id: 'sql',        label: 'SQL',        icon: '🗄️', ext: '.sql' },
];

const DEFAULT_CODE = {
  python:     '# Добро пожаловать в CodeAI IDE!\nprint("Hello, World!")\n',
  javascript: '// Добро пожаловать в CodeAI IDE!\nconsole.log("Hello, World!");\n',
  // ... other defaults omitted for brevity
};

// Map of components
const ComponentMap = {
  'Dashboard': Dashboard,
  'Courses': CourseCatalog,
  'Profile': Profile,
  'Settings': SettingsPage,
  'Challenges': Challenges,
  'Projects': Projects,
  'Paths': LearningPaths,
  'Admin': AdminDashboard,
  'Teacher': TeacherStudio
};

const Workspace = () => {
  const { user, logout } = useContext(AppContext);
  const {
    activeActivity, setActiveActivity,
    showSideBar, setShowSideBar, toggleSideBar,
    showSecondarySideBar, setShowSecondarySideBar, toggleSecondarySideBar,
    showPanel, setShowPanel, togglePanel,
    tabs, setTabs,
    activeTabId, setActiveTabId,
    openTab, closeTab,
    activePanelTab, setActivePanelTab
  } = useContext(WorkspaceContext);

  // Editor State
  const [code, setCode] = useState(DEFAULT_CODE['python'] || '');
  const [stdin, setStdin] = useState('');
  
  // Terminal Panel
  const [output, setOutput] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [runTime, setRunTime] = useState(null);
  
  // Projects state
  const [projects, setProjects] = useState([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // AI Chat
  const [aiMessages, setAiMessages] = useState([
    { role: 'ai', content: 'Привет! Я твой ИИ-ассистент.' }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [selectedModel, setSelectedModel] = useState('auto');
  const [aiModels, setAiModels] = useState([{ id: 'auto', name: 'Авто' }]);
  const { streamChat, isStreaming } = useAiStream();
  const aiEndRef = useRef(null);

  // Account Menu
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  const loadProjects = async () => {
    try {
      const data = await apiCall('/projects');
      setProjects(data.filter(p => p.type === 'ide'));
    } catch (e) {}
  };

  useEffect(() => {
    loadProjects();
    apiCall('/ai/models').then(data => { if (data.models) setAiModels(data.models); }).catch(()=>{});
  }, []);

  useEffect(() => {
    aiEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, isAiThinking]);

  const handleOpenPage = (id, title, componentName) => {
    openTab({ id, title, type: 'page', component: componentName });
    setActiveActivity(id);
    if (!showSideBar) setShowSideBar(true);
  };

  const handleNewFile = () => {
    const newId = `file-${Date.now()}`;
    openTab({ id: newId, title: 'untitled.py', type: 'code', language: 'python', code: '' });
  };

  const handleLoadProject = (p) => {
    openTab({ id: `proj-${p.id}`, title: p.title, type: 'code', language: p.language, code: p.code, projectId: p.id });
  };

  const handleRunCode = async () => {
    // get active tab code
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (!activeTab || activeTab.type !== 'code') return;

    if (isRunning) return;
    setIsRunning(true);
    setActivePanelTab('terminal');
    setShowPanel(true);
    setOutput([{ type: 'info', text: `> Running...` }]);
    setRunTime(null);

    try {
      const result = await apiCall('/execute', {
        method: 'POST',
        body: JSON.stringify({ language: activeTab.language, code: activeTab.code, stdin, context: 'ide' })
      });
      const lines = [];
      if (result.stdout) result.stdout.split('\n').forEach(l => { if(l) lines.push({ type: 'stdout', text: l }) });
      if (result.stderr) result.stderr.split('\n').forEach(l => { if(l) lines.push({ type: 'error', text: l }) });
      if (lines.length === 0) lines.push({ type: 'muted', text: '(no output)' });
      lines.push({ type: result.exit_code === 0 ? 'success' : 'error', text: `[Done] exited with code=${result.exit_code} in ${result.time_ms}ms` });
      setOutput(lines);
      setRunTime(result.time_ms);
      
      if (result.stderr && result.exit_code !== 0) {
         setTimeout(() => {
           setAiMessages(prev => [...prev, { role: 'ai', content: `Обнаружена ошибка. Помочь исправить?` }]);
           setShowSecondarySideBar(true);
         }, 800);
      }
    } catch (e) {
      setOutput([{ type: 'error', text: `Error: ${e.message}` }]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSendAiMessage = async (e) => {
    e?.preventDefault();
    const text = aiInput.trim();
    if (!text || isStreaming) return;
    setAiInput('');
    setAiMessages(prev => [...prev, { role: 'user', content: text }]);
    setAiMessages(prev => [...prev, { role: 'ai', content: '', streaming: true }]);
    setIsAiThinking(true);

    const activeTab = tabs.find(t => t.id === activeTabId);
    let contextMsg = `Вопрос: ${text}`;
    if (activeTab?.type === 'code') {
       contextMsg = `Код:\n\`\`\`${activeTab.language}\n${activeTab.code}\n\`\`\`\nВопрос: ${text}`;
    }

    await streamChat([{ role: 'user', content: contextMsg }], {
      model: selectedModel,
      onToken: (_, fullText) => {
        setAiMessages(prev => { const u=[...prev]; u[u.length-1]={role:'ai',content:fullText,streaming:true}; return u; });
        setIsAiThinking(false);
      },
      onDone: (fullText) => {
        setAiMessages(prev => { const u=[...prev]; u[u.length-1]={role:'ai',content:fullText}; return u; });
      },
      onError: (err) => {
        setAiMessages(prev => { const u=[...prev]; u[u.length-1]={role:'ai',content:`❌ Error: ${err}`}; return u; });
      }
    });
  };

  const activeTab = tabs.find(t => t.id === activeTabId);

  const colors = {
    activityBarBg: '#333333',
    activityBarFg: '#ffffff',
    activityBarInactive: 'var(--text-muted)',
    sideBarBg: '#252526',
    sideBarHeader: '#cccccc',
    editorBg: '#1e1e1e',
    tabActiveBg: '#1e1e1e',
    tabInactiveBg: '#2d2d2d',
    tabBorderTop: '#007fd4',
    panelBg: '#1e1e1e',
    panelBorder: '#3c3c3c',
    statusBarBg: 'var(--brand-primary)',
    statusBarFg: '#ffffff',
    textMain: '#cccccc',
    border: '#3c3c3c',
    listHover: '#2a2d2e',
    listActive: '#37373d',
    buttonPrimary: '#0e639c'
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: colors.editorBg, color: colors.textMain, fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', overflow: 'hidden' }}>
      
      {/* Activity Bar */}
      <div style={{ width: '48px', background: colors.activityBarBg, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0', zIndex: 10, flexShrink: 0 }}>
        {/* Top Icons */}
        <div 
          onClick={() => { setShowSideBar(true); setActiveActivity('explorer'); }}
          style={{ width: '48px', height: '48px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', borderLeft: activeActivity === 'explorer' && showSideBar ? '2px solid white' : '2px solid transparent', color: activeActivity === 'explorer' && showSideBar ? colors.activityBarFg : colors.activityBarInactive }}
        >
          <Files size={24} strokeWidth={1.5} />
        </div>
        <div 
          onClick={() => { handleOpenPage('courses', 'Courses', 'Courses') }}
          style={{ width: '48px', height: '48px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', borderLeft: activeActivity === 'courses' ? '2px solid white' : '2px solid transparent', color: activeActivity === 'courses' ? colors.activityBarFg : colors.activityBarInactive }}
        >
          <BookOpen size={24} strokeWidth={1.5} />
        </div>
        <div 
          onClick={() => { handleOpenPage('dashboard', 'Dashboard', 'Dashboard') }}
          style={{ width: '48px', height: '48px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', borderLeft: activeActivity === 'dashboard' ? '2px solid white' : '2px solid transparent', color: activeActivity === 'dashboard' ? colors.activityBarFg : colors.activityBarInactive }}
        >
          <BarChart2 size={24} strokeWidth={1.5} />
        </div>
        {user?.role === 'admin' && (
           <div onClick={() => { handleOpenPage('admin', 'Admin', 'Admin') }} style={{ width: '48px', height: '48px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', color: colors.activityBarInactive }}>
             <Settings size={24} strokeWidth={1.5} />
           </div>
        )}

        <div style={{ flex: 1 }} />
        
        {/* Bottom Icons */}
        <div style={{ position: 'relative' }}>
          <div onClick={() => setShowAccountMenu(!showAccountMenu)} style={{ width: '48px', height: '48px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', color: colors.activityBarInactive }}>
            {user?.avatar_url ? (
              <img src={user.avatar_url.startsWith('http') ? user.avatar_url : `${import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:5000'}${user.avatar_url}`} alt="Avatar" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <UserCircle size={24} strokeWidth={1.5} />
            )}
          </div>
          {showAccountMenu && (
             <div style={{ position: 'absolute', bottom: '10px', left: '50px', background: '#252526', border: `1px solid ${colors.border}`, borderRadius: '4px', padding: '5px', width: '200px', boxShadow: '0 4px 6px var(--dropdown-shadow)', zIndex: 100 }}>
               <div style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => {handleOpenPage('profile', 'Profile', 'Profile'); setShowAccountMenu(false);}}>Profile</div>
               <div style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={logout}>Sign Out</div>
             </div>
          )}
        </div>
        <div style={{ position: 'relative' }}>
          <div onClick={() => setShowSettingsMenu(!showSettingsMenu)} style={{ width: '48px', height: '48px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', color: colors.activityBarInactive }}>
            <Settings size={24} strokeWidth={1.5} />
          </div>
          {showSettingsMenu && (
             <div style={{ position: 'absolute', bottom: '10px', left: '50px', background: '#252526', border: `1px solid ${colors.border}`, borderRadius: '4px', padding: '5px', width: '200px', boxShadow: '0 4px 6px var(--dropdown-shadow)', zIndex: 100 }}>
               <div style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => {handleOpenPage('settings', 'Settings', 'Settings'); setShowSettingsMenu(false);}}>Settings</div>
               <div style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => {handleOpenPage('paths', 'Paths', 'Paths'); setShowSettingsMenu(false);}}>Learning Paths</div>
             </div>
          )}
        </div>
      </div>

      {/* Side Bar (Left Panel) */}
      {showSideBar && (
        <div style={{ width: '250px', background: colors.sideBarBg, borderRight: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '10px 20px', fontSize: '11px', fontWeight: 600, color: colors.sideBarHeader, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {activeActivity === 'explorer' ? 'Explorer' : activeActivity.toUpperCase()}
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {activeActivity === 'explorer' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 10px 4px 15px', cursor: 'pointer', fontWeight: 600, fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FolderOpen size={14} /> MY PROJECTS</div>
                  <div style={{ display: 'flex', gap: '6px' }}><Plus size={14} style={{ cursor: 'pointer' }} onClick={handleNewFile} /></div>
                </div>
                <div style={{ paddingTop: '6px' }}>
                  {projects.map(p => (
                    <div key={p.id} onClick={() => handleLoadProject(p)} style={{ padding: '4px 20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                      <Code2 size={14} color="#519aba" /> {p.title}
                    </div>
                  ))}
                  {projects.length === 0 && <div style={{ padding: '10px 20px', fontSize: '12px', color: '#666' }}>No projects. Create one!</div>}
                </div>
              </>
            )}
            {activeActivity !== 'explorer' && (
              <div style={{ padding: '20px', fontSize: '13px', color: 'var(--text-muted)' }}>
                View open in main editor area.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Editor Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        {/* Tabs Bar */}
        <div style={{ height: '35px', background: colors.tabInactiveBg, display: 'flex', overflowX: 'auto', flexShrink: 0 }}>
          {tabs.map(tab => (
            <div 
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              style={{ 
                background: activeTabId === tab.id ? colors.tabActiveBg : 'transparent',
                borderTop: activeTabId === tab.id ? `1px solid ${colors.tabBorderTop}` : '1px solid transparent',
                borderRight: `1px solid ${colors.border}`,
                padding: '0 15px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px',
                color: activeTabId === tab.id ? '#fff' : '#888',
                minWidth: '120px', cursor: 'pointer'
              }}
            >
              {tab.type === 'code' ? <Code2 size={14} color="#519aba" /> : <BookOpen size={14} color="#a78bfa" />}
              <span style={{ whiteSpace: 'nowrap' }}>{tab.title}</span>
              <div style={{ flex: 1 }} />
              <X size={14} style={{ opacity: activeTabId === tab.id ? 1 : 0.5 }} onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }} />
            </div>
          ))}
          <div style={{ flex: 1, borderBottom: `1px solid ${colors.border}` }} />
          
          {/* Editor Action Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 10px', gap: '10px', borderBottom: `1px solid ${colors.border}`, background: colors.editorBg }}>
            {activeTab?.type === 'code' && <Play size={16} color="#89d185" style={{ cursor: 'pointer' }} onClick={handleRunCode} title="Run Code" />}
            <ArrowRightSquare size={16} color="#ccc" style={{ cursor: 'pointer' }} onClick={toggleSecondarySideBar} title="Toggle AI Chat" />
            <PanelBottom size={16} color="#ccc" style={{ cursor: 'pointer' }} onClick={togglePanel} title="Toggle Bottom Panel" />
          </div>
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, position: 'relative', overflowY: 'auto' }}>
          {activeTab ? (
            activeTab.type === 'code' ? (
              <MonacoEditor
                code={activeTab.code}
                onChange={val => {
                  setTabs(prev => prev.map(t => t.id === activeTab.id ? { ...t, code: val } : t));
                }}
                language={activeTab.language}
                height="100%"
                fontSize={14}
                theme="vs-dark"
                options={{ minimap: { enabled: false } }}
              />
            ) : (
              // Render React Component Page
              <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg-dark)' }}>
                {activeTab.component === 'WelcomeScreen' && (
                  <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 300, marginBottom: '20px' }}>CodeAI</h1>
                    <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '40px' }}>Intelligent Learning and Coding Platform</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                      <div>
                        <h3 style={{ fontSize: '1rem', marginBottom: '15px', color: 'var(--text-primary)' }}>Start</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <span style={{ color: 'var(--brand-primary)', cursor: 'pointer' }} onClick={handleNewFile}>New File...</span>
                          <span style={{ color: 'var(--brand-primary)', cursor: 'pointer' }} onClick={() => handleOpenPage('courses', 'Courses', 'Courses')}>Continue Learning...</span>
                          <span style={{ color: 'var(--brand-primary)', cursor: 'pointer' }} onClick={() => handleOpenPage('projects', 'Projects', 'Projects')}>Open Project...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab.component !== 'WelcomeScreen' && ComponentMap[activeTab.component] && React.createElement(ComponentMap[activeTab.component])}
              </div>
            )
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666' }}>No active editor.</div>
          )}
        </div>

        {/* Bottom Panel */}
        {showPanel && (
          <div style={{ height: '250px', borderTop: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', background: colors.panelBg, flexShrink: 0 }}>
            <div style={{ display: 'flex', padding: '0 20px', borderBottom: `1px solid ${colors.border}` }}>
              {['TERMINAL', 'OUTPUT'].map(t => (
                <div key={t} onClick={() => setActivePanelTab(t.toLowerCase())} style={{ padding: '8px 10px', fontSize: '11px', cursor: 'pointer', color: activePanelTab === t.toLowerCase() ? '#e7e7e7' : '#888', borderBottom: activePanelTab === t.toLowerCase() ? `1px solid ${colors.tabBorderTop}` : '1px solid transparent' }}>
                  {t}
                </div>
              ))}
              <div style={{ flex: 1 }} />
              <div style={{ display: 'flex', alignItems: 'center' }}>
                 <X size={14} color="#888" style={{ cursor: 'pointer' }} onClick={() => setShowPanel(false)} />
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 20px', fontFamily: '"Consolas", monospace', fontSize: '13px' }}>
              {activePanelTab === 'terminal' && (
                <div>
                  {output.map((line, i) => <div key={i} style={{ color: line.type==='error'?'#f14c4c':line.type==='success'?'#89d185':line.type==='info'?'var(--brand-primary)':line.type==='muted'?'#666':'#ccc', whiteSpace: 'pre-wrap' }}>{line.text}</div>)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Secondary Sidebar (AI) */}
      {showSecondarySideBar && (
        <div style={{ width: '300px', background: colors.sideBarBg, borderLeft: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: colors.sideBarHeader }}>AI CHAT</div>
            <X size={14} style={{ cursor: 'pointer' }} onClick={() => setShowSecondarySideBar(false)} />
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            {aiMessages.map((msg, i) => (
              <div key={i} style={{ padding: '10px', borderRadius: '4px', background: msg.role === 'ai' ? 'var(--overlay-bg)' : 'var(--brand-glow)', border: msg.role === 'ai' ? `1px solid ${colors.border}` : '1px solid rgba(0,122,204,0.3)', color: msg.role === 'ai' ? 'var(--text-muted)' : '#fff' }}>
                <div style={{ fontWeight: 600, marginBottom: '6px', fontSize: '11px' }}>{msg.role === 'ai' ? 'CodeAI' : 'You'}</div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
              </div>
            ))}
            {isAiThinking && <div style={{ fontSize: '12px', color: '#666' }}>Thinking...</div>}
            <div ref={aiEndRef} />
          </div>
          <div style={{ padding: '10px', borderTop: `1px solid ${colors.border}` }}>
            <form onSubmit={handleSendAiMessage} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <textarea value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendAiMessage(); } }} placeholder="Ask CodeAI..." style={{ width: '100%', background: '#1e1e1e', border: `1px solid ${colors.border}`, color: 'var(--text-muted)', padding: '6px 8px', fontSize: '12px', resize: 'none', outline: 'none', height: '60px' }} />
              <button type="submit" style={{ background: colors.buttonPrimary, border: 'none', color: 'var(--text-primary)', padding: '4px 10px', borderRadius: '2px', cursor: 'pointer', fontSize: '11px' }}>Send</button>
            </form>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '22px', background: colors.statusBarBg, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 10px', fontSize: '12px', color: colors.statusBarFg, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}><Code2 size={12} /> main</div>
          {activeTab?.type === 'code' && (
             <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} onClick={() => setShowSaveDialog(true)}><Save size={12} /> Save</div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {activeTab?.type === 'code' && <div>Ln 1, Col 1</div>}
          {activeTab?.type === 'code' && (
             <select value={activeTab.language} onChange={e => setTabs(prev => prev.map(t => t.id === activeTab.id ? {...t, language: e.target.value} : t))} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer', appearance: 'none' }}>
               {LANGUAGES.map(l => <option key={l.id} value={l.id} style={{color: '#000'}}>{l.label}</option>)}
             </select>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Bell size={12} /></div>
        </div>
      </div>
    </div>
  );
};

export default Workspace;

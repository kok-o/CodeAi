import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, useLocation, Outlet, useOutlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen, Code2, Sparkles, X, Settings, Files, Plus,
  BarChart2, BookOpen, UserCircle, Bell, Terminal, GraduationCap,
  Sun, Moon, ArrowUp, Trash2, Search, MoreHorizontal, FilePlus, FolderPlus, RefreshCw,
  ChevronRight, ChevronDown, Folder, MessageSquare, History, Edit3
} from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { WorkspaceContext } from '../context/WorkspaceContext';
import { apiCall } from '../utils/api';
import { FileIcon } from './FileIcon';
import TerminalPanel from './TerminalPanel';
import useAiStream from '../hooks/useAiStream';
import ModelSelector from './ModelSelector';
import { marked } from 'marked';

// Configure marked to break on newlines like GitHub
marked.setOptions({ breaks: true });

const WorkspaceLayout = () => {
  const { user, logout, theme, setTheme, t } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    showSideBar, setShowSideBar,
    showSecondarySideBar, setShowSecondarySideBar,
    showPanel, setShowPanel,
    activePanelTab, setActivePanelTab,
    terminalOutput, isTerminalRunning,
    triggerAiChat, setTriggerAiChat,
    activeProjectFiles, setActiveProjectFiles,
    originalProjectFiles, setOriginalProjectFiles,
    activeProjectId, setActiveProjectId, activeFileId, setActiveFileId,
    stdin, setStdin
  } = useContext(WorkspaceContext);

  // Projects state for Explorer
  const [projects, setProjects] = useState([]);
  const [activeSidebarTab, setActiveSidebarTab] = useState('explorer');
  
  // Renaming state
  const [editingFileId, setEditingFileId] = useState(null);
  const [editingFilename, setEditingFilename] = useState('');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Context Menu state
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, fileId: null });

  // Explorer Header states
  const [explorerMenu, setExplorerMenu] = useState({ visible: false, x: 0, y: 0 });
  const [headerHovered, setHeaderHovered] = useState(false);
  const [openFolders, setOpenFolders] = useState({});
  const [dragHoverId, setDragHoverId] = useState(null);
  const [hoveredFileId, setHoveredFileId] = useState(null);

  // Resizing Panel Widths & Heights
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(260);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(340);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(260);

  const startResizeLeftSidebar = (mouseDownEvent) => {
    mouseDownEvent.preventDefault();
    const startWidth = leftSidebarWidth;
    const startX = mouseDownEvent.clientX;

    const doDrag = (mouseMoveEvent) => {
      const newWidth = Math.max(160, Math.min(500, startWidth + (mouseMoveEvent.clientX - startX)));
      setLeftSidebarWidth(newWidth);
    };

    const stopDrag = () => {
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
    };

    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
  };

  const startResizeRightSidebar = (mouseDownEvent) => {
    mouseDownEvent.preventDefault();
    const startWidth = rightSidebarWidth;
    const startX = mouseDownEvent.clientX;

    const doDrag = (mouseMoveEvent) => {
      const newWidth = Math.max(200, Math.min(600, startWidth - (mouseMoveEvent.clientX - startX)));
      setRightSidebarWidth(newWidth);
    };

    const stopDrag = () => {
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
    };

    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
  };

  const startResizeBottomPanel = (mouseDownEvent) => {
    mouseDownEvent.preventDefault();
    const startHeight = bottomPanelHeight;
    const startY = mouseDownEvent.clientY;

    const doDrag = (mouseMoveEvent) => {
      const newHeight = Math.max(120, Math.min(600, startHeight - (mouseMoveEvent.clientY - startY)));
      setBottomPanelHeight(newHeight);
    };

    const stopDrag = () => {
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
    };

    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
  };

  useEffect(() => {
    const closeContextMenu = () => {
      setContextMenu(prev => prev.visible ? { ...prev, visible: false } : prev);
      setExplorerMenu(prev => prev.visible ? { ...prev, visible: false } : prev);
    };
    window.addEventListener('click', closeContextMenu);
    return () => window.removeEventListener('click', closeContextMenu);
  }, []);

  // AI Chat State
  const [aiMessages, setAiMessages] = useState([
    { role: 'ai', content: 'Привет! Я твой ИИ-ассистент CodeAI. Чем могу помочь?' }
  ]);
  const [chatHistoryList, setChatHistoryList] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [showChatHistory, setShowChatHistory] = useState(false);

  const [aiInput, setAiInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [selectedModel, setSelectedModel] = useState('auto');
  const [aiModels, setAiModels] = useState([{ id: 'auto', name: 'Авто' }]);
  const { streamChat, isStreaming } = useAiStream();
  const aiEndRef = useRef(null);

  // Account Menus
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  const loadProjects = async () => {
    try {
      const data = await apiCall('/projects');
      setProjects(data.filter(p => p.type === 'ide'));
    } catch (e) { }
  };

  useEffect(() => {
    loadProjects();
    apiCall('/ai/models').then(data => { if (data.models) setAiModels(data.models); }).catch(() => { });
    apiCall('/ai/chats').then(data => { if(Array.isArray(data)) setChatHistoryList(data); }).catch(()=>{});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (triggerAiChat) {
      if (triggerAiChat.autoSubmit) {
        submitToAi(triggerAiChat.content);
      } else {
        setAiMessages(prev => [...prev, triggerAiChat]);
      }
      setShowSecondarySideBar(true);
      setTriggerAiChat(null);
    }
  }, [triggerAiChat, setShowSecondarySideBar]);

  useEffect(() => {
    aiEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, isAiThinking]);

  const submitToAi = async (text) => {
    if (!text || isStreaming) return;
    setAiMessages(prev => [...prev, { role: 'user', content: text }]);
    setAiMessages(prev => [...prev, { role: 'ai', content: '', streaming: true }]);
    setIsAiThinking(true);

    let currentChatId = activeChatId;
    if (!currentChatId) {
       try {
         const newChat = await apiCall('/ai/chats', { method: 'POST' });
         currentChatId = newChat.id;
         setActiveChatId(currentChatId);
         setChatHistoryList(prev => [newChat, ...prev]);
       } catch(err){}
    }

    if (currentChatId) {
      apiCall(`/ai/chats/${currentChatId}/messages`, {
        method: 'POST', body: JSON.stringify({ role: 'user', content: text })
      }).catch(()=>{});
    }

    await streamChat([{ role: 'user', content: text }], {
      model: selectedModel,
      onToken: (_, fullText) => {
        setAiMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: 'ai', content: fullText, streaming: true }; return u; });
        setIsAiThinking(false);
      },
      onDone: (fullText) => {
        setAiMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: 'ai', content: fullText }; return u; });
        if (currentChatId) {
          apiCall(`/ai/chats/${currentChatId}/messages`, {
            method: 'POST', body: JSON.stringify({ role: 'ai', content: fullText })
          }).catch(()=>{});
          if (aiMessages.length === 1 || (aiMessages.length === 2 && aiMessages[0].role === 'ai')) {
             apiCall('/ai/chats').then(data => setChatHistoryList(data)).catch(()=>{});
          }
        }
      },
      onError: (err) => {
        setAiMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: 'ai', content: `❌ Error: ${err}` }; return u; });
      }
    });
  };

  const handleSendAiMessage = async (e) => {
    e?.preventDefault();
    const text = aiInput.trim();
    if (text) {
      setAiInput('');
      submitToAi(text);
    }
  };

  const loadChat = async (chatId) => {
    setActiveChatId(chatId);
    setShowChatHistory(false);
    try {
      const messages = await apiCall(`/ai/chats/${chatId}/messages`);
      if (messages && messages.length > 0) {
        setAiMessages(messages.map(m => ({ role: m.role, content: m.content })));
      } else {
        setAiMessages([{ role: 'ai', content: 'Привет! Я твой ИИ-ассистент CodeAI. Чем могу помочь?' }]);
      }
    } catch(err) {}
  };

  const startNewChat = () => {
    setActiveChatId(null);
    setAiMessages([{ role: 'ai', content: 'Привет! Я твой ИИ-ассистент CodeAI. Чем могу помочь?' }]);
    setShowChatHistory(false);
  };

  const handleDeleteChat = async (chatId, e) => {
    e.stopPropagation();
    if (!window.confirm("Удалить этот чат?")) return;
    try {
      await apiCall(`/ai/chats/${chatId}`, { method: 'DELETE' });
      setChatHistoryList(prev => prev.filter(c => c.id !== chatId));
      if (activeChatId === chatId) {
        startNewChat();
      }
    } catch(err){}
  };

  const handleEditChatTitle = async (chatId, currentTitle, e) => {
    e.stopPropagation();
    const newTitle = window.prompt("Введите новое название для чата:", currentTitle);
    if (!newTitle || newTitle.trim() === "" || newTitle === currentTitle) return;
    
    try {
      const updatedChat = await apiCall(`/ai/chats/${chatId}`, {
        method: 'PUT',
        body: JSON.stringify({ title: newTitle.trim() })
      });
      setChatHistoryList(prev => prev.map(c => c.id === chatId ? { ...c, title: updatedChat.title } : c));
    } catch(err) {
      alert("Не удалось переименовать чат");
    }
  };

  const colors = {
    activityBarBg: 'var(--bg-activity-bar)',
    activityBarFg: 'var(--brand-primary)',
    activityBarInactive: 'var(--text-muted)',
    sideBarBg: 'var(--bg-sidebar)',
    sideBarHeader: 'var(--text-muted)',
    editorBg: 'var(--bg-editor)',
    panelBg: 'var(--bg-sidebar)',
    panelBorder: 'var(--border-subtle)',
    statusBarBg: 'var(--status-bar-bg)',
    statusBarFg: '#ffffff',
    textMain: 'var(--text-primary)',
    border: 'var(--border-subtle)',
    buttonPrimary: 'var(--brand-primary)'
  };

  const isActive = (path) => location.pathname.startsWith(path);

  // Determine what to show in the Left Sidebar
  const isIde = isActive('/ide');
  const showLeftSidebar = showSideBar && isIde; // Currently only IDE uses the left sidebar (Explorer)
  const outlet = useOutlet();

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  const navItems = [
    { id: 'ide', path: '/ide', icon: <Files size={24} strokeWidth={1.5} />, title: "Explorer (IDE)", showSidebar: true, sidebarTab: 'explorer' },
    { id: 'search', path: '/ide', icon: <Search size={24} strokeWidth={1.5} />, title: "Search", showSidebar: true, sidebarTab: 'search' },
    { id: 'courses', path: '/courses', icon: <BookOpen size={24} strokeWidth={1.5} />, title: "Courses", matchLesson: true },
    { id: 'challenges', path: '/challenges', icon: <Terminal size={24} strokeWidth={1.5} />, title: "Challenges" },
    ...(user?.role !== 'teacher' ? [{ id: 'dashboard', path: '/dashboard', icon: <BarChart2 size={24} strokeWidth={1.5} />, title: "Dashboard" }] : [])
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', background: colors.editorBg, color: colors.textMain, overflow: 'hidden' }}>

      {/* Main Content Area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Activity Bar */}
        <div style={{ width: '54px', background: colors.activityBarBg, borderRight: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', zIndex: 10, flexShrink: 0 }}>
          {navItems.map(item => {
            const isPathActive = isActive(item.path) || (item.matchLesson && isActive('/lesson'));
            const isItemActive = isPathActive && (!item.sidebarTab || activeSidebarTab === item.sidebarTab);
            return (
              <motion.div
                key={item.id}
                whileHover={{ scale: 1.1, color: isItemActive ? colors.activityBarFg : 'var(--text-primary)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { 
                  const queryProject = new URLSearchParams(location.search).get('project') || activeProjectId;
                  if (isItemActive) {
                    if (item.showSidebar) {
                      setShowSideBar(prev => !prev);
                    }
                  } else {
                    if (item.path === '/ide' && queryProject) {
                      navigate(`/ide?project=${queryProject}`);
                    } else {
                      navigate(item.path);
                    }
                    if (item.showSidebar) {
                      setShowSideBar(true);
                    } else {
                      setShowSideBar(false);
                    }
                  }
                  if (item.sidebarTab) setActiveSidebarTab(item.sidebarTab);
                }}
                style={{ width: '54px', height: '54px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', borderLeft: isItemActive ? `3px solid ${colors.activityBarFg}` : '3px solid transparent', color: isItemActive ? colors.activityBarFg : colors.activityBarInactive, marginBottom: '8px', transition: 'color 0.2s, border-color 0.2s' }}
                title={item.title}
              >
                {item.icon}
              </motion.div>
            );
          })}

          {user?.role === 'teacher' && (
            <motion.div
              whileHover={{ scale: 1.1, color: 'var(--text-primary)' }}
              onClick={() => navigate('/teacher/courses')}
              style={{ width: '54px', height: '54px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', borderLeft: isActive('/teacher') ? `3px solid ${colors.activityBarFg}` : '3px solid transparent', color: isActive('/teacher') ? colors.activityBarFg : colors.activityBarInactive, marginBottom: '8px' }}
              title="Teacher Studio"
            >
              <GraduationCap size={24} strokeWidth={1.5} />
            </motion.div>
          )}

          <div style={{ flex: 1 }} />

          {/* Bottom Icons */}

          <div style={{ position: 'relative' }}>
            <motion.div
              whileHover={{ scale: 1.1 }}
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              style={{ width: '54px', height: '48px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', color: colors.activityBarInactive }}
            >
              {user?.avatar_url ? (
                <img src={user.avatar_url.startsWith('http') ? user.avatar_url : `${import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:5000'}${user.avatar_url}`} alt="Avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${colors.activityBarFg}` }} />
              ) : (
                <UserCircle size={26} strokeWidth={1.5} />
              )}
            </motion.div>
            {showAccountMenu && (
              <div className="glass" style={{ position: 'absolute', bottom: '10px', left: '60px', padding: '6px', width: '200px', zIndex: 100 }}>
                <div className="btn-outline" style={{ padding: '10px 14px', fontSize: '13px', cursor: 'pointer', display: 'block', width: '100%', border: 'none', textAlign: 'left', borderRadius: '8px' }} onClick={() => { navigate('/profile'); setShowAccountMenu(false); }}>{t('profileMenuProfile') || 'Profile'}</div>
                <div className="btn-outline" style={{ padding: '10px 14px', fontSize: '13px', cursor: 'pointer', display: 'block', width: '100%', border: 'none', textAlign: 'left', borderRadius: '8px' }} onClick={() => { navigate('/projects'); setShowAccountMenu(false); }}>{t('myProjects') || 'My Projects'}</div>
                {user?.role === 'admin' && (
                  <div className="btn-outline" style={{ padding: '10px 14px', fontSize: '13px', cursor: 'pointer', display: 'block', width: '100%', border: 'none', textAlign: 'left', borderRadius: '8px', color: 'var(--brand-primary)' }} onClick={() => { navigate('/admin'); setShowAccountMenu(false); }}>{t('profileMenuAdmin') || 'Admin Panel'}</div>
                )}
                <div className="btn-outline" style={{ padding: '10px 14px', fontSize: '13px', cursor: 'pointer', display: 'block', width: '100%', border: 'none', textAlign: 'left', borderRadius: '8px', color: 'var(--danger)' }} onClick={logout}>{t('profileMenuLogout') || 'Sign Out'}</div>
              </div>
            )}
          </div>
          <div style={{ position: 'relative', marginTop: '4px' }}>
            <motion.div
              whileHover={{ scale: 1.1, color: 'var(--text-primary)' }}
              onClick={() => navigate('/settings')}
              style={{ width: '54px', height: '48px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', color: isActive('/settings') ? colors.activityBarFg : colors.activityBarInactive }}
              title="Settings"
            >
              <Settings size={24} strokeWidth={1.5} />
            </motion.div>
          </div>
        </div>

        {/* Side Bar (Left Panel) */}
        <AnimatePresence>
          {showLeftSidebar && (
            <>
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: leftSidebarWidth, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                style={{ background: colors.sideBarBg, borderRight: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}
              >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', fontSize: '11px', fontWeight: 700, color: colors.sideBarHeader, textTransform: 'uppercase', letterSpacing: '1px' }}>
                <span>{activeSidebarTab === 'explorer' ? (t('explorer') || "EXPLORER") : (t('searchTab') || 'SEARCH')}</span>
                {activeSidebarTab === 'explorer' && (
                  <div style={{ position: 'relative' }}>
                    <MoreHorizontal 
                      size={14} 
                      style={{ cursor: 'pointer', color: 'var(--text-muted)' }} 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        const rect = e.currentTarget.getBoundingClientRect();
                        // Position exactly below the 3 dots, aligning the left edge of the menu with the 3 dots
                        setExplorerMenu({ visible: !explorerMenu.visible, x: rect.left, y: rect.bottom + 4 }); 
                      }} 
                    />
                  </div>
                )}
              </div>

              {/* Sidebar Content Switcher */}
              {activeSidebarTab === 'explorer' && (
                <>
                  {/* If no active project, show "NO FOLDER OPENED" */}
                  {!new URLSearchParams(location.search).get('project') ? (
                <div style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: colors.textMain, textTransform: 'uppercase' }}>
                    {t('noFolderOpened') || "NO FOLDER OPENED"}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {t('noFolderOpenedDesc') || "You have not yet opened a folder."}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      onClick={() => navigate('/projects')}
                      style={{ background: 'var(--brand-primary)', border: 'none', borderRadius: '4px', color: 'var(--text-primary)', padding: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
                    >
                      {t('openProject') || "Open Project"}
                    </button>
                    <button
                      onClick={() => navigate('/projects')}
                      style={{ background: 'transparent', border: `1px solid ${colors.border}`, borderRadius: '4px', color: colors.textMain, padding: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
                    >
                      {t('createProject') || "Create Project"}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  <div 
                    onMouseEnter={() => setHeaderHovered(true)}
                    onMouseLeave={() => setHeaderHovered(false)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px 8px 15px', fontWeight: 700, fontSize: '12px', color: colors.textMain, textTransform: 'uppercase' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FolderOpen size={16} color="var(--brand-primary)" /> {projects.find(p => p.id.toString() === activeProjectId?.toString())?.title || 'WORKSPACE'}</div>
                    <div style={{ display: 'flex', gap: '6px', opacity: headerHovered ? 1 : 0, transition: 'opacity 0.2s' }}>
                      <FilePlus size={14} color="var(--text-muted)" style={{ cursor: 'pointer' }} title="New File" onClick={() => {
                        const name = prompt('File name:', 'new_file.js');
                        if (name) {
                          const activeItem = activeProjectFiles.find(f => f.id === activeFileId);
                          const targetParentId = activeItem ? (activeItem.type === 'folder' ? activeItem.id : activeItem.parentId) : null;
                          const newFile = { id: Date.now().toString(), name, type: 'file', parentId: targetParentId, language: name.split('.').pop() || 'plaintext', content: '' };
                          setActiveProjectFiles(prev => [...prev, newFile]);
                          setActiveFileId(newFile.id);
                          if (targetParentId) setOpenFolders(prev => ({ ...prev, [targetParentId]: true }));
                        }
                      }} />
                      <FolderPlus size={14} color="var(--text-muted)" style={{ cursor: 'pointer' }} title="New Folder" onClick={() => {
                        const name = prompt('Folder name:', 'new_folder');
                        if (name) {
                          const activeItem = activeProjectFiles.find(f => f.id === activeFileId);
                          const targetParentId = activeItem ? (activeItem.type === 'folder' ? activeItem.id : activeItem.parentId) : null;
                          const newFolder = { id: Date.now().toString(), name, type: 'folder', parentId: targetParentId };
                          setActiveProjectFiles(prev => [...prev, newFolder]);
                          if (targetParentId) setOpenFolders(prev => ({ ...prev, [targetParentId]: true }));
                        }
                      }} />
                    </div>
                  </div>
                  <div style={{ paddingTop: '6px' }}>
                    {(() => {
                      const renderFileTree = (parentId, level) => {
                        const items = activeProjectFiles.filter(f => (f.parentId || null) === parentId);
                        // Sort: folders first, then alphabetically
                        items.sort((a, b) => {
                          const aIsFolder = a.type === 'folder';
                          const bIsFolder = b.type === 'folder';
                          if (aIsFolder !== bIsFolder) {
                            return aIsFolder ? -1 : 1;
                          }
                          return (a.name || a.title || '').localeCompare(b.name || b.title || '');
                        });

                        return items.map(file => {
                          const isFolder = file.type === 'folder';
                          const isOpen = openFolders[file.id];
                          const isEditing = editingFileId === file.id;
                          const isActive = activeFileId === file.id;

                          return (
                            <React.Fragment key={file.id}>
                              <motion.div
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('text/plain', file.id);
                                }}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  if (isFolder && dragHoverId !== file.id) setDragHoverId(file.id);
                                }}
                                onDragLeave={() => {
                                  if (isFolder && dragHoverId === file.id) setDragHoverId(null);
                                }}
                                onMouseEnter={() => setHoveredFileId(file.id)}
                                onMouseLeave={() => setHoveredFileId(null)}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  setDragHoverId(null);
                                  const draggedId = e.dataTransfer.getData('text/plain');
                                  if (draggedId !== file.id) {
                                    // Drop onto a folder puts it inside. Drop onto a file puts it next to the file (same parent)
                                    const targetParentId = isFolder ? file.id : file.parentId;
                                    
                                    // Prevent circular dependency (dragging a folder into itself or its child)
                                    let currentParent = targetParentId;
                                    let isCircular = false;
                                    while (currentParent) {
                                      if (currentParent === draggedId) { isCircular = true; break; }
                                      const p = activeProjectFiles.find(f => f.id === currentParent);
                                      currentParent = p ? p.parentId : null;
                                    }
                                    
                                    if (!isCircular) {
                                      setActiveProjectFiles(prev => prev.map(f => f.id === draggedId ? { ...f, parentId: targetParentId } : f));
                                      if (isFolder) setOpenFolders(prev => ({ ...prev, [file.id]: true }));
                                    }
                                  }
                                }}
                                whileHover={{ backgroundColor: 'var(--bg-card-hover)', color: 'var(--brand-primary)' }}
                                onClick={() => {
                                  if (isFolder) {
                                    setOpenFolders(prev => ({ ...prev, [file.id]: !isOpen }));
                                  } else {
                                    setActiveFileId(file.id);
                                  }
                                }}
                                onDoubleClick={() => {
                                  setEditingFileId(file.id);
                                  setEditingFilename(file.name || file.title);
                                }}
                                onContextMenu={(e) => {
                                  e.preventDefault();
                                  setContextMenu({ visible: true, x: e.clientX, y: e.clientY, fileId: file.id });
                                }}
                                style={{ 
                                  padding: '4px 20px', 
                                  paddingLeft: `${20 + level * 16}px`,
                                  fontSize: '13px', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '6px', 
                                  cursor: 'pointer', 
                                  color: isActive ? 'var(--text-primary)' : 'var(--text-muted)', 
                                  borderLeft: isActive ? '2px solid var(--brand-primary)' : '2px solid transparent', 
                                  background: (isActive || dragHoverId === file.id) ? 'var(--overlay-bg)' : 'transparent' 
                                }}
                              >
                                {isFolder ? (
                                  isOpen ? <ChevronDown size={14} color="var(--text-muted)" /> : <ChevronRight size={14} color="var(--text-muted)" />
                                ) : null}
                                {isFolder ? (
                                  <Folder size={14} color={isOpen ? "var(--brand-primary)" : "var(--text-muted)"} fill={isOpen ? "var(--brand-primary)" : "transparent"} />
                                ) : (
                                  <FileIcon filename={file.name || file.title} size={14} /> 
                                )}
                                
                                {isEditing ? (
                                  <input 
                                    autoFocus
                                    value={editingFilename}
                                    onChange={(e) => setEditingFilename(e.target.value)}
                                    onBlur={() => {
                                      if (editingFilename.trim()) {
                                        setActiveProjectFiles(prev => prev.map(f => f.id === file.id ? { ...f, name: editingFilename.trim(), title: editingFilename.trim() } : f));
                                      }
                                      setEditingFileId(null);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        if (editingFilename.trim()) {
                                          setActiveProjectFiles(prev => prev.map(f => f.id === file.id ? { ...f, name: editingFilename.trim(), title: editingFilename.trim() } : f));
                                        }
                                        setEditingFileId(null);
                                      } else if (e.key === 'Escape') {
                                        setEditingFileId(null);
                                      }
                                    }}
                                    style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--brand-primary)', color: 'var(--text-primary)', fontSize: '13px', padding: '2px 4px', outline: 'none' }}
                                  />
                                ) : (
                                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {file.name || file.title}
                                  </span>
                                )}
                                
                                {isFolder && hoveredFileId === file.id && (
                                  <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }} onClick={(e) => e.stopPropagation()}>
                                    <FilePlus size={13} color="var(--text-muted)" style={{ cursor: 'pointer' }} title="New File" onClick={(e) => {
                                      e.stopPropagation();
                                      const name = prompt('File name:', 'new_file.js');
                                      if (name) {
                                        const newFile = { id: Date.now().toString(), name, type: 'file', parentId: file.id, language: name.split('.').pop() || 'plaintext', content: '' };
                                        setActiveProjectFiles(prev => [...prev, newFile]);
                                        setActiveFileId(newFile.id);
                                        setOpenFolders(prev => ({ ...prev, [file.id]: true }));
                                      }
                                    }} />
                                    <FolderPlus size={13} color="var(--text-muted)" style={{ cursor: 'pointer' }} title="New Folder" onClick={(e) => {
                                      e.stopPropagation();
                                      const name = prompt('Folder name:', 'new_folder');
                                      if (name) {
                                        const newFolder = { id: Date.now().toString(), name, type: 'folder', parentId: file.id };
                                        setActiveProjectFiles(prev => [...prev, newFolder]);
                                        setOpenFolders(prev => ({ ...prev, [file.id]: true }));
                                      }
                                    }} />
                                    <MoreHorizontal size={13} color="var(--text-muted)" style={{ cursor: 'pointer' }} title="More Options" onClick={(e) => {
                                      e.stopPropagation();
                                      setContextMenu({ visible: true, x: e.clientX, y: e.clientY, fileId: file.id });
                                    }} />
                                  </div>
                                )}
                                {(() => {
                                  const original = originalProjectFiles?.find(f => f.id === file.id);
                                  let status = null;
                                  if (!original) {
                                    status = 'U';
                                  } else {
                                    const origContent = original.content ?? original.code ?? '';
                                    const fileContent = file.content ?? file.code ?? '';
                                    const origName = original.name || original.title;
                                    const fileName = file.name || file.title;
                                    if (isFolder) {
                                      if (origName !== fileName) status = 'M';
                                    } else {
                                      if (origContent !== fileContent || origName !== fileName) status = 'M';
                                    }
                                  }
                                  
                                  if (status) {
                                    return (
                                      <div style={{ fontSize: '10px', fontWeight: 700, color: status === 'U' ? '#4CAF50' : '#FF9800', marginRight: '4px' }}>
                                        {status}
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </motion.div>
                              {isFolder && isOpen && renderFileTree(file.id, level + 1)}
                            </React.Fragment>
                          );
                        });
                      };
                      return renderFileTree(null, 0);
                    })()}
                    {activeProjectFiles.length === 0 && <div style={{ padding: '12px 20px', fontSize: '13px', color: 'var(--text-muted)' }}>{t('noFilesFound') || "No files found."}</div>}
                  </div>
                </div>
              )}
              </>
              )}

              {activeSidebarTab === 'search' && (
                <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <input
                    type="text"
                    placeholder={t('searchFiles') || "Search..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', outline: 'none', borderRadius: '4px' }}
                  />
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    {searchQuery && activeProjectFiles.map(file => {
                      const lines = (file.content || file.code || '').split('\n');
                      const matches = lines.map((line, idx) => ({ line, idx: idx + 1 })).filter(l => l.line.toLowerCase().includes(searchQuery.toLowerCase()));
                      if (matches.length === 0 && !file.name?.toLowerCase().includes(searchQuery.toLowerCase())) return null;
                      return (
                        <div key={file.id} style={{ marginBottom: '12px' }}>
                          <div 
                            onClick={() => setActiveFileId(file.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer', marginBottom: '4px' }}
                          >
                            <FileIcon filename={file.name || file.title} size={14} /> {file.name || file.title}
                          </div>
                          {matches.slice(0, 5).map(m => (
                            <div 
                              key={m.idx} 
                              onClick={() => setActiveFileId(file.id)}
                              style={{ paddingLeft: '20px', fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                              title={m.line.trim()}
                            >
                              <span style={{ color: 'var(--brand-primary)', marginRight: '8px' }}>{m.idx}</span> {m.line.trim()}
                            </div>
                          ))}
                          {matches.length > 5 && <div style={{ paddingLeft: '20px', fontSize: '11px', color: 'var(--text-muted)' }}>+ {matches.length - 5} {t('more') || 'more'}</div>}
                        </div>
                      );
                    })}
                    {searchQuery && activeProjectFiles.length > 0 && activeProjectFiles.every(f => !(f.content || f.code || '').toLowerCase().includes(searchQuery.toLowerCase()) && !f.name?.toLowerCase().includes(searchQuery.toLowerCase())) && (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('noResultsFound') || "No results found."}</div>
                    )}
                    {!searchQuery && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('typeToSearch') || "Type to search across all files."}</div>}
                  </div>
                </div>
              )}
              </motion.div>
              {/* Left Sidebar Resize Handle */}
              <div 
                onMouseDown={startResizeLeftSidebar}
                style={{ 
                  width: '4px', 
                  cursor: 'col-resize', 
                  background: 'transparent', 
                  transition: 'background 0.2s', 
                  zIndex: 20, 
                  alignSelf: 'stretch',
                  marginLeft: '-2px',
                  marginRight: '-2px'
                }}
                onMouseEnter={(e) => e.target.style.background = 'var(--brand-primary)'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              />
            </>
          )}
        </AnimatePresence>

        {/* Main Editor Area (React Router Outlet) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* The current Route will be rendered here */}
          <div className="animate-in" style={{ flex: 1, position: 'relative', overflowY: 'auto', background: 'transparent', display: 'flex', flexDirection: 'column' }}>
            <AnimatePresence mode="wait">
              {outlet && React.cloneElement(outlet, { key: location.pathname })}
            </AnimatePresence>
          </div>

          {/* Bottom Panel */}
          <AnimatePresence>
            {showPanel && isIde && (
              <>
                {/* Bottom Panel Resize Handle */}
                <div 
                  onMouseDown={startResizeBottomPanel}
                  style={{ 
                    height: '4px', 
                    cursor: 'row-resize', 
                    background: 'transparent', 
                    transition: 'background 0.2s', 
                    zIndex: 20, 
                    width: '100%',
                    marginTop: '-2px',
                    marginBottom: '-2px'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'var(--brand-primary)'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                />
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: bottomPanelHeight, opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ borderTop: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', background: colors.panelBg, flexShrink: 0, overflow: 'hidden' }}
                >
                <div style={{ display: 'flex', padding: '0 20px', borderBottom: `1px solid ${colors.border}` }}>
                  {[{ id: 'terminal', label: t('terminal') || 'TERMINAL' }].map(tab => (
                    <div key={tab.id} onClick={() => setActivePanelTab(tab.id)} style={{ padding: '12px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: activePanelTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)', borderBottom: activePanelTab === tab.id ? `2px solid var(--brand-primary)` : '2px solid transparent', transition: 'all 0.2s' }}>
                      {tab.label}
                    </div>
                  ))}
                  <div style={{ flex: 1 }} />
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <X size={16} color="var(--text-muted)" style={{ cursor: 'pointer' }} onClick={() => setShowPanel(false)} />
                  </div>
                </div>
                <div className="font-mono" style={{ flex: 1, overflow: 'hidden', padding: activePanelTab === 'terminal' ? '0' : '0 12px 12px 12px', fontSize: '14px', background: activePanelTab === 'terminal' ? (theme === 'light' ? '#ffffff' : '#000000') : 'transparent' }}>
                  {activePanelTab === 'terminal' && (
                    <div style={{ width: '100%', height: '100%', padding: '0 12px 12px 12px' }}>
                      <TerminalPanel activeProjectId={activeProjectId} activeProjectFiles={activeProjectFiles} theme={theme} />
                    </div>
                  )}
                </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Secondary Sidebar (AI) */}
        <AnimatePresence>
          {showSecondarySideBar && (
            <>
              {/* Right Sidebar Resize Handle */}
              <div 
                onMouseDown={startResizeRightSidebar}
                style={{ 
                  width: '4px', 
                  cursor: 'col-resize', 
                  background: 'transparent', 
                  transition: 'background 0.2s', 
                  zIndex: 20, 
                  alignSelf: 'stretch',
                  marginLeft: '-2px',
                  marginRight: '-2px'
                }}
                onMouseEnter={(e) => e.target.style.background = 'var(--brand-primary)'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              />
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: rightSidebarWidth, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                style={{ background: colors.sideBarBg, borderLeft: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}
              >
              <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${colors.border}`, position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img
                    src="/logo.png"
                    alt="CodeAI Logo"
                    style={{ width: '20px', height: '20px', objectFit: 'contain' }}
                  />
                  <span className="heading" style={{ fontSize: '1rem', fontWeight: '800', letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>
                    Code<span style={{ color: 'var(--primary)' }}>AI</span>
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <History size={16} style={{ cursor: 'pointer', color: showChatHistory ? 'var(--brand-primary)' : 'var(--text-muted)' }} onClick={() => setShowChatHistory(!showChatHistory)} title="История чатов" />
                  <Plus size={16} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={startNewChat} title="Новый чат" />
                  <X size={16} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowSecondarySideBar(false)} />
                </div>
                
                {/* Chat History Dropdown */}
                {showChatHistory && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-card)', borderBottom: `1px solid ${colors.border}`, maxHeight: '300px', overflowY: 'auto', zIndex: 50, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                    {chatHistoryList.length === 0 ? (
                      <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>Нет сохраненных чатов</div>
                    ) : (
                      chatHistoryList.map(chat => (
                        <div key={chat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: `1px solid ${colors.border}`, cursor: 'pointer', background: activeChatId === chat.id ? 'var(--bg-card-hover)' : 'transparent' }} onClick={() => loadChat(chat.id)} onMouseEnter={(e) => { if (activeChatId !== chat.id) e.currentTarget.style.background = 'var(--bg-card-hover)' }} onMouseLeave={(e) => { if (activeChatId !== chat.id) e.currentTarget.style.background = 'transparent' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                            <MessageSquare size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                            <div style={{ fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{chat.title || 'Новый диалог'}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Edit3 size={13} color="var(--text-muted)" style={{ cursor: 'pointer', opacity: 0.6 }} onClick={(e) => handleEditChatTitle(chat.id, chat.title || 'Новый диалог', e)} onMouseEnter={(e) => e.currentTarget.style.opacity = 1} onMouseLeave={(e) => e.currentTarget.style.opacity = 0.6} title="Переименовать" />
                            <Trash2 size={13} color="var(--danger)" style={{ cursor: 'pointer', opacity: 0.6 }} onClick={(e) => handleDeleteChat(chat.id, e)} onMouseEnter={(e) => e.currentTarget.style.opacity = 1} onMouseLeave={(e) => e.currentTarget.style.opacity = 0.6} title="Удалить" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px', lineHeight: 1.5 }}>
                {aiMessages.map((msg, i) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={i}
                    className={msg.role === 'ai' ? 'glass markdown-body' : 'markdown-body'}
                    style={{ 
                      padding: '12px 16px', 
                      borderRadius: '12px', 
                      background: msg.role === 'ai' ? 'var(--bg-card)' : 'var(--brand-primary)', 
                      border: msg.role === 'ai' ? `1px solid ${colors.border}` : 'none', 
                      color: msg.role === 'ai' ? 'var(--text-primary)' : '#fff', 
                      alignSelf: msg.role === 'ai' ? 'flex-start' : 'flex-end', 
                      maxWidth: '90%', 
                      borderBottomLeftRadius: msg.role === 'ai' ? '4px' : '12px', 
                      borderBottomRightRadius: msg.role !== 'ai' ? '4px' : '12px',
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}
                    dangerouslySetInnerHTML={{ __html: marked.parse(msg.content || '') }}
                  />
                ))}
                {isAiThinking && (
                  <div style={{ alignSelf: 'flex-start', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-card)', border: `1px solid ${colors.border}`, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--brand-primary)', animation: 'float 1s infinite alternate' }} />
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--brand-secondary)', animation: 'float 1s infinite alternate 0.3s' }} />
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--brand-accent)', animation: 'float 1s infinite alternate 0.6s' }} />
                  </div>
                )}
                <div ref={aiEndRef} />
              </div>
              <div style={{ padding: '16px', background: 'var(--bg-sidebar)' }}>
                <form onSubmit={handleSendAiMessage} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'var(--bg-card)',
                  border: `1px solid var(--border-subtle)`,
                  borderRadius: '16px',
                  padding: '8px',
                  boxShadow: 'var(--glass-shadow)'
                }}>
                  <textarea
                    value={aiInput}
                    onChange={e => setAiInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendAiMessage(); } }}
                    placeholder={t('askCodeAi') || "Ask CodeAI..."}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      padding: '8px',
                      fontSize: '13px',
                      resize: 'none',
                      outline: 'none',
                      height: '60px',
                      fontFamily: 'inherit'
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <ModelSelector value={selectedModel} onChange={setSelectedModel} models={aiModels} compact={true} ghost={true} upward={true} />
                    <button
                      type="submit"
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: aiInput.trim() ? 'rgba(167, 139, 250, 0.15)' : 'var(--bg-activity-bar)',
                        color: aiInput.trim() ? '#c4b5fd' : 'var(--text-muted)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        border: `1px solid ${aiInput.trim() ? 'transparent' : 'var(--border-subtle)'}`,
                        cursor: aiInput.trim() ? 'pointer' : 'default',
                        transition: 'all 0.2s',
                      }}
                      disabled={!aiInput.trim()}
                    >
                      <ArrowUp size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      </div>

      {/* Status Bar */}
      <div style={{ height: '28px', background: colors.statusBarBg, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', fontSize: '12px', color: colors.statusBarFg, zIndex: 100, fontWeight: 500, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 700, color: 'white' }} onClick={() => navigate('/')}><Code2 size={14} /> CodeAI</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }} onClick={() => setShowSecondarySideBar(!showSecondarySideBar)} title={showSecondarySideBar ? t('hideAi') || 'Hide AI' : t('showAi') || 'Show AI'}><img src="/logo.png" alt="Logo" style={{ width: '18px', height: '18px', objectFit: 'contain' }} /> {showSecondarySideBar ? t('hideAi') || 'Hide AI' : t('showAi') || 'Show AI'}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }} onClick={toggleTheme}>{theme === 'light' ? <Sun size={14} /> : <Moon size={14} />} {t('themeBtn') || 'Theme'}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Bell size={14} /></div>
        </div>
      </div>
      
      {/* Context Menu Overlay */}
      {contextMenu.visible && (() => {
        const contextItem = activeProjectFiles.find(f => f.id === contextMenu.fileId);
        const isFolder = contextItem && contextItem.type === 'folder';

        return (
          <div 
            style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, background: colors.panelBg, border: `1px solid ${colors.border}`, borderRadius: '4px', padding: '4px 0', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.5)', minWidth: '150px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {isFolder && (
              <>
                <div 
                  style={{ padding: '8px 16px', fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.target.style.background = 'var(--bg-card-hover)'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                  onClick={() => {
                    const name = prompt(t('newFile') || 'File name:', 'new_file.js');
                    if (name) {
                      const newFile = { 
                        id: Date.now().toString(), 
                        name, 
                        type: 'file', 
                        parentId: contextMenu.fileId,
                        language: name.split('.').pop() || 'plaintext', 
                        content: '' 
                      };
                      setActiveProjectFiles(prev => [...prev, newFile]);
                      setActiveFileId(newFile.id);
                      setOpenFolders(prev => ({ ...prev, [contextMenu.fileId]: true }));
                    }
                    setContextMenu({ visible: false, x: 0, y: 0, fileId: null });
                  }}
                >
                  {t('newFile') || 'New File'}
                </div>
                <div 
                  style={{ padding: '8px 16px', fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.target.style.background = 'var(--bg-card-hover)'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                  onClick={() => {
                    const name = prompt(t('newFolder') || 'Folder name:', 'new_folder');
                    if (name) {
                      const newFolder = { 
                        id: Date.now().toString(), 
                        name, 
                        type: 'folder', 
                        parentId: contextMenu.fileId 
                      };
                      setActiveProjectFiles(prev => [...prev, newFolder]);
                      setOpenFolders(prev => ({ ...prev, [contextMenu.fileId]: true }));
                    }
                    setContextMenu({ visible: false, x: 0, y: 0, fileId: null });
                  }}
                >
                  {t('newFolder') || 'New Folder'}
                </div>
                <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '4px 0' }} />
              </>
            )}
            <div 
              style={{ padding: '8px 16px', fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseEnter={(e) => e.target.style.background = 'var(--bg-card-hover)'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
              onClick={() => {
                const file = activeProjectFiles.find(f => f.id === contextMenu.fileId);
                if (file) {
                  setEditingFileId(file.id);
                  setEditingFilename(file.name || file.title);
                }
                setContextMenu({ visible: false, x: 0, y: 0, fileId: null });
              }}
            >
              {t('rename') || 'Rename'}
            </div>
            <div 
              style={{ padding: '8px 16px', fontSize: '13px', color: 'var(--danger)', cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseEnter={(e) => { e.target.style.background = 'var(--danger)'; e.target.style.color = '#fff'; }}
              onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--danger)'; }}
              onClick={() => {
                const getDescendantIds = (parentId, files) => {
                  let ids = [];
                  const children = files.filter(f => f.parentId === parentId);
                  for (const child of children) {
                    ids.push(child.id);
                    ids = [...ids, ...getDescendantIds(child.id, files)];
                  }
                  return ids;
                };
                setActiveProjectFiles(prev => {
                  const idsToRemove = [contextMenu.fileId, ...getDescendantIds(contextMenu.fileId, prev)];
                  return prev.filter(f => !idsToRemove.includes(f.id));
                });
                setContextMenu({ visible: false, x: 0, y: 0, fileId: null });
              }}
            >
              {t('delete') || 'Delete'}
            </div>
          </div>
        );
      })()}

      {/* Explorer 3-Dots Menu Overlay */}
      {explorerMenu.visible && (
        <div 
          style={{ position: 'fixed', top: explorerMenu.y, left: explorerMenu.x, background: colors.panelBg, border: `1px solid ${colors.border}`, borderRadius: '4px', padding: '4px 0', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.5)', minWidth: '160px' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div 
            style={{ padding: '8px 16px', fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer', transition: 'background 0.2s', fontWeight: 500, display: 'flex', alignItems: 'center' }}
            onMouseEnter={(e) => e.target.style.background = 'var(--bg-card-hover)'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
            onClick={() => {
              localStorage.removeItem('lastActiveProjectId');
              setActiveProjectFiles([]);
              setOriginalProjectFiles([]);
              setActiveProjectId(null);
              setActiveFileId(null);
              navigate('/ide');
              setExplorerMenu({ visible: false, x: 0, y: 0 });
            }}
          >
            {t('closeFolder') || 'Close Folder'}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceLayout;

import React, { createContext, useState } from 'react';

export const WorkspaceContext = createContext();

export const WorkspaceProvider = ({ children }) => {
  // Activity Bar & Layout state
  const [showSideBar, setShowSideBar] = useState(true);
  const [showSecondarySideBar, setShowSecondarySideBar] = useState(false);
  const [showPanel, setShowPanel] = useState(true);
  const [activePanelTab, setActivePanelTab] = useState('terminal'); // terminal, output, review

  // Terminal state
  const [terminalOutput, setTerminalOutput] = useState([]);
  const [isTerminalRunning, setIsTerminalRunning] = useState(false);
  
  // AI State (to allow components to trigger AI actions)
  const [triggerAiChat, setTriggerAiChat] = useState(null); // Can be used to send an error to AI

  // Active Project State (for Explorer and IDE)
  const [activeProjectFiles, setActiveProjectFiles] = useState([]);
  const [originalProjectFiles, setOriginalProjectFiles] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [activeFileId, setActiveFileId] = useState(null);
  const [stdin, setStdin] = useState('');

  const toggleSideBar = () => setShowSideBar(prev => !prev);
  const toggleSecondarySideBar = () => setShowSecondarySideBar(prev => !prev);
  const togglePanel = () => setShowPanel(prev => !prev);

  const addTerminalLine = (line) => {
    setTerminalOutput(prev => [...prev, line]);
  };

  const clearTerminal = () => {
    setTerminalOutput([]);
  };

  return (
    <WorkspaceContext.Provider value={{
      showSideBar, setShowSideBar, toggleSideBar,
      showSecondarySideBar, setShowSecondarySideBar, toggleSecondarySideBar,
      showPanel, setShowPanel, togglePanel,
      activePanelTab, setActivePanelTab,
      terminalOutput, setTerminalOutput, addTerminalLine, clearTerminal,
      isTerminalRunning, setIsTerminalRunning,
      triggerAiChat, setTriggerAiChat,
      activeProjectFiles, setActiveProjectFiles,
      originalProjectFiles, setOriginalProjectFiles,
      activeProjectId, setActiveProjectId,
      activeFileId, setActiveFileId,
      stdin, setStdin
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

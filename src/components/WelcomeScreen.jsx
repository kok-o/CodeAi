import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, FolderOpen, Plus, Clock, Code2 } from 'lucide-react';
import { WorkspaceContext } from '../context/WorkspaceContext';
import { AppContext } from '../context/AppContext';

const WelcomeScreen = ({ projects = [] }) => {
  const navigate = useNavigate();
  const { toggleSecondarySideBar } = useContext(WorkspaceContext);
  const { t } = useContext(AppContext);

  const colors = {
    bg: 'var(--bg-editor)',
    text: 'var(--text-primary)',
    muted: 'var(--text-muted)',
    accent: 'var(--brand-primary)',
    card: 'var(--bg-card)',
    border: 'var(--border-subtle)',
    hover: 'var(--bg-card-hover)',
  };

  const recentProjects = projects.slice(0, 3);

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: colors.bg,
      color: colors.text,
      height: '100%',
      padding: '40px',
      overflowY: 'auto'
    }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          maxWidth: '800px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '40px'
        }}
      >
        {/* Header / Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <img src="/logo.png" alt="CodeAI Logo" style={{ width: '64px', height: '64px', objectFit: 'contain' }} />
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
                Code<span style={{ color: 'var(--brand-primary)' }}>AI</span>
              </h1>
              <p style={{ color: colors.muted, fontSize: '1rem', margin: '4px 0 0 0' }}>
                {t('editingEvolved') || "Editing evolved. Let's build something amazing."}
              </p>
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'flex', gap: '60px', flexWrap: 'wrap' }}>
          
          {/* Start Actions */}
          <div style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: colors.text, margin: 0 }}>{t('start') || "Start"}</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button 
                onClick={toggleSecondarySideBar}
                className="glass"
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', 
                  background: 'transparent', border: 'none', borderRadius: '8px', 
                  color: colors.text, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = colors.hover; e.currentTarget.style.color = colors.accent; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = colors.text; }}
              >
                <MessageSquare size={18} color={colors.accent} />
                <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{t('openChat') || "Open Chat"}</span>
              </button>

              <button 
                onClick={() => navigate('/projects')}
                className="glass"
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', 
                  background: 'transparent', border: 'none', borderRadius: '8px', 
                  color: colors.text, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = colors.hover; e.currentTarget.style.color = colors.accent; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = colors.text; }}
              >
                <FolderOpen size={18} color="#519aba" />
                <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{t('openProject') || "Open Project"}...</span>
              </button>

              <button 
                onClick={() => navigate('/projects')}
                className="glass"
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', 
                  background: 'transparent', border: 'none', borderRadius: '8px', 
                  color: colors.text, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = colors.hover; e.currentTarget.style.color = colors.accent; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = colors.text; }}
              >
                <Plus size={18} color="#89d185" />
                <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{t('createProject') || "Create Project"}</span>
              </button>
            </div>
          </div>

          {/* Recent */}
          <div style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: colors.text, margin: 0 }}>{t('recent') || "Recent"}</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recentProjects.length > 0 ? (
                recentProjects.map(p => (
                  <div 
                    key={p.id}
                    onClick={() => navigate(`/ide?project=${p.id}`)}
                    className="glass"
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', 
                      background: 'transparent', border: 'none', borderRadius: '8px', 
                      color: colors.muted, cursor: 'pointer', transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = colors.hover; e.currentTarget.style.color = colors.text; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = colors.muted; }}
                  >
                    <Code2 size={16} color="var(--brand-secondary)" />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: colors.text }}>{p.title}</span>
                      <span style={{ fontSize: '0.75rem' }}>{p.language || 'Code'} {t('workspace') || "Workspace"}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '12px 16px', color: colors.muted, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} />
                  {t('noRecentProjects') || "No recent projects"}
                </div>
              )}
            </div>
          </div>
          
        </div>
      </motion.div>
    </div>
  );
};

export default WelcomeScreen;

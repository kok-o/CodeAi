import React, { useContext, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  FileCode, 
  BarChart3, 
  LogOut, 
  UserCircle,
  ChevronLeft,
  ChevronRight,
  Settings as SettingsIcon,
  ShieldAlert,
  Code2,
  Terminal,
  GraduationCap,
  Map,
  FolderOpen
} from 'lucide-react';
import { AppContext } from '../context/AppContext';

const Sidebar = () => {
  const { logout, t, user, sidebarCollapsed, toggleSidebar, isAuthenticated } = useContext(AppContext);
  const isCollapsed = sidebarCollapsed;
  const navigate = useNavigate();
  const location = useLocation();
  const isSettingsPage = location.pathname.startsWith('/settings');
  const activeTab = new URLSearchParams(location.search).get('tab') || 'profile';

  const [localSettingsOpen, setLocalSettingsOpen] = useState(false);
  const settingsExpanded = isSettingsPage || localSettingsOpen;

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };


  const getBaseUrl = () => {
    const url = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return url.replace(/\/api$/, '');
  };
  const apiBase = getBaseUrl();
  const avatarUrl = user?.avatar_url ? (user.avatar_url.startsWith('http') ? user.avatar_url : `${apiBase}${user.avatar_url}`) : null;

  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <>
      <style>{`
        main {
          padding-left: ${isCollapsed ? '120px' : '280px'} !important;
          transition: padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
      `}</style>

      <div className="glass" style={{
        width: isCollapsed ? '80px' : '240px',
        height: 'calc(100vh - 40px)',
        position: 'fixed',
        left: '20px',
        top: '20px',
        display: 'flex',
        flexDirection: 'column',
        padding: isCollapsed ? '32px 8px' : '32px 16px',
        zIndex: 100,
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {/* Collapse Toggle Button */}
        <button 
          onClick={toggleSidebar}
          style={{
            position: 'absolute',
            right: '-6px',
            top: '32px',
            width: '6px',
            height: '52px',
            borderRadius: '0 18px 18px 0',
            background: 'transparent',
            border: 'none',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'transparent',
            cursor: 'pointer',
            zIndex: 110,
            boxShadow: 'none',
            transition: 'all 0.2s ease-in-out'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.width = '24px';
            e.currentTarget.style.right = '-24px';
            e.currentTarget.style.background = 'var(--bg-tertiary)';
            e.currentTarget.style.border = '1px solid var(--border-color)';
            e.currentTarget.style.borderLeft = '2px solid var(--primary)';
            e.currentTarget.style.color = 'var(--text-main)';
            e.currentTarget.style.boxShadow = 'var(--glass-shadow)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.width = '6px';
            e.currentTarget.style.right = '-6px';
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.border = 'none';
            e.currentTarget.style.borderLeft = 'none';
            e.currentTarget.style.color = 'transparent';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        <div 
          onClick={handleLogoClick}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: isCollapsed ? '0' : '10px', 
            padding: isCollapsed ? '0' : '0 12px', 
            marginBottom: '40px',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            cursor: 'pointer'
          }}
        >
          <img 
            src="/logo.png" 
            alt="CodeAI Logo" 
            style={{
              width: '40px',
              height: '40px',
              objectFit: 'contain',
              flexShrink: 0
            }} 
          />
          {!isCollapsed && (
            <span className="heading" style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.5px' }}>
              Code<span style={{ color: 'var(--primary)' }}>AI</span>
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
          {user?.role === 'teacher' ? (
            <NavItem icon={<GraduationCap size={20} />} label="Teacher Studio" to="/teacher/courses" isCollapsed={isCollapsed} />
          ) : (
            <NavItem icon={<BarChart3 size={20} />} label={t('dashboard')} to="/dashboard" isCollapsed={isCollapsed} />
          )}

          <NavItem icon={<BookOpen size={20} />} label={t('courses')} to="/courses" isCollapsed={isCollapsed} />

          <NavItem icon={<Map size={20} />} label="Пути обучения" to="/paths" isCollapsed={isCollapsed} />

          <NavItem icon={<Code2 size={20} />} label={t('ide') || "IDE"} to="/ide" isCollapsed={isCollapsed} />

          <NavItem icon={<Terminal size={20} />} label={t('challenges') || "Задачник"} to="/challenges" isCollapsed={isCollapsed} />

          <NavItem icon={<FolderOpen size={20} />} label="Проекты" to="/projects" isCollapsed={isCollapsed} />

          <NavItem icon={<UserCircle size={20} />} label={t('profile')} to="/profile" isCollapsed={isCollapsed} />

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <NavItem 
              icon={<SettingsIcon size={20} />} 
              label={t('settings')} 
              to="" 
              isActive={isSettingsPage}
              isCollapsed={isCollapsed} 
              onClick={(e) => {
                e.preventDefault();
                if (isSettingsPage) {
                  navigate(user?.role === 'teacher' ? '/teacher/courses' : '/dashboard');
                } else {
                  setLocalSettingsOpen(!localSettingsOpen);
                }
              }}
            />
            
            <motion.div
              initial={false}
              animate={{
                height: settingsExpanded ? 'auto' : 0,
                opacity: settingsExpanded ? 1 : 0,
                pointerEvents: settingsExpanded ? 'auto' : 'none',
                marginTop: settingsExpanded ? 8 : 0,
                marginBottom: settingsExpanded ? 8 : 0
              }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              {!isCollapsed && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  paddingLeft: '16px',
                  marginLeft: '21px',
                }}>
                  <SubNavItem label={t('profileTab')} tab="profile" activeTab={activeTab} />
                  <SubNavItem label={t('preferencesTab')} tab="preferences" activeTab={activeTab} />
                  <SubNavItem label={t('accountTab')} tab="account" activeTab={activeTab} />
                </div>
              )}
            </motion.div>
          </div>

          {user?.role === 'admin' && (
            <NavItem icon={<ShieldAlert size={20} />} label={t('adminDashboard')} to="/admin" isCollapsed={isCollapsed} />
          )}
        </div>
      </div>
    </>
  );
};

const NavItem = ({ icon, label, to, isCollapsed, onClick, isActive: customIsActive }) => (
  <NavLink 
    to={to || '#'} 
    onClick={onClick}
    title={isCollapsed ? label : undefined}
    style={({ isActive }) => {
      const active = customIsActive !== undefined ? customIsActive : isActive;
      return {
        display: 'flex',
        alignItems: 'center',
        gap: isCollapsed ? '0' : '12px',
        padding: '12px',
        borderRadius: '12px',
        textDecoration: 'none',
        color: active ? 'var(--primary)' : 'var(--text-muted)',
        background: active ? 'var(--gradient-glow1)' : 'transparent',
        transition: 'all 0.2s ease',
        justifyContent: isCollapsed ? 'center' : 'flex-start'
      };
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
      {icon}
    </div>
    {!isCollapsed && <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>}
  </NavLink>
);

const SubNavItem = ({ label, tab, activeTab }) => {
  const isActive = activeTab === tab;
  return (
    <NavLink
      to={`/settings?tab=${tab}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 12px',
        borderRadius: '8px',
        textDecoration: 'none',
        color: isActive ? 'var(--primary)' : 'var(--text-muted)',
        background: isActive ? 'var(--gradient-glow1)' : 'transparent',
        fontSize: '0.85rem',
        fontWeight: isActive ? '600' : '500',
        transition: 'all 0.2s ease',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.color = 'var(--text-main)';
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.color = 'var(--text-muted)';
      }}
    >
      <span>{label}</span>
    </NavLink>
  );
};

export default Sidebar;

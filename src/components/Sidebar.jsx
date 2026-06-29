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
  FolderOpen,
  Home
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

  const handleLogoClick = () => {
    navigate('/');
  };

  const navItems = [
    {
      icon: user?.role === 'teacher' ? <GraduationCap size={20} /> : <Home size={20} />,
      label: user?.role === 'teacher' ? "Teacher Studio" : t('dashboard'),
      to: user?.role === 'teacher' ? '/teacher/courses' : '/dashboard'
    },
    { icon: <BookOpen size={20} />, label: t('courses'), to: '/courses' },
    { icon: <Map size={20} />, label: 'Пути', to: '/paths', mobileLabel: 'Пути' },
    { icon: <Code2 size={20} />, label: t('ide') || "IDE", to: '/ide' },
    { icon: <Terminal size={20} />, label: t('challenges') || "Задачи", to: '/challenges', mobileLabel: 'Задачи' },
    { icon: <FolderOpen size={20} />, label: 'Проекты', to: '/projects', mobileLabel: 'Проекты' },
    { icon: <UserCircle size={20} />, label: t('profile'), to: '/profile' }
  ];

  return (
    <>
      <style>{`
        main {
          padding-left: ${isCollapsed ? '100px' : '260px'} !important;
          transition: padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        @media (max-width: 767px) {
          main {
            padding-left: 0 !important;
            padding-bottom: 72px !important;
          }
        }
      `}</style>

      {/* DESKTOP SIDEBAR */}
      <div className="glass desktop-only" style={{
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
        <button 
          onClick={toggleSidebar}
          style={{
            position: 'absolute',
            right: '-12px',
            top: '32px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            zIndex: 110,
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.2s ease-in-out'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--brand-primary)';
            e.currentTarget.style.borderColor = 'var(--brand-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
          }}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
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
              width: '36px',
              height: '36px',
              objectFit: 'contain',
              flexShrink: 0
            }} 
          />
          {!isCollapsed && (
            <span className="heading" style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '-0.02em' }}>
              Code<span style={{ color: 'var(--brand-primary)' }}>AI</span>
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, overflowY: 'auto' }} className="scrollbar-thin">
          {navItems.map((item, idx) => (
            <NavItem key={idx} icon={item.icon} label={item.label} to={item.to} isCollapsed={isCollapsed} />
          ))}

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
                marginTop: settingsExpanded ? 4 : 0,
                marginBottom: settingsExpanded ? 4 : 0
              }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden' }}
            >
              {!isCollapsed && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  paddingLeft: '12px',
                  marginLeft: '22px',
                  borderLeft: '1px solid var(--border-subtle)'
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

      {/* MOBILE BOTTOM TAB BAR */}
      <div className="mobile-only glass" style={{
        position: 'fixed',
        bottom: '0',
        left: '0',
        right: '0',
        height: '64px',
        borderRadius: '24px 24px 0 0',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '0 8px',
        zIndex: 1000,
        borderBottom: 'none',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.05)'
      }}>
        {/* We pick top 5 most important items for mobile bottom bar */}
        {navItems.slice(0, 5).map((item, idx) => (
          <MobileNavItem key={idx} icon={item.icon} label={item.mobileLabel || item.label} to={item.to} />
        ))}
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
        padding: '10px 12px',
        borderRadius: 'var(--radius-md)',
        textDecoration: 'none',
        color: active ? 'var(--brand-primary)' : 'var(--text-muted)',
        background: active ? 'var(--brand-glow)' : 'transparent',
        transition: 'all 0.15s ease',
        justifyContent: isCollapsed ? 'center' : 'flex-start',
        fontWeight: active ? '600' : '500',
        fontSize: '0.9rem'
      };
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
      {icon}
    </div>
    {!isCollapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>}
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
        padding: '6px 12px',
        borderRadius: 'var(--radius-sm)',
        textDecoration: 'none',
        color: isActive ? 'var(--brand-primary)' : 'var(--text-muted)',
        background: isActive ? 'var(--brand-glow)' : 'transparent',
        fontSize: '0.85rem',
        fontWeight: isActive ? '600' : '500',
        transition: 'all 0.15s ease',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.color = 'var(--text-primary)';
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.color = 'var(--text-muted)';
      }}
    >
      <span>{label}</span>
    </NavLink>
  );
};

const MobileNavItem = ({ icon, label, to }) => (
  <NavLink 
    to={to} 
    style={({ isActive }) => ({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '4px',
      padding: '4px 8px',
      textDecoration: 'none',
      color: isActive ? 'var(--brand-primary)' : 'var(--text-muted)',
      transition: 'color 0.15s ease',
      flex: 1
    })}
  >
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', transform: 'scale(1.1)' }}>
      {icon}
    </div>
    <span style={{ fontSize: '10px', fontWeight: '600', textAlign: 'center' }}>{label}</span>
  </NavLink>
);

export default Sidebar;

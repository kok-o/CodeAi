import React, { useContext, useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  GitBranch, 
  LayoutDashboard, 
  Bell, 
  Award, 
  CheckCircle, 
  Zap, 
  AlertTriangle, 
  Trash2, 
  X,
  Menu,
  Settings as SettingsIcon,
  ShieldAlert,
  Sun,
  Moon,
  LogIn,
  UserPlus,
  Home,
  BookOpen,
  Terminal,
  User
} from 'lucide-react';
import { AppContext } from '../context/AppContext';

const Navbar = () => {
  const { 
    isAuthenticated, 
    user, 
    language, 
    setLanguage, 
    t,
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    theme,
    setTheme
  } = useContext(AppContext);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const dropdownRef = useRef(null);
  const bellRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        bellRef.current &&
        !bellRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target)
      ) {
        setShowMobileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setShowMobileMenu(false);
  }, [location.pathname]);

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={18} color="var(--success)" />;
      case 'warning':
        return <AlertTriangle size={18} color="var(--danger)" />;
      default:
        return <Zap size={18} color="var(--brand-primary)" />;
    }
  };

  const handleNotificationClick = async (n) => {
    if (!n.is_read) {
      await markNotificationAsRead(n.id);
    }
    setShowNotifications(false);
    if (n.link) {
      navigate(n.link);
    }
  };

  const getBaseUrl = () => {
    const url = import.meta.env.PROD ? '' : 'http://localhost:5000';
    return url.replace(/\/api$/, '');
  };
  const apiBase = getBaseUrl();
  const avatarUrl = user?.avatar_url ? (user.avatar_url.startsWith('http') ? user.avatar_url : `${apiBase}${user.avatar_url}`) : null;

  const getMainScreenPath = () => {
    if (!isAuthenticated) return '/';
    return user?.role === 'teacher' ? '/teacher/courses' : '/dashboard';
  };
  const mainPath = getMainScreenPath();
  const isAlreadyOnMain = location.pathname === mainPath;

  return (
    <>
      <style>{`
        .navbar-main {
          margin: 20px 40px;
          padding: 16px 32px;
        }
        @media (max-width: 767px) {
          .navbar-main {
            margin: 8px;
            padding: 10px 16px;
            border-radius: 16px;
          }
          .nav-links {
            display: none !important;
          }
        }
        .mobile-hamburger {
          display: none !important;
        }
        @media (max-width: 767px) {
          .mobile-hamburger {
            display: flex !important;
          }
        }
        .mobile-menu-overlay {
          position: fixed;
          inset: 0;
          z-index: 999;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }
        .mobile-menu-panel {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: min(320px, 85vw);
          background: var(--bg-card);
          border-left: 1px solid var(--border-subtle);
          z-index: 1001;
          display: flex;
          flex-direction: column;
          padding: 24px 16px;
          gap: 8px;
          box-shadow: var(--shadow-lg);
          overflow-y: auto;
        }
        .mobile-menu-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px 16px;
          border-radius: 12px;
          color: var(--text-primary);
          text-decoration: none;
          font-weight: 500;
          font-size: 1rem;
          transition: background 0.15s ease;
        }
        .mobile-menu-link:hover,
        .mobile-menu-link.active {
          background: var(--brand-glow);
          color: var(--brand-primary);
        }
        .mobile-menu-divider {
          height: 1px;
          background: var(--border-subtle);
          margin: 8px 0;
        }
      `}</style>

      <nav className="glass navbar-main" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <NavLink 
            to={mainPath} 
            onClick={(e) => {
              if (isAlreadyOnMain) e.preventDefault();
            }}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              textDecoration: 'none', 
              color: 'inherit',
              cursor: isAlreadyOnMain ? 'default' : 'pointer'
            }}
          >
            <img 
              src="/logo.png" 
              alt="CodeAI Logo" 
              style={{ width: '36px', height: '36px', objectFit: 'contain' }} 
            />
            <span className="heading" style={{ fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.5px' }}>
              Code<span style={{ color: 'var(--brand-primary)' }}>AI</span>
            </span>
          </NavLink>
        </div>

        {/* Desktop Nav Links */}
        <div className="nav-links" style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <a 
            href="https://youtu.be/Q_nLB-VYixs?si=3HMTGzG52Q-7ALV3" 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}
          >
            {t('community')}
          </a>
          <NavLink to="/courses" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>{t('courses')}</NavLink>
          
          {isAuthenticated ? (
            <>
              <NavLink to="/dashboard" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <LayoutDashboard size={16} /> {t('dashboard')}
              </NavLink>

              {/* Notification Bell */}
              <div style={{ position: 'relative' }}>
                <button 
                  ref={bellRef}
                  onClick={() => setShowNotifications(!showNotifications)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '6px',
                    borderRadius: '50%',
                    transition: 'background 0.2s',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--overlay-bg)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                >
                  <Bell size={20} />
                  {unreadNotificationsCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      width: '18px',
                      height: '18px',
                      background: 'var(--badge-bg)',
                      border: '2px solid var(--bg-card)',
                      borderRadius: '50%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: 'bold'
                    }}>
                      {unreadNotificationsCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <div 
                    ref={dropdownRef}
                    style={{
                      position: 'absolute',
                      top: '40px',
                      right: '0',
                      width: '360px',
                      maxHeight: '450px',
                      background: 'var(--surface-raised)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      boxShadow: 'var(--dropdown-shadow)',
                      zIndex: 1001,
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{
                      padding: '16px',
                      borderBottom: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontWeight: 'bold', fontSize: '1rem', color: 'var(--text-primary)' }}>{t('notificationsTitle')}</span>
                      {notifications.length > 0 && (
                        <button 
                          onClick={markAllNotificationsAsRead}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--brand-primary)',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          {t('markAllRead')}
                        </button>
                      )}
                    </div>

                    <div style={{ overflowY: 'auto', flex: 1 }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                          <Bell size={32} style={{ marginBottom: '8px', opacity: 0.3 }} />
                          <p style={{ fontSize: '0.9rem' }}>{t('noNotifications')}</p>
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div 
                            key={n.id}
                            style={{
                              padding: '14px 16px',
                              borderBottom: '1px solid var(--border-subtle)',
                              display: 'flex',
                              gap: '12px',
                              cursor: 'pointer',
                              background: n.is_read ? 'transparent' : 'var(--brand-glow)',
                              transition: 'background 0.2s',
                              position: 'relative'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--overlay-bg)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = n.is_read ? 'transparent' : 'var(--brand-glow)'}
                            onClick={() => handleNotificationClick(n)}
                          >
                            <div style={{ flexShrink: 0, marginTop: '2px' }}>
                              {getNotificationIcon(n.type)}
                            </div>
                            <div style={{ flex: 1, textAlign: 'left' }}>
                              <h4 style={{
                                fontSize: '0.85rem',
                                fontWeight: n.is_read ? '600' : '800',
                                color: 'var(--text-primary)',
                                margin: '0 0 4px 0',
                                lineHeight: '1.2'
                              }}>
                                {n.title}
                              </h4>
                              <p style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-muted)',
                                margin: '0',
                                lineHeight: '1.3'
                              }}>
                                {n.message}
                              </p>
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
                                {new Date(n.created_at || n.createdAt).toLocaleString(language, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(n.id);
                              }}
                              title={t('clearNotification')}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '4px',
                                alignSelf: 'flex-start',
                                opacity: 0.5,
                                transition: 'opacity 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.opacity = 1;
                                e.currentTarget.style.color = 'var(--danger)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.opacity = 0.5;
                                e.currentTarget.style.color = 'var(--text-muted)';
                              }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar */}
              <NavLink to="/profile" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                <div 
                  style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '50%', 
                    background: 'var(--brand-primary)', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '0.85rem',
                    overflow: 'hidden',
                    border: '2px solid var(--border-subtle)',
                    boxShadow: 'var(--card-shadow)'
                  }}
                >
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt={user.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    getInitials(user.name)
                  )}
                </div>
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/login" className="btn btn-outline" style={{ padding: '8px 20px', textDecoration: 'none' }}>{t('login')}</NavLink>
              <NavLink to="/register" className="btn btn-primary" style={{ padding: '8px 20px', textDecoration: 'none', color: 'white' }}>{t('joinNow')}</NavLink>
            </>
          )}

          {/* Theme Toggle */}
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            style={{
              background: 'var(--overlay-bg)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              padding: '6px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)} 
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              padding: '6px 12px',
              outline: 'none',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontFamily: "'Inter', sans-serif"
            }}
          >
            <option value="ru" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>RU</option>
            <option value="kz" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>KZ</option>
            <option value="en" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>EN</option>
          </select>
        </div>

        {/* Mobile Right Side: theme + lang + hamburger */}
        <div className="mobile-hamburger" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Theme Toggle (mobile) */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            style={{
              background: 'var(--overlay-bg)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 'unset',
              height: '36px',
              width: '36px',
            }}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Hamburger Button */}
          <button
            onClick={() => setShowMobileMenu(true)}
            style={{
              background: 'var(--overlay-bg)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 'unset',
              height: '36px',
              width: '36px',
            }}
            aria-label="Menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {showMobileMenu && (
        <>
          <div className="mobile-menu-overlay" onClick={() => setShowMobileMenu(false)} />
          <div className="mobile-menu-panel" ref={mobileMenuRef}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span className="heading" style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                Code<span style={{ color: 'var(--brand-primary)' }}>AI</span>
              </span>
              <button
                onClick={() => setShowMobileMenu(false)}
                style={{ background: 'var(--overlay-bg)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--text-muted)', padding: '6px', cursor: 'pointer', display: 'flex' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Nav Links */}
            <NavLink to="/" className={({ isActive }) => `mobile-menu-link${isActive ? ' active' : ''}`}>
              <Home size={20} />
              {t('home') || 'Главная'}
            </NavLink>
            <NavLink to="/courses" className={({ isActive }) => `mobile-menu-link${isActive ? ' active' : ''}`}>
              <BookOpen size={20} />
              {t('courses')}
            </NavLink>
            <a
              href="https://youtu.be/Q_nLB-VYixs?si=3HMTGzG52Q-7ALV3"
              target="_blank"
              rel="noopener noreferrer"
              className="mobile-menu-link"
            >
              <GitBranch size={20} />
              {t('community')}
            </a>

            {isAuthenticated ? (
              <>
                <div className="mobile-menu-divider" />
                <NavLink to="/dashboard" className={({ isActive }) => `mobile-menu-link${isActive ? ' active' : ''}`}>
                  <LayoutDashboard size={20} />
                  {t('dashboard')}
                </NavLink>
                <NavLink to="/challenges" className={({ isActive }) => `mobile-menu-link${isActive ? ' active' : ''}`}>
                  <Terminal size={20} />
                  {t('challenges') || 'Задачи'}
                </NavLink>
                <div className="mobile-menu-divider" />
                <NavLink to="/profile" className={({ isActive }) => `mobile-menu-link${isActive ? ' active' : ''}`}>
                  <User size={20} />
                  {t('profile')}
                </NavLink>
                <NavLink to="/settings" className={({ isActive }) => `mobile-menu-link${isActive ? ' active' : ''}`}>
                  <SettingsIcon size={20} />
                  {t('settings')}
                </NavLink>
              </>
            ) : (
              <>
                <div className="mobile-menu-divider" />
                <NavLink to="/login" className="mobile-menu-link" style={{ color: 'var(--text-primary)' }}>
                  <LogIn size={20} />
                  {t('login')}
                </NavLink>
                <NavLink to="/register" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 16px', borderRadius: '12px', background: 'var(--brand-primary)', color: 'white', textDecoration: 'none', fontWeight: 600, fontSize: '1rem', marginTop: '4px' }}>
                  <UserPlus size={20} />
                  {t('joinNow') || 'Регистрация'}
                </NavLink>
              </>
            )}

            {/* Language Selector */}
            <div className="mobile-menu-divider" />
            <div style={{ padding: '4px 8px' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Язык / Language</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['ru', 'kz', 'en'].map(lang => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      background: language === lang ? 'var(--brand-primary)' : 'var(--overlay-bg)',
                      color: language === lang ? 'white' : 'var(--text-muted)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      textTransform: 'uppercase',
                      minHeight: 'unset',
                      height: '38px'
                    }}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Navbar;

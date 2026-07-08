import React, { useContext, useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitBranch,
  LayoutDashboard,
  Bell,
  Award,
  CheckCircle,
  Zap,
  AlertTriangle,
  Trash2,
  Menu,
  Settings as SettingsIcon,
  ShieldAlert,
  Sun,
  Moon,
  LogIn,
  UserPlus,
  BookOpen,
  Terminal,
  User,
  Globe,
  ChevronDown,
} from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { spring } from '../utils/animations';

// ─── Language Switcher ────────────────────────────────────────────────────────
const LanguageSwitcher = ({ language, setLanguage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languages = [
    { code: 'ru', label: 'Русский', short: 'RU' },
    { code: 'kz', label: 'Қазақша', short: 'KZ' },
    { code: 'en', label: 'English', short: 'EN' },
  ];
  const currentLang = languages.find(l => l.code === language) || languages[0];

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: isOpen ? 'var(--overlay-bg-hover)' : isHovered ? 'var(--overlay-bg)' : 'transparent',
          border: `1px solid ${isOpen ? 'var(--border-accent)' : 'transparent'}`,
          borderRadius: '10px',
          color: 'var(--text-primary)',
          padding: (isHovered || isOpen) ? '7px 12px' : '7px 10px',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '0px',
          fontSize: '0.82rem', fontWeight: 600,
          transition: 'all 0.25s var(--ease-out)',
          height: '36px',
        }}
      >
        <Globe size={15} style={{ flexShrink: 0 }} />
        <span style={{
            display: 'inline-flex', alignItems: 'center',
            overflow: 'hidden',
            maxWidth: (isHovered || isOpen) ? '50px' : '0px',
            opacity: (isHovered || isOpen) ? 1 : 0,
            transition: 'all 0.25s var(--ease-out)',
            whiteSpace: 'nowrap'
        }}>
          <span style={{ marginLeft: '6px' }}>{currentLang.short}</span>
          <ChevronDown size={12} style={{
            marginLeft: '4px',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }} />
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              boxShadow: 'var(--dropdown-shadow)',
              padding: '6px',
              display: 'flex', flexDirection: 'column', gap: '2px',
              zIndex: 9999, minWidth: '130px',
            }}
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => { setLanguage(lang.code); setIsOpen(false); }}
                style={{
                  background: language === lang.code
                    ? 'linear-gradient(135deg, var(--brand-500), var(--brand-600))'
                    : 'transparent',
                  color: language === lang.code ? 'white' : 'var(--text-primary)',
                  border: 'none', borderRadius: '8px',
                  padding: '8px 14px', textAlign: 'left',
                  cursor: 'pointer', fontSize: '0.85rem',
                  fontWeight: language === lang.code ? 600 : 500,
                  transition: 'background 0.15s',
                  display: 'flex', alignItems: 'center', gap: '10px',
                  fontFamily: 'Inter, sans-serif',
                }}
                onMouseEnter={(e) => { if (language !== lang.code) e.currentTarget.style.background = 'var(--overlay-bg)'; }}
                onMouseLeave={(e) => { if (language !== lang.code) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontWeight: 700, opacity: 0.6, fontSize: '0.75rem', width: '22px' }}>{lang.short}</span>
                {lang.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Desktop Nav Link ─────────────────────────────────────────────────────────
const DesktopNavLink = ({ to, children, external, href }) => {
  const [hovered, setHovered] = useState(false);

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          color: hovered ? 'var(--text-primary)' : 'var(--text-muted)',
          textDecoration: 'none', fontWeight: 500,
          fontSize: '0.9rem', transition: 'color 200ms',
          position: 'relative',
        }}
      >
        {children}
        {hovered && (
          <motion.div
            layoutId="nav-underline"
            style={{
              position: 'absolute', bottom: '-2px', left: 0, right: 0,
              height: '1px', background: 'var(--brand-primary)',
              borderRadius: '9999px',
            }}
          />
        )}
      </a>
    );
  }

  return (
    <NavLink
      to={to}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={({ isActive }) => ({
        color: isActive ? 'var(--text-primary)' : hovered ? 'var(--text-primary)' : 'var(--text-muted)',
        textDecoration: 'none', fontWeight: isActive ? 600 : 500,
        fontSize: '0.9rem', transition: 'color 200ms',
        position: 'relative',
      })}
    >
      {({ isActive }) => (
        <>
          {children}
          {(isActive || hovered) && (
            <motion.div
              layoutId="nav-underline"
              style={{
                position: 'absolute', bottom: '-2px', left: 0, right: 0,
                height: '1.5px',
                background: isActive
                  ? 'linear-gradient(90deg, var(--brand-primary), var(--violet-400))'
                  : 'var(--border-moderate)',
                borderRadius: '9999px',
              }}
              initial={false}
              transition={spring}
            />
          )}
        </>
      )}
    </NavLink>
  );
};

// ─── Navbar ───────────────────────────────────────────────────────────────────
const Navbar = () => {
  const {
    isAuthenticated, user, language, setLanguage, t,
    notifications, unreadNotificationsCount,
    markNotificationAsRead, markAllNotificationsAsRead, deleteNotification,
    theme, setTheme,
  } = useContext(AppContext);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);
  const bellRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const hamburgerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll detection for navbar blur intensity
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          bellRef.current && !bellRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (
        mobileMenuRef.current && !mobileMenuRef.current.contains(e.target) &&
        hamburgerRef.current && !hamburgerRef.current.contains(e.target)
      ) {
        setShowMobileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => { setShowMobileMenu(false); }, [location.pathname]);

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle size={17} color="var(--success)" />;
      case 'warning': return <AlertTriangle size={17} color="var(--warning)" />;
      default:        return <Zap size={17} color="var(--brand-primary)" />;
    }
  };

  const handleNotificationClick = async (n) => {
    if (!n.is_read) await markNotificationAsRead(n.id);
    setShowNotifications(false);
    if (n.link) navigate(n.link);
  };

  const getBaseUrl = () => {
    const url = import.meta.env.PROD ? '' : 'http://localhost:5000';
    return url.replace(/\/api$/, '');
  };
  const apiBase = getBaseUrl();
  const avatarUrl = user?.avatar_url
    ? (user.avatar_url.startsWith('http') ? user.avatar_url : `${apiBase}${user.avatar_url}`)
    : null;

  const getMainScreenPath = () => {
    if (!isAuthenticated) return '/';
    return user?.role === 'teacher' ? '/teacher/courses' : '/dashboard';
  };
  const mainPath = getMainScreenPath();
  const isAlreadyOnMain = location.pathname === mainPath;

  return (
    <>
      <style>{`
        .navbar-glass {
          margin: 16px 32px;
          padding: 12px 28px;
        }
        @media (max-width: 767px) {
          .navbar-glass {
            margin: 8px;
            padding: 10px 16px;
          }
          .nav-links { display: none !important; }
          .nav-right-desktop { display: none !important; }
        }
        .mobile-hamburger { display: none !important; }
        @media (max-width: 767px) {
          .mobile-hamburger { display: flex !important; }
        }
        .nav-link-active {
          color: var(--text-primary) !important;
          font-weight: 600 !important;
        }
        .mobile-menu-link {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 16px; border-radius: 12px;
          color: var(--text-primary); text-decoration: none;
          font-weight: 500; font-size: 0.95rem;
          transition: background 0.15s;
        }
        .mobile-menu-link:hover, .mobile-menu-link.active {
          background: var(--brand-glow);
          color: var(--brand-primary);
        }
        .mobile-menu-divider { height: 1px; background: var(--border-subtle); margin: 6px 0; }
      `}</style>

      {/* ── Main Navbar ─────────────────────────────────────────── */}
      <motion.nav
        className="navbar-glass"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'fixed',
          top: 0, left: 0, right: 0,
          zIndex: 99999,
          overflow: 'visible',
          borderRadius: '20px',
          background: scrolled
            ? 'var(--glass-bg)'
            : 'color-mix(in srgb, var(--stars-bg-color) 80%, transparent)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: scrolled
            ? '1px solid var(--glass-border)'
            : '1px solid color-mix(in srgb, var(--glass-border) 60%, transparent)',
          boxShadow: scrolled
            ? 'var(--card-shadow)'
            : '0 2px 12px color-mix(in srgb, var(--brand-primary) 8%, transparent)',
          transition: 'background 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease',
        }}
      >
        {/* Logo */}
        <motion.div whileHover={{ scale: 1.02 }} transition={spring}>
          <NavLink
            to={mainPath}
            onClick={(e) => { if (isAlreadyOnMain) e.preventDefault(); }}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'inherit' }}
          >
            <img src="/logo.png" alt="CodeAI" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
            <span style={{
              fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.04em',
            }}>
              <span style={{ color: 'var(--text-primary)' }}>Code</span><span style={{ color: '#8b5cf6' }}>AI</span>
            </span>
          </NavLink>
        </motion.div>

        {/* Right Side: Nav Links & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          {/* Desktop Nav Links */}
          <div
            className="nav-links"
            style={{ display: 'flex', gap: '28px', alignItems: 'center' }}
          >
            <DesktopNavLink external href="https://linkedin.com/in/nurkhan-esenbek">{t('community')}</DesktopNavLink>
            <DesktopNavLink to="/courses">{t('courses')}</DesktopNavLink>
            {isAuthenticated && (
              <DesktopNavLink to="/dashboard">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <LayoutDashboard size={15} />
                  {t('dashboard')}
                </span>
              </DesktopNavLink>
            )}
          </div>

          {/* Desktop Right Controls */}
        <div
          className="nav-right-desktop"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {isAuthenticated ? (
            <>


              {/* Avatar */}
              <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }} transition={spring}>
                <NavLink to="/profile" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--brand-500), var(--violet-500))',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    color: 'white', fontWeight: 700, fontSize: '0.8rem',
                    overflow: 'hidden',
                    border: '2px solid var(--glass-border)',
                    boxShadow: '0 0 0 2px var(--brand-glow)',
                  }}>
                    {avatarUrl
                      ? <img src={avatarUrl} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : getInitials(user.name)
                    }
                  </div>
                </NavLink>
              </motion.div>
            </>
          ) : (
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={spring}>
              <NavLink to="/login" className="btn btn-primary btn-sm">
                {t('login')}
              </NavLink>
            </motion.div>
          )}

          {/* Theme Toggle */}
          <motion.button
            whileHover={{ scale: 1.08, rotate: 15 }}
            whileTap={{ scale: 0.92 }}
            transition={spring}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            style={{
              background: 'transparent', border: 'none',
              borderRadius: '10px', color: 'var(--text-muted)',
              padding: '8px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: '36px', width: '36px',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--overlay-bg)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </motion.button>

          <LanguageSwitcher language={language} setLanguage={setLanguage} />
        </div>
        </div>

        {/* Mobile Right Side */}
        <div className="mobile-hamburger" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            style={{
              background: 'transparent', border: 'none', borderRadius: '8px',
              color: 'var(--text-muted)', padding: '8px', cursor: 'pointer',
              display: 'flex', alignItems: 'center',
            }}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            ref={hamburgerRef}
            onClick={() => setShowMobileMenu(prev => !prev)}
            style={{
              background: showMobileMenu ? 'var(--brand-glow)' : 'var(--overlay-bg)',
              border: `1px solid ${showMobileMenu ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
              borderRadius: '10px', color: showMobileMenu ? 'var(--brand-primary)' : 'var(--text-primary)', padding: '8px',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              transition: 'all 0.2s ease',
            }}
            aria-label="Menu"
          >
            <Menu size={18} />
          </button>
        </div>
      </motion.nav>

      {/* ── Mobile Menu Drawer ─────────────────────────────────── */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            {/* Overlay — starts below navbar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowMobileMenu(false)}
              style={{
                position: 'fixed', top: '72px', left: 0, right: 0, bottom: 0, zIndex: 999,
                background: 'oklch(0% 0 0 / 40%)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
              }}
            />

            {/* Panel — starts below navbar */}
            <motion.div
              ref={mobileMenuRef}
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'fixed', top: '72px', right: 0, bottom: 0,
                width: 'min(300px, 90vw)',
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(24px) saturate(180%)',
                WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                borderLeft: '1px solid var(--glass-border)',
                borderTop: '1px solid var(--glass-border)',
                borderRadius: '16px 0 0 0',
                zIndex: 1001,
                display: 'flex', flexDirection: 'column',
                padding: '12px 14px 20px',
                gap: '4px',
                boxShadow: '-8px 8px 32px oklch(0% 0 0 / 20%)',
                overflowY: 'auto',
              }}
            >
              <NavLink to="/courses" className={({ isActive }) => `mobile-menu-link${isActive ? ' active' : ''}`}>
                <BookOpen size={18} /> {t('courses')}
              </NavLink>
              <a href="https://linkedin.com/in/nurkhan-esenbek" target="_blank" rel="noopener noreferrer" className="mobile-menu-link">
                <GitBranch size={18} /> {t('community')}
              </a>

              {isAuthenticated ? (
                <>
                  <div className="mobile-menu-divider" />
                  <NavLink to="/dashboard" className={({ isActive }) => `mobile-menu-link${isActive ? ' active' : ''}`}>
                    <LayoutDashboard size={18} /> {t('dashboard')}
                  </NavLink>
                  <NavLink to="/challenges" className={({ isActive }) => `mobile-menu-link${isActive ? ' active' : ''}`}>
                    <Terminal size={18} /> {t('challenges') || 'Challenges'}
                  </NavLink>
                  <div className="mobile-menu-divider" />
                  <NavLink to="/profile" className={({ isActive }) => `mobile-menu-link${isActive ? ' active' : ''}`}>
                    <User size={18} /> {t('profile')}
                  </NavLink>
                  <NavLink to="/settings" className={({ isActive }) => `mobile-menu-link${isActive ? ' active' : ''}`}>
                    <SettingsIcon size={18} /> {t('settings')}
                  </NavLink>
                </>
              ) : (
                <>
                  <div className="mobile-menu-divider" />
                  <NavLink
                    to="/login"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '13px 16px', borderRadius: '12px',
                      background: 'linear-gradient(135deg, var(--brand-500), var(--brand-600))',
                      color: 'white', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem',
                    }}
                  >
                    <LogIn size={18} /> {t('login')}
                  </NavLink>
                </>
              )}

              {/* Language Switcher (mobile) */}
              <div className="mobile-menu-divider" />
              <div style={{ padding: '4px 6px' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>
                  Language
                </p>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['ru', 'kz', 'en'].map(lang => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      style={{
                        flex: 1, padding: '8px',
                        borderRadius: '10px',
                        border: `1px solid ${language === lang ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                        background: language === lang
                          ? 'linear-gradient(135deg, var(--brand-500), var(--brand-600))'
                          : 'var(--overlay-bg)',
                        color: language === lang ? 'white' : 'var(--text-muted)',
                        fontWeight: 700, cursor: 'pointer',
                        fontSize: '0.8rem', textTransform: 'uppercase',
                        fontFamily: 'Inter, sans-serif', minHeight: 'unset', height: '36px',
                      }}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;

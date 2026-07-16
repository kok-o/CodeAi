import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import {
  Mail, Lock, User, CheckCircle, ArrowLeft,
  Eye, EyeOff, Sparkles, ArrowRight, Shield, Zap, Brain
} from 'lucide-react';
import { fadeInUp, scaleIn, staggerContainer, spring, easeOut } from '../utils/animations';

// ─── Floating Input ───────────────────────────────────────────────────────────
const FloatingInput = ({ label, type, placeholder, value, onChange, icon: Icon, required, rightSlot }) => {
  const [focused, setFocused] = useState(false);

  return (
    <motion.div variants={fadeInUp} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label style={{
        fontSize: '0.8rem', fontWeight: 600,
        color: focused ? 'var(--brand-primary)' : 'var(--text-secondary)',
        letterSpacing: '-0.01em',
        transition: 'color 200ms',
      }}>
        {label}
      </label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {Icon && (
          <Icon
            size={17}
            style={{
              position: 'absolute', left: '16px',
              color: focused ? 'var(--brand-primary)' : 'var(--text-muted)',
              transition: 'color 200ms', zIndex: 1, flexShrink: 0,
            }}
          />
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            padding: Icon ? '13px 16px 13px 46px' : '13px 16px',
            paddingRight: rightSlot ? '48px' : '16px',
            background: 'var(--surface-sunken)',
            border: `1px solid ${focused ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
            borderRadius: '12px',
            color: 'var(--text-primary)',
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.95rem',
            outline: 'none',
            boxShadow: focused
              ? '0 0 0 3px var(--brand-glow-soft), 0 1px 3px oklch(0% 0 0 / 15%)'
              : '0 1px 2px oklch(0% 0 0 / 8%)',
            transition: 'border-color 200ms, box-shadow 200ms',
          }}
        />
        {rightSlot && (
          <div style={{ position: 'absolute', right: '14px', zIndex: 1 }}>
            {rightSlot}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ─── Benefit Item ─────────────────────────────────────────────────────────────
const BenefitItem = ({ icon: Icon, text, color }) => (
  <motion.div
    variants={fadeInUp}
    style={{ display: 'flex', alignItems: 'center', gap: '14px' }}
  >
    <Icon size={20} color={color} style={{ flexShrink: 0 }} />
    <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
      {text}
    </span>
  </motion.div>
);

// ─── Auth Page ────────────────────────────────────────────────────────────────
const Auth = ({ type = 'login' }) => {
  const isLogin = type === 'login';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register, t } = useContext(AppContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password || (!isLogin && !name)) { setError(t('fillAllFields')); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setError(t('validEmail')); return; }
    if (password.length < 6) { setError(t('passwordLength')); return; }

    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      let msg = err.message || 'An authentication error occurred.';
      if (msg.includes('Invalid credentials')) msg = t('invalidCredentials') || msg;
      if (msg.includes('User not found'))      msg = t('userNotFound') || msg;
      if (msg.includes('Email is already in use')) msg = t('emailInUse') || msg;
      if (msg.includes('Server error'))        msg = t('serverError') || msg;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    { icon: CheckCircle, text: t('benefit1'), color: 'var(--brand-primary)' },
    { icon: CheckCircle, text: t('benefit2'), color: 'var(--brand-primary)' },
    { icon: CheckCircle, text: t('benefit3'), color: 'var(--brand-primary)' },
  ];

  return (
    <div style={{
      display: 'flex', minHeight: '100vh', width: '100%',
      backgroundColor: 'var(--bg-main)',
      backgroundImage: 'radial-gradient(circle at center, color-mix(in srgb, var(--text-primary) 7%, transparent) 0%, transparent 60%)'
    }}>

      {/* ── Left Panel (Marketing) ─────────────────────────── */}
      <div
        className="desktop-only"
        style={{
          flex: 1,
          background: 'transparent',
          padding: '60px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Removed Aurora blobs in favor of global radial shadow */}
        
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          style={{ position: 'relative', zIndex: 1 }}
        >
          {/* Logo */}
          <motion.div variants={fadeInUp} style={{ marginBottom: '64px' }}>
            <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: 'var(--text-primary)' }}>
              <img src="/logo.png" alt="CodeAI Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
              <span style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.04em' }}>
                Code<span style={{ color: 'var(--brand-primary)' }}>AI</span>
              </span>
            </NavLink>
          </motion.div>


          <motion.h1
            variants={fadeInUp}
            style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 800, letterSpacing: '-0.04em',
              lineHeight: 1.1, marginBottom: '20px',
            }}
          >
            {t('authTitleMain')}{' '}
            <span style={{
              background: 'linear-gradient(135deg, var(--brand-400), var(--violet-500))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              {t('authTitleSub')}
            </span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            style={{
              color: 'var(--text-muted)', fontSize: '1rem',
              marginBottom: '48px', lineHeight: 1.7, maxWidth: '440px',
            }}
          >
            {t('authSubtitle')}
          </motion.p>

          {/* Benefits */}
          <motion.div variants={staggerContainer} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {benefits.map((b, i) => <BenefitItem key={i} {...b} />)}
          </motion.div>
        </motion.div>
      </div>

      {/* ── Right Panel (Form) ─────────────────────────────── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        background: 'transparent',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Removed Mobile blobs */}

        <motion.div
          variants={scaleIn}
          initial="hidden"
          animate="visible"
          style={{
            width: '100%',
            maxWidth: '400px',
            background: 'var(--bg-sidebar)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '28px',
            padding: '52px 48px',
            boxShadow: 'var(--shadow-lg)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Back link (mobile) */}
          <NavLink to="/" style={{
            display: 'none',
            alignItems: 'center', gap: '6px',
            fontSize: '0.8rem', color: 'var(--text-muted)',
            marginBottom: '28px',
          }}
            className="mobile-only"
          >
            <ArrowLeft size={14} />
            {t('backToHome') || 'Back to home'}
          </NavLink>

          {/* Form header */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeInUp} style={{ marginBottom: '32px' }}>

              <h2 style={{
                fontSize: '1.6rem', fontWeight: 800,
                letterSpacing: '-0.04em', marginBottom: '6px',
              }}>
                {isLogin ? t('welcomeBack') : t('getStarted')}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                {isLogin
                  ? (t('loginSubtitle') || 'Sign in to continue your learning journey.')
                  : (t('registerSubtitle') || 'Create your account in seconds.')
                }
              </p>
            </motion.div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.25 }}
                  style={{
                    padding: '12px 16px',
                    background: 'oklch(63% 0.24 25 / 10%)',
                    border: '1px solid oklch(63% 0.24 25 / 25%)',
                    borderRadius: '12px',
                    color: 'var(--danger)',
                    fontSize: '0.85rem',
                    marginBottom: '20px',
                    display: 'flex', alignItems: 'center', gap: '10px',
                  }}
                >
                  <span>⚠️</span>
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {!isLogin && (
                <FloatingInput
                  label={t('fullName')}
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  icon={User}
                  required
                />
              )}

              <FloatingInput
                label={t('emailAddress')}
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                icon={Mail}
                required
              />

              <FloatingInput
                label={t('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                icon={Lock}
                required
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    style={{
                      background: 'transparent', border: 'none',
                      color: 'var(--text-muted)', cursor: 'pointer',
                      display: 'flex', padding: '4px',
                    }}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                }
              />

              {/* Submit */}
              <motion.div variants={fadeInUp} style={{ marginTop: '6px' }}>
                <motion.button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  whileHover={{ scale: 1.025, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  transition={spring}
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    borderRadius: '12px',
                    justifyContent: 'center',
                    gap: '10px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        style={{
                          width: '18px', height: '18px',
                          border: '2px solid oklch(97% 0 0 / 30%)',
                          borderTopColor: 'white',
                          borderRadius: '50%',
                        }}
                      />
                      {t('processing')}
                    </>
                  ) : (
                    <>
                      {isLogin ? t('signIn') : t('createAccount')}
                    </>
                  )}
                </motion.button>
              </motion.div>
            </form>

            {/* Switch auth mode */}
            <motion.p
              variants={fadeInUp}
              style={{
                marginTop: '28px', textAlign: 'center',
                color: 'var(--text-muted)', fontSize: '0.875rem',
              }}
            >
              {isLogin ? t('dontHaveAccount') : t('alreadyHaveAccount')}{' '}
              <NavLink
                to={isLogin ? '/register' : '/login'}
                style={{
                  color: 'var(--brand-primary)',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'color 150ms',
                }}
              >
                {isLogin ? t('signUp') : t('logIn')}
              </NavLink>
            </motion.p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;

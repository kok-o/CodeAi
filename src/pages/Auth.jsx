import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { NavLink, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { 
  Mail, 
  Lock, 
  User, 
  CheckCircle, 
  ArrowLeft,
  Eye,
  EyeOff
} from 'lucide-react';

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
    
    if (!email || !password || (!isLogin && !name)) {
      setError(t('fillAllFields'));
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t('validEmail'));
      return;
    }
    
    if (password.length < 6) {
      setError(t('passwordLength'));
      return;
    }
    
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
        navigate('/dashboard');
      } else {
        await register(name, email, password);
        navigate('/dashboard');
      }
    } catch (err) {
      let msg = err.message || "An authentication error occurred.";
      if (msg.includes("Invalid credentials")) msg = t('invalidCredentials') || msg;
      if (msg.includes("User not found")) msg = t('userNotFound') || msg;
      if (msg.includes("Email is already in use")) msg = t('emailInUse') || msg;
      if (msg.includes("Server error")) msg = t('serverError') || msg;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      width: '100%'
    }}>
      {/* Back to Home Mobile Only button would go here */}
      
      {/* Left Panel: Marketing (Hidden on Mobile) */}
      <div className="desktop-only" style={{
        flex: 1,
        background: 'var(--bg-sidebar)',
        padding: '60px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow Effects */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '400px',
          height: '400px',
          background: 'var(--brand-primary)',
          filter: 'blur(150px)',
          opacity: 0.15,
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <NavLink to="/" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            textDecoration: 'none', 
            color: 'var(--text-primary)',
            marginBottom: '60px'
          }}>
             <img 
               src="/logo.png" 
               alt="CodeAI Logo" 
               style={{
                 width: '40px',
                 height: '40px',
                 objectFit: 'contain'
               }} 
             />
             <span className="heading" style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.5px' }}>
               Code<span style={{ color: 'var(--brand-primary)' }}>AI</span>
             </span>
          </NavLink>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '24px', lineHeight: 1.2, color: 'var(--text-primary)' }}>
              {t('authTitleMain')} <br/> <span style={{ color: 'var(--brand-primary)' }}>{t('authTitleSub')}</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '40px', maxWidth: '450px' }}>
              {t('authSubtitle')}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <BenefitItem text={t('benefit1')} />
                <BenefitItem text={t('benefit2')} />
                <BenefitItem text={t('benefit3')} />
            </div>
          </motion.div>
        </div>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        background: 'transparent'
      }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="glass-card" 
          style={{ width: '100%', maxWidth: '450px', padding: '48px' }}
        >
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '8px', color: 'var(--text-main)' }}>
              {isLogin ? t('welcomeBack') : t('getStarted')}
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>
              {isLogin ? t('welcomeBack') : t('getStarted')}
            </p>
          </div>

          {error && (
            <div style={{
              padding: '12px 16px',
              background: 'rgba(234, 67, 53, 0.08)',
              border: '1px solid rgba(234, 67, 53, 0.2)',
              borderRadius: '8px',
              color: 'var(--danger)',
              fontSize: '0.85rem',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>⚠️</span> <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {!isLogin && (
              <>
                <div className="input-group">
                    <label style={labelStyle}>{t('fullName')}</label>
                    <div style={inputContainerStyle}>
                        <User size={18} style={iconStyle} />
                        <input 
                          type="text" 
                          placeholder="John Doe" 
                          style={inputStyle} 
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                    </div>
                </div>
              </>
            )}
            <div className="input-group">
                <label style={labelStyle}>{t('emailAddress')}</label>
                <div style={inputContainerStyle}>
                    <Mail size={18} style={iconStyle} />
                    <input 
                      type="email" 
                      placeholder="name@company.com" 
                      style={inputStyle} 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                </div>
            </div>
            <div className="input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={labelStyle}>{t('password')}</label>
                </div>
                <div style={inputContainerStyle}>
                    <Lock size={18} style={iconStyle} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      style={{...inputStyle, paddingRight: '48px'}} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <div 
                      style={{ position: 'absolute', right: '16px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </div>
                </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '14px', justifyContent: 'center' }}
              disabled={loading}
            >
              {loading ? t('processing') : (isLogin ? t('signIn') : t('createAccount'))}
            </button>
          </form>

          <p style={{ marginTop: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {isLogin ? t('dontHaveAccount') : t('alreadyHaveAccount')} {' '}
            <NavLink to={isLogin ? "/register" : "/login"} style={linkStyle}>
                 {isLogin ? t('signUp') : t('logIn')}
            </NavLink>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

const BenefitItem = ({ text }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <CheckCircle size={20} color="var(--accent)" />
        <span style={{ fontSize: '1rem', color: 'var(--text-main)', opacity: 0.9 }}>{text}</span>
    </div>
);

const labelStyle = {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: '600',
    marginBottom: '8px',
    color: 'var(--text-main)'
};

const inputContainerStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
};

const iconStyle = {
    position: 'absolute',
    left: '16px',
    color: 'var(--text-muted)'
};

const inputStyle = {
    width: '100%',
    padding: '12px 16px 12px 48px',
    background: 'var(--surface-sunken)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '10px',
    color: 'var(--text-main)',
    fontSize: '1rem',
    outline: 'none',
    transition: 'var(--transition)'
};

const linkStyle = {
    color: 'var(--primary)',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '0.85rem'
};

export default Auth;

import React, { useContext, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Settings as SettingsIcon,
  Palette,
  Globe,
  Camera,
  Trash2,
  Check,
  AlertTriangle,
  Mail,
  Shield,
  LogOut,
  Lock
} from 'lucide-react';
import { AppContext } from '../context/AppContext';
import ImageCropperModal from '../components/ImageCropperModal';

const Settings = () => {
  const { 
    user, 
    updateProfile, 
    uploadAvatar, 
    deleteAvatar,
    uploadCover,
    deleteCover,
    t, 
    language, 
    setLanguage, 
    theme, 
    setTheme, 
    logout,
    changePassword
  } = useContext(AppContext);

  const navigate = useNavigate();
  const routerLocation = useLocation();
  const activeTab = new URLSearchParams(routerLocation.search).get('tab') || 'profile';
  
  // Profile form states
  const [name, setName] = useState(user?.name || "");
  const [location, setLocation] = useState(user?.location || "");
  const [bio, setBio] = useState(user?.bio || "");
  
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showCoverMenu, setShowCoverMenu] = useState(false);
  
  // Feedback states
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [coverLoading, setCoverLoading] = useState(false);
  
  const [cropModalData, setCropModalData] = useState(null);
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const fileInputRef = useRef(null);
  const coverFileInputRef = useRef(null);

  if (!user) return null;

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 4000);
  };

  // Handle profile form save
  const handleProfileSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      await updateProfile({ name, location, bio });
      showSuccess(t('settingsSaved'));
    } catch (err) {
      showError(err.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showError(t('passwordsDoNotMatch') || "Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      showError(t('passwordTooShort') || "Password must be at least 6 characters");
      return;
    }
    setPasswordLoading(true);
    setErrorMsg("");
    try {
      await changePassword(currentPassword, newPassword);
      showSuccess(t('passwordChangedSuccess') || "Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      showError(err.message || "Failed to change password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  // Validate and read file as base64
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1. File type check
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showError(t('avatarUploadErrorFormat'));
      return;
    }

    // 2. File size check (2MB)
    if (file.size > 2 * 1024 * 1024) {
      showError(t('avatarUploadErrorSize'));
      return;
    }

    // 3. Read and open cropper
    setErrorMsg("");
    const reader = new FileReader();
    reader.onload = () => {
      setCropModalData({
        imageSrc: reader.result,
        aspect: 1,
        type: 'avatar'
      });
      e.target.value = null;
    };
    reader.onerror = () => {
      showError("Error reading file.");
      e.target.value = null;
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteAvatar = async () => {
    if (!window.confirm(t('resetConfirm') || "Are you sure?")) return;
    setAvatarLoading(true);
    try {
      await deleteAvatar();
      showSuccess(t('avatarDeleteSuccess'));
    } catch (err) {
      showError("Failed to delete avatar.");
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleCoverFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showError(t('avatarUploadErrorFormat') || "Incorrect format. Only JPG, JPEG, PNG, WEBP are supported.");
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      showError(t('coverUploadErrorSize') || "File size must be less than 4MB");
      return;
    }

    setErrorMsg("");
    const reader = new FileReader();
    reader.onload = () => {
      setCropModalData({
        imageSrc: reader.result,
        aspect: 3, // ~3:1 aspect ratio for banner
        type: 'cover'
      });
      e.target.value = null;
    };
    reader.onerror = () => {
      showError("Error reading file.");
      e.target.value = null;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCrop = async (croppedBase64) => {
    const { type } = cropModalData;
    setCropModalData(null);

    if (type === 'avatar') {
      setAvatarLoading(true);
      try {
        await uploadAvatar(croppedBase64);
        showSuccess(t('avatarUploadSuccess') || "Avatar updated successfully!");
      } catch (err) {
        showError(err.message || "Failed to upload avatar.");
      } finally {
        setAvatarLoading(false);
      }
    } else if (type === 'cover') {
      setCoverLoading(true);
      try {
        await uploadCover(croppedBase64);
        showSuccess(t('coverUploadSuccess') || "Cover photo updated successfully!");
      } catch (err) {
        showError(err.message || "Failed to upload cover photo.");
      } finally {
        setCoverLoading(false);
      }
    }
  };

  const handleDeleteCover = async () => {
    if (!window.confirm(t('resetConfirm') || "Are you sure?")) return;
    setCoverLoading(true);
    try {
      await deleteCover();
      showSuccess(t('coverDeleteSuccess') || "Cover photo removed successfully!");
    } catch (err) {
      showError("Failed to delete cover photo.");
    } finally {
      setCoverLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const getBaseUrl = () => {
    const url = import.meta.env.PROD ? '' : 'http://localhost:5000';
    return url.replace(/\/api$/, '');
  };
  const apiBase = getBaseUrl();
  const avatarUrl = user.avatar_url ? (user.avatar_url.startsWith('http') ? user.avatar_url : `${apiBase}${user.avatar_url}`) : null;
  const coverUrl = user.cover_url ? (user.cover_url.startsWith('http') ? user.cover_url : `${apiBase}${user.cover_url}`) : null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'transparent', color: 'var(--text-primary)' }}>
      <style>{`
        .settings-layout {
          display: flex;
          gap: 30px;
          padding: 40px 48px;
          flex-direction: row;
        }
        .settings-side-nav {
          width: 220px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex-shrink: 0;
        }
        @media (max-width: 767px) {
          .settings-layout {
            padding: 20px 16px 88px;
            flex-direction: column;
            gap: 20px;
          }
          .settings-side-nav {
            width: 100%;
            flex-direction: row;
            overflow-x: auto;
            padding-bottom: 4px;
            gap: 4px;
            scrollbar-width: none;
          }
          .settings-side-nav::-webkit-scrollbar { display: none; }
          .settings-side-nav button {
            flex-shrink: 0;
            white-space: nowrap;
            min-height: unset !important;
            padding: 8px 16px !important;
            font-size: 0.85rem !important;
          }
        }
      `}</style>
      <main className="animate-in settings-layout" style={{ flex: 1, width: '100%', boxSizing: 'border-box' }}>
        
        {/* Settings local navigation menu */}
        <div className="settings-side-nav">
          <h2 className="desktop-only" style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '20px', paddingLeft: '10px', color: 'var(--text-primary)' }}>
            {t('settings')}
          </h2>
          {[
            { id: 'profile', label: t('profileTab'), icon: <User size={18} /> },
            { id: 'preferences', label: t('preferencesTab'), icon: <Palette size={18} /> },
            { id: 'account', label: t('accountTab'), icon: <Lock size={18} /> }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => navigate(`/settings?tab=${tab.id}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive ? 'var(--brand-glow)' : 'transparent',
                  color: isActive ? 'var(--brand-primary)' : 'var(--text-muted)',
                  fontWeight: isActive ? '600' : '500',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s',
                  width: '100%'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--overlay-bg)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Content Area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Global Action Notifications */}
          <AnimatePresence>
            {successMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={toastSuccessStyle}
              >
                <Check size={18} /> {successMsg}
              </motion.div>
            )}
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={toastErrorStyle}
              >
                <AlertTriangle size={18} /> {errorMsg}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="glass-card" style={{ padding: '40px', minHeight: '400px', position: 'relative', width: '100%', boxSizing: 'border-box' }}>
            
            {/* PROFILE SETTINGS TAB */}
            {activeTab === 'profile' && (
              <div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '32px', textAlign: 'left', fontWeight: '700' }}>
                  {t('editProfileTitle')}
                </h3>
                
                {/* Avatar Uploader UI */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '36px' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      width: '96px',
                      height: '96px',
                      borderRadius: '50%',
                      background: 'var(--brand-primary)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '2rem',
                      overflow: 'hidden',
                      border: '3px solid var(--border-subtle)',
                      boxShadow: 'var(--card-shadow)'
                    }}>
                      {avatarLoading ? (
                        <div style={spinnerStyle} />
                      ) : avatarUrl ? (
                        <img src={avatarUrl} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        getInitials(user.name)
                      )}
                    </div>
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      title={t('changeAvatar')}
                      style={cameraBtnStyle}
                      disabled={avatarLoading}
                    >
                      <Camera size={16} />
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      style={{ display: 'none' }}
                      accept=".jpg,.jpeg,.png,.webp"
                    />
                  </div>

                  <div style={{ textAlign: 'left' }}>
                    <h4 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '4px', color: 'var(--text-primary)' }}>{user.name}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--brand-primary)', marginBottom: '16px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {user.role}
                    </p>
                    <div style={{ position: 'relative' }}>
                      <button 
                        type="button" 
                        className="btn btn-outline" 
                        style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                        onClick={() => setShowAvatarMenu(!showAvatarMenu)}
                        disabled={avatarLoading}
                      >
                        <SettingsIcon size={14} /> Настроить фото
                      </button>
                      
                      <AnimatePresence>
                        {showAvatarMenu && (
                          <motion.div 
                            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                            style={{ position: 'absolute', top: '100%', left: 0, marginTop: '8px', background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '6px', zIndex: 10, display: 'flex', flexDirection: 'column', minWidth: '180px', boxShadow: 'var(--dropdown-shadow)' }}
                          >
                            <button type="button" style={{ padding: '10px 12px', background: 'transparent', border: 'none', color: 'var(--text-primary)', textAlign: 'left', cursor: 'pointer', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background='var(--overlay-bg)'} onMouseOut={e => e.currentTarget.style.background='transparent'} onClick={() => { fileInputRef.current?.click(); setShowAvatarMenu(false); }}><Camera size={14} /> Загрузить новое</button>
                            {user.avatar_url && <button type="button" style={{ padding: '10px 12px', background: 'transparent', border: 'none', color: 'var(--danger)', textAlign: 'left', cursor: 'pointer', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background='rgba(234,67,53,0.08)'} onMouseOut={e => e.currentTarget.style.background='transparent'} onClick={() => { handleDeleteAvatar(); setShowAvatarMenu(false); }}><Trash2 size={14} /> Удалить фото</button>}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Cover Image Uploader UI */}
                <div style={{ marginBottom: '40px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      {t('coverPhoto') || 'Фото обложки профиля'}
                    </label>
                    
                    <div style={{ position: 'relative' }}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ padding: '6px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => setShowCoverMenu(!showCoverMenu)}
                        disabled={coverLoading}
                      >
                        <SettingsIcon size={14} /> Настроить
                      </button>
                      
                      <AnimatePresence>
                        {showCoverMenu && (
                          <motion.div 
                            initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                            style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: 'var(--surface-raised)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '6px', zIndex: 10, display: 'flex', flexDirection: 'column', minWidth: '180px', boxShadow: 'var(--dropdown-shadow)' }}
                          >
                            <button type="button" style={{ padding: '10px 12px', background: 'transparent', border: 'none', color: 'var(--text-primary)', textAlign: 'left', cursor: 'pointer', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background='var(--overlay-bg)'} onMouseOut={e => e.currentTarget.style.background='transparent'} onClick={() => { coverFileInputRef.current?.click(); setShowCoverMenu(false); }}><Camera size={14} /> Загрузить новую</button>
                            {user.cover_url && <button type="button" style={{ padding: '10px 12px', background: 'transparent', border: 'none', color: 'var(--danger)', textAlign: 'left', cursor: 'pointer', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background='rgba(234,67,53,0.08)'} onMouseOut={e => e.currentTarget.style.background='transparent'} onClick={() => { handleDeleteCover(); setShowCoverMenu(false); }}><Trash2 size={14} /> Удалить обложку</button>}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div style={{
                    width: '100%',
                    height: '160px',
                    borderRadius: '16px',
                    background: coverUrl ? `url(${coverUrl}) center/cover no-repeat` : 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))',
                    position: 'relative',
                    overflow: 'hidden',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--card-shadow)'
                  }}>
                    {coverLoading && <div style={spinnerStyle} />}
                    <input 
                      type="file" 
                      ref={coverFileInputRef} 
                      onChange={handleCoverFileChange} 
                      style={{ display: 'none' }}
                      accept=".jpg,.jpeg,.png,.webp"
                    />
                  </div>
                </div>

                {/* Profile Form Details */}
                <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
                  <div style={inputGroupStyle}>
                    <label style={labelStyle}>{t('yourName')}</label>
                    <input 
                      type="text" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      style={inputStyle} 
                      required 
                    />
                  </div>
                  <div style={inputGroupStyle}>
                    <label style={labelStyle}>{t('location')}</label>
                    <input 
                      type="text" 
                      value={location} 
                      onChange={(e) => setLocation(e.target.value)} 
                      style={inputStyle} 
                    />
                  </div>
                  <div style={inputGroupStyle}>
                    <label style={labelStyle}>{t('aboutMe')}</label>
                    <textarea 
                      value={bio} 
                      onChange={(e) => setBio(e.target.value)} 
                      style={{ ...inputStyle, height: '100px', resize: 'none' }} 
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button type="submit" className="btn btn-primary" style={{ padding: '12px 30px' }} disabled={loading}>
                      {loading ? t('processing') : t('save')}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* PREFERENCES SETTINGS TAB */}
            {activeTab === 'preferences' && (
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '32px', fontWeight: '700' }}>
                  {t('preferencesTab')}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                  
                  {/* Theme Select */}
                  <div style={prefRowStyle}>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)' }}>{t('theme') || "Тема оформления"}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('themeDesc') || "Настройте внешний вид приложения"}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <ThemeOption active={theme === 'light'} label={t('lightTheme')} onClick={() => setTheme('light')} />
                      <ThemeOption active={theme === 'dark'} label={t('darkTheme')} onClick={() => setTheme('dark')} />
                      <ThemeOption active={theme === 'system'} label={t('systemTheme')} onClick={() => setTheme('system')} />
                    </div>
                  </div>

                  {/* Language Select */}
                  <div style={prefRowStyle}>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)' }}>{t('interfaceLanguage') || "Язык интерфейса"}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('languageDesc') || "Измените язык интерфейса по умолчанию"}</p>
                    </div>
                    <select 
                      value={language} 
                      onChange={(e) => setLanguage(e.target.value)} 
                      style={selectStyle}
                    >
                      <option value="ru">Русский (RU)</option>
                      <option value="kz">Қазақша (KZ)</option>
                      <option value="en">English (EN)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ACCOUNT SETTINGS TAB */}
            {activeTab === 'account' && (
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '32px', fontWeight: '700' }}>
                  {t('accountTab')}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
                  <div style={infoRowStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Mail size={18} color="var(--text-muted)" />
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('emailAddress')}</span>
                    </div>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{user.email}</span>
                  </div>

                  <div style={infoRowStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Shield size={18} color="var(--text-muted)" />
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('role')}</span>
                    </div>
                    <span style={{ 
                      fontWeight: '600', 
                      color: 'var(--brand-primary)',
                      textTransform: 'uppercase',
                      background: 'var(--brand-glow)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.8rem'
                    }}>{user.role}</span>
                  </div>
                </div>

                {/* Change Password Form */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '30px', marginBottom: '40px' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                    <Lock size={18} color="var(--brand-primary)" />
                    {t('changePasswordTitle') || "Смена пароля"}
                  </h4>
                  
                  <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={inputGroupStyle}>
                      <label style={labelStyle}>{t('currentPassword') || "Текущий пароль"}</label>
                      <input 
                        type="password" 
                        value={currentPassword} 
                        onChange={(e) => setCurrentPassword(e.target.value)} 
                        style={inputStyle} 
                        required 
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div style={inputGroupStyle}>
                        <label style={labelStyle}>{t('newPassword') || "Новый пароль"}</label>
                        <input 
                          type="password" 
                          value={newPassword} 
                          onChange={(e) => setNewPassword(e.target.value)} 
                          style={inputStyle} 
                          required 
                        />
                      </div>
                      <div style={inputGroupStyle}>
                        <label style={labelStyle}>{t('confirmPassword') || "Подтвердите пароль"}</label>
                        <input 
                          type="password" 
                          value={confirmPassword} 
                          onChange={(e) => setConfirmPassword(e.target.value)} 
                          style={inputStyle} 
                          required 
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                      <button type="submit" className="btn btn-primary" style={{ padding: '12px 30px' }} disabled={passwordLoading}>
                        {passwordLoading ? t('processing') : (t('updatePassword') || "Обновить пароль")}
                      </button>
                    </div>
                  </form>
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '30px' }}>
                  <button 
                    onClick={logout} 
                    className="btn btn-outline" 
                    style={{ 
                      borderColor: 'var(--danger)', 
                      color: 'var(--danger)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      padding: '12px 24px',
                      background: 'transparent'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(234, 67, 53, 0.08)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <LogOut size={16} />
                    {t('logout')}
                  </button>
                </div>
              </div>
            )}
            
          </div>
        </div>
      </main>

      {cropModalData && (
        <ImageCropperModal
          imageSrc={cropModalData.imageSrc}
          aspect={cropModalData.aspect}
          title={cropModalData.type === 'avatar' ? 'Обрезать аватар' : 'Обрезать фон профиля'}
          onSave={handleSaveCrop}
          onCancel={() => setCropModalData(null)}
        />
      )}
    </div>
  );
};

// UI Subcomponents
const ThemeOption = ({ active, label, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: '8px 16px',
      borderRadius: '20px',
      background: active ? 'var(--brand-primary)' : 'transparent',
      border: `1px solid ${active ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
      color: active ? 'white' : 'var(--text-primary)',
      cursor: 'pointer',
      fontSize: '0.85rem',
      fontWeight: '600',
      transition: 'all 0.2s'
    }}
  >
    {label}
  </button>
);

// Styles
const inputGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
};

const labelStyle = {
  fontSize: '0.85rem',
  fontWeight: '600',
  color: 'var(--text-muted)'
};

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  background: 'var(--surface-sunken)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '10px',
  color: 'var(--text-primary)',
  outline: 'none',
  fontSize: '0.95rem',
  fontFamily: "'Inter', sans-serif",
  transition: 'border-color 0.2s',
  boxSizing: 'border-box'
};

const selectStyle = {
  padding: '10px 16px',
  background: 'var(--surface-sunken)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '10px',
  color: 'var(--text-primary)',
  outline: 'none',
  fontSize: '0.9rem',
  cursor: 'pointer',
  fontFamily: "'Inter', sans-serif"
};

const cameraBtnStyle = {
  position: 'absolute',
  bottom: '0',
  right: '0',
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  background: 'var(--brand-primary)',
  border: '2px solid var(--bg-card)',
  color: 'white',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  cursor: 'pointer',
  boxShadow: 'var(--card-shadow)',
  padding: 0
};

const prefRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid var(--border-subtle)',
  paddingBottom: '20px',
  flexWrap: 'wrap',
  gap: '16px'
};

const infoRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  background: 'var(--surface-sunken)',
  border: '1px solid var(--border-subtle)',
  padding: '16px 20px',
  borderRadius: '12px',
  flexWrap: 'wrap',
  gap: '16px'
};

const toastSuccessStyle = {
  position: 'fixed',
  top: '30px',
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'var(--success)',
  color: 'white',
  padding: '12px 24px',
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontWeight: '600',
  boxShadow: 'var(--dropdown-shadow)',
  zIndex: 100000,
  fontSize: '0.9rem'
};

const toastErrorStyle = {
  position: 'fixed',
  top: '30px',
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'var(--danger)',
  color: 'white',
  padding: '12px 24px',
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontWeight: '600',
  boxShadow: 'var(--dropdown-shadow)',
  zIndex: 100000,
  fontSize: '0.9rem'
};

const spinnerStyle = {
  width: '24px',
  height: '24px',
  border: '2px solid var(--border-subtle)',
  borderTopColor: 'var(--brand-primary)',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
};

export default Settings;

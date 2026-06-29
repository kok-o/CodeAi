import React, { useContext, useState, useEffect } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Award, 
  Clock, 
  Plus, 
  Send, 
  Search, 
  ShieldAlert, 
  UserCheck, 
  Sparkles, 
  ListTodo,
  TrendingUp,
  AlertCircle,
  Check,
  Zap,
  BookOpen
} from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { apiCall } from '../utils/api';

const AdminDashboard = () => {
  const { t } = useContext(AppContext);
  
  // Dashboard states
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'logs'
  const [usersList, setUsersList] = useState([]);
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Feedback states
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
 
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const usersData = await apiCall('/admin/users');
      setUsersList(usersData);
      
      const logsData = await apiCall('/admin/logs');
      setLogs(logsData);
    } catch (err) {
      setErrorMsg("Failed to load admin dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 4000);
  };

  // Change user role
  const handleRoleChange = async (userId, newRole) => {
    try {
      await apiCall(`/admin/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole })
      });
      showSuccess("User role updated successfully!");
      // Reload stats & users list
      fetchDashboardData();
    } catch (err) {
      showError(err.message || "Failed to update role.");
    }
  };

  // Toggle ban status
  const handleToggleBan = async (userId, currentBanStatus) => {
    try {
      await apiCall(`/admin/users/${userId}/ban`, {
        method: 'PUT',
        body: JSON.stringify({ ban: !currentBanStatus })
      });
      showSuccess(`Пользователь ${!currentBanStatus ? 'заблокирован' : 'разблокирован'} успешно!`);
      fetchDashboardData();
    } catch (err) {
      showError(err.message || "Не удалось изменить статус блокировки.");
    }
  };

  // Delete user
  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Вы уверены, что хотите удалить этого пользователя?")) return;
    try {
      await apiCall(`/admin/users/${userId}`, {
        method: 'DELETE'
      });
      showSuccess("Пользователь удален успешно!");
      fetchDashboardData();
    } catch (err) {
      showError(err.message || "Не удалось удалить пользователя.");
    }
  };

  // Filter users by search term
  const filteredUsers = usersList.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const apiBase = import.meta.env.PROD ? '' : 'http://localhost:5000';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
      
      <main style={{ flex: 1, padding: '40px' }}>
        
        {/* Admin Header */}
        <header style={{ 
            background: 'linear-gradient(135deg, var(--gradient-glow1), var(--gradient-glow2))',
            padding: '40px', 
            marginBottom: '30px', 
            textAlign: 'left',
            borderRadius: '24px',
            border: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '24px'
        }}>
            <div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '8px', color: 'var(--text-main)', fontFamily: "'Montserrat', sans-serif" }}>
                {t('adminDashboard')}
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>{t('adminUsers')}</p>
            </div>
        </header>

        {/* Global Feedback Notifications */}
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
              <AlertCircle size={18} /> {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Admin Navigation Tabs */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '30px' }}>
          <TabBtn active={activeTab === 'users'} label={t('adminUsers')} icon={<Users size={16} />} onClick={() => setActiveTab('users')} />
          <TabBtn active={activeTab === 'logs'} label={t('adminLogs')} icon={<ListTodo size={16} />} onClick={() => setActiveTab('logs')} />
        </div>

        {/* LOADING INDICATOR */}
        {loading && usersList.length === 0 && (
          <div style={{ padding: '80px', display: 'flex', justifyContent: 'center' }}>
            <div style={spinnerStyle} />
          </div>
        )}

        {/* DASHBOARD DETAILS TABS */}
        <div style={{ display: loading && usersList.length === 0 ? 'none' : 'block' }}>

          {/* USER MANAGEMENT PANEL */}
          {activeTab === 'users' && (
            <div className="glass-card" style={{ padding: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>Registered Accounts</h3>
                
                {/* Search box */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    placeholder={t('adminUserSearch')}
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    style={{ ...modalInputStyle, paddingLeft: '40px', width: '260px' }} 
                  />
                </div>
              </div>

              {/* Users table */}
              <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: 'var(--glass-bg)' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold', background: 'rgba(0,0,0,0.02)' }}>
                      <th style={{ padding: '16px 24px' }}>{t('adminUserTableId')}</th>
                      <th style={{ padding: '16px 24px' }}>{t('adminUserTableName')}</th>
                      <th style={{ padding: '16px 24px' }}>{t('adminUserTableEmail')}</th>
                      <th style={{ padding: '16px 24px' }}>{t('adminUserTableRole')}</th>
                      <th style={{ padding: '16px 24px', textAlign: 'center' }}>{t('adminUserTableActions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => {
                      const userAvatarUrl = u.avatar_url ? (u.avatar_url.startsWith('http') ? u.avatar_url : `${apiBase}${u.avatar_url}`) : null;
                      return (
                        <tr key={u.id} style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                          <td style={{ padding: '16px' }}>{u.id}</td>
                          <td style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: 'var(--primary)',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                fontSize: '0.7rem',
                                fontWeight: 'bold',
                                overflow: 'hidden',
                                flexShrink: 0
                              }}>
                                {userAvatarUrl ? (
                                  <img src={userAvatarUrl} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  getInitials(u.name)
                                )}
                              </div>
                              <span style={{ fontWeight: '500' }}>{u.name}</span>
                            </div>
                          </td>
                          <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{u.email}</td>
                          <td style={{ padding: '16px' }}>
                            <select 
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              style={{ ...selectStyle, padding: '4px 8px', borderRadius: '6px' }}
                            >
                              <option value="user">{t('adminRoleUser')}</option>
                              <option value="teacher">{t('adminRoleTeacher')}</option>
                              <option value="admin">{t('adminRoleAdmin')}</option>
                            </select>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                              <button 
                                onClick={() => handleToggleBan(u.id, u.is_banned)}
                                style={{
                                  background: u.is_banned ? 'var(--success)' : 'var(--danger)',
                                  border: 'none',
                                  color: 'white',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem',
                                  fontWeight: '600',
                                  transition: 'var(--transition)'
                                }}
                              >
                                {u.is_banned ? 'Разбанить' : 'Бан'}
                              </button>
                              <button 
                                onClick={() => handleDeleteUser(u.id)}
                                style={{
                                  background: 'rgba(234, 67, 53, 0.08)',
                                  border: '1px solid rgba(239, 68, 68, 0.2)',
                                  color: 'var(--danger)',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem',
                                  fontWeight: '600',
                                  transition: 'var(--transition)'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'var(--danger)';
                                  e.currentTarget.style.color = 'white';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'rgba(234, 67, 53, 0.08)';
                                  e.currentTarget.style.color = 'var(--danger)';
                                }}
                              >
                                Удалить
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* AUDIT LOG PANEL */}
          {activeTab === 'logs' && (
            <div className="glass-card" style={{ padding: '30px', textAlign: 'left' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '24px', fontWeight: '700', color: 'var(--text-main)', fontFamily: "'Montserrat', sans-serif" }}>Audit Logs</h3>
              <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--glass-bg)' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.85rem', background: 'rgba(0,0,0,0.02)' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left' }}>{t('adminUserTableId')}</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left' }}>{t('adminLogTableUser')}</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left' }}>{t('adminLogTableAction')}</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>{t('adminLogTableTime')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{log.id}</td>
                        <td style={{ padding: '16px', fontWeight: '600' }}>{log.admin_name}</td>
                        <td style={{ padding: '16px' }}>{log.action}</td>
                        <td style={{ padding: '16px', textAlign: 'right', color: 'var(--text-muted)' }}>
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

      </main>
    </div>
  );
};

// Internal Subcomponents
const TabBtn = ({ active, label, icon, onClick }) => (
  <button
    onClick={onClick}
    style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '12px 24px',
      borderRadius: '12px',
      background: active ? 'transparent' : 'var(--glass-card-bg)',
      border: `1px solid ${active ? 'transparent' : 'var(--glass-border)'}`,
      color: active ? 'white' : 'var(--text-main)',
      fontWeight: '600',
      fontSize: '0.9rem',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      overflow: 'hidden'
    }}
  >
    {active && (
      <motion.div 
        layoutId="activeTab"
        style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, var(--primary), var(--secondary))', zIndex: 0 }}
      />
    )}
    <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
        {icon}
        {label}
    </span>
  </button>
);

const StatCard = ({ title, value, icon, color }) => (
  <motion.div 
    whileHover={{ scale: 1.02, y: -4 }}
    style={{ 
        padding: '24px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '24px', 
        textAlign: 'left',
        background: 'var(--glass-card-bg)',
        borderRadius: '20px',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--glass-shadow)'
    }}
  >
    <div style={{
      width: '64px',
      height: '64px',
      borderRadius: '16px',
      background: `${color}15`,
      border: `1px solid ${color}30`,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      color: color,
      boxShadow: `0 0 20px ${color}10`
    }}>
      {React.cloneElement(icon, { size: 32 })}
    </div>
    <div>
      <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>{title}</div>
      <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-main)', fontFamily: "'Montserrat', sans-serif" }}>{value}</div>
    </div>
  </motion.div>
);

// Styles
const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '24px'
};

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

const modalInputStyle = {
  width: '100%',
  padding: '12px 16px',
  background: 'var(--input-bg)',
  border: '1px solid var(--glass-border)',
  borderRadius: '10px',
  color: 'var(--text-main)',
  outline: 'none',
  fontSize: '0.95rem',
  fontFamily: "'Inter', sans-serif",
  boxSizing: 'border-box'
};

const selectStyle = {
  width: '100%',
  padding: '12px 16px',
  background: 'var(--input-bg)',
  border: '1px solid var(--glass-border)',
  borderRadius: '10px',
  color: 'var(--text-main)',
  outline: 'none',
  fontSize: '0.9rem',
  cursor: 'pointer',
  fontFamily: "'Inter', sans-serif",
  boxSizing: 'border-box'
};

const toastSuccessStyle = {
  position: 'fixed',
  top: '30px',
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'rgba(52, 211, 153, 0.9)',
  border: '1px solid rgba(52, 211, 153, 0.3)',
  color: 'white',
  padding: '12px 24px',
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontWeight: '600',
  boxShadow: '0 10px 25px var(--dropdown-shadow)',
  zIndex: 100000,
  fontSize: '0.9rem'
};

const toastErrorStyle = {
  position: 'fixed',
  top: '30px',
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'rgba(239, 68, 68, 0.9)',
  border: '1px solid rgba(239, 68, 68, 0.3)',
  color: 'white',
  padding: '12px 24px',
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontWeight: '600',
  boxShadow: '0 10px 25px var(--dropdown-shadow)',
  zIndex: 100000,
  fontSize: '0.9rem'
};

const spinnerStyle = {
  width: '32px',
  height: '32px',
  border: '3px solid var(--overlay-bg-hover)',
  borderTopColor: 'var(--primary)',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
};

export default AdminDashboard;

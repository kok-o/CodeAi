import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Code2, Search, Filter, CheckCircle, Circle, Clock, Zap, Target, ChevronRight, Star, Lock, Unlock, Flame } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import { apiCall } from '../utils/api';
import Skeleton from '../components/Skeleton';

const Challenges = () => {
  const { user, t } = useContext(AppContext);
  const navigate = useNavigate();

  const tr = (k, fallback) => {
    const res = t(k);
    return res !== k ? res : fallback;
  };

  const tDiff = (d) => {
    if (!d) return '';
    const trans = t(d);
    if (trans && trans !== d) return trans;
    if (d.toLowerCase() === 'easy') return t('diffEasy') || 'Легкая';
    if (d.toLowerCase() === 'medium') return t('diffMedium') || 'Средняя';
    if (d.toLowerCase() === 'hard') return t('diffHard') || 'Сложная';
    return d.charAt(0).toUpperCase() + d.slice(1);
  };

  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [difficulty, setDifficulty] = useState('all');
  const [tab, setTab]           = useState('all'); // 'all' | 'solved' | 'unsolved'

  const [stats, setStats] = useState({ easy: 0, medium: 0, hard: 0, total: 0 });

  const DIFFICULTIES = [
    { id: 'all',    label: tr('allChallenges', 'Все задачи'), color: 'var(--brand-primary)' },
    { id: 'easy',   label: tDiff('easy'),       color: 'var(--success, #34d399)' },
    { id: 'medium', label: tDiff('medium'),     color: 'var(--warning)' },
    { id: 'hard',   label: tDiff('hard'),       color: 'var(--danger, #ef4444)' },
  ];

  const STATUS_ICONS = {
    accepted:    { icon: <CheckCircle size={18} />, color: 'var(--success, #34d399)', label: tr('solved', 'Решено') },
    wrong_answer:{ icon: <Clock size={18} />,       color: 'var(--warning)', label: tr('attempted', 'Попытка') },
    not_started: { icon: <Circle size={18} />,      color: 'rgba(255,255,255,0.2)', label: tr('notStarted', 'Не начато') },
  };

  const DIFF_COLORS = { easy: 'var(--success, #34d399)', medium: 'var(--warning)', hard: 'var(--danger, #ef4444)' };

  const loadChallenges = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (difficulty !== 'all') params.append('difficulty', difficulty);
      if (search) params.append('search', search);
      const data = await apiCall(`/challenges?${params.toString()}`);
      setChallenges(data);
      setStats({
        total:  data.filter(c => c.user_status === 'accepted').length,
        easy:   data.filter(c => c.user_status === 'accepted' && c.difficulty === 'easy').length,
        medium: data.filter(c => c.user_status === 'accepted' && c.difficulty === 'medium').length,
        hard:   data.filter(c => c.user_status === 'accepted' && c.difficulty === 'hard').length,
      });
    } catch (e) {
      console.error('Failed to load challenges:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadChallenges(); }, [difficulty, search]);

  const filtered = challenges.filter(c => {
    if (tab === 'solved')   return c.user_status === 'accepted';
    if (tab === 'unsolved') return c.user_status !== 'accepted';
    return true;
  });

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'transparent', overflow: 'hidden' }}>
      <style>{`
        .ch-card { 
          background: var(--overlay-bg); 
          border: 1px solid var(--overlay-bg); 
          border-radius: 16px; 
          padding: 20px 24px; 
          cursor: pointer; 
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); 
          display: flex; align-items: center; gap: 20px; 
          backdrop-filter: blur(20px); 
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 4px 15px var(--card-shadow);
        }
        .ch-card:hover { 
          background: var(--overlay-bg); 
          border-color: var(--overlay-bg-hover); 
          transform: translateY(-2px); 
          box-shadow: 0 8px 25px var(--dropdown-shadow), 0 0 15px var(--brand-glow); 
        }
        .diff-badge { 
          padding: 4px 12px; 
          border-radius: 20px; 
          font-size: 0.75rem; 
          font-weight: 700; 
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .filter-btn { 
          background: transparent; 
          border: none; 
          border-radius: 10px; 
          padding: 8px 16px; 
          font-size: 0.85rem; 
          cursor: pointer; 
          transition: all 0.2s; 
          color: var(--text-muted); 
          font-weight: 600; 
        }
        .filter-btn.active { 
          background: var(--overlay-bg); 
          color: var(--text-primary); 
          box-shadow: 0 2px 10px var(--card-shadow); 
        }
        .tab-btn { 
          background: transparent; 
          border: none; 
          padding: 8px 20px; 
          font-size: 0.9rem; 
          cursor: pointer; 
          color: var(--text-muted); 
          font-weight: 600; 
          border-radius: 10px; 
          transition: all 0.2s; 
        }
        .tab-btn.active { 
          background: var(--overlay-bg-hover); 
          color: var(--text-primary); 
        }
        .stat-card { 
          background: var(--overlay-bg); 
          border: 1px solid var(--overlay-bg); 
          border-radius: 16px; 
          padding: 20px 24px; 
          flex: 1; 
          backdrop-filter: blur(12px); 
          box-shadow: 0 4px 20px var(--overlay-bg-hover);
          transition: transform 0.2s;
        }
        .stat-card:hover { transform: translateY(-2px); }
        .ch-scroll::-webkit-scrollbar { width: 6px; }
        .ch-scroll::-webkit-scrollbar-track { background: transparent; }
        .ch-scroll::-webkit-scrollbar-thumb { background: var(--overlay-bg-hover); border-radius: 4px; }
      `}</style>

      <main className="animate-in ch-scroll" style={{ flex: 1, padding: '40px 48px 80px', overflowY: 'auto' }}>
        <div style={{ width: '100%' }}>

          {/* Header */}
          <div style={{ marginBottom: '36px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(99,102,241,0.25)' }}>
                <Code2 size={28} color="white" />
              </div>
              <div>
                <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-primary)', margin: 0 }}>
                  {tr('challengeBook', 'Задачник')}
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '4px' }}>{tr('practiceAlgSkills', 'Тренируй навыки решением реальных задач')}</p>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '36px' }}>
            {[
              { label: tr('totalSolved', 'Решено всего'), value: stats.total, color: 'var(--brand-primary)', icon: <Target size={20} /> },
              { label: tDiff('easy'),         value: stats.easy,   color: 'var(--success, #34d399)', icon: <Target size={20} /> },
              { label: tDiff('medium'),       value: stats.medium, color: 'var(--warning)', icon: <Target size={20} /> },
              { label: tDiff('hard'),         value: stats.hard,   color: 'var(--danger, #ef4444)', icon: <Target size={20} /> },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', color: s.color }}>
                  {s.icon}
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</span>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Filters & Tabs Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '20px' }}>
            {/* Search */}
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={tr('searchChallenges', "Поиск задач...")}
                style={{ width: '100%', paddingLeft: '44px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px', background: 'var(--overlay-bg)', border: '1px solid var(--overlay-bg)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s' }}
                onFocus={(e) => { e.target.style.background = 'var(--overlay-bg)'; e.target.style.borderColor = 'var(--brand-primary)'; }}
                onBlur={(e) => { e.target.style.background = 'var(--overlay-bg)'; e.target.style.borderColor = 'var(--overlay-bg)'; }}
              />
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              {/* Tabs Segmented Control */}
              <div style={{ display: 'inline-flex', background: 'var(--overlay-bg)', padding: '4px', borderRadius: '14px', border: '1px solid var(--overlay-bg)' }}>
                {[
                  { id: 'all',      label: `${tr('all', 'Все')} (${challenges.length})` },
                  { id: 'solved',   label: `${tr('solved', 'Решено')} (${challenges.filter(c => c.user_status === 'accepted').length})` },
                  { id: 'unsolved', label: `${tr('unsolved', 'Нерешённые')} (${challenges.filter(c => c.user_status !== 'accepted').length})` },
                ].map(t => (
                  <button key={t.id} className={`tab-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Difficulty filters */}
              <div style={{ display: 'inline-flex', background: 'var(--overlay-bg)', padding: '4px', borderRadius: '14px', border: '1px solid var(--overlay-bg)' }}>
                {DIFFICULTIES.map(d => (
                  <button key={d.id} className={`filter-btn ${difficulty === d.id ? 'active' : ''}`} onClick={() => setDifficulty(d.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {d.id !== 'all' && <Target size={16} color={d.color} />}
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Challenges List */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} height="88px" borderRadius="16px" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)', background: 'var(--overlay-bg)', borderRadius: '20px', border: '1px dashed var(--overlay-bg)' }}>
              <Code2 size={56} style={{ opacity: 0.15, marginBottom: '20px' }} />
              <p style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>{tr('noChallengesFound', 'Задачи не найдены')}</p>
              <p style={{ fontSize: '0.9rem', marginTop: '8px' }}>{tr('changeFilters', 'Попробуй изменить фильтры или параметры поиска')}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filtered.map((challenge, i) => {
                const statusInfo = STATUS_ICONS[challenge.user_status] || STATUS_ICONS['not_started'];
                const diffColor  = DIFF_COLORS[challenge.difficulty] || 'var(--brand-primary)';
                const acceptRate = challenge.total_attempts > 0
                  ? Math.round((parseInt(challenge.accepted_count) / parseInt(challenge.total_attempts)) * 100)
                  : null;

                return (
                  <motion.div key={challenge.id} className="ch-card"
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    onClick={() => navigate(`/challenges/${challenge.id}`)}>

                    {/* Status icon */}
                    <div style={{ color: statusInfo.color, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: 'var(--overlay-bg)', border: '1px solid var(--overlay-bg)' }}>
                      {statusInfo.icon}
                    </div>

                    {/* Title + tags */}
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ fontWeight: 700, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', color: 'var(--text-primary)' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>#{challenge.id}</span>
                        {tr(`challenge_${challenge.id}_title`, challenge.title)}
                        {challenge.user_status === 'accepted' && (
                          <span style={{ fontSize: '0.7rem', background: 'rgba(52,211,153,0.1)', color: 'var(--success, #34d399)', padding: '2px 8px', borderRadius: '8px', fontWeight: 800, border: '1px solid rgba(52,211,153,0.2)' }}>✓ {tr('solved', 'РЕШЕНО').toUpperCase()}</span>
                        )}
                      </div>
                      {challenge.tags?.length > 0 && (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {challenge.tags.slice(0, 4).map(tag => (
                            <span key={tag} style={{ fontSize: '0.75rem', background: 'var(--overlay-bg)', color: 'var(--text-muted)', padding: '3px 10px', borderRadius: '8px', border: '1px solid var(--overlay-bg)' }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Accept rate */}
                    {acceptRate !== null && (
                      <div style={{ textAlign: 'right', minWidth: '80px', flexShrink: 0, background: 'var(--overlay-bg)', padding: '6px 12px', borderRadius: '10px', border: '1px solid var(--overlay-bg)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>{tr('acceptRate', 'Принято')}</div>
                        <div style={{ fontWeight: 800, color: acceptRate > 50 ? 'var(--success, #34d399)' : 'var(--warning)', fontSize: '0.95rem' }}>{acceptRate}%</div>
                      </div>
                    )}

                    {/* Difficulty badge */}
                    <div className="diff-badge" style={{ color: diffColor, background: `color-mix(in srgb, ${diffColor} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${diffColor} 20%, transparent)`, flexShrink: 0 }}>
                      {tDiff(challenge.difficulty)}
                    </div>

                    <ChevronRight size={20} style={{ color: 'var(--text-muted)', flexShrink: 0, opacity: 0.5 }} />
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Challenges;

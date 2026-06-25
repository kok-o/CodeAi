import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Send, Sparkles, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, RotateCcw, Eye, EyeOff, Terminal, List, MessageSquare, History } from 'lucide-react';
import MonacoEditor from '../components/MonacoEditor';
import { AppContext } from '../context/AppContext';
import { WorkspaceContext } from '../context/WorkspaceContext';
import { apiCall } from '../utils/api';

import ModelSelector from '../components/ModelSelector';
import useAiStream from '../hooks/useAiStream';

const LANGUAGES = [
  { id: 'python',     label: 'Python',     icon: '🐍' },
  { id: 'javascript', label: 'JavaScript', icon: '⚡' },
  { id: 'csharp',     label: 'C#',         icon: '🔷' },
  { id: 'java',       label: 'Java',       icon: '☕' },
  { id: 'cpp',        label: 'C++',        icon: '⚙️' },
];

const STATUS_CONFIG = {
  accepted:      { label: '✅ Принято',          color: 'var(--success)', bg: 'rgba(52,211,153,0.1)' },
  wrong_answer:  { label: '❌ Неверный ответ',   color: 'var(--danger)', bg: 'rgba(248,113,113,0.1)' },
  runtime_error: { label: '💥 Ошибка выполнения',color: 'var(--danger)', bg: 'rgba(248,113,113,0.1)' },
  compile_error: { label: '🔧 Ошибка компиляции',color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  time_limit:    { label: '⏱️ Превышен лимит',   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  not_started:   { label: '○ Не начато',         color: '#475569', bg: 'transparent' },
};

const DIFF_COLORS = { easy: 'var(--success)', medium: '#f59e0b', hard: 'var(--danger)' };

const ChallengeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, t } = useContext(AppContext);
  const { setTriggerAiChat, setShowSecondarySideBar } = useContext(WorkspaceContext);

  const [challenge, setChallenge] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  const tr = (k, fallback) => {
    const res = t(k);
    return res !== k ? res : fallback;
  };

  const tDiff = (d) => {
    if (!d) return '';
    if (d.toLowerCase() === 'easy') return t('diffEasy') || 'Легкая';
    if (d.toLowerCase() === 'medium') return t('diffMedium') || 'Средняя';
    if (d.toLowerCase() === 'hard') return t('diffHard') || 'Сложная';
    return d.charAt(0).toUpperCase() + d.slice(1);
  };

  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('# Напиши своё решение здесь\n');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [leftTab, setLeftTab] = useState('problem'); // 'problem' | 'examples' | 'hints' | 'attempts'

  // AI removed
  const showAi = false;

  const loadChallenge = async () => {
    setLoading(true);
    try {
      const [ch, att] = await Promise.all([
        apiCall(`/challenges/${id}`),
        apiCall(`/challenges/${id}/attempts`)
      ]);
      setChallenge(ch);
      setAttempts(att);
      if (att.length > 0) {
        setCode(att[0].code || '# Напиши своё решение здесь\n');
        setLanguage(att[0].language || 'python');
      }
      // AI message removed
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadChallenge(); }, [id]);

  const handleSubmit = async () => {
    if (isSubmitting || !code.trim()) return;
    setIsSubmitting(true);
    setResult(null);
    try {
      const data = await apiCall(`/challenges/${id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ code, language })
      });
      setResult(data);
      // Reload attempts
      const att = await apiCall(`/challenges/${id}/attempts`);
      setAttempts(att);
      
      // Auto-trigger AI on code submission
      setShowSecondarySideBar(true);
      setTriggerAiChat({
        role: 'user',
        content: `Я только что отправил решение к задачке "${challenge.title}" на языке ${language}.\n\nМой код:\n\`\`\`${language}\n${code}\n\`\`\`\n\nРезультат выполнения системы: ${data.status === 'accepted' ? 'Принято!' : 'Ошибка/Неверный ответ.'}\n\nПожалуйста, проанализируй моё решение с учетом условия задачи:\n${challenge.description}\n\nОбъясни ошибки, если они есть, или подскажи, как улучшить код (если принято).`,
        autoSubmit: true
      });
      
    } catch (e) {
      setResult({ error: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // AI logic removed

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-workspace)' }}>
        
        <main style={{ flex: 1, paddingLeft: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid var(--brand-glow)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </main>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-workspace)' }}>
        
        <main style={{ flex: 1, paddingLeft: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Задача не найдена</p>
          <button onClick={() => navigate('/challenges')} style={{ background: 'var(--primary)', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer' }}>
            ← К задачнику
          </button>
        </main>
      </div>
    );
  }

  const diffColor = DIFF_COLORS[challenge.difficulty] || 'var(--brand-primary)';

  return (
    <div style={{ display: 'flex', height: '100%', background: 'transparent', overflow: 'hidden' }}>
      
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .ch-tab { background: none; border: none; padding: 8px 16px; color: var(--text-muted); cursor: pointer; font-size: 0.85rem; font-weight: 600; border-bottom: 2px solid transparent; transition: all 0.15s; display: flex; align-items: center; gap: 6px; }
        .ch-tab.active { color: var(--brand-primary); border-bottom-color: var(--brand-primary); }
        .ch-btn { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 8px; color: var(--text-primary); cursor: pointer; display: flex; align-items: center; gap: 6px; padding: 7px 14px; font-size: 0.85rem; font-weight: 500; transition: all 0.15s; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
        .ch-btn:hover { background: var(--bg-card-hover); border-color: var(--border-accent); }
        .ch-btn-primary { background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary)); border: none; color: white; }
        .ch-btn-primary:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 4px 15px var(--brand-glow); }
        .test-result-pass { border-left: 3px solid var(--success); }
        .test-result-fail { border-left: 3px solid var(--danger); }
        .ai-msg-ai { align-self: flex-start; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 4px 16px 16px 16px; color: var(--text-primary); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
        .ai-msg-user { align-self: flex-end; background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary)); border-radius: 16px 16px 4px 16px; color: white; }
      `}</style>

      <main className="animate-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingLeft: 0, height: '100%', overflow: 'hidden' }}>

        {/* ── TOP BAR ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid var(--overlay-bg)', background: 'var(--bg-card)', flexShrink: 0, gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="ch-btn" style={{ padding: '6px 12px' }} onClick={() => navigate('/challenges')}>
              <ArrowLeft size={14} /> Назад
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '1rem' }}>#{challenge.id}. {tr(`challenge_${challenge.id}_title`, challenge.title)}</span>
              <span style={{ background: `rgba(${diffColor.replace('#','').match(/../g).map(h=>parseInt(h,16)).join(',')}, 0.15)`, color: diffColor, padding: '2px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                {tDiff(challenge.difficulty)}
              </span>
            </div>
          </div>


        </div>

        {/* ── MAIN SPLIT VIEW ── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* ── LEFT: Problem description ── */}
          <div style={{ width: '420px', minWidth: '320px', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--overlay-bg)', overflow: 'hidden' }}>

            {/* Left tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--overlay-bg)', padding: '0 4px', flexShrink: 0 }}>
              {[
                { id: 'problem',  label: 'Условие',  icon: <List size={13} /> },
                { id: 'attempts', label: `История (${attempts.length})`, icon: <History size={13} /> },
              ].map(t => (
                <button key={t.id} className={`ch-tab ${leftTab === t.id ? 'active' : ''}`} onClick={() => setLeftTab(t.id)}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {/* Left content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {leftTab === 'problem' && (
                <>
                  {/* Tags */}
                  {challenge.tags?.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                      {challenge.tags.map(tag => (
                        <span key={tag} style={{ fontSize: '0.75rem', background: 'var(--brand-glow)', color: 'var(--brand-primary)', padding: '3px 10px', borderRadius: '10px', border: '1px solid var(--brand-glow)' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Description */}
                  <div style={{ fontSize: '0.9rem', lineHeight: 1.8, color: 'var(--text-main)', whiteSpace: 'pre-wrap', marginBottom: '24px' }}>
                    {tr(`challenge_${challenge.id}_desc`, challenge.description)}
                  </div>

                  {/* Examples */}
                  {challenge.examples?.length > 0 && (
                    <>
                      <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Примеры</h3>
                      {challenge.examples.map((ex, i) => (
                        <div key={i} style={{ marginBottom: '16px', background: 'var(--overlay-bg)', border: '1px solid var(--overlay-bg)', borderRadius: '10px', overflow: 'hidden' }}>
                          <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--overlay-bg)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Пример {i+1}</div>
                          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {ex.input !== undefined && (
                              <div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Ввод: </span>
                                <code style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--brand-primary)' }}>{ex.input}</code>
                              </div>
                            )}
                            {ex.output !== undefined && (
                              <div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Вывод: </span>
                                <code style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--success)' }}>{ex.output}</code>
                              </div>
                            )}
                            {ex.explanation && (
                              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>💡 {ex.explanation}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {/* Skills */}
                  {challenge.skills?.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Навыки</div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {challenge.skills.map(s => (
                          <span key={s} style={{ fontSize: '0.75rem', background: 'rgba(52,211,153,0.1)', color: 'var(--success)', padding: '3px 10px', borderRadius: '10px', border: '1px solid rgba(52,211,153,0.2)' }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Hint Buttons removed */}
                </>
              )}

              {leftTab === 'attempts' && (
                <>
                  {attempts.length === 0
                    ? <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      <History size={36} style={{ opacity: 0.2, marginBottom: '12px' }} />
                      <p>Нет попыток. Напиши код и нажми «Отправить»!</p>
                    </div>
                    : attempts.map((att, i) => {
                      const statusConf = STATUS_CONFIG[att.status] || STATUS_CONFIG['not_started'];
                      return (
                        <div key={att.id} style={{ marginBottom: '12px', background: 'var(--overlay-bg)', border: '1px solid var(--overlay-bg)', borderRadius: '10px', overflow: 'hidden' }}>
                          <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: statusConf.bg, borderBottom: '1px solid var(--overlay-bg)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ color: statusConf.color, fontWeight: 700, fontSize: '0.85rem' }}>{statusConf.label}</span>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Попытка #{att.attempt_num}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              <span>{LANGUAGES.find(l => l.id === att.language)?.icon} {att.language}</span>
                              <span>{att.runtime_ms}ms</span>
                            </div>
                          </div>
                          <div style={{ padding: '10px 14px' }}>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                              {new Date(att.created_at).toLocaleString('ru')}
                            </div>
                            {att.stderr && (
                              <pre style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--danger)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'rgba(248,113,113,0.05)', padding: '8px', borderRadius: '6px', margin: 0 }}>
                                {att.stderr}
                              </pre>
                            )}
                            <button className="ch-btn" style={{ marginTop: '8px', fontSize: '0.78rem', padding: '5px 12px' }}
                              onClick={() => { setCode(att.code || ''); setLanguage(att.language || 'python'); }}>
                              <RotateCcw size={11} /> Загрузить этот код
                            </button>
                          </div>
                        </div>
                      );
                    })
                  }
                </>
              )}
            </div>

            {/* Result panel */}
            <AnimatePresence>
              {result && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  style={{ flexShrink: 0, borderTop: '1px solid var(--overlay-bg)', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px' }}>
                    {result.error
                      ? <div style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>❌ {result.error}</div>
                      : (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            {result.status === 'accepted'
                              ? <CheckCircle size={20} color="#34d399" />
                              : <XCircle size={20} color="#f87171" />
                            }
                            <span style={{ fontWeight: 700, color: result.status === 'accepted' ? 'var(--success)' : 'var(--danger)' }}>
                              {STATUS_CONFIG[result.status]?.label || result.status}
                            </span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Попытка #{result.attempt_num}</span>
                          </div>

                          {result.results?.map((r, i) => (
                            <div key={i} className={r.passed ? 'test-result-pass' : 'test-result-fail'}
                              style={{ padding: '8px 12px', marginBottom: '6px', background: r.passed ? 'rgba(52,211,153,0.05)' : 'rgba(248,113,113,0.05)', borderRadius: '0 8px 8px 0' }}>
                              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: r.passed ? 'var(--success)' : 'var(--danger)', marginBottom: r.passed ? 0 : '4px' }}>
                                {r.passed ? '✓' : '✗'} Тест {i+1}
                              </div>
                              {!r.passed && r.stderr && (
                                <pre style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--danger)', margin: 0, whiteSpace: 'pre-wrap' }}>{r.stderr}</pre>
                              )}
                              {!r.passed && !r.stderr && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  Ожидалось: <code style={{ color: 'var(--success)' }}>{r.expected}</code> | Получено: <code style={{ color: 'var(--danger)' }}>{r.stdout || r.stderr || r.error || '(ничего)'}</code>
                                </div>
                              )}
                            </div>
                          ))}
                        </>
                      )
                    }
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── CENTER/RIGHT: Monaco Editor ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '20px', background: 'var(--bg-workspace)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border-subtle)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', height: '100%' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--surface-sunken)', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                    main.{language === 'python' ? 'py' : language === 'javascript' ? 'js' : language === 'java' ? 'java' : language === 'cpp' ? 'cpp' : 'cs'}
                  </span>
                  <select 
                    value={language} 
                    onChange={e => setLanguage(e.target.value)} 
                    style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '4px 8px', fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.icon} {l.label}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="ch-btn" style={{ padding: '6px 12px', fontSize: '0.8rem', height: 'auto', background: 'transparent', border: '1px solid var(--border-subtle)' }} onClick={() => setCode('# Напиши своё решение здесь\n')}>
                    <RotateCcw size={14} /> Сбросить
                  </button>
                  <button className="ch-btn ch-btn-primary" style={{ padding: '6px 16px', fontSize: '0.85rem', height: 'auto' }} onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting 
                      ? <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> 
                      : <Play size={14} fill="white" />
                    } 
                    Отправить
                  </button>
                </div>
              </div>

              <div style={{ flex: 1, overflow: 'hidden' }}>
                <MonacoEditor
                  code={code}
                  onChange={val => setCode(val || '')}
                  language={language}
                  height="100%"
                  fontSize={14}
                />
              </div>
            </div>
          </div>

          {/* AI PANEL removed */}
        </div>
      </main>
    </div>
  );
};

export default ChallengeDetail;

import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Code2, BarChart2, GraduationCap,
  CheckCircle, AlertTriangle, Plus, Play, Save, X,
  Upload, Info, FileCode, Eye, TrendingDown, Terminal,
  Users, Layers
} from 'lucide-react';
import { AppContext } from '../context/AppContext';
import CourseBuilderTab from './teacher/CourseBuilderTab';
import { apiCall } from '../utils/api';
import './teacher/TeacherStudio.css';

/* ─────────────────────────────────────────────────────────
   TABS CONFIG
───────────────────────────────────────────────────────── */
const TABS = [
  { id: 'courses',    label: 'Курсы',     icon: <BookOpen size={17} /> },
  { id: 'challenges', label: 'Задачи',    icon: <Code2 size={17} /> },
  { id: 'analytics', label: 'Аналитика', icon: <BarChart2 size={17} /> },
];

const LANG_OPTIONS = [
  { id: 'python',     label: 'Python',     icon: '🐍' },
  { id: 'javascript', label: 'JavaScript', icon: '⚡' },
  { id: 'csharp',     label: 'C#',         icon: '🔷' },
  { id: 'java',       label: 'Java',       icon: '☕' },
  { id: 'cpp',        label: 'C++',        icon: '⚙️' },
];

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════ */
const TeacherStudio = () => {
  const { user } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('courses');
  const [toast, setToast] = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <div className="ts-page">
      <main className="ts-main">
        {/* ── HEADER ── */}
        <div className="ts-header">
          <div className="ts-header__inner">
            <div className="ts-header__icon">
              <GraduationCap size={24} color="white" />
            </div>
            <div>
              <h1 className="ts-header__title">Teacher Studio</h1>
              <p className="ts-header__subtitle">Создавай курсы, задачи и отслеживай прогресс студентов</p>
            </div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="ts-tabs">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`ts-tab ${activeTab === tab.id ? 'ts-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="ts-content">
          {/* ── TOAST ── */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className={`ts-toast ts-toast--${toast.type}`}
              >
                {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                {toast.msg}
              </motion.div>
            )}
          </AnimatePresence>

          {activeTab === 'courses'    && <CourseBuilderTab showToast={showToast} />}
          {activeTab === 'challenges' && <ChallengesTab showToast={showToast} />}
          {activeTab === 'analytics'  && <AnalyticsTab />}
        </div>
      </main>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   TAB 2: CHALLENGES
═══════════════════════════════════════════════════════ */
const ChallengesTab = ({ showToast }) => {
  const [challenges, setChallenges]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showForm, setShowForm]         = useState(false);
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [publishingId, setPublishingId] = useState(null);
  const [expandedId, setExpandedId]     = useState(null);
  const [judgeResults, setJudgeResults] = useState(null);

  const [title, setTitle]               = useState('');
  const [difficulty, setDifficulty]     = useState('easy');
  const [description, setDescription]   = useState('');
  const [tags, setTags]                 = useState('');
  const [skills, setSkills]             = useState('');
  const [lang, setLang]                 = useState('python');
  const [testCasesRaw, setTestCasesRaw] = useState('[\n  { "stdin": "5", "expected_stdout": "25" }\n]');
  const [solutionCode, setSolutionCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => { loadChallenges(); }, []);

  const loadChallenges = async () => {
    setLoading(true);
    try { setChallenges(await apiCall('/teacher/challenges')); }
    catch { /* noop */ }
    finally { setLoading(false); }
  };

  const handleTestSolution = async () => {
    if (!solutionCode.trim()) { showToast('error', 'Введи эталонное решение'); return; }
    let tc;
    try { tc = JSON.parse(testCasesRaw); } catch { showToast('error', 'Неверный JSON'); return; }
    setIsTestingAll(true);
    setJudgeResults(null);
    const results = [];
    for (const t of tc) {
      try {
        const res = await apiCall('/execute', { method: 'POST', body: JSON.stringify({ language: lang, code: solutionCode, stdin: t.stdin || '', context: 'teacher_test' }) });
        const stdout = (res.stdout || '').trim();
        const expected = (t.expected_stdout || '').trim();
        results.push({ stdin: t.stdin, expected, stdout, passed: stdout === expected && res.exit_code === 0, stderr: res.stderr, time_ms: res.time_ms });
      } catch (e) { results.push({ stdin: t.stdin, error: e.message, passed: false }); }
    }
    setJudgeResults(results);
    setIsTestingAll(false);
    const allPass = results.every(r => r.passed);
    showToast(allPass ? 'success' : 'error', allPass ? `✅ Все ${results.length} тестов прошли!` : `❌ ${results.filter(r => !r.passed).length} тестов не прошли`);
  };

  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    let tc;
    try { tc = JSON.parse(testCasesRaw); } catch { showToast('error', 'Неверный JSON'); return; }
    setIsSubmitting(true);
    try {
      const ch = await apiCall('/challenges', {
        method: 'POST',
        body: JSON.stringify({
          title, difficulty, description,
          test_cases: tc,
          tags: tags.split(',').map(s => s.trim()).filter(Boolean),
          skills: skills.split(',').map(s => s.trim()).filter(Boolean),
        })
      });
      if (solutionCode.trim()) {
        await apiCall(`/challenges/${ch.id}/solutions`, { method: 'POST', body: JSON.stringify({ language: lang, solution_code: solutionCode }) });
      }
      showToast('success', `Задача "${title}" создана!`);
      setShowForm(false);
      setTitle(''); setDescription(''); setSolutionCode(''); setJudgeResults(null);
      await loadChallenges();
    } catch (err) { showToast('error', err.message); }
    finally { setIsSubmitting(false); }
  };

  const handleTogglePublish = async (ch) => {
    setPublishingId(ch.id);
    try {
      await apiCall(`/challenges/${ch.id}/publish`, { method: 'PUT', body: JSON.stringify({ is_published: !ch.is_published }) });
      showToast('success', ch.is_published ? 'Задача скрыта' : 'Задача опубликована!');
      await loadChallenges();
    } catch (err) { showToast('error', err.message); }
    finally { setPublishingId(null); }
  };

  const inputStyle = { width: '100%', padding: '12px 16px', background: 'var(--overlay-bg)', border: '1px solid var(--border-subtle)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s', fontFamily: 'inherit' };

  return (
    <div>
      <div className="ts-challenges-header">
        <div>
          <h2 className="ts-challenges-title">Конструктор задач</h2>
          <p className="ts-challenges-subtitle">Создай задачу, добавь тест-кейсы, протестируй решение через Judge System</p>
        </div>
        <button className="ts-btn ts-btn--primary" onClick={() => setShowForm(s => !s)}>
          <Plus size={16} /> {showForm ? 'Свернуть' : 'Создать задачу'}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="ts-card"
            style={{ padding: '28px', marginBottom: '28px' }}
          >
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '22px' }}>Новая задача</h3>
            <form onSubmit={handleCreateChallenge}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label className="ts-label">Название задачи *</label>
                  <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="Сумма двух чисел" style={inputStyle} />
                </div>
                <div>
                  <label className="ts-label">Сложность</label>
                  <select value={difficulty} onChange={e => setDifficulty(e.target.value)} style={inputStyle}>
                    <option value="easy">🟢 Easy</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="hard">🔴 Hard</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="ts-label">Условие задачи *</label>
                <textarea required value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Подробно опиши задачу..." style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label className="ts-label">Теги (через запятую)</label>
                  <input value={tags} onChange={e => setTags(e.target.value)} placeholder="Python, Beginner, Loops" style={inputStyle} />
                </div>
                <div>
                  <label className="ts-label">Навыки (через запятую)</label>
                  <input value={skills} onChange={e => setSkills(e.target.value)} placeholder="Arrays, Loops" style={inputStyle} />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="ts-label">Тест-кейсы (JSON)</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', padding: '8px 12px', background: 'var(--brand-glow)', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.12)' }}>
                  <Info size={14} color="var(--brand-primary)" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <span style={{ fontSize: '0.78rem', color: 'var(--brand-primary)' }}>
                    Формат: {`[{ "stdin": "ввод", "expected_stdout": "ожидаемый_вывод" }]`}
                  </span>
                </div>
                <textarea value={testCasesRaw} onChange={e => setTestCasesRaw(e.target.value)}
                  style={{ ...inputStyle, minHeight: '110px', resize: 'vertical', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.83rem' }} />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="ts-label" style={{ margin: 0 }}>Эталонное решение ({lang})</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select value={lang} onChange={e => setLang(e.target.value)} style={{ ...inputStyle, padding: '5px 10px', width: 'auto' }}>
                      {LANG_OPTIONS.map(l => <option key={l.id} value={l.id}>{l.icon} {l.label}</option>)}
                    </select>
                    <button type="button" className="ts-btn ts-btn--primary ts-btn--sm" onClick={handleTestSolution} disabled={isTestingAll}>
                      {isTestingAll ? <span className="ts-spinner ts-spinner--white" /> : <Play size={13} fill="white" />}
                      Тест Judge
                    </button>
                  </div>
                </div>
                <textarea value={solutionCode} onChange={e => setSolutionCode(e.target.value)}
                  placeholder={`# Напиши эталонное решение\na, b = map(int, input().split())\nprint(a + b)`}
                  style={{ ...inputStyle, minHeight: '130px', resize: 'vertical', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem' }} />
              </div>

              <AnimatePresence>
                {judgeResults && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="ts-label">Результаты Judge System</div>
                    {judgeResults.map((r, i) => (
                      <div key={i} style={{ padding: '10px 14px', borderRadius: '8px', background: r.passed ? 'rgba(52,211,153,0.06)' : 'rgba(234,67,53,0.08)', border: `1px solid ${r.passed ? 'rgba(52,211,153,0.2)' : 'rgba(239,68,68,0.2)'}`, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, color: r.passed ? 'var(--success)' : 'var(--danger)', fontSize: '0.85rem' }}>
                            {r.passed ? '✓' : '✗'} Тест {i + 1} {r.time_ms ? `(${r.time_ms}ms)` : ''}
                          </span>
                        </div>
                        {!r.passed && (
                          <div style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {r.stdin && <span>stdin: <code style={{ color: 'var(--brand-primary)' }}>{r.stdin}</code></span>}
                            <span>Ожидалось: <code style={{ color: 'var(--success)' }}>{r.expected}</code> | Получено: <code style={{ color: 'var(--danger)' }}>{r.stdout || r.stderr || r.error}</code></span>
                          </div>
                        )}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="ts-btn" onClick={() => setShowForm(false)}>Отмена</button>
                <button type="submit" className="ts-btn ts-btn--primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Создание...' : <><Save size={15} /> Создать задачу</>}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="ts-card ts-skeleton" style={{ height: '70px' }} />
          ))}
        </div>
      ) : challenges.length === 0 ? (
        <div className="ts-card ts-empty">
          <Code2 size={48} style={{ opacity: 0.15, marginBottom: '16px' }} />
          <p>Задач ещё нет. Создай первую!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {challenges.map(ch => (
            <div key={ch.id}>
              <div
                className="ts-card ts-card--hoverable"
                style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}
                onClick={() => setExpandedId(expandedId === ch.id ? null : ch.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                  <span className={`ts-difficulty-badge ts-difficulty-badge--${ch.difficulty}`}>
                    {ch.difficulty?.toUpperCase()}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{ch.title}</span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                      {parseInt(ch.total_attempts) || 0} попыток · {parseInt(ch.accepted_count) || 0} решений
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                  <span className={`ts-publish-badge ${ch.is_published ? 'ts-publish-badge--live' : 'ts-publish-badge--draft'}`}>
                    {ch.is_published ? '● Опубликовано' : '○ Черновик'}
                  </span>
                  <button
                    className={`ts-btn ts-btn--sm ${ch.is_published ? 'ts-btn--danger' : 'ts-btn--primary'}`}
                    onClick={e => { e.stopPropagation(); handleTogglePublish(ch); }}
                    disabled={publishingId === ch.id}
                  >
                    {publishingId === ch.id ? '...' : ch.is_published ? 'Скрыть' : <><Upload size={12} /> Публиковать</>}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {expandedId === ch.id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden', marginTop: '2px' }}>
                    <div className="ts-card" style={{ padding: '16px 20px', borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTop: 'none' }}>
                      <div className="ts-label" style={{ marginBottom: '10px' }}>Тест-кейсы</div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {(ch.test_cases || []).slice(0, 5).map((tc, i) => (
                          <div key={i} style={{ padding: '7px 12px', background: 'var(--overlay-bg)', border: '1px solid var(--overlay-bg)', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            <span style={{ color: 'var(--brand-primary)' }}>in: {String(tc.stdin || '—')}</span>
                            <span style={{ margin: '0 6px' }}>→</span>
                            <span style={{ color: 'var(--success)' }}>out: {String(tc.expected_stdout || '—')}</span>
                          </div>
                        ))}
                        {(ch.test_cases || []).length > 5 && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '7px' }}>+{ch.test_cases.length - 5} ещё</span>}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   TAB 3: ANALYTICS
═══════════════════════════════════════════════════════ */
const AnalyticsTab = () => {
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [attempts, setAttempts]     = useState([]);
  const [loadingAtt, setLoadingAtt] = useState(false);

  React.useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    setLoading(true);
    try { setStats(await apiCall('/teacher/stats')); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadAttempts = async (challengeId) => {
    setSelectedChallenge(challengeId);
    setLoadingAtt(true);
    try { setAttempts(await apiCall(`/challenges/${challengeId}/all-attempts`)); }
    catch (e) { console.error(e); }
    finally { setLoadingAtt(false); }
  };

  if (loading) return (
    <div className="ts-stats-grid">
      {[...Array(4)].map((_, i) => <div key={i} className="ts-stat-card ts-skeleton" style={{ height: '100px' }} />)}
    </div>
  );

  const challengeStats = stats?.challenge_stats || [];
  const courseStats = stats?.course_stats || [];
  const hardestChallenges = [...challengeStats].sort((a, b) => b.fail_rate - a.fail_rate).slice(0, 5);

  const summaryItems = [
    { label: 'Курсов',           value: courseStats.length,     icon: <BookOpen size={20} />,  color: 'var(--brand-secondary)' },
    { label: 'Зачислений',       value: courseStats.reduce((s, c) => s + (c.enrollments || 0), 0), icon: <Users size={20} />, color: 'var(--success)' },
    { label: 'Задач',            value: challengeStats.length,  icon: <Code2 size={20} />,     color: 'var(--brand-primary)' },
    { label: 'Попыток (задачи)', value: challengeStats.reduce((s, c) => s + c.total_attempts, 0), icon: <Terminal size={20} />, color: 'var(--brand-primary)' },
  ];

  return (
    <div>
      <div className="ts-analytics-header">
        <h2 className="ts-analytics-title">Аналитика</h2>
        <p className="ts-analytics-subtitle">Смотри где студенты застревают и что нужно улучшить</p>
      </div>

      <div className="ts-stats-grid">
        {summaryItems.map(s => (
          <div key={s.label} className="ts-stat-card">
            <div className="ts-stat-card__icon" style={{ background: `${s.color}18`, color: s.color }}>{s.icon}</div>
            <div>
              <div className="ts-stat-card__value" style={{ color: s.color }}>{s.value}</div>
              <div className="ts-stat-card__label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {courseStats.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={18} color="var(--brand-secondary)" /> Статистика курсов
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {courseStats.map(c => (
              <div key={c.id} className="ts-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{c.title}</span>
                    <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, background: 'var(--overlay-bg)' }}>{c.category}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '24px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--success)' }}>{c.lessons}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>уроков</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand-secondary)' }}>{c.enrollments}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>студентов</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {hardestChallenges.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingDown size={18} color="#f59e0b" /> Самые сложные задачи (по % ошибок)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {hardestChallenges.map(ch => (
              <div key={ch.id} className="ts-card ts-card--hoverable" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '16px' }}
                onClick={() => loadAttempts(ch.id)}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{ch.title}</span>
                    <span className={`ts-difficulty-badge ts-difficulty-badge--${ch.difficulty}`}>{ch.difficulty}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ flex: 1, height: '5px', background: 'var(--overlay-bg)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${ch.fail_rate}%`, height: '100%', background: ch.fail_rate > 70 ? 'var(--danger)' : ch.fail_rate > 40 ? '#f59e0b' : 'var(--success)', borderRadius: '3px', transition: 'width 0.8s ease' }} />
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: ch.fail_rate > 70 ? 'var(--danger)' : ch.fail_rate > 40 ? '#fbbf24' : 'var(--success)', minWidth: '40px', textAlign: 'right' }}>{ch.fail_rate}%</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: '80px' }}>fail rate</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f59e0b' }}>{ch.total_attempts}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>попыток</div>
                </div>
                <Eye size={16} color="var(--text-muted)" />
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedChallenge && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileCode size={18} color="#818cf8" /> Все попытки — Задача #{selectedChallenge}
            </h3>
            <button className="ts-btn ts-btn--sm" onClick={() => setSelectedChallenge(null)}><X size={14} /> Закрыть</button>
          </div>
          {loadingAtt ? (
            <div className="ts-card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div className="ts-spinner" style={{ margin: '0 auto 12px' }} /> Загрузка...
            </div>
          ) : attempts.length === 0 ? (
            <div className="ts-card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Нет попыток по этой задаче</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
              {attempts.map(att => (
                <div key={att.id} className="ts-card" style={{ padding: '14px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: att.status === 'accepted' ? 'var(--success)' : 'var(--danger)' }}>
                        {att.status === 'accepted' ? '✓ Принято' : '✗ ' + att.status}
                      </span>
                      <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>попытка #{att.attempt_num} · {att.language} · {att.runtime_ms}ms</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(att.created_at).toLocaleString('ru')}</span>
                  </div>
                  {att.code && (
                    <pre style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-muted)', background: 'var(--overlay-bg)', padding: '10px 12px', borderRadius: '8px', margin: 0, overflowX: 'auto', maxHeight: '120px', overflowY: 'auto', border: '1px solid var(--overlay-bg)' }}>
                      {att.code.slice(0, 600)}{att.code.length > 600 ? '\n...' : ''}
                    </pre>
                  )}
                  {att.stderr && (
                    <div style={{ marginTop: '6px', fontFamily: 'monospace', fontSize: '0.76rem', color: 'var(--danger)', background: 'rgba(234,67,53,0.08)', padding: '6px 10px', borderRadius: '6px' }}>
                      {att.stderr.slice(0, 200)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {challengeStats.length === 0 && (
        <div className="ts-card ts-empty">
          <BarChart2 size={48} style={{ opacity: 0.15, marginBottom: '16px' }} />
          <p style={{ fontSize: '1.05rem', marginBottom: '8px' }}>Нет данных для аналитики</p>
          <p style={{ fontSize: '0.85rem' }}>Создай задачи во вкладке «Задачи» и подожди пока студенты начнут их решать</p>
        </div>
      )}
    </div>
  );
};

export default TeacherStudio;

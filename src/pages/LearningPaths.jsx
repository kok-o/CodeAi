import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map, BookOpen, ChevronRight, CheckCircle, Lock, Play,
  Target, TrendingUp, Clock, Zap, Award, Star, ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { apiCall } from '../utils/api';
import Skeleton from '../components/Skeleton';


const LearningPaths = () => {
  const { courses, progress, user } = useContext(AppContext);
  const navigate = useNavigate();
  const [paths, setPaths]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selectedPath, setSelectedPath] = useState(null);

  useEffect(() => { loadPaths(); }, []);

  const loadPaths = async () => {
    setLoading(true);
    try {
      const data = await apiCall('/learning-paths');
      setPaths(data);
    } catch {
      // Fallback: build paths from courses
      setPaths(buildFallbackPaths());
    } finally { setLoading(false); }
  };

  const buildFallbackPaths = () => {
    /* Auto-generate learning paths from available courses */
    const categories = {};
    (courses || []).forEach(c => {
      const cat = c.category || 'General';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(c);
    });
    return Object.entries(categories).map(([cat, coursesInCat], i) => ({
      id: `fp-${i}`,
      title: `${cat} Path`,
      description: `Полный путь обучения по ${cat} от новичка до профессионала`,
      difficulty: coursesInCat[0]?.level || 'Beginner',
      courses: coursesInCat,
      color: coursesInCat[0]?.color || 'var(--brand-primary)',
      estimated_hours: coursesInCat.reduce((s, c) => s + (c.lessons || []).length * 0.25, 0),
      is_featured: i === 0,
    }));
  };

  /* Calculate path completion */
  const getPathProgress = (path) => {
    const pathCourses = path.courses || [];
    if (!pathCourses.length) return { pct: 0, completedCount: 0, total: 0 };
    let total = 0, done = 0;
    pathCourses.forEach(c => {
      const lessons = c.lessons || [];
      total += lessons.length;
      done += progress[c.id]?.completedLessons?.length || 0;
    });
    return { pct: total > 0 ? Math.round((done / total) * 100) : 0, completedCount: done, total };
  };

  /* Find next recommended course in path */
  const getNextCourse = (path) => {
    const pathCourses = path.courses || [];
    for (const c of pathCourses) {
      const lessons = c.lessons || [];
      const done = progress[c.id]?.completedLessons?.length || 0;
      if (done < lessons.length) return c;
    }
    return null;
  };

  if (loading) return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'transparent' }}>
      <main className="animate-in" style={{ flex: 1, padding: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '860px' }}>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} height="140px" borderRadius="16px" />
          ))}
        </div>
      </main>
    </div>
  );

  /* Detail view */
  if (selectedPath) {
    const pathProgress = getPathProgress(selectedPath);
    const nextCourse = getNextCourse(selectedPath);
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'transparent' }}>
        
        <main className="animate-in" style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
          <button onClick={() => setSelectedPath(null)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--overlay-bg)', border: '1px solid var(--overlay-bg)', borderRadius: '9px', color: 'var(--text-muted)', cursor: 'pointer', padding: '7px 14px', fontSize: '0.82rem', fontWeight: 600, marginBottom: '28px' }}>
            ← Назад к путям
          </button>

          {/* Path header */}
          <div style={{ padding: '32px', borderRadius: '20px', background: `linear-gradient(135deg, ${selectedPath.color}18, ${selectedPath.color}08)`, border: `1px solid ${selectedPath.color}30`, marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                {selectedPath.is_featured && (
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', padding: '2px 10px', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.2)', marginBottom: '10px', display: 'inline-block' }}>
                    ⭐ Рекомендуемый
                  </span>
                )}
                <h1 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '8px' }}>{selectedPath.title}</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '16px', lineHeight: 1.6 }}>{selectedPath.description}</p>
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                  {[
                    { icon: <BookOpen size={13} />, text: `${(selectedPath.courses || []).length} курсов` },
                    { icon: <Clock size={13} />,    text: `≈${Math.round(selectedPath.estimated_hours || 0)} часов` },
                    { icon: <Target size={13} />,   text: selectedPath.difficulty },
                  ].map((m, i) => (
                    <span key={i} style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {m.icon} {m.text}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.4rem', fontWeight: 900, color: selectedPath.color, marginBottom: '4px' }}>{pathProgress.pct}%</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{pathProgress.completedCount}/{pathProgress.total} уроков</div>
                <div style={{ marginTop: '10px', width: '120px', height: '6px', background: 'var(--overlay-bg)', borderRadius: '3px', overflow: 'hidden' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pathProgress.pct}%` }} transition={{ duration: 1 }}
                    style={{ height: '100%', background: selectedPath.color, borderRadius: '3px' }} />
                </div>
              </div>
            </div>

            {nextCourse && (
              <button onClick={() => navigate(`/lesson/${nextCourse.id}`)}
                style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 22px', borderRadius: '11px', background: `linear-gradient(135deg, ${selectedPath.color}, ${selectedPath.color}cc)`, border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', boxShadow: `0 4px 15px ${selectedPath.color}40` }}>
                <Play size={14} fill="white" />
                {pathProgress.pct === 0 ? 'Начать путь' : 'Продолжить'} — {nextCourse.title}
                <ArrowRight size={15} />
              </button>
            )}
            {pathProgress.pct === 100 && (
              <div style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '11px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', color: 'var(--success)', fontWeight: 700, fontSize: '0.9rem' }}>
                <Award size={16} /> Путь завершён! Поздравляем! 🎉
              </div>
            )}
          </div>

          {/* Course roadmap */}
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px' }}>Дорожная карта</h2>
          <div style={{ position: 'relative' }}>
            {/* Vertical line */}
            <div style={{ position: 'absolute', left: '24px', top: '30px', bottom: '30px', width: '2px', background: 'var(--overlay-bg)', zIndex: 0 }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {(selectedPath.courses || []).map((course, i) => {
                const cp = progress[course.id] || { completedLessons: [] };
                const lessons = course.lessons || [];
                const done = cp.completedLessons.length;
                const pct = lessons.length > 0 ? Math.round((done / lessons.length) * 100) : 0;
                const isNext = getNextCourse(selectedPath)?.id === course.id;
                const isComplete = done === lessons.length && lessons.length > 0;

                return (
                  <motion.div key={course.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                    {/* Step indicator */}
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.9rem',
                      background: isComplete ? 'rgba(52,211,153,0.15)' : isNext ? `${selectedPath.color}20` : 'var(--overlay-bg)',
                      border: `2px solid ${isComplete ? 'var(--success)' : isNext ? selectedPath.color : 'var(--overlay-bg)'}`,
                      color: isComplete ? 'var(--success)' : isNext ? selectedPath.color : 'var(--text-muted)'
                    }}>
                      {isComplete ? <CheckCircle size={22} /> : i + 1}
                    </div>

                    {/* Course card */}
                    <div style={{ flex: 1, padding: '18px 20px', borderRadius: '14px', background: isNext ? `${selectedPath.color}08` : 'var(--overlay-bg)', border: `1px solid ${isNext ? selectedPath.color + '30' : 'var(--overlay-bg)'}`, cursor: 'pointer', transition: 'all 0.15s' }}
                      onClick={() => navigate(`/lesson/${course.id}`)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                            {isNext && <span style={{ fontSize: '0.7rem', fontWeight: 700, color: selectedPath.color, background: `${selectedPath.color}15`, padding: '1px 8px', borderRadius: '6px', border: `1px solid ${selectedPath.color}30` }}>СЛЕДУЮЩИЙ</span>}
                            {isComplete && <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--success)', background: 'rgba(52,211,153,0.1)', padding: '1px 8px', borderRadius: '6px' }}>✓ ПРОЙДЕН</span>}
                          </div>
                          <div style={{ fontWeight: 700, fontSize: '1rem' }}>{course.title}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{done}/{lessons.length} уроков</span>
                          <ChevronRight size={16} color="var(--text-muted)" />
                        </div>
                      </div>
                      {lessons.length > 0 && (
                        <div style={{ height: '4px', background: 'var(--overlay-bg)', borderRadius: '2px', overflow: 'hidden' }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.2 + i * 0.05, duration: 0.8 }}
                            style={{ height: '100%', background: isComplete ? 'var(--success)' : selectedPath.color, borderRadius: '2px' }} />
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ── PATHS LIST ── */
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'transparent' }}>
      
      <style>{`@keyframes lp-pulse { 0%,100% { opacity: 0.4 } 50% { opacity: 0.8 } }`}</style>

      <main className="animate-in" style={{ flex: 1, padding: '40px', overflowY: 'auto', color: 'var(--text-main)' }}>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: '36px', padding: '36px', borderRadius: '22px', background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))', border: '1px solid var(--brand-glow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: 'linear-gradient(135deg, #6366f1, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Map size={24} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.9rem', fontWeight: 900, background: 'linear-gradient(135deg, #e2e8f0, #c7d2fe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Пути обучения
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Структурированные маршруты от новичка до специалиста</p>
            </div>
          </div>
        </motion.div>

        {/* Featured path */}
        {paths.filter(p => p.is_featured).map(path => {
          const pp = getPathProgress(path);
          const next = getNextCourse(path);
          return (
            <motion.div key={path.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{ marginBottom: '24px', padding: '28px', borderRadius: '18px', background: `linear-gradient(135deg, ${path.color}15, ${path.color}06)`, border: `1px solid ${path.color}30`, cursor: 'pointer' }}
              onClick={() => setSelectedPath(path)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', padding: '2px 10px', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.2)', marginBottom: '10px', display: 'inline-block' }}>⭐ Рекомендуемый путь</span>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>{path.title}</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '14px' }}>{path.description}</p>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {[
                      { icon: <BookOpen size={13} />, text: `${(path.courses || []).length} курсов` },
                      { icon: <Clock size={13} />,    text: `≈${Math.round(path.estimated_hours || 0)} ч` },
                      { icon: <Target size={13} />,   text: path.difficulty },
                    ].map((m, i) => (
                      <span key={i} style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>{m.icon} {m.text}</span>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: '2.8rem', fontWeight: 900, color: path.color, lineHeight: 1 }}>{pp.pct}%</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{pp.completedCount}/{pp.total} уроков</div>
                  <div style={{ marginTop: '8px', width: '100px', height: '5px', background: 'var(--overlay-bg)', borderRadius: '3px', overflow: 'hidden', margin: '8px auto 0' }}>
                    <div style={{ width: `${pp.pct}%`, height: '100%', background: path.color, borderRadius: '3px' }} />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '18px' }}>
                <div style={{ display: 'flex' }}>
                  {(path.courses || []).slice(0, 5).map((c, ci) => (
                    <div key={ci} style={{ width: '28px', height: '28px', borderRadius: '50%', background: c.color || 'var(--brand-primary)', border: '2px solid rgba(15,15,25,0.8)', marginLeft: ci > 0 ? '-8px' : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: 'white' }}>
                      {(c.category || 'X')[0]}
                    </div>
                  ))}
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{(path.courses || []).length} курсов в этом пути</span>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', color: path.color, fontWeight: 700 }}>
                  Подробнее <ChevronRight size={14} />
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* All paths grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {paths.filter(p => !p.is_featured).map((path, i) => {
            const pp = getPathProgress(path);
            return (
              <motion.div key={path.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                style={{ padding: '22px', borderRadius: '16px', background: 'var(--overlay-bg)', border: '1px solid var(--overlay-bg)', cursor: 'pointer', transition: 'all 0.15s', borderLeft: `4px solid ${path.color || 'var(--brand-primary)'}` }}
                onClick={() => setSelectedPath(path)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h3 style={{ fontWeight: 800, fontSize: '1.05rem' }}>{path.title}</h3>
                  <span style={{ fontSize: '1.1rem', fontWeight: 900, color: path.color || 'var(--brand-primary)' }}>{pp.pct}%</span>
                </div>
                <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '14px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {path.description}
                </p>
                <div style={{ height: '4px', background: 'var(--overlay-bg)', borderRadius: '2px', overflow: 'hidden', marginBottom: '12px' }}>
                  <div style={{ width: `${pp.pct}%`, height: '100%', background: path.color || 'var(--brand-primary)', borderRadius: '2px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{(path.courses || []).length} курсов · {path.difficulty}</span>
                  <span style={{ fontSize: '0.78rem', color: path.color || 'var(--brand-primary)', fontWeight: 700 }}>Открыть →</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {paths.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)', borderRadius: '16px', background: 'var(--overlay-bg)', border: '1px solid var(--overlay-bg)' }}>
            <Map size={48} style={{ opacity: 0.12, marginBottom: '16px' }} />
            <p style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '8px' }}>Путей обучения нет</p>
            <p style={{ fontSize: '0.85rem' }}>Учитель ещё не создал учебные пути. Пока учись через курсы!</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default LearningPaths;

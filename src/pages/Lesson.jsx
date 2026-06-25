import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, ChevronRight, Code2, Copy, CheckCircle, ChevronLeft, RefreshCw, BookOpen, FileQuestion, Terminal, Award, Lock, ArrowLeft } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { apiCall } from '../utils/api';
import { lessonTranslations } from '../utils/lessonTranslations';
import MonacoEditor from '../components/MonacoEditor';

const Lesson = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const courseId = Number(id);

  const { progress, completeLesson, t, courses, language, lessonLanguage } = useContext(AppContext);

  const [activeLesson, setActiveLesson] = useState(null);
  
  const [blocks, setBlocks] = useState([]);
  const [blockProgress, setBlockProgress] = useState({});
  const [loadingBlocks, setLoadingBlocks] = useState(true);

  // States for quizzes
  const [quizStates, setQuizStates] = useState({});
  
  // States for practice blocks
  const [practiceStates, setPracticeStates] = useState({});

  const course = courses?.find(c => c.id === courseId);
  const courseProgress = progress[courseId] || { completedLessons: [], activeLessonId: null, code: {} };

  /* ── Init lesson ── */
  useEffect(() => {
    if (!course) return;
    const lid = courseProgress.activeLessonId || course.lessons[0]?.id;
    const lesson = course.lessons.find(l => l.id === lid) || course.lessons[0];
    if (lesson) initLesson(lesson);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course?.id]);

  const initLesson = async (lesson) => {
    setActiveLesson(lesson);
    setLoadingBlocks(true);
    setBlocks([]);
    setBlockProgress({});
    setQuizStates({});
    setPracticeStates({});
    try {
      const fetchedBlocks = await apiCall(`/lessons/${lesson.id}/blocks`);
      setBlocks(fetchedBlocks || []);
      
      const fetchedProgress = await apiCall(`/lessons/${lesson.id}/progress`);
      const progMap = {};
      fetchedProgress.forEach(p => {
        progMap[p.block_id] = p;
      });
      setBlockProgress(progMap);

      const initialQuizStates = {};
      const initialPracticeStates = {};
      
      fetchedBlocks.forEach(b => {
        if (b.type === 'quiz') {
          initialQuizStates[b.id] = { answers: {}, checked: progMap[b.id]?.completed || false, score: progMap[b.id]?.score || 0, passed: progMap[b.id]?.completed || false };
        } else if (b.type === 'practice') {
          initialPracticeStates[b.id] = { 
            code: progMap[b.id]?.saved_code || b.content.initial_code || '', 
            output: [], 
            isRunning: false, 
            isSuccess: progMap[b.id]?.completed || false 
          };
        }
      });
      setQuizStates(initialQuizStates);
      setPracticeStates(initialPracticeStates);

    } catch (e) {
      console.error("Failed to load blocks", e);
    } finally {
      setLoadingBlocks(false);
    }
  };

  const markBlockComplete = async (blockId) => {
    try {
      await apiCall(`/blocks/${blockId}/complete`, { method: 'POST' });
      setBlockProgress(prev => ({ ...prev, [blockId]: { ...prev[blockId], completed: true } }));
      checkLessonCompletion(blockId);
    } catch (e) { console.error(e); }
  };

  const handleQuizSubmit = async (blockId, blockData) => {
    const qs = quizStates[blockId];
    if (!qs) return;
    const questions = blockData.content.questions || [];
    let correct = 0;
    questions.forEach((q, i) => { if (qs.answers[i] === q.correct) correct++; });
    const score = Math.round((correct / questions.length) * 100);
    const passThreshold = Math.round((blockData.content.pass_threshold || 0.7) * 100);
    const passed = score >= passThreshold;
    
    setQuizStates(prev => ({ ...prev, [blockId]: { ...prev[blockId], checked: true, score, passed } }));
    
    try {
      await apiCall(`/blocks/${blockId}/quiz-submit`, {
        method: 'POST',
        body: JSON.stringify({ answers: qs.answers, score, passed })
      });
      setBlockProgress(prev => ({ ...prev, [blockId]: { ...prev[blockId], completed: passed, score } }));
      if (passed) checkLessonCompletion(blockId);
    } catch (e) { console.error(e); }
  };

  const handleRunCode = async (blockId, blockData) => {
    const ps = practiceStates[blockId];
    if (!ps || ps.isRunning) return;
    
    setPracticeStates(prev => ({ ...prev, [blockId]: { ...prev[blockId], isRunning: true, output: [{ type: 'info', text: '▶ Запуск кода...' }] } }));
    
    try {
      const result = await apiCall('/execute', {
        method: 'POST',
        body: JSON.stringify({ language: blockData.content.language || 'python', code: ps.code, stdin: '', context: 'lesson', lesson_id: activeLesson?.id, course_id: courseId })
      });
      const lines = [];
      if (result.stdout) result.stdout.split('\n').filter(Boolean).forEach(l => lines.push({ type: 'stdout', text: l }));
      if (result.stderr) result.stderr.split('\n').filter(Boolean).forEach(l => lines.push({ type: 'error', text: l }));
      if (!lines.length) lines.push({ type: 'muted', text: '(нет вывода)' });
      lines.push(result.exit_code === 0
        ? { type: 'success', text: `✅ Выполнено за ${result.time_ms}ms` }
        : { type: 'error',   text: `❌ Завершено с кодом ${result.exit_code}` });
      
      let allTestsPassed = false;
      const testCases = blockData.content.test_cases || [];
      if (testCases.length > 0 && result.exit_code === 0) {
        let passedCount = 0;
        for (const tc of testCases) {
          try {
            const res = await apiCall('/execute', { method: 'POST', body: JSON.stringify({ language: blockData.content.language || 'python', code: ps.code, stdin: tc.stdin || String(tc.input?.[0] ?? '') }) });
            const stdout = (res.stdout || '').trim();
            const expected = (tc.expected_stdout || String(tc.expected || '')).trim();
            if (stdout === expected && res.exit_code === 0) passedCount++;
          } catch { /* skip */ }
        }
        if (passedCount === testCases.length) {
          lines.push({ type: 'success', text: `🎉 Все ${testCases.length} тест-кейсов пройдены!` });
          allTestsPassed = true;
        } else {
          lines.push({ type: 'error', text: `⚠️ ${passedCount}/${testCases.length} тестов прошли` });
        }
      } else if (testCases.length === 0 && result.exit_code === 0) {
        allTestsPassed = true;
      }

      setPracticeStates(prev => ({ ...prev, [blockId]: { ...prev[blockId], output: lines, isSuccess: allTestsPassed, isRunning: false } }));
      
      await apiCall(`/blocks/${blockId}/code-submit`, {
        method: 'POST',
        body: JSON.stringify({ saved_code: ps.code, passed: allTestsPassed })
      });
      setBlockProgress(prev => ({ ...prev, [blockId]: { ...prev[blockId], completed: allTestsPassed, saved_code: ps.code } }));
      if (allTestsPassed) checkLessonCompletion(blockId);

    } catch (e) {
      setPracticeStates(prev => ({ ...prev, [blockId]: { ...prev[blockId], output: [{ type: 'error', text: `Ошибка: ${e.message}` }], isRunning: false } }));
    }
  };

  const checkLessonCompletion = (completedBlockId) => {
    const allCompleted = blocks.every(b => b.id === completedBlockId || blockProgress[b.id]?.completed);
    if (allCompleted) {
      if (!courseProgress.completedLessons.includes(activeLesson.id)) {
        completeLesson(courseId, activeLesson.id);
      }
    }
  };

  /* ── Loading guard ── */
  if (!courses || courses.length === 0) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-workspace)' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--brand-glow)', borderTopColor: 'var(--brand-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }
  if (!course) return (
    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-workspace)' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>Курс не найден</p>
        <button onClick={() => navigate('/courses')} className="btn btn-primary">← К курсам</button>
      </div>
    </div>
  );
  if (!activeLesson) return null;

  const isLessonCompleted = courseProgress.completedLessons.includes(activeLesson.id);
  const activeTranslation = lessonTranslations[lessonLanguage || language]?.[activeLesson.id];
  const displayTitle = activeTranslation?.title || activeLesson.title;
  const currentLessonIdx = course.lessons.findIndex(l => l.id === activeLesson.id);
  const completedBlocksCount = blocks.filter(b => blockProgress[b.id]?.completed).length;

  return (
    <div style={{ display: 'flex', height: '100%', background: 'var(--bg-workspace)', overflow: 'hidden' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .ls-out-stdout { color: var(--text-primary); }
        .ls-out-error { color: var(--danger); }
        .ls-out-success { color: var(--success); }
        .ls-out-info { color: var(--brand-primary); }
        .ls-out-muted { color: var(--text-muted); }
        .quiz-opt { padding: 12px 16px; border-radius: 10px; border: 1.5px solid var(--border-subtle); cursor: pointer; font-size: 0.88rem; transition: all 0.15s; background: var(--bg-card); color: var(--text-primary); }
        .quiz-opt:hover { border-color: var(--brand-primary); background: var(--brand-glow); }
        .lesson-instructions code { background: var(--overlay-bg); color: var(--brand-primary); padding: 2px 6px; border-radius: 4px; font-family: Consolas, monospace; font-size: 0.85em; border: 1px solid var(--border-subtle); }
        .lesson-instructions strong { color: var(--text-primary); font-weight: 700; }
        .lesson-instructions pre { background: var(--surface-sunken); border-radius: 8px; padding: 12px 16px; overflow-x: auto; border: 1px solid var(--border-subtle); margin-bottom: 16px; color: var(--text-primary); }
        .lesson-instructions p { margin-bottom: 16px; line-height: 1.6; }
        .stepik-sidebar-scroll::-webkit-scrollbar { width: 6px; }
        .stepik-sidebar-scroll::-webkit-scrollbar-thumb { background: var(--border-subtle); border-radius: 4px; }
        .course-title-container { position: relative; display: flex; alignItems: center; cursor: pointer; padding: 2px 0; }
        .course-title-arrow { position: absolute; left: -20px; opacity: 0; transition: all 0.25s ease; color: var(--text-muted); display: flex; align-items: center; }
        .course-title-text { transition: transform 0.25s ease; font-size: 1rem; font-weight: 800; color: var(--text-primary); line-height: 1.3; margin: 0; }
        .course-title-container:hover .course-title-arrow { left: 0; opacity: 1; color: var(--brand-primary); }
        .course-title-container:hover .course-title-text { transform: translateX(24px); color: var(--brand-primary); }
      `}</style>

      {/* ── SIDEBAR (Stepik style) ── */}
      <aside className="stepik-sidebar-scroll" style={{ width: '260px', flexShrink: 0, borderRight: '1px solid var(--border-subtle)', background: 'var(--surface-sunken)', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
        
        {/* Sidebar Header: Course Title */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div 
            className="course-title-container" 
            onClick={() => navigate('/courses')}
            title="Вернуться в каталог"
          >
            <div className="course-title-arrow">
              <ArrowLeft size={18} />
            </div>
            <h2 className="course-title-text">
              {course.title}
            </h2>
          </div>
          
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
              <span>Прогресс по курсу:</span>
              <span>{courseProgress.completedLessons.length}/{course.lessons.length}</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'var(--overlay-bg)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${course.lessons.length > 0 ? (courseProgress.completedLessons.length / course.lessons.length) * 100 : 0}%`, height: '100%', background: course.color || 'var(--brand-primary)', transition: 'width 0.4s ease' }} />
            </div>
          </div>
        </div>

        {/* Sidebar Lesson List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
          {course.lessons.map((les, i) => {
            const done = courseProgress.completedLessons.includes(les.id);
            const isAct = les.id === activeLesson.id;
            return (
              <button key={les.id} onClick={() => initLesson(les)}
                style={{
                  width: '100%', textAlign: 'left', padding: '12px 16px',
                  background: isAct ? 'var(--overlay-bg)' : 'transparent',
                  border: 'none',
                  borderLeft: isAct ? `4px solid ${course.color || 'var(--brand-primary)'}` : '4px solid transparent',
                  color: isAct ? 'var(--text-primary)' : 'var(--text-muted)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                  transition: 'all 0.15s', position: 'relative'
                }}
                onMouseOver={e => { if(!isAct) e.currentTarget.style.background = 'var(--overlay-bg-hover)' }}
                onMouseOut={e => { if(!isAct) e.currentTarget.style.background = 'transparent' }}
              >
                {isAct && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 0,
                    height: 0,
                    borderTop: '10px solid transparent',
                    borderBottom: '10px solid transparent',
                    borderRight: `10px solid ${course.color || 'var(--brand-primary)'}`
                  }} />
                )}
                
                {done ? (
                  <CheckCircle size={15} color="var(--success)" style={{ flexShrink: 0 }} />
                ) : (
                  <div style={{ width: '15px', height: '15px', borderRadius: '50%', border: `1.5px solid ${isAct ? (course.color || 'var(--brand-primary)') : 'var(--border-subtle)'}`, flexShrink: 0 }} />
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  {les.subtitle && <span style={{ fontSize: '0.7rem', fontWeight: 700, color: isAct ? 'var(--brand-primary)' : 'var(--text-muted)', marginBottom: '2px' }}>{les.subtitle}</span>}
                  <span style={{ fontSize: '0.85rem', fontWeight: isAct ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {les.title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ── CENTER CONTENT ── */}
      <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--bg-workspace)', scrollBehavior: 'smooth' }}>
        <div style={{ width: '100%', maxWidth: '1100px', padding: '40px 32px', display: 'flex', flexDirection: 'column', gap: '32px', minHeight: '100%' }}>
          
          {/* Header Row (Subtitle & Progress) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid var(--border-subtle)', paddingBottom: '16px', marginBottom: '32px' }}>
            <div style={{ color: 'var(--brand-primary)', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {activeLesson.subtitle || 'Урок'}
            </div>
            {blocks.length > 0 && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {completedBlocksCount} из {blocks.length} шагов пройдено
              </div>
            )}
          </div>

          {/* Large Title */}
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '40px', lineHeight: 1.2 }}>
            {displayTitle}
          </h1>

          {/* Blocks */}
          {loadingBlocks ? (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: 'var(--text-muted)', justifyContent: 'center', padding: '40px' }}>
              <div style={{ width: '24px', height: '24px', border: '3px solid var(--brand-glow)', borderTopColor: 'var(--brand-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              Загрузка материалов...
            </div>
          ) : blocks.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>В этом уроке пока нет заданий.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', flex: 1 }}>
              <AnimatePresence>
                {blocks.map((b, i) => {
                  const isLocked = i > 0 && !blockProgress[blocks[i - 1].id]?.completed;
                  const isCompleted = blockProgress[b.id]?.completed;
                  const isActive = !isLocked && !isCompleted;

                  if (isLocked) {
                    return (
                      <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '24px', background: 'var(--bg-card)', border: '1px dashed var(--border-subtle)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)', opacity: 0.6 }}>
                        <Lock size={18} />
                        <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>Шаг {i + 1} заблокирован (пройдите предыдущие)</div>
                      </motion.div>
                    );
                  }

                  return (
                    <motion.div key={b.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', overflow: 'hidden', boxShadow: isActive ? '0 4px 20px var(--brand-glow)' : 'var(--card-shadow)', transition: 'box-shadow 0.3s' }}>
                      
                      <div style={{ padding: '32px', opacity: isCompleted ? 0.9 : 1 }}>
                        
                        {/* THEORY */}
                        {b.type === 'theory' && (
                          <div>
                            {b.content.title && <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '20px', color: 'var(--text-primary)' }}>{b.content.title}</h3>}
                            <div className="lesson-instructions" dangerouslySetInnerHTML={{ __html: b.content.body }} style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '32px' }} />
                            {!isCompleted ? (
                              <button className="btn btn-primary" onClick={() => markBlockComplete(b.id)} style={{ padding: '12px 28px' }}>
                                <CheckCircle size={18} /> Отметить как пройденный
                              </button>
                            ) : (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--success)', fontWeight: 700, fontSize: '0.95rem', background: 'rgba(52,211,153,0.1)', padding: '10px 20px', borderRadius: '10px' }}><CheckCircle size={18} /> Шаг пройден</div>
                            )}
                          </div>
                        )}

                        {/* QUIZ */}
                        {b.type === 'quiz' && (
                          <div>
                            <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '24px', fontWeight: 600 }}>Тест • Для прохождения нужно {(b.content.pass_threshold || 0.7) * 100}% правильных ответов</div>
                            {(b.content.questions || []).map((q, qi) => {
                              const qs = quizStates[b.id] || { answers: {}, checked: false };
                              return (
                                <div key={q.id || qi} style={{ marginBottom: '32px' }}>
                                  <div style={{ fontWeight: 700, marginBottom: '16px', fontSize: '1.05rem', color: 'var(--text-primary)' }}><span style={{ color: 'var(--brand-primary)', marginRight: '8px' }}>{qi + 1}.</span> {q.question}</div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {q.options.map((opt, oi) => {
                                      let bg = 'var(--overlay-bg)', border = 'var(--border-subtle)', color = 'var(--text-primary)';
                                      if (qs.answers[qi] === oi) { bg = 'var(--brand-glow)'; border = 'var(--brand-primary)'; color = 'var(--text-primary)'; }
                                      if (qs.checked) {
                                        if (oi === q.correct) { bg = 'rgba(52,211,153,0.1)'; border = 'var(--success)'; color = 'var(--success)'; }
                                        else if (qs.answers[qi] === oi && oi !== q.correct) { bg = 'rgba(234, 67, 53, 0.08)'; border = 'var(--danger)'; color = 'var(--danger)'; }
                                      }
                                      return (
                                        <div key={oi} className="quiz-opt" style={{ background: bg, borderColor: border, color, cursor: qs.checked ? 'default' : 'pointer' }}
                                          onClick={() => { if (!qs.checked) setQuizStates(prev => ({...prev, [b.id]: {...prev[b.id], answers: {...prev[b.id].answers, [qi]: oi}}})); }}>
                                          {qs.checked && oi === q.correct && <CheckCircle size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />}
                                          {opt}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                            
                            {quizStates[b.id]?.checked ? (
                              <div style={{ marginTop: '24px' }}>
                                <div style={{ padding: '16px 20px', borderRadius: '12px', background: quizStates[b.id].passed ? 'rgba(52,211,153,0.1)' : 'rgba(234, 67, 53, 0.08)', border: `1px solid ${quizStates[b.id].passed ? 'rgba(52,211,153,0.3)' : 'rgba(239,68,68,0.3)'}`, marginBottom: '20px' }}>
                                  <div style={{ fontWeight: 800, fontSize: '1.2rem', color: quizStates[b.id].passed ? 'var(--success)' : 'var(--danger)' }}>{quizStates[b.id].score}% правильных ответов</div>
                                  <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginTop: '6px' }}>{quizStates[b.id].passed ? 'Отличная работа! Шаг пройден.' : 'Недостаточно для прохождения. Попробуй ещё раз.'}</div>
                                </div>
                                {!quizStates[b.id].passed && (
                                  <button className="btn btn-outline" onClick={() => setQuizStates(prev => ({...prev, [b.id]: {answers: {}, checked: false}}))}>
                                    <RefreshCw size={16} /> Попробовать снова
                                  </button>
                                )}
                              </div>
                            ) : (
                              <button className="btn btn-primary" onClick={() => handleQuizSubmit(b.id, b)} disabled={Object.keys(quizStates[b.id]?.answers || {}).length < (b.content.questions || []).length} style={{ opacity: Object.keys(quizStates[b.id]?.answers || {}).length < (b.content.questions || []).length ? 0.5 : 1 }}>
                                Проверить ответы
                              </button>
                            )}
                          </div>
                        )}

                        {/* PRACTICE */}
                        {b.type === 'practice' && (
                          <div>
                            <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '16px', fontWeight: 600 }}>Практическая задача • {b.content.language || 'python'}</div>
                            <div className="lesson-instructions" dangerouslySetInnerHTML={{ __html: b.content.instructions }} style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '24px' }} />
                            
                            <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border-subtle)', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--card-shadow)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--surface-sunken)', borderBottom: '1px solid var(--border-subtle)' }}>
                                <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>main.{b.content.language === 'python' ? 'py' : b.content.language === 'javascript' ? 'js' : 'cs'}</span>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem', height: 'auto' }} onClick={() => { setPracticeStates(prev => ({...prev, [b.id]: {...prev[b.id], code: b.content.initial_code || ''}})); }}>
                                    <RefreshCw size={14} /> Сбросить
                                  </button>
                                  <button className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '0.85rem', height: 'auto' }} onClick={() => handleRunCode(b.id, b)} disabled={practiceStates[b.id]?.isRunning}>
                                    {practiceStates[b.id]?.isRunning ? <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> : <Play size={14} fill="white" />} Запустить код
                                  </button>
                                </div>
                              </div>
                              <div style={{ height: '300px' }}>
                                <MonacoEditor code={practiceStates[b.id]?.code || ''} onChange={v => setPracticeStates(prev => ({...prev, [b.id]: {...prev[b.id], code: v || ''}}))} language={b.content.language || 'python'} height="100%" fontSize={14} />
                              </div>
                              {practiceStates[b.id]?.output?.length > 0 && (
                                <div style={{ height: '180px', borderTop: '1px solid var(--border-subtle)', background: 'var(--surface-sunken)', display: 'flex', flexDirection: 'column' }}>
                                  <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}><Terminal size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} /> Вывод консоли</div>
                                  <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', fontFamily: 'Consolas, monospace', fontSize: '0.85rem', lineHeight: 1.6 }}>
                                    {practiceStates[b.id].output.map((l, li) => <div key={li} className={`ls-out-${l.type}`}>{l.text}</div>)}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {/* Bottom Navigation */}
          {blocks.length > 0 && !loadingBlocks && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingBottom: '32px' }}>
              {currentLessonIdx > 0 ? (
                <button className="btn btn-outline" onClick={() => initLesson(course.lessons[currentLessonIdx - 1])} style={{ padding: '12px 20px' }}>
                  <ChevronLeft size={18} /> Предыдущий урок
                </button>
              ) : <div />}
              
              {currentLessonIdx < course.lessons.length - 1 ? (
                <button className="btn btn-primary" onClick={() => initLesson(course.lessons[currentLessonIdx + 1])} disabled={!isLessonCompleted} style={{ padding: '12px 24px', opacity: isLessonCompleted ? 1 : 0.5 }}>
                  Следующий урок <ChevronRight size={18} />
                </button>
              ) : (
                <button 
                  className="btn btn-primary" 
                  onClick={() => navigate('/courses')} 
                  disabled={!isLessonCompleted} 
                  style={{ 
                    padding: '12px 24px', 
                    opacity: isLessonCompleted ? 1 : 0.5, 
                    backgroundColor: 'var(--success)', 
                    borderColor: 'var(--success)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'white'
                  }}
                >
                  <Award size={18} /> Завершить курс
                </button>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default Lesson;

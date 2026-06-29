import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, PlusCircle, Trash2, ArrowLeft, Clock, ChevronRight, Sparkles, Save, X, Edit3, Settings, Code, FileText, CheckSquare, GripVertical, Plus, ExternalLink } from 'lucide-react';
import { apiCall } from '../utils/api';

const S = {
  label: { display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { width: '100%', padding: '12px 16px', background: 'var(--overlay-bg)', border: '1px solid var(--overlay-bg)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s', },
  card: { background: 'var(--overlay-bg)', border: '1px solid var(--overlay-bg)', borderRadius: '16px', boxShadow: '0 4px 20px var(--card-shadow)' },
  btn: { background: 'var(--overlay-bg)', border: '1px solid var(--overlay-bg-hover)', borderRadius: '12px', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '0.9rem', fontWeight: 600, transition: 'all 0.2s', },
  btnPrimary: { background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))', border: 'none', borderRadius: '12px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '0.9rem', fontWeight: 700, transition: 'all 0.2s', boxShadow: '0 4px 15px var(--brand-glow)' },
  btnDanger: { background: 'rgba(234, 67, 53, 0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', color: 'var(--danger,#ef4444)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s' },
};

const LANG_OPTIONS = [
  { id: 'python',     label: 'Python',     iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg' },
  { id: 'javascript', label: 'JavaScript', iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg' },
  { id: 'csharp',     label: 'C#',         iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/csharp/csharp-original.svg' },
  { id: 'java',       label: 'Java',       iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg' },
  { id: 'cpp',        label: 'C++',        iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/cplusplus/cplusplus-original.svg' },
];

export const TeacherCoursesTab = ({ courses, refreshCourses, showToast }) => {
  const [view, setView] = useState('list'); // 'list' | 'course' | 'lesson'
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);

  // --- Course Editor State ---
  const [courseFormData, setCourseFormData] = useState({ title: '', level: 'Beginner', category: 'Python', color: 'var(--brand-primary)', description: '' });
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [isEditingCourse, setIsEditingCourse] = useState(false);

  // --- Lesson Editor State ---
  const [lessonFormData, setLessonFormData] = useState({ id: '', title: '', subtitle: '', estimatedTime: '15 mins', language: 'python' });
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [isEditingLesson, setIsEditingLesson] = useState(false);

  // --- Blocks State ---
  const [blocks, setBlocks] = useState([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [loading, setLoading] = useState(false);
  const updateTimeoutRef = useRef({});

  useEffect(() => {
    if (view === 'lesson' && selectedLesson) {
      loadBlocks(selectedLesson.id);
    }
  }, [view, selectedLesson]);

  const loadBlocks = async (lessonId) => {
    setLoadingBlocks(true);
    try {
      const data = await apiCall(`/lessons/${lessonId}/blocks`);
      setBlocks(data || []);
    } catch (e) {
      showToast('error', 'Ошибка загрузки блоков: ' + e.message);
    } finally {
      setLoadingBlocks(false);
    }
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditingCourse && selectedCourse) {
        await apiCall(`/courses/${selectedCourse.id}`, { method: 'PUT', body: JSON.stringify(courseFormData) });
        showToast('success', 'Курс обновлён!');
      } else {
        await apiCall('/courses', { method: 'POST', body: JSON.stringify(courseFormData) });
        showToast('success', 'Курс создан!');
      }
      await refreshCourses();
      setShowCourseForm(false);
      setIsEditingCourse(false);
      if (isEditingCourse) {
        // Find updated course and set
        const updated = await apiCall('/courses');
        setSelectedCourse(updated.find(c => c.id === selectedCourse.id));
      }
    } catch (err) { showToast('error', err.message); }
    finally { setLoading(false); }
  };

  const handleDeleteCourse = async (e, courseId, title) => {
    e.stopPropagation();
    if (!window.confirm(`Удалить курс "${title}" и все уроки?`)) return;
    try {
      await apiCall(`/courses/${courseId}`, { method: 'DELETE' });
      showToast('success', 'Курс удалён');
      await refreshCourses();
      if (selectedCourse?.id === courseId) setView('list');
    } catch (err) { showToast('error', err.message); }
  };

  const handleSaveLesson = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditingLesson && selectedLesson) {
        await apiCall(`/courses/${selectedCourse.id}/lessons/${selectedLesson.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: lessonFormData.title,
            subtitle: lessonFormData.subtitle,
            estimated_time: lessonFormData.estimatedTime,
            language: lessonFormData.language
          })
        });
        showToast('success', 'Урок обновлён!');
      } else {
        // Create requires instructions, testCases, etc for legacy. We send empty defaults.
        await apiCall(`/courses/${selectedCourse.id}/lessons`, {
          method: 'POST',
          body: JSON.stringify({
            id: lessonFormData.id,
            title: lessonFormData.title,
            subtitle: lessonFormData.subtitle,
            estimatedTime: lessonFormData.estimatedTime,
            language: lessonFormData.language,
            instructions: 'New lesson',
            initialCode: '', solutionCode: '', testCases: []
          })
        });
        showToast('success', 'Урок добавлен!');
      }
      const updated = await apiCall('/courses');
      const updatedCourse = updated.find(c => c.id === selectedCourse.id);
      setSelectedCourse(updatedCourse);
      setShowLessonForm(false);
      setIsEditingLesson(false);
    } catch (err) { showToast('error', err.message); }
    finally { setLoading(false); }
  };

  const handleDeleteLesson = async (e, lessonId, title) => {
    e.stopPropagation();
    if (!window.confirm(`Удалить урок "${title}"?`)) return;
    try {
      await apiCall(`/courses/${selectedCourse.id}/lessons/${lessonId}`, { method: 'DELETE' });
      showToast('success', 'Урок удалён');
      const updated = await apiCall('/courses');
      setSelectedCourse(updated.find(c => c.id === selectedCourse.id));
    } catch (err) { showToast('error', err.message); }
  };

  // --- Block Handlers ---
  const handleAddBlock = async (type) => {
    // Use functional update so we don't depend on stale closure length for the UI
    let currentLength = 0;
    setBlocks(prev => { currentLength = prev.length; return prev; });
    const order_index = currentLength;

    let content = {};
    if (type === 'theory') content = { title: 'Новая теория', body: '<p>Текст...</p>' };
    if (type === 'quiz') content = { questions: [{ id: Date.now().toString(), question: 'Вопрос?', options: ['Вариант 1', 'Вариант 2'], correct: 0, explanation: '' }], pass_threshold: 0.7 };
    if (type === 'practice') content = { instructions: 'Задание', initial_code: '', solution_code: '', language: selectedLesson.language || 'python', test_cases: [] };

    try {
      const newBlock = await apiCall(`/lessons/${selectedLesson.id}/blocks`, {
        method: 'POST',
        body: JSON.stringify({ type, order_index, content })
      });
      setBlocks(prev => [...prev, newBlock]);
      showToast('success', 'Блок добавлен');
    } catch (e) { showToast('error', e.message); }
  };

  const handleUpdateBlockContent = (blockId, newContent) => {
    // 1. Optimistic local update
    setBlocks(prev => prev.map(x => x.id === blockId ? { ...x, content: newContent } : x));

    // 2. Debounced API call to save
    if (updateTimeoutRef.current[blockId]) {
      clearTimeout(updateTimeoutRef.current[blockId]);
    }
    
    updateTimeoutRef.current[blockId] = setTimeout(() => {
      let latestBlock = null;
      setBlocks(prev => {
        latestBlock = prev.find(x => x.id === blockId);
        return prev;
      });
      
      if (latestBlock) {
        apiCall(`/lessons/${selectedLesson.id}/blocks/${blockId}`, {
          method: 'PUT',
          body: JSON.stringify({ type: latestBlock.type, order_index: latestBlock.order_index, content: latestBlock.content })
        }).then(() => showToast('success', 'Сохранено')).catch(e => showToast('error', e.message));
      }
    }, 800);
  };

  const handleDeleteBlock = async (blockId) => {
    if (!window.confirm('Удалить блок?')) return;
    try {
      await apiCall(`/lessons/${selectedLesson.id}/blocks/${blockId}`, { method: 'DELETE' });
      setBlocks(blocks.filter(b => b.id !== blockId));
      showToast('success', 'Удалено');
    } catch (e) { showToast('error', e.message); }
  };

  const moveBlock = async (index, direction) => {
    if (index + direction < 0 || index + direction >= blocks.length) return;
    const newBlocks = [...blocks];
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[index + direction];
    newBlocks[index + direction] = temp;
    
    // update indexes
    const updated = newBlocks.map((b, i) => ({ ...b, order_index: i }));
    setBlocks(updated);

    try {
      await apiCall(`/lessons/${selectedLesson.id}/blocks/reorder`, {
        method: 'POST',
        body: JSON.stringify({ blocks: updated.map(b => ({ id: b.id, order_index: b.order_index })) })
      });
    } catch (e) { showToast('error', 'Ошибка сохранения порядка'); }
  };

  // ================= VIEW: LIST =================
  if (view === 'list') {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '4px' }}>Мои курсы</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{courses.length} курс(ов) создано</p>
          </div>
          <button className="ts-btn-primary" style={S.btnPrimary} onClick={() => {
            setCourseFormData({ title: '', level: 'Beginner', category: 'Python', color: 'var(--brand-primary)', description: '' });
            setIsEditingCourse(false);
            setShowCourseForm(s => !s);
          }}>
            <PlusCircle size={16} /> Создать курс
          </button>
        </div>

        <AnimatePresence>
          {showCourseForm && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              style={{ ...S.card, padding: '28px', marginBottom: '28px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '22px' }}>{isEditingCourse ? 'Редактировать курс' : 'Новый курс'}</h3>
              <form onSubmit={handleSaveCourse}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div><label style={S.label}>Название</label><input required className="ts-input" style={S.input} value={courseFormData.title} onChange={e => setCourseFormData({...courseFormData, title: e.target.value})} /></div>
                  <div><label style={S.label}>Категория</label><select className="ts-input" style={S.input} value={courseFormData.category} onChange={e => setCourseFormData({...courseFormData, category: e.target.value})}>{['Python','JavaScript','C#','Java','Web Dev'].map(c=><option key={c}>{c}</option>)}</select></div>
                  <div><label style={S.label}>Сложность</label><select className="ts-input" style={S.input} value={courseFormData.level} onChange={e => setCourseFormData({...courseFormData, level: e.target.value})}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></div>
                  <div><label style={S.label}>Цвет</label><input type="color" value={courseFormData.color} onChange={e => setCourseFormData({...courseFormData, color: e.target.value})} style={{ width: '50px', height: '40px', background: 'transparent' }} /></div>
                  <div style={{ gridColumn: 'span 2' }}><label style={S.label}>Описание</label><textarea required className="ts-input" style={{...S.input, minHeight: '80px'}} value={courseFormData.description} onChange={e => setCourseFormData({...courseFormData, description: e.target.value})} /></div>
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '18px' }}>
                  <button type="button" style={S.btn} onClick={() => setShowCourseForm(false)}>Отмена</button>
                  <button type="submit" style={S.btnPrimary} disabled={loading}><Save size={15} /> Сохранить</button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
          {courses.map(course => (
            <motion.div key={course.id} className="ts-card-hover" onClick={() => { setSelectedCourse(course); setView('course'); }}
              style={{ ...S.card, padding: '24px', cursor: 'pointer', borderLeft: `4px solid ${course.color || 'var(--brand-primary)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, padding: '2px 10px', borderRadius: '12px', background: `${course.color}18`, color: course.color }}>{course.category}</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{course.level}</span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '8px' }}>{course.title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{course.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--overlay-bg)' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}><BookOpen size={13} /> {(course.lessons || []).length} уроков</span>
                <button style={S.btnDanger} onClick={(e) => handleDeleteCourse(e, course.id, course.title)}><Trash2 size={13} /></button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  // ================= VIEW: COURSE EDITOR =================
  if (view === 'course' && selectedCourse) {
    return (
      <div>
        <button style={{ ...S.btn, marginBottom: '20px' }} onClick={() => setView('list')}><ArrowLeft size={15} /> К списку курсов</button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid var(--overlay-bg)' }}>
          <div>
            <h2 style={{ fontSize: '1.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: selectedCourse.color }} />
              {selectedCourse.title}
              <button style={{ ...S.btn, padding: '5px 10px' }} onClick={() => {
                setCourseFormData({ title: selectedCourse.title, level: selectedCourse.level, category: selectedCourse.category, color: selectedCourse.color, description: selectedCourse.description });
                setIsEditingCourse(true); setShowCourseForm(true);
              }}><Edit3 size={14} /> Изменить</button>
            </h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>{selectedCourse.description}</p>
          </div>
          <button style={S.btnPrimary} onClick={() => {
            setLessonFormData({ id: '', title: '', subtitle: '', estimatedTime: '15 mins', language: 'python' });
            setIsEditingLesson(false); setShowLessonForm(s => !s);
          }}><PlusCircle size={16} /> Добавить урок</button>
        </div>

        <AnimatePresence>
          {showCourseForm && isEditingCourse && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
              <div style={{ ...S.card, padding: '28px', marginBottom: '28px' }}>
                <form onSubmit={handleSaveCourse}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div><label style={S.label}>Название</label><input required className="ts-input" style={S.input} value={courseFormData.title} onChange={e => setCourseFormData({...courseFormData, title: e.target.value})} /></div>
                    <div><label style={S.label}>Описание</label><input required className="ts-input" style={S.input} value={courseFormData.description} onChange={e => setCourseFormData({...courseFormData, description: e.target.value})} /></div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '18px' }}>
                    <button type="button" style={S.btn} onClick={() => setShowCourseForm(false)}>Отмена</button>
                    <button type="submit" style={S.btnPrimary}><Save size={15} /> Сохранить</button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {showLessonForm && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ ...S.card, padding: '28px', marginBottom: '28px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '22px' }}>{isEditingLesson ? 'Редактировать урок' : 'Новый урок'}</h3>
              <form onSubmit={handleSaveLesson}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {!isEditingLesson && <div><label style={S.label}>Уникальный ID (py-1)</label><input required className="ts-input" style={S.input} value={lessonFormData.id} onChange={e => setLessonFormData({...lessonFormData, id: e.target.value})} /></div>}
                  <div><label style={S.label}>Название</label><input required className="ts-input" style={S.input} value={lessonFormData.title} onChange={e => setLessonFormData({...lessonFormData, title: e.target.value})} /></div>
                  <div><label style={S.label}>Подзаголовок (Урок 1.1)</label><input required className="ts-input" style={S.input} value={lessonFormData.subtitle} onChange={e => setLessonFormData({...lessonFormData, subtitle: e.target.value})} /></div>
                  <div>
                <label style={S.label}>Язык</label>
                <select className="ts-input" style={S.input} value={lessonFormData.language} onChange={e => setLessonFormData({...lessonFormData, language: e.target.value})}>
                  {LANG_OPTIONS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                </select>
              </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '18px' }}>
                  <button type="button" style={S.btn} onClick={() => setShowLessonForm(false)}>Отмена</button>
                  <button type="submit" style={S.btnPrimary} disabled={loading}><Save size={15} /> {isEditingLesson ? 'Обновить' : 'Создать'}</button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {(selectedCourse.lessons || []).map((les, i) => (
            <div key={les.id} className="ts-card-hover" style={{ ...S.card, padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => { setSelectedLesson(les); setView('lesson'); }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--overlay-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{i + 1}</div>
                <div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{les.subtitle}</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '1px 7px', borderRadius: '6px', background: 'var(--overlay-bg)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{les.language}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{les.title}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{ ...S.btn, padding: '6px 12px' }} onClick={(e) => {
                  e.stopPropagation();
                  setLessonFormData({ id: les.id, title: les.title, subtitle: les.subtitle, estimatedTime: les.estimated_time || '15 mins', language: les.language });
                  setIsEditingLesson(true); setShowLessonForm(true);
                }}><Edit3 size={14} /></button>
                <button style={{ ...S.btnDanger, padding: '6px 12px' }} onClick={(e) => handleDeleteLesson(e, les.id, les.title)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ================= VIEW: LESSON CONSTRUCTOR =================
  if (view === 'lesson' && selectedLesson) {
    return (
      <div>
        <button style={{ ...S.btn, marginBottom: '20px' }} onClick={() => setView('course')}><ArrowLeft size={15} /> К урокам курса</button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid var(--overlay-bg)' }}>
          <div>
            <h2 style={{ fontSize: '1.7rem', fontWeight: 800 }}>{selectedLesson.subtitle} - {selectedLesson.title}</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Конструктор блоков. Добавляйте теорию, тесты и практические задания.</p>
          </div>
          <button style={{ ...S.btn, opacity: 0.8 }} onClick={() => window.open(`/lesson/${selectedLesson.id}`, '_blank')}>
            <ExternalLink size={16} /> Открыть
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <button style={{ ...S.btnPrimary, background: '#3b82f6' }} onClick={() => handleAddBlock('theory')}><FileText size={16} /> + Теория</button>
          <button style={{ ...S.btnPrimary, background: 'var(--brand-secondary)' }} onClick={() => handleAddBlock('quiz')}><CheckSquare size={16} /> + Квиз</button>
          <button style={{ ...S.btnPrimary, background: 'var(--success)' }} onClick={() => handleAddBlock('practice')}><Code size={16} /> + Практика</button>
        </div>

        {loadingBlocks ? (
          <div>Загрузка блоков...</div>
        ) : blocks.length === 0 ? (
          <div style={{ ...S.card, padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Блоков нет. Добавьте первый блок.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {blocks.map((b, i) => (
              <div key={b.id} style={{ ...S.card, padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--overlay-bg)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => moveBlock(i, -1)}>▲</button>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => moveBlock(i, 1)}>▼</button>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '1.1rem', textTransform: 'capitalize', color: b.type === 'theory' ? '#3b82f6' : b.type === 'quiz' ? 'var(--brand-secondary)' : 'var(--success)' }}>
                      {b.type === 'theory' ? '📖 Теория' : b.type === 'quiz' ? '❓ Квиз' : '💻 Практика'} (Блок {i + 1})
                    </span>
                  </div>
                  <button style={S.btnDanger} onClick={() => handleDeleteBlock(b.id)}><Trash2 size={14} /></button>
                </div>

                {/* Block Editor per Type */}
                {b.type === 'theory' && (
                  <div>
                    <label style={S.label}>Заголовок теории</label>
                    <input className="ts-input" style={{ ...S.input, marginBottom: '12px' }} value={b.content.title || ''} onChange={e => handleUpdateBlockContent(b.id, { ...b.content, title: e.target.value })} />
                    <label style={S.label}>Текст (HTML/Markdown)</label>
                    <textarea className="ts-input" style={{ ...S.input, minHeight: '150px', resize: 'vertical' }} value={b.content.body || ''} onChange={e => handleUpdateBlockContent(b.id, { ...b.content, body: e.target.value })} />
                  </div>
                )}
                {b.type === 'quiz' && (
                  <div>
                    <label style={S.label}>Порог прохождения (0.0 - 1.0)</label>
                    <input type="number" step="0.1" className="ts-input" style={{ ...S.input, marginBottom: '12px' }} value={b.content.pass_threshold || 0.7} onChange={e => handleUpdateBlockContent(b.id, { ...b.content, pass_threshold: parseFloat(e.target.value) })} />
                    {(b.content.questions || []).map((q, qIndex) => (
                      <div key={q.id} style={{ background: 'var(--dropdown-shadow)', padding: '16px', borderRadius: '12px', marginBottom: '12px' }}>
                        <label style={S.label}>Вопрос {qIndex + 1}</label>
                        <input className="ts-input" style={{ ...S.input, marginBottom: '12px' }} value={q.question} onChange={e => {
                          const nq = [...b.content.questions];
                          nq[qIndex].question = e.target.value;
                          handleUpdateBlockContent(b.id, { ...b.content, questions: nq });
                        }} />
                        <label style={S.label}>Варианты (через запятую)</label>
                        <input className="ts-input" style={{ ...S.input, marginBottom: '12px' }} value={q.options.join(', ')} onChange={e => {
                          const nq = [...b.content.questions];
                          nq[qIndex].options = e.target.value.split(',').map(s => s.trim());
                          handleUpdateBlockContent(b.id, { ...b.content, questions: nq });
                        }} />
                        <label style={S.label}>Индекс правильного ответа (0, 1, 2...)</label>
                        <input type="number" className="ts-input" style={S.input} value={q.correct} onChange={e => {
                          const nq = [...b.content.questions];
                          nq[qIndex].correct = parseInt(e.target.value);
                          handleUpdateBlockContent(b.id, { ...b.content, questions: nq });
                        }} />
                      </div>
                    ))}
                    <button style={S.btn} onClick={() => {
                      const nq = [...(b.content.questions || []), { id: Date.now().toString(), question: 'Новый вопрос', options: ['Опция 1'], correct: 0 }];
                      handleUpdateBlockContent(b.id, { ...b.content, questions: nq });
                    }}><Plus size={14} /> Добавить вопрос</button>
                  </div>
                )}
                {b.type === 'practice' && (
                  <div>
                    <label style={S.label}>Инструкция</label>
                    <textarea className="ts-input" style={{ ...S.input, minHeight: '80px', marginBottom: '12px' }} value={b.content.instructions || ''} onChange={e => handleUpdateBlockContent(b.id, { ...b.content, instructions: e.target.value })} />
                    <label style={S.label}>Начальный код</label>
                    <textarea className="ts-input" style={{ ...S.input, minHeight: '120px', fontFamily: 'monospace', marginBottom: '12px' }} value={b.content.initial_code || ''} onChange={e => handleUpdateBlockContent(b.id, { ...b.content, initial_code: e.target.value })} />
                    <label style={S.label}>Решение</label>
                    <textarea className="ts-input" style={{ ...S.input, minHeight: '120px', fontFamily: 'monospace', marginBottom: '12px' }} value={b.content.solution_code || ''} onChange={e => handleUpdateBlockContent(b.id, { ...b.content, solution_code: e.target.value })} />
                    <label style={S.label}>Тест-кейсы (JSON)</label>
                    <textarea className="ts-input" style={{ ...S.input, minHeight: '120px', fontFamily: 'monospace' }} value={typeof b.content.test_cases === 'string' ? b.content.test_cases : JSON.stringify(b.content.test_cases, null, 2)} onChange={e => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        handleUpdateBlockContent(b.id, { ...b.content, test_cases: parsed });
                      } catch {
                        handleUpdateBlockContent(b.id, { ...b.content, test_cases: e.target.value });
                      }
                    }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
};

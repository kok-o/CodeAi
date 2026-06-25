import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Eye, Globe, EyeOff, Settings2, Layers,
  PanelLeft, PanelRight, ChevronRight, Edit3, Check
} from 'lucide-react';
import { apiCall } from '../../utils/api';
import CourseStructurePanel, { LessonSettingsPanel } from './CourseStructurePanel';
import LessonBlockEditor from './LessonBlockEditor';
import './TeacherStudio.css';

/* ═══════════════════════════════════════════════════════
   COURSE EDITOR — 3-panel IDE-like layout
═══════════════════════════════════════════════════════ */
const CourseEditor = ({ course: initialCourse, onBack, showToast, refreshCourses }) => {
  const [course, setCourse]           = useState(initialCourse);
  const [lessons, setLessons]         = useState(initialCourse?.lessons || []);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [publishing, setPublishing]   = useState(false);
  const [rightPanel, setRightPanel]   = useState('settings');
  const [leftOpen, setLeftOpen]       = useState(true);
  const [rightOpen, setRightOpen]     = useState(true);

  const reloadCourse = useCallback(async () => {
    try {
      const all = await apiCall('/courses');
      const updated = all.find(c => c.id === course.id);
      if (updated) {
        setCourse(updated);
        setLessons(updated.lessons || []);
        if (selectedLesson) {
          const fresh = (updated.lessons || []).find(l => l.id === selectedLesson.id);
          if (fresh) setSelectedLesson(fresh);
        }
      }
    } catch (e) { console.error(e); }
  }, [course.id, selectedLesson]);

  const handleLessonMetaUpdate = useCallback(async (updates) => {
    if (!selectedLesson) return;
    const merged = { ...selectedLesson, ...updates };
    setSelectedLesson(merged);
    setLessons(prev => prev.map(l => l.id === merged.id ? merged : l));
    try {
      await apiCall(`/courses/${course.id}/lessons/${selectedLesson.id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    } catch (e) { showToast('error', 'Ошибка обновления урока: ' + e.message); }
  }, [selectedLesson, course.id]);

  const handleDeleteLesson = async (lesson) => {
    if (!window.confirm(`Удалить урок "${lesson.title}"?`)) return;
    try {
      await apiCall(`/courses/${course.id}/lessons/${lesson.id}`, { method: 'DELETE' });
      showToast('success', 'Урок удалён');
      if (selectedLesson?.id === lesson.id) setSelectedLesson(null);
      await reloadCourse();
      if (refreshCourses) refreshCourses();
    } catch (e) { showToast('error', e.message); }
  };

  const handleReorderLessons = (newOrder) => setLessons(newOrder);
  const isPublished = course?.is_published;

  const handleTogglePublish = async () => {
    setPublishing(true);
    try {
      await apiCall(`/courses/${course.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_published: !isPublished }),
      });
      setCourse(c => ({ ...c, is_published: !isPublished }));
      showToast('success', isPublished ? 'Курс переведён в черновик' : 'Курс опубликован!');
      if (refreshCourses) refreshCourses();
    } catch (e) {
      setCourse(c => ({ ...c, is_published: !isPublished }));
      showToast('success', isPublished ? 'Черновик' : 'Опубликован!');
    } finally { setPublishing(false); }
  };

  // Determine CSS grid class based on panel visibility
  const layoutClass = [
    'ts-editor__layout',
    !leftOpen && !rightOpen ? 'ts-editor__layout--no-both' :
    !leftOpen ? 'ts-editor__layout--no-left' :
    !rightOpen ? 'ts-editor__layout--no-right' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="ts-editor">
      {/* ── Top Bar ── */}
      <div className="ts-editor__topbar">
        {/* Breadcrumb */}
        <div className="ts-editor__breadcrumb">
          <span className="ts-editor__breadcrumb-item" onClick={onBack}>Мои курсы</span>
          <ChevronRight size={14} className="ts-editor__breadcrumb-sep" style={{ color: 'var(--border-subtle)' }} />
          <div className="ts-editor__status-dot" style={{ background: course?.color || 'var(--brand-primary)' }} />
          {selectedLesson ? (
            <>
              <span className="ts-editor__breadcrumb-item" onClick={() => setSelectedLesson(null)}>
                {course?.title}
              </span>
              <ChevronRight size={14} style={{ color: 'var(--border-subtle)', flexShrink: 0 }} />
              <span className="ts-editor__breadcrumb-current">{selectedLesson.title}</span>
            </>
          ) : (
            <span className="ts-editor__breadcrumb-current">{course?.title}</span>
          )}
          <span
            className="ts-editor__publish-badge"
            style={{
              background: isPublished ? 'rgba(52,168,83,0.12)' : 'var(--overlay-bg)',
              color:      isPublished ? 'var(--success)' : 'var(--text-muted)',
              border:     `1px solid ${isPublished ? 'rgba(52,168,83,0.25)' : 'var(--border-subtle)'}`,
            }}
          >
            {isPublished ? '● Опубликован' : '○ Черновик'}
          </span>
        </div>

        {/* Right actions */}
        <div className="ts-editor__topbar-actions">
          {selectedLesson && (
            <button
              className="ts-btn ts-btn--sm"
              onClick={() => window.open('/lesson/' + selectedLesson.id, '_blank')}
            >
              <Eye size={14} /> Предпросмотр
            </button>
          )}

          <button
            className="ts-btn ts-btn--sm"
            style={{
              color:       isPublished ? 'var(--danger)' : 'var(--success)',
              borderColor: isPublished ? 'rgba(234,67,53,0.3)' : 'rgba(52,168,83,0.3)',
            }}
            onClick={handleTogglePublish}
            disabled={publishing}
          >
            {isPublished ? <><EyeOff size={14} /> Скрыть</> : <><Globe size={14} /> Опубликовать</>}
          </button>

          <div className="ts-editor__topbar-divider" />

          {/* Panel toggles */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              className={`ts-editor__panel-toggle ${leftOpen ? 'ts-editor__panel-toggle--active' : ''}`}
              onClick={() => setLeftOpen(!leftOpen)}
              title="Структура курса"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={leftOpen ? 'var(--text-main)' : 'var(--text-muted)'} strokeWidth="1.5">
                <rect x="2" y="2" width="12" height="12" rx="2" />
                <line x1="6" y1="2" x2="6" y2="14" />
                {leftOpen && <path d="M2 4A2 2 0 0 1 4 2H6V14H4A2 2 0 0 1 2 12V4Z" fill="var(--text-main)" stroke="none" />}
              </svg>
            </button>
            <button
              className={`ts-editor__panel-toggle ${rightOpen ? 'ts-editor__panel-toggle--active' : ''}`}
              onClick={() => setRightOpen(!rightOpen)}
              title="Настройки"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={rightOpen ? 'var(--text-main)' : 'var(--text-muted)'} strokeWidth="1.5">
                <rect x="2" y="2" width="12" height="12" rx="2" />
                <line x1="10" y1="2" x2="10" y2="14" />
                {rightOpen && <path d="M10 2H12A2 2 0 0 1 14 4V12A2 2 0 0 1 12 14H10V2Z" fill="var(--text-main)" stroke="none" />}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── 3-panel layout ── */}
      <div className={layoutClass}>
        {/* LEFT: Course structure */}
        <div
          className="ts-editor__left"
          style={{ opacity: leftOpen ? 1 : 0 }}
        >
          <CourseStructurePanel
            course={course}
            lessons={lessons}
            selectedLesson={selectedLesson}
            onSelectLesson={setSelectedLesson}
            onReorder={handleReorderLessons}
            onDelete={handleDeleteLesson}
            onAddLesson={reloadCourse}
            showToast={showToast}
          />
        </div>

        {/* CENTER: Block editor */}
        <div className="ts-editor__center">
          <LessonBlockEditor
            lesson={selectedLesson}
            showToast={showToast}
          />
        </div>

        {/* RIGHT: Settings */}
        <div
          className="ts-editor__right"
          style={{ opacity: rightOpen ? 1 : 0 }}
        >
          <div className="ts-panel-tabs">
            {[
              { id: 'settings', icon: <Settings2 size={14} />, label: 'Настройки' },
              { id: 'info',     icon: <Layers size={14} />,    label: 'Курс' },
            ].map(tab => (
              <button
                key={tab.id}
                className={`ts-panel-tab ${rightPanel === tab.id ? 'ts-panel-tab--active' : ''}`}
                onClick={() => setRightPanel(tab.id)}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {rightPanel === 'settings' ? (
              <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <LessonSettingsPanel lesson={selectedLesson} onUpdate={handleLessonMetaUpdate} />
              </motion.div>
            ) : (
              <motion.div key="info" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <CourseInfoPanel course={course} onUpdate={setCourse} showToast={showToast} lessons={lessons} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

/* ── Course Info Panel (right panel) ── */
const CourseInfoPanel = ({ course, onUpdate, showToast, lessons }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState({ title: course.title, description: course.description });
  const [saving, setSaving]   = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await apiCall(`/courses/${course.id}`, { method: 'PUT', body: JSON.stringify(form) });
      onUpdate(prev => ({ ...prev, ...updated }));
      showToast('success', 'Курс обновлён!');
      setEditing(false);
    } catch (e) { showToast('error', e.message); }
    finally { setSaving(false); }
  };

  const rows = [
    { key: 'Название',    field: 'title',       type: 'input' },
    { key: 'Описание',    field: 'description', type: 'textarea' },
    { key: 'Категория',   value: course.category },
    { key: 'Уровень',     value: course.level },
    { key: 'Уроков',      value: lessons.length },
    { key: 'Студентов',   value: course.students || 0 },
  ];

  return (
    <div className="ts-info-panel">
      <div className="ts-info-panel__header">
        <span className="ts-info-panel__section">О курсе</span>
        <button
          className="ts-btn ts-btn--xs"
          style={editing ? { color: 'var(--success)', borderColor: 'rgba(52,168,83,0.3)' } : undefined}
          onClick={() => editing ? handleSave() : setEditing(true)}
        >
          {saving ? '...' : editing ? <><Check size={14} style={{ marginRight: '4px' }}/> Сохранить</> : <><Edit3 size={14} /> Изменить</>}
        </button>
      </div>

      {rows.map(row => (
        <div key={row.key} className="ts-info-panel__row">
          <div className="ts-info-panel__key">{row.key}</div>
          {editing && row.field ? (
            row.type === 'textarea' ? (
              <textarea
                className="ts-textarea"
                style={{ minHeight: '70px', fontSize: '0.85rem' }}
                value={form[row.field]}
                onChange={e => setForm(f => ({ ...f, [row.field]: e.target.value }))}
              />
            ) : (
              <input
                className="ts-input"
                style={{ fontSize: '0.85rem' }}
                value={form[row.field]}
                onChange={e => setForm(f => ({ ...f, [row.field]: e.target.value }))}
              />
            )
          ) : (
            <div className="ts-info-panel__value">
              {row.value ?? form[row.field] ?? course[row.field]}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CourseEditor;

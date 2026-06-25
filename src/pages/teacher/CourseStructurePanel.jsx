import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, Trash2, GripVertical, Eye, Settings } from 'lucide-react';
import { apiCall } from '../../utils/api';
import { useDragAndDrop } from './useDragAndDrop';
import './TeacherStudio.css';

const LANG_OPTIONS = [
  { id: 'python',     label: 'Python',     icon: '🐍' },
  { id: 'javascript', label: 'JavaScript', icon: '⚡' },
  { id: 'csharp',     label: 'C#',         icon: '🔷' },
  { id: 'java',       label: 'Java',       icon: '☕' },
  { id: 'cpp',        label: 'C++',        icon: '⚙️' },
];

/* ═══════════════════════════════════════════════════════
   LESSON SETTINGS PANEL (right panel)
═══════════════════════════════════════════════════════ */
export const LessonSettingsPanel = ({ lesson, onUpdate }) => {
  if (!lesson) return (
    <div className="ts-settings-panel__empty">
      <Settings size={32} style={{ opacity: 0.2 }} />
      <p>Выберите урок для настройки</p>
    </div>
  );

  return (
    <div className="ts-settings-panel">
      <div className="ts-settings-panel__title">Настройки урока</div>

      <div>
        <label className="ts-label">Язык</label>
        <select
          className="ts-select"
          value={lesson.language || 'python'}
          onChange={e => onUpdate({ language: e.target.value })}
        >
          {LANG_OPTIONS.map(l => <option key={l.id} value={l.id}>{l.icon} {l.label}</option>)}
        </select>
      </div>

      <div>
        <label className="ts-label">Расчётное время</label>
        <select
          className="ts-select"
          value={lesson.estimated_time || '15 mins'}
          onChange={e => onUpdate({ estimated_time: e.target.value })}
        >
          {['5 mins', '10 mins', '15 mins', '20 mins', '30 mins', '45 mins', '60 mins'].map(t => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="ts-label">Подзаголовок</label>
        <input
          className="ts-input"
          value={lesson.subtitle || ''}
          placeholder="Урок 1.1"
          onChange={e => onUpdate({ subtitle: e.target.value })}
        />
      </div>

      <button
        className="ts-btn"
        style={{ width: '100%', justifyContent: 'center', gap: '8px', marginTop: '8px' }}
        onClick={() => window.open('/lesson/' + lesson.id, '_blank')}
      >
        <Eye size={14} /> Предпросмотр
      </button>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   ADD LESSON FORM
═══════════════════════════════════════════════════════ */
const AddLessonForm = ({ courseId, onCreated, onCancel, showToast }) => {
  const [form, setForm]   = useState({ title: '', subtitle: 'Урок 1.1', language: 'python' });
  const [saving, setSaving] = useState(false);

  const generateId = (title) =>
    title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 30) + '-' + Date.now().toString(36);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await apiCall(`/courses/${courseId}/lessons`, {
        method: 'POST',
        body: JSON.stringify({
          id: generateId(form.title),
          title: form.title,
          subtitle: form.subtitle,
          estimatedTime: '15 mins',
          language: form.language,
          instructions: 'Новый урок',
          initialCode: '', solutionCode: '', testCases: [],
        }),
      });
      showToast('success', 'Урок добавлен!');
      onCreated();
    } catch (e) { showToast('error', e.message); }
    finally { setSaving(false); }
  };

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      onSubmit={handleSubmit}
      className="ts-add-lesson-form"
    >
      <div className="ts-add-lesson-form__fields">
        <input
          autoFocus required
          className="ts-input"
          style={{ background: 'var(--bg-card)' }}
          value={form.title}
          placeholder="Название урока"
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
        />
        <div className="ts-add-lesson-form__grid">
          <input
            className="ts-input"
            style={{ background: 'var(--bg-card)', fontSize: '0.82rem', padding: '7px 10px' }}
            value={form.subtitle}
            placeholder="Урок 1.1"
            onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
          />
          <select
            className="ts-select"
            style={{ background: 'var(--bg-card)', fontSize: '0.82rem', padding: '7px 10px' }}
            value={form.language}
            onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
          >
            {LANG_OPTIONS.map(l => <option key={l.id} value={l.id}>{l.icon} {l.label}</option>)}
          </select>
        </div>
      </div>
      <div className="ts-add-lesson-form__actions">
        <button type="submit" disabled={saving} className="ts-btn ts-btn--primary ts-btn--sm">
          {saving ? '...' : 'Создать'}
        </button>
        <button type="button" className="ts-btn ts-btn--sm" onClick={onCancel}>Отмена</button>
      </div>
    </motion.form>
  );
};

/* ═══════════════════════════════════════════════════════
   COURSE STRUCTURE PANEL
═══════════════════════════════════════════════════════ */
const CourseStructurePanel = ({
  course, lessons, selectedLesson,
  onSelectLesson, onReorder, onDelete, onAddLesson, showToast
}) => {
  const [showAddForm, setShowAddForm] = useState(false);

  const { dragOverIndex, dropPosition, getDragProps } = useDragAndDrop(lessons, async (newOrder) => {
    const updated = newOrder.map((l, i) => ({ ...l, order_index: i }));
    onReorder(updated);
    try {
      await apiCall(`/courses/${course.id}/lessons/reorder`, {
        method: 'POST',
        body: JSON.stringify({ lessons: updated.map(l => ({ id: l.id, order_index: l.order_index })) }),
      });
    } catch (e) { showToast('error', 'Ошибка сохранения порядка'); }
  });

  return (
    <div className="ts-structure">
      {/* Panel header */}
      <div className="ts-structure__header">
        <div className="ts-structure__section-label">Структура курса</div>
        <div className="ts-structure__course-title">
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: course?.color || 'var(--brand-primary)', flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{course?.title}</span>
        </div>
        <div className="ts-structure__count">{lessons.length} урок(ов)</div>
      </div>

      {/* Lessons list */}
      <div className="ts-structure__scroll">
        <AnimatePresence>
          {lessons.map((lesson, i) => {
            const isActive   = selectedLesson?.id === lesson.id;
            const isDragOver = dragOverIndex === i;

            return (
              <motion.div
                key={lesson.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, height: 0 }}
                {...getDragProps(i)}
                onClick={() => onSelectLesson(lesson)}
                className={`ts-lesson-row ${isActive ? 'ts-lesson-row--active' : ''} ${isDragOver ? 'ts-lesson-row--drag-over' : ''}`}
              >
                <GripVertical size={13} className="ts-lesson-row__grip" />
                <div className="ts-lesson-row__num">{i + 1}</div>
                <div className="ts-lesson-row__info">
                  <div className="ts-lesson-row__title">{lesson.title}</div>
                  {lesson.subtitle && (
                    <div className="ts-lesson-row__subtitle">{lesson.subtitle}</div>
                  )}
                </div>
                <button
                  className="ts-lesson-row__delete"
                  onClick={e => { e.stopPropagation(); onDelete(lesson); }}
                  title="Удалить урок"
                >
                  <Trash2 size={12} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>

        <AnimatePresence>
          {showAddForm && (
            <AddLessonForm
              courseId={course?.id}
              onCreated={() => { setShowAddForm(false); onAddLesson(); }}
              onCancel={() => setShowAddForm(false)}
              showToast={showToast}
            />
          )}
        </AnimatePresence>

        {!showAddForm && (
          <button
            className="ts-add-lesson-btn"
            onClick={() => setShowAddForm(true)}
          >
            <PlusCircle size={13} /> Добавить урок
          </button>
        )}
      </div>
    </div>
  );
};

export default CourseStructurePanel;

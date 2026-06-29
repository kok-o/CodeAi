import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, CheckSquare, Code, Trash2, GripVertical,
  ChevronDown, ChevronUp, ChevronRight, Plus, Copy, Save,
  Bold, Italic, List, Link, Hash, Code2,
  CheckCircle, AlertCircle, ArrowLeft, Edit3, Eye
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { marked } from 'marked';
import { apiCall } from '../../utils/api';
import { useDragAndDrop } from './useDragAndDrop';
import './TeacherStudio.css';

/* ─── Configure marked ─── */
marked.setOptions({
  breaks: true,
  gfm: true,
});

const BLOCK_META = {
  theory:   { label: 'Теория',   icon: <FileText size={15} />,    color: 'var(--brand-primary)', typeClass: 'ts-block-card--theory' },
  quiz:     { label: 'Квиз',     icon: <CheckSquare size={15} />, color: '#a855f7',               typeClass: 'ts-block-card--quiz' },
  practice: { label: 'Практика', icon: <Code size={15} />,        color: 'var(--success)',        typeClass: 'ts-block-card--practice' },
};

const LANG_OPTIONS = [
  { id: 'python',     label: 'Python' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'csharp',     label: 'C#' },
  { id: 'java',       label: 'Java' },
  { id: 'cpp',        label: 'C++' },
];

/* ═══════════════════════════════════════════════════════
   MARKDOWN FORMATTING TOOLBAR
═══════════════════════════════════════════════════════ */
const FmtToolbar = ({ textareaRef, value, onChange }) => {
  const wrap = (before, after = before, defaultText = 'текст') => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end   = el.selectionEnd;
    const sel   = value.slice(start, end) || defaultText;
    const newVal = value.slice(0, start) + before + sel + after + value.slice(end);
    onChange(newVal);
    // restore cursor after state update
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + sel.length);
    }, 0);
  };

  const insertLine = (prefix) => {
    const el = textareaRef.current;
    if (!el) return;
    const start  = el.selectionStart;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const newVal = value.slice(0, lineStart) + prefix + value.slice(lineStart);
    onChange(newVal);
    setTimeout(() => { el.focus(); el.setSelectionRange(start + prefix.length, start + prefix.length); }, 0);
  };

  const buttons = [
    { label: 'B',    title: 'Жирный (Ctrl+B)',      action: () => wrap('**', '**', 'жирный') },
    { label: 'I',    title: 'Курсив (Ctrl+I)',       action: () => wrap('*', '*', 'курсив') },
    { label: '`',    title: 'Код (inline)',           action: () => wrap('`', '`', 'код') },
    null, // separator
    { label: 'H1',   title: 'Заголовок 1',           action: () => insertLine('# ') },
    { label: 'H2',   title: 'Заголовок 2',           action: () => insertLine('## ') },
    { label: 'H3',   title: 'Заголовок 3',           action: () => insertLine('### ') },
    null,
    { label: '— ',   title: 'Маркированный список',  action: () => insertLine('- ') },
    { label: '1.',   title: 'Нумерованный список',   action: () => insertLine('1. ') },
    null,
    { label: '```',  title: 'Блок кода',             action: () => wrap('```\n', '\n```', 'код здесь') },
    { label: '> ',   title: 'Цитата',                action: () => insertLine('> ') },
  ];

  return (
    <div className="ts-fmt-toolbar">
      {buttons.map((btn, i) =>
        btn === null ? (
          <div key={i} className="ts-fmt-btn--sep" />
        ) : (
          <button key={i} type="button" className="ts-fmt-btn" title={btn.title} onClick={btn.action}>
            {btn.label}
          </button>
        )
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   THEORY BLOCK EDITOR
═══════════════════════════════════════════════════════ */
const TheoryBlockEditor = ({ block, onChange }) => {
  const c           = block.content || {};
  const textareaRef = useRef(null);
  const html        = c.body ? marked.parse(c.body) : '<p style="color:var(--text-muted);font-style:italic">Введите текст теории слева...</p>';

  return (
    <div className="ts-theory-editor">
      <div>
        <label className="ts-label">Заголовок раздела</label>
        <input
          className="ts-input"
          value={c.title || ''}
          placeholder="Что такое функции?"
          onChange={e => onChange({ ...c, title: e.target.value })}
        />
      </div>

      <div>
        <label className="ts-label">Текст теории (Markdown)</label>
        <FmtToolbar
          textareaRef={textareaRef}
          value={c.body || ''}
          onChange={body => onChange({ ...c, body })}
        />
        <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '0 0 8px 8px', backgroundColor: 'var(--surface-sunken)', display: 'flex', flexDirection: 'column' }}>
          <textarea
            ref={textareaRef}
            className="ts-theory-split__textarea"
            style={{ minHeight: '350px', resize: 'vertical', border: 'none', borderRadius: '0 0 8px 8px' }}
            value={c.body || ''}
            placeholder={'# Заголовок\n\nТекст с **жирным** и `кодом`...'}
            onChange={e => onChange({ ...c, body: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   QUIZ BLOCK EDITOR
═══════════════════════════════════════════════════════ */
const QuizBlockEditor = ({ block, onChange }) => {
  const c         = block.content || {};
  const questions = c.questions || [];

  const updateQ  = (idx, upd) => onChange({ ...c, questions: questions.map((q, i) => i === idx ? { ...q, ...upd } : q) });
  const addQ     = () => onChange({ ...c, questions: [...questions, { id: Date.now().toString(), question: '', options: ['', '', '', ''], correct: 0, explanation: '' }] });
  const removeQ  = (idx) => onChange({ ...c, questions: questions.filter((_, i) => i !== idx) });
  const duplicateQ = (idx) => onChange({ ...c, questions: [...questions.slice(0, idx + 1), { ...questions[idx], id: Date.now().toString() }, ...questions.slice(idx + 1)] });

  return (
    <div className="ts-quiz-editor">
      <div className="ts-quiz-settings">
        <div>
          <label className="ts-label">Порог прохождения (%)</label>
          <input
            type="number" min={0} max={100}
            className="ts-input"
            value={Math.round((c.pass_threshold || 0.7) * 100)}
            onChange={e => onChange({ ...c, pass_threshold: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) / 100 })}
          />
        </div>
        <div className="ts-quiz-threshold-info">
          <div className="ts-quiz-threshold-badge">{questions.length} вопрос(ов)</div>
        </div>
      </div>

      {questions.map((q, idx) => (
        <div key={q.id || idx} className="ts-quiz-question">
          <div className="ts-quiz-question__header">
            <span className="ts-quiz-question__num">Вопрос {idx + 1}</span>
            <div className="ts-quiz-question__actions">
              <button
                className="ts-btn ts-btn--ghost ts-btn--icon"
                title="Дублировать вопрос"
                onClick={() => duplicateQ(idx)}
                style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}
              >
                <Copy size={13} />
              </button>
              <button
                className="ts-btn ts-btn--ghost ts-btn--icon"
                title="Удалить вопрос"
                onClick={() => removeQ(idx)}
                style={{ color: 'var(--danger)' }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          <div className="ts-quiz-question__body">
            <div>
              <label className="ts-label">Текст вопроса</label>
              <input
                className="ts-input"
                value={q.question}
                placeholder="Что выведет print(2+2)?"
                onChange={e => updateQ(idx, { question: e.target.value })}
              />
            </div>

            <div>
              <label className="ts-label">Варианты (нажми ○ для правильного)</label>
              <div className="ts-quiz-options">
                {(q.options || []).map((opt, oi) => (
                  <div key={oi} className="ts-quiz-option">
                    <button
                      type="button"
                      className={`ts-quiz-option__radio ${q.correct === oi ? 'ts-quiz-option__radio--correct' : ''}`}
                      onClick={() => updateQ(idx, { correct: oi })}
                      title="Отметить как правильный"
                    >
                      {q.correct === oi ? '✓' : oi + 1}
                    </button>
                    <input
                      className={`ts-quiz-option__input ${q.correct === oi ? 'ts-quiz-option__input--correct' : ''}`}
                      value={opt}
                      placeholder={`Вариант ${oi + 1}`}
                      onChange={e => {
                        const no = [...q.options];
                        no[oi] = e.target.value;
                        updateQ(idx, { options: no });
                      }}
                    />
                    {q.options.length > 2 && (
                      <button
                        type="button"
                        className="ts-btn ts-btn--ghost ts-btn--icon"
                        style={{ color: 'var(--danger)', flexShrink: 0 }}
                        onClick={() => {
                          const no = q.options.filter((_, i) => i !== oi);
                          updateQ(idx, { options: no, correct: Math.min(q.correct, no.length - 1) });
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
                {q.options.length < 6 && (
                  <button
                    type="button"
                    className="ts-quiz-add-option"
                    onClick={() => updateQ(idx, { options: [...q.options, ''] })}
                  >
                    <Plus size={12} /> Вариант
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="ts-label">Объяснение (необязательно)</label>
              <input
                className="ts-input"
                style={{ fontSize: '0.83rem' }}
                value={q.explanation || ''}
                placeholder="Объяснение правильного ответа..."
                onChange={e => updateQ(idx, { explanation: e.target.value })}
              />
            </div>
          </div>
        </div>
      ))}

      <button type="button" className="ts-quiz-add-question-btn" onClick={addQ}>
        <Plus size={15} /> Добавить вопрос
      </button>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   PRACTICE BLOCK EDITOR
═══════════════════════════════════════════════════════ */
const PracticeBlockEditor = ({ block, onChange }) => {
  const c         = block.content || {};

  return (
    <div className="ts-practice-editor">
      <div>
        <label className="ts-label">Язык</label>
        <select
          className="ts-select"
          value={c.language || 'python'}
          onChange={e => onChange({ ...c, language: e.target.value })}
        >
          {LANG_OPTIONS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
        </select>
      </div>

      <div>
        <label className="ts-label">Задание (инструкция)</label>
        <textarea
          className="ts-textarea"
          style={{ minHeight: '80px' }}
          value={c.instructions || ''}
          placeholder="Напишите функцию sum(a, b)..."
          onChange={e => onChange({ ...c, instructions: e.target.value })}
        />
      </div>

      <div>
        <label className="ts-label">Стартовый код</label>
        <div className="ts-practice-editor__monaco">
          <Editor
            height="160px"
            language={c.language || 'python'}
            theme="vs-dark"
            value={c.initial_code || ''}
            onChange={val => onChange({ ...c, initial_code: val || '' })}
            options={{ minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false, lineNumbers: 'on', padding: { top: 8 } }}
          />
        </div>
      </div>

      <div>
        <label className="ts-label">Эталонное решение (только для учителя)</label>
        <div className="ts-practice-editor__monaco">
          <Editor
            height="160px"
            language={c.language || 'python'}
            theme="vs-dark"
            value={c.solution_code || ''}
            onChange={val => onChange({ ...c, solution_code: val || '' })}
            options={{ minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false, lineNumbers: 'on', padding: { top: 8 } }}
          />
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   BLOCK CARD
═══════════════════════════════════════════════════════ */
const BlockCard = ({ block, dragProps, dragOver, onDelete, onDuplicate, onEdit }) => {
  const meta = BLOCK_META[block.type] || BLOCK_META.theory;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={`ts-block-card ${meta.typeClass} ${dragOver ? 'ts-block-card--drag-over' : ''}`}
      onClick={() => onEdit(block.id)}
      style={{ cursor: 'pointer' }}
    >
      {/* Header */}
      <div className="ts-block-card__header ts-block-card__header--collapsed">
        {/* Grip — stops click propagation */}
        <div
          className="ts-block-card__grip"
          {...dragProps}
          onClick={e => e.stopPropagation()}
        >
          <GripVertical size={16} />
        </div>

        {/* Type label */}
        <div className="ts-block-card__type-icon">
          <span style={{ color: meta.color }}>{meta.icon}</span>
          <span className="ts-block-card__type-label" style={{ color: meta.color }}>{meta.label}</span>
          {block.content?.title && (
            <span className="ts-block-card__content-title">— {block.content.title}</span>
          )}
        </div>

        {/* Actions */}
        <div className="ts-block-card__header-actions" onClick={e => e.stopPropagation()}>
          <button
            className="ts-block-card__action-btn ts-block-card__action-btn--copy"
            title="Дублировать блок"
            onClick={() => onDuplicate(block.id)}
          >
            <Copy size={13} />
          </button>
          <button
            className="ts-block-card__action-btn ts-block-card__action-btn--danger"
            title="Удалить блок"
            onClick={() => onDelete(block.id)}
          >
            <Trash2 size={13} />
          </button>
          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', marginLeft: '4px' }}>
            <ChevronRight size={16} />
          </span>
        </div>
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════
   MAIN: LESSON BLOCK EDITOR
═══════════════════════════════════════════════════════ */
const LessonBlockEditor = ({ lesson, showToast }) => {
  const [blocks, setBlocks]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saveStatus, setSaveStatus] = useState('idle');  // 'idle' | 'unsaved' | 'saving' | 'saved'
  const [dirtyBlocks, setDirtyBlocks] = useState(new Set()); // IDs of blocks with unsaved changes
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const listRef = useRef(null);

  /* ── Load blocks ── */
  useEffect(() => {
    if (!lesson?.id) return;
    setLoading(true);
    setBlocks([]);
    setDirtyBlocks(new Set());
    setSaveStatus('idle');
    setSelectedBlockId(null);
    apiCall(`/lessons/${lesson.id}/blocks`)
      .then(data => setBlocks(data || []))
      .catch(e => showToast('error', 'Ошибка загрузки блоков: ' + e.message))
      .finally(() => setLoading(false));
  }, [lesson?.id]);

  /* ── Add block ── */
  const addBlock = async (type) => {
    const defaults = {
      theory:   { title: 'Новая теория', body: '' },
      quiz:     { questions: [{ id: Date.now().toString(), question: '', options: ['', '', '', ''], correct: 0, explanation: '' }], pass_threshold: 0.7 },
      practice: { instructions: '', initial_code: '', solution_code: '', language: lesson?.language || 'python', test_cases: [] },
    };
    try {
      const nb = await apiCall(`/lessons/${lesson.id}/blocks`, {
        method: 'POST',
        body: JSON.stringify({ type, order_index: blocks.length, content: defaults[type] }),
      });
      setBlocks(prev => [...prev, nb]);
      setTimeout(() => {
        if (listRef.current) listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
      }, 150);
    } catch (e) { showToast('error', e.message); }
  };

  /* ── Content change (local only, marks dirty) ── */
  const handleContentChange = useCallback((blockId, newContent) => {
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, content: newContent } : b));
    setDirtyBlocks(prev => new Set(prev).add(blockId));
    setSaveStatus('unsaved');
  }, []);

  /* ── Duplicate block ── */
  const handleDuplicate = async (blockId) => {
    const src = blocks.find(b => b.id === blockId);
    if (!src) return;
    try {
      const nb = await apiCall(`/lessons/${lesson.id}/blocks`, {
        method: 'POST',
        body: JSON.stringify({ type: src.type, order_index: blocks.length, content: src.content }),
      });
      setBlocks(prev => [...prev, nb]);
      showToast('success', 'Блок продублирован');
    } catch (e) { showToast('error', e.message); }
  };

  /* ── Delete block ── */
  const handleDelete = async (blockId) => {
    if (!window.confirm('Удалить блок?')) return;
    try {
      await apiCall(`/lessons/${lesson.id}/blocks/${blockId}`, { method: 'DELETE' });
      setBlocks(prev => prev.filter(b => b.id !== blockId));
      setDirtyBlocks(prev => { const s = new Set(prev); s.delete(blockId); return s; });
      if (selectedBlockId === blockId) setSelectedBlockId(null);
      if (dirtyBlocks.size <= 1) setSaveStatus('idle');
    } catch (e) { showToast('error', e.message); }
  };

  /* ── Reorder blocks ── */
  const handleReorder = async (newBlocks) => {
    const updated = newBlocks.map((b, i) => ({ ...b, order_index: i }));
    setBlocks(updated);
    try {
      await apiCall(`/lessons/${lesson.id}/blocks/reorder`, {
        method: 'POST',
        body: JSON.stringify({ blocks: updated.map(b => ({ id: b.id, order_index: b.order_index })) }),
      });
    } catch (e) { showToast('error', 'Ошибка сохранения порядка'); }
  };

  /* ── EXPLICIT SAVE (saves ALL dirty blocks) ── */
  const handleSaveAll = async () => {
    if (dirtyBlocks.size === 0) return;
    setSaveStatus('saving');
    let errors = 0;
    for (const blockId of dirtyBlocks) {
      const block = blocks.find(b => b.id === blockId);
      if (!block) continue;
      try {
        await apiCall(`/lessons/${lesson.id}/blocks/${blockId}`, {
          method: 'PUT',
          body: JSON.stringify({ type: block.type, order_index: block.order_index, content: block.content }),
        });
      } catch {
        errors++;
      }
    }
    if (errors > 0) {
      showToast('error', `${errors} блок(ов) не удалось сохранить`);
      setSaveStatus('unsaved');
    } else {
      setDirtyBlocks(new Set());
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const { dragOverIndex, getDragProps } = useDragAndDrop(blocks, handleReorder);

  /* ── Empty lesson selection ── */
  if (!lesson) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: '16px' }}>
        <FileText size={48} style={{ opacity: 0.12 }} />
        <p style={{ fontSize: '1rem' }}>Выберите урок в левой панели</p>
      </div>
    );
  }

  const saveStatusLabel = {
    idle:    null,
    unsaved: <><AlertCircle size={14} /> Не сохранено</>,
    saving:  <><div className="ts-spinner" style={{ width: '13px', height: '13px' }} /> Сохранение...</>,
    saved:   <><CheckCircle size={14} /> Сохранено</>,
  };

  return (
    <div className="ts-block-editor">
      {/* Toolbar */}
      <div className="ts-block-editor__toolbar">
        <div className="ts-block-editor__lesson-info">
          <div className="ts-block-editor__lesson-eyebrow">Редактор урока</div>
          <div className="ts-block-editor__lesson-title">{lesson.title}</div>
        </div>

        <div className="ts-block-editor__toolbar-right">
          {/* Save status indicator */}
          {saveStatus !== 'idle' && (
            <div className={`ts-save-status ts-save-status--${saveStatus}`}>
              {saveStatusLabel[saveStatus]}
            </div>
          )}

          {/* Explicit save button */}
          <button
            className="ts-btn ts-btn--primary ts-btn--sm"
            onClick={handleSaveAll}
            disabled={dirtyBlocks.size === 0 || saveStatus === 'saving'}
            style={{ opacity: dirtyBlocks.size === 0 ? 0.5 : 1 }}
          >
            <Save size={14} /> Сохранить {dirtyBlocks.size > 0 ? `(${dirtyBlocks.size})` : ''}
          </button>

          {/* Add block buttons (only show if not editing a specific block) */}
          {!selectedBlockId && [
            { type: 'theory',   label: '+ Теория' },
            { type: 'quiz',     label: '+ Квиз' },
            { type: 'practice', label: '+ Практика' },
          ].map(({ type, label }) => (
            <button
              key={type}
              className={`ts-add-block-btn ts-add-block-btn--${type}`}
              onClick={() => addBlock(type)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Editor or List view */}
      {selectedBlockId ? (() => {
        const activeBlock = blocks.find(b => b.id === selectedBlockId);
        if (!activeBlock) {
          setSelectedBlockId(null);
          return null;
        }
        return (
          <div className="ts-block-editor__active-pane" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center' }}>
              <motion.div
                whileHover="hover"
                initial="rest"
                animate="rest"
                onClick={() => setSelectedBlockId(null)}
                style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', margin: '-4px -8px' }}
              >
                <motion.div
                  variants={{ rest: { width: 0, opacity: 0, marginRight: 0 }, hover: { width: 16, opacity: 1, marginRight: 8 } }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                >
                  <ArrowLeft size={16} />
                </motion.div>
                <div className="ts-block-card__type-icon" style={{ margin: 0 }}>
                  <span style={{ color: BLOCK_META[activeBlock.type]?.color }}>{BLOCK_META[activeBlock.type]?.icon}</span>
                  <span className="ts-block-card__type-label" style={{ color: BLOCK_META[activeBlock.type]?.color }}>{BLOCK_META[activeBlock.type]?.label}</span>
                </div>
              </motion.div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {activeBlock.type === 'theory'   && <TheoryBlockEditor   block={activeBlock} onChange={c => handleContentChange(activeBlock.id, c)} />}
              {activeBlock.type === 'quiz'     && <QuizBlockEditor     block={activeBlock} onChange={c => handleContentChange(activeBlock.id, c)} />}
              {activeBlock.type === 'practice' && <PracticeBlockEditor block={activeBlock} onChange={c => handleContentChange(activeBlock.id, c)} />}
            </div>
          </div>
        );
      })() : (
        <div ref={listRef} className="ts-block-editor__blocks">
          {loading ? (
            [...Array(2)].map((_, i) => (
              <div key={i} className="ts-block-card ts-skeleton" style={{ height: '80px' }} />
            ))
          ) : blocks.length === 0 ? (
            <div className="ts-block-editor__empty">
              <Code2 size={48} style={{ opacity: 0.15, marginBottom: '16px' }} />
              <p style={{ fontSize: '0.9rem' }}>Блоков нет — добавь теорию, квиз или практику</p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                {['theory', 'quiz', 'practice'].map(type => (
                  <button key={type} className={`ts-add-block-btn ts-add-block-btn--${type}`} onClick={() => addBlock(type)}>
                    + {BLOCK_META[type].label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <AnimatePresence>
              {blocks.map((b, i) => (
                <BlockCard
                  key={b.id}
                  block={b}
                  dragProps={getDragProps(i)}
                  dragOver={dragOverIndex === i}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                  onEdit={setSelectedBlockId}
                />
              ))}
            </AnimatePresence>
          )}
          <div className="ts-block-editor__spacer" />
        </div>
      )}
    </div>
  );
};

export default LessonBlockEditor;

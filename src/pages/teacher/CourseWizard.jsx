import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, CheckCircle, ChevronRight, ChevronLeft, X, Target, Camera, Trash2 } from 'lucide-react';
import { apiCall } from '../../utils/api';
import ImageCropperModal from '../../components/ImageCropperModal';
import './TeacherStudio.css';

const CATEGORIES = ['Python', 'JavaScript', 'C#', 'Java', 'C++', 'Web Dev', 'SQL', 'Алгоритмы', 'React', 'Node.js'];
const LEVELS = [
  { id: 'Beginner',     label: 'Beginner',     icon: <Target size={28} color="var(--success)" />, desc: 'Для начинающих' },
  { id: 'Intermediate', label: 'Intermediate', icon: <Target size={28} color="var(--warning)" />, desc: 'Базовые знания нужны' },
  { id: 'Advanced',     label: 'Advanced',     icon: <Target size={28} color="var(--danger)" />, desc: 'Для опытных' },
];
const PALETTE = ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#14b8a6', '#f97316'];
const STEPS = ['Основная информация', 'Уровень и категория', 'Обложка'];

const stepVariants = {
  enter: (dir) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:   (dir) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

const CourseWizard = ({ onCreated, onCancel, showToast }) => {
  const [step, setStep]   = useState(0);
  const [dir, setDir]     = useState(1);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm]   = useState({
    title: '', description: '',
    level: 'Beginner', category: 'Python',
    color: '#6366f1', image_url: '',
  });

  const fileInputRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [cropModalData, setCropModalData] = useState(null);

  const getBaseUrl = () => {
    const url = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return url.replace(/\/api$/, '');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast('error', 'Только форматы JPG, PNG, WEBP');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'Размер файла должен быть меньше 5 МБ');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropModalData({
        imageSrc: reader.result,
        aspect: 16 / 9,
      });
      e.target.value = null;
    };
    reader.onerror = () => {
      showToast('error', "Ошибка чтения файла");
      e.target.value = null;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCrop = async (croppedBase64) => {
    setCropModalData(null);
    setUploadingImage(true);
    try {
      const res = await apiCall('/upload-image', {
        method: 'POST',
        body: JSON.stringify({ base64Data: croppedBase64 })
      });
      update('image_url', getBaseUrl() + res.imageUrl);
      showToast('success', 'Фон успешно загружен!');
    } catch (err) {
      showToast('error', err.message || "Ошибка загрузки фото");
    } finally {
      setUploadingImage(false);
    }
  };

  const goTo = (target) => {
    if (target < step) { // going back is always allowed
      setDir(-1);
      setStep(target);
      return;
    }
    // Validate current step before advancing
    const errs = validateStep(step);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setDir(1);
    setStep(target);
  };

  const goNext = () => goTo(step + 1);
  const goPrev = () => goTo(step - 1);
  const update = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => { const n = { ...e }; delete n[field]; return n; });
  };

  const validateStep = (s) => {
    const errs = {};
    if (s === 0) {
      if (!form.title.trim())       errs.title       = 'Введи название курса';
      if (!form.description.trim()) errs.description = 'Введи описание курса';
    }
    return errs;
  };

  const handleCreate = async () => {
    const errs = validateStep(0);
    if (Object.keys(errs).length > 0) {
      showToast('error', 'Заполни название и описание курса');
      setDir(-1); setStep(0);
      setErrors(errs);
      return;
    }
    setSaving(true);
    try {
      const course = await apiCall('/courses', { method: 'POST', body: JSON.stringify(form) });
      showToast('success', `Курс "${course.title}" создан!`);
      onCreated(course);
    } catch (e) { showToast('error', e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="ts-wizard">
      {/* Header */}
      <div className="ts-wizard__top">
        <div>
          <h2 className="ts-wizard__title">Новый курс</h2>
          <p className="ts-wizard__step-label">Шаг {step + 1} из {STEPS.length}</p>
        </div>
        <button className="ts-wizard__close" onClick={onCancel}>
          <X size={22} />
        </button>
      </div>

      {/* Stepper */}
      <div className="ts-stepper">
        {STEPS.map((label, i) => (
          <React.Fragment key={i}>
            <div className="ts-stepper__item">
              <div
                className={`ts-stepper__dot ${i < step ? 'ts-stepper__dot--done' : i === step ? 'ts-stepper__dot--active' : ''}`}
                onClick={() => i < step && goTo(i)}
                title={i < step ? `Вернуться к: ${label}` : undefined}
              >
                {i < step ? <CheckCircle size={16} /> : i + 1}
              </div>
              <div className={`ts-stepper__label ${i === step ? 'ts-stepper__label--active' : ''}`}>
                {label}
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`ts-stepper__line ${i < step ? 'ts-stepper__line--done' : ''}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step content */}
      <div className="ts-wizard__content">
        <AnimatePresence custom={dir} mode="wait">
          <motion.div
            key={step}
            custom={dir}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: 'easeInOut' }}
          >
            {/* ── Step 0: Basic Info ── */}
            {step === 0 && (
              <div className="ts-wizard__step">
                <div>
                  <label className="ts-label">Название курса *</label>
                  <input
                    autoFocus
                    className={`ts-input ts-input--lg ${errors.title ? 'ts-input--error' : ''}`}
                    style={errors.title ? { borderColor: 'var(--danger)' } : undefined}
                    value={form.title}
                    placeholder="Например: Python для начинающих"
                    onChange={e => update('title', e.target.value)}
                  />
                  {errors.title && <div className="ts-field-error">{errors.title}</div>}
                </div>
                <div>
                  <label className="ts-label">Описание курса *</label>
                  <textarea
                    className="ts-textarea ts-input--lg"
                    style={{ minHeight: '120px', ...(errors.description ? { borderColor: 'var(--danger)' } : {}) }}
                    value={form.description}
                    placeholder="Что студент узнает после прохождения курса?"
                    onChange={e => update('description', e.target.value)}
                  />
                  {errors.description && <div className="ts-field-error">{errors.description}</div>}
                </div>
              </div>
            )}

            {/* ── Step 1: Level + Category ── */}
            {step === 1 && (
              <div className="ts-wizard__step">
                <div>
                  <label className="ts-label">Уровень сложности</label>
                  <div className="ts-level-cards">
                    {LEVELS.map(l => (
                      <button
                        key={l.id}
                        type="button"
                        className={`ts-level-card ${form.level === l.id ? 'ts-level-card--active' : ''}`}
                        onClick={() => update('level', l.id)}
                      >
                        <div className="ts-level-card__emoji">{l.icon}</div>
                        <div className="ts-level-card__name">{l.label}</div>
                        <div className="ts-level-card__desc">{l.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="ts-label">Категория / Язык</label>
                  <div className="ts-category-chips">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        className={`ts-category-chip ${form.category === cat ? 'ts-category-chip--active' : ''}`}
                        onClick={() => update('category', cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 2: Cover ── */}
            {step === 2 && (
              <div className="ts-wizard__step">
                <div>
                  <label className="ts-label">Цвет обложки</label>
                  <div className="ts-color-palette">
                    {PALETTE.map(clr => (
                      <button
                        key={clr}
                        type="button"
                        className={`ts-color-swatch ${form.color === clr ? 'ts-color-swatch--active' : ''}`}
                        style={{
                          background: clr,
                          boxShadow: form.color === clr ? `0 0 0 3px var(--bg-card), 0 0 0 5px ${clr}` : 'none',
                        }}
                        onClick={() => update('color', clr)}
                      />
                    ))}
                    <label className="ts-color-swatch ts-color-swatch--custom">
                      <input
                        type="color"
                        value={form.color}
                        onChange={e => update('color', e.target.value)}
                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                      />
                      +
                    </label>
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label className="ts-label" style={{ marginBottom: 0 }}>Фотография для фона</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {form.image_url && (
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{ padding: '6px 12px', fontSize: '0.8rem', borderColor: 'var(--danger)', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => update('image_url', '')}
                            disabled={uploadingImage}
                          >
                            <Trash2 size={14} /> Удалить
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingImage}
                        >
                          <Camera size={14} /> {uploadingImage ? 'Загрузка...' : 'Загрузить фото'}
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          style={{ display: 'none' }}
                          accept=".jpg,.jpeg,.png,.webp"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Live preview */}
                  <div
                    className="ts-cover-preview"
                    style={{
                      background: form.image_url
                        ? `linear-gradient(135deg, rgba(0,0,0,0.5), rgba(0,0,0,0.8)), url(${form.image_url}) center/cover no-repeat`
                        : `linear-gradient(135deg, ${form.color}, ${form.color}88)`
                    }}
                  >
                    <BookOpen size={32} color="white" style={{ opacity: 0.9, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'white' }}>
                        {form.title || 'Название курса'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)' }}>
                        {form.level} · {form.category}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="ts-wizard__nav">
        <button className="ts-btn" onClick={step === 0 ? onCancel : goPrev}>
          {step === 0 ? 'Отмена' : <><ChevronLeft size={16} /> Назад</>}
        </button>
        {step < STEPS.length - 1 ? (
          <button className="ts-btn ts-btn--primary" onClick={goNext}>
            Далее <ChevronRight size={16} />
          </button>
        ) : (
          <button className="ts-btn ts-btn--primary" onClick={handleCreate} disabled={saving}>
            {saving ? 'Создание...' : <>Создать курс</>}
          </button>
        )}
      </div>

      {cropModalData && (
        <ImageCropperModal
          imageSrc={cropModalData.imageSrc}
          aspect={cropModalData.aspect}
          title="Обрезать обложку курса"
          onSave={handleSaveCrop}
          onCancel={() => setCropModalData(null)}
        />
      )}
    </div>
  );
};

export default CourseWizard;

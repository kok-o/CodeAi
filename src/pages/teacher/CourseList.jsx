import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, PlusCircle, Trash2, Users, Layers, GraduationCap, Sparkles, Target } from 'lucide-react';
import { apiCall } from '../../utils/api';
import './TeacherStudio.css';

const LEVEL_META = {
  Beginner: { color: 'var(--success)' },
  Intermediate: { color: 'var(--warning)' },
  Advanced: { color: 'var(--danger)' },
};

/* ═══════════ SKELETON ═══════════ */
const CourseSkeleton = () => (
  <div className="ts-course-card" style={{ pointerEvents: 'none' }}>
    <div className="ts-course-card__cover ts-skeleton" style={{ height: '80px', borderRadius: '0' }} />
    <div className="ts-course-card__body">
      <div className="ts-skeleton" style={{ height: '14px', borderRadius: '4px', marginBottom: '10px', width: '70%' }} />
      <div className="ts-skeleton" style={{ height: '10px', borderRadius: '4px', marginBottom: '6px' }} />
      <div className="ts-skeleton" style={{ height: '10px', borderRadius: '4px', width: '50%' }} />
    </div>
  </div>
);

/* ═══════════ COURSE CARD ═══════════ */
const CourseCard = ({ course, onOpen, onDelete }) => {
  const meta = LEVEL_META[course.level] || LEVEL_META.Beginner;
  const lessonsCount = (course.lessons || []).length;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      onClick={onOpen}
      className="ts-course-card"
    >
      {/* Cover strip */}
      <div
        className="ts-course-card__cover"
        style={{
          background: course.image_url
            ? `linear-gradient(135deg, rgba(0,0,0,0.5), rgba(0,0,0,0.8)), url(${course.image_url}) center/cover no-repeat`
            : `linear-gradient(135deg, ${course.color || 'var(--brand-primary)'}, ${course.color || 'var(--brand-primary)'}88)`
        }}
      >
        <div className="ts-course-card__cover-icon">
          <BookOpen size={20} color="white" />
        </div>
        <div>
          <div className="ts-course-card__cover-cat">{course.category}</div>
          <div className="ts-course-card__cover-title">{course.title}</div>
        </div>
        <div className="ts-course-card__status-badge">
          {course.is_published ? '● Live' : '○ Черновик'}
        </div>
      </div>

      {/* Card body */}
      <div className="ts-course-card__body">
        <p className="ts-course-card__desc">
          {course.description || 'Описание не добавлено'}
        </p>

        <div className="ts-course-card__meta">
          <span className="ts-course-card__badge" style={{ color: meta.color }}>
            <Target size={14} /> {course.level}
          </span>
          <span className="ts-course-card__badge">
            <Layers size={12} /> {lessonsCount} урок(ов)
          </span>
          <span className="ts-course-card__badge">
            <Users size={12} /> {course.students || 0}
          </span>
        </div>

        <div className="ts-course-card__footer" style={{ justifyContent: 'flex-end' }}>
          <button
            className="ts-btn ts-btn--danger ts-btn--xs"
            onClick={e => { e.stopPropagation(); onDelete(); }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

/* ═══════════ EMPTY STATE ═══════════ */
const EmptyState = ({ onCreateClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="ts-empty"
  >
    <div className="ts-empty__icon">
      <GraduationCap size={36} color="var(--brand-primary)" style={{ opacity: 0.8 }} />
    </div>
    <h3 className="ts-empty__title">Создай свой первый курс</h3>
    <p className="ts-empty__text">
      Начни с простого курса, добавляй уроки с теорией, тестами и практическими задачами
    </p>
    <button className="ts-btn ts-btn--primary" onClick={onCreateClick}>
      Создать первый курс
    </button>
  </motion.div>
);

/* ═══════════ COURSE LIST ═══════════ */
const CourseList = ({ courses, onOpenCourse, onCreateClick, refreshCourses, showToast, loading }) => {
  const handleDelete = async (course) => {
    if (!window.confirm(`Удалить курс "${course.title}" и все уроки?`)) return;
    try {
      await apiCall(`/courses/${course.id}`, { method: 'DELETE' });
      showToast('success', 'Курс удалён');
      if (refreshCourses) refreshCourses();
    } catch (e) { showToast('error', e.message); }
  };

  return (
    <div>
      <div className="ts-list-header">
        <div>
          <h2 className="ts-list-header__title">Мои курсы</h2>
          <p className="ts-list-header__subtitle">
            {courses.length > 0 ? `${courses.length} курс(ов) создано` : 'Начни обучать прямо сейчас'}
          </p>
        </div>
        {courses.length > 0 && (
          <button className="ts-btn ts-btn--primary" onClick={onCreateClick}>
            <PlusCircle size={16} /> Создать курс
          </button>
        )}
      </div>

      {loading ? (
        <div className="ts-course-grid">
          {[...Array(3)].map((_, i) => <CourseSkeleton key={i} />)}
        </div>
      ) : courses.length === 0 ? (
        <EmptyState onCreateClick={onCreateClick} />
      ) : (
        <motion.div layout className="ts-course-grid">
          <AnimatePresence>
            {courses.map(course => (
              <CourseCard
                key={course.id}
                course={course}
                onOpen={() => onOpenCourse(course)}
                onDelete={() => handleDelete(course)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default CourseList;

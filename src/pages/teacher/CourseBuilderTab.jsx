import React, { useState, useContext } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AppContext } from '../../context/AppContext';
import CourseList from './CourseList';
import CourseWizard from './CourseWizard';
import CourseEditor from './CourseEditor';
import './TeacherStudio.css';

/**
 * CourseBuilderTab
 *
 * Root component managing 3 views:
 *   - 'list'   → CourseList
 *   - 'wizard' → CourseWizard (3-step creation)
 *   - 'editor' → CourseEditor (3-panel IDE-like editor)
 */
const CourseBuilderTab = ({ showToast }) => {
  const { user, courses, refreshCourses } = useContext(AppContext);

  const myCourses = (courses || []).filter(c => c.created_by === user?.id);

  const [view, setView]               = useState('list');
  const [activeCourse, setActiveCourse] = useState(null);

  const openEditor = (course) => {
    setActiveCourse(course);
    setView('editor');
  };

  const handleWizardCreated = async (newCourse) => {
    await refreshCourses();
    setActiveCourse(newCourse);
    setView('editor');
  };

  const handleBackToList = async () => {
    await refreshCourses();
    setActiveCourse(null);
    setView('list');
  };

  return (
    <div>
      <AnimatePresence mode="wait">
        {view === 'list' && (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <CourseList
              courses={myCourses}
              onOpenCourse={openEditor}
              onCreateClick={() => setView('wizard')}
              refreshCourses={refreshCourses}
              showToast={showToast}
            />
          </motion.div>
        )}

        {view === 'wizard' && (
          <motion.div
            key="wizard"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.2 }}
          >
            <CourseWizard
              onCreated={handleWizardCreated}
              onCancel={() => setView('list')}
              showToast={showToast}
            />
          </motion.div>
        )}

        {view === 'editor' && activeCourse && (
          <motion.div
            key="editor"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.2 }}
          >
            <CourseEditor
              course={activeCourse}
              onBack={handleBackToList}
              showToast={showToast}
              refreshCourses={refreshCourses}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CourseBuilderTab;

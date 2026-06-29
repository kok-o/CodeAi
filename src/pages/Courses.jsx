import React, { useState, useContext } from 'react';

import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Code2, 
  Terminal, 
  Globe, 
  Star,
  Users,
  CheckCircle
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { apiCall } from '../utils/api';

const Courses = () => {
  const { progress, t, courses } = useContext(AppContext);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSort, setActiveSort] = useState('all');
  const [activeLevel, setActiveLevel] = useState("All");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const sortOptions = [
    { id: 'all', labelKey: 'sortAll' },
    { id: 'newest', labelKey: 'sortNewest' },
    { id: 'popular', labelKey: 'sortPopular' },
    { id: 'rating', labelKey: 'sortRating' }
  ];
  const levels = ["All", "Beginner", "Intermediate", "Advanced"];
  
  const getIcon = (category) => {
    switch (category) {
      case "Python": return <Terminal />;
      case "JavaScript": return <Code2 />;
      case "Web Dev": return <Globe />;
      default: return <Code2 />;
    }
  };

  // Filter courses based on search input and level
  let filteredCourses = (courses || []).filter(course => {
    // Also use translated description for search if possible, or just raw
    const courseDesc = t(course.description) || course.description;
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          courseDesc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = activeLevel === "All" || course.level === activeLevel;
    return matchesSearch && matchesLevel;
  });

  // Sort courses
  filteredCourses.sort((a, b) => {
    if (activeSort === 'all') {
      return a.id - b.id; // Original DB order
    } else if (activeSort === 'newest') {
      return b.id - a.id; 
    } else if (activeSort === 'popular') {
      // Assuming students property is a number, if string parse it
      const aStudents = parseInt(a.students) || 0;
      const bStudents = parseInt(b.students) || 0;
      return bStudents - aStudents;
    } else if (activeSort === 'rating') {
      const aRating = parseFloat(a.rating) || 0;
      const bRating = parseFloat(b.rating) || 0;
      return bRating - aRating;
    }
    return 0;
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'transparent' }}>
      
      <main className="animate-in" style={{ flex: 1, padding: '40px' }}>
        <header style={{ marginBottom: '40px' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>{t('courseCatalog')}</h1>
            <p style={{ color: 'var(--text-muted)' }}>{t('courseCatalogSub')}</p>
        </header>

        {/* Filters and Search */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
            <div className="glass" style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '12px 20px', gap: '12px' }}>
                <Search size={20} color="var(--text-muted)" />
                <input 
                    type="text" 
                    placeholder={t('searchPlaceholder')} 
                    style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', width: '100%', fontSize: '1rem' }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <div style={{ position: 'relative' }}>
                <div 
                    className="glass" 
                    style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', gap: '8px', cursor: 'pointer' }}
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                >
                    <Filter size={20} />
                    <span>{t('filters')}</span>
                </div>
                {showFilterDropdown && (
                  <div className="glass" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', padding: '8px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '150px' }}>
                    {levels.map(level => (
                      <button 
                        key={level}
                        style={{ 
                          background: activeLevel === level ? 'var(--overlay-bg-hover)' : 'transparent', 
                          border: 'none', 
                          padding: '8px 12px', 
                          color: 'var(--text-primary)', 
                          textAlign: 'left', 
                          borderRadius: '8px', 
                          cursor: 'pointer' 
                        }}
                        onClick={() => {
                          setActiveLevel(level);
                          setShowFilterDropdown(false);
                        }}
                      >
                        {level === "All" ? t('levelAll') : t(`level${level}`)}
                      </button>
                    ))}
                  </div>
                )}
            </div>
        </div>

        {/* Sort Options */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', overflowX: 'auto', padding: '8px 4px 16px 4px', margin: '-8px -4px 0 -4px' }}>
            {sortOptions.map((opt) => (
                <button 
                  key={opt.id} 
                  className={activeSort === opt.id ? "btn btn-primary" : "btn btn-outline"}
                  style={{ whiteSpace: 'nowrap', padding: '8px 24px' }}
                  onClick={() => setActiveSort(opt.id)}
                >
                    {t(opt.labelKey)}
                </button>
            ))}
        </div>

        {/* Course Grid */}
        {filteredCourses.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '1.2rem' }}>
            {t('noCoursesFound')}
          </div>
        ) : (
          <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '24px'
          }}>
              {filteredCourses.map((course) => {
                  const courseProgress = progress[course.id];
                  const completedCount = courseProgress?.completedLessons?.length || 0;
                  const totalLessons = course.lessons.length;
                  const percent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
                  
                  return (
                      <CourseCard 
                        key={course.id} 
                        course={course} 
                        icon={getIcon(course.category)} 
                        completedCount={completedCount}
                        totalLessons={totalLessons}
                        percent={percent}
                      />
                  );
              })}
          </div>
        )}
      </main>
    </div>
  );
};

const CourseCard = ({ course, icon, completedCount, totalLessons, percent }) => {
    const { t, refreshCourses } = useContext(AppContext);
    const [hoverRating, setHoverRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleRate = async (star, e) => {
        e.preventDefault();
        e.stopPropagation();
        if (completedCount === 0 || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await apiCall(`/courses/${course.id}/rate`, {
                method: 'POST',
                body: JSON.stringify({ rating: star })
            });
            if (refreshCourses) await refreshCourses();
        } catch (err) {
            console.error("Failed to rate course", err);
        } finally {
            setIsSubmitting(false);
            setHoverRating(0);
        }
    };

    const canRate = completedCount > 0;

    return (
        <motion.div 
          whileHover={{ y: -10 }}
          className="glass-card" 
          style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
        >
            <div style={{ 
                height: '160px', 
                background: `linear-gradient(135deg, ${course.color}44, ${course.color}11)`, 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                borderRadius: '16px 16px 0 0',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {course.image_url ? (
                  <img 
                    src={course.image_url} 
                    alt={course.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      position: 'absolute',
                      top: 0,
                      left: 0
                    }}
                  />
                ) : (
                  <div style={{ 
                      width: '70px', 
                      height: '70px', 
                      borderRadius: '50%', 
                      background: 'var(--overlay-bg-hover)', 
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      color: course.color,
                      fontSize: '2rem',
                      zIndex: 1
                  }}>
                      {icon}
                  </div>
                )}
                <span style={{ 
                    position: 'absolute', 
                    top: '20px', 
                    right: '20px', 
                    padding: '4px 12px', 
                    background: 'var(--dropdown-shadow)', 
                    borderRadius: '100px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    zIndex: 2
                }}>
                    {course.level}
                </span>
            </div>
            <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>{course.title}</h3>
                {course.author_name && (
                    <NavLink 
                        to={`/profile/${course.created_by}`} 
                        style={{ fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '12px', textDecoration: 'none', fontWeight: 500, display: 'inline-block' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {course.author_name}
                    </NavLink>
                )}
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.4, flex: 1 }}>
                    {t(course.description)}
                </p>
                
                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <Users size={14} /> {course.students} {t('students')}
                    </div>
                    <div 
                        style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.85rem', color: 'var(--text-muted)' }}
                        onMouseLeave={() => setHoverRating(0)}
                    >
                        {[1, 2, 3, 4, 5].map(star => {
                            const isFilled = (hoverRating || course.rating) >= star;
                            return (
                                <Star 
                                    key={star}
                                    size={14} 
                                    color={isFilled ? "#eab308" : "var(--text-muted)"} 
                                    fill={isFilled ? "#eab308" : "none"}
                                    style={{ cursor: canRate ? 'pointer' : 'default', opacity: isSubmitting ? 0.5 : 1 }}
                                    onMouseEnter={() => canRate && !isSubmitting && setHoverRating(star)}
                                    onClick={(e) => canRate && !isSubmitting && handleRate(star, e)}
                                />
                            );
                        })}
                        <span style={{ marginLeft: '4px' }}>{Number(course.rating).toFixed(2)}</span>
                    </div>
                </div>
    
                {/* Progress Bar */}
                {totalLessons > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {percent === 100 && <CheckCircle size={12} color="#10b981" />}
                        {completedCount}/{totalLessons} {t('lessonsCount')}
                      </span>
                      <span>{percent}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--overlay-bg)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${percent}%`, background: course.color, borderRadius: '3px' }} />
                    </div>
                  </div>
                )}
    
                <div style={{ marginTop: 'auto' }}>
                    <NavLink 
                      to={`/lesson/${course.id}`} 
                      className="btn btn-primary" 
                      style={{ 
                        width: '100%', 
                        justifyContent: 'center', 
                        background: percent === 100 ? 'var(--success)' : `linear-gradient(135deg, var(--primary), var(--secondary))`,
                        boxShadow: percent === 100 ? '0 4px 15px rgba(16, 185, 129, 0.3)' : '0 4px 15px rgba(99, 102, 241, 0.4)',
                        textDecoration: 'none',
                        color: 'white'
                      }}
                    >
                        {percent === 100 ? t('reviewCourse') : (completedCount > 0 ? t('continueLearning') : t('startLearning'))}
                    </NavLink>
                </div>
            </div>
        </motion.div>
    );
};

export default Courses;

import React, { useContext, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Clock, Flame, TrendingUp, PlayCircle, CheckCircle2,
  Award, BookOpen, Code2, Terminal, Zap, Target, Star,
  ChevronRight, Sparkles, Brain, BarChart2, Activity, ArrowUp, ArrowDown
} from 'lucide-react';
import { NavLink, useNavigate, Navigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { apiCall } from '../utils/api';

import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';


const SKILL_COLORS = ['#1A73E8','#8AB4F8','#EA4335','#FBBC04','#34A853','#137333','#185ABC','#A8DAB5'];

const Dashboard = () => {
  const { user, progress, t, courses, language } = useContext(AppContext);
  const navigate = useNavigate();

  const tr = (key, fallback) => {
    const res = t(key);
    return res !== key ? res : fallback;
  };

  const [skills, setSkills]           = useState([]);
  const [challengeStats, setChallengeStats] = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);

  const loadSkills = async () => {
    try {
      const data = await apiCall('/skills/student');
      setSkills(data || []);
      const solved = data?.filter(s => s.success_count > 0).length || 0;
      setChallengeStats({ solved });
    } catch { /* noop */ }
  };

  useEffect(() => {
    loadSkills();
    apiCall('/progress/heatmap').then(data => setHeatmapData(data || [])).catch(() => {});
    apiCall('/progress/stats').then(data => setChallengeStats(data)).catch(() => {});
  }, []);



  if (!user || !courses || courses.length === 0) return null;
  if (user.role === 'teacher') return <Navigate to="/teacher/courses" replace />;

  let totalLessons = 0, completedLessons = 0;
  let completedCoursesCount = 0;
  courses.forEach(c => {
    const lessonsLen = (c.lessons || []).length;
    const completedLen = progress[c.id]?.completedLessons?.length || 0;
    
    totalLessons += lessonsLen;
    completedLessons += completedLen;
    
    if (lessonsLen > 0 && completedLen === lessonsLen) {
      completedCoursesCount++;
    }
  });


  const activeCourses = courses.map(c => {
    const completed = progress[c.id]?.completedLessons?.length || 0;
    const total = (c.lessons || []).length;
    return { ...c, completed, total, pct: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }).filter(c => c.total > 0).slice(0, 3);

  const radarData = skills.slice(0, 8).map((s, i) => ({
    skill: s.name?.length > 10 ? s.name.slice(0, 9) + '…' : (s.name || ''),
    value: Math.round((s.score || 0) * 100),
    fullMark: 100,
    color: SKILL_COLORS[i % SKILL_COLORS.length]
  }));

  const donutData = [
    { name: t('completed') || 'Завершено', value: completedLessons, color: 'var(--brand-primary)' },
    { name: t('remaining') || 'Осталось',  value: Math.max(0, totalLessons - completedLessons), color: 'var(--overlay-bg)' },
  ];

  const weakSkills = [...skills].sort((a, b) => (a.score || 0) - (b.score || 0)).slice(0, 4);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'transparent' }}>
      <style>{`
        @keyframes db-pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
        .db-card { 
          background: var(--bg-card); 
          border: 1px solid var(--border-subtle); 
          border-radius: 16px; 
          box-shadow: var(--card-shadow);
        }
        .db-card-glow:hover { 
          border-color: var(--border-accent); 
          box-shadow: var(--dropdown-shadow); 
          transform: translateY(-2px); 
        }
        .db-stat { font-size: 2.2rem; font-weight: 800; line-height: 1; letter-spacing: -0.5px; }
        .db-label { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.8px; }
      `}</style>

      <main className="animate-in" style={{ flex: 1, padding: '40px 48px', overflowY: 'auto' }}>

        {/* ════ HERO HEADER ════ */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          style={{ 
            marginBottom: '36px', padding: '40px 48px', borderRadius: '16px', 
            background: 'var(--bg-card)', 
            border: '1px solid var(--border-subtle)', 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px', 
            boxShadow: 'var(--card-shadow)',
            position: 'relative', overflow: 'hidden'
          }}>
          <div style={{ position: 'absolute', top: '-50%', right: '-10%', width: '400px', height: '400px', background: 'var(--brand-primary)', filter: 'blur(150px)', opacity: 0.08, borderRadius: '50%', pointerEvents: 'none' }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--brand-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px' }}>
              {t('welcomeBack') || 'С возвращением'}
            </div>
            <h1 style={{ fontSize: '2.6rem', fontWeight: 800, marginBottom: '12px', letterSpacing: '-1px', color: 'var(--text-primary)' }}>
              {user.name}
            </h1>
          </div>
        </motion.div>

        {/* ════ STAT CARDS ROW ════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
          {[
            { icon: <TrendingUp size={22} />, label: t('coursesCompleted') || 'Пройдено курсов', value: completedCoursesCount, sub: '', color: 'var(--brand-primary)' },
            { icon: <Terminal size={22} />,  label: t('challengesSolved') || 'Задач решено',    value: challengeStats?.challengesSolved || 0, sub: t('successfulAttempts') || 'успешно', color: 'var(--success)' },
            { icon: <Clock size={22} />,     label: t('studyTime') || 'Время обучения',  value: formatTime(user.study_time_seconds, t), sub: t('totalTime') || 'суммарно', color: 'var(--warning)' },
          ].map((s, i) => (
            <motion.div key={i} className="db-card db-card-glow" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              style={{ padding: '24px', transition: 'all 0.3s ease' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--overlay-bg)', border: `1px solid var(--border-subtle)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, marginBottom: '18px' }}>
                {s.icon}
              </div>
              <div className="db-stat" style={{ color: 'var(--text-primary)', marginBottom: '6px' }}>{s.value}</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: s.color, marginBottom: '4px' }}>{s.label}</div>
              {s.sub && <div className="db-label">{s.sub}</div>}
            </motion.div>
          ))}
        </div>



        {/* ════ SECOND ROW ════ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '24px' }}>
          {/* ── Active Courses ── */}
          <motion.div className="db-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <div className="db-label">{t('learning') || 'Обучение'}</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.3px' }}>{t('activeCourses') || 'Активные курсы'}</h3>
              </div>
              <NavLink to="/courses" style={{ fontSize: '0.85rem', color: 'var(--brand-primary)', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--overlay-bg)', padding: '6px 12px', borderRadius: '20px' }}>
                {t('allCourses') || 'Все курсы'} <ChevronRight size={14} />
              </NavLink>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activeCourses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <BookOpen size={40} style={{ opacity: 0.15, marginBottom: '16px', margin: '0 auto' }} />
                  <p style={{ fontSize: '0.95rem' }}>{t('noActiveCourses') || 'Нет активных курсов.'}<br />{t('goToCatalog') || 'Перейди в каталог!'}</p>
                  <NavLink to="/courses" style={{ marginTop: '16px', display: 'inline-block', padding: '10px 20px', borderRadius: '10px', background: 'var(--overlay-bg)', color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>{t('openCourses') || 'Открыть курсы'}</NavLink>
                </div>
              ) : activeCourses.map((course, i) => (
                <div key={course.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', background: 'var(--overlay-bg)', borderRadius: '12px', border: '1px solid var(--border-subtle)', transition: 'all 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.background = 'var(--overlay-bg-hover)'} onMouseOut={e => e.currentTarget.style.background = 'var(--overlay-bg)'} onClick={() => navigate(`/lesson/${course.id}`)}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--overlay-bg)', border: `1px solid var(--border-subtle)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <BookOpen size={22} color={course.color || 'var(--brand-primary)'} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>{course.title}</div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ flex: 1, height: '6px', background: 'var(--overlay-bg)', borderRadius: '3px', overflow: 'hidden' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${course.pct}%` }} transition={{ delay: 0.4 + i * 0.1, duration: 0.8 }}
                          style={{ height: '100%', background: course.color || 'var(--brand-primary)', borderRadius: '3px' }} />
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: course.color || 'var(--brand-primary)', flexShrink: 0 }}>{course.pct}%</span>
                    </div>
                  </div>
                  <ChevronRight size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ════ ACTIVITY HEATMAP ════ */}
        <motion.div className="db-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          style={{ padding: '36px', position: 'relative', overflow: 'hidden' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
            <div>
              <div className="db-label" style={{ color: 'var(--success)' }}>{tr('activity', 'Активность')}</div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                <Activity size={22} color="var(--success)" /> {tr('activityHistory', 'История активности')}
              </h3>
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              {heatmapData.reduce((sum, d) => sum + d.count, 0)} {tr('activitiesTotal', 'действий за последний год')}
            </div>
          </div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <ActivityHeatmap data={heatmapData} tr={tr} />
          </div>
        </motion.div>

        {/* ════ QUICK ACTIONS ════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '24px' }}>
          {[
            { icon: <Terminal size={24} />, label: tr('challenges', 'Задачник'), desc: tr('challengesDesc', 'Тренируй алгоритмы'), link: '/challenges', color: 'var(--brand-primary)' },
            { icon: <Code2 size={24} />,    label: tr('ide', 'IDE'),       desc: tr('ideDesc', 'Пиши код свободно'),  link: '/ide',        color: 'var(--brand-secondary)' },
            { icon: <BookOpen size={24} />, label: tr('courses', 'Курсы'),    desc: tr('coursesDesc', 'Продолжи учёбу'),    link: '/courses',    color: 'var(--success)' },
          ].map((a, i) => (
            <motion.div key={i} onClick={() => navigate(a.link)}
              className="db-card db-card-glow" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.06 }}
              style={{ padding: '24px', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'var(--overlay-bg)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.color, flexShrink: 0 }}>
                {a.icon}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '4px' }}>{a.label}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{a.desc}</div>
              </div>
              <ChevronRight size={18} color="var(--text-muted)" style={{ marginLeft: 'auto', opacity: 0.5 }} />
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};

function formatTime(seconds, tr) {
  if (!seconds || seconds <= 0) return '0 ' + tr('min', 'мин');
  if (seconds < 60) return '1 ' + tr('min', 'мин');
  if (seconds < 3600) return `${Math.round(seconds / 60)} ` + tr('min', 'мин');
  return `${(seconds / 3600).toFixed(1)} ` + tr('hoursShort', 'ч');
}

const ActivityHeatmap = ({ data, tr }) => {
  const today = new Date();
  const days = [];
  const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
  
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    days.push({
      date: d.toISOString().split('T')[0],
      month: d.getMonth()
    });
  }

  const map = {};
  (data || []).forEach(item => {
    map[item.date] = item.count;
  });

  const getColor = (count) => {
    if (!count) return 'var(--overlay-bg)';
    if (count === 1) return '#9be9a8';
    if (count <= 3) return '#40c463';
    if (count <= 6) return '#30a14e';
    return '#216e39';
  };

  const weeks = [];
  let currentWeek = [];
  
  const firstDay = new Date(days[0].date);
  const firstDayOfWeek = firstDay.getDay(); 
  for(let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push(null);
  }

  let currentMonth = -1;
  const rawMonthLabels = [];

  days.forEach((dayObj, index) => {
    if (dayObj.month !== currentMonth && currentWeek.length === 0) {
      rawMonthLabels.push({ label: months[dayObj.month], index: weeks.length });
      currentMonth = dayObj.month;
    } else if (dayObj.month !== currentMonth && index === 0) {
      rawMonthLabels.push({ label: months[dayObj.month], index: 0 });
      currentMonth = dayObj.month;
    } else if (dayObj.month !== currentMonth) {
       rawMonthLabels.push({ label: months[dayObj.month], index: weeks.length });
       currentMonth = dayObj.month;
    }

    currentWeek.push(dayObj.date);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  // Filter labels to prevent overlap (ensure at least 3 weeks apart)
  const monthLabels = [];
  rawMonthLabels.forEach(m => {
    if (monthLabels.length === 0) {
      monthLabels.push(m);
    } else {
      const last = monthLabels[monthLabels.length - 1];
      if (m.index - last.index >= 3) {
        monthLabels.push(m);
      }
    }
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowX: 'auto', paddingBottom: '16px', overflowY: 'hidden', width: '100%' }}>
      <div style={{ display: 'flex', gap: '12px' }}>
        {/* Weekday Labels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)', width: '22px', flexShrink: 0, paddingTop: '20px' }}>
          <span style={{ height: '14px', lineHeight: '14px' }}></span>
          <span style={{ height: '14px', lineHeight: '14px' }}>Пн</span>
          <span style={{ height: '14px', lineHeight: '14px' }}></span>
          <span style={{ height: '14px', lineHeight: '14px' }}>Ср</span>
          <span style={{ height: '14px', lineHeight: '14px' }}></span>
          <span style={{ height: '14px', lineHeight: '14px' }}>Пт</span>
          <span style={{ height: '14px', lineHeight: '14px' }}></span>
        </div>

        {/* Heatmap Blocks */}
        <div style={{ display: 'flex', justifyContent: 'space-between', flex: 1, gap: '4px', paddingTop: '20px', paddingRight: '8px', paddingBottom: '8px' }}>
          {weeks.map((week, i) => {
            const mLabel = monthLabels.find(m => m.index === i);
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
                {mLabel && (
                  <span style={{ position: 'absolute', top: '-24px', left: 0, fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {mLabel.label}
                  </span>
                )}
                {week.map((day, j) => {
                  if (!day) return <div key={j} style={{ width: '14px', height: '14px' }} />;
                  const count = map[day] || 0;
                  return (
                    <div 
                      key={j} 
                      title={`${day}: ${count} ${tr('activities', 'действий')}`}
                      style={{
                        width: '14px', 
                        height: '14px', 
                        borderRadius: '3px',
                        background: getColor(count),
                        transition: 'all 0.2s',
                        cursor: 'pointer'
                      }}
                      onMouseOver={(e) => e.target.style.transform = 'scale(1.2)'}
                      onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <span>{tr('less', 'Меньше')}</span>
        <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: 'var(--overlay-bg)' }} />
        <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: '#9be9a8' }} />
        <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: '#40c463' }} />
        <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: '#30a14e' }} />
        <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: '#216e39' }} />
        <span>{tr('more', 'Больше')}</span>
      </div>
    </div>
  );
};

export default Dashboard;

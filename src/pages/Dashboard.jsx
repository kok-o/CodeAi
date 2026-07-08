import React, { useContext, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useInView, animate } from 'framer-motion';
import {
  Trophy, Clock, TrendingUp,
  BookOpen, Code2, Terminal, Zap,
  ChevronRight, Sparkles, Brain, Activity,
} from 'lucide-react';
import { NavLink, useNavigate, Navigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { apiCall } from '../utils/api';
import {
  fadeInUp, staggerContainer, staggerContainerFast,
  cardHoverSubtle, spring, easeOut,
} from '../utils/animations';

import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts';

const SKILL_COLORS = ['#818cf8','#a78bfa','#34d399','#fbbf24','#60a5fa','#f87171','#c084fc','#4ade80'];

// ─── Count-Up Hook ────────────────────────────────────────────────────────────
function useCountUp(target, duration = 1.4, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    const controls = animate(0, target, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setCount(Math.floor(v)),
    });
    return controls.stop;
  }, [start, target, duration]);
  return count;
}

// ─── Premium Stat Card ────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, color, bgColor, delay = 0 }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const count = useCountUp(typeof value === 'number' ? value : 0, 1.4, inView);

  return (
    <motion.div
      ref={ref}
      variants={fadeInUp}
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      transition={spring}
      style={{
        padding: '28px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-sm)',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
      }}
    >


      {/* Icon */}
      <div style={{
        width: '48px', height: '48px',
        borderRadius: '14px',
        background: `color-mix(in srgb, ${color} 12%, var(--bg-activity-bar))`,
        border: `1px solid color-mix(in srgb, ${color} 20%, transparent)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color, marginBottom: '20px',
        position: 'relative', zIndex: 1,
      }}>
        {icon}
      </div>

      {/* Value */}
      <div style={{
        fontSize: '2rem', fontWeight: 900,
        letterSpacing: '-0.05em', lineHeight: 1,
        color: 'var(--text-primary)',
        marginBottom: '6px',
        position: 'relative', zIndex: 1,
      }}>
        {typeof value === 'number' ? count : value}
      </div>

      {/* Label */}
      <div style={{
        fontWeight: 600, fontSize: '0.875rem',
        color, marginBottom: sub ? '4px' : 0,
        position: 'relative', zIndex: 1,
      }}>{label}</div>

      {sub && (
        <div style={{
          fontSize: '0.75rem', fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.06em',
          position: 'relative', zIndex: 1,
        }}>{sub}</div>
      )}
    </motion.div>
  );
};

// ─── Course Progress Row ──────────────────────────────────────────────────────
const CourseRow = ({ course, index, navigate }) => {
  const [hovered, setHovered] = useState(false);
  const color = course.color || 'oklch(68% 0.21 278)';

  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ x: 4 }}
      transition={spring}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={() => navigate(`/lesson/${course.id}`)}
      style={{
        display: 'flex', alignItems: 'center', gap: '16px',
        padding: '16px 20px',
        background: hovered ? 'var(--overlay-bg-hover)' : 'var(--overlay-bg)',
        borderRadius: 'var(--radius-lg)',
        border: `1px solid ${hovered ? 'var(--border-accent)' : 'var(--border-subtle)'}`,
        transition: 'background 200ms, border-color 200ms',
        cursor: 'pointer',
      }}
    >
      <div style={{
        width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
        background: `${color}18`, border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <BookOpen size={22} color={color} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: 700, fontSize: '0.95rem', marginBottom: '10px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          color: 'var(--text-primary)',
        }}>{course.title}</div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{
            flex: 1, height: '8px',
            background: 'var(--overlay-bg)',
            borderRadius: '9999px', overflow: 'hidden',
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${course.pct}%` }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              style={{
                height: '100%', borderRadius: '9999px',
                background: color,
                boxShadow: `0 0 8px ${color}40`,
              }}
            />
          </div>
          <span style={{
            fontSize: '0.78rem', fontWeight: 700,
            color, flexShrink: 0,
          }}>{course.pct}%</span>
        </div>
      </div>

      <motion.div animate={{ x: hovered ? 3 : 0 }} transition={spring}>
        <ChevronRight size={18} color="var(--text-muted)" style={{ flexShrink: 0, opacity: 0.5 }} />
      </motion.div>
    </motion.div>
  );
};

// ─── Quick Action Card ────────────────────────────────────────────────────────
const QuickActionCard = ({ icon, label, desc, link, color, navigate }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ scale: 1.025, y: -5 }}
      whileTap={{ scale: 0.97 }}
      transition={spring}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={() => navigate(link)}
      style={{
        padding: '24px',
        background: 'var(--bg-card)',
        border: `1px solid ${hovered ? color + '40' : 'var(--border-subtle)'}`,
        borderRadius: 'var(--radius-xl)',
        boxShadow: hovered ? `var(--shadow-md), 0 0 24px ${color}15` : 'var(--shadow-sm)',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: '16px',
        transition: 'border-color 200ms, box-shadow 200ms',
        position: 'relative', overflow: 'hidden',
      }}
    >
      <motion.div
        animate={{ scale: hovered ? 1.1 : 1, rotate: hovered ? 8 : 0 }}
        transition={spring}
        style={{
          width: '52px', height: '52px',
          borderRadius: '16px',
          background: `${color}18`, border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color, flexShrink: 0,
        }}
      >
        {icon}
      </motion.div>
      <div>
        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{desc}</div>
      </div>
      <motion.div
        animate={{ x: hovered ? 4 : 0 }}
        transition={spring}
        style={{ marginLeft: 'auto' }}
      >
        <ChevronRight size={18} color="var(--text-muted)" style={{ opacity: 0.4 }} />
      </motion.div>
    </motion.div>
  );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user, progress, t, courses } = useContext(AppContext);
  const navigate = useNavigate();

  const tr = (key, fallback) => {
    const res = t(key);
    return res !== key ? res : fallback;
  };

  const [skills, setSkills] = useState([]);
  const [challengeStats, setChallengeStats] = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);

  useEffect(() => {
    apiCall('/skills/student')
      .then(data => {
        setSkills(data || []);
        const solved = data?.filter(s => s.success_count > 0).length || 0;
        setChallengeStats(prev => ({ ...(prev || {}), solved }));
      })
      .catch(() => {});
    apiCall('/progress/heatmap').then(data => setHeatmapData(data || [])).catch(() => {});
    apiCall('/progress/stats').then(data => setChallengeStats(data)).catch(() => {});
  }, []);

  if (!user || !courses || courses.length === 0) return null;
  if (user.role === 'teacher') return <Navigate to="/teacher/courses" replace />;

  let totalLessons = 0, completedLessons = 0, completedCoursesCount = 0;
  courses.forEach(c => {
    const lessonsLen = (c.lessons || []).length;
    const completedLen = progress[c.id]?.completedLessons?.length || 0;
    totalLessons += lessonsLen;
    completedLessons += completedLen;
    if (lessonsLen > 0 && completedLen === lessonsLen) completedCoursesCount++;
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
    color: SKILL_COLORS[i % SKILL_COLORS.length],
  }));

  const statCards = [
    {
      icon: <TrendingUp size={22} />,
      label: tr('coursesCompleted', 'Courses Completed'),
      value: completedCoursesCount,
      color: 'oklch(68% 0.21 278)',
    },
    {
      icon: <Terminal size={22} />,
      label: tr('challengesSolved', 'Challenges Solved'),
      value: challengeStats?.challengesSolved || 0,
      sub: tr('successfulAttempts', 'successful'),
      color: 'oklch(70% 0.18 155)',
    },
    {
      icon: <Clock size={22} />,
      label: tr('studyTime', 'Study Time'),
      value: formatTime(user.study_time_seconds, t),
      sub: tr('totalTime', 'total'),
      color: 'oklch(78% 0.18 75)',
    },
  ];

  const quickActions = [
    { icon: <Terminal size={24} />, label: tr('challenges', 'Challenges'),   desc: tr('challengesDesc', 'Train algorithms'), link: '/challenges', color: 'oklch(68% 0.21 278)' },
    { icon: <Code2 size={24} />,    label: tr('ide', 'IDE'),                 desc: tr('ideDesc', 'Write code freely'),      link: '/ide',        color: 'oklch(61% 0.26 300)' },
    { icon: <BookOpen size={24} />, label: tr('courses', 'Courses'),         desc: tr('coursesDesc', 'Continue learning'),   link: '/courses',    color: 'oklch(70% 0.18 155)' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'transparent' }}>
      <main className="page-main" style={{ flex: 1, overflowY: 'auto' }}>

        {/* ── Hero Header ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={easeOut}
          style={{
            marginBottom: '32px',
            position: 'relative',
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', flexWrap: 'wrap', gap: '24px',
          }}
        >

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: 'oklch(68% 0.21 278)',
              marginBottom: '6px',
            }}>
              {tr('welcomeBack', 'С ВОЗВРАЩЕНИЕМ')}
            </div>
            <h1 style={{
              fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
              fontWeight: 900, letterSpacing: '-0.04em',
              color: 'var(--text-primary)', lineHeight: 1.1,
            }}>
              {user.name}
            </h1>
          </div>


        </motion.div>

        {/* ── Stat Cards ──────────────────────────────────────── */}
        <motion.div
          variants={staggerContainerFast}
          initial="hidden"
          animate="visible"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
            marginBottom: '28px',
          }}
        >
          {statCards.map((s, i) => (
            <StatCard key={i} {...s} delay={i * 0.08} />
          ))}
        </motion.div>

        {/* ── Active Courses ───────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...easeOut, delay: 0.3 }}
          style={{
            padding: '28px 32px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-2xl)',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <div style={{
                fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px',
              }}>
                {tr('learning', 'Learning')}
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
                {tr('activeCourses', 'Active Courses')}
              </h3>
            </div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} transition={spring}>
              <NavLink
                to="/courses"
                style={{
                  fontSize: '0.82rem', color: 'var(--brand-primary)',
                  textDecoration: 'none', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: '4px',
                  background: 'var(--brand-glow)',
                  border: '1px solid var(--glass-border-hover)',
                  padding: '6px 14px', borderRadius: '9999px',
                }}
              >
                {tr('allCourses', 'All courses')} <ChevronRight size={14} />
              </NavLink>
            </motion.div>
          </div>

          <motion.div
            variants={staggerContainerFast}
            initial="hidden"
            animate="visible"
            style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
          >
            {activeCourses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <BookOpen size={40} style={{ opacity: 0.15, marginBottom: '16px', display: 'block', margin: '0 auto 16px' }} />
                <p>{tr('noActiveCourses', 'No active courses')}</p>
                <NavLink to="/courses" style={{
                  marginTop: '16px', display: 'inline-block',
                  padding: '10px 20px', borderRadius: '10px',
                  background: 'var(--overlay-bg)', color: 'var(--text-primary)',
                  textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600,
                }}>
                  {tr('openCourses', 'Browse courses')}
                </NavLink>
              </div>
            ) : activeCourses.map((course, i) => (
              <CourseRow key={course.id} course={course} index={i} navigate={navigate} />
            ))}
          </motion.div>
        </motion.div>

        {/* ── Activity Heatmap ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...easeOut, delay: 0.4 }}
          style={{
            padding: '28px 32px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-2xl)',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <div style={{
                fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: 'oklch(70% 0.18 155)',
                marginBottom: '6px',
              }}>
                {tr('activity', 'Activity')}
              </div>
              <h3 style={{
                fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.03em',
                display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <Activity size={20} color="oklch(70% 0.18 155)" />
                {tr('activityHistory', 'Activity History')}
              </h3>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {heatmapData.reduce((s, d) => s + d.count, 0)} {tr('activitiesTotal', 'actions this year')}
            </div>
          </div>
          <ActivityHeatmap data={heatmapData} tr={tr} />
        </motion.div>



        {/* ── Quick Actions ────────────────────────────────────── */}
        <motion.div
          variants={staggerContainerFast}
          initial="hidden"
          animate="visible"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
          }}
        >
          {quickActions.map((a, i) => (
            <QuickActionCard key={i} {...a} navigate={navigate} />
          ))}
        </motion.div>

      </main>
    </div>
  );
};

// ─── Utilities ────────────────────────────────────────────────────────────────
function formatTime(seconds, t) {
  if (!seconds || seconds <= 0) return '0 мин';
  if (seconds < 60)   return '1 мин';
  if (seconds < 3600) return `${Math.round(seconds / 60)} мин`;
  return `${(seconds / 3600).toFixed(1)} ч`;
}

// ─── Activity Heatmap ─────────────────────────────────────────────────────────
const ActivityHeatmap = ({ data, tr }) => {
  const today = new Date();
  const days = [];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    days.push({ date: d.toISOString().split('T')[0], month: d.getMonth() });
  }

  const map = {};
  (data || []).forEach(item => { map[item.date] = item.count; });

  const getColor = (count) => {
    if (!count) return 'var(--overlay-bg)';
    if (count === 1) return 'oklch(70% 0.18 155 / 40%)';
    if (count <= 3)  return 'oklch(70% 0.18 155 / 65%)';
    if (count <= 6)  return 'oklch(70% 0.18 155 / 85%)';
    return 'oklch(70% 0.18 155)';
  };

  const weeks = [];
  let currentWeek = [];
  const firstDayOfWeek = new Date(days[0].date).getDay();
  for (let i = 0; i < firstDayOfWeek; i++) currentWeek.push(null);

  let currentMonth = -1;
  const rawMonthLabels = [];

  days.forEach((dayObj, index) => {
    if (dayObj.month !== currentMonth) {
      rawMonthLabels.push({ label: months[dayObj.month], index: weeks.length });
      currentMonth = dayObj.month;
    }
    currentWeek.push(dayObj.date);
    if (currentWeek.length === 7) { weeks.push(currentWeek); currentWeek = []; }
  });
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  const monthLabels = [];
  rawMonthLabels.forEach(m => {
    if (monthLabels.length === 0 || m.index - monthLabels[monthLabels.length - 1].index >= 3) {
      monthLabels.push(m);
    }
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
      <div style={{ display: 'flex', gap: '10px' }}>
        {/* Weekday labels */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '4px',
          fontSize: '0.7rem', color: 'var(--text-muted)',
          width: '20px', flexShrink: 0, paddingTop: '22px',
        }}>
          {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((d, i) => (
            <span key={i} style={{ height: '13px', lineHeight: '13px', fontSize: '10px' }}>{d}</span>
          ))}
        </div>

        {/* Heatmap blocks */}
        <div style={{ display: 'flex', justifyContent: 'space-between', flex: 1, gap: '3px', paddingTop: '22px' }}>
          {weeks.map((week, i) => {
            const mLabel = monthLabels.find(m => m.index === i);
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '3px', position: 'relative' }}>
                {mLabel && (
                  <span style={{
                    position: 'absolute', top: '-20px', left: 0,
                    fontSize: '10px', color: 'var(--text-muted)',
                    whiteSpace: 'nowrap', fontWeight: 600,
                  }}>
                    {mLabel.label}
                  </span>
                )}
                {week.map((day, j) => {
                  if (!day) return <div key={j} style={{ width: '13px', height: '13px' }} />;
                  const count = map[day] || 0;
                  return (
                    <motion.div
                      key={j}
                      whileHover={{ scale: 1.3 }}
                      transition={{ duration: 0.1 }}
                      title={`${day}: ${count} ${tr('activities', 'actions')}`}
                      style={{
                        width: '13px', height: '13px',
                        borderRadius: '3px',
                        background: getColor(count),
                        cursor: 'pointer',
                        boxShadow: count > 3 ? '0 0 6px oklch(70% 0.18 155 / 40%)' : 'none',
                      }}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <span>{tr('less', 'Less')}</span>
        {[0, 1, 3, 5, 8].map(n => (
          <div key={n} style={{ width: '13px', height: '13px', borderRadius: '3px', background: getColor(n) }} />
        ))}
        <span>{tr('more', 'More')}</span>
      </div>
    </div>
  );
};

export default Dashboard;

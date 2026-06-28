import React, { useContext, useState, useEffect } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Calendar, 
  Edit3,
  X
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiCall } from '../utils/api';
import { AppContext } from '../context/AppContext';
import { coursesList } from '../data/coursesData';

const Profile = () => {
  const { id } = useParams();
  const { user: currentUser, progress, updateProfile, t } = useContext(AppContext);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(currentUser);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const targetId = id || currentUser?.id;
    if (targetId) {
      if (!id || id === String(currentUser?.id)) {
        setProfileData(currentUser);
      } else {
        setIsLoading(true);
      }
      apiCall(`/users/${targetId}/profile`)
        .then(data => setProfileData(data))
        .catch(err => console.error("Failed to load profile", err))
        .finally(() => setIsLoading(false));
    }
  }, [id, currentUser?.id]);

  // Form states
  const [name, setName] = useState(currentUser?.name || "");
  const [location, setLocation] = useState(currentUser?.location || "");
  const [bio, setBio] = useState(currentUser?.bio || "");

  if (isLoading || !profileData) return (
    <div style={{ display: 'flex', minHeight: '100vh', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid var(--overlay-bg-hover)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  );

  const isOwnProfile = !id || (currentUser && String(currentUser.id) === String(id));

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const getBaseUrl = () => {
    const url = import.meta.env.PROD ? '' : 'http://localhost:5000';
    return url.replace(/\/api$/, '');
  };
  const apiBase = getBaseUrl();
  const avatarUrl = profileData?.avatar_url ? (profileData.avatar_url.startsWith('http') ? profileData.avatar_url : `${apiBase}${profileData.avatar_url}`) : null;
  const coverUrl = profileData?.cover_url ? (profileData.cover_url.startsWith('http') ? profileData.cover_url : `${apiBase}${profileData.cover_url}`) : null;

  // Stats are fetched from backend (profileData.studentStats)
  const completedCoursesCount = profileData.studentStats?.completedCoursesCount || 0;
  const completedLessonsCount = profileData.studentStats?.completedLessonsCount || 0;


  // Recent activity logs built from DB data
  const activityLogs = [];
  if (profileData.activities && profileData.activities.length > 0) {
    profileData.activities.forEach(act => {
      let titleText = act.action_type;
      const lang = localStorage.getItem('codeai_language') || 'ru';
      
      if (act.action_type === 'lesson_completed') {
        titleText = lang === 'kz' ? 'Есеп шешілді' : (lang === 'en' ? 'Solved task' : 'Решил задачу');
      } else if (act.action_type === 'course_completed') {
        titleText = lang === 'kz' ? 'Курс аяқталды' : (lang === 'en' ? 'Completed course' : 'Прошел курс');
      } else if (act.action_type === 'course_created') {
        titleText = lang === 'kz' ? 'Курс жасалды' : (lang === 'en' ? 'Created course' : 'Создал курс');
      } else if (act.action_type === 'challenge_solved') {
        titleText = lang === 'kz' ? 'Челлендж шешілді' : (lang === 'en' ? 'Solved challenge' : 'Решил челлендж');
      }

      const dateObj = new Date(act.created_at);
      const timeStr = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

      activityLogs.push({
        title: titleText,
        desc: act.target_name,
        time: timeStr,
        link: act.target_link
      });
    });
  }

  // Fallback if no activity logs
  if (activityLogs.length === 0) {
    activityLogs.push({
      title: t('createdAccount'),
      desc: t('startJourney'),
      time: profileData.joinedDate || profileData.joined_date || t('recentTime')
    });
  }

  const handleSave = (e) => {
    e.preventDefault();
    updateProfile({ name, location, bio });
    setIsEditing(false);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'transparent' }}>
      
      <main className="animate-in" style={{ flex: 1, padding: '40px' }}>
        
        {/* Profile Header */}
        <header style={{ 
          background: 'var(--glass-card-bg)',
          borderRadius: '24px',
          marginBottom: '40px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'var(--glass-shadow)',
          border: '1px solid var(--glass-border)'
        }}>
            {/* Cover Photo */}
            <div style={{ 
                width: '100%', 
                height: '200px', 
                background: coverUrl ? `url(${coverUrl}) center/cover no-repeat` : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                position: 'relative',
                zIndex: 0
            }}>
              {!coverUrl && <div style={{ position: 'absolute', inset: 0, background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")', opacity: 0.5 }} />}
            </div>
            
            <div style={{ padding: '0 40px 40px', display: 'flex', gap: '30px', position: 'relative', zIndex: 1, marginTop: '-60px' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ 
                      width: '140px', 
                      height: '140px', 
                      borderRadius: '50%', 
                      background: 'var(--bg-main)', 
                      padding: '6px',
                      boxShadow: '0 8px 32px var(--card-shadow)'
                  }}>
                      <div style={{ 
                          width: '100%', 
                          height: '100%', 
                          borderRadius: '50%', 
                          background: 'var(--primary)', 
                          display: 'flex', 
                          justifyContent: 'center', 
                          alignItems: 'center',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '3rem',
                          overflow: 'hidden'
                      }}>
                          {avatarUrl ? (
                            <img 
                              src={avatarUrl} 
                              alt={profileData.name} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                            />
                          ) : (
                            getInitials(profileData.name)
                          )}
                      </div>
                  </div>
                </div>

                <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '70px' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', marginBottom: '8px', fontFamily: "'Montserrat', sans-serif", fontWeight: 800 }}>{profileData.name}</h1>
                        <p style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginBottom: '16px', fontWeight: 500 }}>
                          {profileData.bio || 'Студент CodeAI'}
                        </p>
                        <div style={{ display: 'flex', gap: '24px', color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 500 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={18} /> {profileData.location}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={18} /> {t('joinedDate')}: {profileData.joinedDate || profileData.joined_date}</span>
                        </div>
                    </div>
                    {isOwnProfile && (
                        <button className="btn btn-primary" onClick={() => setIsEditing(true)} style={{ padding: '12px 24px', borderRadius: '12px' }}>
                            <Edit3 size={18} /> {t('editProfile')}
                        </button>
                    )}
                </div>
            </div>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <section className="glass-card" style={{ padding: '30px' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '24px' }}>{(profileData.role === 'teacher' || profileData.role === 'admin') ? 'Статистика' : t('progressText')}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: (profileData.role === 'teacher' || profileData.role === 'admin') ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', gap: '20px' }}>
                    {(profileData.role === 'teacher' || profileData.role === 'admin') ? (
                        <>
                            <SummaryStat label="Создано курсов" value={profileData.teacherStats?.created_courses || 0} />
                            <SummaryStat label="Количество учеников" value={profileData.teacherStats?.total_students || 0} />
                            <SummaryStat label="Созданных задач" value={profileData.teacherStats?.created_challenges || 0} />
                        </>
                    ) : (
                        <>
                            <SummaryStat label={t('completedCoursesStat')} value={completedCoursesCount} />
                            <SummaryStat label={t('overallLessonsStat')} value={completedLessonsCount} />
                        </>
                    )}
                </div>
            </section>

            <section className="glass-card" style={{ padding: '30px' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '24px' }}>{t('recentActivity')}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                    {activityLogs.map((log, index) => (
                      <ActivityRow 
                          key={index}
                          title={log.title} 
                          time={log.time} 
                          desc={log.desc}
                          link={log.link}
                          isLast={index === activityLogs.length - 1}
                      />
                    ))}
                </div>
            </section>
        </div>
      </main>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditing && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10000,
            padding: '20px'
          }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card"
              style={{
                width: '100%',
                maxWidth: '500px',
                padding: '40px',
                position: 'relative'
              }}
            >
              <button 
                onClick={() => setIsEditing(false)}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                <X size={20} />
              </button>

              <h2 style={{ fontSize: '1.75rem', marginBottom: '24px', fontFamily: "'Montserrat', sans-serif" }}>{t('editProfileTitle')}</h2>
              
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>{t('yourName')}</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    style={modalInputStyle} 
                    required 
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>{t('location')}</label>
                  <input 
                    type="text" 
                    value={location} 
                    onChange={(e) => setLocation(e.target.value)} 
                    style={modalInputStyle} 
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>{t('aboutMe')}</label>
                  <textarea 
                    value={bio} 
                    onChange={(e) => setBio(e.target.value)} 
                    style={{ ...modalInputStyle, height: '100px', resize: 'none' }} 
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setIsEditing(false)}>{t('cancel')}</button>
                  <button type="submit" className="btn btn-primary">{t('save')}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};


const SummaryStat = ({ label, value }) => (
    <div style={{ textAlign: 'center', padding: '24px', background: 'var(--glass-card-bg)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
        <div style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '8px', fontFamily: "'Montserrat', sans-serif" }}>{value}</div>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
    </div>
);

const ActivityRow = ({ title, time, desc, link, isLast }) => {
    const navigate = useNavigate();
    return (
        <div 
            style={{ 
                display: 'flex',
                gap: '20px',
                padding: '0 0 24px 0',
                cursor: link ? 'pointer' : 'default',
                transition: 'background 0.2s',
                borderRadius: '8px',
            }}
            onClick={() => { if (link) navigate(link); }}
            onMouseOver={(e) => { if (link) e.currentTarget.style.background = 'var(--overlay-bg)'; }}
            onMouseOut={(e) => { if (link) e.currentTarget.style.background = 'transparent'; }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'var(--primary)', border: '4px solid var(--bg-main)', outline: '2px solid var(--primary)', zIndex: 1, marginTop: '4px' }} />
                {!isLast && <div style={{ width: '2px', flex: 1, background: 'var(--glass-border)', marginTop: '4px' }} />}
            </div>
            <div style={{ flex: 1, paddingBottom: isLast ? '0' : '20px' }}>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '6px', color: link ? 'var(--brand-primary)' : 'var(--text-main)', fontWeight: 600, transition: 'color 0.2s' }}>{title}</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{desc} • {time}</p>
            </div>
        </div>
    );
};


const modalInputStyle = {
  width: '100%',
  padding: '12px 16px',
  background: 'var(--surface-sunken)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '10px',
  color: 'var(--text-primary)',
  outline: 'none',
  fontSize: '0.95rem',
  fontFamily: "'Inter', sans-serif",
  transition: 'border-color 0.2s',
  boxSizing: 'border-box'
};

export default Profile;

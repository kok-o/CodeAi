import React, { createContext, useState, useEffect, useRef } from 'react';
import { translations } from '../utils/translations';
import { apiCall } from '../utils/api';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [progress, setProgress] = useState({});
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Notifications states
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const [language, setLangState] = useState(() => {
    return localStorage.getItem('codeai_language') || 'ru';
  });

  const setLanguage = (lang) => {
    setLangState(lang);
    localStorage.setItem('codeai_language', lang);
  };

  // Settings states
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('codeai_theme') || 'dark';
  });
  const setTheme = (t) => {
    setThemeState(t);
    localStorage.setItem('codeai_theme', t);
  };



  const [sidebarCollapsed, setSidebarCollapsedState] = useState(() => {
    return localStorage.getItem('codeai_sidebar_collapsed') === 'true';
  });
  const setSidebarCollapsed = (collapsed) => {
    setSidebarCollapsedState(collapsed);
    localStorage.setItem('codeai_sidebar_collapsed', String(collapsed));
  };
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const [editorFontSize, setEditorFontSizeState] = useState(() => {
    return localStorage.getItem('codeai_editor_font_size') || 'medium';
  });
  const setEditorFontSize = (size) => {
    setEditorFontSizeState(size);
    localStorage.setItem('codeai_editor_font_size', size);
  };

  const [aiStyle, setAiStyleState] = useState(() => {
    return localStorage.getItem('codeai_ai_style') || 'detailed';
  });
  const setAiStyle = (style) => {
    setAiStyleState(style);
    localStorage.setItem('codeai_ai_style', style);
  };

  const [lessonLanguage, setLessonLanguageState] = useState(() => {
    return localStorage.getItem('codeai_lesson_language') || 'ru';
  });
  const setLessonLanguage = (lang) => {
    setLessonLanguageState(lang);
    localStorage.setItem('codeai_lesson_language', lang);
  };

  const [dailyGoal, setDailyGoalState] = useState(() => {
    return localStorage.getItem('codeai_daily_goal') || '30';
  });
  const setDailyGoal = (goal) => {
    setDailyGoalState(goal);
    localStorage.setItem('codeai_daily_goal', goal);
  };

  // Dynamically apply Theme Styles
  useEffect(() => {
    localStorage.removeItem('codeai_accent_color'); // Clear old accent config if present
    
    const applyStyles = () => {
      // Determine theme
      let resolvedTheme = theme;
      if (theme === 'system') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        resolvedTheme = systemPrefersDark ? 'dark' : 'light';
      }

      // Apply data-theme attribute
      document.documentElement.setAttribute('data-theme', resolvedTheme);
    };

    applyStyles();

    if (theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyStyles();
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, [theme]);

  const t = (key) => {
    return translations[language]?.[key] || translations['ru']?.[key] || key;
  };

  // Helper to load all user-related data
  const loadAppData = async () => {
    try {
      const coursesData = await apiCall('/courses');
      setCourses(coursesData);
      
      const progressData = await apiCall('/progress');
      setProgress(progressData);
    } catch (err) {
      console.error("Error loading app data:", err.message);
    }
  };

  const logout = () => {
    localStorage.removeItem('codeai_token');
    setUser(null);
    setIsAuthenticated(false);
    setProgress({});
  };

  // Check auth session on startup
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('codeai_token');
      if (token) {
        try {
          const profile = await apiCall('/auth/me');
          setUser(profile);
          setIsAuthenticated(true);
          // Load app data
          await loadAppData();
        } catch (err) {
          console.error("Session initialization failed:", err.message);
          // Token is likely expired or database is unreachable
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      localStorage.setItem('codeai_token', data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      
      // Load app data
      await loadAppData();
      return true;
    } catch (err) {
      throw err;
    }
  };

  const register = async (name, email, password) => {
    try {
      const data = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
      });

      localStorage.setItem('codeai_token', data.token);
      setUser(data.user);
      setIsAuthenticated(true);

      // Load app data
      await loadAppData();
      return true;
    } catch (err) {
      throw err;
    }
  };



  const updateProfile = async (profileData) => {
    try {
      const updatedUser = await apiCall('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData)
      });
      setUser(updatedUser);
    } catch (err) {
      console.error("Error updating profile:", err.message);
      throw err;
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await apiCall('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword })
      });
    } catch (err) {
      console.error("Error changing password:", err.message);
      throw err;
    }
  };

  // --- AVATAR HANDLERS ---
  const uploadAvatar = async (base64Data) => {
    try {
      const res = await apiCall('/auth/avatar', {
        method: 'POST',
        body: JSON.stringify({ base64Data })
      });
      setUser(prev => prev ? { ...prev, avatar_url: res.avatarUrl } : null);
      fetchNotifications();
      return res.avatarUrl;
    } catch (err) {
      console.error("Error uploading avatar:", err.message);
      throw err;
    }
  };

  const deleteAvatar = async () => {
    try {
      await apiCall('/auth/avatar', { method: 'DELETE' });
      setUser(prev => prev ? { ...prev, avatar_url: null } : null);
      fetchNotifications();
    } catch (err) {
      console.error("Error deleting avatar:", err.message);
      throw err;
    }
  };

  const uploadCover = async (base64Data) => {
    try {
      const res = await apiCall('/auth/cover', {
        method: 'POST',
        body: JSON.stringify({ base64Data })
      });
      setUser(prev => prev ? { ...prev, cover_url: res.coverUrl } : null);
      return res.coverUrl;
    } catch (err) {
      console.error("Error uploading cover:", err.message);
      throw err;
    }
  };

  const deleteCover = async () => {
    try {
      await apiCall('/auth/cover', { method: 'DELETE' });
      setUser(prev => prev ? { ...prev, cover_url: null } : null);
    } catch (err) {
      console.error("Error deleting cover:", err.message);
      throw err;
    }
  };

  // --- NOTIFICATION HANDLERS ---
  const fetchNotifications = async () => {
    if (!localStorage.getItem('codeai_token')) return;
    try {
      const data = await apiCall('/notifications');
      setNotifications(data);
      setUnreadNotificationsCount(data.filter(n => !n.is_read).length);
    } catch (err) {
      console.error("Error fetching notifications:", err.message);
    }
  };

  const markNotificationAsRead = async (id) => {
    try {
      await apiCall(`/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadNotificationsCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error reading notification:", err.message);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await apiCall('/notifications/read-all', { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadNotificationsCount(0);
    } catch (err) {
      console.error("Error reading all notifications:", err.message);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await apiCall(`/notifications/${id}`, { method: 'DELETE' });
      setNotifications(prev => {
        const removed = prev.find(n => n.id === id);
        const newNotifications = prev.filter(n => n.id !== id);
        if (removed && !removed.is_read) {
          setUnreadNotificationsCount(c => Math.max(0, c - 1));
        }
        return newNotifications;
      });
    } catch (err) {
      console.error("Error deleting notification:", err.message);
    }
  };

  // Poll notifications every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);


  const saveCode = async (courseId, lessonId, codeContent) => {
    if (!user) return;

    // Optimistically update frontend state
    const updatedProgress = {
      ...progress,
      [courseId]: {
        ...progress[courseId],
        code: {
          ...progress[courseId]?.code,
          [lessonId]: codeContent
        }
      }
    };
    setProgress(updatedProgress);

    try {
      await apiCall('/progress/code', {
        method: 'POST',
        body: JSON.stringify({ courseId, lessonId, code: codeContent })
      });
    } catch (err) {
      console.error("Error saving code to server:", err.message);
    }
  };

  const completeLesson = async (courseId, lessonId) => {
    if (!user) return;

    try {
      const data = await apiCall('/progress/complete', {
        method: 'POST',
        body: JSON.stringify({ courseId, lessonId })
      });

      if (data.success) {
        // Update user state
        setUser(data.user);
        
        // Refresh progress and courses from the server to keep states fully in sync
        const progressData = await apiCall('/progress');
        setProgress(progressData);
      }
    } catch (err) {
      console.error("Error completing lesson on server:", err.message);
    }
  };

  // Helper trigger to reload courses (e.g. after a teacher creates one)
  const refreshCourses = async () => {
    try {
      const coursesData = await apiCall('/courses');
      setCourses(coursesData);
    } catch (err) {
      console.error("Error refreshing courses:", err.message);
    }
  };

  const completeOnboarding = async (track) => {
    if (!user) return false;
    try {
      const data = await apiCall('/auth/complete-onboarding', {
        method: 'POST',
        body: JSON.stringify({ track })
      });
      if (data.success) {
        setUser(data.user);
        const progressData = await apiCall('/progress');
        setProgress(progressData);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error completing onboarding on server:", err.message);
      throw err;
    }
  };

  const studyTimeAccumulator = useRef(0);

  useEffect(() => {
    if (!isAuthenticated || !user || user.role === 'teacher') return;

    // Increment local accumulator every second
    const interval = setInterval(() => {
      // Only count if document is visible
      if (document.visibilityState === 'visible') {
        studyTimeAccumulator.current += 1;
      }
    }, 1000);

    // Sync accumulated time to database every 30 seconds
    const syncInterval = setInterval(async () => {
      if (studyTimeAccumulator.current > 0) {
        const secs = studyTimeAccumulator.current;
        studyTimeAccumulator.current = 0; // reset first to prevent race condition
        try {
          const res = await apiCall('/auth/study-time', {
            method: 'POST',
            body: JSON.stringify({ seconds: secs })
          });
          setUser(prev => prev ? { ...prev, study_time_seconds: res.studyTimeSeconds } : null);
        } catch (err) {
          console.error("Failed to sync study time:", err);
          studyTimeAccumulator.current += secs; // put back if failed
        }
      }
    }, 30000);

    // Sync on visibility change (tab hide) or window close
    const handleVisibilityOrUnload = () => {
      if (studyTimeAccumulator.current > 0) {
        const secs = studyTimeAccumulator.current;
        studyTimeAccumulator.current = 0;
        
        const token = localStorage.getItem('codeai_token');
        if (token) {
          fetch(`${import.meta.env.PROD ? '/api' : 'http://localhost:5000/api'}/auth/study-time`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ seconds: secs }),
            keepalive: true
          }).then(res => {
            if (res.ok) {
              res.json().then(data => {
                setUser(prev => prev ? { ...prev, study_time_seconds: data.studyTimeSeconds } : null);
              });
            }
          }).catch(err => {
            console.error("Failed keepalive sync:", err);
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrUnload);
    window.addEventListener('beforeunload', handleVisibilityOrUnload);

    return () => {
      clearInterval(interval);
      clearInterval(syncInterval);
      document.removeEventListener('visibilitychange', handleVisibilityOrUnload);
      window.removeEventListener('beforeunload', handleVisibilityOrUnload);
      handleVisibilityOrUnload(); // final flush on cleanup
    };
  }, [isAuthenticated, user?.role]);

  return (
    <AppContext.Provider value={{
      user,
      isAuthenticated,
      progress,
      courses,
      isLoading,
      login,
      register,
      logout,
      updateProfile,
      changePassword,
      saveCode,
      completeLesson,
      completeOnboarding,
      language,
      setLanguage,
      refreshCourses,
      t,
      theme,
      setTheme,
      sidebarCollapsed,
      setSidebarCollapsed,
      toggleSidebar,
      editorFontSize,
      setEditorFontSize,
      aiStyle,
      setAiStyle,
      lessonLanguage,
      setLessonLanguage,
      dailyGoal,
      setDailyGoal,
      notifications,
      unreadNotificationsCount,
      fetchNotifications,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      deleteNotification,
      uploadAvatar,
      deleteAvatar,
      uploadCover,
      deleteCover
    }}>
      {children}
    </AppContext.Provider>
  );
};

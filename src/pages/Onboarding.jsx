import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AppContext } from '../context/AppContext';
import { 
  Sparkles, 
  Terminal, 
  Code, 
  Laptop, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  BookOpen, 
  Activity
} from 'lucide-react';

const Onboarding = () => {
  const { t, completeOnboarding, language } = useContext(AppContext);
  const [step, setStep] = useState(0);
  const [selectedTrack, setSelectedTrack] = useState('Python');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const tracks = [
    {
      id: 'Python',
      title: t('trackPython'),
      desc: t('trackPythonDesc'),
      icon: Terminal,
      bg: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
      shadowColor: 'rgba(6, 182, 212, 0.3)',
      courseId: 1,
      firstLessonId: 'py-1'
    },
    {
      id: 'JavaScript',
      title: t('trackJavaScript'),
      desc: t('trackJavaScriptDesc'),
      icon: Code,
      bg: 'linear-gradient(135deg, #f59e0b, #d97706)',
      shadowColor: 'rgba(245, 158, 11, 0.3)',
      courseId: 2,
      firstLessonId: 'js-1'
    },
    {
      id: 'Web Dev',
      title: t('trackWebDev'),
      desc: t('trackWebDevDesc'),
      icon: Laptop,
      bg: 'linear-gradient(135deg, #6366f1, #a855f7)',
      shadowColor: 'rgba(168, 85, 247, 0.3)',
      courseId: 3,
      firstLessonId: 'web-1'
    }
  ];

  const handleNext = () => {
    if (step < 2) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(prev => prev - 1);
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      const success = await completeOnboarding(selectedTrack);
      if (success) {
        const trackInfo = tracks.find(t => t.id === selectedTrack);
        navigate(`/lesson/${trackInfo.courseId}`, { replace: true });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    t('onboardingStepWelcome'),
    t('onboardingStepTrack'),
    t('onboardingStepFinish')
  ];

  const selectedTrackInfo = tracks.find(t => t.id === selectedTrack);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--bg-darker)',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Scope-injected CSS for animations, media queries, and states */}
      <style>{`
        .onboarding-card {
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid var(--overlay-bg);
          border-radius: 28px;
          padding: 48px;
          box-shadow: 0 24px 64px -12px rgba(0, 0, 0, 0.6), inset 0 1px 0 0 var(--overlay-bg-hover);
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 640px;
          width: 100%;
          max-width: 850px;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .track-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-top: 10px;
        }
        
        @media (max-width: 768px) {
          .track-grid {
            grid-template-columns: 1fr;
          }
          .onboarding-card {
            padding: 32px 24px;
            min-height: auto;
          }
          .welcome-title {
            font-size: 2rem !important;
          }
          .benefit-grid {
            grid-template-columns: 1fr !important;
          }
        }
        
        .track-card {
          cursor: pointer;
          padding: 28px 24px;
          border-radius: 20px;
          border: 1px solid var(--overlay-bg);
          background: var(--overlay-bg);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 240px;
          position: relative;
          overflow: hidden;
        }
        
        .track-card:hover {
          border-color: var(--overlay-bg-hover);
          transform: translateY(-6px);
          background: var(--overlay-bg);
          box-shadow: 0 16px 36px -12px rgba(0, 0, 0, 0.5);
        }
        
        .track-card.selected {
          background: var(--brand-glow);
          border-color: var(--primary);
          box-shadow: 0 0 30px var(--brand-glow), inset 0 1px 0 0 var(--overlay-bg-hover);
        }
        
        .track-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          color: white;
        }
        
        .track-card:hover .track-icon-wrapper {
          transform: scale(1.1) rotate(5deg);
        }
        
        .benefit-card {
          background: var(--overlay-bg);
          border: 1px solid var(--overlay-bg);
          border-radius: 18px;
          padding: 24px;
          display: flex;
          align-items: flex-start;
          gap: 16px;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          text-align: left;
        }
        
        .benefit-card:hover {
          background: var(--overlay-bg);
          border-color: var(--overlay-bg);
          transform: translateY(-3px);
        }
        
        .dot-indicator {
          height: 6px;
          border-radius: 100px;
          background: var(--overlay-bg-hover);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .dot-indicator.active {
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          box-shadow: 0 0 16px var(--primary);
        }
        
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(1.05); }
        }
        
        .glow-pulse {
          animation: pulse-glow 6s ease-in-out infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* Decorative Blur Backgrounds */}
      <div className="glow-pulse" style={{
        position: 'absolute',
        top: '-10%',
        left: '-10%',
        width: '50%',
        height: '50%',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div className="glow-pulse" style={{
        position: 'absolute',
        bottom: '-10%',
        right: '-10%',
        width: '50%',
        height: '50%',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
        animationDelay: '3s'
      }} />

      {/* Main Container Card */}
      <div className="onboarding-card">
        
        {/* Progress Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              fontFamily: "'Montserrat', sans-serif"
            }}>CodeAI onboarding</span>
            <span style={{
              fontSize: '0.8rem',
              color: 'var(--primary)',
              fontWeight: 600,
              fontFamily: "'Montserrat', sans-serif"
            }}>
              {language === 'kz' ? `Қадам ${step + 1} / 3` : (language === 'en' ? `Step ${step + 1} of 3` : `Шаг ${step + 1} из 3`)}
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '6px',
            background: 'var(--overlay-bg)',
            borderRadius: '100px',
            overflow: 'hidden'
          }}>
            <motion.div 
              style={{
                height: '100%',
                background: 'linear-gradient(95deg, var(--primary), var(--secondary))',
                borderRadius: '100px',
                boxShadow: '0 0 12px var(--primary)'
              }}
              initial={{ width: '33.33%' }}
              animate={{ width: `${((step + 1) / 3) * 100}%` }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>

        {/* Content Slides */}
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', margin: '24px 0' }}>
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              >
                <div style={{
                  width: '96px',
                  height: '96px',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(168, 85, 247, 0.12) 100%)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  borderRadius: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '28px',
                  boxShadow: '0 12px 32px -8px rgba(99, 102, 241, 0.3)'
                }}>
                  <Sparkles size={40} style={{ color: 'var(--accent)', filter: 'drop-shadow(0 0 8px var(--accent))' }} />
                </div>
                
                <h1 className="welcome-title" style={{
                  fontSize: '2.75rem',
                  fontWeight: 800,
                  lineHeight: 1.2,
                  marginBottom: '16px',
                  fontFamily: "'Montserrat', sans-serif",
                  background: 'linear-gradient(135deg, #ffffff 40%, rgba(255,255,255,0.7) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  {t('onboardingWelcome')}
                </h1>
                
                <p style={{
                  fontSize: '1.1rem',
                  color: 'var(--text-muted)',
                  maxWidth: '620px',
                  lineHeight: '1.6',
                  marginBottom: '36px'
                }}>
                  {t('onboardingSubtitle')}
                </p>

                <div className="benefit-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '20px',
                  width: '100%',
                  maxWidth: '720px'
                }}>
                  <div className="benefit-card">
                    <div style={{
                      padding: '12px',
                      background: 'var(--brand-glow)',
                      borderRadius: '12px',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <BookOpen size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'white', marginBottom: '6px' }}>
                        {language === 'kz' ? 'Практикалық сабақтар' : (language === 'en' ? 'Interactive Practice' : 'Практические уроки')}
                      </h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                        {language === 'kz' ? 'Зеріктіретін теория жоқ. Кодты автотексеру арқылы браузерде жазыңыз.' : (language === 'en' ? 'No boring lectures. Write code directly in your browser with instant test validation.' : 'Никакой скучной теории. Пишите код прямо в браузере с автопроверкой.')}
                      </p>
                    </div>
                  </div>
                  <div className="benefit-card">
                    <div style={{
                      padding: '12px',
                      background: 'rgba(168, 85, 247, 0.1)',
                      borderRadius: '12px',
                      color: 'var(--secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Activity size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'white', marginBottom: '6px' }}>
                        {language === 'kz' ? 'Локалды ИИ-ментор' : (language === 'en' ? 'Local AI Mentor' : 'Локальный ИИ-ментор')}
                      </h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                        {language === 'kz' ? 'Қателерді жергілікті Ollama моделі негізіндегі ақылды ИИ талдап береді.' : (language === 'en' ? 'Learn with an offline Ollama-based smart assistant helping you debug in real-time.' : 'Ошибки компилятора разберет умный ИИ на базе локальной модели Ollama.')}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="track"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                style={{ display: 'flex', flexDirection: 'column', width: '100%' }}
              >
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px', fontFamily: "'Montserrat', sans-serif" }}>
                    {t('onboardingSelectTrack')}
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '480px', margin: '0 auto' }}>
                    {t('onboardingSelectTrackDesc')}
                  </p>
                </div>

                <div className="track-grid">
                  {tracks.map((track) => {
                    const Icon = track.icon;
                    const isSelected = selectedTrack === track.id;
                    return (
                      <div
                        key={track.id}
                        onClick={() => setSelectedTrack(track.id)}
                        className={`track-card ${isSelected ? 'selected' : ''}`}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', marginBottom: '16px' }}>
                          <div className="track-icon-wrapper" style={{
                            background: track.bg,
                            boxShadow: isSelected ? `0 8px 20px ${track.shadowColor}` : 'none'
                          }}>
                            <Icon size={22} />
                          </div>
                          {isSelected && (
                            <div style={{
                              width: '24px',
                              height: '24px',
                              background: 'var(--primary)',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 0 10px var(--primary)'
                            }}>
                              <Check size={13} strokeWidth={3} color="white" />
                            </div>
                          )}
                        </div>

                        <div style={{ textAlign: 'left' }}>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: '8px', fontFamily: "'Montserrat', sans-serif" }}>
                            {track.title}
                          </h3>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
                            {track.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="finish"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              >
                <div style={{
                  width: '96px',
                  height: '96px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '28px',
                  boxShadow: '0 12px 32px -6px rgba(16, 185, 129, 0.35)',
                  color: 'var(--success)'
                }}>
                  <Check size={44} strokeWidth={2.5} />
                </div>
                
                <h2 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '12px', fontFamily: "'Montserrat', sans-serif" }}>
                  {t('onboardingStepFinish')}
                </h2>
                
                <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '440px', lineHeight: '1.6', marginBottom: '28px' }}>
                  {t('onboardingFinishText')}
                </p>

                <div style={{
                  background: 'var(--overlay-bg)',
                  border: '1px solid var(--overlay-bg)',
                  borderRadius: '18px',
                  padding: '18px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  maxWidth: '420px',
                  boxShadow: '0 12px 36px var(--dropdown-shadow)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      background: selectedTrackInfo?.bg || 'var(--primary)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      boxShadow: `0 8px 16px ${selectedTrackInfo?.shadowColor || 'var(--dropdown-shadow)'}`
                    }}>
                      {React.createElement(selectedTrackInfo?.icon || Code, { size: 20 })}
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--primary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '1px' }}>
                        {language === 'kz' ? 'СІЗДІҢ ТАҢДАУЫҢЫЗ' : (language === 'en' ? 'YOUR CHOICE' : 'ВАШ ВЫБОР')}
                      </span>
                      <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'white', margin: '2px 0 0 0', fontFamily: "'Montserrat', sans-serif" }}>
                        {selectedTrackInfo?.title}
                      </h4>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    {language === 'kz' ? 'Бастапқы курс' : (language === 'en' ? 'Intro Course' : 'Стартовый курс')}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
          <button
            onClick={handleBack}
            className="btn btn-outline"
            style={{
              padding: '12px 20px',
              borderRadius: '14px',
              opacity: step === 0 ? 0 : 1,
              pointerEvents: step === 0 ? 'none' : 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.9rem'
            }}
          >
            <ChevronLeft size={16} />
            <span>{language === 'kz' ? 'Артқа' : (language === 'en' ? 'Back' : 'Назад')}</span>
          </button>

          {step < 2 ? (
            <button
              onClick={handleNext}
              className="btn btn-primary"
              style={{
                padding: '14px 28px',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.9rem'
              }}
            >
              <span>{language === 'kz' ? 'Алға' : (language === 'en' ? 'Next' : 'Далее')}</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{
                padding: '14px 32px',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.95rem',
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                minWidth: '160px',
                justifyContent: 'center',
                opacity: isSubmitting ? 0.7 : 1
              }}
            >
              {isSubmitting ? (
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
              ) : (
                <>
                  <span>{t('onboardingStartLearning')}</span>
                  <Sparkles size={16} />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Slide Dot Indicators */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '32px', position: 'relative', zIndex: 10 }}>
        {steps.map((_, i) => (
          <div 
            key={i}
            className={`dot-indicator ${i === step ? 'active' : ''}`}
            style={{ width: i === step ? '32px' : '8px' }}
          />
        ))}
      </div>
    </div>
  );
};

export default Onboarding;

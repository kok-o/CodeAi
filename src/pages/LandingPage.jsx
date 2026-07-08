import React, { useContext, useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, useSpring, useInView, animate } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { AppContext } from '../context/AppContext';
import {
  Zap, Brain, Code2, CheckCircle, Users, ArrowRight,
  MonitorCheck, ChevronDown, Sparkles, Shield, Globe,
  Terminal, Star
} from 'lucide-react';
import {
  fadeInUp, fadeIn, scaleIn, staggerContainer, staggerContainerSlow,
  floatAnimation, blobAnimation, spring, easeOut,
} from '../utils/animations';
import StarsBackground from '../components/StarsBackground';
import Footer from '../components/Footer';


// ─── Typing Code Demo ────────────────────────────────────────────────────────
const CodeTyping = ({ language }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);

  const codeTemplates = {
    ru: [
      "function initializeAI() {\n  // Инициализация ИИ\n  const system = new NeuralNet();\n  system.connect('all-nodes');\n  return system.ready;\n}",
      "const generateExcellence = () => {\n  // Бесконечный цикл самообучения\n  while(true) {\n    learn();\n    improve();\n  }\n};",
      "import { Future } from 'platform';\n\n// Строим масштабируемое будущее\nawait Future.build({\n  scalable: true,\n  innovative: true\n});",
    ],
    kz: [
      "function initializeAI() {\n  // ЖИ инициализациялау\n  const system = new NeuralNet();\n  system.connect('all-nodes');\n  return system.ready;\n}",
      "const generateExcellence = () => {\n  // Үздіксіз оқу циклі\n  while(true) {\n    learn();\n    improve();\n  }\n};",
      "import { Future } from 'platform';\n\n// Болашақты құру\nawait Future.build({\n  scalable: true,\n  innovative: true\n});",
    ],
    en: [
      "function initializeAI() {\n  // Initialize AI system\n  const system = new NeuralNet();\n  system.connect('all-nodes');\n  return system.ready;\n}",
      "const generateExcellence = () => {\n  // Continuous learning loop\n  while(true) {\n    learn();\n    improve();\n  }\n};",
      "import { Future } from 'platform';\n\n// Building scalable future\nawait Future.build({\n  scalable: true,\n  innovative: true\n});",
    ],
  };

  const codes = codeTemplates[language] || codeTemplates.en;

  const highlightCode = (text) =>
    text
      .replace(/\b(function|const|return|import|from|await|while|true|new)\b/g,
        '<span style="color:oklch(68% 0.21 278)">$1</span>')
      .replace(/('[^']*')/g,
        '<span style="color:oklch(70% 0.18 155)">$1</span>')
      .replace(/\/\/.*/g,
        '<span style="color:oklch(58% 0.018 280)">$&</span>')
      .replace(/\b(initializeAI|NeuralNet|generateExcellence|learn|improve|Future|build|connect|ready)\b/g,
        '<span style="color:oklch(80% 0.16 75)">$1</span>');

  useEffect(() => { setDisplayedText(''); setLoopNum(0); setIsDeleting(false); }, [language]);

  useEffect(() => {
    let timer;
    const current = codes[loopNum % codes.length];
    if (isDeleting) {
      if (displayedText.length > 0) {
        timer = setTimeout(() => setDisplayedText(current.substring(0, displayedText.length - 1)), 20);
      } else {
        setIsDeleting(false);
        setLoopNum(n => n + 1);
      }
    } else {
      if (displayedText.length < current.length) {
        timer = setTimeout(() => setDisplayedText(current.substring(0, displayedText.length + 1)), 40);
      } else {
        timer = setTimeout(() => setIsDeleting(true), 2800);
      }
    }
    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, loopNum, codes]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      {/* IDE Tabs */}
      <div style={{
        display: 'flex', gap: '2px',
        background: 'var(--bg-activity-bar)',
        padding: '0 12px',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        {['app.js', 'neural.ts', 'styles.css'].map((tab, i) => (
          <div key={tab} style={{
            padding: '10px 16px',
            fontSize: '0.8rem',
            color: i === 0 ? 'var(--text-primary)' : 'var(--text-muted)',
            borderTop: i === 0 ? '2px solid var(--brand-primary)' : '2px solid transparent',
            cursor: 'pointer',
          }}>{tab}</div>
        ))}
      </div>
      {/* Code Content */}
      <div style={{
        flex: 1, padding: '20px', textAlign: 'left',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '0.85rem', color: 'var(--text-primary)',
        lineHeight: 1.7, background: 'var(--bg-editor)',
        display: 'flex', alignItems: 'flex-start', overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', flexDirection: 'column',
          color: 'var(--text-muted)', paddingRight: '20px',
          userSelect: 'none', alignItems: 'flex-end',
          fontSize: '0.75rem', opacity: 0.5,
        }}>
          {[1,2,3,4,5,6,7].map(n => <span key={n}>{n}</span>)}
        </div>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', flex: 1, position: 'relative' }}>
          <span dangerouslySetInnerHTML={{ __html: highlightCode(displayedText) }} />
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            style={{
              display: 'inline-block', width: '2px', height: '1.1em',
              background: 'var(--brand-primary)', verticalAlign: 'middle', marginLeft: '2px',
              borderRadius: '1px',
            }}
          />
        </pre>
      </div>
    </div>
  );
};

// ─── Landing Page ─────────────────────────────────────────────────────────────
const LandingPage = () => {
  const { t, language } = useContext(AppContext);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef = useRef(null);

  const chatTranslations = {
    ru: {
      userQuestion: 'Объясни, как работает функция initializeAI()?',
      aiResponse: 'Она создает объект <strong>NeuralNet</strong>, устанавливает соединения со всеми активными узлами и завершает работу, когда сеть готова.',
      askPlaceholder: 'Задать вопрос...', you: 'Вы', aiAssistant: 'Ассистент ИИ',
    },
    kz: {
      userQuestion: 'initializeAI() функциясы қалай жұмыс істейді?',
      aiResponse: 'Ол <strong>NeuralNet</strong> нысанын құрады, барлық белсенді тораптармен байланыс орнатады және желі дайын болғанда жұмысын аяқтайды.',
      askPlaceholder: 'Сұрақ қою...', you: 'Сіз', aiAssistant: 'ЖИ Көмекшісі',
    },
    en: {
      userQuestion: 'Explain how initializeAI() works?',
      aiResponse: 'It creates a <strong>NeuralNet</strong>, establishes connections to all active nodes, and resolves when the network is ready.',
      askPlaceholder: 'Ask a question...', you: 'You', aiAssistant: 'AI Assistant',
    },
  };
  const chat = chatTranslations[language] || chatTranslations.en;

  // Mouse-follow glow for hero
  const handleMouseMove = (e) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  // 3D Parallax for mockup
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springCfg = { damping: 22, stiffness: 130 };
  const mxSpring = useSpring(mouseX, springCfg);
  const mySpring = useSpring(mouseY, springCfg);
  const rotateX = useTransform(mySpring, [-300, 300], [8, -8]);
  const rotateY = useTransform(mxSpring, [-300, 300], [-8, 8]);

  const handleMockupMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };
  const handleMockupMouseLeave = () => { mouseX.set(0); mouseY.set(0); };

  return (
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <StarsBackground />
      <Navbar />

      {/* ── Hero Section ──────────────────────────────────────── */}
      <section
        ref={heroRef}
        onMouseMove={handleMouseMove}
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '80px clamp(16px, 5vw, 60px) 0',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Mouse-follow glow removed */}

        {/* Ambient hero blobs removed */}

        {/* Small badge removed */}

        {/* Hero Text */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          style={{ width: '100%', maxWidth: '1000px', zIndex: 1, position: 'relative' }}
        >
          <motion.h1
            variants={fadeInUp}
            style={{
              fontSize: 'clamp(2.8rem, 8vw, 6rem)',
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: 'clamp(-1.5px, -0.04em, -3px)',
              marginBottom: '28px',
            }}
          >
            {t('landingTitle1')} <br />
            <span style={{
              background: 'linear-gradient(135deg, var(--brand-300) 0%, var(--brand-500) 40%, var(--violet-500) 75%, var(--brand-400) 100%)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'gradientShift 5s ease infinite',
            }}>
              {t('landingTitle2')}
            </span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            style={{
              fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
              color: 'var(--text-muted)',
              maxWidth: '680px',
              margin: '0 auto 48px',
              lineHeight: 1.7,
            }}
          >
            {t('landingSub')}
          </motion.p>

          <motion.div
            variants={fadeInUp}
            style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }} transition={spring}>
              <NavLink
                to="/register"
                className="btn btn-primary btn-lg"
                style={{ gap: '10px' }}
              >
                {t('startFree')}
                <ArrowRight size={18} className="arrow-icon" />
              </NavLink>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 10, 0] }}
          transition={{
            opacity: { delay: 1.5, duration: 0.8 },
            y: { repeat: Infinity, duration: 2.4, ease: 'easeInOut', delay: 1.5 },
          }}
          style={{
            position: 'absolute', bottom: '48px', left: '50%',
            transform: 'translateX(-50%)', cursor: 'pointer', zIndex: 1,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
          }}
          onClick={() => document.getElementById('mockup-section')?.scrollIntoView({ behavior: 'smooth' })}
        >
          <ChevronDown size={20} color="var(--text-muted)" opacity={0.5} />
        </motion.div>
      </section>

      {/* ── Mockup Section ────────────────────────────────────── */}
      <section
        id="mockup-section"
        style={{
          minHeight: '90vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'clamp(60px, 8vw, 120px) clamp(16px, 5vw, 60px)',
          position: 'relative',
        }}
      >
        <div
          className="desktop-only"
          style={{ perspective: '1400px', width: '100%', maxWidth: '1100px', flexDirection: 'column' }}
          onMouseMove={handleMockupMouseMove}
          onMouseLeave={handleMockupMouseLeave}
        >
          {/* Glow behind mockup removed */}

          <motion.div
            initial={{ opacity: 0, y: 80, scale: 0.92, rotateX: 12 }}
            whileInView={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ boxShadow: '0 40px 100px -20px oklch(0% 0 0 / 50%)' }}
            style={{
              height: '520px',
              borderRadius: '24px',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              rotateX,
              rotateY,
              transformStyle: 'preserve-3d',
              background: 'var(--bg-editor)',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 24px 80px -16px oklch(0% 0 0 / 40%), 0 0 0 1px var(--border-subtle)',
            }}
          >
            {/* Window chrome */}
            <div style={{
              height: '44px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center',
              padding: '0 20px', gap: '8px',
              background: 'var(--bg-activity-bar)',
            }}>
              <div style={{ width: '12px', height: '12px', background: '#ff5f56', borderRadius: '50%' }} />
              <div style={{ width: '12px', height: '12px', background: '#ffbd2e', borderRadius: '50%' }} />
              <div style={{ width: '12px', height: '12px', background: '#27c93f', borderRadius: '50%' }} />
              <div style={{
                marginLeft: '20px',
                background: 'var(--overlay-bg)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '2px 20px',
                fontSize: '11px', color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
              }}>
                CodeAI — app.js
              </div>
            </div>

            {/* Main IDE area */}
            <div style={{ flex: 1, display: 'flex', background: 'var(--bg-editor)' }}>
              {/* Activity sidebar icons */}
              <div style={{
                width: '52px',
                borderRight: '1px solid var(--border-subtle)',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '16px 0', gap: '18px',
                background: 'var(--bg-sidebar)',
              }}>
                <Code2 size={20} color="var(--brand-primary)" opacity={0.9} />
                <Terminal size={20} color="var(--text-muted)" opacity={0.5} />
                <Globe size={20} color="var(--text-muted)" opacity={0.5} />
              </div>

              {/* Code editor */}
              <div style={{ flex: 1, position: 'relative' }}>
                <CodeTyping language={language} />
              </div>

              {/* Chat panel */}
              <div style={{
                width: '270px',
                borderLeft: '1px solid var(--border-subtle)',
                display: 'flex', flexDirection: 'column',
                background: 'var(--bg-sidebar)',
                textAlign: 'left',
              }}>
                {/* Chat header */}
                <div style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex', alignItems: 'center', gap: '10px',
                }}>
                  <img src="/logo.png" alt="CodeAI" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, letterSpacing: '-0.03em' }}>
                    Code<span style={{ color: 'var(--brand-primary)' }}>AI</span>
                  </span>
                  <div style={{
                    marginLeft: 'auto',
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: 'var(--success)',
                  }} />
                </div>

                {/* Chat Messages */}
                <div style={{
                  flex: 1, padding: '14px', display: 'flex',
                  flexDirection: 'column', gap: '14px',
                  overflowY: 'auto', fontSize: '0.78rem', lineHeight: 1.5,
                }}>
                  <div style={{ alignSelf: 'flex-end', maxWidth: '88%' }}>
                    <div style={{
                      background: 'linear-gradient(135deg, var(--brand-500), var(--brand-600))',
                      color: 'white', padding: '9px 13px',
                      borderRadius: '14px 14px 2px 14px',
                      boxShadow: '0 2px 8px var(--brand-glow)',
                    }}>
                      {chat.userQuestion}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
                      {chat.you}
                    </div>
                  </div>

                  <div style={{ alignSelf: 'flex-start', maxWidth: '88%' }}>
                    <div style={{
                      background: 'var(--glass-bg)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-primary)',
                      padding: '9px 13px',
                      borderRadius: '2px 14px 14px 14px',
                    }}>
                      <span dangerouslySetInnerHTML={{ __html: chat.aiResponse }} />
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {chat.aiAssistant}
                    </div>
                  </div>
                </div>

                {/* Chat input */}
                <div style={{ padding: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px', padding: '9px 12px',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                    color: 'var(--text-muted)', fontSize: '0.78rem',
                  }}>
                    <span>{chat.askPlaceholder}</span>
                    <ArrowRight size={14} opacity={0.4} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;

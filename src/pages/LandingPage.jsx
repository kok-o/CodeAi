import React, { useContext, useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { AppContext } from '../context/AppContext';
import { 
  Zap, 
  Brain, 
  Code2, 
  CheckCircle, 
  Users, 
  ArrowRight,
  MonitorCheck
} from 'lucide-react';

const CodeTyping = ({ language }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const typingSpeed = 50;
  const deletingSpeed = 30;

  const codeTemplates = {
    ru: [
      "function initializeAI() {\n  // Инициализация ИИ\n  const system = new NeuralNet();\n  system.connect('all-nodes');\n  return system.ready;\n}",
      "const generateExcellence = () => {\n  // Бесконечный цикл самообучения\n  while(true) {\n    learn();\n    improve();\n  }\n};",
      "import { Future } from 'platform';\n\n// Строим масштабируемое будущее\nawait Future.build({\n  scalable: true,\n  innovative: true\n});"
    ],
    kz: [
      "function initializeAI() {\n  // ЖИ инициализациялау\n  const system = new NeuralNet();\n  system.connect('all-nodes');\n  return system.ready;\n}",
      "const generateExcellence = () => {\n  // Үздіксіз оқу және даму циклі\n  while(true) {\n    learn();\n    improve();\n  }\n};",
      "import { Future } from 'platform';\n\n// Болашақты құру\nawait Future.build({\n  scalable: true,\n  innovative: true\n});"
    ],
    en: [
      "function initializeAI() {\n  // Initialize AI\n  const system = new NeuralNet();\n  system.connect('all-nodes');\n  return system.ready;\n}",
      "const generateExcellence = () => {\n  // Continuous learning loop\n  while(true) {\n    learn();\n    improve();\n  }\n};",
      "import { Future } from 'platform';\n\n// Building the future\nawait Future.build({\n  scalable: true,\n  innovative: true\n});"
    ]
  };

  const codes = codeTemplates[language] || codeTemplates['ru'] || codeTemplates['en'];

  const highlightCode = (text) => {
    return text
      .replace(/\b(function|const|return|import|from|await|while|true)\b/g, '<span style="color: var(--brand-secondary);">$1</span>')
      .replace(/('[^']*')/g, '<span style="color: var(--brand-accent);">$1</span>')
      .replace(/\b(initializeAI|NeuralNet|generateExcellence|learn|improve|Future|build|connect|ready)\b/g, '<span style="color: var(--brand-primary);">$1</span>');
  };

  useEffect(() => {
    setDisplayedText("");
    setLoopNum(0);
    setIsDeleting(false);
  }, [language]);

  useEffect(() => {
    let timer;
    const currentCode = codes[loopNum % codes.length];

    if (isDeleting) {
      if (displayedText.length > 0) {
        timer = setTimeout(() => {
          setDisplayedText(currentCode.substring(0, displayedText.length - 1));
        }, deletingSpeed);
      } else {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
      }
    } else {
      if (displayedText.length < currentCode.length) {
        timer = setTimeout(() => {
          setDisplayedText(currentCode.substring(0, displayedText.length + 1));
        }, typingSpeed);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 2500);
      }
    }
    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, loopNum, codes]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      {/* IDE Tabs */}
      <div style={{ display: 'flex', gap: '2px', background: 'var(--bg-activity-bar)', padding: '0 10px' }}>
        <div style={{ padding: '10px 20px', borderTop: '2px solid var(--primary)', color: 'var(--text-primary)', fontSize: '0.9rem' }}>app.js</div>
        <div style={{ padding: '10px 20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>neural.ts</div>
        <div style={{ padding: '10px 20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>styles.css</div>
      </div>
      {/* IDE Content */}
      <div style={{ flex: 1, padding: '24px', textAlign: 'left', fontFamily: 'monospace', fontSize: '1.1rem', color: 'var(--text-primary)', lineHeight: '1.6', background: 'var(--bg-editor)', display: 'flex', alignItems: 'flex-start', overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexDirection: 'column', color: 'var(--text-muted)', paddingRight: '20px', userSelect: 'none', alignItems: 'flex-end' }}>
          {[1, 2, 3, 4, 5, 6, 7].map(num => <span key={num}>{num}</span>)}
        </div>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', flex: 1, position: 'relative' }}>
          <span dangerouslySetInnerHTML={{ __html: highlightCode(displayedText) }} />
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            style={{ display: 'inline-block', width: '8px', height: '1.2em', background: 'var(--primary)', verticalAlign: 'middle', marginLeft: '4px' }}
          />
        </pre>
      </div>
    </div>
  );
};

const LandingPage = () => {
  const { t, language } = useContext(AppContext);

  const chatTranslations = {
    ru: {
      copilotChat: "Чат с ассистентом",
      active: "Активен",
      userQuestion: "Объясни, как работает функция initializeAI()?",
      aiResponse: "Она создает объект <strong>NeuralNet</strong>, устанавливает соединения со всеми активными узлами и завершает работу, когда сеть готова.",
      askPlaceholder: "Задать вопрос...",
      you: "Вы",
      aiAssistant: "Ассистент ИИ"
    },
    kz: {
      copilotChat: "Көмекші чаты",
      active: "Белсенді",
      userQuestion: "initializeAI() функциясы қалай жұмыс істінін түсіндіріп жіберші?",
      aiResponse: "Ол <strong>NeuralNet</strong> нысанын құрады, барлық белсенді тораптармен байланыс орнатады және желі дайын болғанда жұмысын аяқтайды.",
      askPlaceholder: "Сұрақ қою...",
      you: "Сіз",
      aiAssistant: "ЖИ Көмекшісі"
    },
    en: {
      copilotChat: "Copilot Chat",
      active: "Active",
      userQuestion: "Explain how initializeAI() works?",
      aiResponse: "It creates a <strong>NeuralNet</strong>, establishes connections to all active nodes, and resolves when the network is ready.",
      askPlaceholder: "Ask a question...",
      you: "You",
      aiAssistant: "AI Assistant"
    }
  };

  const chat = chatTranslations[language] || chatTranslations['ru'] || chatTranslations['en'];
  
  // 3D Parallax Effect setup
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Spring configuration for smoother, premium feel
  const springConfig = { damping: 20, stiffness: 120 };
  const mouseXSpring = useSpring(mouseX, springConfig);
  const mouseYSpring = useSpring(mouseY, springConfig);

  const rotateX = useTransform(mouseYSpring, [-300, 300], [8, -8]);
  const rotateY = useTransform(mouseXSpring, [-300, 300], [-8, 8]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div style={{ paddingBottom: '100px' }}>
      <Navbar />
      
      {/* Hero Section */}
      <section style={{
        padding: '180px 40px 100px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative elements */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: '300px',
          height: '300px',
          background: 'var(--primary)',
          filter: 'blur(150px)',
          opacity: 0.2,
          zIndex: -1
        }} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="glass" style={{
            padding: '8px 20px',
            fontSize: '0.9rem',
            fontWeight: '600',
            color: 'var(--accent)',
            marginBottom: '24px',
            display: 'inline-block',
            border: '1px solid var(--border-accent)'
          }}>
            {t('nextGenLearning')}
          </span>
          <h1 style={{
            fontSize: 'max(4rem, 5vw)',
            fontWeight: '900',
            lineHeight: 1.1,
            marginBottom: '24px',
            letterSpacing: '-2px'
          }}>
            {t('landingTitle1')} <br/>
            <span style={{
              background: 'linear-gradient(135deg, var(--accent), var(--primary), var(--secondary))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>{t('landingTitle2')}</span>
          </h1>
          <p style={{
            fontSize: '1.25rem',
            color: 'var(--text-muted)',
            maxWidth: '700px',
            margin: '0 auto 40px',
            lineHeight: 1.6
          }}>
            {t('landingSub')}
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <NavLink to="/register" className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
              {t('startFree')} <ArrowRight size={20} />
            </NavLink>
          </div>
        </motion.div>

        {/* Hero Mockup Image Placeholder */}
        <div 
          style={{ perspective: '1200px', maxWidth: '1000px', margin: '80px auto 0' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.9, rotateX: 15 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              scale: 1,
              rotateX: 0
            }}
            transition={{ 
              duration: 1.2, 
              ease: [0.16, 1, 0.3, 1], // Custom ease-out expo
              delay: 0.2
            }}
            whileHover={{
              boxShadow: 'var(--dropdown-shadow)'
            }}
            style={{
              height: '500px',
              borderRadius: '24px',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              rotateX,
              rotateY,
              transformStyle: "preserve-3d",
              background: 'var(--bg-editor)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--glass-shadow)'
            }}
          >
            <div style={{ height: '40px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: '8px', background: 'var(--bg-activity-bar)' }}>
              <div style={{ width: '10px', height: '10px', background: '#ff5f56', borderRadius: '50%' }} />
              <div style={{ width: '10px', height: '10px', background: '#ffbd2e', borderRadius: '50%' }} />
              <div style={{ width: '10px', height: '10px', background: '#27c93f', borderRadius: '50%' }} />
            </div>
            <div style={{ flex: 1, display: 'flex', background: 'var(--bg-editor)' }}>
               {/* Sidebar */}
               <div style={{ width: '60px', borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0', gap: '20px', background: 'var(--bg-sidebar)' }}>
                  <Code2 size={24} color="var(--primary)" opacity={0.8} />
               </div>
               {/* Main Editor Area */}
               <div style={{ flex: 1, position: 'relative' }}>
                 <CodeTyping language={language} />
               </div>
               {/* Chat Panel */}
               <div style={{ 
                 width: '260px', 
                 borderLeft: '1px solid var(--border-subtle)', 
                 display: 'flex', 
                 flexDirection: 'column', 
                 background: 'var(--bg-sidebar)',
                 textAlign: 'left',
                 transformStyle: "preserve-3d"
               }}>
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <img 
                       src="/logo.png" 
                       alt="CodeAI Logo" 
                       style={{
                         width: '24px',
                         height: '24px',
                         objectFit: 'contain'
                       }} 
                     />
                     <span className="heading" style={{ fontSize: '1rem', fontWeight: '800', letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>
                       Code<span style={{ color: 'var(--primary)' }}>AI</span>
                     </span>
                  </div>
                  
                  {/* Chat Messages */}
                  <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', fontSize: '0.8rem', lineHeight: '1.4' }}>
                     {/* User Message */}
                     <div style={{ alignSelf: 'flex-end', maxWidth: '85%' }}>
                        <div style={{ background: 'var(--primary)', color: 'white', padding: '8px 12px', borderRadius: '12px 12px 0 12px' }}>
                           {chat.userQuestion}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>{chat.you}</div>
                     </div>

                     {/* AI Message */}
                     <div style={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '8px 12px', borderRadius: '12px 12px 12px 0' }}>
                           <span dangerouslySetInnerHTML={{ __html: chat.aiResponse }} />
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>{chat.aiAssistant}</div>
                     </div>
                  </div>

                  {/* Chat Input */}
                  <div style={{ padding: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                     <div style={{ 
                       background: 'var(--bg-card)', 
                       border: '1px solid var(--border-subtle)', 
                       borderRadius: '8px', 
                       padding: '8px 12px',
                       display: 'flex',
                       alignItems: 'center',
                       justifyContent: 'space-between',
                       color: 'var(--text-muted)',
                       fontSize: '0.8rem'
                     }}>
                        <span>{chat.askPlaceholder}</span>
                        <ArrowRight size={14} opacity={0.5} />
                     </div>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '100px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>{t('drivenByIntel')}</h2>
            <p style={{ color: 'var(--text-muted)' }}>{t('platformThinksWithYou')}</p>
        </div>

        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '30px'
        }}>
            <FeatureCard 
                icon={<Code2 color="var(--accent)" />} 
                title={t('featIde')} 
                desc={t('featIdeDesc')}
            />
            <FeatureCard 
                icon={<Brain color="var(--primary)" />} 
                title={t('featAi')} 
                desc={t('featAiDesc')}
            />
            <FeatureCard 
                icon={<Zap color="var(--secondary)" />} 
                title={t('featExec')} 
                desc={t('featExecDesc')}
            />
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }) => (
    <div className="glass-card" style={{ padding: '40px', textAlign: 'left' }}>
        <div style={{ 
            width: '60px', 
            height: '60px', 
            borderRadius: '16px', 
            background: 'var(--overlay-bg)', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            marginBottom: '24px'
        }}>
            {icon}
        </div>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>{title}</h3>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>{desc}</p>
    </div>
);

export default LandingPage;

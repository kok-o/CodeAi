import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { Send } from 'lucide-react';
import { AppContext } from '../context/AppContext';

const GithubIcon = ({ size = 24, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.03c3.15-.38 6.5-1.4 6.5-7.17a5.5 5.5 0 0 0-1.5-3.82 5.2 5.2 0 0 0-.1-3.82s-1.25-.4-4 1.45a13.3 13.3 0 0 0-7 0c-2.75-1.85-4-1.45-4-1.45a5.2 5.2 0 0 0-.1 3.82A5.5 5.5 0 0 0 2 8.77c0 5.76 3.35 6.79 6.5 7.17A4.8 4.8 0 0 0 7.5 19v3"></path>
  </svg>
);

const LinkedinIcon = ({ size = 24, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { isAuthenticated, user } = useContext(AppContext);

  const getMainScreenPath = () => {
    if (!isAuthenticated) return '/';
    return user?.role === 'teacher' ? '/teacher/courses' : '/dashboard';
  };
  const mainPath = getMainScreenPath();

  return (
    <footer style={{
      borderTop: '1px solid var(--border-subtle)',
      background: 'var(--bg-sidebar)', // using the dark sidebar background to blend nicely
      marginTop: 'auto'
    }}>
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '48px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px'
      }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '32px'
        }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link to={mainPath} style={{ display: 'flex', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <img src="/logo.png" alt="Logo" style={{ width: '48px', height: '48px', objectFit: 'contain', cursor: 'pointer' }} />
            </Link>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Link
                to="/"
                style={{
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  textDecoration: 'none',
                  fontSize: '1.1rem',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = 'var(--brand-primary)'}
                onMouseLeave={(e) => e.target.style.color = 'var(--text-primary)'}
              >
                Nurkhan Esenbek
              </Link>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                Frontend Developer
              </p>
            </div>
          </div>



          {/* Правая часть: Социальные сети */}
          <ul style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            listStyle: 'none',
            padding: 0,
            margin: 0
          }}>
            <li>
              <a
                href="https://github.com/kok-o"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'var(--text-muted)',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <GithubIcon size={20} />
              </a>
            </li>
            <li>
              <a
                href="https://t.me/k0ko_tg"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'var(--text-muted)',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <Send size={20} />
              </a>
            </li>
            <li>
              <a
                href="https://linkedin.com/in/nurkhan-esenbek"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'var(--text-muted)',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <LinkedinIcon size={20} />
              </a>
            </li>
          </ul>
        </div>


      </div>
    </footer>
  );
}

export default Footer;

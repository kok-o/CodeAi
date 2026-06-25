import React, { useState, useRef, useEffect, useContext } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { AppContext } from '../context/AppContext';

const ModelSelector = ({ value, onChange, models = [], compact = false, ghost = false, upward = false }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { t } = useContext(AppContext) || { t: {} }; // Fallback in case used outside context

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = models.find(m => m.id === value) || models[0];

  const styles = {
    wrapper: { position: 'relative', display: 'inline-block' },
    trigger: {
      display: 'flex', alignItems: 'center', gap: '6px',
      background: ghost ? 'transparent' : 'var(--bg-card)',
      border: ghost ? '1px solid transparent' : '1px solid var(--border-subtle)',
      borderRadius: '8px', padding: compact ? '4px 8px' : '6px 12px',
      cursor: 'pointer', color: 'var(--text-main, #e2e8f0)',
      fontSize: compact ? '0.75rem' : '0.85rem', fontWeight: 500,
      transition: 'all 0.15s ease', userSelect: 'none', whiteSpace: 'nowrap',
    },
    dropdown: {
      position: 'absolute', 
      top: upward ? 'auto' : 'calc(100% + 8px)', 
      bottom: upward ? 'calc(100% + 8px)' : 'auto',
      left: 0,
      minWidth: '160px', zIndex: 99999, // Maximum z-index
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '12px', padding: '6px',
      boxShadow: 'var(--glass-shadow)',
    },
    option: (isSelected) => ({
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
      background: isSelected ? 'var(--overlay-bg)' : 'transparent',
      transition: 'all 0.1s ease',
      color: isSelected ? 'var(--text-primary)' : 'var(--text-main)',
      fontSize: '0.8rem', fontWeight: isSelected ? 600 : 400,
      marginBottom: '2px',
    }),
  };

  return (
    <div style={styles.wrapper} ref={ref}>
      <div style={styles.trigger} onClick={() => setOpen(o => !o)}>
        <span>{current?.name || (t ? t('autoModel') : null) || 'Auto'}</span>
        <ChevronDown size={12} style={{ opacity: 0.6, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </div>

      {open && (
        <div style={styles.dropdown}>
          {models.map(m => (
            <div
              key={m.id}
              style={styles.option(m.id === value)}
              onClick={() => { onChange(m.id); setOpen(false); }}
              onMouseEnter={e => { if (m.id !== value) e.currentTarget.style.background = 'var(--overlay-bg)'; }}
              onMouseLeave={e => { if (m.id !== value) e.currentTarget.style.background = 'transparent'; }}
            >
              <span>{m.name}</span>
              {m.id === value && <Check size={14} color="var(--brand-primary)" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModelSelector;

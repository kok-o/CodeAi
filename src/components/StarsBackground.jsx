import React, { useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

const getThemeColors = () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return isDark
    ? { dot: 'rgba(255, 255, 255, 0.8)', line: 'rgba(255, 255, 255, 0.4)' }
    : { dot: 'rgba(80, 90, 180, 0.5)', line: 'rgba(80, 90, 180, 0.15)' };
};

const StarsBackground = () => {
  const canvasRef = useRef(null);
  const pluginLoadedRef = useRef(false);
  const constellationActiveRef = useRef(false);

  const initConstellation = useCallback(() => {
    if (!window.$ || !canvasRef.current) return;

    const colors = getThemeColors();

    // Destroy existing constellation if active
    if (constellationActiveRef.current) {
      try {
        window.$(canvasRef.current).constellation('destroy');
      } catch (_) {
        // Plugin may not support destroy — fallback: do nothing
      }
    }

    window.$(canvasRef.current).constellation({
      star: {
        width: 3,
        color: colors.dot,
      },
      line: {
        color: colors.line,
        width: 1,
      },
      radius: 250,
      length: 120,
    });
    constellationActiveRef.current = true;
  }, []);

  useEffect(() => {
    // Load plugin once
    if (!pluginLoadedRef.current) {
      pluginLoadedRef.current = true;
      import('../utils/starsPlugin.js')
        .then(() => {
          initConstellation();
        })
        .catch(console.error);
    }
  }, [initConstellation]);

  useEffect(() => {
    // Watch for theme changes via MutationObserver
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'data-theme'
        ) {
          // Re-init constellation with new colors
          if (pluginLoadedRef.current && window.$) {
            initConstellation();
          }
          break;
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, [initConstellation]);

  return createPortal(<canvas id="stars" ref={canvasRef} />, document.body);
};

export default StarsBackground;

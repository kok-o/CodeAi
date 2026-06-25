import React from 'react';
import { motion } from 'framer-motion';

const Skeleton = ({ width, height, borderRadius = '12px', style = {}, className = '' }) => {
  return (
    <div
      className={`skeleton-base ${className}`}
      style={{
        width: width || '100%',
        height: height || '20px',
        borderRadius,
        background: 'var(--overlay-bg)',
        position: 'relative',
        overflow: 'hidden',
        ...style
      }}
    >
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: 'linear'
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(90deg, transparent, var(--overlay-bg), transparent)',
        }}
      />
    </div>
  );
};

export const CardSkeleton = ({ height = '300px' }) => (
  <div style={{
    background: 'var(--overlay-bg)',
    border: '1px solid var(--overlay-bg)',
    borderRadius: '20px',
    padding: '24px',
    height,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  }}>
    <Skeleton height="140px" borderRadius="12px" />
    <Skeleton height="24px" width="80%" />
    <Skeleton height="16px" width="60%" />
    <div style={{ marginTop: 'auto' }}>
      <Skeleton height="40px" borderRadius="10px" />
    </div>
  </div>
);

export default Skeleton;

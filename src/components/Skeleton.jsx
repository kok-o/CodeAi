import React from 'react';

// ─── Base Shimmer Skeleton ────────────────────────────────────────────────────
const Skeleton = ({ width = '100%', height = '16px', radius = '8px', className = '', style = {} }) => (
  <div
    className={`skeleton ${className}`}
    style={{
      width,
      height,
      borderRadius: radius,
      flexShrink: 0,
      ...style,
    }}
  />
);

// ─── Text Skeleton ────────────────────────────────────────────────────────────
export const SkeletonText = ({ lines = 3, lastLineWidth = '60%' }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        height="14px"
        width={i === lines - 1 ? lastLineWidth : '100%'}
        radius="6px"
      />
    ))}
  </div>
);

// ─── Card Skeleton ────────────────────────────────────────────────────────────
export const SkeletonCard = ({ style = {} }) => (
  <div style={{
    padding: '24px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-xl)',
    display: 'flex', flexDirection: 'column', gap: '16px',
    ...style,
  }}>
    {/* Icon placeholder */}
    <Skeleton width="48px" height="48px" radius="14px" />
    {/* Title */}
    <Skeleton height="18px" width="55%" radius="8px" />
    {/* Description */}
    <SkeletonText lines={2} lastLineWidth="75%" />
  </div>
);

// ─── Stat Card Skeleton ───────────────────────────────────────────────────────
export const SkeletonStatCard = () => (
  <div style={{
    padding: '28px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-xl)',
    display: 'flex', flexDirection: 'column', gap: '14px',
  }}>
    <Skeleton width="48px" height="48px" radius="14px" />
    <Skeleton height="32px" width="50%" radius="8px" />
    <Skeleton height="14px" width="70%" radius="6px" />
    <Skeleton height="12px" width="40%" radius="6px" />
  </div>
);

// ─── List Item Skeleton ───────────────────────────────────────────────────────
export const SkeletonListItem = () => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '14px',
    padding: '14px 18px',
    background: 'var(--overlay-bg)',
    borderRadius: 'var(--radius-lg)',
  }}>
    <Skeleton width="44px" height="44px" radius="12px" style={{ flexShrink: 0 }} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <Skeleton height="14px" width="50%" radius="6px" />
      <Skeleton height="8px" width="80%" radius="4px" />
    </div>
  </div>
);

// ─── Avatar Skeleton ──────────────────────────────────────────────────────────
export const SkeletonAvatar = ({ size = 40 }) => (
  <Skeleton
    width={`${size}px`}
    height={`${size}px`}
    radius="50%"
    style={{ flexShrink: 0 }}
  />
);

// ─── Course Card Skeleton (used in Courses page) ──────────────────────────────
export const SkeletonCourseCard = () => (
  <div style={{
    background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-xl)',
    overflow: 'hidden',
  }}>
    {/* Thumbnail */}
    <Skeleton width="100%" height="180px" radius="0" />
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <Skeleton height="20px" width="75%" radius="6px" />
      <SkeletonText lines={2} lastLineWidth="60%" />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
        <Skeleton height="28px" width="80px" radius="20px" />
        <Skeleton height="28px" width="60px" radius="20px" />
      </div>
    </div>
  </div>
);

// ─── Page Header Skeleton ─────────────────────────────────────────────────────
export const SkeletonPageHeader = () => (
  <div style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
    <Skeleton height="36px" width="40%" radius="10px" />
    <Skeleton height="16px" width="60%" radius="6px" />
  </div>
);

// Default export — base skeleton
export default Skeleton;

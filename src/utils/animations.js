/**
 * Premium Animation Variants — Framer Motion
 * Shared across all components for consistent motion design.
 * Inspired by Vercel, Linear, Stripe, and Arc Browser.
 */

// ─── Spring Configs ────────────────────────────────────────────────────────────
export const spring = {
  type: 'spring',
  stiffness: 280,
  damping: 24,
};

export const springGentle = {
  type: 'spring',
  stiffness: 200,
  damping: 20,
};

export const springBouncy = {
  type: 'spring',
  stiffness: 320,
  damping: 18,
};

export const easeOut = {
  duration: 0.6,
  ease: [0.16, 1, 0.3, 1],
};

export const easeOutFast = {
  duration: 0.35,
  ease: [0.16, 1, 0.3, 1],
};

// ─── Entrance Variants ─────────────────────────────────────────────────────────
export const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: easeOut,
  },
};

export const fadeInDown = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: easeOut,
  },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.93 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: easeOut,
  },
};

export const scaleInBouncy = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springBouncy,
  },
};

export const slideInLeft = {
  hidden: { opacity: 0, x: -32 },
  visible: {
    opacity: 1,
    x: 0,
    transition: easeOut,
  },
};

export const slideInRight = {
  hidden: { opacity: 0, x: 32 },
  visible: {
    opacity: 1,
    x: 0,
    transition: easeOut,
  },
};

// ─── Stagger Containers ────────────────────────────────────────────────────────
export const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const staggerContainerFast = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

export const staggerContainerSlow = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.15,
    },
  },
};

// ─── Page Transitions ──────────────────────────────────────────────────────────
export const pageTransition = {
  initial: { opacity: 0, filter: 'blur(8px)', scale: 0.99 },
  animate: {
    opacity: 1,
    filter: 'blur(0px)',
    scale: 1,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    filter: 'blur(4px)',
    scale: 1.005,
    transition: { duration: 0.25, ease: 'easeIn' },
  },
};

// ─── Card Hover ────────────────────────────────────────────────────────────────
export const cardHover = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.025,
    y: -6,
    transition: spring,
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
};

export const cardHoverSubtle = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.015,
    y: -3,
    transition: springGentle,
  },
  tap: {
    scale: 0.99,
    transition: { duration: 0.1 },
  },
};

// ─── Button Hover ──────────────────────────────────────────────────────────────
export const buttonHover = {
  rest: { scale: 1 },
  hover: {
    scale: 1.03,
    transition: spring,
  },
  tap: {
    scale: 0.97,
    transition: { duration: 0.1 },
  },
};

// ─── Icon Hover ────────────────────────────────────────────────────────────────
export const iconHover = {
  rest: { rotate: 0, scale: 1 },
  hover: {
    rotate: 8,
    scale: 1.1,
    transition: spring,
  },
};

// ─── Floating (ambient) ────────────────────────────────────────────────────────
export const floatAnimation = (delay = 0, range = 12) => ({
  animate: {
    y: [0, -range, 0],
    transition: {
      duration: 5 + delay * 0.5,
      repeat: Infinity,
      repeatType: 'loop',
      ease: 'easeInOut',
      delay,
    },
  },
});

export const blobAnimation = (delay = 0) => ({
  animate: {
    scale: [1, 1.15, 1.05, 1],
    x: [0, 30, -20, 0],
    y: [0, -20, 10, 0],
    transition: {
      duration: 14 + delay,
      repeat: Infinity,
      repeatType: 'loop',
      ease: 'easeInOut',
      delay,
    },
  },
});

// ─── Reduced Motion (a11y) ─────────────────────────────────────────────────────
/**
 * Call this utility to get safe variants that respect prefers-reduced-motion.
 * Pass your normal variants; if reduced motion is preferred, returns instant variants.
 */
export const safePrefersReducedMotion = (variants) => {
  if (typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.01 } },
    };
  }
  return variants;
};

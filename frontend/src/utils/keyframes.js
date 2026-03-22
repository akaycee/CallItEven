/**
 * Shared MUI `sx`-compatible `@keyframes` definitions.
 *
 * Import the ones you need and spread them into the `sx` prop of the outermost
 * animated element.  MUI injects the keyframe only once per rule even when
 * multiple components reference the same name.
 *
 * Usage:
 *   import { KF_FADE_IN, KF_SLIDE_IN } from '../utils/keyframes';
 *
 *   <Box sx={{ animation: 'fadeIn 0.3s ease-in', ...KF_FADE_IN }}>
 */

/** Fade from invisible to visible */
export const KF_FADE_IN = {
  '@keyframes fadeIn': {
    from: { opacity: 0 },
    to:   { opacity: 1 },
  },
};

/** Slide in from the left with a rotation */
export const KF_SLIDE_IN = {
  '@keyframes slideIn': {
    from: { transform: 'translateX(-100vw) rotate(-20deg)' },
    to:   { transform: 'translateX(0) rotate(0deg)' },
  },
};

/** Bounce vertically while scaling up */
export const KF_BOUNCE = {
  '@keyframes bounce': {
    '0%, 100%': { transform: 'translateY(0) scale(1)' },
    '50%':      { transform: 'translateY(-20px) scale(1.1)' },
  },
};

/** Falling confetti piece */
export const KF_CONFETTI = {
  '@keyframes confetti': {
    '0%':   { transform: 'translateY(-100vh) rotate(0deg)',   opacity: 1 },
    '100%': { transform: 'translateY(100vh)  rotate(720deg)', opacity: 0 },
  },
};

/** Gentle left–right wiggle */
export const KF_WIGGLE = {
  '@keyframes wiggle': {
    '0%, 100%': { transform: 'rotate(-5deg)' },
    '50%':      { transform: 'rotate(5deg)' },
  },
};

/** Gentle vertical float */
export const KF_FLOAT = {
  '@keyframes float': {
    '0%, 100%': { transform: 'translateY(0px)' },
    '50%':      { transform: 'translateY(-20px)' },
  },
};

/** Float-in for tooltip / popover elements */
export const KF_FLOAT_IN = {
  '@keyframes floatIn': {
    from: { opacity: 0, transform: 'translateY(10px) scale(0.9)' },
    to:   { opacity: 1, transform: 'translateY(0) scale(1)' },
  },
};

/** Slow moving dot-grid background used on Login / Register */
export const KF_MOVE_BACKGROUND = {
  '@keyframes moveBackground': {
    '0%':   { transform: 'translate(0, 0)' },
    '100%': { transform: 'translate(50px, 50px)' },
  },
};

/** Slide-up dock reveal animation (BottomBar first visit) */
export const KF_DOCK_BOUNCE = {
  '@keyframes dockBounce': {
    '0%':   { transform: 'translateY(100%)' },
    '60%':  { transform: 'translateY(-8px)' },
    '100%': { transform: 'translateY(0)' },
  },
};

/** Pulsing opacity hint tooltip */
export const KF_HINT_PULSE = {
  '@keyframes hintPulse': {
    '0%, 100%': { opacity: 1 },
    '50%':      { opacity: 0.7 },
  },
};

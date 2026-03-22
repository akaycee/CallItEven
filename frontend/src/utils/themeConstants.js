/**
 * Centralised design-token constants for the CallItEven design system.
 *
 * Usage:
 *   import { GRADIENT_PURPLE_PINK, cardBg, gradientText } from '../utils/themeConstants';
 *
 *   // Solid gradient on a button
 *   sx={{ background: GRADIENT_PURPLE_PINK }}
 *
 *   // Adaptive card background (darker in dark mode)
 *   sx={{ background: cardBg.purplePink(theme.palette.mode) }}
 *
 *   // Clipped gradient text
 *   sx={{ ...gradientText(GRADIENT_EMERALD_TEAL), fontWeight: 800 }}
 */

// ─── Solid gradient strings ───────────────────────────────────────────────────

/** Purple → Pink  (#8b5cf6 → #ec4899) — primary action colour */
export const GRADIENT_PURPLE_PINK       = 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)';
/** Darker purple → pink for hover / pressed states */
export const GRADIENT_PURPLE_PINK_HOVER = 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)';

/** Emerald → Teal (#10b981 → #06b6d4) — income / budget colour */
export const GRADIENT_EMERALD_TEAL      = 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)';
/** Teal → Emerald (#06b6d4 → #10b981) — balance / summary colour */
export const GRADIENT_TEAL_EMERALD      = 'linear-gradient(135deg, #06b6d4 0%, #10b981 100%)';
/** Pressed/hover variant for emerald-teal */
export const GRADIENT_EMERALD_TEAL_HOVER = 'linear-gradient(135deg, #059669 0%, #0891b2 100%)';

/** Orange → Purple (#f97316 → #8b5cf6) — expense / activity colour */
export const GRADIENT_ORANGE_PURPLE      = 'linear-gradient(135deg, #f97316 0%, #8b5cf6 100%)';
/** Pressed/hover variant for orange-purple */
export const GRADIENT_ORANGE_PURPLE_HOVER = 'linear-gradient(135deg, #ea580c 0%, #7c3aed 100%)';

/** Orange → Teal (#f97316 → #06b6d4) — mixed context */
export const GRADIENT_ORANGE_TEAL       = 'linear-gradient(135deg, #f97316 0%, #06b6d4 100%)';

/** Orange → Red (#f97316 → #ef4444) — expense form header */
export const GRADIENT_ORANGE_RED        = 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)';

/** Purple → Teal (#8b5cf6 → #06b6d4) — cashflow / activity */
export const GRADIENT_PURPLE_TEAL       = 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)';

/** Emerald → Orange (#10b981 → #f97316) — sankey / cashflow */
export const GRADIENT_EMERALD_ORANGE    = 'linear-gradient(135deg, #10b981 0%, #f97316 100%)';

/** 3-stop cyan (#0891b2 → #06b6d4 → #14b8a6) — login / register / createExpense header */
export const GRADIENT_CYAN_TRIPLE       = 'linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #14b8a6 100%)';
/** Hover/darker 3-stop cyan */
export const GRADIENT_CYAN_TRIPLE_HOVER = 'linear-gradient(135deg, #0e7490 0%, #0891b2 50%, #0f766e 100%)';

/** Full rainbow (#8b5cf6 → #ec4899 → #f97316 → #06b6d4) — logo / AppBar */
export const GRADIENT_RAINBOW           = 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 30%, #f97316 60%, #06b6d4 100%)';

// ─── Translucent card-background helpers ─────────────────────────────────────
//
// Each function accepts the MUI palette mode string ('dark' | 'light') and
// returns the appropriate opacity variant.  Dark: 0.20, light: 0.15.
//
// Example:
//   background: cardBg.purplePink(theme.palette.mode)

export const cardBg = {
  purplePink:   (mode) => mode === 'dark'
    ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)'
    : 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(236, 72, 153, 0.15) 100%)',

  emeraldTeal:  (mode) => mode === 'dark'
    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)'
    : 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',

  tealEmerald:  (mode) => mode === 'dark'
    ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)'
    : 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%)',

  orangePurple: (mode) => mode === 'dark'
    ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)'
    : 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',

  orangeTeal:   (mode) => mode === 'dark'
    ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)'
    : 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',

  purpleTeal:   (mode) => mode === 'dark'
    ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)'
    : 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',

  emeraldOrange:(mode) => mode === 'dark'
    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(249, 115, 22, 0.2) 100%)'
    : 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(249, 115, 22, 0.15) 100%)',
};

// ─── Gradient text helper ─────────────────────────────────────────────────────
//
// Returns the three CSS properties needed to render a clipped gradient text.
// Spread into an `sx` prop:
//   sx={{ ...gradientText(GRADIENT_PURPLE_PINK), fontWeight: 800 }}

/**
 * @param {string} gradient - Any CSS gradient string (use the GRADIENT_* constants above)
 * @returns {{ background: string, WebkitBackgroundClip: string, WebkitTextFillColor: string }}
 */
export const gradientText = (gradient) => ({
  background: gradient,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
});

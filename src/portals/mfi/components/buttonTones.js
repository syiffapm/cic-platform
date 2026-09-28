/**
 * The shared "teal" and "success" button fills are too light for white text (WCAG AA 4.5:1).
 * In this portal they are always paired with these darker overrides.
 */
export const STRONG = {
  teal: '!bg-teal-700 hover:!bg-teal-800',
  success: '!bg-emerald-700 hover:!bg-emerald-800',
};
export const strong = (variant) => STRONG[variant];

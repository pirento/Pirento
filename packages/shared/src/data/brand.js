/**
 * Colours from the Pirento Ecosystem Consolidated Brand Guidelines, edition 1.0
 * (Appendix A, canonical colour register). These HEX values are the digital
 * source of truth: never sample a colour from a screenshot or an older deck.
 *
 * Roles (section 6):
 *   dark   – primary text, navigation, dark fields and footers
 *   accent – calls to action, selected states, key data, product recognition
 *   white  – content surfaces and text on dark fields
 */

/** The Pirento masterbrand: ecosystem pages, the shared account, admin. */
export const BRAND = {
  dark: '#1B2A33',
  accent: '#E40E2A', // master red: masterbrand emphasis, not a general error colour
  white: '#FFFFFF',
  neutral: '#D6D6D6', // borders, dividers, quiet backgrounds
  subtle: '#F4F6F7', // grouped content and panels (interface token "surface-subtle")
};

/** One dark and one accent per product; `support` colours are for illustration only. */
export const PRODUCT_COLOURS = {
  legal: {dark: '#132B47', accent: '#1D84FF', support: ['#0F2235']},
  black: {dark: '#001C54', accent: '#0E6BA8', support: ['#1B2A33']},
  green: {dark: '#111626', accent: '#0ADB94', support: ['#1B2A33']},
  intern: {dark: '#013642', accent: '#48C9CE', support: ['#1B2A33']},
  ai: {dark: '#000000', accent: '#E71AFF', support: ['#FFB822', '#FF75BE', '#2A96DF']},
  vault: {dark: '#120D31', accent: '#7E46E8', support: ['#1A181B']},
  one: {dark: '#111626', accent: '#F95638', support: ['#51211D']},
  capital: {dark: '#232230', accent: '#DBAC72', support: ['#A16F35']},
  'bharat-id': {dark: '#021F2D', accent: '#F1C700', support: ['#1B2A33']},
  giftox: {dark: '#1E1216', accent: '#FF1066', support: ['#1B2A33']},
};

/**
 * Pirento Foundation's own colours, from its live site as the owner gave them (not in the guidelines' register):
 * a deep blue field, a bright yellow for the one key action, cream text and surfaces, and a soft blue for body
 * text on the blue.
 */
export const FOUNDATION_COLOURS = {
  dark: '#06518A',
  accent: '#F6E501',
  cream: '#FFEFD5',
  soft: '#B9D3EC',
};

// WCAG 2 relative luminance and contrast ratio.
const luminance = (hex) => {
  const channel = (i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
};

export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Text colour for a button or highlight on `accent`. The guidelines say bright
 * accents carry dark text and contrast must be measured: so we try the brand's
 * own dark first, then white, then black, and take the first that reaches 4.5:1.
 */
export function textOn(accent, dark = BRAND.dark) {
  return [dark, '#FFFFFF', '#000000'].find((c) => contrast(accent, c) >= 4.5) ?? '#000000';
}

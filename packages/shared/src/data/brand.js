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
/** The company behind Pirento, as registered: printed on invoices and receipts. */
export const COMPANY = {
  legalName: 'Venturecore Solutions Private Limited',
  cin: 'U63121UP2023PTC188021',
  gstin: '09AAJCV6240P1ZL',
  supportEmail: 'support@pirento.com',
};

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
 * The big brand panels on the Pirento home, each in its own colours as the owner gave them from its live app or site
 * (not in the guidelines' register): the panel's field, its text, its quieter text, the one key action and the text on
 * it, and the colour of the heading's last line.
 *   foundation – Pirento Foundation's site: deep blue, yellow, cream
 *   blank      – Pirento Blank, the trading app: warm paper, slate, its green
 *   inv        – Pirento INV, the group's billing app: teal, cream, rust
 */
export const PANEL_COLOURS = {
  foundation: {
    paper: '#06518A',
    ink: '#FFEFD5',
    muted: '#B9D3EC',
    accent: '#F6E501',
    onAccent: '#06518A',
    highlight: '#F6E501',
  },
  blank: {
    paper: '#FAF7F2',
    ink: '#2E3336',
    muted: '#606463',
    accent: '#446E47',
    onAccent: '#FAF7F2',
    highlight: '#446E47',
  },
  inv: {
    paper: '#0E4D64',
    ink: '#F4EBE5',
    muted: '#C9D3D5',
    accent: '#BB4B2C',
    onAccent: '#FFFFFF',
    highlight: '#E0AD9F',
  },
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

// Design tokens — mirrors `colors_and_type.css` from the design package.
// Four lanes of money: CC (red) · DMP (amber) · Savings (green) · Equity (blue).
// Ink + paper are the neutrals. Flat by design (hairline borders, no shadow).

export const colors = {
  ink: '#0d1b2a',
  paper: '#f7f4ee',
  white: '#ffffff',
  gold: '#b8860a',

  cc: '#c0392b',
  ccSoft: '#fef2f2',
  ccBorder: '#fca5a5',

  dmp: '#92660a',
  dmpSoft: '#fefce8',
  dmpBorder: '#fcd34d',

  savings: '#166534',
  savingsSoft: '#e8f4ec',
  savingsBorder: '#86efac',

  equity: '#1e40af',
  equitySoft: '#eff6ff',
  equityBorder: '#93c5fd',

  muted: '#888888',
  line: '#e8e8e8',
  lineSoft: '#f0f0f0',
};

// Rotating palette so each debt / goal gets a stable lane colour.
export const LANE_PALETTE = [
  { solid: colors.cc, soft: colors.ccSoft, border: colors.ccBorder },
  { solid: colors.dmp, soft: colors.dmpSoft, border: colors.dmpBorder },
  { solid: colors.equity, soft: colors.equitySoft, border: colors.equityBorder },
  { solid: '#7a2e8a', soft: '#faf0fc', border: '#e0a8ec' },
  { solid: '#0f766e', soft: '#effcfa', border: '#7fded3' },
  { solid: '#b45309', soft: '#fff6ec', border: '#fbcd8f' },
];
export const laneFor = (i) => {
  const len = LANE_PALETTE.length;
  return LANE_PALETTE[((i % len) + len) % len];
};

export const phaseColor = (phase) =>
  phase === 1 ? colors.cc : phase === 2 ? colors.dmp : colors.equity;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const radius = { sm: 6, md: 10, lg: 16, pill: 999 };

// RN can't load web fonts at runtime without expo-font; we fall back to the
// platform serif/sans for now. Newsreader/Manrope/JetBrains Mono can be
// loaded via expo-font in a follow-up pass.
const SERIF = 'Georgia';
const MONO = 'Menlo';

export const fonts = {
  display: SERIF,
  sans: undefined, // platform default
  mono: MONO,
};

export const type = {
  display: {
    fontFamily: SERIF,
    fontSize: 40,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.4,
  },
  h1: {
    fontFamily: SERIF,
    fontSize: 28,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.15,
  },
  h2: { fontSize: 20, fontWeight: '700', color: colors.ink },
  money: {
    fontFamily: SERIF,
    fontSize: 22,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.2,
  },
  body: { fontSize: 14, color: colors.ink, lineHeight: 21 },
  meta: { fontSize: 12, color: colors.muted },
  mini: { fontSize: 11, color: colors.muted },
  // The kicker — small uppercase eyebrow above every screen title.
  kicker: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.muted,
  },
};

export const gbp = (n) =>
  '£' + Math.round(Number(n) || 0).toLocaleString('en-GB');

// Turn a 1-based month index from "now" into a friendly date label.
export const monthLabel = (monthIndex, fromDate = new Date()) => {
  const d = new Date(fromDate.getFullYear(), fromDate.getMonth() + monthIndex, 1);
  return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
};

export const yearsMonths = (n) => {
  if (!n) return '—';
  const y = Math.floor(n / 12);
  const mo = n % 12;
  if (y === 0) return `${mo} mo`;
  if (mo === 0) return `${y} yr`;
  return `${y} yr ${mo} mo`;
};

// Days from today until the start of (now + monthIndex). Used by the
// countdown hero. Returns 0 if month is in the past.
export const daysUntil = (monthIndex, fromDate = new Date()) => {
  if (!monthIndex || monthIndex <= 0) return 0;
  const target = new Date(fromDate.getFullYear(), fromDate.getMonth() + monthIndex, 1);
  const diffMs = target.getTime() - fromDate.getTime();
  return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
};

export const yearsMonthsLong = (n) => {
  if (!n) return '—';
  const y = Math.floor(n / 12);
  const mo = n % 12;
  const yr = y ? `${y} year${y === 1 ? '' : 's'}` : '';
  const m = mo ? `${mo} month${mo === 1 ? '' : 's'}` : '';
  return [yr, m].filter(Boolean).join(' ') || '0 months';
};

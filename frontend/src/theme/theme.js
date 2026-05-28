// Design tokens — mirrors the colour language of the printed sheets so the
// app and the board on the wall feel like one system.

export const colors = {
  ink: '#0d1b2a',
  paper: '#f7f4ee',
  white: '#ffffff',
  gold: '#b8860a',

  cc: '#c0392b', // credit cards (red)
  ccSoft: '#fef2f2',
  ccBorder: '#fca5a5',

  dmp: '#92660a', // debt management plan (amber)
  dmpSoft: '#fefce8',
  dmpBorder: '#fcd34d',

  savings: '#166534', // savings (green)
  savingsSoft: '#e8f4ec',
  savingsBorder: '#86efac',

  equity: '#1e40af', // equity (blue)
  equitySoft: '#eff6ff',
  equityBorder: '#93c5fd',

  muted: '#888888',
  line: '#e8e8e8',
  lineSoft: '#f0f0f0',
};

export const phaseColor = (phase) =>
  phase === 1 ? colors.cc : phase === 2 ? colors.dmp : colors.equity;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

export const radius = { sm: 6, md: 10, lg: 16, pill: 999 };

export const type = {
  h1: { fontSize: 28, fontWeight: '800', color: colors.ink },
  h2: { fontSize: 20, fontWeight: '700', color: colors.ink },
  label: {
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.muted,
    fontWeight: '600',
  },
  body: { fontSize: 14, color: colors.ink },
  money: { fontSize: 22, fontWeight: '800' },
};

export const gbp = (n) =>
  '£' + Math.round(Number(n) || 0).toLocaleString('en-GB');

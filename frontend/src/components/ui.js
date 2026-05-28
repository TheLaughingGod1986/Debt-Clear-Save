import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, type, gbp } from '../theme/theme';

// --------------------------------------------------------------------------- //
// Section heading with a hairline rule
// --------------------------------------------------------------------------- //
export function SectionHead({ children }) {
  return (
    <View style={s.sectionHead}>
      <Text style={type.label}>{children}</Text>
      <View style={s.hairline} />
    </View>
  );
}

// --------------------------------------------------------------------------- //
// A single key figure in a bordered card
// --------------------------------------------------------------------------- //
export function StatCard({ label, value, sub, color, border, bg }) {
  return (
    <View style={[s.stat, border && { borderColor: border }, bg && { backgroundColor: bg }]}>
      <Text style={type.label}>{label}</Text>
      <Text style={[s.statValue, color && { color }]}>{value}</Text>
      {sub ? <Text style={s.statSub}>{sub}</Text> : null}
    </View>
  );
}

// --------------------------------------------------------------------------- //
// Progress ring (pure SVG-free: two stacked circles via borders is fiddly, so
// we use a simple horizontal bar that reads clearly at a glance)
// --------------------------------------------------------------------------- //
export function ProgressBar({ pct, label }) {
  const clamped = Math.max(0, Math.min(100, pct || 0));
  return (
    <View style={{ width: '100%' }}>
      <View style={s.barTrack}>
        <View style={[s.barFill, { width: `${clamped}%` }]} />
      </View>
      {label ? <Text style={s.barLabel}>{label}</Text> : null}
    </View>
  );
}

// --------------------------------------------------------------------------- //
// Phase summary card
// --------------------------------------------------------------------------- //
export function PhaseCard({ accent, label, title, rows, goal, goalBg, goalColor }) {
  return (
    <View style={[s.phase, { borderTopColor: accent, borderTopWidth: 4 }]}>
      <Text style={[type.label, { color: accent }]}>{label}</Text>
      <Text style={s.phaseTitle}>{title}</Text>
      <View style={s.phaseCells}>
        {rows.map((r) => (
          <View key={r.k} style={s.phaseCell}>
            <Text style={s.phaseCellK}>{r.k}</Text>
            <Text style={[s.phaseCellV, r.color && { color: r.color }]}>{r.v}</Text>
          </View>
        ))}
      </View>
      <View style={[s.goalPill, { backgroundColor: goalBg }]}>
        <Text style={[s.goalText, { color: goalColor }]}>{goal}</Text>
      </View>
    </View>
  );
}

// --------------------------------------------------------------------------- //
// Vertical milestone timeline
// --------------------------------------------------------------------------- //
export function MilestoneTimeline({ items }) {
  return (
    <View>
      {items.map((it, idx) => (
        <View key={idx} style={s.msRow}>
          <View style={s.msRail}>
            <View style={[s.msDot, { borderColor: it.color }, it.filled && { backgroundColor: it.color }]}>
              <Text style={[s.msDotText, { color: it.filled ? colors.white : it.color }]}>{it.dot}</Text>
            </View>
            {idx < items.length - 1 && <View style={s.msConn} />}
          </View>
          <View style={s.msBody}>
            <Text style={[s.msTitle, it.color && { color: it.color }]}>{it.title}</Text>
            <Text style={s.msSub}>{it.sub}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  sectionHead: { marginTop: spacing.lg, marginBottom: spacing.md },
  hairline: { height: 1, backgroundColor: colors.line, marginTop: 6 },

  stat: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  statValue: { fontFamily: undefined, fontSize: 22, fontWeight: '800', color: colors.ink, marginTop: 2 },
  statSub: { fontSize: 11, color: colors.muted, marginTop: 2 },

  barTrack: { height: 10, borderRadius: radius.pill, backgroundColor: colors.lineSoft, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.ink },
  barLabel: { fontSize: 11, color: colors.muted, marginTop: 6 },

  phase: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  phaseTitle: { fontSize: 16, fontWeight: '700', color: colors.ink, marginVertical: 6 },
  phaseCells: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  phaseCell: { width: '47%', backgroundColor: colors.paper, borderRadius: radius.sm, paddingVertical: 6, alignItems: 'center' },
  phaseCellK: { fontSize: 8, letterSpacing: 1, textTransform: 'uppercase', color: colors.muted },
  phaseCellV: { fontSize: 13, fontWeight: '700', color: colors.ink, marginTop: 1 },
  goalPill: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: radius.sm },
  goalText: { fontSize: 11, fontWeight: '700', textAlign: 'center' },

  msRow: { flexDirection: 'row', gap: spacing.md },
  msRail: { alignItems: 'center', width: 36 },
  msDot: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 2.5,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white,
  },
  msDotText: { fontSize: 11, fontWeight: '800' },
  msConn: { width: 2.5, flex: 1, minHeight: 22, backgroundColor: colors.line },
  msBody: { paddingBottom: spacing.md, paddingTop: 4, flex: 1 },
  msTitle: { fontSize: 13, fontWeight: '700', color: colors.ink },
  msSub: { fontSize: 11, color: colors.muted, marginTop: 2, lineHeight: 16 },
});

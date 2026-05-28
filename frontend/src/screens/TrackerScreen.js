import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator,
} from 'react-native';
import { colors, spacing, radius, gbp } from '../theme/theme';

const MILESTONE_BADGE = {
  cc_cleared: { text: 'CC CLEARED ✓', bg: colors.ccSoft, color: colors.cc },
  dmp_cleared: { text: 'DMP CLEARED ✓', bg: colors.dmpSoft, color: colors.dmp },
  target_hit: { text: 'TARGET ✓', bg: colors.equitySoft, color: colors.equity },
};

function MonthCard({ row, onToggle, busy }) {
  const badge = row.milestone ? MILESTONE_BADGE[row.milestone] : null;
  return (
    <View style={[s.card, row.done && s.cardDone]}>
      <View style={s.cardHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
          <Text style={s.month}>Month {row.month}</Text>
          {badge && (
            <View style={[s.badge, { backgroundColor: badge.bg }]}>
              <Text style={[s.badgeText, { color: badge.color }]}>{badge.text}</Text>
            </View>
          )}
        </View>
        <Pressable
          onPress={() => onToggle(row)}
          hitSlop={10}
          disabled={busy}
          style={[s.checkbox, row.done && s.checkboxOn]}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: row.done }}
          accessibilityLabel={`Mark month ${row.month} ${row.done ? 'not done' : 'done'}`}
        >
          {row.done && <Text style={s.check}>✓</Text>}
        </Pressable>
      </View>

      <View style={s.figs}>
        <Fig label="CC pay" value={row.cc_payment ? gbp(row.cc_payment) : '—'} color={row.cc_payment ? colors.cc : colors.muted} />
        <Fig label="DMP pay" value={row.dmp_payment ? gbp(row.dmp_payment) : '—'} color={row.dmp_payment ? colors.dmp : colors.muted} />
        <Fig label="Save" value={gbp(row.savings_added)} color={colors.savings} bold={row.milestone === 'dmp_cleared'} />
      </View>
      <View style={s.figs}>
        <Fig label="DMP left" value={gbp(row.dmp_left)} color={row.dmp_left ? colors.dmp : colors.muted} />
        <Fig label="Total saved" value={gbp(row.total_saved)} color={colors.savings} />
        <Fig label="Total position" value={gbp(row.total_position)} color={colors.ink} bold />
      </View>
    </View>
  );
}

function Fig({ label, value, color, bold }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={s.figLabel}>{label}</Text>
      <Text style={[s.figValue, color && { color }, bold && { fontWeight: '800' }]}>{value}</Text>
    </View>
  );
}

export default function TrackerScreen({ projection, loading, onToggleMonth }) {
  const [busyMonth, setBusyMonth] = useState(null);

  if (loading && !projection) {
    return <View style={s.center}><ActivityIndicator size="large" color={colors.ink} /></View>;
  }
  if (!projection) {
    return <View style={s.center}><Text style={{ color: colors.muted }}>No plan loaded.</Text></View>;
  }

  const { rows, summary } = projection;

  const handleToggle = async (row) => {
    setBusyMonth(row.month);
    try {
      await onToggleMonth(row.month, !row.done);
    } finally {
      setBusyMonth(null);
    }
  };

  return (
    <ScrollView style={s.screen} contentContainerStyle={{ padding: spacing.lg, paddingBottom: 48 }}>
      <Text style={s.kicker}>Monthly tracking</Text>
      <Text style={s.title}>Tracker</Text>
      <Text style={s.sub}>
        {summary.months_done} of {summary.final_month} months done.
        {summary.next_action_month ? ` Next: Month ${summary.next_action_month}.` : ' Complete! 🎉'}
      </Text>

      {rows.map((row) => (
        <MonthCard key={row.month} row={row} onToggle={handleToggle} busy={busyMonth === row.month} />
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper },
  kicker: { fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: colors.muted, marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink },
  sub: { fontSize: 13, color: colors.muted, marginBottom: spacing.md, marginTop: 2 },

  card: {
    backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1.5,
    borderColor: colors.line, padding: spacing.md, marginBottom: spacing.sm,
  },
  cardDone: { borderColor: colors.savingsBorder, backgroundColor: colors.savingsSoft },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  month: { fontSize: 17, fontWeight: '800', color: colors.ink },
  badge: { paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4 },
  badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },

  checkbox: {
    width: 28, height: 28, borderRadius: radius.sm, borderWidth: 2.5,
    borderColor: colors.ink, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.white,
  },
  checkboxOn: { backgroundColor: colors.savings, borderColor: colors.savings },
  check: { color: colors.white, fontSize: 16, fontWeight: '900', lineHeight: 18 },

  figs: { flexDirection: 'row', gap: spacing.sm, marginTop: 6 },
  figLabel: { fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: colors.muted },
  figValue: { fontSize: 14, fontWeight: '600', color: colors.ink, marginTop: 1 },
});

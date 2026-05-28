import React from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { colors, spacing, radius, gbp } from '../theme/theme';
import { SectionHead, StatCard, PhaseCard, MilestoneTimeline, ProgressBar } from '../components/ui';

export default function OverviewScreen({ projection, loading, onRefresh }) {
  if (loading && !projection) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.ink} />
      </View>
    );
  }
  if (!projection) {
    return (
      <View style={s.center}>
        <Text style={{ color: colors.muted }}>No plan loaded.</Text>
      </View>
    );
  }

  const { plan, summary } = projection;

  const milestones = [
    {
      dot: 'NOW', filled: true, color: colors.ink,
      title: 'Start · Month 0',
      sub: `CC ${gbp(plan.credit_card)} · DMP ${gbp(plan.dmp_balance)} · Equity ${gbp(plan.equity)}`,
    },
    {
      dot: String(summary.cc_cleared_month ?? '—'), color: colors.cc,
      title: 'Credit cards cleared',
      sub: 'Freed money redirected the same month — no leak.',
    },
    {
      dot: String(summary.dmp_cleared_month ?? '—'), color: colors.dmp,
      title: 'DMP cleared — fully debt free',
      sub: 'Final payment is tiny, so that month saves big. Then everything to savings.',
    },
    {
      dot: String(summary.target_hit_month ?? '—'), color: colors.equity,
      title: 'Buy window opens',
      sub: `${gbp(summary.final_total_position)} total position. Deposit ready.`,
    },
  ];

  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: 48 }}
      refreshControl={<RefreshControl refreshing={!!loading} onRefresh={onRefresh} tintColor={colors.ink} />}
    >
      <Text style={s.kicker}>Your {summary.final_month}-month plan</Text>
      <Text style={s.title}>Road to Debt Freedom</Text>

      {/* Live progress */}
      <View style={s.progressCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={s.progressLabel}>Progress</Text>
          <Text style={s.progressPct}>{summary.pct_complete}%</Text>
        </View>
        <ProgressBar pct={summary.pct_complete} label={
          summary.next_action_month
            ? `${summary.months_done} of ${summary.final_month} months done · next up: Month ${summary.next_action_month}`
            : `All ${summary.final_month} months complete 🎉`
        } />
      </View>

      <SectionHead>Starting position</SectionHead>
      <View style={s.grid}>
        <StatCard label="Credit cards" value={gbp(plan.credit_card)} sub={`Clears M${summary.cc_cleared_month}`} color={colors.cc} border={colors.ccBorder} />
        <StatCard label="DMP balance" value={gbp(plan.dmp_balance)} sub={`Clears M${summary.dmp_cleared_month}`} color={colors.dmp} border={colors.dmpBorder} />
      </View>
      <View style={s.grid}>
        <StatCard label="Home equity" value={gbp(plan.equity)} sub={`+${gbp(plan.equity_growth)}/mo`} color={colors.savings} border={colors.savingsBorder} />
        <StatCard label={`Target · M${summary.target_hit_month}`} value={gbp(plan.savings_target)} sub="Total position" color={colors.equity} border={colors.equityBorder} bg={colors.equitySoft} />
      </View>

      <SectionHead>Three phases · {gbp(plan.monthly_budget)}/mo every month</SectionHead>
      <PhaseCard
        accent={colors.cc} label={`Phase 1 · M1–${(summary.cc_cleared_month ?? 1) - 1}`}
        title="Smash the credit card"
        rows={[
          { k: 'CC', v: gbp(plan.p1_cc_payment), color: colors.cc },
          { k: 'DMP', v: gbp(plan.p1_dmp_payment) },
          { k: 'Save', v: gbp(plan.p1_savings) },
          { k: 'Total', v: gbp(plan.monthly_budget) },
        ]}
        goal="Goal: Credit cards = £0" goalBg={colors.ccSoft} goalColor={colors.cc}
      />
      <View style={{ height: spacing.sm }} />
      <PhaseCard
        accent={colors.dmp} label={`Phase 2 · M${summary.cc_cleared_month}–${summary.dmp_cleared_month}`}
        title="Destroy the DMP"
        rows={[
          { k: 'CC', v: '£0', color: colors.muted },
          { k: 'DMP', v: gbp(plan.p2_dmp_payment), color: colors.dmp },
          { k: 'Save', v: `${gbp(plan.p1_savings)}–${gbp(plan.p2_savings)}` },
          { k: 'Total', v: gbp(plan.monthly_budget) },
        ]}
        goal={`Debt free Month ${summary.dmp_cleared_month}`} goalBg={colors.dmpSoft} goalColor={colors.dmp}
      />
      <View style={{ height: spacing.sm }} />
      <PhaseCard
        accent={colors.equity} label={`Phase 3 · M${(summary.dmp_cleared_month ?? 0) + 1}–${summary.target_hit_month}`}
        title="Rocket the savings"
        rows={[
          { k: 'CC', v: '£0', color: colors.muted },
          { k: 'DMP', v: '£0', color: colors.muted },
          { k: 'Save', v: gbp(plan.monthly_budget), color: colors.equity },
          { k: 'Total', v: gbp(plan.monthly_budget) },
        ]}
        goal={`Goal: ${gbp(plan.savings_target)} total position`} goalBg={colors.equitySoft} goalColor={colors.equity}
      />

      <SectionHead>Milestone timeline</SectionHead>
      <MilestoneTimeline items={milestones} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper },
  kicker: { fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: colors.muted, marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink, marginBottom: spacing.md },
  progressCard: { backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.line, padding: spacing.md },
  progressLabel: { fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.muted, fontWeight: '600' },
  progressPct: { fontSize: 16, fontWeight: '800', color: colors.ink },
  grid: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
});

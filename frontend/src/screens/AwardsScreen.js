// AwardsScreen.js — achievements grid. Subset of intel.jsx's awards view.

import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { colors, type, radius, fonts, gbp, monthLabel } from '../theme/theme';
import { Kicker, ScreenTitle, SectionHead } from '../components/ui';

function deriveAwards(projection) {
  const s = projection.summary;
  const rows = projection.rows;
  const firstDebt = [...projection.debts]
    .filter((d) => d.clearedMonth)
    .sort((a, b) => a.clearedMonth - b.clearedMonth)[0];
  const tenkMonth = (rows.find((r) => r.savingsTotal >= 10000) || {}).month || null;
  return [
    { icon: '🔓', label: 'First debt cleared', month: firstDebt?.clearedMonth || null, rel: 'Your first major win' },
    { icon: '🏆', label: 'Debt free', month: s.debt_free_month, rel: 'Every payment becomes wealth' },
    { icon: '📈', label: 'Net worth positive', month: s.net_positive_month, rel: 'You own more than you owe' },
    { icon: '💷', label: '£10k saved', month: tenkMonth, rel: 'Real wealth, building fast' },
    { icon: '🎯', label: 'All goals met', month: s.all_goals_met_month, rel: 'The whole journey, done' },
  ].filter((a) => a.month);
}

function AwardCard({ award, earned }) {
  return (
    <View
      style={{
        width: '48%',
        margin: '1%',
        backgroundColor: earned ? colors.ink : colors.white,
        borderWidth: 1.5,
        borderColor: earned ? colors.ink : colors.line,
        borderRadius: 12,
        padding: 13,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 22, opacity: earned ? 1 : 0.45 }}>{award.icon}</Text>
        <Text
          style={{
            fontSize: 9,
            fontWeight: '800',
            letterSpacing: 0.6,
            textTransform: 'uppercase',
            color: earned ? 'rgba(255,255,255,0.6)' : colors.gold,
          }}
        >
          {earned ? 'Unlocked' : 'Locked'}
        </Text>
      </View>
      <Text
        style={{
          fontSize: 13,
          fontWeight: '800',
          marginTop: 9,
          lineHeight: 16,
          color: earned ? colors.white : colors.ink,
        }}
      >
        {award.label}
      </Text>
      <Text
        style={{
          fontSize: 10.5,
          fontWeight: '700',
          marginTop: 3,
          color: earned ? 'rgba(255,255,255,0.7)' : colors.savings,
        }}
      >
        {earned ? `Unlocked ${monthLabel(award.month)}` : `Unlocks ${monthLabel(award.month)}`}
      </Text>
      <Text
        style={{
          fontSize: 10.5,
          marginTop: 5,
          lineHeight: 14,
          color: earned ? 'rgba(255,255,255,0.55)' : colors.muted,
        }}
      >
        {award.rel}
      </Text>
    </View>
  );
}

export function AwardsScreen({ projection }) {
  const awards = deriveAwards(projection);
  const md = projection.summary.months_done;
  const earned = awards.filter((a) => md >= a.month);
  const locked = awards.filter((a) => md < a.month);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.paper }}
      contentContainerStyle={{ padding: 24, paddingBottom: 96 }}
    >
      <Kicker>Your milestones</Kicker>
      <ScreenTitle>Awards</ScreenTitle>

      <View
        style={{
          backgroundColor: colors.ink,
          borderRadius: 14,
          padding: 18,
          marginBottom: 8,
        }}
      >
        <Text
          style={{
            color: 'rgba(255,255,255,0.55)',
            fontSize: 9.5,
            fontWeight: '800',
            letterSpacing: 1.8,
            textTransform: 'uppercase',
          }}
        >
          Awards earned
        </Text>
        <Text
          style={{
            color: colors.white,
            fontFamily: fonts.display,
            fontSize: 42,
            fontWeight: '800',
            marginTop: 6,
            letterSpacing: -0.6,
          }}
        >
          {earned.length}
          <Text style={{ fontSize: 22, color: 'rgba(255,255,255,0.5)' }}> / {awards.length}</Text>
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.78)', fontSize: 13, marginTop: 6 }}>
          {locked.length > 0
            ? `${locked.length} still to unlock — keep ticking those months.`
            : `Every award unlocked. Incredible.`}
        </Text>
      </View>

      <SectionHead right={`${earned.length} earned`}>Unlocked</SectionHead>
      {earned.length === 0 ? (
        <View
          style={{
            backgroundColor: colors.white,
            borderWidth: 1.5,
            borderColor: colors.line,
            borderRadius: radius.md,
            padding: 18,
          }}
        >
          <Text style={{ color: colors.muted, fontSize: 13 }}>
            None yet — start ticking months on the Tracker to unlock your first.
          </Text>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
          {earned.map((a) => (
            <AwardCard key={a.label} award={a} earned />
          ))}
        </View>
      )}

      {locked.length > 0 ? (
        <>
          <SectionHead right={`${locked.length} to go`}>Locked</SectionHead>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
            {locked.map((a) => (
              <AwardCard key={a.label} award={a} earned={false} />
            ))}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

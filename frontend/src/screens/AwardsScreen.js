// AwardsScreen.js — Level progression + achievement badges.
// Level derives from total debt cleared (as a % of starting debt).
//
//  L1 Getting Started  0–5%
//  L2 Momentum        5–25%
//  L3 Focused        25–50%
//  L4 Debt Destroyer 50–99%
//  L5 Debt Freedom   100% (debt-free)

import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { colors, type, radius, fonts, gbp, monthLabel } from '../theme/theme';
import { Kicker, ScreenTitle, SectionHead, GrowBar } from '../components/ui';

const LEVELS = [
  { n: 1, name: 'Getting Started', min: 0,   icon: '🌱', blurb: 'Every journey begins with a plan.' },
  { n: 2, name: 'Momentum',        min: 5,   icon: '🚀', blurb: 'You\'re proving it to yourself.' },
  { n: 3, name: 'Focused',         min: 25,  icon: '🎯', blurb: 'Strategy is paying off.' },
  { n: 4, name: 'Debt Destroyer',  min: 50,  icon: '🔥', blurb: 'Halfway home — unstoppable.' },
  { n: 5, name: 'Debt Freedom',    min: 100, icon: '🏆', blurb: 'You did it. Pure freedom.' },
];

function deriveProgress(projection) {
  const s = projection.summary;
  const md = s.months_done;
  const start = s.start_debt;
  // No starting debt = no journey to score. Pin to L1 so the user sees
  // the level rail without a misleading "100% Debt Freedom" badge.
  if (start <= 0) return { pct: 0, debtCleared: 0, noDebt: true };
  const at = md > 0 ? projection.rows[Math.min(md, projection.rows.length) - 1] : null;
  const debtCleared = at ? Math.max(0, start - at.debtLeft) : 0;
  const pct = Math.min(100, Math.round((debtCleared / start) * 100));
  return { pct, debtCleared };
}

function levelFor(pct) {
  let current = LEVELS[0];
  for (const l of LEVELS) if (pct >= l.min) current = l;
  const next = LEVELS.find((l) => l.n === current.n + 1) || null;
  return { current, next };
}

function CurrentLevelCard({ progress }) {
  const { current, next } = levelFor(progress.pct);
  const nextMin = next ? next.min : 100;
  const toNextPct = next ? Math.min(100, Math.round(((progress.pct - current.min) / (nextMin - current.min)) * 100)) : 100;
  return (
    <View style={{ backgroundColor: colors.ink, borderRadius: 18, padding: 22 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderWidth: 2,
            borderColor: colors.gold,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 30 }}>{current.icon}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text
            style={{
              color: colors.gold,
              fontSize: 10,
              fontWeight: '800',
              letterSpacing: 1.8,
              textTransform: 'uppercase',
            }}
          >
            Level {current.n} of 5
          </Text>
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: 24,
              fontWeight: '800',
              color: colors.white,
              marginTop: 2,
              letterSpacing: -0.3,
            }}
          >
            {current.name}
          </Text>
        </View>
      </View>
      <Text style={{ color: 'rgba(255,255,255,0.78)', fontSize: 13, marginTop: 12, lineHeight: 19 }}>
        {current.blurb}
      </Text>

      {next ? (
        <View
          style={{
            marginTop: 18,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.12)',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: 8,
            }}
          >
            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '700' }}>
              Next: {next.icon} {next.name}
            </Text>
            <Text style={{ color: colors.savingsBorder, fontSize: 12, fontWeight: '800' }}>
              {toNextPct}%
            </Text>
          </View>
          <GrowBar pct={toNextPct} color={colors.savingsBorder} track="rgba(255,255,255,0.14)" height={8} />
          <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 8 }}>
            Clear {Math.max(0, next.min - progress.pct)}% more debt to level up.
          </Text>
        </View>
      ) : (
        <View
          style={{
            marginTop: 18,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.12)',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: colors.gold, fontSize: 14, fontWeight: '800' }}>
            👑 Max level reached
          </Text>
        </View>
      )}
    </View>
  );
}

function LevelRail({ progress }) {
  return (
    <View
      style={{
        backgroundColor: colors.white,
        borderWidth: 1.5,
        borderColor: colors.line,
        borderRadius: radius.md,
        padding: 14,
      }}
    >
      {LEVELS.map((l, i) => {
        const earned = progress.pct >= l.min;
        const current = !earned && (LEVELS[i - 1] ? progress.pct >= LEVELS[i - 1].min : true);
        return (
          <View
            key={l.n}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 8,
              borderTopWidth: i > 0 ? 1 : 0,
              borderTopColor: colors.lineSoft,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: earned ? colors.savings : current ? colors.gold : colors.lineSoft,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Text style={{ fontSize: 18, opacity: earned || current ? 1 : 0.4 }}>{l.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '800',
                  color: earned || current ? colors.ink : colors.muted,
                }}
              >
                Level {l.n} · {l.name}
              </Text>
              <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
                {l.min === 0 ? 'Plan created' : `${l.min}% of debt cleared`}
              </Text>
            </View>
            {earned ? (
              <Text style={{ color: colors.savings, fontSize: 12, fontWeight: '800' }}>✓</Text>
            ) : current ? (
              <Text style={{ color: colors.gold, fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>
                NOW
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

// ── Badges (formerly the achievement grid) ───────────────────────

function deriveBadges(projection) {
  const s = projection.summary;
  const rows = projection.rows;
  const firstDebt = [...projection.debts]
    .filter((d) => d.clearedMonth)
    .sort((a, b) => a.clearedMonth - b.clearedMonth)[0];
  const grandMonth = (rows.find((r) => r.savingsTotal >= 1000) || {}).month || null;
  const tenkMonth = (rows.find((r) => r.savingsTotal >= 10000) || {}).month || null;
  return [
    { icon: '🪙', label: 'First £1,000 saved',  month: grandMonth,           rel: 'Real momentum.' },
    { icon: '🔓', label: 'First debt cleared',  month: firstDebt?.clearedMonth || null, rel: 'Your first big win.' },
    { icon: '💷', label: '£10,000 saved',       month: tenkMonth,            rel: 'Five-figure freedom fund.' },
    { icon: '🏆', label: 'Debt free',           month: s.debt_free_month,    rel: 'Every payment becomes wealth.' },
    { icon: '📈', label: 'Net worth positive',  month: s.net_positive_month, rel: 'You own more than you owe.' },
    { icon: '🎯', label: 'All goals met',       month: s.all_goals_met_month, rel: 'The whole journey, done.' },
  ].filter((a) => a.month);
}

function BadgeCard({ b, earned }) {
  return (
    <View
      style={{
        width: '48%',
        margin: '1%',
        backgroundColor: earned ? colors.white : colors.lineSoft,
        borderWidth: 1.5,
        borderColor: earned ? colors.savingsBorder : colors.line,
        borderRadius: 12,
        padding: 13,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 24, opacity: earned ? 1 : 0.35 }}>{b.icon}</Text>
        {earned ? (
          <View
            style={{
              backgroundColor: colors.savings,
              paddingVertical: 2,
              paddingHorizontal: 6,
              borderRadius: radius.pill,
            }}
          >
            <Text style={{ color: colors.white, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 }}>
              EARNED
            </Text>
          </View>
        ) : (
          <Text style={{ fontSize: 9, color: colors.muted, fontWeight: '800', letterSpacing: 0.6 }}>
            LOCKED
          </Text>
        )}
      </View>
      <Text
        style={{
          fontSize: 13,
          fontWeight: '800',
          marginTop: 9,
          lineHeight: 16,
          color: earned ? colors.ink : colors.muted,
        }}
      >
        {b.label}
      </Text>
      <Text
        style={{
          fontSize: 10.5,
          fontWeight: '700',
          marginTop: 3,
          color: earned ? colors.savings : colors.muted,
        }}
      >
        {earned ? `Unlocked ${monthLabel(b.month)}` : `Unlocks ${monthLabel(b.month)}`}
      </Text>
      <Text style={{ fontSize: 10.5, marginTop: 5, lineHeight: 14, color: colors.muted }}>
        {b.rel}
      </Text>
    </View>
  );
}

export function AwardsScreen({ projection }) {
  const progress = deriveProgress(projection);
  const badges = deriveBadges(projection);
  const md = projection.summary.months_done;
  const earned = badges.filter((b) => md >= b.month);
  const locked = badges.filter((b) => md < b.month);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.paper }}
      contentContainerStyle={{ padding: 24, paddingBottom: 96 }}
    >
      <Kicker>Your journey</Kicker>
      <ScreenTitle>Awards</ScreenTitle>

      <CurrentLevelCard progress={progress} />

      <SectionHead right={`${progress.pct}%`}>All levels</SectionHead>
      <LevelRail progress={progress} />

      <SectionHead right={`${earned.length} of ${badges.length}`}>Badges</SectionHead>
      {badges.length === 0 ? (
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
            Badges unlock as you make progress. Start ticking months on the Tracker.
          </Text>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
          {earned.map((b) => (
            <BadgeCard key={b.label} b={b} earned />
          ))}
          {locked.map((b) => (
            <BadgeCard key={b.label} b={b} earned={false} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

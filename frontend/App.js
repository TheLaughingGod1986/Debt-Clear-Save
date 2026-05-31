// App.js — root component. Phases: onboarding (first launch) → 4-tab app.
// All state persisted to AsyncStorage. Engine + UI run entirely on-device;
// the FastAPI backend is preserved untouched for the v1.1 sync feature.

import React, { useState, useEffect, useMemo } from 'react';
import { View, SafeAreaView, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { colors, gbp } from './src/theme/theme';
import { DEFAULT_PLAN, buildProjection } from './src/engine/projection';
import { TabBar } from './src/components/ui';
import { Celebration } from './src/components/Celebration';
import { PlanScreen } from './src/screens/PlanScreen';
import { TrackerScreen } from './src/screens/TrackerScreen';
import { AwardsScreen } from './src/screens/AwardsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';

const LS = {
  plan: 'dcs3.plan',
  done: 'dcs3.done',
  tab: 'dcs3.tab',
  onboarded: 'dcs3.onboarded',
};

const CELEB_META = {
  debt_free:    { icon: '🏆', color: '#0d1b2a', title: 'Debt free!',         sub: 'Your money now works for your future.' },
  debt_cleared: { icon: '🔓', color: '#c0392b', title: '{name} cleared',     sub: 'One down — that freed payment now powers the next.' },
  net_positive: { icon: '📈', color: '#b8860a', title: 'Net worth positive', sub: 'You officially own more than you owe.' },
  goal_met:     { icon: '🎉', color: '#166534', title: '{name} funded',      sub: 'Funded in full. Your next goal begins automatically.' },
  all_goals:    { icon: '🎯', color: '#166534', title: 'Every goal met!',    sub: 'The whole journey, complete. Incredible.' },
};

function buildCelebration(row, projection) {
  const kind = row.milestone.kind;
  const meta = CELEB_META[kind] || {
    icon: '✨', color: '#0d1b2a', title: 'Milestone', sub: 'A win unlocked.',
  };
  let title = meta.title;
  const stats = [];
  let next = null;

  if (kind === 'debt_cleared') {
    const d = projection.debts.find((x) => x.id === row.milestone.debtId);
    if (d) {
      title = title.replace('{name}', d.name);
      stats.push({ value: gbp(d.original || d.start), label: 'Eliminated',
        color: '#c0392b', soft: '#fef2f2', border: '#fca5a5' });
      stats.push({ value: `+${gbp(d.moneyFreed)}/mo`, label: 'Unlocked',
        color: '#166534', soft: '#e8f4ec', border: '#86efac' });
      const strat = projection.summary.strategy;
      const others = projection.debts
        .filter((x) => x.id !== row.milestone.debtId && x.current > 0.5)
        .sort((a, b) => (strat === 'snowball' ? a.current - b.current : b.apr - a.apr));
      next = others[0] ? `Next mission: ${others[0].name}` : 'Next mission: build your savings';
    }
  } else if (kind === 'debt_free') {
    stats.push({ value: gbp(projection.summary.start_debt), label: 'Total debt cleared',
      color: '#c0392b', soft: '#fef2f2', border: '#fca5a5' });
    next = 'Next mission: build your wealth';
  } else if (kind === 'goal_met') {
    const g = projection.goals.find((x) => x.id === row.milestone.goalId);
    if (g) {
      title = title.replace('{name}', g.name);
      stats.push({ value: gbp(g.target), label: `${g.name} saved`,
        color: '#166534', soft: '#e8f4ec', border: '#86efac' });
    }
  } else if (kind === 'all_goals') {
    stats.push({ value: gbp(projection.summary.final_savings), label: 'Saved in total',
      color: '#166534', soft: '#e8f4ec', border: '#86efac' });
  }

  return { icon: meta.icon, color: meta.color, title, sub: meta.sub, stats, next };
}

export default function App() {
  const [plan, setPlan] = useState(DEFAULT_PLAN);
  const [done, setDone] = useState(new Set());
  const [tab, setTab] = useState('plan');
  const [onboarded, setOnboarded] = useState(false);
  const [celebration, setCelebration] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from AsyncStorage once on mount.
  useEffect(() => {
    (async () => {
      try {
        const [p, d, t, ob] = await Promise.all([
          AsyncStorage.getItem(LS.plan),
          AsyncStorage.getItem(LS.done),
          AsyncStorage.getItem(LS.tab),
          AsyncStorage.getItem(LS.onboarded),
        ]);
        if (p) setPlan(JSON.parse(p));
        if (d) setDone(new Set(JSON.parse(d)));
        if (t) setTab(t);
        if (ob === '1') setOnboarded(true);
      } catch (e) {
        // First run — keep defaults.
      }
      setHydrated(true);
    })();
  }, []);

  // Write-through persistence (post-hydration only — avoids wiping defaults).
  useEffect(() => {
    if (hydrated) AsyncStorage.setItem(LS.plan, JSON.stringify(plan)).catch(() => {});
  }, [plan, hydrated]);
  useEffect(() => {
    if (hydrated) AsyncStorage.setItem(LS.done, JSON.stringify([...done])).catch(() => {});
  }, [done, hydrated]);
  useEffect(() => {
    if (hydrated) AsyncStorage.setItem(LS.tab, tab).catch(() => {});
  }, [tab, hydrated]);
  useEffect(() => {
    if (hydrated) AsyncStorage.setItem(LS.onboarded, onboarded ? '1' : '0').catch(() => {});
  }, [onboarded, hydrated]);

  const projection = useMemo(() => buildProjection(plan, done), [plan, done]);

  const toggleMonth = (row) => {
    const turningOn = !done.has(row.month);
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(row.month)) next.delete(row.month);
      else next.add(row.month);
      return next;
    });
    if (turningOn && row.milestone) {
      setCelebration(buildCelebration(row, projection));
    }
  };

  const setOverpay = (month, amount) =>
    setPlan((p) => {
      const over = { ...(p.overpayments || {}) };
      const v = Number(amount) || 0;
      if (v > 0) over[month] = v;
      else delete over[month];
      return { ...p, overpayments: over };
    });

  const reset = () => {
    setPlan(JSON.parse(JSON.stringify(DEFAULT_PLAN)));
    setDone(new Set());
    setTab('plan');
    setOnboarded(false);
  };

  const completeOnboarding = (newPlan) => {
    setPlan(newPlan);
    setOnboarded(true);
    setTab('plan');
  };

  if (!hydrated) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
        <StatusBar barStyle="dark-content" />
      </SafeAreaView>
    );
  }

  if (!onboarded) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
        <StatusBar barStyle="dark-content" />
        <OnboardingScreen onComplete={completeOnboarding} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1 }}>
        {tab === 'plan' && <PlanScreen projection={projection} />}
        {tab === 'tracker' && (
          <TrackerScreen projection={projection} onToggleMonth={toggleMonth} onOverpay={setOverpay} />
        )}
        {tab === 'awards' && <AwardsScreen projection={projection} />}
        {tab === 'settings' && (
          <SettingsScreen plan={plan} projection={projection} onSave={setPlan} onReset={reset} />
        )}
      </View>
      <TabBar tab={tab} onTab={setTab} />
      <Celebration event={celebration} onDone={() => setCelebration(null)} />
    </SafeAreaView>
  );
}

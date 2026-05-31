// App.js — auth → onboarding → tabs router. v1: skips auth + onboarding,
// drops straight into the 4-tab app with the default plan.
//
// Persistence: AsyncStorage holds the plan, ticked months and last-active
// tab. The FastAPI backend (CLAUDE.md verified milestones) is preserved
// untouched but not used by this new UI — the JS engine handles projection
// client-side. Wiring the backend back in is task #7.

import React, { useState, useEffect, useMemo } from 'react';
import { View, SafeAreaView, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { colors } from './src/theme/theme';
import { DEFAULT_PLAN, buildProjection } from './src/engine/projection';
import { TabBar } from './src/components/ui';
import { PlanScreen } from './src/screens/PlanScreen';
import { TrackerScreen } from './src/screens/TrackerScreen';
import { AwardsScreen } from './src/screens/AwardsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

const LS = {
  plan: 'dcs3.plan',
  done: 'dcs3.done',
  tab: 'dcs3.tab',
  hero: 'dcs3.hero',
};

export default function App() {
  const [plan, setPlan] = useState(DEFAULT_PLAN);
  const [done, setDone] = useState(new Set());
  const [tab, setTab] = useState('plan');
  const [heroVariant, setHeroVariant] = useState('dates');
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from AsyncStorage once.
  useEffect(() => {
    (async () => {
      try {
        const [p, d, t, h] = await Promise.all([
          AsyncStorage.getItem(LS.plan),
          AsyncStorage.getItem(LS.done),
          AsyncStorage.getItem(LS.tab),
          AsyncStorage.getItem(LS.hero),
        ]);
        if (p) setPlan(JSON.parse(p));
        if (d) setDone(new Set(JSON.parse(d)));
        if (t) setTab(t);
        if (h) setHeroVariant(h);
      } catch (e) {
        // ignore — first run
      }
      setHydrated(true);
    })();
  }, []);

  // Persist whenever the relevant state changes (post-hydration only).
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
    if (hydrated) AsyncStorage.setItem(LS.hero, heroVariant).catch(() => {});
  }, [heroVariant, hydrated]);

  const projection = useMemo(() => buildProjection(plan, done), [plan, done]);

  const toggleMonth = (row) =>
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(row.month)) next.delete(row.month);
      else next.add(row.month);
      return next;
    });

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
    setHeroVariant('dates');
  };

  if (!hydrated) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
        <StatusBar barStyle="dark-content" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1 }}>
        {tab === 'plan' && (
          <PlanScreen projection={projection} heroVariant={heroVariant} onHero={setHeroVariant} />
        )}
        {tab === 'tracker' && (
          <TrackerScreen
            projection={projection}
            onToggleMonth={toggleMonth}
            onOverpay={setOverpay}
          />
        )}
        {tab === 'awards' && <AwardsScreen projection={projection} />}
        {tab === 'settings' && (
          <SettingsScreen
            plan={plan}
            projection={projection}
            onSave={setPlan}
            onReset={reset}
          />
        )}
      </View>
      <TabBar tab={tab} onTab={setTab} />
    </SafeAreaView>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, SafeAreaView, StatusBar, Alert,
} from 'react-native';
import { colors, spacing } from './src/theme/theme';
import { api } from './src/api/client';
import OverviewScreen from './src/screens/OverviewScreen';
import TrackerScreen from './src/screens/TrackerScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const TABS = [
  { key: 'overview', label: 'Plan', icon: '◎' },
  { key: 'tracker', label: 'Tracker', icon: '☑' },
  { key: 'settings', label: 'Settings', icon: '⚙' },
];

export default function App() {
  const [tab, setTab] = useState('overview');
  const [planId, setPlanId] = useState(null);
  const [projection, setProjection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Bootstrap: reuse the first plan, or create a default one.
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const plans = await api.listPlans();
        const id = plans.length ? plans[0].id : (await api.createPlan({ name: 'Our Plan' })).id;
        setPlanId(id);
        setProjection(await api.getProjection(id));
        setError(null);
      } catch (e) {
        setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const refresh = useCallback(async () => {
    if (!planId) return;
    try {
      setLoading(true);
      setProjection(await api.getProjection(planId));
      setError(null);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [planId]);

  const toggleMonth = useCallback(async (month, done) => {
    if (!planId) return;
    // optimistic update
    setProjection((prev) => prev && ({
      ...prev,
      rows: prev.rows.map((r) => (r.month === month ? { ...r, done } : r)),
    }));
    try {
      await api.setProgress(planId, month, { done });
      setProjection(await api.getProjection(planId)); // resync summary stats
    } catch (e) {
      Alert.alert('Could not update', e.message || String(e));
      await refresh();
    }
  }, [planId, refresh]);

  const savePlan = useCallback(async (patch) => {
    if (!planId) return;
    await api.updatePlan(planId, patch);
    setProjection(await api.getProjection(planId));
  }, [planId]);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.paper} />

      {error ? (
        <View style={s.errorBar}>
          <Text style={s.errorText}>⚠ {error}</Text>
          <Pressable onPress={refresh}><Text style={s.retry}>Retry</Text></Pressable>
        </View>
      ) : null}

      <View style={{ flex: 1 }}>
        {tab === 'overview' && <OverviewScreen projection={projection} loading={loading} onRefresh={refresh} />}
        {tab === 'tracker' && <TrackerScreen projection={projection} loading={loading} onToggleMonth={toggleMonth} />}
        {tab === 'settings' && <SettingsScreen projection={projection} onSave={savePlan} />}
      </View>

      <View style={s.tabBar}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <Pressable key={t.key} style={s.tab} onPress={() => setTab(t.key)}>
              <Text style={[s.tabIcon, active && s.tabActive]}>{t.icon}</Text>
              <Text style={[s.tabLabel, active && s.tabActive]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  errorBar: {
    backgroundColor: colors.ccSoft, paddingHorizontal: spacing.md, paddingVertical: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  errorText: { color: colors.cc, fontSize: 12, flexShrink: 1 },
  retry: { color: colors.cc, fontWeight: '700', fontSize: 12 },
  tabBar: {
    flexDirection: 'row', backgroundColor: colors.white,
    borderTopWidth: 1, borderTopColor: colors.line, paddingBottom: 6, paddingTop: 8,
  },
  tab: { flex: 1, alignItems: 'center', gap: 2 },
  tabIcon: { fontSize: 20, color: colors.muted },
  tabLabel: { fontSize: 11, color: colors.muted, fontWeight: '600' },
  tabActive: { color: colors.ink },
});

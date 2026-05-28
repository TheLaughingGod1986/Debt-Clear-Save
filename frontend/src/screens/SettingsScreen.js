import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput, Pressable,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { colors, spacing, radius, gbp } from '../theme/theme';
import { SectionHead } from '../components/ui';

const FIELDS = [
  { key: 'credit_card', label: 'Credit card balance', group: 'Starting balances' },
  { key: 'dmp_balance', label: 'DMP balance' },
  { key: 'equity', label: 'Home equity (now)' },
  { key: 'savings', label: 'Savings (now)' },
  { key: 'monthly_budget', label: 'Total monthly budget', group: 'Monthly strategy' },
  { key: 'p1_cc_payment', label: 'Phase 1 · CC payment' },
  { key: 'p1_dmp_payment', label: 'Phase 1 · DMP payment' },
  { key: 'p1_savings', label: 'Phase 1 · savings' },
  { key: 'p2_dmp_payment', label: 'Phase 2 · DMP payment' },
  { key: 'p2_savings', label: 'Phase 2 · savings' },
  { key: 'equity_growth', label: 'Equity growth / month' },
  { key: 'savings_target', label: 'Savings target', group: 'Goal' },
];

export default function SettingsScreen({ projection, onSave }) {
  const plan = projection?.plan;
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (plan) {
      const d = {};
      FIELDS.forEach((f) => { d[f.key] = String(plan[f.key]); });
      setDraft(d);
    }
  }, [plan?.id]);

  if (!plan) {
    return <View style={s.center}><Text style={{ color: colors.muted }}>No plan loaded.</Text></View>;
  }

  const setField = (key, val) => setDraft((d) => ({ ...d, [key]: val }));

  const handleSave = async () => {
    const patch = {};
    for (const f of FIELDS) {
      const num = parseFloat(draft[f.key]);
      if (isNaN(num) || num < 0) {
        Alert.alert('Check your numbers', `"${f.label}" must be a number of 0 or more.`);
        return;
      }
      patch[f.key] = num;
    }
    setSaving(true);
    try {
      await onSave(patch);
      Alert.alert('Saved', 'Your plan was updated and the projection recalculated.');
    } catch (e) {
      Alert.alert('Could not save', String(e.message || e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.screen} contentContainerStyle={{ padding: spacing.lg, paddingBottom: 64 }} keyboardShouldPersistTaps="handled">
        <Text style={s.kicker}>Adjust the plan</Text>
        <Text style={s.title}>Settings</Text>
        <Text style={s.sub}>Change any figure and save — the whole journey recalculates instantly.</Text>

        {FIELDS.map((f) => (
          <View key={f.key}>
            {f.group ? <SectionHead>{f.group}</SectionHead> : null}
            <View style={s.field}>
              <Text style={s.fieldLabel}>{f.label}</Text>
              <View style={s.inputWrap}>
                <Text style={s.poundSign}>£</Text>
                <TextInput
                  style={s.input}
                  value={draft[f.key] ?? ''}
                  onChangeText={(v) => setField(f.key, v.replace(/[^0-9.]/g, ''))}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={colors.muted}
                />
              </View>
            </View>
          </View>
        ))}

        <Pressable style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
          <Text style={s.saveText}>{saving ? 'Saving…' : 'Save & recalculate'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper },
  kicker: { fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: colors.muted, marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink },
  sub: { fontSize: 13, color: colors.muted, marginTop: 2, marginBottom: spacing.sm },
  field: { marginBottom: spacing.sm },
  fieldLabel: { fontSize: 12, color: colors.muted, marginBottom: 4, fontWeight: '600' },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
    borderWidth: 1.5, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: 12,
  },
  poundSign: { fontSize: 16, color: colors.muted, marginRight: 4 },
  input: { flex: 1, paddingVertical: 12, fontSize: 16, color: colors.ink },
  saveBtn: {
    marginTop: spacing.lg, backgroundColor: colors.ink, borderRadius: radius.md,
    paddingVertical: 16, alignItems: 'center',
  },
  saveText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});

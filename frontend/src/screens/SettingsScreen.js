// SettingsScreen.js — strategy switch, debts editor, goals editor, reset.
// Pared-down port of settings.jsx — covers the essentials.

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { colors, type, radius, fonts, gbp } from '../theme/theme';
import {
  Kicker,
  ScreenTitle,
  SectionHead,
  Segmented,
  PrimaryButton,
  GhostButton,
  ComingSoon,
} from '../components/ui';

// ── Inline number/text field used throughout the editor ──────────

function Field({ label, value, onChangeText, prefix, suffix, keyboardType = 'default' }) {
  return (
    <View style={{ flex: 1, marginVertical: 4 }}>
      <Text
        style={{
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: colors.muted,
          marginBottom: 4,
        }}
      >
        {label}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.white,
          borderWidth: 1.5,
          borderColor: colors.line,
          borderRadius: 8,
          paddingHorizontal: 10,
        }}
      >
        {prefix ? (
          <Text style={{ color: colors.muted, marginRight: 4 }}>{prefix}</Text>
        ) : null}
        <TextInput
          value={String(value ?? '')}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          style={{ flex: 1, paddingVertical: 9, fontSize: 14, color: colors.ink, fontWeight: '600' }}
        />
        {suffix ? (
          <Text style={{ color: colors.muted, marginLeft: 4 }}>{suffix}</Text>
        ) : null}
      </View>
    </View>
  );
}

// ── Editor for a single debt ────────────────────────────────────

function DebtRow({ debt, onChange, onDelete }) {
  return (
    <View
      style={{
        backgroundColor: colors.white,
        borderWidth: 1.5,
        borderColor: colors.line,
        borderRadius: radius.md,
        padding: 12,
        marginBottom: 8,
      }}
    >
      <Field
        label="Name"
        value={debt.name}
        onChangeText={(t) => onChange({ ...debt, name: t })}
      />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Field
          label="Balance"
          value={debt.balance}
          onChangeText={(t) => onChange({ ...debt, balance: Number(t.replace(/[^0-9.]/g, '')) || 0 })}
          prefix="£"
          keyboardType="decimal-pad"
        />
        <View style={{ width: 8 }} />
        <Field
          label="APR"
          value={debt.apr}
          onChangeText={(t) => onChange({ ...debt, apr: Number(t.replace(/[^0-9.]/g, '')) || 0 })}
          suffix="%"
          keyboardType="decimal-pad"
        />
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Field
          label="Minimum payment"
          value={debt.minPayment}
          onChangeText={(t) => onChange({ ...debt, minPayment: Number(t.replace(/[^0-9.]/g, '')) || 0 })}
          prefix="£"
          keyboardType="decimal-pad"
        />
        <View style={{ width: 8 }} />
        <Field
          label="Started at"
          value={debt.original}
          onChangeText={(t) => onChange({ ...debt, original: Number(t.replace(/[^0-9.]/g, '')) || 0 })}
          prefix="£"
          keyboardType="decimal-pad"
        />
      </View>
      <TouchableOpacity onPress={onDelete} style={{ marginTop: 8 }}>
        <Text style={{ color: colors.cc, fontSize: 12, fontWeight: '700' }}>Remove debt</Text>
      </TouchableOpacity>
    </View>
  );
}

function GoalRow({ goal, onChange, onDelete }) {
  return (
    <View
      style={{
        backgroundColor: colors.white,
        borderWidth: 1.5,
        borderColor: colors.line,
        borderRadius: radius.md,
        padding: 12,
        marginBottom: 8,
      }}
    >
      <Field label="Name" value={goal.name} onChangeText={(t) => onChange({ ...goal, name: t })} />
      <Field
        label="Target"
        value={goal.target}
        onChangeText={(t) => onChange({ ...goal, target: Number(t.replace(/[^0-9.]/g, '')) || 0 })}
        prefix="£"
        keyboardType="decimal-pad"
      />
      <TouchableOpacity onPress={onDelete} style={{ marginTop: 8 }}>
        <Text style={{ color: colors.cc, fontSize: 12, fontWeight: '700' }}>Remove goal</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Screen ───────────────────────────────────────────────────────

export function SettingsScreen({ plan, projection, onSave, onReset }) {
  const [draft, setDraft] = useState(() => JSON.parse(JSON.stringify(plan)));
  const dirty = JSON.stringify(draft) !== JSON.stringify(plan);

  const update = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const updateDebt = (i, debt) => {
    const next = [...draft.debts];
    next[i] = debt;
    update({ debts: next });
  };
  const removeDebt = (i) => update({ debts: draft.debts.filter((_, j) => j !== i) });
  const addDebt = () =>
    update({
      debts: [
        ...draft.debts,
        {
          id: Math.random().toString(36).slice(2, 9),
          name: 'New debt',
          balance: 1000,
          original: 1000,
          apr: 19.9,
          minPayment: 25,
        },
      ],
    });
  const updateGoal = (i, goal) => {
    const next = [...draft.goals];
    next[i] = goal;
    update({ goals: next });
  };
  const removeGoal = (i) => update({ goals: draft.goals.filter((_, j) => j !== i) });
  const addGoal = () =>
    update({
      goals: [
        ...draft.goals,
        { id: Math.random().toString(36).slice(2, 9), name: 'New goal', target: 1000 },
      ],
    });

  const confirmReset = () =>
    Alert.alert(
      'Reset everything?',
      'This clears all ticked months, debts, goals, and personal data.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: onReset },
      ]
    );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.paper }}
      contentContainerStyle={{ padding: 24, paddingBottom: 96 }}
    >
      <Kicker>Plan controls</Kicker>
      <ScreenTitle>Settings</ScreenTitle>

      <SectionHead>Plan</SectionHead>
      <Field label="Plan name" value={draft.name} onChangeText={(t) => update({ name: t })} />
      <Field
        label="Protected savings while in debt"
        value={draft.saveWhileInDebt}
        onChangeText={(t) => update({ saveWhileInDebt: Number(t.replace(/[^0-9.]/g, '')) || 0 })}
        prefix="£"
        suffix="/mo"
        keyboardType="decimal-pad"
      />

      <SectionHead>Payoff strategy</SectionHead>
      <Segmented
        value={draft.strategy}
        onChange={(v) => update({ strategy: v })}
        options={[
          { value: 'avalanche', label: 'Avalanche (highest APR)' },
          { value: 'snowball', label: 'Snowball (smallest)' },
        ]}
      />
      <Text style={{ fontSize: 11, color: colors.muted, marginTop: 8, lineHeight: 16 }}>
        Avalanche minimises interest by attacking the highest-APR debt first. Snowball pays the
        smallest balance first for early psychological wins.
      </Text>

      <SectionHead right={`${draft.debts.length}`}>Debts</SectionHead>
      {draft.debts.map((d, i) => (
        <DebtRow
          key={d.id}
          debt={d}
          onChange={(nx) => updateDebt(i, nx)}
          onDelete={() => removeDebt(i)}
        />
      ))}
      <GhostButton onPress={addDebt}>+ Add debt</GhostButton>

      <SectionHead right={`${draft.goals.length}`}>Goals</SectionHead>
      {draft.goals.map((g, i) => (
        <GoalRow
          key={g.id}
          goal={g}
          onChange={(nx) => updateGoal(i, nx)}
          onDelete={() => removeGoal(i)}
        />
      ))}
      <GhostButton onPress={addGoal}>+ Add goal</GhostButton>

      <SectionHead>Today's totals</SectionHead>
      <View
        style={{
          backgroundColor: colors.white,
          borderWidth: 1.5,
          borderColor: colors.line,
          borderRadius: radius.md,
          padding: 14,
        }}
      >
        <Text style={{ fontSize: 12, color: colors.muted }}>
          Total debt{'  '}
          <Text style={{ color: colors.cc, fontWeight: '800' }}>
            {gbp(projection.summary.start_debt)}
          </Text>
        </Text>
        <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
          Total goal targets{'  '}
          <Text style={{ color: colors.savings, fontWeight: '800' }}>
            {gbp(projection.summary.goal_total)}
          </Text>
        </Text>
        <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
          Monthly budget{'  '}
          <Text style={{ color: colors.ink, fontWeight: '800' }}>
            {gbp(projection.summary.budget)}/mo
          </Text>
        </Text>
      </View>

      <View style={{ marginTop: 24 }}>
        <PrimaryButton onPress={() => onSave(draft)} disabled={!dirty}>
          {dirty ? 'Save changes' : 'Up to date'}
        </PrimaryButton>
      </View>

      <SectionHead right={<ComingSoon />}>Partner mode</SectionHead>
      <View
        style={{
          backgroundColor: colors.white,
          borderWidth: 1.5,
          borderColor: colors.line,
          borderRadius: radius.md,
          padding: 14,
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.ink, marginBottom: 6 }}>
          Plan together — coming soon
        </Text>
        <Text style={{ fontSize: 12, color: colors.muted, lineHeight: 18, marginBottom: 12 }}>
          Partner mode lets you and your partner share a single debt plan with live sync across both phones.
        </Text>
        {[
          ['Shared dashboard', 'You both see the same plan and progress'],
          ['Partner invites', 'Invite by email or a share link'],
          ['Live sync', 'Changes update on both devices instantly'],
        ].map(([title, sub]) => (
          <View
            key={title}
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              paddingVertical: 7,
              borderTopWidth: 1,
              borderTopColor: colors.lineSoft,
            }}
          >
            <Text style={{ color: colors.gold, fontWeight: '900', marginRight: 10, marginTop: 1 }}>●</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.ink }}>{title}</Text>
              <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>{sub}</Text>
            </View>
          </View>
        ))}
      </View>

      <SectionHead>Privacy</SectionHead>
      <View
        style={{
          backgroundColor: colors.white,
          borderWidth: 1.5,
          borderColor: colors.line,
          borderRadius: radius.md,
          padding: 14,
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.ink, marginBottom: 6 }}>
          Your data stays on this iPhone.
        </Text>
        <Text style={{ fontSize: 12, color: colors.muted, lineHeight: 18 }}>
          Debt Freedom does not collect, send, or sync any of your information. Everything you
          enter is stored privately on this device. Cloud sync and accounts are coming soon.
        </Text>
      </View>

      <SectionHead>About</SectionHead>
      <View
        style={{
          backgroundColor: colors.white,
          borderWidth: 1.5,
          borderColor: colors.line,
          borderRadius: radius.md,
          padding: 14,
        }}
      >
        <Text style={{ fontSize: 12, color: colors.muted, lineHeight: 18 }}>
          Debt Freedom is a planning tool, not financial advice. Projections are estimates based on
          the figures you enter. Always check the numbers against your statements before making
          financial decisions.
        </Text>
        <Text style={{ fontSize: 11, color: colors.muted, marginTop: 10 }}>
          Debt Freedom · v1.0
        </Text>
      </View>

      <SectionHead>Danger zone</SectionHead>
      <TouchableOpacity
        onPress={confirmReset}
        accessibilityLabel="Reset everything"
        accessibilityHint="Clears your plan, debts, goals, and progress"
        style={{
          borderWidth: 1.5,
          borderColor: colors.ccBorder,
          backgroundColor: colors.ccSoft,
          borderRadius: radius.md,
          paddingVertical: 13,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: colors.cc, fontWeight: '700', fontSize: 14 }}>Reset everything</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

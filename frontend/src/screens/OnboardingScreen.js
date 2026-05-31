// OnboardingScreen.js — 5-step activation flow.
//
// 1. Welcome   — brand + headline + "Get Started"
// 2. Debts     — add 1..n debts (name/type, balance, APR, min payment)
// 3. Budget    — monthly debt budget + payday + optional personal allowance
// 4. Projection — instant "Debt free by <date>" + interest saved + CTA
// 5. Save Plan — stubbed sign-in (only "Skip for now" works in v1)
//
// Goal: a brand-new user reaches step 4 in under 60 seconds.

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { colors, type, radius, fonts, gbp, monthLabel, yearsMonths } from '../theme/theme';
import {
  Kicker,
  ScreenTitle,
  PrimaryButton,
  GhostButton,
  GrowBar,
  SectionHead,
} from '../components/ui';
import { DEFAULT_PLAN, buildProjection } from '../engine/projection';

const uid = () => Math.random().toString(36).slice(2, 9);

const DEBT_TYPES = [
  { key: 'credit_card',  label: 'Credit Card',   apr: 24.9, icon: '💳' },
  { key: 'loan',         label: 'Personal Loan', apr: 9.9,  icon: '🏦' },
  { key: 'overdraft',    label: 'Overdraft',     apr: 39.9, icon: '📉' },
  { key: 'store_card',   label: 'Store Card',    apr: 29.9, icon: '🛍️' },
  { key: 'car_finance',  label: 'Car Finance',   apr: 6.9,  icon: '🚗' },
  { key: 'other',        label: 'Other',         apr: 15.0, icon: '📄' },
];

// ── Step header (progress dots + back) ─────────────────────────────

function StepHeader({ step, total, onBack }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 16,
      }}
    >
      {step > 1 ? (
        <TouchableOpacity
          onPress={onBack}
          style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
          accessibilityLabel="Back"
        >
          <Text style={{ fontSize: 22, color: colors.ink }}>‹</Text>
        </TouchableOpacity>
      ) : (
        <View style={{ width: 36 }} />
      )}
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <View
            key={n}
            style={{
              width: n === step ? 28 : 8,
              height: 8,
              borderRadius: 4,
              marginHorizontal: 3,
              backgroundColor: n <= step ? colors.ink : colors.line,
            }}
          />
        ))}
      </View>
      <View style={{ width: 36 }} />
    </View>
  );
}

// ── Step 1: Welcome ────────────────────────────────────────────────

function StepWelcome({ onNext }) {
  return (
    <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: 'space-between' }}>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text style={[type.kicker, { color: colors.gold, marginBottom: 12, textAlign: 'center' }]}>
          Take control
        </Text>
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: 52,
            fontWeight: '800',
            color: colors.ink,
            textAlign: 'center',
            letterSpacing: -1.2,
            lineHeight: 56,
          }}
        >
          Debt{'\n'}Freedom
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: colors.muted,
            textAlign: 'center',
            marginTop: 18,
            lineHeight: 24,
            paddingHorizontal: 12,
          }}
        >
          See exactly when you'll become debt free — and how much interest you'll save getting there.
        </Text>

        <View
          style={{
            marginTop: 36,
            backgroundColor: colors.ink,
            borderRadius: 16,
            padding: 20,
          }}
        >
          <Text
            style={{
              color: 'rgba(255,255,255,0.55)',
              fontSize: 10,
              fontWeight: '800',
              letterSpacing: 1.8,
              textTransform: 'uppercase',
            }}
          >
            Sample plan
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 6 }}>
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: 38,
                fontWeight: '800',
                color: colors.white,
                letterSpacing: -0.6,
              }}
            >
              Debt free
            </Text>
            <Text
              style={{
                color: colors.savingsBorder,
                fontFamily: fonts.display,
                fontSize: 28,
                fontWeight: '800',
                marginLeft: 8,
              }}
            >
              {monthLabel(16)}
            </Text>
          </View>
          <View style={{ marginTop: 12 }}>
            <GrowBar pct={72} color={colors.savings} height={10} track="rgba(255,255,255,0.12)" />
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 10 }}>
            £11,724 of interest avoided · 4 debts cleared
          </Text>
        </View>
      </View>

      <View style={{ paddingVertical: 24 }}>
        <PrimaryButton onPress={onNext}>Get Started</PrimaryButton>
        <Text
          style={{
            textAlign: 'center',
            color: colors.muted,
            fontSize: 11,
            marginTop: 12,
            lineHeight: 16,
          }}
        >
          Takes 60 seconds · no sign-up required
        </Text>
      </View>
    </View>
  );
}

// ── Step 2: Add Debts ──────────────────────────────────────────────

function DebtEditorCard({ debt, onChange, onDelete }) {
  const t = DEBT_TYPES.find((x) => x.key === debt.type) || DEBT_TYPES[0];
  return (
    <View
      style={{
        backgroundColor: colors.white,
        borderWidth: 1.5,
        borderColor: colors.line,
        borderRadius: radius.md,
        padding: 14,
        marginBottom: 10,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <Text style={{ fontSize: 22, marginRight: 8 }}>{t.icon}</Text>
        <TextInput
          value={debt.name}
          onChangeText={(v) => onChange({ ...debt, name: v })}
          placeholder={t.label}
          style={{
            flex: 1,
            fontSize: 16,
            fontWeight: '700',
            color: colors.ink,
            paddingVertical: 4,
          }}
        />
        <TouchableOpacity onPress={onDelete} accessibilityLabel={`Remove ${debt.name}`}>
          <Text style={{ color: colors.muted, fontSize: 20, paddingHorizontal: 8 }}>×</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', marginHorizontal: -3 }}>
        <NumberField
          label="Balance"
          prefix="£"
          value={debt.balance}
          onChange={(v) => onChange({ ...debt, balance: v, original: Math.max(v, debt.original || v) })}
        />
        <NumberField
          label="APR"
          suffix="%"
          value={debt.apr}
          onChange={(v) => onChange({ ...debt, apr: v })}
          step={0.1}
        />
        <NumberField
          label="Min/mo"
          prefix="£"
          value={debt.minPayment}
          onChange={(v) => onChange({ ...debt, minPayment: v })}
        />
      </View>
    </View>
  );
}

function NumberField({ label, value, onChange, prefix, suffix, step = 1 }) {
  const [draft, setDraft] = useState(String(value ?? ''));
  React.useEffect(() => {
    setDraft(String(value ?? ''));
  }, [value]);
  return (
    <View style={{ flex: 1, marginHorizontal: 3 }}>
      <Text
        style={{
          fontSize: 9,
          fontWeight: '800',
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: colors.muted,
          marginBottom: 3,
        }}
      >
        {label}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.paper,
          borderRadius: 8,
          paddingHorizontal: 8,
          paddingVertical: 8,
        }}
      >
        {prefix ? <Text style={{ color: colors.muted, fontSize: 13, marginRight: 2 }}>{prefix}</Text> : null}
        <TextInput
          value={draft}
          onChangeText={(t) => setDraft(t.replace(/[^0-9.]/g, ''))}
          onEndEditing={() => onChange(Number(draft) || 0)}
          keyboardType="decimal-pad"
          style={{
            flex: 1,
            fontSize: 14,
            fontWeight: '700',
            color: colors.ink,
            padding: 0,
          }}
        />
        {suffix ? <Text style={{ color: colors.muted, fontSize: 13 }}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

function StepDebts({ debts, setDebts, onNext, onBack }) {
  const addDebt = (type) => {
    const t = DEBT_TYPES.find((x) => x.key === type) || DEBT_TYPES[0];
    setDebts([
      ...debts,
      {
        id: uid(),
        type: t.key,
        name: t.label,
        balance: 0,
        original: 0,
        apr: t.apr,
        minPayment: 0,
      },
    ]);
  };
  const total = debts.reduce((s, d) => s + (Number(d.balance) || 0), 0);
  const canNext = debts.length > 0 && debts.every((d) => d.balance > 0);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <Kicker>Step 2 of 5</Kicker>
        <ScreenTitle>What debts do you have?</ScreenTitle>
        <Text style={{ color: colors.muted, fontSize: 14, marginBottom: 20, lineHeight: 20 }}>
          Add everything you owe. The more accurate, the better your projection.
        </Text>

        {debts.length === 0 ? (
          <View
            style={{
              padding: 18,
              backgroundColor: colors.white,
              borderWidth: 1.5,
              borderColor: colors.line,
              borderRadius: radius.md,
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 32, marginBottom: 8 }}>💳</Text>
            <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center' }}>
              No debts yet — tap a type below to add one.
            </Text>
          </View>
        ) : (
          debts.map((d) => (
            <DebtEditorCard
              key={d.id}
              debt={d}
              onChange={(nx) => setDebts(debts.map((x) => (x.id === d.id ? nx : x)))}
              onDelete={() => setDebts(debts.filter((x) => x.id !== d.id))}
            />
          ))
        )}

        <Text
          style={[
            type.label,
            { fontSize: 10, letterSpacing: 1.5, marginTop: 12, marginBottom: 8 },
          ]}
        >
          Add a debt
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
          {DEBT_TYPES.map((t) => (
            <TouchableOpacity
              key={t.key}
              onPress={() => addDebt(t.key)}
              style={{
                width: '50%',
                paddingHorizontal: 4,
                paddingVertical: 4,
              }}
            >
              <View
                style={{
                  backgroundColor: colors.white,
                  borderWidth: 1.5,
                  borderColor: colors.line,
                  borderRadius: radius.md,
                  padding: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 20, marginRight: 8 }}>{t.icon}</Text>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 13,
                    fontWeight: '700',
                    color: colors.ink,
                  }}
                >
                  {t.label}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 18 }}>+</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {total > 0 ? (
          <View
            style={{
              marginTop: 20,
              padding: 14,
              backgroundColor: colors.ccSoft,
              borderWidth: 1.5,
              borderColor: colors.ccBorder,
              borderRadius: radius.md,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 13, color: colors.cc, fontWeight: '700' }}>Total debt</Text>
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: 22,
                fontWeight: '800',
                color: colors.cc,
                letterSpacing: -0.3,
              }}
            >
              {gbp(total)}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={{ paddingHorizontal: 24, paddingVertical: 16, backgroundColor: colors.paper }}>
        <PrimaryButton onPress={onNext} disabled={!canNext}>
          {canNext ? 'Continue' : debts.length === 0 ? 'Add at least one debt' : 'Fill in balances'}
        </PrimaryButton>
      </View>
    </View>
  );
}

// ── Step 3: Budget ─────────────────────────────────────────────────

function StepBudget({ budget, setBudget, allowance, setAllowance, payday, setPayday, onNext }) {
  const canNext = budget > 0;
  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <Kicker>Step 3 of 5</Kicker>
        <ScreenTitle>How much can you put towards debt each month?</ScreenTitle>
        <Text style={{ color: colors.muted, fontSize: 14, marginBottom: 24, lineHeight: 20 }}>
          The total going to debt + savings every month. Be realistic — sustainable beats heroic.
        </Text>

        <Text style={[type.label, { fontSize: 10, marginBottom: 8 }]}>Monthly debt budget</Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.white,
            borderWidth: 2,
            borderColor: colors.ink,
            borderRadius: radius.md,
            paddingHorizontal: 14,
          }}
        >
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: 32,
              color: colors.muted,
              marginRight: 6,
            }}
          >
            £
          </Text>
          <TextInput
            value={String(budget || '')}
            onChangeText={(v) => setBudget(Number(v.replace(/[^0-9.]/g, '')) || 0)}
            placeholder="0"
            placeholderTextColor={colors.muted}
            keyboardType="decimal-pad"
            style={{
              flex: 1,
              fontFamily: fonts.display,
              fontSize: 32,
              fontWeight: '800',
              color: colors.ink,
              paddingVertical: 18,
              letterSpacing: -0.5,
            }}
          />
          <Text style={{ color: colors.muted, fontSize: 14 }}>/ mo</Text>
        </View>

        <View style={{ flexDirection: 'row', marginTop: 12 }}>
          {[300, 500, 1000, 2000].map((amt) => (
            <TouchableOpacity
              key={amt}
              onPress={() => setBudget(amt)}
              style={{
                flex: 1,
                marginHorizontal: 3,
                paddingVertical: 9,
                borderRadius: radius.pill,
                borderWidth: 1.5,
                borderColor: budget === amt ? colors.ink : colors.line,
                backgroundColor: budget === amt ? colors.ink : colors.white,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: budget === amt ? colors.white : colors.ink,
                  fontWeight: '700',
                  fontSize: 12,
                }}
              >
                £{amt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <SectionHead>Personal allowance (optional)</SectionHead>
        <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 12, lineHeight: 19 }}>
          Money reserved for yourself before debt payments. Helps you stick to the plan without
          feeling deprived.
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.white,
            borderWidth: 1.5,
            borderColor: colors.line,
            borderRadius: radius.md,
            paddingHorizontal: 12,
          }}
        >
          <Text style={{ color: colors.muted, fontSize: 18, marginRight: 4 }}>£</Text>
          <TextInput
            value={String(allowance || '')}
            onChangeText={(v) => setAllowance(Number(v.replace(/[^0-9.]/g, '')) || 0)}
            placeholder="0"
            placeholderTextColor={colors.muted}
            keyboardType="decimal-pad"
            style={{ flex: 1, fontSize: 18, fontWeight: '700', color: colors.ink, paddingVertical: 12 }}
          />
          <Text style={{ color: colors.muted, fontSize: 12 }}>/ mo</Text>
        </View>
        <View style={{ flexDirection: 'row', marginTop: 10 }}>
          {[0, 50, 100, 200].map((amt) => (
            <TouchableOpacity
              key={amt}
              onPress={() => setAllowance(amt)}
              style={{
                flex: 1,
                marginHorizontal: 3,
                paddingVertical: 8,
                borderRadius: radius.pill,
                borderWidth: 1.5,
                borderColor: allowance === amt ? colors.ink : colors.line,
                backgroundColor: allowance === amt ? colors.lineSoft : colors.white,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: allowance === amt ? colors.ink : colors.muted,
                  fontWeight: '700',
                  fontSize: 12,
                }}
              >
                £{amt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <SectionHead>Payday</SectionHead>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -3 }}>
          {[1, 5, 10, 15, 20, 25, 28].map((d) => (
            <TouchableOpacity
              key={d}
              onPress={() => setPayday(d)}
              style={{
                width: '14%',
                margin: '0.5%',
                paddingVertical: 11,
                borderRadius: radius.md,
                borderWidth: 1.5,
                borderColor: payday === d ? colors.ink : colors.line,
                backgroundColor: payday === d ? colors.ink : colors.white,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: payday === d ? colors.white : colors.ink, fontWeight: '700' }}>
                {d}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: 24, paddingVertical: 16, backgroundColor: colors.paper }}>
        <PrimaryButton onPress={onNext} disabled={!canNext}>
          {canNext ? 'See my debt-free date →' : 'Enter a budget'}
        </PrimaryButton>
      </View>
    </View>
  );
}

// ── Step 4: Instant Projection ─────────────────────────────────────

function StepProjection({ plan, onNext }) {
  const projection = useMemo(() => buildProjection(plan, new Set()), [plan]);
  const s = projection.summary;
  const dfree = s.debt_free_month;
  const saved = Math.max(0, (s.interest_without_plan || 0) - (s.total_interest || 0));

  // simple fade-in for the headline reveal
  const fade = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [fade]);

  if (!dfree) {
    return (
      <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: 'space-between' }}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text style={{ fontSize: 48, textAlign: 'center', marginBottom: 16 }}>⚠️</Text>
          <ScreenTitle style={{ textAlign: 'center' }}>
            Your budget can't cover the interest yet
          </ScreenTitle>
          <Text
            style={{
              fontSize: 14,
              color: colors.muted,
              textAlign: 'center',
              lineHeight: 22,
            }}
          >
            Try increasing your monthly budget, or removing a debt for now and adding it back later.
          </Text>
        </View>
        <View style={{ paddingVertical: 24 }}>
          <PrimaryButton onPress={onNext}>I'll adjust later — continue</PrimaryButton>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
      >
        <Animated.View style={{ opacity: fade, transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
          <Text style={{ fontSize: 56, textAlign: 'center', marginTop: 8 }}>🎉</Text>
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: 32,
              fontWeight: '800',
              color: colors.ink,
              textAlign: 'center',
              letterSpacing: -0.6,
              marginTop: 12,
              lineHeight: 36,
            }}
          >
            You have a clear path to becoming debt free.
          </Text>
        </Animated.View>

        <View
          style={{
            marginTop: 24,
            backgroundColor: colors.ink,
            borderRadius: 18,
            padding: 22,
          }}
        >
          <Text
            style={{
              color: 'rgba(255,255,255,0.55)',
              fontSize: 10,
              fontWeight: '800',
              letterSpacing: 1.8,
              textTransform: 'uppercase',
            }}
          >
            Debt free by
          </Text>
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: 44,
              fontWeight: '800',
              color: colors.white,
              marginTop: 4,
              letterSpacing: -0.8,
            }}
          >
            {monthLabel(dfree)}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 4 }}>
            That's {yearsMonths(dfree)} from today.
          </Text>

          <View
            style={{
              marginTop: 18,
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: 'rgba(255,255,255,0.12)',
              flexDirection: 'row',
              flexWrap: 'wrap',
            }}
          >
            <ProjStat label="Total debt" value={gbp(s.start_debt)} color={colors.ccBorder} />
            <ProjStat label="Interest paid" value={gbp(s.total_interest)} color={colors.dmpBorder} />
            <ProjStat label="Interest saved" value={gbp(saved)} color={colors.savingsBorder} bold />
            <ProjStat label="Months" value={String(dfree)} color={colors.white} />
          </View>
        </View>

        <View
          style={{
            marginTop: 16,
            backgroundColor: colors.savingsSoft,
            borderWidth: 1.5,
            borderColor: colors.savingsBorder,
            borderRadius: 14,
            padding: 16,
          }}
        >
          <Text
            style={[
              type.label,
              { fontSize: 10, color: colors.savings, letterSpacing: 1.5, marginBottom: 6 },
            ]}
          >
            Vs. paying minimums only
          </Text>
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: 26,
              fontWeight: '800',
              color: colors.savings,
              letterSpacing: -0.4,
            }}
          >
            You'll save {gbp(saved)}
          </Text>
          <Text style={{ fontSize: 12, color: colors.ink, marginTop: 4 }}>
            in interest by following this plan.
          </Text>
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: 24, paddingVertical: 16, backgroundColor: colors.paper }}>
        <PrimaryButton onPress={onNext}>Save my plan</PrimaryButton>
      </View>
    </View>
  );
}

function ProjStat({ label, value, color, bold }) {
  return (
    <View style={{ width: '50%', marginBottom: 12 }}>
      <Text
        style={{
          color: 'rgba(255,255,255,0.5)',
          fontSize: 9,
          fontWeight: '800',
          letterSpacing: 1.4,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: fonts.display,
          fontSize: bold ? 22 : 18,
          fontWeight: '800',
          color: color || colors.white,
          marginTop: 3,
          letterSpacing: -0.2,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

// ── Step 5: Save / Sign-in stub ───────────────────────────────────

function StepSave({ onFinish }) {
  const stub = (provider) =>
    Alert.alert(
      `${provider} sign-in`,
      'Cloud sync is coming in our next update. For now, your plan saves on this device.',
      [{ text: 'Continue locally', onPress: onFinish }]
    );

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
      >
        <Text style={{ fontSize: 48, textAlign: 'center', marginTop: 8 }}>🔒</Text>
        <ScreenTitle style={{ textAlign: 'center', marginTop: 16 }}>Save your plan</ScreenTitle>
        <Text
          style={{
            color: colors.muted,
            fontSize: 14,
            textAlign: 'center',
            marginBottom: 24,
            lineHeight: 20,
            paddingHorizontal: 12,
          }}
        >
          Optionally create an account to sync across devices, track progress, and get gentle
          reminders.
        </Text>

        <SignInButton provider="Apple"  icon=""  onPress={() => stub('Apple')}  bg={colors.ink} fg={colors.white} />
        <SignInButton provider="Google" icon="G" onPress={() => stub('Google')} bg={colors.white} fg={colors.ink} bordered />
        <SignInButton provider="Email"  icon="✉" onPress={() => stub('Email')}  bg={colors.white} fg={colors.ink} bordered />

        <TouchableOpacity onPress={onFinish} style={{ marginTop: 18, alignItems: 'center', paddingVertical: 12 }}>
          <Text style={{ fontSize: 14, color: colors.muted, fontWeight: '700' }}>Skip for now</Text>
        </TouchableOpacity>

        <Text
          style={{
            marginTop: 24,
            fontSize: 11,
            color: colors.muted,
            textAlign: 'center',
            lineHeight: 16,
            paddingHorizontal: 18,
          }}
        >
          Debt Freedom doesn't give financial advice. Always check the numbers against your
          statements.
        </Text>
      </ScrollView>
    </View>
  );
}

function SignInButton({ provider, icon, onPress, bg, fg, bordered }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: bg,
        borderRadius: radius.md,
        borderWidth: bordered ? 1.5 : 0,
        borderColor: colors.line,
        paddingVertical: 14,
        marginBottom: 10,
      }}
    >
      {icon ? <Text style={{ color: fg, fontSize: 18, marginRight: 10, fontWeight: '800' }}>{icon}</Text> : null}
      <Text style={{ color: fg, fontSize: 15, fontWeight: '700' }}>Continue with {provider}</Text>
    </TouchableOpacity>
  );
}

// ── Container ──────────────────────────────────────────────────────

export function OnboardingScreen({ onComplete }) {
  const [step, setStep] = useState(1);
  const [debts, setDebts] = useState([]);
  const [budget, setBudget] = useState(500);
  const [allowance, setAllowance] = useState(0);
  const [payday, setPayday] = useState(25);

  // Derive a complete plan object from the wizard state.
  const plan = useMemo(
    () => ({
      ...DEFAULT_PLAN,
      name: 'My Debt Freedom Plan',
      debts,
      goals: [],
      income: [],
      expenses: [],
      monthlyBudget: budget,
      allowanceYou: allowance,
      allowancePartner: 0,
      saveWhileInDebt: 0,
      payday,
    }),
    [debts, budget, allowance, payday]
  );

  const finish = () => onComplete(plan);

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <StepHeader step={step} total={5} onBack={() => setStep((s) => Math.max(1, s - 1))} />
      {step === 1 && <StepWelcome onNext={() => setStep(2)} />}
      {step === 2 && (
        <StepDebts debts={debts} setDebts={setDebts} onNext={() => setStep(3)} onBack={() => setStep(1)} />
      )}
      {step === 3 && (
        <StepBudget
          budget={budget}
          setBudget={setBudget}
          allowance={allowance}
          setAllowance={setAllowance}
          payday={payday}
          setPayday={setPayday}
          onNext={() => setStep(4)}
        />
      )}
      {step === 4 && <StepProjection plan={plan} onNext={() => setStep(5)} />}
      {step === 5 && <StepSave onFinish={finish} />}
    </View>
  );
}

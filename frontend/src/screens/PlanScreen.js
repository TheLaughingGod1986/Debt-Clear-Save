// PlanScreen.js — results dashboard. Ported subset of screens.jsx PlanScreen.
//
// In: projection (from engine), heroVariant ('dates'|'networth'|'journey'), onHero.
// Layout: kicker → title → Mission → Hero switcher → Hero → Mini roadmap →
//         Future snapshot → Future wealth → Goals → Debts → Budget breakdown.

import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { colors, type, radius, fonts, gbp, monthLabel, yearsMonths } from '../theme/theme';
import { LANE_PALETTE, laneFor } from '../theme/theme';
import {
  Kicker,
  ScreenTitle,
  SectionHead,
  GrowBar,
  SegmentBar,
  StatCard,
  Pill,
  MilestoneTimeline,
} from '../components/ui';

// ── Hero switcher ─────────────────────────────────────────────────

const HERO_VIEWS = [
  { value: 'dates', label: 'Dates' },
  { value: 'networth', label: 'Net worth' },
  { value: 'journey', label: 'Journey' },
];

function HeroSwitcher({ value, onChange }) {
  return (
    <View style={{ flexDirection: 'row', marginBottom: 10 }}>
      {HERO_VIEWS.map((v) => {
        const on = v.value === value;
        return (
          <TouchableOpacity
            key={v.value}
            onPress={() => onChange && onChange(v.value)}
            style={{
              flex: 1,
              marginHorizontal: 3,
              borderRadius: radius.pill,
              borderWidth: 1.5,
              borderColor: on ? colors.ink : colors.line,
              backgroundColor: on ? colors.ink : colors.white,
              paddingVertical: 7,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: on ? colors.white : colors.muted,
                fontSize: 11,
                fontWeight: on ? '800' : '700',
                letterSpacing: 0.2,
              }}
            >
              {v.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Mission card ──────────────────────────────────────────────────

function MissionCard({ projection }) {
  const s = projection.summary;
  const dfree = s.debt_free_month;
  const all = s.all_goals_met_month;
  const md = s.months_done;
  const remaining = dfree ? Math.max(0, dfree - md) : null;
  const subtitle = dfree
    ? `Debt-free in ${yearsMonths(remaining ?? dfree)} · everything done in ${yearsMonths(
        all || s.final_month
      )}`
    : 'Set a budget that covers your interest to start clearing debt.';
  return (
    <View
      style={{
        backgroundColor: colors.ink,
        borderRadius: 14,
        padding: 18,
      }}
    >
      <Text
        style={{
          color: 'rgba(255,255,255,0.55)',
          fontSize: 9.5,
          fontWeight: '800',
          letterSpacing: 1.6,
          textTransform: 'uppercase',
        }}
      >
        Your mission
      </Text>
      <Text
        style={{
          color: colors.white,
          fontFamily: fonts.display,
          fontSize: 26,
          fontWeight: '800',
          marginTop: 6,
          letterSpacing: -0.4,
        }}
      >
        {dfree ? `Free in ${yearsMonths(remaining ?? dfree)}` : 'Build your plan'}
      </Text>
      <Text style={{ color: 'rgba(255,255,255,0.78)', fontSize: 13, marginTop: 6, lineHeight: 19 }}>
        {subtitle}
      </Text>
      {dfree ? (
        <View
          style={{
            flexDirection: 'row',
            marginTop: 14,
            paddingTop: 14,
            borderTopWidth: 1,
            borderTopColor: 'rgba(255,255,255,0.12)',
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: 9.5,
                fontWeight: '800',
                letterSpacing: 1.4,
                textTransform: 'uppercase',
              }}
            >
              Debt free
            </Text>
            <Text
              style={{
                color: colors.white,
                fontFamily: fonts.display,
                fontSize: 18,
                fontWeight: '800',
                marginTop: 3,
              }}
            >
              {monthLabel(dfree)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: 9.5,
                fontWeight: '800',
                letterSpacing: 1.4,
                textTransform: 'uppercase',
              }}
            >
              Final saved
            </Text>
            <Text
              style={{
                color: colors.savingsBorder,
                fontFamily: fonts.display,
                fontSize: 18,
                fontWeight: '800',
                marginTop: 3,
              }}
            >
              {gbp(s.final_savings)}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

// ── Hero (dates | networth | journey) ─────────────────────────────

function HeroDates({ projection }) {
  const s = projection.summary;
  return (
    <View
      style={{
        backgroundColor: colors.white,
        borderWidth: 1.5,
        borderColor: colors.line,
        borderRadius: 14,
        padding: 16,
      }}
    >
      <Text style={[type.label, { fontSize: 10 }]}>Headline dates</Text>
      <View style={{ flexDirection: 'row', marginTop: 12, gap: 10 }}>
        <StatCard
          label="Debt free"
          value={s.debt_free_month ? monthLabel(s.debt_free_month) : '—'}
          sub={s.debt_free_month ? `Month ${s.debt_free_month}` : 'In progress'}
          color={colors.cc}
        />
        <View style={{ width: 10 }} />
        <StatCard
          label="All goals"
          value={s.all_goals_met_month ? monthLabel(s.all_goals_met_month) : '—'}
          sub={s.all_goals_met_month ? `Month ${s.all_goals_met_month}` : 'In progress'}
          color={colors.savings}
        />
      </View>
    </View>
  );
}

function HeroNetworth({ projection }) {
  const s = projection.summary;
  return (
    <View
      style={{
        backgroundColor: colors.savingsSoft,
        borderWidth: 1.5,
        borderColor: colors.savingsBorder,
        borderRadius: 14,
        padding: 16,
      }}
    >
      <Text style={[type.label, { fontSize: 10, color: colors.savings }]}>Net wealth shift</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 10 }}>
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: 14,
            fontWeight: '700',
            color: colors.muted,
            marginRight: 8,
          }}
        >
          {gbp(s.current_net)}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 14 }}>→</Text>
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: 30,
            fontWeight: '800',
            color: colors.savings,
            marginLeft: 8,
            letterSpacing: -0.4,
          }}
        >
          +{gbp(s.final_savings)}
        </Text>
      </View>
      <Text style={{ fontSize: 12, color: colors.ink, marginTop: 8 }}>
        Total improvement <Text style={{ fontWeight: '800' }}>{gbp(s.total_improvement)}</Text>
      </Text>
    </View>
  );
}

function HeroJourney({ projection }) {
  const s = projection.summary;
  return (
    <View
      style={{
        backgroundColor: colors.white,
        borderWidth: 1.5,
        borderColor: colors.line,
        borderRadius: 14,
        padding: 16,
      }}
    >
      <Text style={[type.label, { fontSize: 10 }]}>Journey progress</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 8 }}>
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: 36,
            fontWeight: '800',
            color: colors.ink,
            letterSpacing: -0.6,
          }}
        >
          {s.pct_complete}%
        </Text>
        <Text style={{ marginLeft: 8, color: colors.muted, fontSize: 12 }}>
          {s.months_done} / {s.final_month} months
        </Text>
      </View>
      <View style={{ marginTop: 10 }}>
        <GrowBar pct={s.pct_complete} color={colors.savings} height={10} />
      </View>
    </View>
  );
}

function Hero({ projection, variant }) {
  if (variant === 'networth') return <HeroNetworth projection={projection} />;
  if (variant === 'journey') return <HeroJourney projection={projection} />;
  return <HeroDates projection={projection} />;
}

// ── Mini roadmap (horizontal scroll) ──────────────────────────────

function MiniRoadmap({ projection }) {
  const s = projection.summary;
  const md = s.months_done;
  const steps = [];
  if (s.debt_free_month) steps.push({ label: 'Debt free', month: s.debt_free_month, color: colors.cc });
  if (s.net_positive_month)
    steps.push({ label: 'Net worth positive', month: s.net_positive_month, color: colors.gold });
  projection.goals
    .filter((g) => g.metMonth)
    .forEach((g) => steps.push({ label: g.name, month: g.metMonth, color: colors.savings }));
  steps.sort((a, b) => a.month - b.month);
  if (!steps.length) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingVertical: 2, paddingBottom: 8 }}
    >
      {steps.map((st, i) => {
        const reached = md >= st.month;
        return (
          <View
            key={i}
            style={{
              width: 150,
              marginRight: 10,
              backgroundColor: reached ? st.color : colors.white,
              borderWidth: 1.5,
              borderColor: reached ? st.color : colors.line,
              borderRadius: 12,
              padding: 13,
            }}
          >
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: reached ? 'rgba(255,255,255,0.85)' : st.color,
                }}
              />
              {reached ? (
                <Text style={{ color: colors.white, fontWeight: '900', fontSize: 11 }}>✓</Text>
              ) : null}
            </View>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '800',
                marginTop: 9,
                color: reached ? colors.white : colors.ink,
                lineHeight: 16,
              }}
            >
              {st.label}
            </Text>
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: reached ? 'rgba(255,255,255,0.8)' : colors.ink,
                marginTop: 4,
              }}
            >
              {monthLabel(st.month)}
            </Text>
            <Text
              style={{
                fontSize: 9.5,
                fontWeight: '700',
                color: reached ? 'rgba(255,255,255,0.6)' : colors.muted,
                marginTop: 1,
                letterSpacing: 0.4,
              }}
            >
              Month {st.month}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

// ── Future snapshot ───────────────────────────────────────────────

function FutureSnapshotCard({ projection }) {
  const s = projection.summary;
  const rows = [];
  if (s.debt_free_month)
    rows.push({ month: s.debt_free_month, label: 'Debt free', color: colors.cc });
  projection.goals
    .filter((g) => g.metMonth)
    .sort((a, b) => a.metMonth - b.metMonth)
    .forEach((g) =>
      rows.push({ month: g.metMonth, label: `${gbp(g.target)} ${g.name}`, color: colors.savings })
    );
  if (s.final_month)
    rows.push({
      month: s.final_month,
      label: `${gbp(s.final_savings)} saved`,
      color: colors.savings,
      strong: true,
    });
  if (!rows.length) return null;
  return (
    <View style={{ backgroundColor: colors.ink, borderRadius: 14, padding: 18 }}>
      <Text
        style={{
          color: 'rgba(255,255,255,0.55)',
          fontSize: 9.5,
          fontWeight: '800',
          letterSpacing: 1.8,
          textTransform: 'uppercase',
          marginBottom: 12,
        }}
      >
        Your future
      </Text>
      {rows.map((r, i) => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            alignItems: 'baseline',
            paddingVertical: 7,
            borderTopWidth: i > 0 ? 1 : 0,
            borderTopColor: 'rgba(255,255,255,0.1)',
          }}
        >
          <Text
            style={{
              width: 86,
              fontFamily: fonts.display,
              fontSize: 16,
              fontWeight: '800',
              color: colors.white,
            }}
          >
            {monthLabel(r.month)}
          </Text>
          <View
            style={{
              width: 7,
              height: 7,
              borderRadius: 3.5,
              backgroundColor: r.color,
              marginHorizontal: 8,
            }}
          />
          <Text
            style={{
              flex: 1,
              fontSize: 13,
              fontWeight: r.strong ? '800' : '600',
              color: r.strong ? colors.white : 'rgba(255,255,255,0.88)',
            }}
          >
            {r.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ── Future wealth ─────────────────────────────────────────────────

function FutureWealthCard({ summary }) {
  const Row = ({ label, value, color }) => (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        paddingVertical: 5,
      }}
    >
      <Text style={{ fontSize: 12.5, color: colors.muted }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: '800', color: color || colors.ink }}>{value}</Text>
    </View>
  );
  return (
    <View
      style={{
        backgroundColor: colors.savingsSoft,
        borderWidth: 1.5,
        borderColor: colors.savingsBorder,
        borderRadius: 12,
        padding: 16,
      }}
    >
      <Row label="Today" value={gbp(summary.current_net)} color={colors.cc} />
      <Row label="Debt free" value={gbp(0)} />
      <Row label="Future savings" value={gbp(summary.final_savings)} color={colors.savings} />
      <View
        style={{
          borderTopWidth: 1.5,
          borderTopColor: colors.savingsBorder,
          marginTop: 6,
          paddingTop: 9,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: '800',
            letterSpacing: 0.4,
            textTransform: 'uppercase',
            color: colors.savings,
          }}
        >
          Future wealth
        </Text>
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: 22,
            fontWeight: '800',
            color: colors.savings,
            letterSpacing: -0.2,
          }}
        >
          +{gbp(summary.total_improvement)}
        </Text>
      </View>
    </View>
  );
}

// ── Interest saved ───────────────────────────────────────────────

function InterestSavedCard({ summary }) {
  const saved = Math.max(
    0,
    (summary.interest_without_plan || 0) - (summary.total_interest || 0)
  );
  const Row = ({ label, value, color }) => (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        paddingVertical: 5,
      }}
    >
      <Text style={{ fontSize: 12.5, color: colors.muted }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: '800', color: color || colors.ink }}>{value}</Text>
    </View>
  );
  return (
    <View
      style={{
        backgroundColor: colors.white,
        borderWidth: 1.5,
        borderColor: colors.line,
        borderRadius: 12,
        padding: 16,
      }}
    >
      <Row label="Interest under your plan" value={gbp(summary.total_interest)} color={colors.cc} />
      <Row label="Paying minimums only" value={gbp(summary.interest_without_plan)} />
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: colors.line,
          marginTop: 6,
          paddingTop: 9,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '800',
              letterSpacing: 0.4,
              textTransform: 'uppercase',
              color: colors.savings,
            }}
          >
            Interest saved
          </Text>
          <Text style={{ fontSize: 10.5, color: colors.muted, marginTop: 2 }}>
            by following your plan
          </Text>
        </View>
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: 26,
            fontWeight: '800',
            color: colors.savings,
          }}
        >
          {gbp(saved)}
        </Text>
      </View>
    </View>
  );
}

// ── Budget breakdown ──────────────────────────────────────────────

function BudgetBreakdown({ summary }) {
  const m = summary.monthly;
  const available = Math.max(0, m.income - m.expenses - m.debt - m.savings);
  const segs = [
    { value: m.expenses, color: colors.dmp, label: 'Living expenses' },
    { value: m.debt, color: colors.cc, label: 'Debt payments' },
    { value: m.savings, color: colors.savings, label: 'Savings' },
    { value: available, color: colors.line, label: 'Available' },
  ];
  const Leg = ({ color, label, value }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4 }}>
      <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: color, marginRight: 8 }} />
      <Text style={{ flex: 1, fontSize: 12.5, color: colors.ink }}>{label}</Text>
      <Text style={{ fontSize: 12.5, fontWeight: '800', color: colors.ink }}>{value}</Text>
    </View>
  );
  return (
    <View
      style={{
        backgroundColor: colors.white,
        borderWidth: 1.5,
        borderColor: colors.line,
        borderRadius: 10,
        padding: 14,
      }}
    >
      <View
        style={{
          backgroundColor: colors.savingsSoft,
          borderWidth: 1.5,
          borderColor: colors.savingsBorder,
          borderRadius: 10,
          padding: 14,
          marginBottom: 14,
        }}
      >
        <Text style={[type.label, { fontSize: 9.5, color: colors.savings, letterSpacing: 1.4 }]}>
          Future savings capacity
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 3 }}>
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: 30,
              fontWeight: '800',
              color: colors.ink,
              letterSpacing: -0.4,
            }}
          >
            {gbp(m.income - m.expenses)}
          </Text>
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.muted, marginLeft: 6 }}>
            /mo
          </Text>
        </View>
        <Text style={{ fontSize: 11.5, color: colors.ink, marginTop: 6, lineHeight: 16 }}>
          Every debt payment becomes future savings.
        </Text>
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 10,
        }}
      >
        <Text style={[type.label, { fontSize: 11, letterSpacing: 0.4 }]}>Income today</Text>
        <Text
          style={{ fontFamily: fonts.display, fontSize: 18, fontWeight: '800', color: colors.ink }}
        >
          {gbp(m.income)}
        </Text>
      </View>
      <SegmentBar segments={segs} />
      <View style={{ marginTop: 10 }}>
        <Leg color={colors.dmp} label="Living expenses" value={gbp(m.expenses)} />
        <Leg color={colors.cc} label="Debt payments" value={gbp(m.debt)} />
        <Leg color={colors.savings} label="Savings" value={gbp(m.savings)} />
        {available > 0 ? <Leg color={colors.line} label="Available" value={gbp(available)} /> : null}
      </View>
    </View>
  );
}

// ── Debts list ────────────────────────────────────────────────────

function DebtOrderList({ projection }) {
  const strat = projection.summary.strategy;
  const ordered = [...projection.debts].sort((a, b) =>
    strat === 'snowball' ? a.start - b.start : b.apr - a.apr
  );
  const idxOf = {};
  projection.plan.debts.forEach((d, i) => {
    idxOf[d.id] = i;
  });

  return (
    <View>
      {ordered.map((d, rank) => {
        const lane = laneFor(idxOf[d.id] ?? rank);
        const pct = Math.round(d.paidOffPct * 100);
        const done = d.current <= 0.5;
        const accent = done ? colors.savings : lane.solid;
        const soft = done ? colors.savingsSoft : colors.white;
        const border = done ? colors.savingsBorder : colors.line;
        return (
          <View
            key={d.id}
            style={{
              backgroundColor: soft,
              borderWidth: 1.5,
              borderColor: border,
              borderLeftWidth: 4,
              borderLeftColor: accent,
              borderRadius: radius.md,
              padding: 14,
              marginBottom: 8,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <View
                style={{
                  minWidth: 24,
                  height: 20,
                  paddingHorizontal: 6,
                  backgroundColor: accent,
                  borderRadius: 6,
                  marginRight: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: colors.white, fontSize: 11, fontWeight: '800' }}>
                  #{rank + 1}
                </Text>
              </View>
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: colors.ink }}>
                {done ? '✓ ' : ''}
                {d.name || 'Untitled debt'}
              </Text>
              <Text style={{ fontSize: 10.5, fontWeight: '800', color: accent }}>
                {d.apr ? `${d.apr}%` : '0%'} APR
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 7,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.display,
                  fontSize: 18,
                  fontWeight: '800',
                  color: colors.ink,
                }}
              >
                {done ? 'Cleared' : `${gbp(d.current)} remaining`}
              </Text>
              <Text style={{ fontSize: 11, fontWeight: '800', color: accent }}>
                {pct}% paid off
              </Text>
            </View>
            <GrowBar pct={pct} color={accent} track={done ? colors.white : lane.soft} delay={rank * 80} />
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: 7,
              }}
            >
              <Text style={{ fontSize: 10.5, color: colors.muted }}>
                of {gbp(d.original)} started
              </Text>
              <Text
                style={{
                  fontSize: 10.5,
                  fontWeight: '700',
                  color: done ? colors.savings : colors.ink,
                }}
              >
                {done
                  ? `Paid off ${monthLabel(d.clearedMonth)}`
                  : d.clearedMonth
                  ? `Clears in ${d.monthsToClear} mo · ${monthLabel(d.clearedMonth)}`
                  : 'Not cleared'}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ── Goals list ────────────────────────────────────────────────────

function GoalProgressList({ projection }) {
  const md = projection.summary.months_done;
  const snap =
    md > 0 ? projection.rows[Math.min(md, projection.rows.length) - 1].goalsSnapshot : null;
  return (
    <View>
      {projection.goals.map((g, i) => {
        const savedNow = snap ? snap.find((x) => x.id === g.id)?.saved || 0 : 0;
        const pct = g.target > 0 ? Math.round((savedNow / g.target) * 100) : 100;
        const completed = g.metMonth && md >= g.metMonth;
        if (completed) {
          return (
            <View
              key={g.id}
              style={{
                backgroundColor: colors.savingsSoft,
                borderWidth: 1.5,
                borderColor: colors.savingsBorder,
                borderRadius: radius.md,
                padding: 14,
                marginBottom: 8,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: colors.savings,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}
              >
                <Text style={{ color: colors.white, fontSize: 14, fontWeight: '900' }}>✓</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink }}>
                  {g.name} complete
                </Text>
                <Text style={{ fontSize: 11, color: colors.savings, fontWeight: '600' }}>
                  {gbp(g.target)} saved · {monthLabel(g.metMonth)}
                </Text>
              </View>
            </View>
          );
        }
        return (
          <View
            key={g.id}
            style={{
              backgroundColor: colors.white,
              borderWidth: 1.5,
              borderColor: colors.line,
              borderRadius: radius.md,
              padding: 14,
              marginBottom: 8,
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
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink }}>
                {g.name || 'Untitled goal'}
              </Text>
              <Text style={{ fontSize: 11, fontWeight: '800', color: colors.savings }}>
                {pct}%
              </Text>
            </View>
            <GrowBar pct={pct} color={colors.savings} track={colors.savingsSoft} delay={i * 80} />
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: 7,
              }}
            >
              <Text style={{ fontSize: 11, color: colors.muted }}>
                {gbp(savedNow)} / {gbp(g.target)}
              </Text>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.ink }}>
                {g.metMonth ? `Done ${monthLabel(g.metMonth)}` : '—'}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────

export function PlanScreen({ projection, heroVariant, onHero }) {
  const { plan, summary } = projection;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.paper }}
      contentContainerStyle={{ padding: 24, paddingBottom: 96 }}
    >
      <Kicker>{summary.everything_done ? `Your ${summary.final_month}-month plan` : 'Your future'}</Kicker>
      <ScreenTitle>{plan.name || 'Our Plan'}</ScreenTitle>

      <View style={{ marginBottom: 14 }}>
        <MissionCard projection={projection} />
      </View>

      <HeroSwitcher value={heroVariant} onChange={onHero} />
      <View style={{ marginBottom: 14 }}>
        <Hero projection={projection} variant={heroVariant} />
      </View>

      <Text style={[type.label, { fontSize: 10, letterSpacing: 1.5, marginBottom: 10 }]}>
        The road ahead
      </Text>
      <MiniRoadmap projection={projection} />

      <View style={{ marginTop: 16 }}>
        <FutureSnapshotCard projection={projection} />
      </View>

      <SectionHead>Your future wealth</SectionHead>
      <FutureWealthCard summary={summary} />
      <View style={{ marginTop: 8 }}>
        <InterestSavedCard summary={summary} />
      </View>

      <SectionHead right={`${projection.goals.length} goals`}>Savings goals</SectionHead>
      <GoalProgressList projection={projection} />

      <SectionHead right={summary.strategy === 'avalanche' ? 'Avalanche' : 'Snowball'}>
        Debt accounts
      </SectionHead>
      <DebtOrderList projection={projection} />

      <SectionHead>Where your money goes</SectionHead>
      <BudgetBreakdown summary={summary} />
    </ScrollView>
  );
}

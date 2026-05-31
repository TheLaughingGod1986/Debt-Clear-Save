// TrackerScreen.js — month-by-month tick-off with overpayments.
// Ported subset of screens.jsx TrackerScreen + MonthCard.

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { colors, type, radius, fonts, gbp, monthLabel } from '../theme/theme';
import { Kicker, ScreenTitle, GrowBar } from '../components/ui';

const friendlyLabel = (label) =>
  (label || '')
    .replace(/✓/g, '')
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

function milestoneMeta(kind) {
  switch (kind) {
    case 'debt_free':
      return { icon: '🎉', bg: colors.ink, border: colors.ink, color: colors.white, dark: true };
    case 'all_goals':
      return { icon: '👑', bg: colors.savings, border: colors.savings, color: colors.white, dark: true };
    case 'net_positive':
      return { icon: '✨', bg: '#fffbeb', border: colors.dmpBorder, color: colors.dmp };
    case 'goal_met':
      return { icon: '🛡', bg: colors.savingsSoft, border: colors.savingsBorder, color: colors.savings };
    case 'debt_cleared':
      return { icon: '🔓', bg: colors.ccSoft, border: colors.ccBorder, color: colors.cc };
    default:
      return null;
  }
}

function ProgressHero({ summary }) {
  const done = summary.months_done;
  const total = summary.final_month;
  const remaining = Math.max(0, total - done);
  const pct = summary.pct_complete;
  return (
    <View
      style={{
        backgroundColor: colors.white,
        borderWidth: 1.5,
        borderColor: colors.line,
        borderRadius: 14,
        padding: 16,
        marginBottom: 14,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: 34,
            fontWeight: '800',
            color: colors.ink,
            letterSpacing: -0.4,
          }}
        >
          {pct}%
        </Text>
        <Text style={[type.label, { fontSize: 11, letterSpacing: 0.4 }]}>Complete</Text>
      </View>
      <View style={{ marginVertical: 12 }}>
        <GrowBar pct={pct} height={10} color={colors.savings} track={colors.lineSoft} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 12, color: colors.muted }}>
          <Text style={{ color: colors.ink, fontWeight: '800' }}>{done}</Text> of {total} months done
        </Text>
        <Text style={{ fontSize: 12, color: colors.muted }}>{remaining} to go</Text>
      </View>
    </View>
  );
}

function ThisMonthCard({ projection }) {
  const { rows } = projection;
  const next = rows.find((r) => !r.done);
  if (!next) return null;
  const meta = next.milestone ? milestoneMeta(next.milestone.kind) : null;
  const bg = meta ? meta.bg : colors.ink;
  const dark = !meta || meta.dark;
  return (
    <View style={{ backgroundColor: bg, borderRadius: 14, padding: 18, marginBottom: 14 }}>
      <Text
        style={{
          color: dark ? 'rgba(255,255,255,0.55)' : meta.color,
          fontSize: 9.5,
          fontWeight: '800',
          letterSpacing: 1.8,
          textTransform: 'uppercase',
        }}
      >
        This month
      </Text>
      <Text
        style={{
          fontFamily: fonts.display,
          fontSize: 22,
          fontWeight: '800',
          color: dark ? colors.white : colors.ink,
          marginTop: 6,
        }}
      >
        Month {next.month} · {monthLabel(next.month)}
      </Text>
      {next.focus ? (
        <Text
          style={{
            fontSize: 13,
            color: dark ? 'rgba(255,255,255,0.85)' : colors.ink,
            marginTop: 6,
          }}
        >
          Focus: <Text style={{ fontWeight: '800' }}>{next.focus}</Text>
        </Text>
      ) : null}
      {next.milestone ? (
        <View
          style={{
            alignSelf: 'flex-start',
            marginTop: 10,
            backgroundColor: dark ? 'rgba(255,255,255,0.16)' : colors.white,
            paddingVertical: 4,
            paddingHorizontal: 9,
            borderRadius: radius.pill,
          }}
        >
          <Text
            style={{
              color: dark ? colors.white : meta.color,
              fontSize: 11,
              fontWeight: '800',
            }}
          >
            {meta?.icon} {friendlyLabel(next.milestone.label)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function Fig({ label, value, color, bold }) {
  return (
    <View style={{ flex: 1 }}>
      <Text
        style={{
          fontSize: 9,
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          color: colors.muted,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: 13,
          fontWeight: bold ? '800' : '600',
          color: color || colors.ink,
          marginTop: 1,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function MonthCard({ row, overpay, onToggle, onOverpay }) {
  const meta = row.milestone ? milestoneMeta(row.milestone.kind) : null;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(overpay || ''));
  const commit = (v) => {
    onOverpay && onOverpay(row.month, Number(v) || 0);
    setEditing(false);
  };

  const dark = meta && meta.dark;
  const cardBg = meta ? meta.bg : row.done ? colors.savingsSoft : colors.white;
  const cardBorder = meta
    ? meta.border
    : overpay > 0
    ? colors.equityBorder
    : row.done
    ? colors.savingsBorder
    : colors.line;
  const titleColor = dark ? colors.white : colors.ink;
  const badgeLabel = row.milestone ? friendlyLabel(row.milestone.label) : null;

  return (
    <View
      style={{
        backgroundColor: cardBg,
        borderWidth: 1.5,
        borderColor: cardBorder,
        borderRadius: radius.md,
        padding: 14,
        marginBottom: 8,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '800',
              color: titleColor,
              marginRight: 8,
            }}
          >
            Month {row.month}
          </Text>
          {badgeLabel ? (
            <View
              style={{
                backgroundColor: dark ? 'rgba(255,255,255,0.16)' : meta.bg,
                borderWidth: dark ? 0 : 1,
                borderColor: meta?.border,
                paddingVertical: 3,
                paddingHorizontal: 8,
                borderRadius: radius.pill,
                marginRight: 6,
                marginTop: 2,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '800',
                  letterSpacing: 0.2,
                  color: dark ? colors.white : meta.color,
                }}
              >
                {meta.icon} {badgeLabel}
              </Text>
            </View>
          ) : null}
          {overpay > 0 ? (
            <View
              style={{
                backgroundColor: dark ? 'rgba(255,255,255,0.16)' : colors.equitySoft,
                paddingVertical: 3,
                paddingHorizontal: 7,
                borderRadius: radius.pill,
                marginTop: 2,
              }}
            >
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: '800',
                  color: dark ? colors.white : colors.equity,
                }}
              >
                +{gbp(overpay)} EXTRA
              </Text>
            </View>
          ) : null}
        </View>
        <TouchableOpacity
          onPress={() => onToggle && onToggle(row)}
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            borderWidth: 2.5,
            borderColor: row.done
              ? dark
                ? colors.white
                : colors.savings
              : dark
              ? 'rgba(255,255,255,0.5)'
              : colors.ink,
            backgroundColor: row.done ? (dark ? colors.white : colors.savings) : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {row.done ? (
            <Text
              style={{
                color: dark ? colors.ink : colors.white,
                fontSize: 14,
                fontWeight: '900',
                lineHeight: 14,
              }}
            >
              ✓
            </Text>
          ) : null}
        </TouchableOpacity>
      </View>

      {row.done ? (
        <View style={{ flexDirection: 'row' }}>
          <Fig
            label="Debt reduced"
            value={row.debtPaid ? gbp(row.debtPaid) : '—'}
            color={dark ? 'rgba(255,255,255,0.9)' : colors.cc}
          />
          <Fig
            label="Interest paid"
            value={gbp(row.interest)}
            color={dark ? 'rgba(255,255,255,0.9)' : colors.dmp}
          />
          <Fig
            label="Saved"
            value={gbp(row.save)}
            color={dark ? colors.white : colors.savings}
            bold
          />
        </View>
      ) : (
        <View>
          {row.focus ? (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                paddingVertical: 2,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  letterSpacing: 0.6,
                  textTransform: 'uppercase',
                  color: colors.muted,
                }}
              >
                Current focus
              </Text>
              <Text style={{ fontSize: 13, fontWeight: '800', color: colors.cc }}>{row.focus}</Text>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            <Fig
              label="Debt remaining"
              value={gbp(row.debtLeft)}
              color={row.debtLeft > 0.5 ? colors.cc : colors.muted}
            />
            <Fig label="Projected saved" value={gbp(row.savingsTotal)} color={colors.savings} bold />
          </View>
        </View>
      )}

      <View
        style={{
          marginTop: 12,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: dark
            ? 'rgba(255,255,255,0.18)'
            : row.done
            ? colors.savingsBorder
            : colors.lineSoft,
        }}
      >
        {!editing ? (
          <TouchableOpacity onPress={() => setEditing(true)}>
            <Text
              style={{
                fontSize: 12.5,
                fontWeight: '800',
                color: dark ? colors.white : colors.equity,
              }}
            >
              {overpay > 0
                ? `Edit extra payment (+${gbp(overpay)})`
                : 'Make extra payment · see impact →'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View>
            <View style={{ flexDirection: 'row', marginBottom: 10 }}>
              {[100, 250, 500].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  onPress={() => commit((Number(overpay) || 0) + amt)}
                  style={{
                    flex: 1,
                    marginHorizontal: 3,
                    borderRadius: 9,
                    borderWidth: 1.5,
                    borderColor: colors.equityBorder,
                    backgroundColor: colors.equitySoft,
                    paddingVertical: 9,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '800', color: colors.ink }}>
                    +{gbp(amt)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.white,
                  borderWidth: 1.5,
                  borderColor: colors.ink,
                  borderRadius: 8,
                  paddingHorizontal: 10,
                }}
              >
                <Text style={{ color: colors.muted, fontSize: 14, marginRight: 3 }}>£</Text>
                <TextInput
                  value={draft}
                  onChangeText={(t) => setDraft(t.replace(/[^0-9.]/g, ''))}
                  onSubmitEditing={() => commit(draft)}
                  placeholder="Custom amount"
                  keyboardType="decimal-pad"
                  style={{
                    flex: 1,
                    paddingVertical: 9,
                    fontSize: 14,
                    color: colors.ink,
                    fontWeight: '700',
                  }}
                />
              </View>
              <TouchableOpacity
                onPress={() => commit(draft)}
                style={{
                  marginLeft: 8,
                  backgroundColor: colors.ink,
                  borderRadius: 8,
                  paddingVertical: 9,
                  paddingHorizontal: 14,
                }}
              >
                <Text style={{ color: colors.white, fontSize: 13, fontWeight: '700' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

export function TrackerScreen({ projection, onToggleMonth, onOverpay }) {
  const { rows, summary } = projection;
  const overpayments = projection.plan.overpayments || {};
  const done = summary.months_done;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.paper }}
      contentContainerStyle={{ padding: 24, paddingBottom: 96 }}
    >
      <Kicker>Monthly tracking</Kicker>
      <ScreenTitle>Tracker</ScreenTitle>

      <ProgressHero summary={summary} />
      <ThisMonthCard projection={projection} />

      {summary.overpay_total > 0 ? (
        <View
          style={{
            marginBottom: 14,
            backgroundColor: colors.equitySoft,
            borderWidth: 1.5,
            borderColor: colors.equityBorder,
            borderRadius: radius.md,
            padding: 12,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 12, color: colors.equity, fontWeight: '700' }}>
            Extra payments booked
          </Text>
          <Text style={{ fontSize: 14, fontWeight: '800', color: colors.equity }}>
            +{gbp(summary.overpay_total)}
          </Text>
        </View>
      ) : null}

      <Text style={[type.label, { fontSize: 10, letterSpacing: 1.5, marginBottom: 10 }]}>
        {done > 0
          ? `${done} done · ${monthLabel(summary.next_action_month || summary.final_month)} next`
          : 'Tick each month as you go'}
      </Text>

      {rows.map((row) => (
        <MonthCard
          key={row.month}
          row={row}
          overpay={Number(overpayments[row.month]) || 0}
          onToggle={onToggleMonth}
          onOverpay={onOverpay}
        />
      ))}
    </ScrollView>
  );
}

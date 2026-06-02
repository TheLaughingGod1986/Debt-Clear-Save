// ui.js — shared design-system primitives for React Native.
// Ported from the design package's ui-primitives.jsx (web/HTML prototype).

import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Animated,
  Easing,
} from 'react-native';
import { colors, type, radius, fonts } from '../theme/theme';

// ── Type ───────────────────────────────────────────────────────────

export function Kicker({ children, style }) {
  return <Text style={[type.kicker, { marginBottom: 4 }, style]}>{children}</Text>;
}

export function ScreenTitle({ children, style }) {
  return <Text style={[type.h1, { marginBottom: 16 }, style]}>{children}</Text>;
}

export function SectionHead({ children, right }) {
  return (
    <View style={{ marginTop: 24, marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Text style={[type.label, { letterSpacing: 1.5 }]}>{children}</Text>
        {right ? (
          <Text style={[type.label, { letterSpacing: 0.5 }]}>{right}</Text>
        ) : null}
      </View>
      <View style={{ height: 1, backgroundColor: colors.line, marginTop: 6 }} />
    </View>
  );
}

// ── Cards ──────────────────────────────────────────────────────────

export function StatCard({ label, value, sub, color, border, bg, big, style }) {
  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: bg || colors.white,
          borderWidth: 1.5,
          borderColor: border || colors.line,
          borderRadius: radius.md,
          padding: 14,
        },
        style,
      ]}
    >
      <Text style={[type.label, { fontSize: 9, letterSpacing: 1.4 }]}>{label}</Text>
      <Text
        style={{
          fontFamily: fonts.display,
          fontSize: big ? 28 : 22,
          fontWeight: '800',
          color: color || colors.ink,
          marginTop: 4,
          letterSpacing: -0.2,
        }}
      >
        {value}
      </Text>
      {sub ? <Text style={[type.mini, { marginTop: 3 }]}>{sub}</Text> : null}
    </View>
  );
}

// ── Progress ───────────────────────────────────────────────────────

export function MiniBar({ pct, color, track, height = 7 }) {
  const c = Math.max(0, Math.min(100, pct || 0));
  return (
    <View
      style={{
        height,
        backgroundColor: track || colors.lineSoft,
        borderRadius: radius.pill,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          height: '100%',
          width: `${c}%`,
          backgroundColor: color || colors.ink,
          borderRadius: radius.pill,
        }}
      />
    </View>
  );
}

// Animated grow bar (0 → pct on mount).
export function GrowBar({ pct, color, track, height = 8, delay = 0 }) {
  const target = Math.max(0, Math.min(100, pct || 0));
  const anim = React.useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: target,
      duration: 800,
      delay: 60 + delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [target, delay]);
  const width = anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  return (
    <View
      style={{
        height,
        backgroundColor: track || colors.lineSoft,
        borderRadius: radius.pill,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={{
          height: '100%',
          width,
          backgroundColor: color || colors.ink,
          borderRadius: radius.pill,
        }}
      />
    </View>
  );
}

// Horizontal segmented allocation bar.
export function SegmentBar({ segments, height = 16 }) {
  const total = segments.reduce((s, x) => s + (x.value || 0), 0) || 1;
  return (
    <View
      style={{
        flexDirection: 'row',
        height,
        borderRadius: radius.pill,
        overflow: 'hidden',
        backgroundColor: colors.lineSoft,
      }}
    >
      {segments.map(
        (s, i) =>
          s.value > 0 && (
            <View
              key={i}
              style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color }}
            />
          )
      )}
    </View>
  );
}

// ── Buttons ────────────────────────────────────────────────────────

export function PrimaryButton({ children, onPress, disabled, style }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          backgroundColor: colors.ink,
          borderRadius: radius.md,
          paddingVertical: 15,
          paddingHorizontal: 20,
          opacity: disabled ? 0.6 : pressed ? 0.7 : 1,
          alignItems: 'center',
        },
        style,
      ]}
    >
      <Text style={{ color: colors.white, fontSize: 15, fontWeight: '700' }}>{children}</Text>
    </Pressable>
  );
}

export function GhostButton({ children, onPress, style }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: colors.line,
          borderRadius: radius.md,
          paddingVertical: 13,
          paddingHorizontal: 16,
          alignItems: 'center',
        },
        style,
      ]}
    >
      <Text style={{ color: colors.ink, fontSize: 14, fontWeight: '700' }}>{children}</Text>
    </TouchableOpacity>
  );
}

export function Segmented({ value, options, onChange }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.lineSoft,
        borderRadius: radius.md,
        padding: 3,
      }}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <TouchableOpacity
            key={o.value}
            onPress={() => onChange(o.value)}
            style={{
              flex: 1,
              marginHorizontal: 1.5,
              borderRadius: 8,
              paddingVertical: 9,
              paddingHorizontal: 6,
              backgroundColor: on ? colors.white : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: on ? '800' : '600',
                color: on ? colors.ink : colors.muted,
              }}
            >
              {o.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Pills + Chips ─────────────────────────────────────────────────

export function Pill({ children, color, bg, border, style }) {
  return (
    <View
      style={[
        {
          alignSelf: 'flex-start',
          backgroundColor: bg || colors.savingsSoft,
          paddingVertical: 3,
          paddingHorizontal: 9,
          borderRadius: radius.pill,
          borderWidth: border ? 1 : 0,
          borderColor: border,
        },
        style,
      ]}
    >
      <Text style={{ color: color || colors.savings, fontSize: 10, fontWeight: '800', letterSpacing: 0.3 }}>
        {children}
      </Text>
    </View>
  );
}

// ── Tabs ───────────────────────────────────────────────────────────

export const DCS_TABS = [
  { key: 'plan',     label: 'Plan',     icon: '◎' },
  { key: 'tracker',  label: 'Tracker',  icon: '☑' },
  { key: 'awards',   label: 'Awards',   icon: '★' },
  { key: 'settings', label: 'Settings', icon: '⚙' },
];

export function TabBar({ tab, onTab }) {
  return (
    <View
      style={{
        backgroundColor: colors.white,
        borderTopWidth: 1,
        borderTopColor: colors.line,
        paddingTop: 8,
        paddingBottom: 6,
        flexDirection: 'row',
      }}
    >
      {DCS_TABS.map((t) => {
        const on = tab === t.key;
        return (
          <TouchableOpacity
            key={t.key}
            onPress={() => onTab(t.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${t.label} tab`}
            style={{ flex: 1, alignItems: 'center' }}
          >
            <Text style={{ fontSize: 20, color: on ? colors.ink : colors.muted, lineHeight: 22 }}>
              {t.icon}
            </Text>
            <Text
              style={{
                fontSize: 11,
                fontWeight: on ? '700' : '600',
                color: on ? colors.ink : colors.muted,
                marginTop: 2,
              }}
            >
              {t.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Milestone Timeline ────────────────────────────────────────────

export function MilestoneTimeline({ items }) {
  return (
    <View>
      {items.map((it, i) => (
        <View key={i} style={{ flexDirection: 'row' }}>
          <View style={{ width: 40, alignItems: 'center' }}>
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                borderWidth: 2.5,
                borderColor: it.color,
                backgroundColor: it.filled ? it.color : colors.white,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  color: it.filled ? colors.white : it.color,
                  fontSize: (it.dot || '').length > 2 ? 9 : 11,
                  fontWeight: '800',
                }}
              >
                {it.dot}
              </Text>
            </View>
            {i < items.length - 1 && (
              <View style={{ width: 2.5, flex: 1, minHeight: 18, backgroundColor: colors.line }} />
            )}
          </View>
          <View style={{ flex: 1, paddingBottom: 16, paddingTop: 4, paddingLeft: 14 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'baseline',
              }}
            >
              <Text
                style={{
                  flex: 1,
                  fontSize: 13,
                  fontWeight: '700',
                  color: it.color || colors.ink,
                }}
              >
                {it.title}
              </Text>
              {it.when ? (
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.muted, marginLeft: 8 }}>
                  {it.when}
                </Text>
              ) : null}
            </View>
            {it.chip ? (
              <View style={{ marginTop: 5 }}>
                <Pill>{it.chip}</Pill>
              </View>
            ) : null}
            <Text style={[type.mini, { marginTop: it.chip ? 4 : 2, lineHeight: 16 }]}>
              {it.sub}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ── ComingSoon pill ───────────────────────────────────────────────
// A small consistent pill for any feature that needs a backend.
// Gold dot + "Coming soon" text — used across onboarding, settings, etc.

export function ComingSoon({ label = 'Coming soon', style }) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          backgroundColor: colors.lineSoft,
          borderWidth: 1,
          borderColor: colors.line,
          paddingVertical: 3,
          paddingHorizontal: 9,
          borderRadius: radius.pill,
        },
        style,
      ]}
    >
      <View
        style={{
          width: 5,
          height: 5,
          borderRadius: 2.5,
          backgroundColor: colors.gold,
          marginRight: 5,
        }}
      />
      <Text
        style={{
          fontFamily: undefined,
          fontSize: 9,
          fontWeight: '800',
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          color: colors.muted,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

// ── Avatar ────────────────────────────────────────────────────────

export function Avatar({ name, color, size = 26 }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?';
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: colors.white,
      }}
    >
      <Text style={{ color: colors.white, fontSize: size * 0.42, fontWeight: '800' }}>
        {initial}
      </Text>
    </View>
  );
}


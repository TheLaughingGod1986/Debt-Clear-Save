// Celebration.js — animated modal shown when the user ticks a milestone month.
// Engine emits row.milestone = { kind, label, debtId?, goalId? }. The App layer
// passes a Celebration event object — { icon, color, title, sub, stats[] }.

import React, { useEffect, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, Animated, Easing } from 'react-native';
import { colors, fonts, radius } from '../theme/theme';
import { PrimaryButton } from './ui';

export function Celebration({ event, onDone }) {
  const visible = !!event;
  const scale = useRef(new Animated.Value(0.7)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    scale.setValue(0.7);
    fade.setValue(0);
    ring.setValue(0);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.loop(
        Animated.timing(ring, {
          toValue: 1,
          duration: 2400,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ),
    ]).start();
  }, [visible]);

  if (!visible) return null;
  const e = event;
  const ringRotate = ring.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onDone}>
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: 'rgba(13,27,42,0.72)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 24,
          opacity: fade,
        }}
      >
        <Animated.View
          style={{
            transform: [{ scale }],
            backgroundColor: colors.white,
            borderRadius: 20,
            paddingTop: 36,
            paddingBottom: 24,
            paddingHorizontal: 24,
            width: '100%',
            maxWidth: 360,
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              position: 'relative',
            }}
          >
            <Animated.View
              style={{
                position: 'absolute',
                width: 96,
                height: 96,
                borderRadius: 48,
                borderWidth: 3,
                borderStyle: 'dashed',
                borderColor: e.color,
                transform: [{ rotate: ringRotate }],
              }}
            />
            <View
              style={{
                width: 76,
                height: 76,
                borderRadius: 38,
                backgroundColor: e.color,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 38 }}>{e.icon}</Text>
            </View>
          </View>

          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: 26,
              fontWeight: '800',
              color: colors.ink,
              textAlign: 'center',
              letterSpacing: -0.3,
              lineHeight: 30,
            }}
          >
            {e.title}
          </Text>
          {e.sub ? (
            <Text
              style={{
                fontSize: 14,
                color: colors.muted,
                textAlign: 'center',
                marginTop: 8,
                lineHeight: 20,
                paddingHorizontal: 8,
              }}
            >
              {e.sub}
            </Text>
          ) : null}

          {e.stats?.length ? (
            <View style={{ flexDirection: 'row', marginTop: 18, alignSelf: 'stretch' }}>
              {e.stats.map((st, i) => (
                <View
                  key={i}
                  style={{
                    flex: 1,
                    marginHorizontal: 4,
                    backgroundColor: st.soft,
                    borderWidth: 1.5,
                    borderColor: st.border,
                    borderRadius: radius.md,
                    padding: 12,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: fonts.display,
                      fontSize: 20,
                      fontWeight: '800',
                      color: st.color,
                      letterSpacing: -0.2,
                    }}
                  >
                    {st.value}
                  </Text>
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '800',
                      letterSpacing: 0.8,
                      textTransform: 'uppercase',
                      color: colors.muted,
                      marginTop: 3,
                    }}
                  >
                    {st.label}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {e.next ? (
            <View
              style={{
                marginTop: 16,
                paddingVertical: 9,
                paddingHorizontal: 14,
                borderRadius: radius.pill,
                backgroundColor: colors.lineSoft,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.ink }}>{e.next}</Text>
            </View>
          ) : null}

          <View style={{ alignSelf: 'stretch', marginTop: 24 }}>
            <PrimaryButton onPress={onDone}>Continue</PrimaryButton>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

/**
 * Onboarding — three-card carousel shown on first launch.
 *
 * Mirrors the cortex-deck.html narrative: Memory · Reasoning · Action.
 * Theme-aware via useThemeMode (palette flips with light/dark/system).
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useRef, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Radius, Shadow, Spacing, Typography } from '../src/constants/theme';
import { useThemeMode } from '../src/hooks/useThemeMode';

const { width } = Dimensions.get('window');
export const ONBOARDING_KEY = 'cortex.onboarding_seen';

type Slide = {
  number: string;
  layer: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: 'primary' | 'secondary' | 'tertiary';
  title: string;
  body: string;
};

const SLIDES: Slide[] = [
  {
    number: '01',
    layer: 'Memory',
    icon: 'archive',
    accent: 'primary',
    title: 'Capture without\nbreaking flow.',
    body: 'Phone. Terminal. Telegram. Tagged, embedded, and indexed in milliseconds — on-device.',
  },
  {
    number: '02',
    layer: 'Reasoning',
    icon: 'sparkles',
    accent: 'secondary',
    title: 'Recall by\nintent.',
    body: 'IBM Granite reasons over your own diary, and shows you exactly where the answer came from.',
  },
  {
    number: '03',
    layer: 'Action',
    icon: 'arrow-redo',
    accent: 'tertiary',
    title: 'From phone\nto Bob.',
    body: 'When the work needs more than an answer, Cortex hands the task — with full context — to IBM Bob.',
  },
];

export async function hasSeenOnboarding(): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(ONBOARDING_KEY)) === 'true';
  } catch {
    return true;
  }
}

export async function markOnboardingSeen(): Promise<void> {
  try {
    await SecureStore.setItemAsync(ONBOARDING_KEY, 'true');
  } catch { /* ignore */ }
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { Colors } = useThemeMode();
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next !== page) setPage(next);
  }

  function next() {
    if (page < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (page + 1) * width, animated: true });
    } else {
      finish();
    }
  }

  async function finish() {
    await markOnboardingSeen();
    router.replace('/');
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: Colors.background }]}>
      <View style={s.topBar}>
        <Text style={[Typography.codeSm, { color: Colors.outline, letterSpacing: 2, textTransform: 'uppercase' }]}>
          cortex
        </Text>
        <TouchableOpacity onPress={finish} hitSlop={8}>
          <Text style={[Typography.label, { color: Colors.onSurfaceVariant }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {SLIDES.map((slide) => {
          const accent = {
            primary:   { bg: Colors.primaryFixed,   fg: Colors.primary,   shadow: Shadow.cardPrimary },
            secondary: { bg: Colors.secondaryFixed, fg: Colors.secondary, shadow: Shadow.cardSecondary },
            tertiary:  { bg: Colors.tertiaryFixed,  fg: Colors.tertiary,  shadow: Shadow.card },
          }[slide.accent];

          return (
            <View key={slide.number} style={[s.slide, { width }]}>
              <Text style={[Typography.codeSm, { color: Colors.outline, letterSpacing: 2, textTransform: 'uppercase' }]}>
                {slide.number} · {slide.layer}
              </Text>

              <View style={[s.iconWrap, { backgroundColor: accent.bg }, accent.shadow]}>
                <Ionicons name={slide.icon} size={64} color={accent.fg} />
              </View>

              <Text style={[s.title, { color: Colors.onSurface }]}>{slide.title}</Text>
              <Text style={[s.body, { color: Colors.onSurfaceVariant }]}>{slide.body}</Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={s.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              s.dot,
              { backgroundColor: Colors.outlineVariant },
              i === page && { width: 24, backgroundColor: Colors.primary },
            ]}
          />
        ))}
      </View>

      <TouchableOpacity
        style={[s.cta, { backgroundColor: Colors.primary }]}
        onPress={next}
        activeOpacity={0.85}
      >
        <Text style={[Typography.label, { color: Colors.onPrimary }]}>
          {page === SLIDES.length - 1 ? 'Get started' : 'Next'}
        </Text>
        <Ionicons
          name={page === SLIDES.length - 1 ? 'arrow-forward' : 'chevron-forward'}
          size={18}
          color={Colors.onPrimary}
        />
      </TouchableOpacity>

      <Text style={[s.footer, { color: Colors.outline }]}>
        Built on IBM Bob · Granite
      </Text>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  iconWrap: {
    width: 156, height: 156,
    borderRadius: Radius.card,
    alignItems: 'center', justifyContent: 'center',
  },
  title: {
    ...Typography.h2,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },
  body: {
    ...Typography.bodyLg,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
    maxWidth: 400,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.input,
  },
  footer: {
    ...Typography.codeSm,
    textAlign: 'center',
    letterSpacing: 2,
    textTransform: 'uppercase',
    paddingBottom: Spacing.lg,
  },
});

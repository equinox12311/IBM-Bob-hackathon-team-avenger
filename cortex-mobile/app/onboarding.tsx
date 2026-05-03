/**
 * Onboarding — three-card carousel shown on first launch.
 *
 * Once the user taps "Get started" we set a SecureStore flag so the screen
 * never shows again. The Today screen (app/index.tsx) checks the flag on
 * mount and pushes here if unseen.
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

import { Colors, Radius, Shadow, Spacing, Typography } from '../src/constants/theme';

const { width } = Dimensions.get('window');
export const ONBOARDING_KEY = 'cortex.onboarding_seen';

const SLIDES = [
  {
    icon: 'cloud-upload' as const,
    accent: Colors.primary,
    accentBg: Colors.primaryFixed,
    title: 'Capture without breaking flow',
    body:
      'Drop a thought, a fix, or a snippet from your phone, your terminal, or Telegram. Cortex tags and embeds it the moment it lands.',
  },
  {
    icon: 'search' as const,
    accent: Colors.secondary,
    accentBg: Colors.secondaryFixed,
    title: 'Recall by intent, not keywords',
    body:
      'Ask Cortex what you decided last sprint or which file you were debugging. Granite reasons over your own diary, with citations.',
  },
  {
    icon: 'sparkles' as const,
    accent: Colors.tertiary,
    accentBg: Colors.tertiaryFixed,
    title: 'Hand off to IBM Bob',
    body:
      "When Cortex isn't sure, it queues the question for Bob. Bob picks it up at the start of its next session and replies with full context.",
  },
];

export async function hasSeenOnboarding(): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(ONBOARDING_KEY)) === 'true';
  } catch {
    return true; // be safe: don't trap users on web/no-store envs
  }
}

export async function markOnboardingSeen(): Promise<void> {
  try {
    await SecureStore.setItemAsync(ONBOARDING_KEY, 'true');
  } catch {
    /* ignore */
  }
}

export default function OnboardingScreen() {
  const router = useRouter();
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
    <SafeAreaView style={S.safe}>
      <View style={S.skipRow}>
        <TouchableOpacity onPress={finish}>
          <Text style={S.skip}>Skip</Text>
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
        {SLIDES.map((s) => (
          <View key={s.title} style={[S.slide, { width }]}>
            <View
              style={[
                S.iconWrap,
                Shadow.cardPrimary,
                { backgroundColor: s.accentBg },
              ]}
            >
              <Ionicons name={s.icon} size={56} color={s.accent} />
            </View>
            <Text style={S.title}>{s.title}</Text>
            <Text style={S.body}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={S.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              S.dot,
              i === page && S.dotActive,
            ]}
          />
        ))}
      </View>

      <TouchableOpacity style={S.cta} onPress={next}>
        <Text style={S.ctaText}>
          {page === SLIDES.length - 1 ? 'Get started' : 'Next'}
        </Text>
        <Ionicons
          name={page === SLIDES.length - 1 ? 'arrow-forward' : 'chevron-forward'}
          size={18}
          color={Colors.onPrimary}
        />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  skipRow: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    alignItems: 'flex-end',
  },
  skip: { ...Typography.label, color: Colors.onSurfaceVariant },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  iconWrap: {
    width: 140,
    height: 140,
    borderRadius: Radius.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.h2,
    color: Colors.onSurface,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },
  body: {
    ...Typography.bodyLg,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: Spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.outlineVariant,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: Radius.input,
  },
  ctaText: { ...Typography.label, color: Colors.onPrimary },
});

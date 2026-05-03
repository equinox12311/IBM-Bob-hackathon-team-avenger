/**
 * More — grid hub for every secondary feature. Replaces the old text-heavy
 * list with grouped icon tiles, sized for thumbs and consistent across themes.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Header, Screen, Section } from '../src/components/ui';
import { Radius, Shadow, Spacing, Typography } from '../src/constants/theme';
import { useThemeMode } from '../src/hooks/useThemeMode';

type Item = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route: string;
  tone?: 'primary' | 'secondary' | 'tertiary' | 'neutral';
};

const SECTIONS: { title: string; items: Item[] }[] = [
  {
    title: 'Memory',
    items: [
      { icon: 'time-outline',           label: 'Timeline',  route: '/timeline',  tone: 'primary'   },
      { icon: 'calendar-outline',       label: 'Calendar',  route: '/calendar',  tone: 'secondary' },
      { icon: 'sparkles-outline',       label: 'Wiki',      route: '/wiki',      tone: 'tertiary'  },
      { icon: 'bulb-outline',           label: 'Ideas',     route: '/ideas',     tone: 'primary'   },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { icon: 'chatbubbles-outline',    label: 'Workspace', route: '/workspace', tone: 'primary'   },
      { icon: 'folder-open-outline',    label: 'Codebase',  route: '/explorer',  tone: 'secondary' },
      { icon: 'extension-puzzle-outline', label: 'Skills',  route: '/skills',    tone: 'tertiary'  },
      { icon: 'flash-outline',          label: 'Scheduler', route: '/scheduler', tone: 'primary'   },
    ],
  },
  {
    title: 'Insights',
    items: [
      { icon: 'bar-chart-outline',      label: 'Analytics', route: '/analytics', tone: 'primary'   },
      { icon: 'document-outline',       label: 'Report',    route: '/report',    tone: 'secondary' },
      { icon: 'leaf-outline',           label: 'Wellness',  route: '/wellness',  tone: 'tertiary'  },
      { icon: 'people-outline',         label: 'Identity',  route: '/identity',  tone: 'primary'   },
    ],
  },
  {
    title: 'System',
    items: [
      { icon: 'shield-checkmark-outline', label: 'Security', route: '/security', tone: 'tertiary'  },
      { icon: 'logo-github',              label: 'GitHub',   route: '/github',   tone: 'neutral'   },
      { icon: 'person-circle-outline',    label: 'Profile',  route: '/profile',  tone: 'primary'   },
      { icon: 'settings-outline',         label: 'Settings', route: '/settings', tone: 'secondary' },
    ],
  },
];

export default function MoreScreen() {
  return (
    <>
      <Header title="More" eyebrow="Cortex" />
      <Screen padding={Spacing.md}>
        {SECTIONS.map((sect) => (
          <Section key={sect.title} title={sect.title}>
            <Tiles items={sect.items} />
          </Section>
        ))}
      </Screen>
    </>
  );
}

function Tiles({ items }: { items: Item[] }) {
  const router = useRouter();
  const { Colors } = useThemeMode();

  const tone = (t: Item['tone']) =>
    ({
      primary:   { bg: Colors.primaryFixed,     fg: Colors.primary   },
      secondary: { bg: Colors.secondaryFixed,   fg: Colors.secondary },
      tertiary:  { bg: Colors.tertiaryFixed,    fg: Colors.tertiary  },
      neutral:   { bg: Colors.surfaceContainer, fg: Colors.onSurface },
    }[t ?? 'primary']);

  return (
    <View style={s.grid}>
      {items.map((it) => {
        const c = tone(it.tone);
        return (
          <TouchableOpacity
            key={it.route}
            activeOpacity={0.85}
            onPress={() => router.push(it.route as any)}
            style={[
              s.tile,
              { backgroundColor: Colors.surfaceContainerLowest, borderColor: Colors.outlineVariant },
              Shadow.card,
            ]}
          >
            <View style={[s.icon, { backgroundColor: c.bg }]}>
              <Ionicons name={it.icon} size={22} color={c.fg} />
            </View>
            <Text style={[Typography.label, { color: Colors.onSurface }]}>{it.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tile: {
    flexBasis: '47%', flexGrow: 1,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
  },
  icon: {
    width: 56, height: 56,
    borderRadius: Radius.card,
    alignItems: 'center', justifyContent: 'center',
  },
});

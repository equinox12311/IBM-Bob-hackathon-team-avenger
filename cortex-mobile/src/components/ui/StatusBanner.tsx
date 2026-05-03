/**
 * <StatusBanner> — single inline banner (info / warning / error / success)
 * with an icon and optional CTA.
 */

import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Radius, Spacing, Typography } from '../../constants/theme';
import { useThemeMode } from '../../hooks/useThemeMode';

export type StatusTone = 'info' | 'success' | 'warning' | 'error';

export interface StatusBannerProps {
  tone?: StatusTone;
  title: string;
  body?: string;
  ctaLabel?: string;
  onCta?: () => void;
}

const ICONS: Record<StatusTone, keyof typeof Ionicons.glyphMap> = {
  info:    'information-circle',
  success: 'checkmark-circle',
  warning: 'alert-circle',
  error:   'close-circle',
};

export function StatusBanner({ tone = 'info', title, body, ctaLabel, onCta }: StatusBannerProps) {
  const { Colors } = useThemeMode();

  const tints = {
    info:    { bg: Colors.primaryFixed,    fg: Colors.primary    },
    success: { bg: '#defbe6',              fg: Colors.success    },
    warning: { bg: '#fdf6dd',              fg: Colors.warning    },
    error:   { bg: Colors.errorContainer,  fg: Colors.error      },
  };
  const t = tints[tone];

  return (
    <View style={[styles.root, { backgroundColor: t.bg }]}>
      <Ionicons name={ICONS[tone]} size={20} color={t.fg} />
      <View style={{ flex: 1 }}>
        <Text style={[Typography.label, { color: t.fg }]}>{title}</Text>
        {body ? (
          <Text style={[Typography.bodySm, { color: t.fg, marginTop: 2 }]}>{body}</Text>
        ) : null}
      </View>
      {ctaLabel && onCta ? (
        <TouchableOpacity onPress={onCta} hitSlop={6}>
          <Text style={[Typography.label, { color: t.fg, textDecorationLine: 'underline' }]}>
            {ctaLabel}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
  },
});

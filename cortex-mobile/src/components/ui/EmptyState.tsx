/**
 * <EmptyState> — friendly empty/blocked surface used everywhere a list
 * could be empty or a feature is gated on something (no API connection,
 * no entries, etc.).
 */

import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Radius, Shadow, Spacing, Typography } from '../../constants/theme';
import { useThemeMode } from '../../hooks/useThemeMode';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  body?: string;
  ctaLabel?: string;
  onCta?: () => void;
  tone?: 'primary' | 'secondary' | 'tertiary' | 'neutral';
}

export function EmptyState({
  icon = 'sparkles-outline',
  title,
  body,
  ctaLabel,
  onCta,
  tone = 'primary',
}: EmptyStateProps) {
  const { Colors } = useThemeMode();
  const tints = {
    primary:   { bg: Colors.primaryFixed,    fg: Colors.primary,    shadow: Shadow.cardPrimary },
    secondary: { bg: Colors.secondaryFixed,  fg: Colors.secondary,  shadow: Shadow.cardSecondary },
    tertiary:  { bg: Colors.tertiaryFixed,   fg: Colors.tertiary,   shadow: Shadow.card },
    neutral:   { bg: Colors.surfaceContainer, fg: Colors.onSurfaceVariant, shadow: Shadow.card },
  };
  const t = tints[tone];

  return (
    <View style={[styles.root, { backgroundColor: Colors.surfaceContainerLowest, borderColor: Colors.outlineVariant }, t.shadow]}>
      <View style={[styles.iconWrap, { backgroundColor: t.bg }]}>
        <Ionicons name={icon} size={28} color={t.fg} />
      </View>
      <Text style={[styles.title, { color: Colors.onSurface }]}>{title}</Text>
      {body ? (
        <Text style={[styles.body, { color: Colors.onSurfaceVariant }]}>{body}</Text>
      ) : null}
      {ctaLabel && onCta ? (
        <Button label={ctaLabel} onPress={onCta} variant="primary" size="md" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: Radius.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...Typography.h3, textAlign: 'center' },
  body: { ...Typography.body, textAlign: 'center', maxWidth: 320 },
});

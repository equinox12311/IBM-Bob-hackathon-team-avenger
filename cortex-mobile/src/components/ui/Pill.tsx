/**
 * <Pill> — small inline status chip / tag.
 */

import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing, Typography } from '../../constants/theme';
import { useThemeMode } from '../../hooks/useThemeMode';

export type PillTone = 'neutral' | 'primary' | 'success' | 'warning' | 'error' | 'secondary';

export interface PillProps {
  label: string;
  tone?: PillTone;
  icon?: keyof typeof Ionicons.glyphMap;
  dot?: boolean;
}

export function Pill({ label, tone = 'neutral', icon, dot = false }: PillProps) {
  const { Colors } = useThemeMode();

  const tints = {
    neutral:   { bg: Colors.surfaceContainer,  fg: Colors.onSurfaceVariant },
    primary:   { bg: Colors.primaryFixed,      fg: Colors.primary },
    secondary: { bg: Colors.secondaryFixed,    fg: Colors.secondary },
    success:   { bg: '#defbe6',                fg: Colors.success },
    warning:   { bg: '#fdf6dd',                fg: Colors.warning },
    error:     { bg: Colors.errorContainer,    fg: Colors.error },
  };
  const t = tints[tone];

  return (
    <View style={[styles.root, { backgroundColor: t.bg }]}>
      {dot && <View style={[styles.dot, { backgroundColor: t.fg }]} />}
      {icon && <Ionicons name={icon} size={11} color={t.fg} />}
      <Text style={[Typography.codeSm, { color: t.fg, fontWeight: '600' }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.chip,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});

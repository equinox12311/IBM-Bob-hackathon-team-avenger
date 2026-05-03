/**
 * <Section> — labelled vertical group with consistent eyebrow + spacing.
 */

import { type ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Spacing, Typography } from '../../constants/theme';
import { useThemeMode } from '../../hooks/useThemeMode';

export interface SectionProps {
  title: string;
  trailingLabel?: string;
  onTrailingPress?: () => void;
  children: ReactNode;
}

export function Section({ title, trailingLabel, onTrailingPress, children }: SectionProps) {
  const { Colors } = useThemeMode();
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={[Typography.labelSm, { color: Colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1 }]}>
          {title}
        </Text>
        {trailingLabel && onTrailingPress ? (
          <TouchableOpacity onPress={onTrailingPress} hitSlop={6}>
            <Text style={[Typography.labelSm, { color: Colors.primary }]}>{trailingLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginBottom: Spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  body: { paddingHorizontal: Spacing.md, gap: Spacing.sm },
});

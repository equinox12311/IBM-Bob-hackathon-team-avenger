/**
 * <Header> — consistent top bar across every screen.
 *
 * - Optional back button (uses router.back()).
 * - Title + optional eyebrow line above it.
 * - Right-side actions slot.
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { type ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Spacing, Typography } from '../../constants/theme';
import { useThemeMode } from '../../hooks/useThemeMode';

export interface HeaderProps {
  title: string;
  eyebrow?: string;
  back?: boolean;
  right?: ReactNode;
  /** No bottom border (e.g. when next element is a hero card with its own treatment). */
  bare?: boolean;
}

export function Header({ title, eyebrow, back = false, right, bare = false }: HeaderProps) {
  const router = useRouter();
  const { Colors } = useThemeMode();

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: Colors.surfaceContainerLowest,
          borderBottomColor: bare ? 'transparent' : Colors.outlineVariant,
        },
      ]}
    >
      <View style={styles.left}>
        {back && (
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: Colors.surfaceContainer }]}
            onPress={() => router.back()}
            hitSlop={8}
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={20} color={Colors.onSurface} />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          {eyebrow ? (
            <Text style={[styles.eyebrow, { color: Colors.onSurfaceVariant }]}>{eyebrow}</Text>
          ) : null}
          <Text style={[styles.title, { color: Colors.onSurface }]}>{title}</Text>
        </View>
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: { ...Typography.codeSm, textTransform: 'uppercase', letterSpacing: 1 },
  title: { ...Typography.heading },
  right: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
});

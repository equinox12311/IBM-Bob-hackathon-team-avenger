/**
 * <Screen> — every page wraps in this. Handles SafeArea, status-bar
 * compensation, the tab-bar bottom padding, and theme background. Optional
 * scroll behaviour with a built-in pull-to-refresh hook.
 */

import { type ReactNode } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { TAB_BAR_HEIGHT } from '../../constants/layout';
import { Spacing } from '../../constants/theme';
import { useThemeMode } from '../../hooks/useThemeMode';

export interface ScreenProps {
  children?: ReactNode;
  /** Skip the ScrollView wrapper (e.g. chat with its own list). */
  scroll?: boolean;
  /** Pull-to-refresh handler — only relevant when scroll=true. */
  onRefresh?: () => Promise<void> | void;
  refreshing?: boolean;
  /** Skip bottom tab-bar padding (use on full-bleed screens like onboarding). */
  noTabPadding?: boolean;
  /** Additional padding around content. Default: 0 (children control it). */
  padding?: number;
  edges?: readonly Edge[];
  contentStyle?: ViewStyle;
  scrollProps?: ScrollViewProps;
}

export function Screen({
  children,
  scroll = true,
  onRefresh,
  refreshing = false,
  noTabPadding = false,
  padding = 0,
  edges = ['top'],
  contentStyle,
  scrollProps,
}: ScreenProps) {
  const { Colors } = useThemeMode();
  const bottom = noTabPadding ? 0 : TAB_BAR_HEIGHT + Spacing.md;

  if (!scroll) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: Colors.background }]} edges={edges}>
        <View style={[styles.flex, { padding, paddingBottom: bottom }, contentStyle]}>
          {children}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: Colors.background }]} edges={edges}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh
            ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
            : undefined
        }
        contentContainerStyle={[{ padding, paddingBottom: bottom }, contentStyle]}
        {...scrollProps}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
});

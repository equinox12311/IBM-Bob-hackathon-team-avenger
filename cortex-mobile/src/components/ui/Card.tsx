/**
 * <Card> — the canonical surface for any grouped content.
 *
 * Variants:
 *   surface (default) — elevated white-on-near-white card
 *   primary           — soft primary tint (apple-keynote feature card)
 *   secondary         — soft secondary tint
 *   tertiary          — soft tertiary tint
 *   outlined          — border-only, transparent background
 */

import { type ReactNode } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Radius, Shadow, Spacing } from '../../constants/theme';
import { useThemeMode } from '../../hooks/useThemeMode';

export type CardVariant = 'surface' | 'primary' | 'secondary' | 'tertiary' | 'outlined';

export interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  /** Tighter padding for dense lists. Default 'lg'. */
  padding?: 'sm' | 'md' | 'lg';
  /** Use card-radius (32) for hero cards, lg-radius (12) for list cards. */
  size?: 'hero' | 'list';
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function Card({
  children,
  variant = 'surface',
  padding = 'lg',
  size = 'hero',
  onPress,
  style,
}: CardProps) {
  const { Colors } = useThemeMode();

  const palette = {
    surface:   { bg: Colors.surfaceContainerLowest, border: Colors.outlineVariant, shadow: Shadow.card },
    primary:   { bg: Colors.primaryFixed,           border: 'transparent',         shadow: Shadow.cardPrimary },
    secondary: { bg: Colors.secondaryFixed,         border: 'transparent',         shadow: Shadow.cardSecondary },
    tertiary:  { bg: Colors.tertiaryFixed,          border: 'transparent',         shadow: Shadow.card },
    outlined:  { bg: 'transparent',                 border: Colors.outlineVariant, shadow: Shadow.card },
  }[variant];

  const padPx = padding === 'sm' ? Spacing.sm : padding === 'md' ? Spacing.md : Spacing.lg;
  const radius = size === 'list' ? Radius.lg : Radius.card;

  const inner = (
    <View
      style={[
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderWidth: variant === 'outlined' || variant === 'surface' ? StyleSheet.hairlineWidth : 0,
          borderRadius: radius,
          padding: padPx,
        },
        variant !== 'outlined' && palette.shadow,
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
        {inner}
      </TouchableOpacity>
    );
  }
  return inner;
}

/**
 * <Button> — primary action affordance. Apple-feel: full-width pill with icon.
 *
 * Variants: primary (filled), secondary (tinted), ghost (text-only),
 *           danger (red-tinted), outlined.
 */

import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Radius, Spacing, Typography } from '../../constants/theme';
import { useThemeMode } from '../../hooks/useThemeMode';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outlined';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const { Colors } = useThemeMode();

  const tint = {
    primary:   { bg: Colors.primary,           fg: Colors.onPrimary,         border: 'transparent' },
    secondary: { bg: Colors.secondaryFixed,    fg: Colors.secondary,         border: 'transparent' },
    ghost:     { bg: 'transparent',            fg: Colors.primary,           border: 'transparent' },
    danger:    { bg: Colors.errorContainer,    fg: Colors.error,             border: 'transparent' },
    outlined:  { bg: 'transparent',            fg: Colors.primary,           border: Colors.primary },
  }[variant];

  const { paddingV, paddingH, fontStyle, iconSize } = {
    sm: { paddingV: Spacing.xs + 2, paddingH: Spacing.md, fontStyle: Typography.labelSm, iconSize: 14 },
    md: { paddingV: Spacing.sm + 4, paddingH: Spacing.lg, fontStyle: Typography.label,    iconSize: 16 },
    lg: { paddingV: Spacing.md,     paddingH: Spacing.lg, fontStyle: Typography.label,    iconSize: 18 },
  }[size];

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.root,
        {
          backgroundColor: tint.bg,
          borderColor: tint.border,
          borderWidth: variant === 'outlined' ? 1 : 0,
          paddingVertical: paddingV,
          paddingHorizontal: paddingH,
          opacity: disabled ? 0.5 : 1,
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={tint.fg} />
      ) : (
        <>
          {icon && iconPosition === 'left' && <Ionicons name={icon} size={iconSize} color={tint.fg} />}
          <Text style={[fontStyle, { color: tint.fg }]}>{label}</Text>
          {icon && iconPosition === 'right' && <Ionicons name={icon} size={iconSize} color={tint.fg} />}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs + 2,
    borderRadius: Radius.input,
  },
});

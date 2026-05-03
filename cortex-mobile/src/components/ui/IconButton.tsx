/**
 * <IconButton> — circular icon-only button. Used in headers, FABs.
 */

import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Shadow } from '../../constants/theme';
import { useThemeMode } from '../../hooks/useThemeMode';

export interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost';
  badge?: number;
  accessibilityLabel?: string;
}

export function IconButton({
  icon,
  onPress,
  size = 'md',
  variant = 'ghost',
  badge,
  accessibilityLabel,
}: IconButtonProps) {
  const { Colors } = useThemeMode();
  const dim = size === 'sm' ? 32 : size === 'md' ? 40 : 56;
  const iconSize = size === 'sm' ? 16 : size === 'md' ? 20 : 26;

  const tint = {
    primary:   { bg: Colors.primary,           fg: Colors.onPrimary },
    secondary: { bg: Colors.surfaceContainer,  fg: Colors.onSurface },
    ghost:     { bg: 'transparent',            fg: Colors.onSurface },
  }[variant];

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      hitSlop={6}
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.root,
        { width: dim, height: dim, borderRadius: dim / 2, backgroundColor: tint.bg },
        variant === 'primary' && Shadow.cardPrimary,
      ]}
    >
      <Ionicons name={icon} size={iconSize} color={tint.fg} />
      {typeof badge === 'number' && badge > 0 && (
        <View style={[styles.badge, { backgroundColor: Colors.error }]}>
          <View style={{ width: 0, height: 0 }} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 8,
    height: 8,
    borderRadius: 4,
  },
});

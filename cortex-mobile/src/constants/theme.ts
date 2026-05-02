// IBM Design System + Cortex color tokens
export const Colors = {
  primary: '#0f62fe',
  primaryDark: '#003da9',
  primaryLight: '#dbe1ff',
  primaryFixed: '#b4c5ff',

  surface: '#faf8ff',
  surfaceContainer: '#ecedfa',
  surfaceContainerLow: '#f2f3ff',
  surfaceContainerHigh: '#e7e7f4',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerHighest: '#e1e1ee',

  onSurface: '#191b24',
  onSurfaceVariant: '#424656',
  outline: '#737687',
  outlineVariant: '#c3c6d8',

  secondary: '#5d5f5f',
  secondaryContainer: '#dfe0e0',

  error: '#ba1a1a',
  errorContainer: '#ffdad6',

  success: '#198038',
  warning: '#f1c21b',

  background: '#faf8ff',
  onBackground: '#191b24',

  // LLM status colors
  llmOnline: '#24a148',
  llmOffline: '#da1e28',
  llmLoading: '#f1c21b',
};

export const Typography = {
  display: { fontSize: 42, lineHeight: 48, fontWeight: '300' as const, letterSpacing: -0.5 },
  heading: { fontSize: 20, lineHeight: 26, fontWeight: '600' as const },
  headingLg: { fontSize: 24, lineHeight: 30, fontWeight: '600' as const },
  body: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const, letterSpacing: 0.16 },
  bodyLg: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const, letterSpacing: 0.32 },
  code: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const, fontFamily: 'monospace' as const },
  codeLg: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const, fontFamily: 'monospace' as const },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 4,
  md: 8,
  lg: 12,
  full: 9999,
};

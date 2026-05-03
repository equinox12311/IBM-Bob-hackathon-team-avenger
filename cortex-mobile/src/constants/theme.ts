// Cortex v0.3 design tokens — derived from theme.md.
// Plus Jakarta Sans (UI) + Space Grotesk (mono); soft surfaces, rounded cards.

export const Colors = {
  // brand
  primary: "#004cca",
  primaryContainer: "#0062ff",
  primaryFixed: "#dbe1ff",
  primaryFixedDim: "#b4c5ff",
  primaryLight: "#dbe1ff",   // alias for legacy screens (= primaryFixed)
  onPrimary: "#ffffff",
  onPrimaryFixed: "#00174b",
  onPrimaryContainer: "#f3f3ff",

  secondary: "#731be5",
  secondaryContainer: "#8d42ff",
  secondaryFixed: "#ebdcff",
  secondaryFixedDim: "#d4bbff",
  secondaryLight: "#ebdcff", // alias for legacy screens
  onSecondary: "#ffffff",
  onSecondaryFixed: "#270058",
  onSecondaryContainer: "#fdf6ff",

  tertiary: "#8e4000",
  tertiaryContainer: "#b45300",
  tertiaryFixed: "#ffdbc9",
  tertiaryFixedDim: "#ffb68c",
  tertiaryLight: "#ffdbc9",  // alias for legacy screens
  onTertiary: "#ffffff",
  onTertiaryFixed: "#321200",
  onTertiaryContainer: "#fff1ea",

  // surface (light)
  surface: "#f9f9fe",
  surfaceBright: "#f9f9fe",
  surfaceDim: "#d9dade",
  surfaceContainer: "#ededf2",
  surfaceContainerLow: "#f3f3f8",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerHigh: "#e8e8ed",
  surfaceContainerHighest: "#e2e2e7",
  surfaceVariant: "#e2e2e7",

  onSurface: "#1a1c1f",
  onSurfaceVariant: "#424656",
  outline: "#737687",
  outlineVariant: "#c2c6d9",

  // status
  background: "#f9f9fe",
  onBackground: "#1a1c1f",
  error: "#ba1a1a",
  errorContainer: "#ffdad6",
  onError: "#ffffff",
  onErrorContainer: "#93000a",
  success: "#198038",
  warning: "#f1c21b",

  // LLM status indicators
  llmOnline: "#24a148",
  llmOffline: "#da1e28",
  llmLoading: "#f1c21b",
} as const;

// Dark mode counterpart (keeps brand colours, swaps surfaces).
export const ColorsDark = {
  ...Colors,
  surface: "#11131c",
  surfaceBright: "#373943",
  surfaceDim: "#11131c",
  surfaceContainer: "#1d1f28",
  surfaceContainerLow: "#191b24",
  surfaceContainerLowest: "#0b0e16",
  surfaceContainerHigh: "#262833",
  surfaceContainerHighest: "#32343e",
  surfaceVariant: "#32343e",
  background: "#11131c",
  onSurface: "#e1e1ee",
  onSurfaceVariant: "#c3c6d8",
  onBackground: "#e1e1ee",
  outline: "#8b8e9c",
  outlineVariant: "#424656",
} as const;

// Font family names — must match the keys passed to useFonts() in _layout.tsx.
// Use these instead of fontWeight, since RN won't render the right weight from
// a custom font without the explicit family name.
const FONT = {
  regular:   "PlusJakartaSans-Regular",
  semibold:  "PlusJakartaSans-SemiBold",
  bold:      "PlusJakartaSans-Bold",
  mono:      "SpaceGrotesk-Regular",
  monoMd:    "SpaceGrotesk-Medium",
} as const;

export const Typography = {
  // Plus Jakarta Sans
  display: { fontSize: 42, lineHeight: 50, fontFamily: FONT.regular,  letterSpacing: -0.5 },
  h1:      { fontSize: 40, lineHeight: 48, fontFamily: FONT.bold },
  h2:      { fontSize: 32, lineHeight: 38, fontFamily: FONT.bold },
  h3:      { fontSize: 24, lineHeight: 32, fontFamily: FONT.semibold },
  heading: { fontSize: 20, lineHeight: 26, fontFamily: FONT.semibold },
  bodyLg:  { fontSize: 18, lineHeight: 28, fontFamily: FONT.regular },
  body:    { fontSize: 16, lineHeight: 24, fontFamily: FONT.regular },
  bodySm:  { fontSize: 14, lineHeight: 20, fontFamily: FONT.regular },
  label:   { fontSize: 14, lineHeight: 20, fontFamily: FONT.semibold, letterSpacing: 0.28 },
  labelSm: { fontSize: 12, lineHeight: 16, fontFamily: FONT.semibold, letterSpacing: 0.32 },
  // Space Grotesk
  code:    { fontSize: 14, lineHeight: 20, fontFamily: FONT.mono },
  codeSm:  { fontSize: 12, lineHeight: 16, fontFamily: FONT.mono },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  unit: 8,
  gutter: 24,
  containerPadding: 40,
  stackSm: 12,
  stackMd: 24,
  stackLg: 48,
} as const;

export const Radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  card: 32,    // hero card style
  input: 12,   // text inputs / buttons
  chip: 100,   // pill chips
  full: 9999,
} as const;

// Shared shadow presets (Tailwind-style soft drop shadows from theme.md).
export const Shadow = {
  card: {
    shadowColor: "#000000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 30,
    elevation: 2,
  },
  cardPrimary: {
    shadowColor: "#004cca",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 30,
    elevation: 2,
  },
  cardSecondary: {
    shadowColor: "#731be5",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 30,
    elevation: 2,
  },
} as const;

// Convenience export for screens that don't need to know about dark mode yet.
export default { Colors, Typography, Spacing, Radius, Shadow };

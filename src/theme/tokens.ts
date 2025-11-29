// Centralized style tokens derived from the provided calm, pastel mobile design.
// Use these for consistent colors, typography, spacing, and component recipes.

export const palette = {
  sandBase: '#E9DED3',
  creamLight: '#F5EFE9',
  lilacMist: '#F4F1F6',
  charcoal: '#2C2622',
  accentGrey: '#B6B1A8',
  warmBrown: '#A5563D',
  olive: '#7C8B49',
  sage: '#A7B57B',
  softYellow: '#E7DC7D',
  coral: '#D47E65',
  blush: '#D4B5A1',
  lavender: '#B2B4D9',
  softBlue: '#93A8D3',
  deepBlue: '#5577C6',
  tealMint: '#B5D6CB',
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
} as const;

export const radii = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const typography = {
  fontFamilyPrimary: 'Poppins',
  fontFamilyFallbackStack: 'Poppins, "DM Sans", system-ui, -apple-system, sans-serif',
  h1: { fontSize: 32, fontWeight: '700' as const, lineHeight: 38, letterSpacing: -0.2 },
  h2: { fontSize: 24, fontWeight: '700' as const, lineHeight: 30, letterSpacing: -0.1 },
  h3: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  label: { fontSize: 14, fontWeight: '500' as const, lineHeight: 18 },
  caption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 16 },
} as const;

export const shadows = {
  soft: {
    shadowColor: 'rgba(0, 0, 0, 0.07)',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  lifted: {
    shadowColor: 'rgba(0, 0, 0, 0.09)',
    shadowOpacity: 0.09,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
} as const;

export const components = {
  screen: {
    backgroundColor: palette.lilacMist,
    padding: spacing.lg,
  },
  card: {
    backgroundColor: palette.creamLight,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  listCard: {
    backgroundColor: palette.sandBase,
    borderRadius: radii.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  primaryButton: {
    backgroundColor: palette.olive,
    textColor: '#FFFFFF',
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    shadow: shadows.soft,
  },
  secondaryButton: {
    backgroundColor: palette.sandBase,
    textColor: palette.charcoal,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  input: {
    backgroundColor: palette.sandBase,
    borderColor: '#E1D5C7',
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    placeholderColor: 'rgba(44, 38, 34, 0.7)',
  },
  chip: {
    backgroundColor: palette.softYellow,
    textColor: palette.charcoal,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  progress: {
    trackColor: '#E6E0D9',
    fillColor: palette.deepBlue,
    textColor: palette.charcoal,
  },
  icon: {
    defaultColor: palette.accentGrey,
    activeColor: palette.charcoal,
  },
} as const;

export const states = {
  focusRing: 'rgba(85, 119, 198, 0.3)',
  hoverOverlay: 'rgba(0, 0, 0, 0.06)',
  disabledOpacity: 0.5,
  pressedScale: 0.98,
} as const;

export const theme = {
  palette,
  spacing,
  radii,
  typography,
  shadows,
  components,
  states,
};

export type Theme = typeof theme;

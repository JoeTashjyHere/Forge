/**
 * Forge Design System tokens.
 *
 * Forge should feel like Notion + Linear + Product Hunt + Apple:
 * professional, ambitious, trustworthy, focused, motivating.
 *
 * See docs/08_Design_System.md.
 */

import '@/global.css';

import { Platform } from 'react-native';

/**
 * Brand palette. These are the raw brand values referenced throughout the
 * product docs. Semantic colors below map onto these per color scheme.
 */
export const Brand = {
  deepNavy: '#0F172A',
  electricBlue: '#3B82F6',
  electricBlueDark: '#2563EB',
  white: '#FFFFFF',
  slateGray: '#64748B',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
} as const;

export const Colors = {
  light: {
    text: '#0F172A',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    textInverse: '#FFFFFF',
    background: '#FFFFFF',
    backgroundElement: '#F8FAFC',
    backgroundElevated: '#FFFFFF',
    backgroundSelected: '#EFF6FF',
    border: '#E2E8F0',
    borderStrong: '#CBD5E1',
    tint: Brand.electricBlue,
    tintStrong: Brand.electricBlueDark,
    navy: Brand.deepNavy,
    success: Brand.success,
    warning: Brand.warning,
    danger: Brand.danger,
    icon: '#64748B',
    overlay: 'rgba(15, 23, 42, 0.45)',
  },
  dark: {
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    textInverse: '#0F172A',
    background: '#0B1120',
    backgroundElement: '#111827',
    backgroundElevated: '#1E293B',
    backgroundSelected: '#1E3A8A',
    border: '#1E293B',
    borderStrong: '#334155',
    tint: Brand.electricBlue,
    tintStrong: '#60A5FA',
    navy: '#0F172A',
    success: Brand.success,
    warning: Brand.warning,
    danger: Brand.danger,
    icon: '#94A3B8',
    overlay: 'rgba(0, 0, 0, 0.6)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type ColorScheme = keyof typeof Colors;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
})!;

/** Type scale from the design system. */
export const FontSize = {
  h1: 40,
  h2: 32,
  h3: 24,
  h4: 20,
  body: 16,
  label: 15,
  caption: 14,
  small: 12,
} as const;

export const FontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 24,
  six: 32,
  seven: 48,
  eight: 64,
} as const;

export const Radius = {
  small: 8,
  medium: 12,
  large: 16,
  card: 20,
  pill: 999,
} as const;

export const Shadow = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 6,
  },
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 70 }) ?? 0;
export const MaxContentWidth = 720;

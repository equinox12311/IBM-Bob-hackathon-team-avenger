/**
 * Barrel export for the UI primitives.
 *
 * Usage:
 *   import { Screen, Header, Card, Button, Pill, EmptyState, Section,
 *            IconButton, StatusBanner } from '../src/components/ui';
 *
 * Every primitive consumes the resolved palette from useThemeMode(), so
 * dark mode propagates without any work in the consumer.
 */

export { Screen } from './Screen';
export type { ScreenProps } from './Screen';

export { Header } from './Header';
export type { HeaderProps } from './Header';

export { Card } from './Card';
export type { CardProps, CardVariant } from './Card';

export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

export { Pill } from './Pill';
export type { PillProps, PillTone } from './Pill';

export { EmptyState } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';

export { Section } from './Section';
export type { SectionProps } from './Section';

export { IconButton } from './IconButton';
export type { IconButtonProps } from './IconButton';

export { StatusBanner } from './StatusBanner';
export type { StatusBannerProps, StatusTone } from './StatusBanner';

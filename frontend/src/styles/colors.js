/**
 * Centralized color system for TaskMaster Pro
 * 
 * This file defines semantic color tokens that map to CSS variables.
 * Future theme support can be added by updating the CSS variables
 * without changing component code.
 */

// Semantic color tokens - these should be used in components
export const colors = {
  // Brand colors
  brand: {
    primary: 'hsl(var(--primary))',
    primaryForeground: 'hsl(var(--primary-foreground))',
  },
  
  // UI colors
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
  
  // Component colors
  card: 'hsl(var(--card))',
  cardForeground: 'hsl(var(--card-foreground))',
  
  // Interactive states
  muted: 'hsl(var(--muted))',
  mutedForeground: 'hsl(var(--muted-foreground))',
  accent: 'hsl(var(--accent))',
  accentForeground: 'hsl(var(--accent-foreground))',
  
  // Feedback colors
  destructive: 'hsl(var(--destructive))',
  destructiveForeground: 'hsl(var(--destructive-foreground))',
  
  // Form elements
  border: 'hsl(var(--border))',
  input: 'hsl(var(--input))',
  ring: 'hsl(var(--ring))',
};

// Status colors for tasks/projects
export const statusColors = {
  todo: colors.muted,
  inProgress: colors.accent,
  completed: colors.brand.primary,
  overdue: colors.destructive,
};

// Priority colors
export const priorityColors = {
  low: colors.muted,
  medium: colors.accent,
  high: colors.destructive,
};

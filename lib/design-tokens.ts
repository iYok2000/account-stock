/**
 * Semantic color tokens for metric cards, icons, and status indicators.
 * All colors are Tailwind utility classes.
 * Accent colors complement the blue brand palette without replacing it.
 */
export const semanticColors = {
  revenue: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    icon: 'text-emerald-600',
    iconBg: 'bg-emerald-100',
    gradient: 'from-emerald-50/60 to-white',
    ring: 'ring-emerald-200',
    chart: '#059669',
  },
  profit: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    icon: 'text-green-600',
    iconBg: 'bg-green-100',
    gradient: 'from-green-50/60 to-white',
    ring: 'ring-green-200',
    chart: '#16A34A',
  },
  loss: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    icon: 'text-red-600',
    iconBg: 'bg-red-100',
    gradient: 'from-red-50/40 to-white',
    ring: 'ring-red-200',
    chart: '#DC2626',
  },
  fee: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    icon: 'text-amber-600',
    iconBg: 'bg-amber-100',
    gradient: 'from-amber-50/40 to-white',
    ring: 'ring-amber-200',
    chart: '#F59E0B',
  },
  affiliate: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    icon: 'text-purple-600',
    iconBg: 'bg-purple-100',
    gradient: 'from-purple-50 to-white',
    ring: 'ring-purple-200',
    chart: '#8856A8',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    icon: 'text-amber-600',
    iconBg: 'bg-amber-100',
    gradient: 'from-amber-50/40 to-white',
    ring: 'ring-amber-200',
    chart: '#D97706',
  },
  danger: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    icon: 'text-red-600',
    iconBg: 'bg-red-100',
    gradient: 'from-red-50/40 to-white',
    ring: 'ring-red-200',
    chart: '#DC2626',
  },
  neutral: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    icon: 'text-blue-600',
    iconBg: 'bg-blue-100',
    gradient: 'from-blue-50 to-white',
    ring: 'ring-blue-200',
    chart: '#3B82F6',
  },
} as const;

export type SemanticColorKey = keyof typeof semanticColors;

/**
 * Chart hex colors for Recharts and other SVG-based charts.
 * These mirror the CSS variables in chart-tokens.css.
 * Import these instead of hardcoding hex values in chart components.
 */
export const chartColors = {
  // Brand blues (account-fe primary palette)
  brandDark: '#1D4ED8',       // blue-700 — axis labels, reference lines
  brandMid: '#3B82F6',        // blue-500 — neutral bars
  brandLight: '#60A5FA',      // blue-400 — secondary bars (e.g. previous year)
  brandBorder: '#93C5FD',     // blue-300 — tooltip borders
  brandGrid: '#DBEAFE',       // blue-100 — grid lines

  // Semantic
  revenue: '#059669',         // emerald-600 — revenue/income
  profit: '#16A34A',          // green-600 — profit
  loss: '#DC2626',             // red-600 — loss/negative
  fee: '#F59E0B',              // amber-500 — fees/costs
  neutral: '#3B82F6',          // blue-500 — neutral

  // Growth bars
  growthPositive: '#6B8E6B',   // muted green — positive growth
  growthNegative: '#B85C38',  // muted red-brown — negative growth

  // Axis text (slate)
  axisText: '#64748b',         // slate-500 — axis tick labels
  referenceLine: '#94a3b8',    // slate-400 — reference lines

  // Affiliate palette
  affiliate: '#8856A8',       // purple-600 — affiliate earned
  affiliateLost: '#F9A8D4',   // pink-300 — lost commission

  // Content type
  video: '#D97706',           // amber-600
  showcase: '#059669',        // emerald-600
  other: '#3B82F6',           // blue-500
} as const;

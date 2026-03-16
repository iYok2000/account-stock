/**
 * Semantic color tokens for metric cards, icons, and status indicators.
 * All colors are Tailwind utility classes.
 * Accent colors complement the brown brand palette without replacing it.
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
  commission: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    icon: 'text-blue-600',
    iconBg: 'bg-blue-100',
    gradient: 'from-blue-50 to-white',
    ring: 'ring-blue-200',
    chart: '#2563EB',
  },
  growth: {
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    text: 'text-teal-700',
    icon: 'text-teal-600',
    iconBg: 'bg-teal-100',
    gradient: 'from-teal-50 to-white',
    ring: 'ring-teal-200',
    chart: '#0D9488',
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
  affiliate: {
    bg: 'bg-affiliate-50',
    border: 'border-affiliate-200',
    text: 'text-affiliate-700',
    icon: 'text-affiliate-600',
    iconBg: 'bg-affiliate-100',
    gradient: 'from-affiliate-50 to-white',
    ring: 'ring-affiliate-200',
    chart: '#8856A8',
  },
  neutral: {
    bg: 'bg-brown-50',
    border: 'border-brown-200',
    text: 'text-brown-700',
    icon: 'text-brown-600',
    iconBg: 'bg-brown-100',
    gradient: 'from-brown-50 to-white',
    ring: 'ring-brown-200',
    chart: '#8B6039',
  },
} as const;

export type SemanticColorKey = keyof typeof semanticColors;

/**
 * Chart hex colors for Recharts and other SVG-based charts.
 * These mirror the CSS variables in chart-tokens.css.
 * Import these instead of hardcoding hex values in chart components.
 */
export const chartColors = {
  // Brand browns
  brandDark: '#6F4C2D',       // primary-700 — axis labels, reference lines
  brandMid: '#A67C52',        // primary-500 — neutral bars
  brandLight: '#C49A6F',      // primary-400 — secondary bars (e.g. previous year)
  brandBorder: '#D4B28E',     // primary-300 — tooltip borders
  brandGrid: '#E6D0BC',       // primary-200 — grid lines

  // Semantic
  revenue: '#059669',         // emerald-600 — revenue/income
  profit: '#16A34A',          // green-600 — profit
  loss: '#DC2626',            // red-600 — loss/negative
  fee: '#F59E0B',             // amber-500 — fees/costs
  neutral: '#8B6039',         // primary-600 — neutral

  // Growth bars
  growthPositive: '#6B8E6B',  // muted green — positive growth
  growthNegative: '#B85C38',  // muted red-brown — negative growth

  // Axis text (slate)
  axisText: '#64748b',        // slate-500 — axis tick labels
  referenceLine: '#94a3b8',   // slate-400 — reference lines

  // Affiliate palette
  affiliate: '#8856A8',       // affiliate-600 — main purple
  affiliateLost: '#D4A0B0',   // pink/salmon — lost commission

  // Content type
  video: '#D97706',           // amber-600
  showcase: '#059669',        // emerald-600
  other: '#A67B4F',           // warm brown
} as const;

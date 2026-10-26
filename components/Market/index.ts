// components/Market/index.ts
// Export barrel para componentes de mercado

export { MarketCard, Sparkline, TrendBadge } from './MarketCard';
export type { MarketCardProps, MarketCardVariant } from './MarketCard';

export { MarketGrid, MarketSkeleton } from './MarketGrid';
export type { MarketGridProps, MarketSkeletonProps } from './MarketGrid';

export { MarketChart } from './MarketChart';
export type { MarketChartProps } from './MarketChart';

export { InvestorLevelBadge, SimpleLevelBadge } from './InvestorLevelBadgeExports';
export type { InvestorLevelBadgeProps, SimpleLevelBadgeProps } from './InvestorLevelBadgeExports';
export { useInvestorLevelDisplay } from '../../hooks/useInvestorLevelDisplay';
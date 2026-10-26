// components/Market/MarketGrid.tsx
// Grid adaptativo de cards de mercado baseado no nível do investidor

import React from 'react';
import { MarketCard, type MarketCardProps } from './MarketCard';
import { Link } from 'react-router-dom';
import { Icon } from '../Icon';
import type { MarketData, InvestorLevel, MarketAssetConfig, MarketAssetKey } from '../../types/market';
import { MARKET_ASSETS_CONFIG } from '../../types/market';

// ============================================
// CONFIGURAÇÃO DE LAYOUT POR NÍVEL
// ============================================

const GRID_CONFIG: Record<InvestorLevel, {
  columns: string;
  cardSizes: Record<MarketAssetKey, 'compact' | 'default' | 'featured'>;
  maxCards: number;
}> = {
  beginner: {
    columns: 'grid-cols-1 sm:grid-cols-2',
    cardSizes: { fx: 'default', crypto: 'default', brazil: 'default', goals: 'featured', analysis: 'default' },
    maxCards: 2,
  },
  intermediate: {
    columns: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    cardSizes: { fx: 'default', crypto: 'default', brazil: 'default', goals: 'default', analysis: 'default' },
    maxCards: 4,
  },
  advanced: {
    columns: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5',
    cardSizes: { fx: 'featured', crypto: 'featured', brazil: 'default', goals: 'default', analysis: 'featured' },
    maxCards: 5,
  },
};

// ============================================
// COMPONENTES AUXILIARES
// ============================================

function ViewAllLink({ 
  assetKey, 
  investorLevel 
}: { 
  assetKey: MarketAssetKey; 
  investorLevel: InvestorLevel;
}) {
  const config = MARKET_ASSETS_CONFIG.find(c => c.key === assetKey);
  if (!config) return null;
  
  // Beginner não vê link "Ver mais" (progressive disclosure)
  if (investorLevel === 'beginner') return null;
  
  const routes: Record<MarketAssetKey, string> = {
    fx: '/market/fx',
    crypto: '/market/crypto',
    brazil: '/market/brazil',
    goals: '/goals',
    analysis: '/market/analysis',
  };
  
  return (
    <Link
      to={routes[assetKey]}
      className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-teal-500 dark:hover:text-teal-400 hover:bg-white/10 dark:hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100"
      aria-label={`Ver mais ${config.label}`}
    >
      <Icon name="open_in_new" className="size-4" />
    </Link>
  );
}

function ErrorCard({ 
  assetKey, 
  error, 
  onRetry,
  investorLevel,
}: { 
  assetKey: MarketAssetKey;
  error: { message: string; retryable: boolean };
  onRetry: () => void;
  investorLevel: InvestorLevel;
}) {
  const config = MARKET_ASSETS_CONFIG.find(c => c.key === assetKey);
  const colors: Record<MarketAssetKey, string> = {
    fx: '#3b82f6',
    crypto: '#8b5cf6',
    brazil: '#009688',
    goals: '#f59e0b',
    analysis: '#6366f1',
  };
  
  return (
    <article className={`
      relative backdrop-blur-md rounded-2xl border border-red-500/20 bg-red-500/5 dark:bg-red-500/10 
      p-4 min-h-[100px] flex flex-col justify-between
    `}>
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-red-500/10 text-red-500">
          <Icon name="error_outline" className="size-5" />
        </div>
        <h3 className="font-bold text-sm">Erro: {config?.label || assetKey}</h3>
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 flex-1 mt-2">
        {error.message}
      </p>
      
      {error.retryable && (
        <button
          onClick={onRetry}
          className="mt-3 px-3 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors"
        >
          Tentar novamente
        </button>
      )}
    </article>
  );
}

// ============================================
// MARKET GRID PRINCIPAL
// ============================================

interface MarketGridProps {
  data: MarketData | null;
  investorLevel: InvestorLevel;
  errors: Array<{ asset: MarketAssetKey; message: string; retryable: boolean }>;
  onRetryAsset: (asset: MarketAssetKey) => void;
  className?: string;
}

export const MarketGrid: React.FC<MarketGridProps> = ({
  data,
  investorLevel,
  errors,
  onRetryAsset,
  className = '',
}) => {
  if (!data) return null;
  
  const config = GRID_CONFIG[investorLevel];
  const enabledAssets = Object.keys(GRID_CONFIG[investorLevel].cardSizes) as MarketAssetKey[];
  
  // Filtrar apenas assets que têm dados ou erro
  const assetsToRender = enabledAssets.filter(assetKey => 
    (data as any)[assetKey] || errors.some(e => e.asset === assetKey)
  ).slice(0, config.maxCards);
  
  if (assetsToRender.length === 0) return null;
  
  return (
    <div 
      className={`grid gap-4 ${config.columns} ${className}`}
      role="list"
      aria-label="Dados de mercado"
    >
      {assetsToRender.map((assetKey) => {
        const assetConfig = MARKET_ASSETS_CONFIG.find(c => c.key === assetKey);
        const assetError = errors.find(e => e.asset === assetKey);
        const cardSize = config.cardSizes[assetKey] || 'default';
        
        // Card de erro
        if (assetError) {
          return (
            <ErrorCard
              key={assetKey}
              assetKey={assetKey}
              error={assetError}
              onRetry={() => onRetryAsset(assetKey)}
              investorLevel={investorLevel}
            />
          );
        }
        
        // Card de dados
        const assetData = (data as any)[assetKey];
        if (!assetData) return null;
        
        // Props base para o MarketCard
        const baseProps: MarketCardProps = {
          variant: assetKey,
          title: assetConfig?.label || assetKey,
          size: cardSize,
          investorLevel,
          action: <ViewAllLink assetKey={assetKey} investorLevel={investorLevel} />,
        };
        
        // Props específicas por variante
        let specificProps: Partial<MarketCardProps> = {};
        
        switch (assetKey) {
          case 'fx':
            specificProps = { fxData: assetData };
            break;
          case 'crypto':
            specificProps = { cryptoData: assetData.assets };
            break;
          case 'brazil':
            specificProps = { brazilData: assetData };
            break;
          case 'goals':
            // TODO: Integrar com goals reais do Supabase
            specificProps = { 
              goalsData: [
                { label: 'Reserva Emergência', value: 15000, target: 30000 },
                { label: 'Aposentadoria', value: 45000, target: 500000 },
                { label: 'Viagem', value: 3000, target: 8000 },
              ] 
            };
            break;
        }
        
        return (
          <MarketCard
            key={assetKey}
            {...baseProps}
            {...specificProps}
          />
        );
      })}
      
      {/* Card "Adicionar/Configurar" para advanced */}
      {investorLevel === 'advanced' && (
        <Link 
          to="/market" 
          className={`
            flex items-center justify-center gap-3 p-4 border-2 border-dashed rounded-2xl 
            transition-colors group ${config.cardSizes.analysis === 'featured' ? 'min-h-[120px]' : 'min-h-[100px]'}
            bg-white/5 dark:bg-white/0 border-gray-300 dark:border-gray-600 
            hover:border-teal-500/50 hover:bg-teal-500/5
          `}
        >
          <div className="size-10 rounded-xl flex items-center justify-center bg-teal-500/10 text-teal-500 group-hover:bg-teal-500/20 transition-colors">
            <Icon name="add" className="size-6" />
          </div>
          <span className="font-bold text-sm text-teal-600 dark:text-teal-400 group-hover:text-teal-500">
            Configurar Market
          </span>
        </Link>
      )}
    </div>
  );
};

// ============================================
// MARKET SKELETON (Loading state)
// ============================================

interface MarketSkeletonProps {
  investorLevel: InvestorLevel;
  className?: string;
}

export const MarketSkeleton: React.FC<MarketSkeletonProps> = ({ 
  investorLevel, 
  className = '' 
}) => {
  const config = GRID_CONFIG[investorLevel];
  const enabledAssets = Object.keys(config.cardSizes) as MarketAssetKey[];
  const cardsToShow = enabledAssets.slice(0, config.maxCards);
  
  return (
    <div className={`grid gap-4 ${config.columns} ${className}`} aria-busy="true" aria-label="Carregando dados de mercado">
      {cardsToShow.map((_, i) => (
        <div key={i} className="relative backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 min-h-[100px] animate-pulse">
          <div className="flex items-center gap-2 mb-3">
            <div className="size-10 rounded-lg bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
          </div>
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MarketGrid;
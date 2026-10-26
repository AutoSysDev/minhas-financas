// components/Market/MarketCard.tsx
// Card base para dados de mercado (4 variantes: fx, crypto, brazil, goals)

import React from 'react';
import { Icon } from '../Icon';
import { PrivateValue } from '../PrivateValue';
import { formatCurrency, formatPercent } from '../../utils/helpers';
import type { InvestorLevel } from '../../types/market';
import type { CryptoAsset, BrazilSnapshot, FxSnapshot } from '../../types/market';

// ============================================
// TIPOS
// ============================================

export type MarketCardVariant = 'fx' | 'crypto' | 'brazil' | 'goals';

export interface MarketCardProps {
  variant: MarketCardVariant;
  title: string;
  // Dados específicos por variante
  fxData?: FxSnapshot;
  cryptoData?: CryptoAsset[];
  brazilData?: BrazilSnapshot;
  goalsData?: { label: string; value: number; target: number }[];
  // Configurações visuais
  change?: number;
  changeLabel?: string;
  sparkline?: number[];
  trend?: 'up' | 'down' | 'neutral';
  action?: React.ReactNode;
  size?: 'compact' | 'default' | 'featured';
  investorLevel: InvestorLevel;
  className?: string;
  onClick?: () => void;
}

// ============================================
// UTILITÁRIOS VISUAIS
// ============================================

const VARIANT_COLORS: Record<MarketCardVariant, { 
  primary: string; 
  bg: string; 
  border: string;
  icon: string;
}> = {
  fx: { primary: '#3b82f6', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: 'currency_exchange' },
  crypto: { primary: '#8b5cf6', bg: 'bg-violet-500/10', border: 'border-violet-500/20', icon: 'currency_bitcoin' },
  brazil: { primary: '#009688', bg: 'bg-teal-500/10', border: 'border-teal-500/20', icon: 'flag' },
  goals: { primary: '#f59e0b', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: 'flag' },
};

const SIZE_CLASSES: Record<string, string> = {
  compact: 'p-3 min-h-[80px]',
  default: 'p-4 min-h-[100px]',
  featured: 'p-5 min-h-[120px]',
};

function Sparkline({ data, color, trend }: { data: number[]; color: string; trend?: 'up' | 'down' | 'neutral' }) {
  if (!data || data.length < 2) return null;
  
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 100;
  const height = 32;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  
  const isUp = trend === 'up' || (data[data.length - 1] >= data[0]);
  const strokeColor = trend ? (isUp ? '#14b8a6' : '#ef4444') : color;
  
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible" aria-hidden="true">
      {/* Área gradient */}
      <defs>
        <linearGradient id="sparkline-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.15" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`M${points} L${width} ${height} L0 ${height} Z`}
        fill="url(#sparkline-gradient)"
      />
      {/* Linha */}
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        points={points}
        vectorEffect="non-scaling-stroke"
        className="animate-draw"
      />
      {/* Ponto final */}
      <circle
        cx={width}
        cy={height - ((data[data.length - 1] - min) / range) * height}
        r={3}
        fill={strokeColor}
        className="animate-pulse-subtle"
      />
    </svg>
  );
}

function TrendBadge({ trend, change, label }: { trend?: 'up' | 'down' | 'neutral'; change?: number; label?: string }) {
  if (change === undefined && !trend) return null;
  
  const isUp = trend === 'up' || (change !== undefined && change > 0);
  const isDown = trend === 'down' || (change !== undefined && change < 0);
  
  return (
    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
      isUp ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
      isDown ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
      'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
    }`}>
      <Icon name={isUp ? 'arrow_upward' : isDown ? 'arrow_downward' : 'remove'} className="size-3" />
      <span>
        {change !== undefined ? formatPercent(Math.abs(change)) : '—'}
        {label && <span className="ml-1 opacity-70">{label}</span>}
      </span>
    </div>
  );
}

// ============================================
// COMPONENTES ESPECÍFICOS POR VARIANTE
// ============================================

function FxCardContent({ data, size }: { data: FxSnapshot; size: 'compact' | 'default' | 'featured' }) {
  const mainRate = data.rates.USD || 0;
  const colors = VARIANT_COLORS.fx;
  
  return (
    <div className="space-y-2">
      {/* Valor principal */}
      <div className="flex items-baseline justify-between">
        <div>
          <p className={`text-2xl ${size === 'featured' ? 'text-3xl' : ''} font-black tabular-nums`}>
            <PrivateValue>{mainRate.toFixed(4)}</PrivateValue>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">USD/BRL Comercial</p>
        </div>
        {data.sparkline30d && data.sparkline30d.length > 0 && (
          <Sparkline data={data.sparkline30d} color={colors.primary} trend="neutral" />
        )}
      </div>
      
      {/* Outras moedas */}
      <div className="flex flex-wrap gap-2 text-xs">
        {(['EUR', 'GBP', 'JPY', 'CHF', 'ARS'] as const).map(currency => {
          const rate = data.rates[currency];
          if (rate === undefined) return null;
          return (
            <span key={currency} className={`px-2 py-0.5 rounded bg-white/50 dark:bg-white/10 font-mono ${size === 'compact' ? 'text-[10px]' : ''}`}>
              {currency} {rate.toFixed(currency === 'JPY' ? 3 : 4)}
            </span>
          );
        })}
      </div>
      
      <p className="text-[10px] text-gray-400 dark:text-gray-500">
        Fonte: BCE • Atualizado {new Date(data.fetchedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  );
}

function CryptoCardContent({ data, size }: { data: CryptoAsset[]; size: 'compact' | 'default' | 'featured' }) {
  const btc = data.find(a => a.id === 'bitcoin');
  const eth = data.find(a => a.id === 'ethereum');
  const colors = VARIANT_COLORS.crypto;
  
  return (
    <div className="space-y-2">
      {/* BTC Principal */}
      {btc && (
        <div className="flex items-baseline justify-between">
          <div>
            <p className={`text-2xl ${size === 'featured' ? 'text-3xl' : ''} font-black tabular-nums`}>
              <PrivateValue>{formatCurrency(btc.priceBrl, { compact: size === 'compact' })}</PrivateValue>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Icon name="currency_bitcoin" className="size-3" /> Bitcoin
            </p>
          </div>
          {btc.sparkline7d && btc.sparkline7d.length > 0 && (
            <Sparkline data={btc.sparkline7d} color={colors.primary} trend={btc.change24h > 0 ? 'up' : 'down'} />
          )}
        </div>
      )}
      
      {/* Grid compacto de top coins */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {data.slice(0, size === 'compact' ? 4 : 6).map(coin => (
          <div key={coin.id} className="flex items-center justify-between p-1.5 rounded bg-white/30 dark:bg-white/5">
            <div className="flex items-center gap-1.5">
              <img src={coin.image} alt={coin.name} className="size-4" />
              <span className="font-medium">{coin.symbol}</span>
            </div>
            <div className="text-right">
              <div className="font-mono tabular-nums">
                <PrivateValue>{formatCurrency(coin.priceBrl, { compact: true })}</PrivateValue>
              </div>
              <div className={`text-[10px] font-bold ${coin.change24h >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(1)}%
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {size === 'featured' && (
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="text-gray-500 dark:text-gray-400">Dominância BTC: {btc ? btc.change24h.toFixed(1) : '—'}%</span>
          <span className="text-gray-500 dark:text-gray-400">Fonte: CoinGecko</span>
        </div>
      )}
    </div>
  );
}

function BrazilCardContent({ data, size }: { data: BrazilSnapshot; size: 'compact' | 'default' | 'featured' }) {
  const colors = VARIANT_COLORS.brazil;
  
  return (
    <div className="space-y-2">
      {/* Índices principais */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 rounded bg-white/30 dark:bg-white/5">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">SELIC</p>
          <p className={`text-lg ${size === 'featured' ? 'text-xl' : ''} font-black tabular-nums`}>
            {data.selic.toFixed(2)}% a.a.
          </p>
        </div>
        <div className="p-2 rounded bg-white/30 dark:bg-white/5">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">CDI</p>
          <p className={`text-lg ${size === 'featured' ? 'text-xl' : ''} font-black tabular-nums`}>
            {data.cdi.toFixed(2)}% a.a.
          </p>
        </div>
        <div className="p-2 rounded bg-white/30 dark:bg-white/5">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">IPCA 12m</p>
          <p className={`text-lg ${size === 'featured' ? 'text-xl' : ''} font-black tabular-nums`}>
            {data.ipca12m.toFixed(2)}%
          </p>
        </div>
        <div className="p-2 rounded bg-white/30 dark:bg-white/5">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">Real</p>
          <p className={`text-lg ${size === 'featured' ? 'text-xl' : ''} font-black tabular-nums text-green-600 dark:text-green-400`}>
            {data.rendimentoReal >= 0 ? '+' : ''}{data.rendimentoReal.toFixed(2)}%
          </p>
        </div>
      </div>
      
      {/* Câmbio */}
      <div className="flex flex-wrap gap-2 text-xs">
        <span className={`px-2 py-0.5 rounded bg-white/50 dark:bg-white/10 font-mono ${size === 'compact' ? 'text-[10px]' : ''}`}>
          USD {data.usdBrl.toFixed(4)}
        </span>
        <span className={`px-2 py-0.5 rounded bg-white/50 dark:bg-white/10 font-mono ${size === 'compact' ? 'text-[10px]' : ''}`}>
          Turismo {data.usdBrlTurismo.toFixed(4)}
        </span>
        <span className={`px-2 py-0.5 rounded bg-white/50 dark:bg-white/10 font-mono ${size === 'compact' ? 'text-[10px]' : ''}`}>
          EUR {data.eurBrl.toFixed(4)}
        </span>
        <span className={`px-2 py-0.5 rounded bg-white/50 dark:bg-white/10 font-mono ${size === 'compact' ? 'text-[10px]' : ''}`}>
          BTC {formatCurrency(data.btcBrl, { compact: true })}
        </span>
      </div>
      
      {data.usdBrlSparkline30d && data.usdBrlSparkline30d.length > 0 && (
        <Sparkline data={data.usdBrlSparkline30d} color={colors.primary} trend="neutral" />
      )}
      
      <p className="text-[10px] text-gray-400 dark:text-gray-500">
        Fonte: AwesomeAPI/BCB • Índices: {new Date(data.indicesDate).toLocaleDateString('pt-BR')}
      </p>
    </div>
  );
}

function GoalsCardContent({ data, size }: { data: { label: string; value: number; target: number }[]; size: 'compact' | 'default' | 'featured' }) {
  return (
    <div className="space-y-3">
      {data.slice(0, size === 'compact' ? 2 : 3).map((goal, i) => (
        <div key={goal.label} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium truncate">{goal.label}</span>
            <span className="font-bold tabular-nums">{Math.round((goal.value / goal.target) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-teal-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min(100, (goal.value / goal.target) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">
            {formatCurrency(goal.value)} de {formatCurrency(goal.target)}
          </p>
        </div>
      ))}
      {data.length > (size === 'compact' ? 2 : 3) && (
        <button className="text-xs text-teal-600 dark:text-teal-400 font-medium hover:underline w-full text-left">
          +{data.length - (size === 'compact' ? 2 : 3)} metas
        </button>
      )}
    </div>
  );
}

// ============================================
// MARKET CARD PRINCIPAL
// ============================================

export const MarketCard: React.FC<MarketCardProps> = ({
  variant,
  title,
  fxData,
  cryptoData,
  brazilData,
  goalsData,
  change,
  changeLabel,
  sparkline,
  trend,
  action,
  size = 'default',
  investorLevel,
  className = '',
  onClick,
}) => {
  const colors = VARIANT_COLORS[variant];
  const isInteractive = !!onClick;
  
  // Determinar conteúdo baseado na variante
  let content: React.ReactNode = null;
  
  switch (variant) {
    case 'fx':
      content = fxData && <FxCardContent data={fxData} size={size} />;
      break;
    case 'crypto':
      content = cryptoData && <CryptoCardContent data={cryptoData} size={size} />;
      break;
    case 'brazil':
      content = brazilData && <BrazilCardContent data={brazilData} size={size} />;
      break;
    case 'goals':
      content = goalsData && <GoalsCardContent data={goalsData} size={size} />;
      break;
  }
  
  // Skeleton se não tem dados
  if (!content) {
    content = (
      <div className="space-y-3 animate-pulse" aria-hidden="true">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    );
  }
  
  return (
    <article
      className={`
        relative backdrop-blur-md rounded-2xl border shadow-sm transition-all duration-300
        ${SIZE_CLASSES[size]}
        ${colors.bg} ${colors.border}
        ${isInteractive ? 'cursor-pointer hover:shadow-md hover:border-teal-500/30 active:scale-[0.98]' : ''}
        ${className}
      `}
      onClick={onClick}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={isInteractive ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }} : undefined}
      role={isInteractive ? 'button' : 'article'}
      aria-label={`${title} card`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${colors.bg} text-${colors.primary.replace('#', '')}600 dark:text-${colors.primary.replace('#', '')}400`}>
            <Icon name={colors.icon} className="size-5" />
          </div>
          <h3 className={`font-bold text-sm uppercase tracking-wider ${size === 'compact' ? 'text-xs' : ''}`}>
            {title}
          </h3>
        </div>
        
        {action && (
          <div className="flex-shrink-0 ml-2">
            {action}
          </div>
        )}
      </div>
      
      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        {content}
      </div>
      
      {/* Footer: Trend badge + sparkline inline */}
      {(change !== undefined || sparkline) && (
        <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/10 dark:border-white/5">
          {change !== undefined && (
            <TrendBadge change={change} label={changeLabel} />
          )}
          {sparkline && sparkline.length > 0 && !action && (
            <Sparkline data={sparkline} color={colors.primary} trend={trend} />
          )}
        </div>
      )}
      
      {/* Indicador de nível (apenas beginner vê badge) */}
      {investorLevel === 'beginner' && size !== 'compact' && (
        <div className="absolute bottom-2 right-2">
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${colors.bg} text-${colors.primary}700 dark:text-${colors.primary}400`}>
            Essencial
          </span>
        </div>
      )}
    </article>
  );
};

// ============================================
// EXPORTS
// ============================================

export { Sparkline, TrendBadge };
export default MarketCard;
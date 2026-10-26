// components/Market/MarketChart.tsx
// Gráfico unificado multi-ativo com tabs (Câmbio, Crypto, Brasil)

import React, { useMemo, useState, useCallback } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Icon } from '../Icon';
import { formatCurrency, formatPercent } from '../../utils/helpers';
import type { MarketData, InvestorLevel } from '../../types/market';

// ============================================
// TIPOS E CONFIGURAÇÃO
// ============================================

interface ChartTabConfig {
  key: 'fx' | 'crypto' | 'brazil';
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  getData: (marketData: MarketData) => ChartDataPoint[];
  getYAxisLabel: () => string;
  formatValue: (value: number) => string;
  formatTooltip: (value: number, name: string) => [string, string];
}

interface ChartDataPoint {
  date: string;        // ISO date ou label curto
  value: number;
  label?: string;      // Label formatado para tooltip
}

const CHART_TABS: ChartTabConfig[] = [
  {
    key: 'fx',
    label: 'Câmbio',
    icon: 'currency_exchange',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    getData: (data) => data.fx?.sparkline30d?.map((v, i) => ({
      date: `D${i + 1}`,
      value: v,
      label: v.toFixed(4),
    })) || [],
    getYAxisLabel: () => 'USD/BRL',
    formatValue: (v) => v.toFixed(4),
    formatTooltip: (v) => [v.toFixed(4), 'USD/BRL'],
  },
  {
    key: 'crypto',
    label: 'Crypto',
    icon: 'currency_bitcoin',
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
    getData: (data) => {
      const btc = data.crypto?.assets?.find(a => a.id === 'bitcoin');
      return btc?.sparkline7d?.map((v, i) => ({
        date: `D${i + 1}`,
        value: v,
        label: formatCurrency(v, { compact: true }),
      })) || [];
    },
    getYAxisLabel: () => 'BTC/BRL',
    formatValue: (v) => formatCurrency(v, { compact: true }),
    formatTooltip: (v) => [formatCurrency(v), 'BTC/BRL'],
  },
  {
    key: 'brazil',
    label: 'Brasil',
    icon: 'trending_up',
    color: '#009688',
    bgColor: 'rgba(0, 150, 136, 0.1)',
    getData: (data) => data.brazil?.usdBrlSparkline30d?.map((v, i) => ({
      date: `D${i + 1}`,
      value: v,
      label: v.toFixed(4),
    })) || [],
    getYAxisLabel: () => 'USD/BRL',
    formatValue: (v) => v.toFixed(4),
    formatTooltip: (v) => [v.toFixed(4), 'USD/BRL'],
  },
];

// ============================================
// TOOLTIP CUSTOMIZADO
// ============================================

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    dataKey: string;
    payload?: ChartDataPoint;
  }>;
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  
  const item = payload[0];
  const dataPoint = item.payload as ChartDataPoint | undefined;
  
  // Encontrar config da tab ativa para formatar
  const tab = CHART_TABS.find(t => t.color === item.color) || CHART_TABS[0];
  const [formattedValue, unit] = tab.formatTooltip(item.value, item.name);
  
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 min-w-[160px] animate-fade-in">
      <div className="flex items-center gap-2 mb-2">
        <div className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black tabular-nums text-gray-900 dark:text-white">
          {formattedValue}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">{unit}</span>
      </div>
      {dataPoint?.date && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{dataPoint.date}</p>
      )}
    </div>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

interface MarketChartProps {
  data: MarketData;
  defaultTab?: 'fx' | 'crypto' | 'brazil';
  investorLevel: InvestorLevel;
  className?: string;
  height?: number;
}

export const MarketChart: React.FC<MarketChartProps> = ({
  data,
  defaultTab = 'fx',
  investorLevel,
  className = '',
  height = 220,
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [animationKey, setAnimationKey] = useState(0);
  
  const tabConfig = CHART_TABS.find(t => t.key === activeTab) || CHART_TABS[0];
  const chartData = useMemo(() => tabConfig.getData(data), [data, activeTab]);
  const hasData = chartData.length > 0;
  
  // Trigger animation on tab change
  const handleTabChange = useCallback((key: 'fx' | 'crypto' | 'brazil') => {
    setAnimationKey(k => k + 1);
    setActiveTab(key);
  }, []);
  
  // Filtrar tabs disponíveis baseado no nível
  const availableTabs = CHART_TABS.filter(tab => {
    if (investorLevel === 'beginner') return tab.key === 'brazil'; // Beginner só vê Brasil
    if (investorLevel === 'intermediate') return tab.key !== 'analysis';
    return true; // Advanced vê tudo
  });
  
  if (!hasData && investorLevel !== 'beginner') {
    return (
      <div className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-6 ${className}`}>
        <div className="flex items-center justify-center h-full min-h-[200px]">
          <div className="text-center">
            <Icon name="insert_chart_outlined" className="size-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              Dados insuficientes para exibir o gráfico
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Tente novamente em alguns instantes
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  if (investorLevel === 'beginner') {
    return (
      <div className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-6 ${className}`}>
        <div className="text-center py-8">
          <Icon name="lock" className="size-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Gráficos avançados disponíveis no perfil Intermediário
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Complete o onboarding para desbloquear
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden ${className}`}>
      {/* Header com Tabs */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center gap-2">
          <Icon name="show_chart" className="size-5 text-gray-500 dark:text-gray-400" />
          <h3 className="font-bold text-base text-gray-900 dark:text-white">
            {tabConfig.label} - {tabConfig.getYAxisLabel()}
          </h3>
        </div>
        
        {/* Tab Bar */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {availableTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                ${activeTab === tab.key
                  ? 'bg-white dark:bg-gray-900 shadow-sm text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }
              `}
              style={{ color: activeTab === tab.key ? tab.color : undefined }}
              aria-selected={activeTab === tab.key}
              aria-controls={`chart-panel-${tab.key}`}
            >
              <Icon name={tab.icon} className="size-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Chart Area */}
      <div 
        id={`chart-panel-${activeTab}`}
        role="img"
        aria-label={`Gráfico de ${tabConfig.label} - ${tabConfig.getYAxisLabel()} últimos 30 dias`}
        className="relative"
        style={{ height }}
      >
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
              style={{ animationKey }} // Key para re-trigger animation
            >
              <defs>
                <linearGradient id={`gradient-${activeTab}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={tabConfig.color} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={tabConfig.color} stopOpacity="0" />
                </linearGradient>
              </defs>
              
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e5e7eb" 
                vertical={false}
                horizontal={true}
              />
              
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ 
                  fontSize: 10, 
                  fill: '#9ca3af',
                  dy: 8 
                }}
                interval="preserveStartEnd"
                tickFormatter={(value) => {
                  // Mostrar apenas alguns labels para não lotar
                  const idx = chartData.findIndex(d => d.date === value);
                  if (idx === 0 || idx === chartData.length - 1 || idx % 5 === 0) {
                    return value.replace('D', '');
                  }
                  return '';
                }}
              />
              
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#9ca3af', dx: -8 }}
                tickFormatter={tabConfig.formatValue}
                width={60}
              />
              
              <Tooltip
                content={<CustomTooltip />}
                wrapperStyle={{ outline: 'none' }}
              />
              
              <Area
                type="monotone"
                dataKey="value"
                stroke={tabConfig.color}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#gradient-${activeTab})`}
                connectNulls={true}
                isAnimationActive={true}
                animationDuration={800}
                animationEasing="easeOut"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full min-h-[200px] text-center">
            <Icon name="insert_chart_outlined" className="size-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Sem dados para {tabConfig.label}</p>
          </div>
        )}
        
        {/* Indicador de tendência simples */}
        {hasData && chartData.length >= 2 && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-sm">
            <Icon 
              name={chartData[chartData.length - 1].value >= chartData[0].value ? 'trending_up' : 'trending_down'} 
              className={`size-4 ${chartData[chartData.length - 1].value >= chartData[0].value ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} 
            />
            <span className="text-xs font-bold tabular-nums">
              {chartData[chartData.length - 1].value >= chartData[0].value ? '+' : ''}
              {((chartData[chartData.length - 1].value - chartData[0].value) / chartData[0].value * 100).toFixed(2)}%
            </span>
          </div>
        )}
      </div>
      
      {/* Footer com info da fonte */}
      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
          <span>
            Fonte: {activeTab === 'fx' ? 'BCE (Frankfurter)' : activeTab === 'crypto' ? 'CoinGecko' : 'AwesomeAPI/BCB'}
          </span>
          <span>Atualizado: {new Date(data.lastUpdated).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
        </p>
      </div>
    </div>
  );
};

export default MarketChart;
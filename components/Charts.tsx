import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../utils/helpers';
import { useTheme } from '../context/ThemeContext';

export interface CategoryData {
  name: string;
  value: number;
  color: string;
}

export interface SavingsData {
  month: string;
  savings: number;
}

export interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

interface ExpensePieChartProps {
  data?: CategoryData[];
  onSelect?: (name: string) => void;
}

interface SavingsBarChartProps {
  data?: SavingsData[];
}

interface IncomeExpenseChartProps {
  data?: MonthlyData[];
}

// Gráfico de Pizza (Donut Chart)
export const ExpensePieChart: React.FC<ExpensePieChartProps> = ({ data = [], onSelect }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center gap-3 text-center">
        <p className={isLight ? 'text-slate-500' : 'text-gray-400'}>Sem dados para exibir</p>
        <Link to="/transactions?action=new" className="px-4 py-2 rounded-lg bg-teal-500 text-white text-xs font-bold">Lançar gasto</Link>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = -90; // Começar do topo

  const slices = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;

    currentAngle = endAngle;

    // Converter ângulos para coordenadas
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = 50 + 40 * Math.cos(startRad);
    const y1 = 50 + 40 * Math.sin(startRad);
    const x2 = 50 + 40 * Math.cos(endRad);
    const y2 = 50 + 40 * Math.sin(endRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const pathData = [
      `M 50 50`,
      `L ${x1} ${y1}`,
      `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `Z`
    ].join(' ');

    return { pathData, color: item.color, name: item.name, value: item.value, percentage };
  });

  return (
    <div className="w-full h-auto flex flex-col">
      <div className="h-64 w-full shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full" role="img" aria-label={`Gastos por categoria, total ${formatCurrency(total)}`}>
          {slices.map((slice, index) => (
            <g key={index}>
              <path
                d={slice.pathData}
                fill={slice.color}
                className="transition-opacity hover:opacity-80 cursor-pointer"
                tabIndex={onSelect ? 0 : -1}
                onClick={() => onSelect?.(slice.name)}
                onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && onSelect) { e.preventDefault(); onSelect(slice.name); } }}
              >
                <title>{`${slice.name}: ${formatCurrency(slice.value)} (${slice.percentage.toFixed(1)}%)`}</title>
              </path>
            </g>
          ))}

          <circle cx="50" cy="50" r="25" fill="white" className="dark:fill-gray-800" />
        </svg>
      </div>

      {/* Legenda */}
      <div className="mt-4 space-y-2">
        {data.map((item, index) => {
          const percentage = ((item.value / total) * 100).toFixed(1);
          return (
            <button
              key={index}
              onClick={() => onSelect?.(item.name)}
              className={`w-full flex items-center justify-between text-sm p-2 rounded-lg transition-colors ${onSelect ? 'hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer' : ''}`}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className={isLight ? 'text-slate-700' : 'text-gray-300'}>{item.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  <span>{formatCurrency(item.value)}</span>
                </span>
                <span className={isLight ? 'text-slate-400' : 'text-gray-400'}>({percentage}%)</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Gráfico de Barras
export const SavingsBarChart: React.FC<SavingsBarChartProps> = ({ data = [] }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-80 flex flex-col items-center justify-center gap-3 text-center">
        <p className={isLight ? 'text-slate-500' : 'text-gray-400'}>Sem dados para exibir</p>
        <Link to="/transactions?action=new" className="px-4 py-2 rounded-lg bg-teal-500 text-white text-xs font-bold">Lançar transação</Link>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => Math.abs(d.savings)), 1);

  return (
    <div className="w-full h-80">
      <div className="h-full flex items-end justify-around gap-2 px-4">
        {data.map((item, index) => {
          const isPositive = item.savings >= 0;
          const heightPercent = (Math.abs(item.savings) / maxValue) * 100;

          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                {formatCurrency(item.savings)}
              </div>
              <div
                className={`w-full rounded-t transition-all hover:opacity-80 ${isPositive ? 'bg-green-500' : 'bg-red-500'
                  }`}
                style={{ height: `${Math.max(heightPercent, 5)}%` }}
              >
                <title>{`${item.month}: ${formatCurrency(item.savings)}`}</title>
              </div>
              <div className={`text-xs font-medium ${isLight ? 'text-slate-600' : 'text-gray-300'}`}>
                {item.month}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Gráfico de Área (Receitas vs Despesas)
export const IncomeExpenseChart: React.FC<IncomeExpenseChartProps> = ({ data = [] }) => {
  const { theme } = useTheme();
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full min-h-[200px] flex flex-col items-center justify-center gap-3 text-center">
        <p className={theme === 'light' ? 'text-slate-500' : 'text-gray-400'}>Sem dados para exibir</p>
        <Link to="/transactions?action=new" className="px-4 py-2 rounded-lg bg-teal-500 text-white text-xs font-bold">Lançar transação</Link>
      </div>
    );
  }

  const safeData = data.map(d => ({
    month: d.month,
    income: Number((d as any).income ?? 0),
    expense: Number((d as any).expense ?? 0)
  }));

  const maxValueRaw = Math.max(
    ...safeData.map(d => Math.max(d.income, d.expense))
  );
  const maxValue = maxValueRaw > 0 ? maxValueRaw : 1;

  const width = 100;
  const height = 60;
  const padding = 5;

  const denom = safeData.length > 1 ? (safeData.length - 1) : 1;
  const incomePoints = safeData.map((item, index) => {
    const x = padding + (index / denom) * (width - 2 * padding);
    const y = height - padding - ((item.income / maxValue) * (height - 2 * padding));
    return `${x},${y}`;
  }).join(' ');

  const expensePoints = safeData.map((item, index) => {
    const x = padding + (index / denom) * (width - 2 * padding);
    const y = height - padding - ((item.expense / maxValue) * (height - 2 * padding));
    return `${x},${y}`;
  }).join(' ');

  // Criar área preenchida para receitas
  const incomeAreaPoints = safeData.map((item, index) => {
    const x = padding + (index / denom) * (width - 2 * padding);
    const y = height - padding - ((item.income / maxValue) * (height - 2 * padding));
    return [x, y];
  });
  const incomeArea = [
    ...incomeAreaPoints,
    [width - padding, height - padding],
    [padding, height - padding]
  ].map(p => p.join(',')).join(' ');

  // Criar área preenchida para despesas
  const expenseAreaPoints = safeData.map((item, index) => {
    const x = padding + (index / denom) * (width - 2 * padding);
    const y = height - padding - ((item.expense / maxValue) * (height - 2 * padding));
    return [x, y];
  });
  const expenseArea = [
    ...expenseAreaPoints,
    [width - padding, height - padding],
    [padding, height - padding]
  ].map(p => p.join(',')).join(' ');

  return (
    <div className="w-full h-auto flex flex-col">
      <div className="h-64 w-full shrink-0">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = height - padding - (ratio * (height - 2 * padding));
            return (
              <line
                key={i}
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="currentColor"
                strokeWidth="0.2"
                className="text-gray-300 dark:text-gray-700"
                strokeDasharray="1,1"
              />
            );
          })}

          {/* Área de Receitas (mais transparente) */}
          <polygon
            points={incomeArea}
            fill="#22c55e"
            fillOpacity="0.2"
          />

          {/* Linha de Receitas */}
          <polyline
            points={incomePoints}
            fill="none"
            stroke="#22c55e"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Área de Despesas (mais transparente) */}
          <polygon
            points={expenseArea}
            fill="#3b82f6"
            fillOpacity="0.2"
          />

          {/* Linha de Despesas */}
          <polyline
            points={expensePoints}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Pontos de Receitas */}
          {safeData.map((item, index) => {
            const x = padding + (index / denom) * (width - 2 * padding);
            const y = height - padding - ((item.income / maxValue) * (height - 2 * padding));
            return (
              <circle
                key={`income-${index}`}
                cx={x}
                cy={y}
                r="1.5"
                fill="#22c55e"
                className="cursor-pointer"
              >
                <title>Receita: R$ {Number(item.income ?? 0).toFixed(2)}</title>
              </circle>
            );
          })}

          {/* Pontos de Despesas */}
          {safeData.map((item, index) => {
            const x = padding + (index / denom) * (width - 2 * padding);
            const y = height - padding - ((item.expense / maxValue) * (height - 2 * padding));
            return (
              <circle
                key={`expense-${index}`}
                cx={x}
                cy={y}
                r="1.5"
                fill="#3b82f6"
                className="cursor-pointer"
              >
                <title>Despesa: R$ {Number(item.expense ?? 0).toFixed(2)}</title>
              </circle>
            );
          })}
        </svg>
      </div>

      {/* Labels dos meses */}
      <div className="flex justify-around mt-2 px-4">
        {safeData.map((item, index) => (
          <div key={index} className={`text-xs font-medium ${theme === 'light' ? 'text-slate-500' : 'text-gray-300'}`}>
            {item.month}
          </div>
        ))}
      </div>

      {/* Legenda */}
      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className={`text-sm ${theme === 'light' ? 'text-slate-700' : 'text-gray-200'}`}>Receitas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className={`text-sm ${theme === 'light' ? 'text-slate-700' : 'text-gray-200'}`}>Despesas</span>
        </div>
      </div>
    </div>
  );
};

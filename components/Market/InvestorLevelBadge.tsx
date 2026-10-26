// components/Market/InvestorLevelBadge.tsx
// Badge de nível do investidor com seletor para mudar perfil - Types only

import type { InvestorLevel } from '../../types/market';

// ============================================
// CONFIGURAÇÃO VISUAL
// ============================================

export const LEVEL_CONFIG: Record<InvestorLevel, {
  label: string;
  shortLabel: string;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
}> = {
  beginner: {
    label: 'Iniciante',
    shortLabel: 'Iniciante',
    icon: 'school',
    color: '#14b8a6',
    bgColor: 'bg-teal-500/10',
    description: 'Visão simplificada, foco no essencial',
  },
  intermediate: {
    label: 'Intermediário',
    shortLabel: 'Intermediário',
    icon: 'trending_up',
    color: '#3b82f6',
    bgColor: 'bg-blue-500/10',
    description: 'Dados completos para tomada de decisão',
  },
  advanced: {
    label: 'Avançado',
    shortLabel: 'Avançado',
    icon: 'analytics',
    color: '#8b5cf6',
    bgColor: 'bg-violet-500/10',
    description: 'Análise profunda, alertas, correlações',
  },
};

// ============================================
// TIPOS
// ============================================

export interface InvestorLevelBadgeProps {
  level: InvestorLevel;
  onClick?: () => void;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface SimpleLevelBadgeProps {
  level: InvestorLevel;
  size?: 'sm' | 'md';
  className?: string;
}
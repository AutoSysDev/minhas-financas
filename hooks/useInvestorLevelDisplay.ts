// hooks/useInvestorLevelDisplay.ts
// Hook para obter dados do nível do investidor

import { useInvestorProfile } from '../context/InvestorProfileContext';
import type { InvestorLevel } from '../types/market';
import { InvestorLevelBadge, SimpleLevelBadge } from '../components/Market';

// ============================================
// CONFIGURAÇÃO VISUAL (duplicada para evitar import circular)
// ============================================

const LEVEL_CONFIG: Record<InvestorLevel, {
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

export const useInvestorLevelDisplay = () => {
  const { profile, isLoaded } = useInvestorProfile();
  
  return {
    level: profile?.level || 'intermediate',
    isLoaded,
    config: profile ? LEVEL_CONFIG[profile.level] : LEVEL_CONFIG.intermediate,
    Badge: InvestorLevelBadge,
    SimpleBadge: SimpleLevelBadge,
  };
};
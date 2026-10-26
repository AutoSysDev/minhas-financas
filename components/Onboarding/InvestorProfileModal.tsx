// components/Onboarding/InvestorProfileModal.tsx
// Modal de onboarding para detectar perfil de investidor (3 perguntas)

import React, { useState, useCallback } from 'react';
import { Icon } from '../../components/Icon';
import { useInvestorProfile } from '../../context/InvestorProfileContext';
import type { InvestorLevel } from '../../types/market';

// ============================================
// TIPOS E CONSTANTES
// ============================================

interface OnboardingQuestion {
  id: string;
  question: string;
  subtitle?: string;
  type: 'single' | 'multiple';
  options: OnboardingOption[];
}

interface OnboardingOption {
  value: string;
  label: string;
  description: string;
  icon?: string;
  color?: string;
}

interface OnboardingAnswers {
  experience: InvestorLevel;
  interests: string[];
  goals: string;
}

const QUESTIONS: OnboardingQuestion[] = [
  {
    id: 'experience',
    question: 'Como você se define como investidor?',
    subtitle: 'Isso define a densidade de informações no seu dashboard',
    type: 'single',
    options: [
      {
        value: 'beginner',
        label: 'Iniciante',
        description: 'Começando agora, quero simplicidade e orientação',
        icon: 'school',
        color: '#14b8a6', // teal
      },
      {
        value: 'intermediate',
        label: 'Intermediário',
        description: 'Já invisto, quero dados para tomar decisões',
        icon: 'trending_up',
        color: '#3b82f6', // blue
      },
      {
        value: 'advanced',
        label: 'Avançado',
        description: 'Trader/Analista, preciso de tudo: gráficos, alertas, análise',
        icon: 'analytics',
        color: '#8b5cf6', // violet
      },
    ],
  },
  {
    id: 'interests',
    question: 'O que você quer acompanhar?',
    subtitle: 'Selecione todos que interessam (pode mudar depois nas configurações)',
    type: 'multiple',
    options: [
      {
        value: 'crypto',
        label: 'Criptomoedas',
        description: 'Bitcoin, Ethereum, DeFi, altcoins, trending',
        icon: 'currency_bitcoin',
        color: '#f59e0b', // amber
      },
      {
        value: 'fx',
        label: 'Câmbio / Moedas',
        description: 'USD, EUR, GBP, turismo, conversor, histórico',
        icon: 'currency_exchange',
        color: '#14b8a6', // teal
      },
      {
        value: 'brazil',
        label: 'Economia Brasileira',
        description: 'Selic, CDI, IPCA, IGP-M, poupança, câmbio comercial',
        icon: 'flag',
        color: '#009688', // teal-700
      },
      {
        value: 'stocks',
        label: 'Ações BR/US (em breve)',
        description: 'Cotações, fundamentos, dividendos, setores',
        icon: 'candlestick_chart',
        color: '#6366f1', // indigo
      },
    ],
  },
  {
    id: 'goals',
    question: 'Qual seu objetivo principal hoje?',
    subtitle: 'Ajuda a priorizar métricas e sugestões',
    type: 'single',
    options: [
      {
        value: 'reserve',
        label: 'Reserva de Emergência',
        description: 'Construir colchão de segurança (6-12 meses)',
        icon: 'shield',
        color: '#14b8a6',
      },
      {
        value: 'growth',
        label: 'Crescimento Patrimonial',
        description: 'Aumentar patrimônio no médio/longo prazo',
        icon: 'savings',
        color: '#3b82f6',
      },
      {
        value: 'income',
        label: 'Renda Passiva',
        description: 'Dividendos, aluguéis, juros compostos',
        icon: 'attach_money',
        color: '#8b5cf6',
      },
      {
        value: 'trading',
        label: 'Trading Ativo',
        description: 'Operações curtas, análise técnica, volatilidade',
        icon: 'flash_on',
        color: '#ef4444',
      },
    ],
  },
];

// ============================================
// COMPONENTES AUXILIARES
// ============================================

const StepIndicator: React.FC<{ 
  current: number; 
  total: number; 
  completed: number;
}> = ({ current, total, completed }) => (
  <div className="flex items-center justify-center gap-2 mb-6" role="progressbar" aria-valuenow={completed} aria-valuemin={0} aria-valuemax={total}>
    {Array.from({ length: total }, (_, i) => (
      <div key={i} className="flex items-center gap-1">
        {i < total - 1 && (
          <div 
            className={`h-1.5 flex-1 max-w-16 transition-colors ${i < completed ? 'bg-teal-500' : 'bg-gray-200 dark:bg-gray-700'}`} 
          />
        )}
        <div 
          className={`size-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
            i < completed 
              ? 'bg-teal-500 text-white' 
              : i === current 
                ? 'bg-teal-500/20 text-teal-500 dark:text-teal-400 ring-2 ring-teal-500/50' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
          }`}
          aria-current={i === current ? 'step' : undefined}
        >
          {i < completed ? (
            <Icon name="check" className="size-5" />
          ) : (
            <span>{i + 1}</span>
          )}
        </div>
      </div>
    ))}
  </div>
);

const OptionCard: React.FC<{
  option: OnboardingOption;
  selected: boolean;
  onClick: () => void;
  multiple?: boolean;
}> = ({ option, selected, onClick, multiple }) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative group w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
      selected
        ? 'border-teal-500 bg-teal-500/5 dark:bg-teal-500/10 shadow-lg shadow-teal-500/10'
        : 'border-gray-200 dark:border-gray-700 hover:border-teal-300 dark:hover:border-teal-600 hover:bg-teal-500/5 dark:hover:bg-teal-500/10'
    }`}
    aria-pressed={selected}
  >
    <div className="flex items-start gap-3">
      <div 
        className={`size-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
          selected 
            ? `bg-${option.color || 'teal'}-500 text-white` 
            : `bg-${option.color || 'teal'}-100 dark:bg-${option.color || 'teal'}-900/30 text-${option.color || 'teal'}-600 dark:text-${option.color || 'teal'}-400`
        }`}
      >
        <Icon name={option.icon || 'radio_button_unchecked'} className="size-6" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className={`font-semibold text-base transition-colors ${selected ? 'text-teal-700 dark:text-teal-300' : 'text-gray-900 dark:text-white'}`}>
            {option.label}
          </h4>
          {selected && (
            <Icon name="check_circle" className="size-5 text-teal-500 flex-shrink-0" />
          )}
        </div>
        <p className={`text-sm mt-1 transition-colors ${selected ? 'text-teal-600 dark:text-teal-400' : 'text-gray-500 dark:text-gray-400'}`}>
          {option.description}
        </p>
      </div>
      
      {/* Indicador visual de seleção */}
      <div 
        className={`size-6 rounded-full border-2 flex items-center justify-center transition-all ${
          multiple ? 'border-gray-300 dark:border-gray-600' : 'border-gray-300 dark:border-gray-600'
        } ${selected ? 'bg-teal-500 border-teal-500' : ''}`}
      >
        {selected && <Icon name="check" className="size-4 text-white" />}
      </div>
    </div>
    
    {/* Animação de borda brilhante */}
    {selected && (
      <div className="absolute inset-0 rounded-xl border-2 border-teal-500/50 animate-pulse pointer-events-none" />
    )}
  </button>
);

// ============================================
// MODAL PRINCIPAL
// ============================================

export const InvestorProfileModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { completeOnboarding, isLoaded } = useInvestorProfile();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<OnboardingAnswers>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const question = QUESTIONS[currentStep];
  const isLastStep = currentStep === QUESTIONS.length - 1;
  const progress = ((currentStep + 1) / QUESTIONS.length) * 100;
  const completedSteps = currentStep;
  
  // Validação por step
  const isStepValid = useCallback(() => {
    switch (question.id) {
      case 'experience':
        return !!answers.experience;
      case 'interests':
        return (answers.interests?.length || 0) > 0;
      case 'goals':
        return !!answers.goals;
      default:
        return false;
    }
  }, [question.id, answers]);
  
  // Handler de seleção
  const handleSelect = useCallback((value: string) => {
    setError(null);
    
    if (question.type === 'multiple') {
      const current = (answers[question.id as keyof OnboardingAnswers] as string[]) || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      
      setAnswers(prev => ({
        ...prev,
        [question.id]: updated,
      }));
    } else {
      setAnswers(prev => ({
        ...prev,
        [question.id]: value,
      }));
      
      // Auto-advance para single choice (melhor UX)
      if (!isLastStep) {
        setTimeout(() => setCurrentStep(s => s + 1), 300);
      }
    }
  }, [question, answers, isLastStep]);
  
  // Navegação
  const handleNext = useCallback(async () => {
    if (!isStepValid()) {
      setError('Selecione uma opção para continuar');
      return;
    }
    
    if (isLastStep) {
      await handleSubmit();
    } else {
      setCurrentStep(s => s + 1);
    }
  }, [isStepValid, isLastStep]);
  
  const handleBack = useCallback(() => {
    setError(null);
    setCurrentStep(s => s - 1);
  }, []);
  
  // Submit final
  const handleSubmit = useCallback(async () => {
    if (!isStepValid()) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await completeOnboarding(
        answers.experience!,
        {
          showCrypto: answers.interests?.includes('crypto') ?? true,
          showFx: answers.interests?.includes('fx') ?? true,
          showBrazilIndices: answers.interests?.includes('brazil') ?? true,
        }
      );
      onClose();
    } catch (err) {
      setError('Erro ao salvar perfil. Tente novamente.');
      console.error('[Onboarding] Submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, completeOnboarding, isStepValid, onClose]);
  
  // Fechar modal (apenas se já completou onboarding antes)
  const handleClose = useCallback(() => {
    const { profile } = useInvestorProfile();
    if (profile?.completedOnboarding) {
      onClose();
    }
    // Se não completou, não permite fechar (obrigatório)
  }, [onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="onboarding-title" className="text-xl font-bold text-gray-900 dark:text-white">
                Bem-vindo ao Monely Finance
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Vamos personalizar sua experiência em 3 perguntas rápidas
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Fechar"
              disabled={!isLoaded}
            >
              <Icon name="close" className="size-5" />
            </button>
          </div>
        </div>
        
        {/* Progress */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <StepIndicator 
            current={currentStep} 
            total={QUESTIONS.length} 
            completed={completedSteps} 
          />
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-3">
            <div 
              className="h-full bg-teal-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
            Etapa {currentStep + 1} de {QUESTIONS.length}
          </p>
        </div>
        
        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm flex items-center gap-2 animate-shake">
              <Icon name="error_outline" className="size-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {question.question}
            </h3>
            {question.subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {question.subtitle}
              </p>
            )}
          </div>
          
          <div 
            className="grid gap-3"
            role="radiogroup"
            aria-label={question.question}
          >
            {question.options.map((option) => {
              const selected = question.type === 'multiple'
                ? (answers[question.id as keyof OnboardingAnswers] as string[])?.includes(option.value)
                : answers[question.id as keyof OnboardingAnswers] === option.value;
              
              return (
                <OptionCard
                  key={option.value}
                  option={option}
                  selected={!!selected}
                  onClick={() => handleSelect(option.value)}
                  multiple={question.type === 'multiple'}
                />
              );
            })}
          </div>
          
          {/* Dica para multiple choice */}
          {question.type === 'multiple' && (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-4">
              Selecione todas que se aplicam
            </p>
          )}
        </div>
        
        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex gap-3">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                type="button"
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Voltar
              </button>
            )}
            
            <button
              onClick={handleNext}
              type="button"
              disabled={isSubmitting || !isStepValid()}
              className={`flex-1 ${currentStep > 0 ? '' : 'w-full'} px-4 py-2.5 rounded-xl font-medium transition-all ${
                isSubmitting
                  ? 'bg-teal-500/50 text-white cursor-wait'
                  : !isStepValid()
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-teal-500 hover:bg-teal-600 text-white shadow-md shadow-teal-500/20'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Icon name="hourglass_top" className="size-5 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : isLastStep ? (
                'Começar a usar'
              ) : (
                'Próximo'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// HOOK PARA USO FÁCIL
// ============================================

export function useInvestorOnboarding() {
  const { profile, isLoaded } = useInvestorProfile();
  const [isOpen, setIsOpen] = useState(false);
  
  // Auto-abrir se não completou onboarding
  useEffect(() => {
    if (isLoaded && profile && !profile.completedOnboarding) {
      setIsOpen(true);
    }
  }, [isLoaded, profile]);
  
  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    // Render do modal (para usar no layout principal)
    Modal: () => (
      <InvestorProfileModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    ),
  };
}
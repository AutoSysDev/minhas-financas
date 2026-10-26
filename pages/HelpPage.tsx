import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../components/Icon';
import { useTheme } from '../context/ThemeContext';

interface HelpSection {
  id: string;
  title: string;
  icon: string;
  description: string;
  steps: string[];
}

const helpSections: HelpSection[] = [
  {
    id: 'dashboard',
    title: 'Resumo (Dashboard)',
    icon: 'dashboard',
    description: 'Sua visão geral financeira. Acompanhe saldo atual, receitas e despesas do mês em um só lugar.',
    steps: [
      'Visualize o saldo total acumulado de todas as suas contas.',
      'Acompanhe o gráfico de despesas vs receitas do mês atual.',
      'Veja as últimas transações realizadas.',
      'Acesse atalhos rápidos para adicionar novas transações.'
    ]
  },
  {
    id: 'accounts',
    title: 'Contas',
    icon: 'account_balance',
    description: 'Gerencie suas contas bancárias, carteira física e outros locais onde você guarda dinheiro.',
    steps: [
      'Clique em "Nova Conta" para adicionar uma conta bancária ou carteira.',
      'Defina o saldo inicial para começar a controlar.',
      'Edite ou exclua contas conforme necessário.',
      'O saldo das contas é atualizado automaticamente conforme você registra transações.'
    ]
  },
  {
    id: 'transactions',
    title: 'Transações',
    icon: 'receipt_long',
    description: 'O coração do seu controle financeiro. Registre tudo o que entra e sai.',
    steps: [
      'Clique no botão "+" ou em "Nova Transação".',
      'Escolha entre Despesa, Receita ou Transferência.',
      'Preencha o valor, descrição, categoria e data.',
      'Selecione a conta de origem/destino.',
      'Marque como "Pago" se a transação já ocorreu, ou deixe desmarcado para agendar.'
    ]
  },
  {
    id: 'cards',
    title: 'Cartões de Crédito',
    icon: 'credit_card',
    description: 'Controle seus gastos no crédito e acompanhe suas faturas.',
    steps: [
      'Cadastre seus cartões de crédito informando limite e dia de fechamento/vencimento.',
      'Ao criar uma despesa, selecione o cartão como forma de pagamento.',
      'Acompanhe o limite disponível em tempo real.',
      'Visualize a fatura atual e as próximas faturas.'
    ]
  },
  {
    id: 'budgets',
    title: 'Orçamentos',
    icon: 'pie_chart',
    description: 'Defina limites de gastos para não estourar seu orçamento mensal.',
    steps: [
      'Crie um orçamento para uma categoria específica (ex: Alimentação).',
      'Defina o valor máximo que deseja gastar no mês.',
      'Acompanhe a barra de progresso para saber quanto ainda pode gastar.',
      'Receba alertas visuais quando estiver próximo do limite.'
    ]
  },
  {
    id: 'goals',
    title: 'Objetivos',
    icon: 'savings',
    description: 'Guarde dinheiro para seus sonhos e metas de longo prazo.',
    steps: [
      'Crie um objetivo (ex: Viagem, Carro Novo, Reserva de Emergência).',
      'Defina o valor alvo e a data limite.',
      'Registre depósitos no objetivo para ver seu progresso aumentar.',
      'Mantenha o foco até atingir 100% da sua meta.'
    ]
  },
  {
    id: 'reports',
    title: 'Relatórios e Estatísticas',
    icon: 'bar_chart',
    description: 'Entenda para onde está indo seu dinheiro com gráficos detalhados.',
    steps: [
      'Visualize a distribuição de gastos por categoria.',
      'Analise a evolução das suas despesas ao longo dos meses.',
      'Identifique onde você pode economizar mais.',
      'Filtre por períodos específicos para análises mais profundas.'
    ]
  },
  {
    id: 'settings',
    title: 'Configurações',
    icon: 'settings',
    description: 'Personalize sua experiência no Monely.',
    steps: [
      'Gerencie categorias de gastos e receitas.',
      'Configure notificações e lembretes.',
      'Altere o tema (Claro/Escuro) e preferências de privacidade.',
      'Gerencie seu perfil e dados de acesso.'
    ]
  }
];

const HelpPage: React.FC = () => {
  const { theme } = useTheme();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto pb-24 md:pb-8">
      <div className="mb-8">
        <h1 className={`text-2xl md:text-3xl font-bold mb-2 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
          Central de Ajuda
        </h1>
        <p className={`${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
          Aprenda como tirar o máximo proveito do Monely com nossos guias passo a passo.
        </p>
      </div>

      <div className="grid gap-4">
        {helpSections.map((section) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`rounded-2xl border overflow-hidden transition-all ${
              theme === 'light'
                ? 'bg-white border-gray-200 shadow-sm'
                : 'bg-white/[0.03] border-white/[0.1]'
            } ${expandedId === section.id ? 'ring-2 ring-teal-500/50' : ''}`}
          >
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full p-4 md:p-6 flex items-center gap-4 text-left focus:outline-none"
            >
              <div
                className={`size-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  theme === 'light'
                    ? 'bg-teal-50 text-teal-600'
                    : 'bg-teal-500/10 text-teal-400'
                }`}
              >
                <Icon name={section.icon} className="text-2xl" />
              </div>
              <div className="flex-1">
                <h3 className={`font-bold text-lg ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
                  {section.title}
                </h3>
                <p className={`text-sm mt-1 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
                  {section.description}
                </p>
              </div>
              <Icon
                name="expand_more"
                className={`text-2xl transition-transform duration-300 ${
                  expandedId === section.id ? 'rotate-180' : ''
                } ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`}
              />
            </button>

            <AnimatePresence>
              {expandedId === section.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className={`px-4 pb-6 md:px-6 md:pb-8 ml-16 md:ml-[5.5rem] border-l-2 ${
                    theme === 'light' ? 'border-gray-100' : 'border-white/[0.05]'
                  }`}>
                    <h4 className={`text-sm font-bold uppercase tracking-wider mb-4 ${
                      theme === 'light' ? 'text-teal-600' : 'text-teal-400'
                    }`}>
                      Passo a Passo
                    </h4>
                    <ul className="space-y-4">
                      {section.steps.map((step, index) => (
                        <li key={index} className="flex gap-3">
                          <span className={`flex items-center justify-center size-6 rounded-full text-xs font-bold shrink-0 ${
                            theme === 'light' 
                              ? 'bg-gray-100 text-gray-600' 
                              : 'bg-white/[0.1] text-gray-300'
                          }`}>
                            {index + 1}
                          </span>
                          <span className={`text-sm leading-relaxed ${
                            theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                          }`}>
                            {step}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default HelpPage;

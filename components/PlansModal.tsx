import React, { useState } from 'react';
import { Icon } from './Icon';
import { motion, AnimatePresence } from 'framer-motion';

interface PlansModalProps {
    isOpen: boolean;
    onClose: () => void;
    stripeInfo: {
        currency?: string;
        amount_monthly?: number;
        amount_yearly?: number;
    } | null;
    onSubscribe: (plan: 'monthly' | 'yearly') => void;
}

export const PlansModal: React.FC<PlansModalProps> = ({ isOpen, onClose, stripeInfo, onSubscribe }) => {
    const [selectedInterval, setSelectedInterval] = useState<'monthly' | 'yearly'>('monthly');

    const formatPrice = (amount?: number) => {
        if (!amount) return 'R$ 0,00';
        return (amount / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const benefits = [
        { name: 'Transações Ilimitadas', included: true },
        { name: 'Contas Bancárias Ilimitadas', included: true },
        { name: 'Cartões de Crédito Ilimitados', included: true },
        { name: 'Gestão de Orçamentos', included: true },
        { name: 'Relatórios Avançados', included: true },
        { name: 'Exportação de Dados', included: true },
        { name: 'Compartilhamento de Conta', included: true },
        { name: 'Suporte Prioritário', included: true },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-[#1A1F2C] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-[#1A1F2C] z-10">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <Icon name="workspace_premium" className="text-teal-400" />
                                Conheça os Planos Premium
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                            >
                                <Icon name="close" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 md:p-8 space-y-8">
                            {/* Intro */}
                            <div className="text-center space-y-4">
                                <h3 className="text-3xl font-bold text-white">Desbloqueie todo o potencial</h3>
                                <p className="text-gray-400 max-w-2xl mx-auto">
                                    Tenha controle total sobre suas finanças com recursos exclusivos que vão transformar sua gestão financeira.
                                </p>
                            </div>

                            {/* Plan Selection Toggle */}
                            <div className="flex justify-center">
                                <div className="bg-white/5 p-1 rounded-xl flex items-center relative">
                                    <button
                                        onClick={() => setSelectedInterval('monthly')}
                                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${selectedInterval === 'monthly'
                                                ? 'bg-teal-500 text-white shadow-lg'
                                                : 'text-gray-400 hover:text-white'
                                            }`}
                                    >
                                        Mensal
                                    </button>
                                    <button
                                        onClick={() => setSelectedInterval('yearly')}
                                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${selectedInterval === 'yearly'
                                                ? 'bg-teal-500 text-white shadow-lg'
                                                : 'text-gray-400 hover:text-white'
                                            }`}
                                    >
                                        Anual <span className="text-xs ml-1 bg-white/20 px-1.5 py-0.5 rounded-full text-white">-17%</span>
                                    </button>
                                </div>
                            </div>

                            {/* Pricing Cards & Benefits */}
                            <div className="grid md:grid-cols-2 gap-8 items-start">
                                {/* Benefits List */}
                                <div className="space-y-6">
                                    <h4 className="font-semibold text-white text-lg">Tudo o que você precisa:</h4>
                                    <div className="grid gap-4">
                                        {benefits.map((benefit, index) => (
                                            <div key={index} className="flex items-center gap-3 text-gray-300">
                                                <div className="p-1 rounded-full bg-teal-500/20 text-teal-400">
                                                    <Icon name="check" className="text-sm" />
                                                </div>
                                                <span>{benefit.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Selected Plan Card */}
                                <div className="bg-gradient-to-br from-teal-500/10 to-emerald-500/10 border border-teal-500/20 rounded-2xl p-6 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 bg-teal-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                                        RECOMENDADO
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <p className="text-teal-400 font-medium mb-2">
                                                {selectedInterval === 'monthly' ? 'Plano Mensal' : 'Plano Anual'}
                                            </p>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-4xl font-bold text-white">
                                                    {formatPrice(
                                                        selectedInterval === 'monthly'
                                                            ? stripeInfo?.amount_monthly
                                                            : stripeInfo?.amount_yearly
                                                    )}
                                                </span>
                                                <span className="text-gray-400">
                                                    /{selectedInterval === 'monthly' ? 'mês' : 'ano'}
                                                </span>
                                            </div>
                                            {selectedInterval === 'yearly' && (
                                                <p className="text-sm text-emerald-400 mt-2">
                                                    Economize {formatPrice(((stripeInfo?.amount_monthly || 0) * 12) - (stripeInfo?.amount_yearly || 0))} por ano
                                                </p>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => onSubscribe(selectedInterval)}
                                            className="w-full py-4 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 group"
                                        >
                                            Assinar Agora
                                            <Icon name="arrow_forward" className="group-hover:translate-x-1 transition-transform" />
                                        </button>

                                        <p className="text-xs text-center text-gray-500">
                                            Cancelamento fácil a qualquer momento. 7 dias de garantia.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

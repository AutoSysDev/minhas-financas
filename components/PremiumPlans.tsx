import React, { useState } from 'react';
import { Icon } from './Icon';
import { supabase } from '../services/supabase';
import { useToast } from '../context/ToastContext';
import { PlansModal } from './PlansModal';
import { EmbeddedCheckoutModal } from './EmbeddedCheckoutModal';

interface PremiumPlansProps {
    isPremium: boolean;
    stripeInfo: {
        currency?: string;
        amount_monthly?: number;
        amount_yearly?: number;
    } | null;
    onRefreshStripeInfo: () => void;
}

export const PremiumPlans: React.FC<PremiumPlansProps> = ({ isPremium, stripeInfo, onRefreshStripeInfo }) => {
    const { toast } = useToast();
    const [isPlansModalOpen, setIsPlansModalOpen] = useState(false);
    const [clientSecret, setClientSecret] = useState<string | null>(null);

    const formatPrice = (amount?: number, currency = 'BRL') => {
        if (!amount) return 'R$ 0,00';
        return (amount / 100).toLocaleString('pt-BR', { style: 'currency', currency });
    };

    const handleSubscribe = async (plan: 'monthly' | 'yearly', skipTrial: boolean = false) => {
        try {
            // Remove uiMode: 'embedded' to use Stripe Hosted Checkout
            const { data, error } = await supabase.functions.invoke('create-checkout-session', {
                body: { plan, skipTrial }
            });

            if (error) throw error;

            if (data?.url) {
                window.location.href = data.url;
            } else {
                throw new Error('URL de checkout não retornada');
            }
        } catch (error) {
            toast.error('Erro ao iniciar checkout: ' + (error as any).message);
        }
    };

    const handlePortal = async () => {
        try {
            const { data, error } = await supabase.functions.invoke('create-portal-session');
            if (error) throw error;
            if (data?.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            toast.error('Erro ao abrir portal: ' + (error as any).message);
        }
    };

    const handleCreatePlans = async () => {
        try {
            const { error } = await supabase.functions.invoke('setup-stripe-plans', { body: {} });
            if (error) throw error;
            toast.success('Planos criados/atualizados com sucesso!');
            onRefreshStripeInfo();
        } catch (error) {
            toast.error('Erro ao configurar planos: ' + (error as any).message);
        }
    };

    const features = [
        { name: 'Transações Ilimitadas', free: true, premium: true },
        { name: 'Categorias Personalizadas', free: true, premium: true },
        { name: 'Relatórios Avançados', free: false, premium: true },
        { name: 'Exportação (PDF/CSV)', free: false, premium: true },
        { name: 'Contas Compartilhadas', free: false, premium: true },
        { name: 'Suporte Prioritário', free: false, premium: true },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-teal-500/10 rounded-xl">
                        <Icon name="workspace_premium" className="text-teal-400 text-2xl" />
                    </div>
                    <div>
                        <h2 className="font-bold text-white text-xl">Planos & Assinatura</h2>
                        <p className="text-sm text-gray-500">Escolha o plano ideal para suas finanças</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsPlansModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-teal-400 rounded-lg transition-colors text-sm font-bold border border-teal-500/20"
                >
                    <Icon name="visibility" />
                    Conheça os Planos
                </button>
            </div>

            {!isPremium ? (
                <>
                    {/* Plans Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Monthly */}
                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.1] hover:border-teal-500/30 transition-all flex flex-col">
                            <div className="mb-4">
                                <span className="px-3 py-1 rounded-full bg-white/[0.05] text-gray-400 text-xs font-bold uppercase tracking-wider">Mensal</span>
                            </div>
                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-3xl font-bold text-white">
                                    {stripeInfo?.amount_monthly ? formatPrice(stripeInfo.amount_monthly, stripeInfo.currency) : 'R$ 15,99'}
                                </span>
                                <span className="text-gray-500">/mês</span>
                            </div>
                            <p className="text-sm text-gray-500 mb-6">Flexibilidade total. Cancele quando quiser.</p>

                            <ul className="space-y-3 mb-8 flex-1">
                                <li className="flex items-center gap-2 text-sm text-gray-300">
                                    <Icon name="check" className="text-teal-400 text-sm" />
                                    Acesso completo a todos recursos
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-300">
                                    <Icon name="check" className="text-teal-400 text-sm" />
                                    Cobrança automática mensal
                                </li>
                            </ul>

                            <button
                                onClick={() => handleSubscribe('monthly')}
                                className="w-full py-3 rounded-xl bg-teal-500 text-white font-bold hover:bg-teal-600 transition-colors shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2"
                            >
                                Assinar Mensal
                            </button>
                        </div>

                        {/* Yearly */}
                        <div className="relative p-6 rounded-2xl bg-gradient-to-b from-teal-500/10 to-transparent border border-teal-500/30 flex flex-col">
                            <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
                                <span className="px-3 py-1 bg-gradient-to-r from-teal-500 to-blue-500 text-white text-xs font-bold rounded-full shadow-lg">
                                    MELHOR VALOR
                                </span>
                            </div>

                            <div className="mb-4">
                                <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-400 text-xs font-bold uppercase tracking-wider">Anual</span>
                            </div>
                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-3xl font-bold text-white">
                                    {stripeInfo?.amount_yearly ? formatPrice(stripeInfo.amount_yearly, stripeInfo.currency) : 'R$ 99,90'}
                                </span>
                                <span className="text-gray-500">/ano</span>
                            </div>
                            <p className="text-sm text-gray-500 mb-6">Economize ~45% em comparação ao mensal.</p>

                            <ul className="space-y-3 mb-8 flex-1">
                                <li className="flex items-center gap-2 text-sm text-gray-300">
                                    <Icon name="check" className="text-teal-400 text-sm" />
                                    Todos os benefícios do Premium
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-300">
                                    <Icon name="check" className="text-teal-400 text-sm" />
                                    Pagamento único anual
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-300">
                                    <Icon name="check" className="text-teal-400 text-sm" />
                                    Prioridade no suporte
                                </li>
                            </ul>

                            <button
                                onClick={() => handleSubscribe('yearly')}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-blue-600 text-white font-bold hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                            >
                                Assinar Anual
                            </button>
                        </div>
                    </div>

                    {/* Comparison Section */}
                    <div className="pt-8 border-t border-white/[0.05]">
                        <h3 className="text-lg font-bold text-white mb-6">Comparativo de Planos</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[500px]">
                                <thead>
                                    <tr>
                                        <th className="p-4 text-sm font-bold text-gray-500 uppercase tracking-wider">Recurso</th>
                                        <th className="p-4 text-sm font-bold text-gray-500 text-center w-32">Gratuito</th>
                                        <th className="p-4 text-sm font-bold text-teal-400 text-center w-32">Premium</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.05]">
                                    {features.map((feat, idx) => (
                                        <tr key={idx} className="hover:bg-white/[0.02]">
                                            <td className="p-4 text-sm text-gray-300">{feat.name}</td>
                                            <td className="p-4 text-center">
                                                {feat.free ? (
                                                    <div className="flex justify-center"><Icon name="check" className="text-gray-400" /></div>
                                                ) : (
                                                    <div className="flex justify-center"><Icon name="close" className="text-gray-600" /></div>
                                                )}
                                            </td>
                                            <td className="p-4 text-center">
                                                {feat.premium ? (
                                                    <div className="flex justify-center">
                                                        <div className="inline-flex items-center justify-center size-6 rounded-full bg-teal-500/20">
                                                            <Icon name="check" className="text-teal-400 text-sm" />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-center"><Icon name="close" className="text-gray-600" /></div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <div className="p-8 rounded-2xl bg-gradient-to-br from-teal-500/20 via-blue-500/10 to-purple-500/5 border border-teal-500/30 text-center space-y-6">
                    <div className="size-20 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-teal-500/20">
                        <Icon name="verified" className="text-white text-4xl" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-2">Você é Premium!</h3>
                        <p className="text-gray-400 max-w-md mx-auto">
                            Sua assinatura está ativa e você tem acesso a todos os recursos exclusivos do Monely.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto pt-4">
                        <button
                            onClick={handlePortal}
                            className="px-6 py-3 rounded-xl bg-white/[0.1] hover:bg-white/[0.15] text-white font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <Icon name="credit_card" />
                            Gerenciar Assinatura
                        </button>
                        <button
                            onClick={() => setIsPlansModalOpen(true)}
                            className="px-6 py-3 rounded-xl bg-transparent border border-white/[0.1] hover:bg-white/[0.05] text-gray-300 font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <Icon name="visibility" />
                            Ver Detalhes do Plano
                        </button>
                    </div>
                </div>
            )}

            {/* Admin/Debug Restore Button */}
            <div className="flex justify-center pt-8 border-t border-white/[0.05] mt-8">
                <button
                    onClick={handleCreatePlans}
                    className="text-xs text-gray-600 hover:text-gray-400 flex items-center gap-1 transition-colors"
                >
                    <Icon name="refresh" className="text-[10px]" />
                    Sincronizar Planos (Admin)
                </button>
            </div>

            {/* Modal de Planos Detalhado */}
            <PlansModal
                isOpen={isPlansModalOpen}
                onClose={() => setIsPlansModalOpen(false)}
                onSubscribe={handleSubscribe}
                stripeInfo={stripeInfo}
            />
        </div>
    );
};

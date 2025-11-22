import { useEffect, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useNotifications } from '../context/NotificationContext';
import { createNotificationService } from '../services/NotificationService';
import { useAuth } from '../context/AuthContext';

/**
 * Hook para agendar e executar verificações de notificações
 */
export const useNotificationScheduler = () => {
    const { user } = useAuth();
    const { accounts, budgets, cards, goals, transactions } = useFinance();
    const { settings, addNotification } = useNotifications();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Função para executar todas as verificações
    const runAllChecks = async () => {
        if (!user) return;

        const service = createNotificationService(user.id, settings);

        try {
            // 1. Verificar alertas de orçamento
            const budgetAlerts = await service.checkBudgetAlerts(budgets, transactions);
            for (const notification of budgetAlerts) {
                await addNotification(notification);
            }

            // 2. Verificar limites de cartão
            const cardLimitAlerts = await service.checkCardLimits(cards);
            for (const notification of cardLimitAlerts) {
                await addNotification(notification);
            }

            // 3. Verificar progresso de metas (semanal)
            const today = new Date().getDay();
            if (today === 0) { // Domingo
                const goalProgress = await service.checkGoalProgress(goals);
                for (const notification of goalProgress) {
                    await addNotification(notification);
                }
            }

            // 4. Gerar resumo semanal (se configurado)
            const weeklySummary = await service.generateWeeklySummary(transactions);
            if (weeklySummary) {
                await addNotification(weeklySummary);
            }

            // 5. Gerar dicas de economia (baseado na frequência)
            const shouldGenerateTip = checkShouldGenerateTip(settings.savingsTips.frequency);
            if (shouldGenerateTip) {
                const savingsTip = await service.generateSavingsTips(transactions);
                if (savingsTip) {
                    await addNotification(savingsTip);
                }
            }

            console.log('✅ Verificação de notificações concluída');
        } catch (error) {
            console.error('❌ Erro ao verificar notificações:', error);
        }
    };

    // Verificar se deve gerar dica baseado na frequência
    const checkShouldGenerateTip = (frequency: 'daily' | 'weekly' | 'monthly'): boolean => {
        const lastTipKey = 'last_savings_tip_date';
        const lastTipDate = localStorage.getItem(lastTipKey);
        const today = new Date();

        if (!lastTipDate) {
            localStorage.setItem(lastTipKey, today.toISOString());
            return true;
        }

        const lastDate = new Date(lastTipDate);
        const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        let shouldGenerate = false;
        switch (frequency) {
            case 'daily':
                shouldGenerate = daysDiff >= 1;
                break;
            case 'weekly':
                shouldGenerate = daysDiff >= 7;
                break;
            case 'monthly':
                shouldGenerate = daysDiff >= 30;
                break;
        }

        if (shouldGenerate) {
            localStorage.setItem(lastTipKey, today.toISOString());
        }

        return shouldGenerate;
    };

    // Executar verificações ao montar e periodicamente
    useEffect(() => {
        if (!user) return;

        // Executar imediatamente
        runAllChecks();

        // Executar a cada 1 hora
        intervalRef.current = setInterval(() => {
            runAllChecks();
        }, 60 * 60 * 1000); // 1 hora

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [user, accounts, budgets, cards, goals, transactions, settings]);

    // Executar verificações quando houver mudanças importantes
    useEffect(() => {
        if (user && transactions.length > 0) {
            // Verificar alertas após nova transação
            const checkAfterTransaction = async () => {
                const service = createNotificationService(user.id, settings);

                const budgetAlerts = await service.checkBudgetAlerts(budgets, transactions);
                for (const notification of budgetAlerts) {
                    await addNotification(notification);
                }

                const cardLimitAlerts = await service.checkCardLimits(cards);
                for (const notification of cardLimitAlerts) {
                    await addNotification(notification);
                }
            };

            checkAfterTransaction();
        }
    }, [transactions.length]); // Executar quando o número de transações mudar

    return { runAllChecks };
};

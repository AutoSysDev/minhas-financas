import { Notification, NotificationType, NotificationSettings } from '../types/notifications';
import { Account, Budget, Card, Goal, Transaction } from '../types';
import { supabase } from './supabase';

export class NotificationService {
    private userId: string;
    private settings: NotificationSettings;

    constructor(userId: string, settings: NotificationSettings) {
        this.userId = userId;
        this.settings = settings;
    }

    /**
     * Verifica lembretes de contas a vencer
     */
    async checkBillReminders(accounts: Account[]): Promise<Omit<Notification, 'id' | 'timestamp' | 'isRead'>[]> {
        if (!this.settings.billReminder.enabled) return [];

        const notifications: Omit<Notification, 'id' | 'timestamp' | 'isRead'>[] = [];
        const today = new Date();
        const daysThreshold = this.settings.billReminder.daysBeforeDue;

        for (const account of accounts) {
            // Aqui você pode adicionar lógica para contas com data de vencimento
            // Por enquanto, vamos criar um exemplo genérico
            // TODO: Implementar quando houver campo de vencimento nas contas
        }

        return notifications;
    }

    /**
     * Verifica alertas de orçamento
     */
    async checkBudgetAlerts(budgets: Budget[], transactions: Transaction[]): Promise<Omit<Notification, 'id' | 'timestamp' | 'isRead'>[]> {
        if (!this.settings.budgetAlert.enabled) return [];

        const notifications: Omit<Notification, 'id' | 'timestamp' | 'isRead'>[] = [];
        const threshold = this.settings.budgetAlert.threshold;

        for (const budget of budgets) {
            const percentageUsed = budget.limit > 0 ? (budget.spent / budget.limit) * 100 : 0;

            if (percentageUsed >= threshold) {
                // Verificar se já existe notificação para este orçamento hoje
                const today = new Date().toISOString().split('T')[0];
                const existingKey = `budget_alert_${budget.category}_${today}`;

                const { data: existing } = await supabase
                    .from('notifications')
                    .select('id')
                    .eq('user_id', this.userId)
                    .eq('type', NotificationType.BUDGET_ALERT)
                    .gte('timestamp', today)
                    .single();

                if (!existing) {
                    notifications.push({
                        type: NotificationType.BUDGET_ALERT,
                        title: 'Alerta de Orçamento',
                        message: `Você já gastou ${percentageUsed.toFixed(0)}% do orçamento de ${budget.category}. Limite: R$ ${budget.limit.toFixed(2)}`,
                        icon: 'warning',
                        color: percentageUsed > 100 ? '#ef4444' : '#f59e0b',
                        priority: percentageUsed > 100 ? 'high' : 'medium',
                        actionUrl: '/budgets'
                    });
                }
            }
        }

        return notifications;
    }

    /**
     * Gera resumo semanal
     */
    async generateWeeklySummary(transactions: Transaction[]): Promise<Omit<Notification, 'id' | 'timestamp' | 'isRead'> | null> {
        if (!this.settings.weeklySummary.enabled) return null;

        const today = new Date();
        const dayOfWeek = today.getDay();

        // Verificar se hoje é o dia configurado
        if (dayOfWeek !== this.settings.weeklySummary.dayOfWeek) return null;

        // Calcular período: últimos 7 dias
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        const weekTransactions = transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate >= weekAgo && tDate <= today;
        });

        const income = weekTransactions
            .filter(t => t.type === 'INCOME')
            .reduce((sum, t) => sum + t.amount, 0);

        const expenses = weekTransactions
            .filter(t => t.type === 'EXPENSE')
            .reduce((sum, t) => sum + t.amount, 0);

        const balance = income - expenses;

        // Categoria com maior gasto
        const categoryExpenses: { [key: string]: number } = {};
        weekTransactions
            .filter(t => t.type === 'EXPENSE')
            .forEach(t => {
                categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + t.amount;
            });

        const topCategory = Object.entries(categoryExpenses)
            .sort((a, b) => b[1] - a[1])[0];

        const message = `
📊 Resumo da Semana:
💰 Receitas: R$ ${income.toFixed(2)}
💸 Despesas: R$ ${expenses.toFixed(2)}
${balance >= 0 ? '✅' : '⚠️'} Saldo: R$ ${balance.toFixed(2)}
${topCategory ? `🏆 Maior gasto: ${topCategory[0]} (R$ ${topCategory[1].toFixed(2)})` : ''}
    `.trim();

        return {
            type: NotificationType.WEEKLY_SUMMARY,
            title: 'Resumo Semanal',
            message,
            icon: 'assessment',
            color: '#3b82f6',
            priority: 'low',
            actionUrl: '/reports'
        };
    }

    /**
     * Gera dicas de economia
     */
    async generateSavingsTips(transactions: Transaction[]): Promise<Omit<Notification, 'id' | 'timestamp' | 'isRead'> | null> {
        if (!this.settings.savingsTips.enabled) return null;

        // Analisar padrões de gastos
        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);

        const recentTransactions = transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate >= last30Days && t.type === 'EXPENSE';
        });

        // Calcular gastos por categoria
        const categoryTotals: { [key: string]: number } = {};
        recentTransactions.forEach(t => {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        });

        // Encontrar categoria com maior gasto
        const topCategory = Object.entries(categoryTotals)
            .sort((a, b) => b[1] - a[1])[0];

        if (!topCategory) return null;

        const tips = this.getSavingsTipsByCategory(topCategory[0], topCategory[1]);

        return {
            type: NotificationType.SAVINGS_TIP,
            title: 'Dica de Economia',
            message: tips,
            icon: 'lightbulb',
            color: '#10b981',
            priority: 'low',
            actionUrl: '/reports'
        };
    }

    /**
     * Verifica progresso de metas
     */
    async checkGoalProgress(goals: Goal[]): Promise<Omit<Notification, 'id' | 'timestamp' | 'isRead'>[]> {
        const notifications: Omit<Notification, 'id' | 'timestamp' | 'isRead'>[] = [];

        for (const goal of goals) {
            const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;

            // Verificar marcos importantes
            const milestones = [25, 50, 75, 100];
            for (const milestone of milestones) {
                if (progress >= milestone && progress < milestone + 5) {
                    // Verificar se já notificou este marco
                    const key = `goal_progress_${goal.id}_${milestone}`;
                    const { data: existing } = await supabase
                        .from('notifications')
                        .select('id')
                        .eq('user_id', this.userId)
                        .eq('type', NotificationType.GOAL_PROGRESS)
                        .ilike('message', `%${milestone}%`)
                        .single();

                    if (!existing) {
                        notifications.push({
                            type: NotificationType.GOAL_PROGRESS,
                            title: milestone === 100 ? '🎉 Meta Alcançada!' : '🎯 Progresso da Meta',
                            message: milestone === 100
                                ? `Parabéns! Você alcançou sua meta "${goal.name}"!`
                                : `Você atingiu ${milestone}% da meta "${goal.name}". Continue assim!`,
                            icon: milestone === 100 ? 'celebration' : 'trending_up',
                            color: '#8b5cf6',
                            priority: 'low',
                            actionUrl: '/goals'
                        });
                    }
                }
            }

            // Verificar meta próxima do prazo sem progresso
            if (goal.deadline) {
                const deadline = new Date(goal.deadline);
                const today = new Date();
                const daysUntilDeadline = Math.floor((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                if (daysUntilDeadline <= 30 && daysUntilDeadline > 0 && progress < 50) {
                    notifications.push({
                        type: NotificationType.GOAL_PROGRESS,
                        title: '⏰ Meta Próxima do Prazo',
                        message: `Faltam ${daysUntilDeadline} dias para a meta "${goal.name}". Você está em ${progress.toFixed(0)}% do objetivo.`,
                        icon: 'schedule',
                        color: '#f59e0b',
                        priority: 'medium',
                        actionUrl: '/goals'
                    });
                }
            }
        }

        return notifications;
    }

    /**
     * Verifica limites de cartão
     */
    async checkCardLimits(cards: Card[]): Promise<Omit<Notification, 'id' | 'timestamp' | 'isRead'>[]> {
        const notifications: Omit<Notification, 'id' | 'timestamp' | 'isRead'>[] = [];

        for (const card of cards) {
            if (card.status !== 'active') continue;

            const percentageUsed = card.limit > 0 ? (card.currentInvoice / card.limit) * 100 : 0;

            if (percentageUsed >= 80) {
                // Verificar se já existe notificação para este cartão hoje
                const today = new Date().toISOString().split('T')[0];
                const { data: existing } = await supabase
                    .from('notifications')
                    .select('id')
                    .eq('user_id', this.userId)
                    .eq('type', NotificationType.CARD_LIMIT)
                    .gte('timestamp', today)
                    .single();

                if (!existing) {
                    notifications.push({
                        type: NotificationType.CARD_LIMIT,
                        title: 'Alerta de Limite do Cartão',
                        message: `O cartão ${card.name} está em ${percentageUsed.toFixed(0)}% do limite. Fatura atual: R$ ${card.currentInvoice.toFixed(2)}`,
                        icon: 'credit_card',
                        color: percentageUsed > 95 ? '#ef4444' : '#f59e0b',
                        priority: percentageUsed > 95 ? 'high' : 'medium',
                        actionUrl: '/cards'
                    });
                }
            }
        }

        return notifications;
    }

    /**
     * Retorna dica de economia baseada na categoria
     */
    private getSavingsTipsByCategory(category: string, amount: number): string {
        const tips: { [key: string]: string[] } = {
            'Alimentação': [
                `Você gastou R$ ${amount.toFixed(2)} em alimentação este mês. Cozinhar em casa pode economizar até 60%!`,
                'Planeje suas refeições semanalmente para evitar desperdícios e gastos extras.',
                'Compre em atacado itens não perecíveis para economizar a longo prazo.'
            ],
            'Transporte': [
                `Gastos com transporte: R$ ${amount.toFixed(2)}. Considere caronas ou transporte público.`,
                'Avaliar alternativas de transporte pode gerar economia significativa.',
                'Aplicativos de carona compartilhada podem reduzir custos em até 40%.'
            ],
            'Lazer': [
                `Gastos com lazer: R$ ${amount.toFixed(2)}. Busque opções gratuitas ou mais econômicas.`,
                'Aproveite eventos gratuitos na sua cidade para economizar.',
                'Estabeleça um orçamento mensal fixo para entretenimento.'
            ],
            'Outros': [
                `Você gastou R$ ${amount.toFixed(2)} este mês. Pequenas economias fazem grande diferença!`,
                'Revise seus gastos recorrentes e cancele assinaturas não utilizadas.',
                'Aguardar 24h antes de compras impulsivas pode evitar gastos desnecessários.'
            ]
        };

        const categoryTips = tips[category] || tips['Outros'];
        return categoryTips[Math.floor(Math.random() * categoryTips.length)];
    }
}

/**
 * Função auxiliar para criar instância do serviço
 */
export const createNotificationService = (userId: string, settings: NotificationSettings) => {
    return new NotificationService(userId, settings);
};

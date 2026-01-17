import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Notification, NotificationSettings, NotificationType, DEFAULT_NOTIFICATION_SETTINGS } from '../types/notifications';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';

interface NotificationContextType {
    notifications: Notification[];
    settings: NotificationSettings;
    unreadCount: number;
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    clearAll: () => Promise<void>;
    updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
    loading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
    const [loading, setLoading] = useState(false);
    const [tablesAvailable, setTablesAvailable] = useState({ notifications: true, settings: true });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    // Fetch notifications
    const fetchNotifications = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(50);

            if (error) {
                // Tabela inexistente: desativar chamadas futuras e usar estado local
                if ((error as any).code === 'PGRST205') {
                    setTablesAvailable(prev => ({ ...prev, notifications: false }));
                    setNotifications([]);
                    return;
                }
                throw error;
            }

            if (data) {
                setNotifications(data.map((n: any) => ({
                    id: n.id,
                    type: n.type as NotificationType,
                    title: n.title,
                    message: n.message,
                    icon: n.icon,
                    color: n.color,
                    timestamp: new Date(n.timestamp),
                    isRead: n.is_read,
                    actionUrl: n.action_url,
                    priority: n.priority
                })));
            }
        } catch (error) {
            // Falha não bloqueante
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch settings
    const fetchSettings = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('notification_settings')
                .select('*')
                .single();

            if (error) {
                // PGRST116 = No rows found -> cria padrão
                if ((error as any).code === 'PGRST205') {
                    // Tabela inexistente: usar padrões locais e desativar persistência
                    setTablesAvailable(prev => ({ ...prev, settings: false }));
                    setSettings(DEFAULT_NOTIFICATION_SETTINGS);
                    return;
                }
                if ((error as any).code !== 'PGRST116') throw error;
            }

            if (data) {
                setSettings({
                    billReminder: {
                        enabled: data.bill_reminder_enabled,
                        daysBeforeDue: data.bill_reminder_days
                    },
                    budgetAlert: {
                        enabled: data.budget_alert_enabled,
                        threshold: data.budget_alert_threshold
                    },
                    weeklySummary: {
                        enabled: data.weekly_summary_enabled,
                        dayOfWeek: data.weekly_summary_day
                    },
                    savingsTips: {
                        enabled: data.savings_tips_enabled,
                        frequency: data.savings_tips_frequency
                    }
                });
            } else {
                // Criar padrão apenas se a tabela existir
                if (tablesAvailable.settings) {
                    await supabase.from('notification_settings').insert({
                        user_id: user.id,
                        bill_reminder_enabled: DEFAULT_NOTIFICATION_SETTINGS.billReminder.enabled,
                        bill_reminder_days: DEFAULT_NOTIFICATION_SETTINGS.billReminder.daysBeforeDue,
                        budget_alert_enabled: DEFAULT_NOTIFICATION_SETTINGS.budgetAlert.enabled,
                        budget_alert_threshold: DEFAULT_NOTIFICATION_SETTINGS.budgetAlert.threshold,
                        weekly_summary_enabled: DEFAULT_NOTIFICATION_SETTINGS.weeklySummary.enabled,
                        weekly_summary_day: DEFAULT_NOTIFICATION_SETTINGS.weeklySummary.dayOfWeek,
                        savings_tips_enabled: DEFAULT_NOTIFICATION_SETTINGS.savingsTips.enabled,
                        savings_tips_frequency: DEFAULT_NOTIFICATION_SETTINGS.savingsTips.frequency
                    });
                }
            }
        } catch (error) {
            // Falha não bloqueante
            setSettings(DEFAULT_NOTIFICATION_SETTINGS);
        }
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();
            fetchSettings();
        }
    }, [user]);

    // Check for scheduled notifications (Client-side fallback/immediate check)
    useEffect(() => {
        const checkScheduledNotifications = async () => {
            if (!user || !tablesAvailable.notifications || loading) return;

            // 1. Bill Reminders (Transactions)
            if (settings.billReminder.enabled) {
                const days = settings.billReminder.daysBeforeDue;
                const targetDate = new Date();
                targetDate.setDate(targetDate.getDate() + days);
                const targetDateStr = targetDate.toISOString().split('T')[0];

                try {
                    const { data: transactions } = await supabase
                        .from('transactions')
                        .select('*')
                        .eq('user_id', user.id)
                        .in('type', ['EXPENSE', 'INCOME'])
                        .eq('is_paid', false)
                        .eq('date', targetDateStr);

                    if (transactions && transactions.length > 0) {
                        for (const trans of transactions) {
                            const isExpense = trans.type === 'EXPENSE';
                            const typeLabel = isExpense ? 'Conta' : 'Receita';
                            const actionVerb = isExpense ? 'vence' : 'está prevista';

                            // Check duplication
                            const { data: existing } = await supabase
                                .from('notifications')
                                .select('id')
                                .eq('user_id', user.id)
                                .eq('type', NotificationType.BILL_REMINDER)
                                .ilike('message', `%${trans.description}%`)
                                .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                                .maybeSingle();

                            if (!existing) {
                                await addNotification({
                                    type: NotificationType.BILL_REMINDER,
                                    title: `${typeLabel} próxima do vencimento`,
                                    message: `${typeLabel} "${trans.description}" de R$ ${trans.amount} ${actionVerb} em ${days} dia(s) (${trans.date}).`,
                                    icon: isExpense ? 'receipt_long' : 'payments',
                                    color: isExpense ? '#ef4444' : '#22c55e',
                                    priority: 'high',
                                    actionUrl: '/transactions'
                                });
                            }
                        }
                    }
                } catch (err) {
                    console.error('Error checking transaction reminders:', err);
                }
            }
        };

        if (user && !loading) {
            // Delay slightly to ensure data is likely consistent
            const timer = setTimeout(() => {
                checkScheduledNotifications();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [user, settings, loading, tablesAvailable]);

    const addNotification = async (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
        if (!user) return;
        if (!tablesAvailable.notifications) {
            // Persistência indisponível: manter local
            setNotifications(prev => ([
                {
                    id: Math.random().toString(36).slice(2),
                    type: notification.type,
                    title: notification.title,
                    message: notification.message,
                    icon: notification.icon,
                    color: notification.color,
                    timestamp: new Date(),
                    isRead: false,
                    actionUrl: notification.actionUrl,
                    priority: notification.priority
                },
                ...prev
            ]));
            return;
        }

        try {
            const { error } = await supabase.from('notifications').insert({
                user_id: user.id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                icon: notification.icon,
                color: notification.color,
                action_url: notification.actionUrl,
                priority: notification.priority
            });

            if (error) throw error;
            await fetchNotifications();
        } catch (error) {
            console.error('Error adding notification:', error);
        }
    };

    const markAsRead = async (id: string) => {
        if (!user) return;
        if (!tablesAvailable.notifications) {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            return;
        }

        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);

            if (error) throw error;
            await fetchNotifications();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        if (!user) return;
        if (!tablesAvailable.notifications) {
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            return;
        }

        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .eq('is_read', false);

            if (error) throw error;
            await fetchNotifications();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const deleteNotification = async (id: string) => {
        if (!user) return;
        if (!tablesAvailable.notifications) {
            setNotifications(prev => prev.filter(n => n.id !== id));
            return;
        }

        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await fetchNotifications();
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const clearAll = async () => {
        if (!user) return;
        if (!tablesAvailable.notifications) {
            setNotifications([]);
            return;
        }

        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('user_id', user.id);

            if (error) throw error;
            await fetchNotifications();
        } catch (error) {
            console.error('Error clearing notifications:', error);
        }
    };

    const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
        if (!user) return;

        const updatedSettings = { ...settings, ...newSettings };
        setSettings(updatedSettings);

        try {
            if (!tablesAvailable.settings) return;
            const { error } = await supabase
                .from('notification_settings')
                .upsert({
                    user_id: user.id,
                    bill_reminder_enabled: updatedSettings.billReminder.enabled,
                    bill_reminder_days: updatedSettings.billReminder.daysBeforeDue,
                    budget_alert_enabled: updatedSettings.budgetAlert.enabled,
                    budget_alert_threshold: updatedSettings.budgetAlert.threshold,
                    weekly_summary_enabled: updatedSettings.weeklySummary.enabled,
                    weekly_summary_day: updatedSettings.weeklySummary.dayOfWeek,
                    savings_tips_enabled: updatedSettings.savingsTips.enabled,
                    savings_tips_frequency: updatedSettings.savingsTips.frequency,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
        } catch (error) {
            console.error('Error updating notification settings:', error);
        }
    };

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                settings,
                unreadCount,
                addNotification,
                markAsRead,
                markAllAsRead,
                deleteNotification,
                clearAll,
                updateSettings,
                loading
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

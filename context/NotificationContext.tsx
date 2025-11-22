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

            if (error) throw error;

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
            console.error('Error fetching notifications:', error);
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

            if (error && error.code !== 'PGRST116') throw error;

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
                // Create default settings
                await supabase.from('notification_settings').insert({
                    user_id: user.id,
                    ...DEFAULT_NOTIFICATION_SETTINGS
                });
            }
        } catch (error) {
            console.error('Error fetching notification settings:', error);
        }
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();
            fetchSettings();
        }
    }, [user]);

    const addNotification = async (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
        if (!user) return;

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

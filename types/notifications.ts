export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    icon: string;
    color: string;
    timestamp: Date;
    isRead: boolean;
    actionUrl?: string;
    priority: 'low' | 'medium' | 'high';
}

export enum NotificationType {
    BILL_REMINDER = 'bill_reminder',
    BUDGET_ALERT = 'budget_alert',
    WEEKLY_SUMMARY = 'weekly_summary',
    SAVINGS_TIP = 'savings_tip',
    GOAL_PROGRESS = 'goal_progress',
    CARD_LIMIT = 'card_limit'
}

export interface NotificationSettings {
    billReminder: {
        enabled: boolean;
        daysBeforeDue: number;
    };
    budgetAlert: {
        enabled: boolean;
        threshold: number;
    };
    weeklySummary: {
        enabled: boolean;
        dayOfWeek: number; // 0-6 (domingo-sábado)
    };
    savingsTips: {
        enabled: boolean;
        frequency: 'daily' | 'weekly' | 'monthly';
    };
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
    billReminder: {
        enabled: true,
        daysBeforeDue: 2
    },
    budgetAlert: {
        enabled: true,
        threshold: 90
    },
    weeklySummary: {
        enabled: false,
        dayOfWeek: 0 // Domingo
    },
    savingsTips: {
        enabled: false,
        frequency: 'weekly'
    }
};

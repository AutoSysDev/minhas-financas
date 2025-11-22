import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Icon } from './Icon';
import { useNotifications } from '../context/NotificationContext';
import { NotificationType } from '../types/notifications';
import { useNavigate } from 'react-router-dom';

export const NotificationPanel: React.FC = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAll } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const navigate = useNavigate();

    const getNotificationIcon = (type: NotificationType): string => {
        switch (type) {
            case NotificationType.BILL_REMINDER:
                return 'receipt_long';
            case NotificationType.BUDGET_ALERT:
                return 'warning';
            case NotificationType.WEEKLY_SUMMARY:
                return 'assessment';
            case NotificationType.SAVINGS_TIP:
                return 'lightbulb';
            case NotificationType.GOAL_PROGRESS:
                return 'trending_up';
            case NotificationType.CARD_LIMIT:
                return 'credit_card';
            default:
                return 'notifications';
        }
    };

    const handleNotificationClick = async (notification: any) => {
        await markAsRead(notification.id);
        if (notification.actionUrl) {
            navigate(notification.actionUrl);
            setIsOpen(false);
        }
    };

    const formatTimestamp = (date: Date): string => {
        const now = new Date();
        const diffMs = now.getTime() - new Date(date).getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Agora';
        if (diffMins < 60) return `${diffMins}m atrás`;
        if (diffHours < 24) return `${diffHours}h atrás`;
        if (diffDays === 1) return 'Ontem';
        if (diffDays < 7) return `${diffDays}d atrás`;
        return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    };

    // Calcular posição do painel baseado no botão
    const [panelPosition, setPanelPosition] = useState({ top: 0, right: 0 });

    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPanelPosition({
                top: rect.bottom + 8,
                right: window.innerWidth - rect.right
            });
        }
    }, [isOpen]);

    const panelContent = isOpen && (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 z-[9998]"
                onClick={() => setIsOpen(false)}
                aria-hidden="true"
            />

            {/* Panel de notificações */}
            <div
                className="fixed w-96 max-h-[600px] bg-[#1a1d21] border border-white/[0.1] rounded-xl shadow-2xl z-[9999] flex flex-col animate-fade-in"
                style={{ top: `${panelPosition.top}px`, right: `${panelPosition.right}px` }}
            >
                {/* Header */}
                <div className="p-4 border-b border-white/[0.1]">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold text-white">Notificações</h3>
                        {unreadCount > 0 && (
                            <span className="px-2 py-1 bg-teal-500/20 text-teal-400 text-xs font-bold rounded-full">
                                {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="flex gap-2">
                            <button
                                onClick={markAllAsRead}
                                className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors"
                            >
                                Marcar todas como lidas
                            </button>
                            <button
                                onClick={clearAll}
                                className="flex-1 px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                                Limpar tudo
                            </button>
                        </div>
                    )}
                </div>

                {/* Lista de notificações */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4">
                            <Icon name="notifications_off" className="text-5xl text-gray-600 mb-3" />
                            <p className="text-gray-500 text-sm text-center">
                                Nenhuma notificação no momento
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/[0.05]">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`p-4 transition-all cursor-pointer ${notification.isRead
                                            ? 'bg-transparent hover:bg-white/[0.02]'
                                            : 'bg-white/[0.03] hover:bg-white/[0.05]'
                                        }`}
                                >
                                    <div className="flex gap-3">
                                        {/* Ícone */}
                                        <div
                                            className="size-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                            style={{ backgroundColor: `${notification.color}20` }}
                                        >
                                            <Icon
                                                name={getNotificationIcon(notification.type)}
                                                className="text-xl"
                                                style={{ color: notification.color }}
                                            />
                                        </div>

                                        {/* Conteúdo */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <h4 className={`text-sm font-bold ${notification.isRead ? 'text-gray-400' : 'text-white'}`}>
                                                    {notification.title}
                                                </h4>
                                                {!notification.isRead && (
                                                    <div className="size-2 bg-teal-500 rounded-full flex-shrink-0 mt-1" />
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 mb-2 line-clamp-2 whitespace-pre-line">
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] text-gray-600">
                                                    {formatTimestamp(notification.timestamp)}
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteNotification(notification.id);
                                                    }}
                                                    className="p-1 text-gray-600 hover:text-red-400 transition-colors"
                                                    aria-label="Deletar notificação"
                                                >
                                                    <Icon name="close" className="text-sm" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                    <div className="p-3 border-t border-white/[0.1]">
                        <button
                            onClick={() => {
                                navigate('/notifications');
                                setIsOpen(false);
                            }}
                            className="w-full px-3 py-2 text-xs font-medium text-gray-400 hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <Icon name="settings" className="text-base" />
                            Configurar Notificações
                        </button>
                    </div>
                )}
            </div>
        </>
    );

    return (
        <>
            {/* Botão de notificações */}
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors group"
                aria-label="Notificações"
            >
                <Icon name="notifications" className="text-xl" />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-[#0f1216] animate-pulse" />
                )}
            </button>

            {/* Renderizar painel usando Portal */}
            {typeof document !== 'undefined' && ReactDOM.createPortal(panelContent, document.body)}
        </>
    );
};

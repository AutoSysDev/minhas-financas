import React, { useEffect } from 'react';
import { Icon } from './Icon';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
    onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ id, message, type, duration = 3000, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, duration);

        return () => clearTimeout(timer);
    }, [id, duration, onClose]);

    const bgColors = {
        success: 'bg-green-500/10 border-green-500/20 text-green-400',
        error: 'bg-red-500/10 border-red-500/20 text-red-400',
        info: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
        warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    };

    const icons = {
        success: 'check_circle',
        error: 'error',
        info: 'info',
        warning: 'warning',
    };

    return (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-lg animate-slide-in-right mb-3 min-w-[300px] ${bgColors[type]}`}>
            <Icon name={icons[type]} className="text-xl shrink-0" />
            <p className="text-sm font-medium flex-1">{message}</p>
            <button onClick={() => onClose(id)} className="opacity-70 hover:opacity-100 transition-opacity">
                <Icon name="close" className="text-lg" />
            </button>
        </div>
    );
};

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast, ToastType } from '../components/Toast';

interface ToastData {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextData {
    addToast: (message: string, type: ToastType, duration?: number) => void;
    removeToast: (id: string) => void;
    toast: {
        success: (message: string, duration?: number) => void;
        error: (message: string, duration?: number) => void;
        info: (message: string, duration?: number) => void;
        warning: (message: string, duration?: number) => void;
    };
}

const ToastContext = createContext<ToastContextData>({} as ToastContextData);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastData[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((state) => state.filter((toast) => toast.id !== id));
    }, []);

    const addToast = useCallback((message: string, type: ToastType, duration = 3000) => {
        const id = Math.random().toString(36).substring(2, 9);
        const newToast = { id, message, type, duration };
        setToasts((state) => [...state, newToast]);
    }, []);

    const toast = {
        success: (message: string, duration?: number) => addToast(message, 'success', duration),
        error: (message: string, duration?: number) => addToast(message, 'error', duration),
        info: (message: string, duration?: number) => addToast(message, 'info', duration),
        warning: (message: string, duration?: number) => addToast(message, 'warning', duration),
    };

    return (
        <ToastContext.Provider value={{ addToast, removeToast, toast }}>
            {children}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col items-end pointer-events-none">
                <div className="pointer-events-auto">
                    {toasts.map((t) => (
                        <Toast
                            key={t.id}
                            id={t.id}
                            message={t.message}
                            type={t.type}
                            duration={t.duration}
                            onClose={removeToast}
                        />
                    ))}
                </div>
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

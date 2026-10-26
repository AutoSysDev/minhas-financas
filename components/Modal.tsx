import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';
import { useTheme } from '../context/ThemeContext';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    hideHeader?: boolean;
    noPadding?: boolean;
    maxWidth?: string;
    headerActions?: React.ReactNode;
    headerLeft?: React.ReactNode;
}

/**
 * Contador global de modais abertos.
 * Evita que o scroll do body seja destravado quando um modal fecha sobre outro.
 */
let openModals = 0;

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, hideHeader = false, noPadding = false, maxWidth = 'max-w-md', headerActions, headerLeft }) => {
    const { theme } = useTheme();

    // Trava o scroll do fundo e fecha com Escape
    useEffect(() => {
        if (!isOpen) return;

        openModals += 1;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            openModals = Math.max(0, openModals - 1);
            if (openModals === 0) document.body.style.overflow = previousOverflow;
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center md:p-4">
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Bottom sheet no mobile, modal centralizado no desktop */}
            <div
                role="dialog"
                aria-modal="true"
                aria-label={title || 'Janela de diálogo'}
                className={`relative backdrop-blur-xl border shadow-2xl w-full ${maxWidth} flex flex-col rounded-t-2xl md:rounded-2xl max-h-[calc(100dvh-1.5rem)] md:max-h-[90vh] overflow-hidden animate-slide-up md:animate-scale-up z-10 ring-1 transition-all ${theme === 'light'
                    ? 'bg-white border-gray-200 ring-black/5'
                    : 'bg-[#0f1216]/95 md:bg-[#0f1216]/80 border-white/[0.08] ring-white/5'
                    }`}
                style={{
                    overscrollBehavior: 'contain',
                    WebkitOverflowScrolling: 'touch'
                }}
            >

                {/* Inner Glow/Highlight */}
                <div className={`absolute inset-0 rounded-t-2xl md:rounded-2xl pointer-events-none shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] ${theme === 'light' ? 'hidden' : ''}`}></div>

                {/* Alça visual do bottom sheet (apenas mobile) */}
                <div className="md:hidden flex justify-center pt-2.5 pb-1 shrink-0">
                    <div className={`h-1.5 w-10 rounded-full ${theme === 'light' ? 'bg-gray-300' : 'bg-white/20'}`}></div>
                </div>

                {!hideHeader && (title || onClose) && (
                    <div className={`px-5 py-3 md:p-5 border-b flex justify-between items-center gap-2 shrink-0 transition-colors ${theme === 'light'
                        ? 'bg-gray-50 border-gray-100'
                        : 'bg-white/[0.02] border-white/[0.05]'
                        }`}>
                        <div className="flex items-center gap-3 min-w-0">
                            {headerLeft}
                            {title && <h2 className={`text-base md:text-lg font-bold tracking-tight truncate transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{title}</h2>}
                        </div>
                        <div className="flex items-center gap-2 ml-auto shrink-0">
                            {headerActions}
                            <button
                                onClick={onClose}
                                aria-label="Fechar"
                                className={`-mr-2 flex items-center justify-center min-h-11 min-w-11 rounded-lg transition-colors ${theme === 'light'
                                    ? 'text-slate-400 hover:text-slate-600 hover:bg-gray-100'
                                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                <Icon name="close" className="text-xl" />
                            </button>
                        </div>
                    </div>
                )}

                <div
                    className={`flex-1 min-h-0 overflow-y-auto overscroll-contain ${noPadding ? '' : 'p-5 md:p-6'}`}
                    style={{
                        overscrollBehavior: 'contain',
                        WebkitOverflowScrolling: 'touch',
                        paddingBottom: noPadding ? undefined : 'calc(1.25rem + env(safe-area-inset-bottom))'
                    }}
                >
                    {children}
                </div>

                {/* Espaço extra para a home indicator quando não há padding */}
                {noPadding && <div className="md:hidden shrink-0 pb-safe" />}
            </div>
        </div>,
        document.body
    );
};

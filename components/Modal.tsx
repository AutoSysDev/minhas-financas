import React from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    hideHeader?: boolean;
    noPadding?: boolean;
    maxWidth?: string;
    headerActions?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, hideHeader = false, noPadding = false, maxWidth = 'max-w-md', headerActions }) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />

            {/* Modal Content (Glassmorphism) - iOS Scroll Fix */}
            <div
                className={`relative bg-[#0f1216]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl w-full ${maxWidth} flex flex-col max-h-[90vh] overflow-hidden animate-scale-up z-10 ring-1 ring-white/5`}
                style={{
                    overscrollBehavior: 'contain',
                    WebkitOverflowScrolling: 'touch'
                }}
            >

                {/* Inner Glow/Highlight */}
                <div className="absolute inset-0 rounded-2xl pointer-events-none shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"></div>

                {!hideHeader && (title || onClose) && (
                    <div className="p-5 border-b border-white/[0.05] flex justify-between items-center shrink-0 bg-white/[0.02]">
                        {title && <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>}
                        <div className="flex items-center gap-2 ml-auto">
                            {headerActions}
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-white hover:bg-white/10 rounded-lg p-1 transition-colors"
                            >
                                <Icon name="close" className="text-xl" />
                            </button>
                        </div>
                    </div>
                )}

                <div
                    className={`flex-1 min-h-0 overflow-y-auto ${noPadding ? '' : 'p-6'}`}
                    style={{
                        overscrollBehavior: 'contain',
                        WebkitOverflowScrolling: 'touch'
                    }}
                >
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};

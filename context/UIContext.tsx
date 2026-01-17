import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UIContextType {
    isAnyModalOpen: boolean;
    setModalOpen: (isOpen: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isAnyModalOpen, setIsAnyModalOpen] = useState(false);

    const setModalOpen = (isOpen: boolean) => {
        setIsAnyModalOpen(isOpen);

        // Prevent body scroll when modal is open (iOS fix)
        if (isOpen) {
            // Save current scroll position
            const scrollY = window.scrollY;

            // Lock body scroll (iOS compatible)
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            document.body.style.top = `-${scrollY}px`;
        } else {
            // Get the scroll position before unlocking
            const scrollY = document.body.style.top;

            // Unlock body scroll
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            document.body.style.top = '';

            // Restore scroll position
            if (scrollY) {
                window.scrollTo(0, parseInt(scrollY || '0') * -1);
            }
        }
    };

    return (
        <UIContext.Provider value={{ isAnyModalOpen, setModalOpen }}>
            {children}
        </UIContext.Provider>
    );
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};

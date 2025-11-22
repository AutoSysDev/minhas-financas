import React, { createContext, useContext, useState, useEffect } from 'react';

interface PrivacyContextType {
    isPrivacyMode: boolean;
    togglePrivacyMode: () => void;
}

const PrivacyContext = createContext<PrivacyContextType>({
    isPrivacyMode: false,
    togglePrivacyMode: () => { },
});

export const usePrivacy = () => useContext(PrivacyContext);

export const PrivacyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isPrivacyMode, setIsPrivacyMode] = useState(() => {
        const saved = localStorage.getItem('monely_privacy_mode');
        return saved === 'true';
    });

    useEffect(() => {
        localStorage.setItem('monely_privacy_mode', String(isPrivacyMode));
        if (isPrivacyMode) {
            document.body.classList.add('privacy-mode');
        } else {
            document.body.classList.remove('privacy-mode');
        }
    }, [isPrivacyMode]);

    const togglePrivacyMode = () => setIsPrivacyMode(prev => !prev);

    return (
        <PrivacyContext.Provider value={{ isPrivacyMode, togglePrivacyMode }}>
            {children}
        </PrivacyContext.Provider>
    );
};

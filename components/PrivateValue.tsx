import React from 'react';

interface PrivateValueProps {
    children: React.ReactNode;
    className?: string;
}

export const PrivateValue: React.FC<PrivateValueProps> = ({ children, className = '' }) => {
    return (
        <span className={`private-value ${className}`}>
            {children}
        </span>
    );
};

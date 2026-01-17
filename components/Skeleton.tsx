import React from 'react';

interface SkeletonProps {
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
    return (
        <div
            className={`relative overflow-hidden bg-white/[0.05] rounded-lg ${className}`}
        >
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" />
        </div>
    );
};

import React from 'react';
import { Skeleton } from './Skeleton';

export const TransactionListSkeleton: React.FC = () => {
    return (
        <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                    <div className="flex items-center gap-4">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="w-32 h-4" />
                            <Skeleton className="w-24 h-3" />
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <Skeleton className="w-20 h-5" />
                        <Skeleton className="w-16 h-3" />
                    </div>
                </div>
            ))}
        </div>
    );
};

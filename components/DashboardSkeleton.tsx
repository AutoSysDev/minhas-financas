import React from 'react';
import { Skeleton } from './Skeleton';

export const DashboardSkeleton: React.FC = () => {
    return (
        <div className="flex flex-col gap-6 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-40" />
            </div>

            {/* Summary Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white/[0.02] p-6 rounded-2xl border border-white/[0.05] space-y-4">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-8 w-8 rounded-lg" />
                        </div>
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-4 w-full" />
                    </div>
                ))}
            </div>

            {/* Charts Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white/[0.02] p-6 rounded-2xl border border-white/[0.05] space-y-4">
                    <div className="flex justify-between items-center mb-6">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-8 w-24" />
                    </div>
                    <Skeleton className="h-64 w-full" />
                </div>
                <div className="bg-white/[0.02] p-6 rounded-2xl border border-white/[0.05] space-y-4">
                    <Skeleton className="h-6 w-32 mb-6" />
                    <div className="flex justify-center">
                        <Skeleton className="h-48 w-48 rounded-full" />
                    </div>
                    <div className="space-y-2 mt-4">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                    </div>
                </div>
            </div>
        </div>
    );
};

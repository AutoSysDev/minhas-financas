import React from 'react';

export const SplashScreen: React.FC = () => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f1216]">
            <div className="flex flex-col items-center gap-6 animate-fade-in">
                <div className="relative size-24 md:size-32">
                    {/* Pulsing Background */}
                    <div className="absolute inset-0 bg-teal-500/20 rounded-3xl blur-xl animate-pulse"></div>

                    {/* Logo Container */}
                    <div className="relative w-full h-full bg-gradient-to-br from-teal-400/20 to-blue-600/20 border border-white/10 rounded-3xl flex items-center justify-center shadow-2xl backdrop-blur-md p-4">
                        <img
                            src="/logo.png"
                            alt="Monely Finance"
                            className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(45,212,191,0.5)]"
                        />
                    </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                        Monely Finance
                    </h1>
                    <div className="flex gap-1">
                        <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

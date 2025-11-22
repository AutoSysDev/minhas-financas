import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const navigate = useNavigate();

    // Noise texture data URI
    const noiseBg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E")`;

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (mode === 'signup') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                alert('Verifique seu e-mail para o link de confirmação!');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                navigate('/');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#0f1216] font-display selection:bg-teal-500/30 selection:text-teal-200">

            {/* 1. Fundo: Mesh Gradient + Noise */}
            <div className="absolute inset-0 z-0">
                {/* Base Dark Background */}
                <div className="absolute inset-0 bg-[#0f1216]"></div>

                {/* Mesh Gradients */}
                <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-blue-900/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }}></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-teal-900/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }}></div>
                <div className="absolute top-[40%] left-[30%] w-[40vw] h-[40vw] bg-purple-900/10 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }}></div>

                {/* Noise Overlay */}
                <div className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none" style={{ backgroundImage: noiseBg }}></div>
            </div>

            {/* 2. Card de Login (Glassmorphism) */}
            <div className="relative z-10 w-full max-w-[420px] p-6 md:p-8 mx-4">
                {/* Ambient Light Top */}
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[200px] h-[100px] bg-white/5 blur-[50px] rounded-full pointer-events-none"></div>

                <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-[24px] shadow-2xl ring-1 ring-white/5 overflow-hidden relative group">

                    {/* Soft Edge Light (Pseudo-element simulation via gradient border or inner shadow) */}
                    <div className="absolute inset-0 rounded-[24px] pointer-events-none shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"></div>

                    {/* Glow behind card (simulated with a div behind, but here inside for containment context if needed, or just rely on the outer mesh) */}

                    <div className="p-8 relative">

                        {/* 8. Branding */}
                        <div className="flex flex-col items-center mb-10">
                            <div className="relative mb-6 group/logo">
                                {/* Logo Glow */}
                                <div className="absolute inset-0 bg-teal-500/20 blur-xl rounded-full opacity-0 group-hover/logo:opacity-100 transition-opacity duration-700"></div>

                                <div className="relative size-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center shadow-lg backdrop-blur-md">
                                    <Icon name="account_balance_wallet" className="text-2xl text-teal-400 drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]" />
                                </div>
                            </div>

                            <h1 className="text-3xl font-semibold text-white tracking-tight mb-2 text-center">
                                Monely Finance
                            </h1>
                            <p className="text-sm text-gray-400 font-normal tracking-wide text-center opacity-80">
                                Seu dinheiro, claro e organizado.
                            </p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3 animate-fade-in">
                                <Icon name="error" className="text-red-400 text-sm" />
                                <span className="text-xs text-red-300 font-medium">{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleAuth} className="space-y-5">
                            {/* 5. Inputs */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider ml-1" htmlFor="email">
                                    E-mail
                                </label>
                                <div className="relative group/input">
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-4 pr-4 py-3.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/20 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 focus:bg-white/[0.05] outline-none transition-all duration-300 text-sm font-medium"
                                        placeholder="exemplo@email.com"
                                        required
                                    />
                                    {/* Focus Light Effect */}
                                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-500/0 via-teal-500/10 to-teal-500/0 opacity-0 group-focus-within/input:opacity-100 pointer-events-none transition-opacity duration-500" style={{ maskImage: 'linear-gradient(black, black)', WebkitMaskImage: 'linear-gradient(black, black)', maskComposite: 'exclude', WebkitMaskComposite: 'xor', padding: '1px' }}></div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider ml-1" htmlFor="password">
                                    Senha
                                </label>
                                <div className="relative group/input">
                                    <input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-4 pr-4 py-3.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/20 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 focus:bg-white/[0.05] outline-none transition-all duration-300 text-sm font-medium"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            {/* 4. Botões (Neo-fintech) */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 mt-2 rounded-xl bg-gradient-to-b from-teal-400 to-teal-600 text-white font-semibold text-sm shadow-[0_0_20px_-5px_rgba(45,212,191,0.3)] hover:shadow-[0_0_25px_-5px_rgba(45,212,191,0.5)] hover:-translate-y-[1px] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden group/btn disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 blur-md"></div>
                                <span className="relative z-10 flex items-center gap-2">
                                    {loading ? (
                                        <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            {mode === 'signin' ? 'Acessar Conta' : 'Criar Nova Conta'}
                                            <Icon name="arrow_forward" className="text-base opacity-80 group-hover/btn:translate-x-0.5 transition-transform" />
                                        </>
                                    )}
                                </span>
                            </button>
                        </form>

                        {/* Footer / Toggle */}
                        <div className="mt-8 pt-6 border-t border-white/[0.05] text-center">
                            <p className="text-gray-500 text-xs">
                                {mode === 'signin' ? 'Ainda não é cliente?' : 'Já possui cadastro?'}
                                <button
                                    onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                                    className="ml-2 text-teal-400 hover:text-teal-300 font-medium transition-colors outline-none focus:underline decoration-teal-500/30 underline-offset-4"
                                >
                                    {mode === 'signin' ? 'Abra sua conta' : 'Fazer login'}
                                </button>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom Glow */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[80%] h-[20px] bg-teal-500/20 blur-[30px] rounded-full pointer-events-none"></div>
            </div>
        </div>
    );
};

export default Login;

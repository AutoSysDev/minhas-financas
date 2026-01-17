import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { useToast } from '../context/ToastContext';



const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [rememberMe, setRememberMe] = useState(false);

    const navigate = useNavigate();
    const { toast } = useToast();
    const supabaseAvailable = Boolean(supabase);
    const [connStatus, setConnStatus] = useState<'ok' | 'no-env' | 'fail' | 'partial'>('ok'); // Default to ok to avoid UI flickering

    // Noise texture data URI
    const noiseBg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E")`;


    useEffect(() => {
        // Carregar e-mail salvo se houver
        const savedEmail = localStorage.getItem('monely_saved_email');
        if (savedEmail) {
            setEmail(savedEmail);
            setRememberMe(true);
        }

        // Redireciona se já houver uma sessão ativa ao carregar a página
        if (supabaseAvailable) {
            supabase.auth.getSession().then(({ data }) => {
                if (data.session) {
                    console.log('Sessão ativa detectada, redirecionando para Home...');
                    navigate('/', { replace: true });
                }
            });
        }
    }, [supabaseAvailable]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;

        setLoading(true);
        setError(null);

        try {
            console.log('Iniciando fluxo de autenticação via formulário...');
            if (!supabaseAvailable) {
                throw new Error('Supabase não está configurado corretamente.');
            }

            if (mode === 'signup') {
                if (!username) throw new Error('Nome de usuário é obrigatório.');

                const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { username, full_name: username }
                    }
                });

                if (signUpError) throw signUpError;

                if (data.user) {
                    console.log('Usuário criado, registrando perfil em background...');
                    supabase.from('profiles').upsert({
                        user_id: data.user.id,
                        updated_at: new Date().toISOString()
                    }).then(() => { }, (err) => console.warn('Erro silencioso ao criar perfil:', err));
                }

                toast.success('Conta criada! Verifique seu e-mail.');
            } else {
                console.log('Solicitando login ao Supabase Auth...');
                const { data, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });

                if (signInError) throw signInError;

                if (data.user) {
                    console.log('Auth Sucesso. Perfil background...');

                    // Salvar preferência de e-mail
                    if (rememberMe) {
                        localStorage.setItem('monely_saved_email', email);
                    } else {
                        localStorage.removeItem('monely_saved_email');
                    }

                    // Não damos await aqui para não travar a navegação se o PostgREST estiver lento
                    supabase.from('profiles').upsert({
                        user_id: data.user.id,
                        updated_at: new Date().toISOString()
                    }).then(() => { }, (err) => console.warn('Erro silencioso ao atualizar perfil:', err));

                    console.log('Executando navegação final...');
                    navigate('/', { replace: true });
                }
            }
        } catch (err: any) {
            console.error('Falha no processo de login:', err);
            const msg = err.message || 'Ocorreu um erro inesperado';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
            console.log('Finalizando estado de loading do Login.');
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#0a0e13] font-display selection:bg-teal-500/30 selection:text-teal-200">

            {/* 1. Fundo: Mesh Gradient + Noise */}
            <div className="absolute inset-0 z-0">
                {/* Base Dark Background */}
                <div className="absolute inset-0 bg-[#0a0e13]"></div>

                {/* Grid Pattern - More Visible */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#2dd4bf15_1px,transparent_1px),linear-gradient(to_bottom,#2dd4bf15_1px,transparent_1px)] bg-[size:32px_32px]"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_600px_at_50%_50%,transparent,#0a0e13)]"></div>

                {/* Enhanced Mesh Gradients - Much More Visible */}
                <div className="absolute top-[-10%] left-[-5%] w-[60vw] h-[60vw] md:w-[50vw] md:h-[50vw] bg-teal-500/25 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '6s' }}></div>
                <div className="absolute bottom-[-10%] right-[-5%] w-[55vw] h-[55vw] md:w-[45vw] md:h-[45vw] bg-blue-500/25 rounded-full blur-[90px] animate-pulse" style={{ animationDuration: '8s', animationDelay: '1s' }}></div>
                <div className="absolute top-[30%] left-[20%] w-[35vw] h-[35vw] md:w-[30vw] md:h-[30vw] bg-cyan-500/15 rounded-full blur-[70px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }}></div>

                {/* Floating Orbs - More Visible */}
                <div className="absolute top-[10%] right-[10%] w-48 h-48 md:w-72 md:h-72 bg-teal-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '7s', animationDelay: '0.5s' }}></div>
                <div className="absolute bottom-[20%] left-[10%] w-56 h-56 md:w-80 md:h-80 bg-blue-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '9s', animationDelay: '1.5s' }}></div>

                {/* Accent Lines */}
                <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-teal-500/20 to-transparent"></div>
                <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-blue-500/20 to-transparent"></div>

                {/* Noise Overlay */}
                <div className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none" style={{ backgroundImage: noiseBg }}></div>
            </div>

            {/* 2. Card de Login (Glassmorphism) */}
            <div className="relative z-10 w-full max-w-[420px] p-6 md:p-8 mx-4">
                {/* Ambient Light Top */}
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[200px] h-[100px] bg-teal-500/10 blur-[50px] rounded-full pointer-events-none"></div>

                <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-[24px] shadow-2xl ring-1 ring-white/5 overflow-hidden relative group">

                    {/* Soft Edge Light */}
                    <div className="absolute inset-0 rounded-[24px] pointer-events-none shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"></div>

                    <div className="p-8 relative">

                        {/* Branding */}
                        <div className="flex flex-col items-center mb-8">
                            <div className="relative mb-6 group/logo">
                                {/* Logo Glow */}
                                <div className="absolute inset-0 bg-teal-500/20 blur-xl rounded-full opacity-0 group-hover/logo:opacity-100 transition-opacity duration-700"></div>

                                <div className="relative size-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center shadow-lg backdrop-blur-md overflow-hidden p-2">
                                    <img src="/logo.png" alt="Monely Finance" className="w-full h-full object-contain" />
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
                        {connStatus !== 'ok' && (
                            <div className="mb-6 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center gap-3">
                                <Icon name="warning" className="text-yellow-300 text-sm" />
                                <span className="text-xs text-yellow-200 font-medium">
                                    {connStatus === 'no-env' && 'Configuração do Supabase ausente'}
                                    {connStatus === 'fail' && 'Falha ao conectar ao Supabase'}
                                    {connStatus === 'partial' && 'Supabase parcial: sessão ok, dados indisponíveis'}
                                </span>
                            </div>
                        )}

                        <div className="space-y-5">


                            <form onSubmit={handleAuth} className="space-y-5">
                                {mode === 'signup' && (
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider ml-1" htmlFor="username">
                                            Nome de Usuário
                                        </label>
                                        <div className="relative group/input">
                                            <input
                                                id="username"
                                                type="text"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                className="w-full pl-4 pr-4 py-3.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white placeholder-white/20 focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 focus:bg-white/[0.05] outline-none transition-all duration-300 text-sm font-medium"
                                                placeholder="Seu nome de usuário"
                                                required
                                                disabled={!supabaseAvailable}
                                            />
                                            {/* Focus Light Effect */}
                                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-500/0 via-teal-500/10 to-teal-500/0 opacity-0 group-focus-within/input:opacity-100 pointer-events-none transition-opacity duration-500" style={{ maskImage: 'linear-gradient(black, black)', WebkitMaskImage: 'linear-gradient(black, black)', maskComposite: 'exclude', WebkitMaskComposite: 'xor', padding: '1px' }}></div>
                                        </div>
                                    </div>
                                )}

                                {/* Inputs */}


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
                                            disabled={!supabaseAvailable}
                                        />
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
                                            disabled={!supabaseAvailable}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        id="remember-me"
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="size-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-offset-0 focus:ring-teal-500/50 accent-teal-500 cursor-pointer"
                                    />
                                    <label htmlFor="remember-me" className="text-xs text-gray-400 cursor-pointer select-none">
                                        Lembrar usuário
                                    </label>
                                </div>

                                {/* Button */}
                                <button
                                    type="submit"
                                    disabled={loading || !supabaseAvailable}
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
                        </div>

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
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[80%] h-[20px] bg-teal-500/30 blur-[30px] rounded-full pointer-events-none"></div>
            </div>
        </div>
    );
};

export default Login;

export async function readJsonResponse(res: { status: number; ok: boolean; headers: { get: (name: string) => string | null }; text: () => Promise<string> }) {
    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    const isJson = contentType.includes('application/json');
    const bodyText = await res.text();
    if (!bodyText) throw new Error('Resposta vazia');
    if (!res.ok) {
        if (isJson) {
            const data = JSON.parse(bodyText);
            const msg = typeof data?.error === 'string' && data.error.trim() ? data.error : `Erro HTTP ${res.status}`;
            throw new Error(msg);
        }
        throw new Error(`Erro HTTP ${res.status}`);
    }
    if (!isJson) throw new Error('Resposta não é JSON');
    try {
        return JSON.parse(bodyText);
    } catch {
        throw new Error('JSON malformado');
    }
}

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, isSupabaseReady } from '../services/supabase';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    isPremium: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPremium, setIsPremium] = useState(false);

    useEffect(() => {
        let mounted = true;
        const timeoutId = window.setTimeout(() => {
            if (mounted && loading) setLoading(false);
        }, 5000);
        if (!isSupabaseReady || !supabase) {
            setSession(null);
            setUser(null);
            setIsPremium(false);
            setLoading(false);
            return;
        }
        (async () => {
            try {
                const { data } = await supabase.auth.getSession();
                if (!mounted) return;
                const session = data.session;
                console.log('Sessão inicial carregada:', session ? 'Sim' : 'Não');
                setSession(session);
                setUser(session?.user ?? null);

                // Set loading false as soon as user is processed
                setLoading(false);

                if (session?.user) {
                    supabase.from('profiles').select('is_premium').eq('user_id', session.user.id).maybeSingle()
                        .then(({ data: prof }) => {
                            if (mounted) {
                                // Prefer DB value if available
                                if (prof) {
                                    setIsPremium(Boolean(prof.is_premium));
                                } else {
                                    setIsPremium(Boolean(session.user.user_metadata?.is_premium));
                                }
                                
                                // Auto-verify subscription status with Stripe to fix any sync issues
                                supabase.functions.invoke('verify-subscription').then(({ data, error }) => {
                                    if (error) console.error('Erro na verificação de assinatura:', error);
                                    if (data?.isPremium !== undefined && mounted) {
                                        setIsPremium(data.isPremium);
                                    }
                                });
                            }
                        }, () => {
                            if (mounted) setIsPremium(Boolean(session.user.user_metadata?.is_premium));
                        });
                }
            } catch (err) {
                console.error('Erro ao recuperar sessão:', err);
                setSession(null);
                setUser(null);
                setLoading(false);
            }
        })();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('onAuthStateChange event:', event, session ? 'Tem' : 'Sem');
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);

            if (session?.user) {
                supabase.from('profiles').select('is_premium').eq('user_id', session.user.id).maybeSingle()
                    .then(({ data: prof }) => {
                        if (prof) {
                            setIsPremium(Boolean(prof.is_premium));
                        } else {
                            setIsPremium(Boolean(session.user.user_metadata?.is_premium));
                        }
                        
                        // Verify on auth change (login) too
                        if (event === 'SIGNED_IN') {
                             supabase.functions.invoke('verify-subscription').then(({ data, error }) => {
                                if (data?.isPremium !== undefined) {
                                    setIsPremium(data.isPremium);
                                }
                            });
                        }
                    }, () => {
                        setIsPremium(Boolean(session.user.user_metadata?.is_premium));
                    });
            } else {
                setIsPremium(false);
            }
        });

        return () => { mounted = false; subscription.unsubscribe(); window.clearTimeout(timeoutId); };
    }, []);

    useEffect(() => {
        if (!user) return;

        // Subscribe to realtime changes on profiles table
        const channel = supabase
            .channel('profile-changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    console.log('Realtime profile update:', payload);
                    const newProfile = payload.new as { is_premium?: boolean };
                    setIsPremium(Boolean(newProfile.is_premium));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
        } catch { }

        // Forçar limpeza de localStorage
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));
        } catch { }

        setSession(null);
        setUser(null);
        setIsPremium(false);
        setLoading(false);
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, isPremium, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

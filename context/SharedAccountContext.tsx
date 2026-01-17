import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { SharedAccount, SharedAccountMember, SharedAccountInvite } from '../types';

interface SharedAccountContextType {
    sharedAccount: SharedAccount | null;
    members: SharedAccountMember[];
    invites: SharedAccountInvite[];
    isSharedViewActive: boolean;
    loading: boolean;
    toggleSharedView: () => void;
    setIsSharedViewActive: (active: boolean) => void;
    inviteUser: (email: string) => Promise<void>;
    acceptInvite: (inviteId: string) => Promise<void>;
    rejectInvite: (inviteId: string) => Promise<void>;
    leaveSharedAccount: () => Promise<void>;
    removeMember: (memberId: string) => Promise<void>;
    cancelInvite: (inviteId: string) => Promise<void>;
    pendingInvites: SharedAccountInvite[]; // Invites sent TO the current user
}

const SharedAccountContext = createContext<SharedAccountContextType | undefined>(undefined);

export const SharedAccountProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { toast } = useToast();

    const [sharedAccount, setSharedAccount] = useState<SharedAccount | null>(null);
    const [members, setMembers] = useState<SharedAccountMember[]>([]);
    const [invites, setInvites] = useState<SharedAccountInvite[]>([]); // Invites managed by owner
    const [pendingInvites, setPendingInvites] = useState<SharedAccountInvite[]>([]); // Invites received by user

    const [isSharedViewActive, setIsSharedViewActive] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            fetchSharedData();
        } else {
            setSharedAccount(null);
            setMembers([]);
            setInvites([]);
            setPendingInvites([]);
            setIsSharedViewActive(false);
        }
    }, [user]);

    const fetchSharedData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // 1. Check if user is a member of any shared account
            const { data: membership } = await supabase
                .from('shared_account_members')
                .select('shared_account_id, role')
                .eq('user_id', user.id)
                .maybeSingle();

            if (membership) {
                // Fetch the account details
                const { data: acc } = await supabase
                    .from('shared_accounts')
                    .select('*')
                    .eq('id', membership.shared_account_id)
                    .single();

                setSharedAccount(acc);

                // Fetch members
                const { data: mems } = await supabase
                    .from('shared_account_members')
                    .select('*')
                    .eq('shared_account_id', membership.shared_account_id);

                if (mems) setMembers(mems);

                // If user is owner, fetch outgoing invites
                if (membership.role === 'owner') {
                    const { data: invs } = await supabase
                        .from('shared_account_invites')
                        .select('*')
                        .eq('shared_account_id', membership.shared_account_id);
                    if (invs) setInvites(invs);
                }
            } else {
                setSharedAccount(null);
                setMembers([]);
                setInvites([]);
            }

            // 2. Fetch pending invites sent TO this user (by email)
            if (user.email) {
                const { data: myInvites } = await supabase
                    .from('shared_account_invites')
                    .select('*')
                    .eq('email', user.email)
                    .eq('status', 'pending');

                if (myInvites) setPendingInvites(myInvites);
            }

        } catch (error) {
            console.error('Error fetching shared data:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSharedView = () => {
        if (!sharedAccount) {
            toast.info('Você não possui uma conta compartilhada ativa.');
            return;
        }
        setIsSharedViewActive(prev => !prev);
    };

    const inviteUser = async (email: string) => {
        if (!user) return;
        try {
            // Call Edge Function
            const { data, error } = await supabase.functions.invoke('invite-user', {
                body: { email }
            });

            if (error) throw error;

            toast.success('Convite enviado com sucesso!');
            fetchSharedData();
        } catch (error: any) {
            console.error('Error sending invite:', error);

            // Try to extract error message from response body
            let errorMessage = error.message;
            if (error.context && typeof error.context.json === 'function') {
                try {
                    const ctx = await error.context.json();
                    if (ctx && ctx.error) errorMessage = ctx.error;
                } catch (e) {
                    console.error('Could not parse error context:', e);
                }
            } else if (error.response) {
                try {
                    const data = await error.response.json();
                    if (data && data.error) errorMessage = data.error;
                } catch (e) { }
            }

            toast.error('Erro ao enviar convite: ' + (errorMessage || 'Unknown error'));
        }
    };

    const acceptInvite = async (inviteId: string) => {
        if (!user) return;
        try {
            // Call the security definer function to handle joining safely
            const { error } = await supabase.rpc('accept_shared_account_invite', {
                invite_id: inviteId
            });

            if (error) throw error;

            toast.success('Convite aceito!');
            fetchSharedData();
        } catch (error: any) {
            console.error('Error accepting invite:', error);
            toast.error('Erro ao aceitar convite: ' + (error.message || 'Unknown error'));
        }
    };

    const rejectInvite = async (inviteId: string) => {
        try {
            await supabase
                .from('shared_account_invites')
                .update({ status: 'rejected' })
                .eq('id', inviteId);

            toast.success('Convite rejeitado.');
            fetchSharedData();
        } catch (error) {
            console.error('Error rejecting invite:', error);
            toast.error('Erro ao rejeitar convite.');
        }
    };

    const leaveSharedAccount = async () => {
        if (!user || !sharedAccount) return;

        if (!confirm('Tem certeza que deseja sair desta conta compartilhada?')) return;

        try {
            // Find the membership record
            const { data: membership } = await supabase
                .from('shared_account_members')
                .select('id, role')
                .eq('shared_account_id', sharedAccount.id)
                .eq('user_id', user.id)
                .single();

            if (!membership) throw new Error('Membro não encontrado.');

            if (membership.role === 'owner') {
                // Owner logic: Delete the account? Or transfer? For now, prevent leaving if owner has other members
                if (members.length > 1) {
                    toast.warning('Como proprietário, você não pode sair enquanto houver outros membros.');
                    return;
                }
                // If only member, delete the shared account
                await supabase.from('shared_accounts').delete().eq('id', sharedAccount.id);
                toast.success('Conta compartilhada encerrada.');
            } else {
                // Regular member: delete membership
                await supabase.from('shared_account_members').delete().eq('id', membership.id);
                toast.success('Você saiu da conta compartilhada.');
            }

            // Refresh local state
            setSharedAccount(null);
            setMembers([]);
            setInvites([]);
            setIsSharedViewActive(false);

        } catch (error: any) {
            console.error('Error leaving shared account:', error);
            toast.error('Erro ao sair da conta compartilhada.');
        }
    };

    const removeMember = async (memberId: string) => {
        if (!user || !sharedAccount) return;
        if (!confirm('Tem certeza que deseja remover este membro?')) return;

        try {
            const { error } = await supabase
                .from('shared_account_members')
                .delete()
                .eq('id', memberId);

            if (error) throw error;

            toast.success('Membro removido com sucesso.');
            fetchSharedData();
        } catch (error: any) {
            console.error('Error removing member:', error);
            toast.error('Erro ao remover membro.');
        }
    };

    const cancelInvite = async (inviteId: string) => {
        if (!user || !sharedAccount) return;

        try {
            const { error } = await supabase
                .from('shared_account_invites')
                .delete()
                .eq('id', inviteId);

            if (error) throw error;

            toast.success('Convite cancelado.');
            fetchSharedData();
        } catch (error: any) {
            console.error('Error cancelling invite:', error);
            toast.error('Erro ao cancelar convite.');
        }
    };

    return (
        <SharedAccountContext.Provider value={{
            sharedAccount,
            members,
            invites,
            pendingInvites,
            isSharedViewActive,
            loading,
            toggleSharedView,
            setIsSharedViewActive,
            inviteUser,
            acceptInvite,
            rejectInvite,
            leaveSharedAccount,
            removeMember,
            cancelInvite
        }}>
            {children}
        </SharedAccountContext.Provider>
    );
};

export const useSharedAccount = () => {
    const context = useContext(SharedAccountContext);
    if (context === undefined) {
        throw new Error('useSharedAccount must be used within a SharedAccountProvider');
    }
    return context;
};

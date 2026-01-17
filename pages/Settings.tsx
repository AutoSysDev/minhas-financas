import React, { useState } from 'react';
import { Icon } from '../components/Icon';
import { Dropdown } from '../components/Dropdown';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { supabase } from '../services/supabase';
import { Category, TransactionType, SharedAccountMember, SharedAccountInvite } from '../types';
import { Modal } from '../components/Modal';
import { useToast } from '../context/ToastContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSharedAccount } from '../context/SharedAccountContext';
import { InviteModal } from '../components/SharedAccount/InviteModal';
import { PremiumPlans } from '../components/PremiumPlans';
import { usePrivacy } from '../context/PrivacyContext';
import { useTheme } from '../context/ThemeContext';

type TabType = 'profile' | 'preferences' | 'categories' | 'notifications' | 'security' | 'subscription' | 'data' | 'shared';

// Componente Auxiliar de Switch
const ToggleSwitch: React.FC<{ checked?: boolean; onChange?: (checked: boolean) => void }> = ({
  checked = false,
  onChange
}) => {
  const { theme } = useTheme();
  return (
    <button
      onClick={() => onChange?.(!checked)}
      className={`
        relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/50
        ${checked ? 'bg-teal-500' : (theme === 'light' ? 'bg-gray-300' : 'bg-gray-600')}
      `}
    >
      <span
        className={`
          inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200
          ${checked ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  );
};

// Modal de Categoria
const CategoryModal: React.FC<{
  category: Category | null;
  onClose: () => void;
  onSave: (id: string, data: any) => Promise<void> | ((data: any) => Promise<void>);
}> = ({ category, onClose, onSave }) => {
  const { theme } = useTheme();
  const [name, setName] = useState(category?.name || '');
  const [icon, setIcon] = useState(category?.icon || 'category');
  const [color, setColor] = useState(category?.color || '#3b82f6');
  const [type, setType] = useState<'income' | 'expense'>(category?.type || 'expense');

  const ICONS = [
    'cat_food', 'cat_car', 'cat_health', 'cat_education', 'cat_leisure',
    'cat_home', 'cat_clothing', 'cat_shopping', 'cat_grocery', 'cat_travel',
    'cat_pets', 'cat_gym', 'cat_coffee', 'cat_movie', 'cat_music',
    'cat_books', 'cat_bill', 'cat_work', 'cat_invest', 'cat_savings',
    'cat_salary', 'cat_freelance', 'cat_others'
  ];

  const COLORS = [
    '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6',
    '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#84cc16'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (category) {
      await onSave(category.id, { name, icon, color, type });
    } else {
      await (onSave as any)({ name, icon, color, type });
    }
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={category ? 'Editar Categoria' : 'Nova Categoria'}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className={`block text-sm font-bold mb-2 transition-colors ${theme === 'light' ? 'text-slate-700' : 'text-gray-300'}`}>
            Nome da Categoria
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${theme === 'light'
              ? 'bg-gray-50 border-gray-200 text-slate-900 focus:ring-teal-500/20'
              : 'bg-white/[0.05] border-white/[0.1] text-white focus:ring-teal-500/50'
              }`}
            placeholder="Ex: Alimentação"
            required
          />
        </div>

        <div>
          <label className={`block text-sm font-bold mb-2 transition-colors ${theme === 'light' ? 'text-slate-700' : 'text-gray-300'}`}>
            Tipo
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${type === 'expense'
                ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                : (theme === 'light' ? 'bg-gray-100 text-slate-500' : 'bg-white/[0.05] text-gray-400')
                }`}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${type === 'income'
                ? 'bg-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]'
                : (theme === 'light' ? 'bg-gray-100 text-slate-500' : 'bg-white/[0.05] text-gray-400')
                }`}
            >
              Receita
            </button>
          </div>
        </div>

        <div>
          <label className={`block text-sm font-bold mb-2 transition-colors ${theme === 'light' ? 'text-slate-700' : 'text-gray-300'}`}>
            Ícone
          </label>
          <div className="grid grid-cols-6 gap-2">
            {ICONS.map((iconName) => (
              <button
                key={iconName}
                type="button"
                onClick={() => setIcon(iconName)}
                className={`p-3 rounded-lg transition-all ${icon === iconName
                  ? 'bg-teal-500 text-white shadow-[0_0_10px_rgba(45,212,191,0.3)]'
                  : (theme === 'light' ? 'bg-gray-100 text-slate-400 hover:bg-gray-200' : 'bg-white/[0.05] text-gray-400 hover:bg-white/[0.1]')
                  }`}
              >
                <Icon name={iconName} className="text-xl" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={`block text-sm font-bold mb-2 transition-colors ${theme === 'light' ? 'text-slate-700' : 'text-gray-300'}`}>
            Cor
          </label>
          <div className="grid grid-cols-5 gap-2">
            {COLORS.map((colorOption) => (
              <button
                key={colorOption}
                type="button"
                onClick={() => setColor(colorOption)}
                className={`size-12 rounded-lg transition-all ${color === colorOption ? 'ring-4 ring-white/20 scale-110' : ''
                  }`}
                style={{ backgroundColor: colorOption }}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className={`flex-1 py-3 rounded-xl font-medium transition-colors ${theme === 'light'
              ? 'bg-gray-100 text-slate-600 hover:bg-gray-200'
              : 'bg-white/[0.05] text-gray-300 hover:bg-white/[0.1]'
              }`}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 py-3 rounded-xl font-medium bg-teal-500 text-white hover:bg-teal-600 transition-colors shadow-[0_0_20px_-5px_rgba(45,212,191,0.3)]"
          >
            Salvar
          </button>
        </div>
      </form>
    </Modal>
  );
};

const CategoriesTab: React.FC = () => {
  const { theme } = useTheme();
  const { categories, deleteCategory, addCategory, updateCategory, restoreDefaultCategories } = useFinance();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const handleSaveCategory = async (id: string, data: any) => {
    try {
      if (id) {
        if (categories.find(c => c.id === id)?.isDefault) {
          toast.warning('Categorias padrão não podem ser editadas.');
          return;
        }
        await updateCategory(id, data);
        toast.success('Categoria atualizada com sucesso!');
      } else {
        await addCategory(data);
        toast.success('Categoria criada com sucesso!');
      }
      setIsModalOpen(false);
      setEditingCategory(null);
    } catch (error) {
      toast.error('Erro ao salvar categoria.');
    }
  };

  const handleDelete = async (id: string) => {
    if (categories.find(c => c.id === id)?.isDefault) {
      toast.warning('Categorias padrão não podem ser excluídas.');
      return;
    }
    if (confirm('Tem certeza? Isso não apagará as transações, mas elas ficarão sem categoria.')) {
      try {
        await deleteCategory(id);
        toast.success('Categoria excluída com sucesso!');
      } catch (error) {
        toast.error('Erro ao excluir categoria.');
      }
    }
  };

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className={`text-lg font-bold transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Gerenciar Categorias</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setEditingCategory(null); setIsModalOpen(true); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${theme === 'light'
              ? 'bg-teal-50 text-teal-600 hover:bg-teal-100'
              : 'bg-teal-500/10 text-teal-400 hover:bg-teal-500/20'
              }`}
          >
            <Icon name="add" />
            Nova Categoria
          </button>
          <button
            onClick={async () => { await restoreDefaultCategories(); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${theme === 'light'
              ? 'bg-gray-100 text-slate-600 hover:bg-gray-200'
              : 'bg-white/[0.05] text-gray-300 hover:bg-white/[0.1]'
              }`}
            title="Restaurar categorias padrão"
          >
            <Icon name="category" />
            Restaurar Padrão
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Despesas */}
        <div className="space-y-4">
          <h4 className={`text-sm font-bold uppercase tracking-wider transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Despesas</h4>
          <div className="space-y-2">
            {expenseCategories.map(cat => (
              <div key={cat.id} className={`flex items-center justify-between p-3 rounded-xl group transition-all ${theme === 'light'
                ? 'bg-white border border-gray-100 hover:border-teal-200'
                : 'bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1]'
                }`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                    <Icon name={cat.icon} />
                  </div>
                  <span className={`font-medium transition-colors ${theme === 'light' ? 'text-slate-700' : 'text-gray-200'}`}>{cat.name}</span>
                  {cat.isDefault && (
                    <span className={`text-[10px] px-2 py-0.5 rounded transition-colors ${theme === 'light' ? 'bg-gray-100 text-slate-400' : 'bg-white/[0.05] text-gray-500'}`}>
                      Padrão
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setEditingCategory(cat); setIsModalOpen(true); }}
                    className={`p-2 rounded-lg transition-colors ${theme === 'light'
                      ? 'text-slate-400 hover:text-slate-600 hover:bg-gray-100'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
                      }`}
                  >
                    <Icon name="edit" className="text-lg" />
                  </button>
                  {!cat.isDefault && (
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Icon name="delete" className="text-lg" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Receitas */}
        <div className="space-y-4">
          <h4 className={`text-sm font-bold uppercase tracking-wider transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Receitas</h4>
          <div className="space-y-2">
            {incomeCategories.map(cat => (
              <div key={cat.id} className={`flex items-center justify-between p-3 rounded-xl group transition-all ${theme === 'light'
                ? 'bg-white border border-gray-100 hover:border-teal-200'
                : 'bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1]'
                }`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                    <Icon name={cat.icon} />
                  </div>
                  <span className={`font-medium transition-colors ${theme === 'light' ? 'text-slate-700' : 'text-gray-200'}`}>{cat.name}</span>
                  {cat.isDefault && (
                    <span className={`text-[10px] px-2 py-0.5 rounded transition-colors ${theme === 'light' ? 'bg-gray-100 text-slate-400' : 'bg-white/[0.05] text-gray-500'}`}>
                      Padrão
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setEditingCategory(cat); setIsModalOpen(true); }}
                    className={`p-2 rounded-lg transition-colors ${theme === 'light'
                      ? 'text-slate-400 hover:text-slate-600 hover:bg-gray-100'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
                      }`}
                  >
                    <Icon name="edit" className="text-lg" />
                  </button>
                  {!cat.isDefault && (
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Icon name="delete" className="text-lg" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <CategoryModal
          category={editingCategory}
          onClose={() => { setIsModalOpen(false); setEditingCategory(null); }}
          onSave={handleSaveCategory}
        />
      )}
    </div>
  );
};


const SharedAccountTab: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { members, invites, pendingInvites, acceptInvite, rejectInvite, leaveSharedAccount, removeMember, cancelInvite } = useSharedAccount();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Helper to check if current user is owner of the shared account
  const isOwner = (members as SharedAccountMember[]).some(m => m.user_id === user?.id && m.role === 'owner');

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h3 className={`text-lg font-bold transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Conta Compartilhada</h3>
          <p className={`text-sm transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Gerencie quem tem acesso às suas finanças.</p>
        </div>
        <button
          onClick={() => setIsInviteModalOpen(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${theme === 'light'
            ? 'bg-teal-50 text-teal-600 hover:bg-teal-100'
            : 'bg-teal-500/10 text-teal-400 hover:bg-teal-500/20'
            }`}
        >
          <Icon name="person_add" />
          Convidar
        </button>
      </div>

      {/* Solicitações (Recebidas) */}
      <div id="solicitacoes" className={`p-6 rounded-[2rem] border transition-all ${pendingInvites.length > 0
        ? (theme === 'light' ? 'bg-blue-50 border-blue-200' : 'bg-blue-500/5 border-blue-500/20')
        : (theme === 'light' ? 'bg-white border-gray-100' : 'bg-white/[0.02] border-white/[0.05]')
        }`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl transition-colors ${pendingInvites.length > 0
              ? (theme === 'light' ? 'bg-blue-100 text-blue-600' : 'bg-blue-500/20 text-blue-400')
              : (theme === 'light' ? 'bg-gray-100 text-slate-400' : 'bg-white/[0.05] text-gray-500')
              }`}>
              <Icon name="mail" />
            </div>
            <div>
              <h4 className={`text-lg font-bold transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Solicitações</h4>
              <p className={`text-xs transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-500'}`}>Convites que você recebeu de outras pessoas.</p>
            </div>
          </div>
          {pendingInvites.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-black animate-pulse">
              {pendingInvites.length} {pendingInvites.length === 1 ? 'NOVA' : 'NOVAS'}
            </span>
          )}
        </div>

        {pendingInvites.length === 0 ? (
          <div className="text-center py-8">
            <p className={`text-sm italic transition-colors ${theme === 'light' ? 'text-slate-400' : 'text-gray-500'}`}>Nenhuma solicitação pendente.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingInvites.map(invite => (
              <div key={invite.id} className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border p-4 rounded-2xl transition-all ${theme === 'light'
                ? 'bg-white border-gray-100 hover:border-blue-200'
                : 'bg-white/[0.03] border-white/[0.05] hover:border-blue-500/30'
                }`}>
                <div className="flex items-center gap-3">
                  <div className={`size-10 rounded-full flex items-center justify-center font-bold border transition-colors ${theme === 'light'
                    ? 'bg-blue-50 text-blue-600 border-blue-100'
                    : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                    {invite.email.substring(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <span className={`text-sm block font-bold transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{invite.email}</span>
                    <span className={`text-[10px] uppercase tracking-widest transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-500'}`}>Quer compartilhar as finanças</span>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => acceptInvite(invite.id)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-teal-500 text-white rounded-xl text-xs font-bold hover:bg-teal-400 transition-all shadow-lg shadow-teal-500/20 active:scale-95"
                  >
                    Aceitar
                  </button>
                  <button
                    onClick={() => rejectInvite(invite.id)}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${theme === 'light'
                      ? 'bg-gray-100 text-slate-500 hover:bg-red-50 hover:text-red-500'
                      : 'bg-white/[0.05] text-gray-400 hover:bg-red-500/10 hover:text-red-400'
                      }`}
                  >
                    Recusar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Members List - Separated */}
      <div className="space-y-6">
        {(() => {
          const ownerMember = members.find(m => m.role === 'owner');
          const guestMembers = members.filter(m => m.role !== 'owner');

          return (
            <>
              {/* Owner Section */}
              <div>
                <h4 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 transition-colors ${theme === 'light' ? 'text-teal-600' : 'text-teal-400'}`}>
                  <Icon name="verified_user" />
                  Quem está compartilhando
                </h4>
                {ownerMember ? (
                  <div className={`p-4 border rounded-2xl flex items-center gap-4 transition-all ${theme === 'light'
                    ? 'bg-teal-50 border-teal-100'
                    : 'bg-gradient-to-r from-teal-500/10 to-transparent border-teal-500/20'
                    }`}>
                    <div className={`size-12 rounded-full flex items-center justify-center font-bold border transition-colors ${theme === 'light'
                      ? 'bg-white text-teal-600 border-teal-100'
                      : 'bg-teal-500/20 text-teal-400 border-teal-500/30'
                      }`}>
                      {(ownerMember.email || 'O').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className={`font-bold text-lg transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{ownerMember.email || 'Proprietário'}</p>
                      <p className={`text-xs transition-colors ${theme === 'light' ? 'text-teal-600' : 'text-teal-400'}`}>Administrador da Conta</p>
                    </div>
                  </div>
                ) : (
                  <p className={`italic transition-colors ${theme === 'light' ? 'text-slate-400' : 'text-gray-500'}`}>Proprietário não identificado.</p>
                )}
              </div>

              {/* Guests Section */}
              <div>
                <h4 className={`text-sm font-bold uppercase tracking-wider mb-4 mt-8 flex items-center gap-2 transition-colors ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`}>
                  <Icon name="group" />
                  Membros Convidados
                </h4>
                <div className="space-y-3">
                  {guestMembers.length === 0 ? (
                    <p className={`text-sm italic p-4 border rounded-xl transition-all ${theme === 'light'
                      ? 'bg-gray-50 border-gray-100 text-slate-400'
                      : 'bg-white/[0.02] border-white/5 text-gray-500'
                      }`}>
                      Nenhum outro membro nesta conta.
                    </p>
                  ) : (
                    guestMembers.map(member => (
                      <div key={member.id} className={`flex items-center justify-between p-4 border rounded-xl transition-all ${theme === 'light'
                        ? 'bg-white border-gray-100 hover:bg-gray-50'
                        : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]'
                        }`}>                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold border border-blue-500/20">
                            {(member.email || 'U').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-white">{member.email || 'Usuário Convidado'}</p>
                            <p className="text-xs text-gray-500">Acesso via convite</p>
                          </div>
                        </div>
                        {isOwner && member.user_id !== user?.id && (
                          <button
                            onClick={() => removeMember(member.id)}
                            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="Remover membro"
                          >
                            <Icon name="person_remove" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          );
        })()}
      </div>

      {/* Outgoing Invites */}
      {invites.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Convites Enviados</h4>
          <div className="space-y-2">
            {invites.map(invite => (
              <div key={invite.id} className="flex items-center justify-between p-3 bg-white/[0.02] border border-dashed border-white/[0.1] rounded-lg">
                <span className="text-gray-400 text-sm">{invite.email}</span>
                <span className={`text-xs px-2 py-1 rounded ${invite.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                  invite.status === 'accepted' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                  {invite.status === 'pending' ? 'Pendente' : invite.status === 'accepted' ? 'Aceito' : 'Rejeitado'}
                </span>
                {invite.status === 'pending' && (
                  <button
                    onClick={() => cancelInvite(invite.id)}
                    className="p-1 px-2 text-[10px] font-bold text-gray-500 hover:text-red-500 transition-colors"
                  >
                    CANCELAR
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dangerous Actions */}
      <div className="pt-6 border-t border-white/[0.05]">
        <button
          onClick={leaveSharedAccount}
          className="flex items-center gap-2 px-6 py-3 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500/20 transition-all font-bold text-sm"
        >
          <Icon name="logout" />
          {isOwner && members.length === 1 ? 'Encerrar Compartilhamento' : 'Sair da Conta Compartilhada'}
        </button>
      </div>

      <InviteModal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} />
    </div>
  );
};

const Settings: React.FC = () => {
  const { user, signOut, isPremium } = useAuth();
  const { isPrivacyMode, togglePrivacyMode } = usePrivacy();
  const { recalculateBalances, deleteAllUserData } = useFinance();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<TabType>((searchParams.get('tab') as TabType) || 'profile');
  const [mobileView, setMobileView] = useState<'list' | 'detail'>(searchParams.get('tab') ? 'detail' : 'list');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [stripeInfo, setStripeInfo] = useState<{ currency?: string; amount_monthly?: number; amount_yearly?: number } | null>(null);
  const [loadingStripe, setLoadingStripe] = useState(false);

  // Form States
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [phone, setPhone] = useState(user?.user_metadata?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || '');

  const tabs = [
    { id: 'profile', label: 'Meu Perfil', icon: 'person', description: 'Dados pessoais e conta' },
    { id: 'preferences', label: 'Preferências', icon: 'tune', description: 'Moeda, idioma e visualização' },
    { id: 'categories', label: 'Categorias', icon: 'category', description: 'Gerenciar categorias de gastos' },
    { id: 'notifications', label: 'Notificações', icon: 'notifications', description: 'Alertas e lembretes' },
    { id: 'subscription', label: 'Assinatura', icon: 'workspace_premium', description: 'Planos e cobrança' },
    { id: 'security', label: 'Segurança', icon: 'security', description: 'Senha e autenticação' },
    { id: 'data', label: 'Dados', icon: 'database', description: 'Exportar e gerenciar dados' },
    { id: 'shared', label: 'Compartilhamento', icon: 'group', description: 'Gerenciar conta compartilhada' }
  ] as const;

  const activeTabInfo = tabs.find(t => t.id === activeTab);

  const handleTabClick = (tabId: TabType) => {
    setActiveTab(tabId);
    setMobileView('detail');
  };

  const handleBackToList = () => {
    setMobileView('list');
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) {
        throw new Error('Você deve selecionar uma imagem para fazer o upload.');
      }

      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl);
      toast.success('Avatar atualizado com sucesso!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const loadStripeInfo = async () => {
    try {
      setLoadingStripe(true);
      const { data } = await supabase.functions.invoke('get-stripe-prices');
      const db = (data as any)?.db;
      if (db) setStripeInfo({ currency: db.currency, amount_monthly: db.amount_monthly, amount_yearly: db.amount_yearly });
    } finally {
      setLoadingStripe(false);
    }
  };

  React.useEffect(() => { loadStripeInfo(); }, []);
  React.useEffect(() => {
    const status = searchParams.get('subscribe');
    if (status === 'success') {
      toast.success('Assinatura concluída com sucesso.');
    } else if (status === 'cancel') {
      toast.warning('Assinatura cancelada.');
    }

    const tabParam = searchParams.get('tab') as TabType;
    if (tabParam && tabParam !== activeTab && tabs.some(t => t.id === tabParam)) {
      setActiveTab(tabParam);
      setMobileView('detail');
    }
  }, [searchParams]);

  const handleSave = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          phone: phone,
          avatar_url: avatarUrl
        }
      });

      if (error) throw error;
      toast.success('Perfil atualizado com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao atualizar perfil: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncBalances = async () => {
    try {
      await recalculateBalances();
      toast.success('Saldos sincronizados com sucesso!');
    } catch (error) {
      toast.error('Erro ao sincronizar saldos.');
    }
  };

  return (
    <div className="flex flex-col md:h-auto">

      {/* Header Principal */}
      <div className={`${mobileView === 'detail' ? 'hidden md:block' : 'block'}`}>
        <h1 className="text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">Configurações</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Gerencie sua conta e preferências.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 md:gap-8 flex-1 items-start">

        {/* Sidebar de Navegação */}
        <nav className={`
          w-full md:w-72 flex-shrink-0 space-y-2 
          ${mobileView === 'detail' ? 'hidden md:block' : 'block'}
        `}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`
                w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 group border
                ${activeTab === tab.id
                  ? 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                  : 'bg-white/[0.02] text-gray-400 border-white/[0.05] hover:bg-white/[0.05]'}
              `}
            >
              <div className="flex items-center gap-4 text-left">
                <div className={`
                  p-2 rounded-lg transition-colors
                  ${activeTab === tab.id ? 'bg-teal-500/10 text-teal-400' : 'bg-white/[0.05] text-gray-500 group-hover:text-teal-400'}
                `}>
                  <Icon name={tab.icon} className="text-xl" />
                </div>
                <div>
                  <p className={`font-bold ${activeTab === tab.id ? 'text-teal-400' : 'text-white'}`}>
                    {tab.label}
                  </p>
                  <p className={`text-xs ${activeTab === tab.id ? 'text-teal-400/70' : 'text-gray-500'}`}>
                    {tab.description}
                  </p>
                </div>
              </div>
              <Icon name="chevron_right" className={`md:hidden ${activeTab === tab.id ? 'text-teal-400' : 'text-gray-400'}`} />
            </button>
          ))}
        </nav>

        {/* Área de Conteúdo */}
        <div className={`
          flex-1 w-full bg-white/[0.02] backdrop-blur-md md:rounded-2xl md:shadow-sm md:border border-white/[0.05] md:p-8
          ${mobileView === 'list' ? 'hidden md:block' : 'block'}
        `}>

          {/* Header Mobile do Conteúdo */}
          <div className="md:hidden flex items-center gap-3 mb-6 pb-4 border-b border-white/[0.05]">
            <button
              onClick={handleBackToList}
              className="p-2 -ml-2 text-gray-300 hover:bg-white/[0.05] rounded-full"
            >
              <Icon name="arrow_back" className="text-2xl" />
            </button>
            <h2 className="text-xl font-bold text-white">{activeTabInfo?.label}</h2>
          </div>

          {/* Título Desktop */}
          <div className="hidden md:block mb-8 pb-4 border-b border-white/[0.05]">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Icon name={activeTabInfo?.icon || ''} className="text-teal-400" />
              {activeTabInfo?.label}
            </h2>
          </div>

          {/* Conteúdo das Abas */}
          <div className="space-y-6">

            {/* Tab: Perfil */}
            {activeTab === 'profile' && (
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row items-center gap-6 bg-white/[0.02] p-6 rounded-2xl border border-white/[0.05]">
                  <div className="relative">
                    <div
                      className="size-24 rounded-full bg-cover bg-center border-4 border-white/[0.1] shadow-sm relative"
                      style={{ backgroundImage: `url("${avatarUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsKIk1DOYzsfGKsBARorNnMPJgb8KjtWgEChlWnMoj9mPOKMa7GeRmMGSanjv3gAwZOXO-814wljVcOvOdwwKQBtGWqWg6gad4RBqSB7XevoqzVwNUSEK1lr804Bbb-nOrL_YYcbeAjcYbPcMiKqRC0Gz59DHu7k9ytK4GQFGnGrWgKhQZTuTCwzwdoCtjdn8qidg_9102kGz_dl03tfwt1cAiLMxgs5Y9I52I2NuQCr1ykPYYe9lUrIPxkX4fA-_N8I6n5ERu-v4'}")` }}
                    >
                      {uploading && (
                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                          <div className="size-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 p-2 bg-teal-500 text-white rounded-full hover:bg-teal-600 transition-colors shadow-sm border-2 border-[#0f1216] cursor-pointer">
                      <Icon name="photo_camera" className="text-lg" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="text-xl font-bold text-white">{user?.user_metadata?.full_name || 'Usuário'}</h3>
                    <p className="text-sm text-gray-400 mb-3">{user?.email}</p>
                    {isPremium ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-teal-400 to-blue-500 text-white shadow-sm">
                        <Icon name="star" className="text-[14px] mr-1" />
                        Premium
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/[0.05] text-gray-300 shadow-sm">
                        <Icon name="person" className="text-[14px] mr-1" />
                        Plano Gratuito
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">Nome Completo</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-white/[0.1] bg-white/[0.05] text-white focus:ring-2 focus:ring-teal-500/50 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">E-mail</label>
                    <input type="email" defaultValue={user?.email || ''} disabled className="w-full px-4 py-3 rounded-xl border border-white/[0.1] bg-white/[0.02] text-gray-500 cursor-not-allowed outline-none transition-all" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-300 mb-2">Telefone</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(00) 00000-0000"
                      className="w-full px-4 py-3 rounded-xl border border-white/[0.1] bg-white/[0.05] text-white focus:ring-2 focus:ring-teal-500/50 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Preferências */}
            {activeTab === 'preferences' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">Moeda Principal</label>
                    <div className="relative">
                      <Dropdown
                        options={[
                          { label: 'Real Brasileiro (BRL)', value: 'BRL' },
                          { label: 'Dólar Americano (USD)', value: 'USD' },
                          { label: 'Euro (EUR)', value: 'EUR' }
                        ]}
                        value="BRL"
                        onChange={() => { }}
                        className="w-full"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">Idioma</label>
                    <div className="relative">
                      <Dropdown
                        options={[
                          { label: 'Português (Brasil)', value: 'pt-BR' },
                          { label: 'English (US)', value: 'en-US' },
                          { label: 'Español', value: 'es' }
                        ]}
                        value="pt-BR"
                        onChange={() => { }}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">Ocultar valores</p>
                      <p className="text-sm text-gray-500">Inicia o app com saldos borrados para privacidade</p>
                    </div>
                    <ToggleSwitch checked={isPrivacyMode} onChange={togglePrivacyMode} />
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Categorias */}
            {activeTab === 'categories' && <CategoriesTab />}

            {/* Tab: Notificações */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                {[
                  { title: 'Lembrete de Contas', desc: 'Notificar 2 dias antes do vencimento', icon: 'receipt', color: 'text-blue-400 bg-blue-500/20' },
                  { title: 'Alertas de Orçamento', desc: 'Avisar quando atingir 90% do limite', icon: 'warning', color: 'text-yellow-400 bg-yellow-500/20' },
                  { title: 'Resumo Semanal', desc: 'Receber relatório de gastos por e-mail', icon: 'insights', color: 'text-purple-400 bg-purple-500/20' },
                  { title: 'Dicas de Economia', desc: 'Sugestões personalizadas para economizar', icon: 'lightbulb', color: 'text-green-400 bg-green-500/20' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-white/[0.05] hover:border-teal-500/30 transition-colors bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${item.color}`}>
                        <Icon name={item.icon} />
                      </div>
                      <div>
                        <p className="font-bold text-white">{item.title}</p>
                        <p className="text-xs md:text-sm text-gray-500">{item.desc}</p>
                      </div>
                    </div>
                    <ToggleSwitch defaultChecked={idx < 2} />
                  </div>
                ))}
              </div>
            )}

            {/* Tab: Segurança */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon name="pin" className="text-gray-400" />
                      <div>
                        <p className="font-bold text-white">Bloqueio por PIN</p>
                        <p className="text-sm text-gray-500">Exigir código de 4 dígitos</p>
                      </div>
                    </div>
                    <ToggleSwitch />
                  </div>
                  <div className="h-px bg-white/[0.05] w-full"></div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon name="fingerprint" className="text-gray-400" />
                      <div>
                        <p className="font-bold text-white">Biometria</p>
                        <p className="text-sm text-gray-500">FaceID / TouchID</p>
                      </div>
                    </div>
                    <ToggleSwitch defaultChecked />
                  </div>
                </div>

                <button
                  onClick={async () => {
                    try {
                      const email = user?.email;
                      if (!email) {
                        toast.error('E-mail do usuário não encontrado.');
                        return;
                      }
                      const { error } = await supabase.auth.resetPasswordForEmail(email, {
                        redirectTo: `${window.location.origin}/#/reset-password`
                      });
                      if (error) {
                        toast.error('Erro ao enviar e-mail de redefinição.');
                      } else {
                        toast.success('E-mail de redefinição enviado.');
                      }
                    } catch (e) {
                      toast.error('Erro ao enviar e-mail de redefinição.');
                    }
                  }}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-white/[0.05] hover:bg-white/[0.05] transition-colors text-left group bg-white/[0.02]"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/[0.05] rounded-lg text-gray-300">
                      <Icon name="lock_reset" />
                    </div>
                    <span className="font-medium text-gray-300 group-hover:text-teal-400 transition-colors">Alterar Senha de Acesso</span>
                  </div>
                  <Icon name="chevron_right" className="text-gray-400 group-hover:text-teal-400" />
                </button>

                <button
                  onClick={async () => {
                    if (confirm('Deseja realmente sair da sua conta?')) {
                      await signOut();
                      // Forçar recarregamento completo para limpar qualquer estado de memória
                      window.location.replace('/#/login');
                      window.location.reload();
                    }
                  }}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-red-900/50 bg-red-900/10 hover:bg-red-900/20 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-900/30 rounded-lg text-red-400">
                      <Icon name="logout" />
                    </div>
                    <span className="font-medium text-red-400 group-hover:text-red-500 transition-colors">Sair da Conta</span>
                  </div>
                  <Icon name="chevron_right" className="text-red-400 group-hover:text-red-500" />
                </button>
              </div>
            )}

            {/* Tab: Compartilhamento */}
            {activeTab === 'shared' && <SharedAccountTab />}

            {/* Tab: Dados */}
            {activeTab === 'data' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Exportar</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => {
                        // @ts-ignore
                        const { transactions } = useFinance();
                        const headers = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Status'];
                        const csvContent = [
                          headers.join(','),
                          ...transactions.map(t => [
                            t.date,
                            `"${t.description.replace(/"/g, '""')}"`,
                            t.category,
                            t.type,
                            t.amount.toFixed(2),
                            t.isPaid ? 'Pago' : 'Pendente'
                          ].join(','))
                        ].join('\n');

                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.setAttribute('href', url);
                        link.setAttribute('download', `transacoes_${new Date().toISOString().split('T')[0]}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="flex flex-col items-center justify-center gap-3 p-6 border border-white/[0.05] rounded-xl hover:border-teal-500/50 hover:bg-teal-500/5 transition-all group bg-white/[0.02]"
                    >
                      <div className="p-3 bg-green-500/20 text-green-400 rounded-full group-hover:scale-110 transition-transform">
                        <Icon name="description" className="text-2xl" />
                      </div>
                      <span className="font-bold text-gray-300">Planilha Excel (CSV)</span>
                    </button>
                    <button className="flex flex-col items-center justify-center gap-3 p-6 border border-white/[0.05] rounded-xl hover:border-teal-500/50 hover:bg-teal-500/5 transition-all group bg-white/[0.02]">
                      <div className="p-3 bg-red-500/20 text-red-400 rounded-full group-hover:scale-110 transition-transform">
                        <Icon name="picture_as_pdf" className="text-2xl" />
                      </div>
                      <span className="font-bold text-gray-300">Relatório PDF</span>
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Manutenção</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={handleSyncBalances}
                      className="flex flex-col items-center justify-center gap-3 p-6 border border-white/[0.05] rounded-xl hover:border-teal-500/50 hover:bg-teal-500/5 transition-all group bg-white/[0.02]"
                    >
                      <div className="p-3 bg-blue-500/20 text-blue-400 rounded-full group-hover:scale-110 transition-transform">
                        <Icon name="sync" className="text-2xl" />
                      </div>
                      <span className="font-bold text-gray-300">Sincronizar Saldos</span>
                      <span className="text-xs text-gray-500 text-center">Corrige divergências criando transações de ajuste</span>
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-red-500 mb-4 flex items-center gap-2">
                    <Icon name="warning" /> Zona de Perigo
                  </h3>
                  <div className="p-5 border border-red-900/50 bg-red-900/10 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-white">Resetar Conta</p>
                      <p className="text-sm text-gray-500 mt-1">Apaga todas as transações, contas e metas permanentemente.</p>
                    </div>
                    <button
                      onClick={async () => {
                        if (confirm('Tem certeza absoluta? Todos os dados serão perdidos.')) {
                          await deleteAllUserData();
                        }
                      }}
                      className="px-5 py-2.5 bg-[#0f1216] border border-red-900 text-red-500 font-bold rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-sm whitespace-nowrap w-full md:w-auto"
                    >
                      Resetar Tudo
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Assinatura */}
            {activeTab === 'subscription' && (
              <PremiumPlans
                isPremium={!!isPremium}
                stripeInfo={stripeInfo}
                onRefreshStripeInfo={loadStripeInfo}
              />
            )}



          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

import React, { useState } from 'react';
import { Icon } from '../components/Icon';
import { Dropdown } from '../components/Dropdown';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { supabase } from '../services/supabase';
import { Category } from '../types';
import { Modal } from '../components/Modal';

type TabType = 'profile' | 'preferences' | 'categories' | 'notifications' | 'security' | 'data';

const Settings: React.FC = () => {
  const { signOut, user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.user_metadata?.avatar_url || null);

  const tabs: { id: TabType; label: string; icon: string; description: string }[] = [
    { id: 'profile', label: 'Perfil', icon: 'person', description: 'Seus dados pessoais' },
    { id: 'preferences', label: 'Preferências', icon: 'tune', description: 'Moeda, idioma e tema' },
    { id: 'categories', label: 'Categorias', icon: 'category', description: 'Gerenciar categorias' },
    { id: 'notifications', label: 'Notificações', icon: 'notifications', description: 'Alertas e avisos' },
    { id: 'security', label: 'Segurança', icon: 'lock', description: 'Senha e biometria' },
    { id: 'data', label: 'Dados', icon: 'database', description: 'Exportação e backup' },
  ];

  const activeTabInfo = tabs.find(t => t.id === activeTab);

  const handleTabClick = (id: TabType) => {
    setActiveTab(id);
    setMobileView('detail');
    window.scrollTo(0, 0);
  };

  const handleBackToList = () => {
    setMobileView('list');
  };

  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [phone, setPhone] = useState(user?.user_metadata?.phone || '');

  const handleSave = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          phone: phone
        }
      });

      if (error) throw error;

      alert('Alterações salvas com sucesso!');
    } catch (error: any) {
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Você deve selecionar uma imagem para fazer upload.');
      }

      const file = event.target.files[0];
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

      if (data) {
        const { error: updateError } = await supabase.auth.updateUser({
          data: { avatar_url: data.publicUrl }
        });

        if (updateError) {
          throw updateError;
        }

        setAvatarUrl(data.publicUrl);
        alert('Foto de perfil atualizada!');
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-20 md:pb-0 h-full">

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
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-teal-400 to-blue-500 text-white shadow-sm">
                      <Icon name="star" className="text-[14px] mr-1" />
                      Premium
                    </span>
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
                    <ToggleSwitch />
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

                <button className="w-full flex items-center justify-between p-4 rounded-xl border border-white/[0.05] hover:bg-white/[0.05] transition-colors text-left group bg-white/[0.02]">
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
                      window.location.href = '/login';
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

            {/* Tab: Dados */}
            {activeTab === 'data' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Exportar</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => {
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
                  <h3 className="text-lg font-bold text-red-500 mb-4 flex items-center gap-2">
                    <Icon name="warning" /> Zona de Perigo
                  </h3>
                  <div className="p-5 border border-red-900/50 bg-red-900/10 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-white">Resetar Conta</p>
                      <p className="text-sm text-gray-500 mt-1">Apaga todas as transações, contas e metas permanentemente.</p>
                    </div>
                    <button
                      onClick={() => { if (confirm('Tem certeza absoluta? Todos os dados serão perdidos.')) alert('Dados resetados!'); }}
                      className="px-5 py-2.5 bg-[#0f1216] border border-red-900 text-red-500 font-bold rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shadow-sm whitespace-nowrap w-full md:w-auto"
                    >
                      Resetar Tudo
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Salvar */}
            <div className="mt-8 pt-6 border-t border-white/[0.05] flex justify-end sticky bottom-0 bg-[#0f1216] py-4 md:static md:bg-transparent md:py-0 -mx-6 px-6 md:mx-0 md:px-0 z-10">
              <button
                onClick={handleSave}
                disabled={loading}
                className={`
                  w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white shadow-[0_0_20px_-5px_rgba(45,212,191,0.3)] transition-all
                  ${loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-teal-500 hover:bg-teal-600 active:scale-95'}
                `}
              >
                {loading ? (
                  <>
                    <span className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Icon name="check" />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// Componente de Gerenciamento de Categorias
const CategoriesTab: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');

  const handleEdit = (category: Category) => {
    if (category.isDefault) {
      alert('Categorias padrão não podem ser editadas');
      return;
    }
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleDelete = async (category: Category) => {
    if (category.isDefault) {
      alert('Categorias padrão não podem ser excluídas');
      return;
    }
    if (confirm(`Deseja excluir a categoria "${category.name}"?`)) {
      await deleteCategory(category.id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          Personalize suas categorias de receitas e despesas
        </p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors text-sm font-medium shadow-[0_0_10px_rgba(45,212,191,0.3)]"
        >
          <Icon name="add" className="text-lg" />
          Nova Categoria
        </button>
      </div>

      {/* Categorias de Despesas */}
      <div>
        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <Icon name="arrow_upward" className="text-red-400" />
          Despesas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {expenseCategories.map(category => (
            <div
              key={category.id}
              className="flex items-center justify-between p-3 rounded-lg border border-white/[0.05] hover:border-teal-500/30 transition-colors bg-white/[0.02]"
            >
              <div className="flex items-center gap-3">
                <div
                  className="size-10 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: category.color }}
                >
                  <Icon name={category.icon} className="text-xl" />
                </div>
                <div>
                  <p className="font-semibold text-white">{category.name}</p>
                  {category.isDefault && (
                    <p className="text-xs text-gray-500">Padrão do sistema</p>
                  )}
                </div>
              </div>
              {!category.isDefault && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(category)}
                    className="p-2 text-gray-400 hover:text-teal-400 hover:bg-teal-500/10 rounded-lg transition-colors"
                  >
                    <Icon name="edit" className="text-lg" />
                  </button>
                  <button
                    onClick={() => handleDelete(category)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Icon name="delete" className="text-lg" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Categorias de Receitas */}
      <div>
        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <Icon name="arrow_downward" className="text-green-400" />
          Receitas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {incomeCategories.map(category => (
            <div
              key={category.id}
              className="flex items-center justify-between p-3 rounded-lg border border-white/[0.05] hover:border-teal-500/30 transition-colors bg-white/[0.02]"
            >
              <div className="flex items-center gap-3">
                <div
                  className="size-10 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: category.color }}
                >
                  <Icon name={category.icon} className="text-xl" />
                </div>
                <div>
                  <p className="font-semibold text-white">{category.name}</p>
                  {category.isDefault && (
                    <p className="text-xs text-gray-500">Padrão do sistema</p>
                  )}
                </div>
              </div>
              {!category.isDefault && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(category)}
                    className="p-2 text-gray-400 hover:text-teal-400 hover:bg-teal-500/10 rounded-lg transition-colors"
                  >
                    <Icon name="edit" className="text-lg" />
                  </button>
                  <button
                    onClick={() => handleDelete(category)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Icon name="delete" className="text-lg" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <CategoryModal
          category={editingCategory}
          onClose={handleCloseModal}
          onSave={editingCategory ? updateCategory : addCategory}
        />
      )}
    </div>
  );
};

// Modal de Categoria
const CategoryModal: React.FC<{
  category: Category | null;
  onClose: () => void;
  onSave: (id: string, data: any) => Promise<void> | ((data: any) => Promise<void>);
}> = ({ category, onClose, onSave }) => {
  const [name, setName] = useState(category?.name || '');
  const [icon, setIcon] = useState(category?.icon || 'category');
  const [color, setColor] = useState(category?.color || '#3b82f6');
  const [type, setType] = useState<'income' | 'expense'>(category?.type || 'expense');

  const ICONS = [
    'restaurant', 'directions_car', 'local_hospital', 'school', 'sports_esports',
    'home', 'checkroom', 'shopping_cart', 'flight', 'pets',
    'fitness_center', 'local_cafe', 'movie', 'music_note', 'book',
    'payments', 'work', 'trending_up', 'savings', 'account_balance',
    'category', 'more_horiz'
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
          <label className="block text-sm font-bold text-gray-300 mb-2">
            Nome da Categoria
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-white/[0.1] bg-white/[0.05] text-white focus:ring-2 focus:ring-teal-500/50 focus:border-transparent outline-none"
            placeholder="Ex: Alimentação"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-300 mb-2">
            Tipo
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${type === 'expense'
                ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                : 'bg-white/[0.05] text-gray-400'
                }`}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${type === 'income'
                ? 'bg-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]'
                : 'bg-white/[0.05] text-gray-400'
                }`}
            >
              Receita
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-300 mb-2">
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
                  : 'bg-white/[0.05] text-gray-400 hover:bg-white/[0.1]'
                  }`}
              >
                <Icon name={iconName} className="text-xl" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-300 mb-2">
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
            className="flex-1 py-3 rounded-xl font-medium bg-white/[0.05] text-gray-300 hover:bg-white/[0.1] transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 py-3 rounded-xl font-medium bg-teal-500 text-white hover:bg-teal-600 transition-colors shadow-[0_0_20px_-5px_rgba(45,212,191,0.3)]"
          >
            {category ? 'Salvar' : 'Criar'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Componente Auxiliar de Switch
const ToggleSwitch: React.FC<{ defaultChecked?: boolean }> = ({ defaultChecked = false }) => {
  const [enabled, setEnabled] = useState(defaultChecked);

  return (
    <button
      onClick={() => setEnabled(!enabled)}
      className={`
        relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/50
        ${enabled ? 'bg-teal-500' : 'bg-gray-600'}
      `}
    >
      <span
        className={`
          inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200
          ${enabled ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  );
};

export default Settings;

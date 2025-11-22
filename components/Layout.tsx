import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from './Icon';
import { useAuth } from '../context/AuthContext';
import { usePrivacy } from '../context/PrivacyContext';
import { FABContainer } from './FABContainer';
import { NotificationPanel } from './NotificationPanel';
import { useNotificationScheduler } from '../hooks/useNotificationScheduler';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { isPrivacyMode, togglePrivacyMode } = usePrivacy();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Ativar agendador de notificações
  useNotificationScheduler();

  const menuItems = [
    { path: '/', icon: 'dashboard', label: 'Resumo' },
    { path: '/accounts', icon: 'account_balance', label: 'Contas' },
    { path: '/transactions', icon: 'receipt_long', label: 'Transações' },
    { path: '/cards', icon: 'credit_card', label: 'Cartões de crédito' },
    { label: 'PLANEJAR', isHeader: true },
    { path: '/calendar', icon: 'calendar_month', label: 'Calendário' },
    { path: '/budgets', icon: 'pie_chart', label: 'Orçamentos' },
    { path: '/goals', icon: 'savings', label: 'Objetivos' },
    { label: 'ANALISAR', isHeader: true },
    { path: '/reports', icon: 'bar_chart', label: 'Relatórios' },
    { path: '/statistics', icon: 'show_chart', label: 'Estatísticas' },
    { label: 'CONFIGURAÇÕES', isHeader: true },
    { path: '/settings', icon: 'settings', label: 'Configurações' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  // Noise texture data URI (same as Login)
  const noiseBg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E")`;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0f1216] font-display selection:bg-teal-500/30 selection:text-teal-200 relative">

      {/* GLOBAL BACKGROUND: Mesh Gradient + Noise */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Base Dark Background */}
        <div className="absolute inset-0 bg-[#0f1216]"></div>

        {/* Mesh Gradients */}
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-blue-900/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-teal-900/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }}></div>
        <div className="absolute top-[40%] left-[30%] w-[40vw] h-[40vw] bg-purple-900/10 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }}></div>

        {/* Noise Overlay */}
        <div className="absolute inset-0 opacity-40 mix-blend-overlay" style={{ backgroundImage: noiseBg }}></div>
      </div>

      {/* Sidebar (Glassmorphism) */}
      <aside className={`
        fixed md:relative z-50 h-full w-64 shrink-0 transform transition-transform duration-300 ease-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="h-full flex flex-col border-r border-white/[0.05] bg-white/[0.02] backdrop-blur-xl relative">
          {/* Logo Area */}
          <div className="p-6 flex items-center gap-3 shrink-0">
            <div className="size-10 rounded-xl bg-gradient-to-br from-teal-400/20 to-blue-600/20 border border-white/10 flex items-center justify-center shadow-lg backdrop-blur-md">
              <Icon name="account_balance_wallet" className="text-xl text-teal-400" />
            </div>
            <h2 className="text-lg font-bold tracking-tight text-white">Monely Finance</h2>
          </div>

          {/* User Profile */}
          <div className="px-4 mb-6">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center gap-3 hover:bg-white/[0.05] transition-colors cursor-pointer group">
              <div className="size-10 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 p-[1px]">
                <div className="w-full h-full rounded-full bg-[#0f1216] flex items-center justify-center overflow-hidden">
                  {user?.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-bold text-teal-400 text-sm">{user?.email?.substring(0, 2).toUpperCase()}</span>
                  )}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate group-hover:text-teal-400 transition-colors">
                  {user?.user_metadata?.full_name || 'Usuário'}
                </p>
                <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 space-y-1 custom-scrollbar">
            {menuItems.map((item, index) => (
              item.isHeader ? (
                <div key={index} className="mt-6 mb-2 px-3">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{item.label}</p>
                </div>
              ) : (
                <Link
                  key={item.path}
                  to={item.path!}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden
                    ${location.pathname === item.path
                      ? 'text-white bg-teal-500/10 border border-teal-500/20 shadow-[0_0_15px_-5px_rgba(45,212,191,0.3)]'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'}
                  `}
                >
                  {location.pathname === item.path && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-teal-400 rounded-r-full shadow-[0_0_10px_rgba(45,212,191,0.5)]"></div>
                  )}
                  <Icon
                    name={item.icon!}
                    className={`text-lg transition-colors ${location.pathname === item.path ? 'text-teal-400' : 'text-gray-500 group-hover:text-white'}`}
                  />
                  {item.label}
                </Link>
              )
            ))}
          </nav>

          {/* Footer Actions */}
          <div className="p-4 border-t border-white/[0.05] space-y-2">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all group"
            >
              <Icon name="logout" className="text-lg group-hover:text-red-400 transition-colors" />
              Sair da conta
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10 h-full overflow-hidden">
        {/* Header (Glassmorphism) */}
        <header className="h-16 md:h-20 px-4 md:px-8 flex items-center justify-between shrink-0 border-b border-white/[0.05] bg-white/[0.01] backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <Icon name="menu" className="text-2xl" />
            </button>

            {/* Page Title Breadcrumb style */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Monely</span>
              <Icon name="chevron_right" className="text-gray-600 text-xs" />
              <span className="text-white font-semibold">
                {menuItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <button
              onClick={togglePrivacyMode}
              className={`relative p-2 rounded-full transition-colors group ${isPrivacyMode ? 'text-teal-400 bg-teal-500/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
              title={isPrivacyMode ? "Mostrar valores" : "Ocultar valores"}
            >
              <Icon name={isPrivacyMode ? "visibility_off" : "visibility"} className="text-xl" />
            </button>
            <NotificationPanel />
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth custom-scrollbar">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </div>
      </main>

      {/* Floating Action Button - Global */}
      <FABContainer />
    </div>
  );
};

export default Layout;

import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from './Icon';
import { useAuth } from '../context/AuthContext';
import { usePrivacy } from '../context/PrivacyContext';
import { useTheme } from '../context/ThemeContext';
import { FABContainer } from './FABContainer';
import { NotificationPanel } from './NotificationPanel';
import { useNotificationScheduler } from '../hooks/useNotificationScheduler';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useToast } from '../context/ToastContext';
import { useNotifications } from '../context/NotificationContext';
import { NotificationType } from '../types/notifications';
import { logError } from '../utils/helpers';

interface LayoutProps {
  children: React.ReactNode;
}

type ErrorBoundaryProps = { onError?: (error: any, info: any) => void; fallback?: React.ReactNode; children: React.ReactNode };
type ErrorBoundaryState = { hasError: boolean };

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare props: ErrorBoundaryProps;
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(_: any): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: any, info: any): void {
    logError('UI ErrorBoundary', error, info);
    if (this.props.onError) this.props.onError(error, info);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300">
          <div className="flex items-center gap-2">
            <Icon name="error" />
            <span>Ocorreu um erro ao renderizar a interface. Tente novamente.</span>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isPrivacyMode, togglePrivacyMode } = usePrivacy();
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toast } = useToast();
  const { addNotification } = useNotifications();

  // Ativar agendador de notificações
  useNotificationScheduler();

  const handleUIError = async (error: any) => {
    toast.error('Erro inesperado na interface. Suas alterações foram preservadas.');
    try {
      await addNotification({
        type: NotificationType.WEEKLY_SUMMARY,
        title: 'Erro de Interface',
        message: error?.message ?? 'Falha ao renderizar componente',
        icon: 'error',
        color: '#ef4444',
        priority: 'high',
        actionUrl: '/reports'
      });
    } catch { }
  };

  const menuItems = [
    { path: '/', icon: 'dashboard', label: 'Resumo' },
    { path: '/accounts', icon: 'account_balance', label: 'Contas' },
    { path: '/transactions', icon: 'receipt_long', label: 'Transações' },
    { path: '/cards', icon: 'credit_card', label: 'Cartões de crédito' },
    { label: 'PLANEJAR', isHeader: true },
    { path: '/calendar', icon: 'calendar_month', label: 'Calendário' },
    { path: '/supermarket', icon: 'shopping_basket', label: 'Supermercado' },
    { path: '/budgets', icon: 'pie_chart', label: 'Orçamentos' },

    { path: '/goals', icon: 'savings', label: 'Objetivos' },
    { path: '/investments', icon: 'trending_up', label: 'Investimentos' },
    { label: 'ANALISAR', isHeader: true },
    { path: '/reports', icon: 'bar_chart', label: 'Relatórios' },
    { path: '/statistics', icon: 'show_chart', label: 'Estatísticas' },
    { label: 'COMPARTILHAMENTO', isHeader: true },
    { path: '/shared-dashboard', icon: 'group', label: 'Dashboard Conjunto' },
    { label: 'CONFIGURAÇÕES', isHeader: true },
    { path: '/settings', icon: 'settings', label: 'Configurações' },
  ];

  const handleSignOut = async () => {
    await signOut();
    // Forçar recarregamento completo para limpar qualquer estado de memória
    window.location.replace('/#/login');
    window.location.reload();
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
        {/* Mesh Gradients - Optimized for Mobile */}
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-blue-900/20 rounded-full blur-[80px] md:blur-[120px] md:animate-pulse will-change-transform" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-teal-900/20 rounded-full blur-[60px] md:blur-[100px] md:animate-pulse will-change-transform" style={{ animationDuration: '10s', animationDelay: '1s' }}></div>
        <div className="absolute top-[40%] left-[30%] w-[40vw] h-[40vw] bg-purple-900/10 rounded-full blur-[50px] md:blur-[80px] md:animate-pulse will-change-transform" style={{ animationDuration: '12s', animationDelay: '2s' }}></div>

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
            <div className="size-7 rounded-xl bg-gradient-to-br from-teal-400/20 to-blue-600/20 border border-white/10 flex items-center justify-center shadow-lg backdrop-blur-md overflow-hidden p-1.5">
              <img src="/logo.png" alt="Monely Finance" className="w-full h-full object-contain" />
            </div>
            <h2 className="text-lg font-bold tracking-tight text-white">Monely Finance</h2>
          </div>

          {/* User Profile */}
          <div className="px-4 mb-6">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center gap-3 hover:bg-white/[0.05] transition-colors cursor-pointer group">
              <div className="size-7 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 p-[1px]">
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
                <motion.div
                  key={item.path}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    to={item.path!}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden
                      ${location.pathname === item.path
                        ? 'text-white bg-teal-500/15 border border-teal-500/20 shadow-[0_0_15px_-5px_rgba(45,212,191,0.3)]'
                        : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'}
                    `}
                  >
                    {location.pathname === item.path && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute left-0 top-0 w-1 h-full bg-teal-400 rounded-r shadow-[0_0_10px_rgba(45,212,191,0.5)]"
                      />
                    )}
                    <Icon
                      name={item.icon!}
                      className={`text-lg transition-colors ${location.pathname === item.path ? 'text-teal-400' : 'text-gray-500 group-hover:text-white'}`}
                    />
                    {item.label}
                  </Link>
                </motion.div>
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
              onClick={toggleTheme}
              className={`relative p-2 rounded-full transition-colors group ${theme === 'light' ? 'text-yellow-500 bg-yellow-500/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
              title={theme === 'light' ? "Modo Escuro" : "Modo Claro"}
            >
              <Icon name={theme === 'light' ? "light_mode" : "dark_mode"} className="text-xl" />
            </button>
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
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <ErrorBoundary onError={handleUIError}>
                  {children || <Outlet />}
                </ErrorBoundary>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Floating Action Button - Global */}
      <FABContainer />
    </div>
  );
};

export default Layout;

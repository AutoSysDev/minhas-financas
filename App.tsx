import React, { lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { FinanceProvider } from './context/FinanceContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PrivacyProvider } from './context/PrivacyContext';
import { NotificationProvider } from './context/NotificationContext';
import { UIProvider } from './context/UIContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { SharedAccountProvider } from './context/SharedAccountContext';
import { SupermarketProvider } from './context/SupermarketContext';
import { SplashScreen } from './components/SplashScreen';

// Lazy loading components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Cards = lazy(() => import('./pages/Cards'));
const Invoice = lazy(() => import('./pages/Invoice'));
const Goals = lazy(() => import('./pages/Goals'));
const Budgets = lazy(() => import('./pages/Budgets'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Accounts = lazy(() => import('./pages/Accounts'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const Statistics = lazy(() => import('./pages/Statistics'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Login = lazy(() => import('./pages/Login'));
const ChartTest = lazy(() => import('./pages/ChartTest'));
const NotificationSettings = lazy(() => import('./pages/NotificationSettings'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Investments = lazy(() => import('./pages/Investments'));
const ShoppingListsPage = lazy(() => import('./pages/Supermarket/ShoppingListsPage'));
const ShoppingListDetailPage = lazy(() => import('./pages/Supermarket/ShoppingListDetailPage'));
const SharedDashboard = lazy(() => import('./pages/SharedDashboard'));

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <SplashScreen />;

  return user ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <PrivacyProvider>
          <NotificationProvider>
            <UIProvider>
              <ToastProvider>
                <SharedAccountProvider>
                  <FinanceProvider>
                    <SupermarketProvider>
                      <Router>

                        <Suspense fallback={<SplashScreen />}>
                          <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route path="/reset-password" element={<ResetPassword />} />

                            {/* Rotas protegidas com Layout persistente */}
                            <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
                              <Route path="/" element={<Dashboard />} />
                              <Route path="/cards" element={<Cards />} />
                              <Route path="/invoice" element={<Invoice />} />
                              <Route path="/goals" element={<Goals />} />
                              <Route path="/budgets" element={<Budgets />} />
                              <Route path="/transactions" element={<Transactions />} />
                              <Route path="/calendar" element={<Calendar />} />
                              <Route path="/accounts" element={<Accounts />} />
                              <Route path="/reports" element={<Reports />} />
                              <Route path="/statistics" element={<Statistics />} />
                              <Route path="/settings" element={<Settings />} />
                              <Route path="/chart-test" element={<ChartTest />} />
                              <Route path="/notifications" element={<NotificationSettings />} />
                              <Route path="/investments" element={<Investments />} />
                              <Route path="/supermarket" element={<ShoppingListsPage />} />
                              <Route path="/supermarket/:id" element={<ShoppingListDetailPage />} />
                              <Route path="/shared-dashboard" element={<SharedDashboard />} />
                            </Route>

                            <Route path="*" element={<Navigate to="/" replace />} />
                          </Routes>
                        </Suspense>
                      </Router>
                    </SupermarketProvider>
                  </FinanceProvider>
                </SharedAccountProvider>
              </ToastProvider>
            </UIProvider>
          </NotificationProvider>
        </PrivacyProvider>
      </ThemeProvider>
    </AuthProvider>
  );

};

export default App;

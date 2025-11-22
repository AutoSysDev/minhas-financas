import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Cards from './pages/Cards';
import Invoice from './pages/Invoice';
import Goals from './pages/Goals';
import Budgets from './pages/Budgets';
import Transactions from './pages/Transactions';
import Accounts from './pages/Accounts';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Statistics from './pages/Statistics';
import Calendar from './pages/Calendar';
import Login from './pages/Login';
import ChartTest from './pages/ChartTest';
import NotificationSettings from './pages/NotificationSettings';
import { FinanceProvider } from './context/FinanceContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PrivacyProvider } from './context/PrivacyContext';
import { NotificationProvider } from './context/NotificationContext';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return user ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <PrivacyProvider>
        <NotificationProvider>
          <FinanceProvider>
            <Router>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={
                  <PrivateRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </PrivateRoute>
                } />
                <Route path="/cards" element={
                  <PrivateRoute>
                    <Layout>
                      <Cards />
                    </Layout>
                  </PrivateRoute>
                } />
                <Route path="/invoice" element={
                  <PrivateRoute>
                    <Layout>
                      <Invoice />
                    </Layout>
                  </PrivateRoute>
                } />
                <Route path="/goals" element={
                  <PrivateRoute>
                    <Layout>
                      <Goals />
                    </Layout>
                  </PrivateRoute>
                } />
                <Route path="/budgets" element={
                  <PrivateRoute>
                    <Layout>
                      <Budgets />
                    </Layout>
                  </PrivateRoute>
                } />
                <Route path="/transactions" element={
                  <PrivateRoute>
                    <Layout>
                      <Transactions />
                    </Layout>
                  </PrivateRoute>
                } />
                <Route path="/calendar" element={
                  <PrivateRoute>
                    <Layout>
                      <Calendar />
                    </Layout>
                  </PrivateRoute>
                } />
                <Route path="/accounts" element={
                  <PrivateRoute>
                    <Layout>
                      <Accounts />
                    </Layout>
                  </PrivateRoute>
                } />
                <Route path="/reports" element={
                  <PrivateRoute>
                    <Layout>
                      <Reports />
                    </Layout>
                  </PrivateRoute>
                } />
                <Route path="/statistics" element={
                  <PrivateRoute>
                    <Layout>
                      <Statistics />
                    </Layout>
                  </PrivateRoute>
                } />
                <Route path="/settings" element={
                  <PrivateRoute>
                    <Layout>
                      <Settings />
                    </Layout>
                  </PrivateRoute>
                } />
                <Route path="/chart-test" element={
                  <PrivateRoute>
                    <Layout>
                      <ChartTest />
                    </Layout>
                  </PrivateRoute>
                } />
                <Route path="/notifications" element={
                  <PrivateRoute>
                    <Layout>
                      <NotificationSettings />
                    </Layout>
                  </PrivateRoute>
                } />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Router>
          </FinanceProvider>
        </NotificationProvider>
      </PrivacyProvider>
    </AuthProvider>
  );
};

export default App;

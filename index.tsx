import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      gcTime: 1000 * 60 * 30, // 30 minutos
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

type ErrorBoundaryProps = { children: React.ReactNode };
type ErrorBoundaryState = { hasError: boolean };

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare props: ErrorBoundaryProps;
  state: ErrorBoundaryState = { hasError: false };
  static getDerivedStateFromError(_: any): ErrorBoundaryState { return { hasError: true }; }
  render(): React.ReactNode {
    if (this.state.hasError) {
      return React.createElement('div', { style: { padding: 24, color: '#fff', background: '#0f1216', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
        React.createElement('div', { style: { maxWidth: 480 } },
          React.createElement('h1', { style: { fontSize: 20, marginBottom: 12 } }, 'Falha ao carregar a aplicação'),
          React.createElement('p', { style: { fontSize: 14, marginBottom: 16, color: '#9ca3af' } }, 'Verifique sua conexão e variáveis de ambiente. Tente recarregar a página.'),
          React.createElement('button', { onClick: () => location.reload(), style: { padding: '10px 16px', borderRadius: 8, background: '#14b8a6', color: '#fff' } }, 'Recarregar')
        )
      );
    }
    return this.props.children as any;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);

console.log('Initializing App from index.tsx with QueryClientProvider...');

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </QueryClientProvider>
  </React.StrictMode>
);

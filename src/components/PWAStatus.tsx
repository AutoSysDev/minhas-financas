import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Icon } from '../../components/Icon';
import { useTheme } from '../../context/ThemeContext';

/**
 * Avisos globais do PWA:
 * - "Nova versão disponível" com ação explícita de atualização.
 * - "Pronto para usar offline" após o precache do shell.
 * - Faixa de "sem conexão" quando o aparelho perde rede.
 */
export const PWAStatus: React.FC = () => {
  const { theme } = useTheme();
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      // Verifica atualização a cada hora, sem recarregar nada sozinho.
      window.setInterval(() => {
        registration.update().catch(() => undefined);
      }, 60 * 60 * 1000);
    },
  });

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  useEffect(() => {
    if (!offlineReady) return;
    const timer = window.setTimeout(() => setOfflineReady(false), 5000);
    return () => window.clearTimeout(timer);
  }, [offlineReady, setOfflineReady]);

  const isLight = theme === 'light';

  const showToast = needRefresh || offlineReady;

  return (
    <>
      {/* Faixa de offline (topo, acima do header) */}
      {!isOnline && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-0 top-0 z-[10001] pt-safe px-2"
        >
          <div className="mx-auto max-w-md mt-1 flex items-center justify-center gap-2 rounded-full bg-amber-500/95 px-3 py-1.5 text-[11px] font-bold text-amber-950 shadow-lg">
            <Icon name="cloud_off" className="text-sm" />
            Sem conexão — exibindo dados já carregados
          </div>
        </div>
      )}

      {showToast && (
        <div className="fixed inset-x-0 bottom-0 z-[10000] flex justify-center px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pointer-events-none">
          <div
            role="status"
            aria-live="polite"
            className={`pointer-events-auto w-full max-w-md rounded-2xl border shadow-2xl p-4 flex items-start gap-3 animate-slide-up ${
              isLight ? 'bg-white border-gray-200 text-gray-900' : 'bg-[#151a21] border-white/10 text-white'
            }`}
          >
            <div className="size-10 rounded-full bg-teal-500/15 text-teal-400 flex items-center justify-center shrink-0">
              <Icon name={needRefresh ? 'system_update' : 'offline_pin'} className="text-xl" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold leading-tight">
                {needRefresh ? 'Nova versão disponível' : 'Pronto para usar offline'}
              </p>
              <p className={`text-xs mt-1 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                {needRefresh
                  ? 'Atualize para receber as melhorias mais recentes.'
                  : 'O app já pode ser aberto sem conexão.'}
              </p>

              {needRefresh && (
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => updateServiceWorker(true)}
                    className="min-h-11 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-white text-sm font-bold transition-colors"
                  >
                    Atualizar
                  </button>
                  <button
                    type="button"
                    onClick={() => setNeedRefresh(false)}
                    className={`min-h-11 px-4 rounded-xl border text-sm font-semibold transition-colors ${
                      isLight
                        ? 'border-gray-200 hover:bg-gray-50 text-gray-600'
                        : 'border-white/10 hover:bg-white/5 text-gray-300'
                    }`}
                  >
                    Depois
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                if (needRefresh) setNeedRefresh(false);
                else setOfflineReady(false);
              }}
              aria-label="Fechar aviso"
              className={`min-h-11 min-w-11 -m-2 flex items-center justify-center rounded-xl transition-colors ${
                isLight ? 'text-gray-400 hover:bg-gray-100' : 'text-gray-400 hover:bg-white/10'
              }`}
            >
              <Icon name="close" className="text-lg" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

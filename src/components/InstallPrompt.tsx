import React, { useEffect, useState } from 'react';
import { Icon } from '../../components/Icon';
import { useTheme } from '../../context/ThemeContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISS_KEY = 'monely-install-dismissed-at';
const DISMISS_DAYS = 14;

const isIosDevice = () => {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

const isStandaloneMode = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

/**
 * Convite de instalação do PWA.
 * - Android/Chrome: usa o evento nativo beforeinstallprompt.
 * - iOS/Safari: mostra o passo a passo (a Apple não expõe prompt programático).
 */
export const InstallPrompt: React.FC<{ className?: string; forceDark?: boolean }> = ({ className = '', forceDark = false }) => {
  const { theme } = useTheme();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    const lastDismiss = Number(window.localStorage.getItem(DISMISS_KEY) || 0);
    setDismissed(Date.now() - lastDismiss < DISMISS_DAYS * 24 * 60 * 60 * 1000);
    setIsIos(isIosDevice());
    setIsStandalone(isStandaloneMode());

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
    setShowSteps(false);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') dismiss();
    setDeferredPrompt(null);
  };

  if (isStandalone || dismissed) return null;
  if (!isIos && !deferredPrompt) return null;

  const isLight = !forceDark && theme === 'light';

  return (
    <div
      className={`rounded-2xl border p-4 ${className} ${
        isLight ? 'bg-white border-gray-200' : 'bg-white/[0.04] border-white/[0.08]'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="size-10 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center shrink-0">
          <Icon name={isIos ? 'ios_share' : 'install_mobile'} className="text-xl" />
        </div>

        <div className="min-w-0 flex-1">
          <p className={`text-sm font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
            Instale o Monely no celular
          </p>
          <p className={`text-xs mt-1 leading-relaxed ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
            {isIos
              ? 'Acesso rápido pela tela de início, em tela cheia e sem abrir o navegador.'
              : 'Abra direto da tela inicial, com a experiência de um aplicativo.'}
          </p>

          {isIos && showSteps && (
            <ol className={`mt-3 space-y-2 text-xs leading-relaxed ${isLight ? 'text-gray-600' : 'text-gray-300'}`}>
              <li className="flex gap-2">
                <span className="font-bold text-teal-500">1.</span>
                Toque em <Icon name="ios_share" className="text-sm align-text-bottom" /> <strong>Compartilhar</strong> na barra do Safari.
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-teal-500">2.</span>
                Escolha <strong>“Adicionar à Tela de Início”</strong>.
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-teal-500">3.</span>
                Confirme em <strong>“Adicionar”</strong>.
              </li>
            </ol>
          )}

          <div className="flex flex-wrap gap-2 mt-3">
            {isIos ? (
              <button
                type="button"
                onClick={() => setShowSteps((value) => !value)}
                className="min-h-11 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-white text-sm font-bold transition-colors"
              >
                {showSteps ? 'Ocultar passo a passo' : 'Como instalar'}
              </button>
            ) : (
              <button
                type="button"
                onClick={install}
                className="min-h-11 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-white text-sm font-bold transition-colors"
              >
                Instalar aplicativo
              </button>
            )}

            <button
              type="button"
              onClick={dismiss}
              className={`min-h-11 px-4 rounded-xl border text-sm font-semibold transition-colors ${
                isLight
                  ? 'border-gray-200 hover:bg-gray-50 text-gray-600'
                  : 'border-white/10 hover:bg-white/5 text-gray-300'
              }`}
            >
              Agora não
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

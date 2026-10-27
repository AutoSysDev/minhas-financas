import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.monelyfinance.app',
  appName: 'Monely Finance',
  webDir: 'dist',
  // Zoom por pinça desabilitado no WebView nativo (já é o padrão do Capacitor 6+,
  // declarado aqui para tornar a intenção explícita)
  zoomEnabled: false,
  server: {
    url: 'https://monelyfinance.vercel.app/', // Produção Vercel
    // url: 'http://192.168.2.14:3000', // Configuração para Live Reload (Desenvolvimento)
    cleartext: true,
    androidScheme: 'https',
    allowNavigation: [
      'cdn.tailwindcss.com',
      'fonts.googleapis.com',
      'fonts.gstatic.com',
      'esm.sh',
      'aistudiocdn.com',
      'monelyfinance.vercel.app'
    ]
  }
};

export default config;

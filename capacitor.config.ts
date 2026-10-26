import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.monelyfinance.app',
  appName: 'Monely Finance',
  webDir: 'dist',
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

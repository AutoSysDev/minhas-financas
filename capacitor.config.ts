import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.monelyfinance.app',
  appName: 'Monely Finance',
  webDir: 'dist',
  server: {
    // url: 'https://monelyfinance1.vercel.app', // Comentado para teste local. Descomente para produção/live updates.
    cleartext: true,
    androidScheme: 'https',
    allowNavigation: [
      'cdn.tailwindcss.com',
      'fonts.googleapis.com',
      'fonts.gstatic.com',
      'esm.sh',
      'aistudiocdn.com'
    ]
  }
};

export default config;

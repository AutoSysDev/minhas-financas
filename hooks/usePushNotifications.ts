import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

export function usePushNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Só executa em dispositivos nativos (Android/iOS)
    if (Capacitor.isNativePlatform()) {
      registerPushNotifications();
      addListeners();
    }
  }, [user]);

  const registerPushNotifications = async () => {
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.log('Permissão de notificação negada');
      return;
    }

    await PushNotifications.register();
  };

  const addListeners = () => {
    PushNotifications.addListener('registration', async (token) => {
      console.log('Push Token:', token.value);
      await saveTokenToSupabase(token.value);
    });

    PushNotifications.addListener('registrationError', (err) => {
      console.error('Erro no registro de Push:', err.error);
    });

    PushNotifications.addListener('pushNotificationReceived', async (notification) => {
      console.log('Notificação recebida:', notification);

      // Se o app estiver aberto (Foreground), mostra como Notificação Local
      await LocalNotifications.schedule({
        notifications: [
          {
            title: notification.title || 'Nova Notificação',
            body: notification.body || '',
            id: new Date().getTime(),
            schedule: { at: new Date(Date.now() + 100) }, // Mostra quase imediatamente
            sound: 'default',
            attachments: null,
            actionTypeId: '',
            extra: notification.data
          }
        ]
      });
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Ação da notificação:', notification);
      // Navegar para uma tela específica se necessário
      // O redirecionamento real pode ser feito verificando notification.data.url
      if (notification.notification.data?.url) {
        window.location.href = notification.notification.data.url;
      }
    });

    // Listener para quando clica na Notificação Local
    LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
      console.log('Ação da notificação local:', notification);
      if (notification.notification.extra?.url) {
        window.location.href = notification.notification.extra.url;
      }
    });
  };

  const saveTokenToSupabase = async (token: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_push_tokens')
      .upsert({
        user_id: user.id,
        token: token,
        platform: Capacitor.getPlatform(),
        last_used_at: new Date().toISOString()
      }, { onConflict: 'user_id, token' });

    if (error) {
      console.error('Erro ao salvar token no Supabase:', error);
    }
  };
}

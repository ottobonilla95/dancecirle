"use client";

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, ActionPerformed } from '@capacitor/push-notifications';
import { useSession } from 'next-auth/react';

export function usePushNotifications() {
  const { data: session, status } = useSession();
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only initialize on native platforms and when user is authenticated
    if (!Capacitor.isNativePlatform() || status !== 'authenticated' || !session?.user?.id) {
      return;
    }

    initializePushNotifications();
  }, [session, status]);

  const initializePushNotifications = async () => {
    try {
      // Request permission
      const permission = await PushNotifications.requestPermissions();
      
      if (permission.receive === 'granted') {
        // Register with APNs/FCM
        await PushNotifications.register();

        // Listen for registration success
        PushNotifications.addListener('registration', async (token: Token) => {
          console.log('Push registration success, token:', token.value);
          setPushToken(token.value);
          
          // Send token to backend
          await registerPushToken(token.value);
          setIsRegistered(true);
        });

        // Listen for registration errors
        PushNotifications.addListener('registrationError', (error: any) => {
          console.error('Push registration error:', error);
          setError(error.error);
        });

        // Listen for push notifications received while app is in foreground
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push notification received:', notification);
          // You can show an in-app notification here
        });

        // Listen for push notification actions (user taps notification)
        PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
          console.log('Push notification action performed:', action);
          
          // Handle notification tap - navigate to appropriate screen
          const data = action.notification.data;
          if (data.type === 'message' && data.conversationId) {
            window.location.href = `/messages/${data.conversationId}`;
          } else if (data.type === 'friend_request' && data.senderId) {
            window.location.href = `/dancer/${data.senderId}`;
          } else if (data.type === 'profile_liked' && data.senderId) {
            window.location.href = `/dancer/${data.senderId}`;
          }
        });
      } else {
        setError('Push notification permission denied');
      }
    } catch (err: any) {
      console.error('Error initializing push notifications:', err);
      setError(err.message);
    }
  };

  const registerPushToken = async (token: string) => {
    try {
      const platform = Capacitor.getPlatform();
      
      const response = await fetch('/api/user/push-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          platform,
          deviceInfo: navigator.userAgent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to register push token');
      }

      console.log('✅ Push token registered successfully');
    } catch (error) {
      console.error('Error registering push token:', error);
      throw error;
    }
  };

  const unregisterPushToken = async () => {
    try {
      await fetch('/api/user/push-token', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: pushToken,
        }),
      });

      await PushNotifications.removeAllListeners();
      setIsRegistered(false);
      setPushToken(null);
    } catch (error) {
      console.error('Error unregistering push token:', error);
    }
  };

  return {
    pushToken,
    isRegistered,
    error,
    unregisterPushToken,
  };
}


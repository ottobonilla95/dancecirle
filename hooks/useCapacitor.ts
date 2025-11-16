"use client";

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { PushNotifications } from '@capacitor/push-notifications';

export interface CapacitorInfo {
  isNative: boolean;
  platform: 'ios' | 'android' | 'web';
  isIOS: boolean;
  isAndroid: boolean;
}

export function useCapacitor(): CapacitorInfo {
  const [info, setInfo] = useState<CapacitorInfo>({
    isNative: false,
    platform: 'web',
    isIOS: false,
    isAndroid: false,
  });

  useEffect(() => {
    const platform = Capacitor.getPlatform();
    const isNative = Capacitor.isNativePlatform();
    
    setInfo({
      isNative,
      platform: platform as any,
      isIOS: platform === 'ios',
      isAndroid: platform === 'android',
    });

    if (isNative) {
      initializeApp();
    }
  }, []);

  return info;
}

async function initializeApp() {
  try {
    // Configure status bar
    if (Capacitor.getPlatform() === 'ios') {
      await StatusBar.setStyle({ style: Style.Light });
    } else if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#6366f1' });
    }

    // Hide splash screen after a delay
    setTimeout(async () => {
      await SplashScreen.hide();
    }, 2000);

    // Listen to app state changes
    App.addListener('appStateChange', ({ isActive }) => {
      console.log('App state changed. Is active:', isActive);
    });

    // Handle deep links (for sharing, invites, etc.)
    App.addListener('appUrlOpen', (event) => {
      console.log('App opened with URL:', event.url);
      // You can handle deep links here
      // Example: dancecircle://profile/username
      const url = new URL(event.url);
      if (url.pathname) {
        window.location.href = url.pathname;
      }
    });

  } catch (error) {
    console.error('Error initializing Capacitor:', error);
  }
}

export { Capacitor, App, StatusBar, SplashScreen, PushNotifications };


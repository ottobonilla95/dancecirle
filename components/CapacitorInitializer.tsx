"use client";

import { useEffect } from 'react';
import { useCapacitor } from '@/hooks/useCapacitor';
import { usePushNotifications } from '@/hooks/usePushNotifications';

/**
 * Initializes Capacitor and push notifications
 * Only runs on native platforms (iOS/Android)
 */
export default function CapacitorInitializer(): null {
  const { isNative, platform } = useCapacitor();
  const { isRegistered, error } = usePushNotifications();

  useEffect(() => {
    if (isNative) {
      console.log(`🚀 DanceCircle running on ${platform}`);
      
      if (isRegistered) {
        console.log('✅ Push notifications registered');
      } else if (error) {
        console.warn('❌ Push notifications failed:', error);
      }
    }
  }, [isNative, platform, isRegistered, error]);

  // This component doesn't render anything
  return null;
}


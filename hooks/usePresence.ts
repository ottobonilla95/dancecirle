"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { ref, onValue, set, onDisconnect, serverTimestamp } from 'firebase/database';
import { database } from '@/libs/firebase';

export interface OnlineUser {
  userId: string;
  name: string;
  username?: string;
  lastChanged: number;
}

export function usePresence() {
  const { data: session } = useSession();
  const [activeUsers, setActiveUsers] = useState<number>(0);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    if (!session?.user?.id || !database) return;

    const userId = session.user.id;
    const userStatusRef = ref(database, `/status/${userId}`);
    const connectedRef = ref(database, '.info/connected');

    // Track connection status
    const unsubscribe = onValue(connectedRef, (snapshot) => {
      if (snapshot.val() === true) {
        // User is online
        set(userStatusRef, {
          state: 'online',
          lastChanged: serverTimestamp(),
          userId: userId,
          name: session.user.name || 'Anonymous',
          username: (session.user as any).username || null,
        });

        // Remove user from active list when they disconnect
        onDisconnect(userStatusRef).remove();
      }
    });

    return () => {
      // Cleanup: mark as offline when component unmounts
      set(userStatusRef, {
        state: 'offline',
        lastChanged: serverTimestamp(),
      });
      unsubscribe();
    };
  }, [session]);

  // Count active users and get their details (admin only will call this)
  useEffect(() => {
    if (!database) return;

    const statusRef = ref(database, 'status');
    const unsubscribe = onValue(statusRef, (snapshot) => {
      let count = 0;
      const users: OnlineUser[] = [];
      
      snapshot.forEach((childSnapshot) => {
        const status = childSnapshot.val();
        if (status?.state === 'online') {
          count++;
          users.push({
            userId: status.userId || childSnapshot.key || 'unknown',
            name: status.name || 'Anonymous',
            username: status.username || undefined,
            lastChanged: status.lastChanged || Date.now(),
          });
        }
      });
      
      // Sort by name
      users.sort((a, b) => a.name.localeCompare(b.name));
      
      setActiveUsers(count);
      setOnlineUsers(users);
    });

    return () => unsubscribe();
  }, []);

  return { activeUsers, onlineUsers };
}


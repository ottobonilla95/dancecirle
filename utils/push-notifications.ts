/**
 * Push Notification Utilities (OPTIMIZED VERSION)
 * 
 * Improvements over original:
 * - Access token caching (1 hour cache)
 * - Request timeouts (10 seconds)
 * - Input validation
 * - Badge count support
 * - Batching for large token lists
 * - Better error messages
 * - Removed dead code
 */

import connectMongo from "@/libs/mongoose";
import User from "@/models/User";
import Notification from "@/models/Notification";

interface PushNotificationData {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  badge?: number; // Allow passing badge count
}

// Cache Firebase access token (valid for 1 hour)
let cachedAccessToken: string | null = null;
let tokenExpiresAt: number = 0;

// Constants
const MAX_TITLE_LENGTH = 100;
const MAX_BODY_LENGTH = 500;
const BATCH_SIZE = 100; // Send max 100 at a time
const REQUEST_TIMEOUT = 10000; // 10 seconds

/**
 * Send push notification to a user by their ID
 * @param userId - User ID
 * @param notification - Notification data
 * @param unreadCount - Optional unread count for badge
 */
export async function sendPushToUser(
  userId: string,
  notification: PushNotificationData,
  unreadCount?: number
): Promise<{ success: boolean; sentCount: number; failedTokens: string[] }> {
  try {
    await connectMongo();

    // Get user's push tokens
    const user = await User.findById(userId).select('pushTokens notificationSettings');

    if (!user || !user.pushTokens || user.pushTokens.length === 0) {
      console.log(`No push tokens found for user ${userId}`);
      return { success: false, sentCount: 0, failedTokens: [] };
    }

    // Check if user has push notifications enabled
    if (user.notificationSettings?.pushNotifications === false) {
      console.log(`Push notifications disabled for user ${userId}`);
      return { success: false, sentCount: 0, failedTokens: [] };
    }

    // Get unread notification count for badge (if not provided)
    let badge = unreadCount;
    if (badge === undefined) {
      badge = await Notification.countDocuments({
        recipient: userId,
        isRead: false,
      });
    }

    const tokens = user.pushTokens.map((t: any) => t.token);

    // Send to all tokens with badge count
    const result = await sendPushToTokens(tokens, {
      ...notification,
      badge,
    });

    // Clean up invalid tokens
    if (result.failedTokens.length > 0) {
      await cleanupInvalidTokens(userId, result.failedTokens);
    }

    return result;
  } catch (error) {
    console.error('Error sending push to user:', error);
    return { success: false, sentCount: 0, failedTokens: [] };
  }
}

/**
 * Send push notification to multiple tokens (with batching)
 */
export async function sendPushToTokens(
  tokens: string[],
  notification: PushNotificationData
): Promise<{ success: boolean; sentCount: number; failedTokens: string[] }> {
  try {
    // Validate Firebase configuration
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
      console.warn('Firebase not configured. Skipping push notifications.');
      return { success: false, sentCount: 0, failedTokens: [] };
    }

    // Validate notification content
    const validationError = validateNotification(notification);
    if (validationError) {
      console.error('Invalid notification:', validationError);
      return { success: false, sentCount: 0, failedTokens: tokens };
    }

    // Get access token (cached for 1 hour)
    const accessToken = await getFirebaseAccessToken();

    if (!accessToken) {
      console.error('Failed to get Firebase access token');
      return { success: false, sentCount: 0, failedTokens: [] };
    }

    // Batch tokens if there are many
    const batches = chunkArray(tokens, BATCH_SIZE);
    const allResults: PromiseSettledResult<void>[] = [];
    
    for (const batch of batches) {
      const batchResults = await Promise.allSettled(
        batch.map(token => sendToSingleToken(token, notification, accessToken))
      );
      allResults.push(...batchResults);
    }

    const sentCount = allResults.filter(r => r.status === 'fulfilled').length;
    const failedTokens = allResults
      .map((r, i) => r.status === 'rejected' ? tokens[i] : null)
      .filter(t => t !== null) as string[];

    console.log(`✅ Sent ${sentCount}/${tokens.length} push notifications`);

    return {
      success: sentCount > 0,
      sentCount,
      failedTokens,
    };
  } catch (error) {
    console.error('Error sending push notifications:', error);
    return { success: false, sentCount: 0, failedTokens: tokens };
  }
}

/**
 * Send push notification to a single token (with timeout)
 */
async function sendToSingleToken(
  token: string,
  notification: PushNotificationData,
  accessToken: string
): Promise<void> {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

  const message = {
    message: {
      token,
      notification: {
        title: notification.title,
        body: notification.body,
        ...(notification.imageUrl && { image: notification.imageUrl }),
      },
      data: notification.data || {},
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: notification.badge || 0,
            alert: {
              title: notification.title,
              body: notification.body,
            },
          },
        },
      },
      android: {
        priority: 'high' as const,
        notification: {
          sound: 'default',
          priority: 'max' as const,
          notificationCount: notification.badge || 0,
        },
      },
    },
  };

  // Add timeout to fetch
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`FCM Error (${response.status}): ${error}`);
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Get Firebase access token with caching (1 hour cache)
 */
async function getFirebaseAccessToken(): Promise<string | null> {
  try {
    // Return cached token if still valid
    const now = Date.now();
    if (cachedAccessToken && tokenExpiresAt > now) {
      return cachedAccessToken;
    }

    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (!privateKey || !clientEmail) {
      return null;
    }

    // Create JWT
    const jwt = await createJWT(privateKey, clientEmail);

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get access token: ${error}`);
    }

    const data = await response.json();
    
    // Cache token for 55 minutes (5 min buffer before 1 hour expiry)
    cachedAccessToken = data.access_token;
    tokenExpiresAt = now + (55 * 60 * 1000);

    return cachedAccessToken;
  } catch (error) {
    console.error('Error getting Firebase access token:', error);
    // Clear cache on error
    cachedAccessToken = null;
    tokenExpiresAt = 0;
    return null;
  }
}

/**
 * Create JWT for Firebase authentication
 */
async function createJWT(privateKey: string, clientEmail: string): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  // Use Node.js crypto for signing
  const crypto = await import('crypto');
  const signature = crypto.sign('RSA-SHA256', Buffer.from(signatureInput), {
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_PADDING,
  });

  return `${signatureInput}.${signature.toString('base64url')}`;
}

/**
 * Remove invalid tokens from user's account
 * Note: connectMongo() assumed to be called by parent function
 */
async function cleanupInvalidTokens(userId: string, invalidTokens: string[]): Promise<void> {
  try {
    await User.findByIdAndUpdate(
      userId,
      {
        $pull: {
          pushTokens: { token: { $in: invalidTokens } },
        },
      }
    );

    console.log(`🧹 Cleaned up ${invalidTokens.length} invalid tokens for user ${userId}`);
  } catch (error) {
    console.error('Error cleaning up invalid tokens:', error);
  }
}

/**
 * Validate notification content
 */
function validateNotification(notification: PushNotificationData): string | null {
  if (!notification.title || notification.title.trim().length === 0) {
    return 'Title is required';
  }

  if (!notification.body || notification.body.trim().length === 0) {
    return 'Body is required';
  }

  if (notification.title.length > MAX_TITLE_LENGTH) {
    return `Title too long (max ${MAX_TITLE_LENGTH} chars)`;
  }

  if (notification.body.length > MAX_BODY_LENGTH) {
    return `Body too long (max ${MAX_BODY_LENGTH} chars)`;
  }

  if (notification.badge !== undefined && notification.badge < 0) {
    return 'Badge count cannot be negative';
  }

  return null;
}

/**
 * Split array into chunks
 */
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Helper: Create notification payload for different event types
 */
export function createNotificationPayload(
  type: 'friend_request' | 'friend_accepted' | 'message' | 'profile_liked' | 'new_follower',
  senderName: string,
  additionalData?: Record<string, string>
): PushNotificationData {
  const templates = {
    friend_request: {
      title: '🤝 New Friend Request',
      body: `${senderName} sent you a friend request`,
    },
    friend_accepted: {
      title: '✅ Friend Request Accepted',
      body: `${senderName} accepted your friend request`,
    },
    message: {
      title: `💬 ${senderName}`,
      body: 'Sent you a message',
    },
    profile_liked: {
      title: '❤️ New Like',
      body: `${senderName} liked your profile`,
    },
    new_follower: {
      title: '👋 New Follower',
      body: `${senderName} started following you`,
    },
  };

  const template = templates[type];

  return {
    title: template.title,
    body: template.body,
    data: {
      type,
      ...additionalData,
    },
  };
}


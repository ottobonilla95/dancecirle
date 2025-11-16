import connectMongo from "@/libs/mongoose";
import Notification from "@/models/Notification";
import User from "@/models/User";
import { sendPushToUser, createNotificationPayload } from "./push-notifications";

/**
 * Send notifications to a user's followers (ONLY for new music releases)
 * @param userId - The ID of the producer whose followers should be notified
 * @param data - Additional data for the notification (songTitle, songUrl, etc.)
 */
export async function notifyFollowers(
  userId: string,
  data: any = {}
) {
  try {
    await connectMongo();

    // Get the user's followers
    const user = await User.findById(userId).select("followers").lean() as any;
    
    if (!user || !user.followers || user.followers.length === 0) {
      console.log(`No followers to notify for user ${userId}`);
      return { success: true, notificationsSent: 0 };
    }

    // Create notifications for all followers
    const notifications = user.followers.map((followerId: any) => ({
      recipient: followerId,
      type: "new_music", // Always new_music for follower notifications
      sender: userId,
      data,
      isRead: false,
    }));

    // Bulk insert notifications
    const result = await Notification.insertMany(notifications);

    console.log(`✅ Sent ${result.length} notifications to followers of user ${userId}`);

    return {
      success: true,
      notificationsSent: result.length,
    };
  } catch (error) {
    console.error("Error notifying followers:", error);
    return {
      success: false,
      error: "Failed to notify followers",
    };
  }
}

/**
 * Send a notification to a single user
 * @param recipientId - The ID of the user who should receive the notification
 * @param type - The type of notification
 * @param senderId - The ID of the user who triggered the notification (optional)
 * @param data - Additional data for the notification
 */
export async function notifyUser(
  recipientId: string,
  type: "new_music" | "new_follower" | "profile_liked" | "friend_request" | "friend_accepted",
  senderId?: string,
  data: any = {}
) {
  try {
    await connectMongo();

    // 1. Create in-app notification
    const notification = await Notification.create({
      recipient: recipientId,
      type,
      sender: senderId || null,
      data,
      isRead: false,
    });

    console.log(`✅ Sent in-app notification to user ${recipientId}`);

    // 2. Send push notification (if user has app installed)
    if (senderId && ['friend_request', 'friend_accepted', 'profile_liked', 'new_follower'].includes(type)) {
      try {
        // Get sender's name for push notification
        const sender = await User.findById(senderId).select('name username').lean() as any;
        const senderName = sender?.name || sender?.username || 'Someone';

        // Create push notification payload
        const pushPayload = createNotificationPayload(
          type as any,
          senderName,
          {
            senderId: senderId,
            ...data,
          }
        );

        // Send push notification
        await sendPushToUser(recipientId, pushPayload);
        console.log(`📱 Sent push notification to user ${recipientId}`);
      } catch (pushError) {
        // Don't fail the whole operation if push fails
        console.error('Error sending push notification:', pushError);
      }
    }

    return {
      success: true,
      notification,
    };
  } catch (error) {
    console.error("Error notifying user:", error);
    return {
      success: false,
      error: "Failed to notify user",
    };
  }
}

/**
 * Helper: Notify followers AND friends when producer posts new music
 * @param producerId - The ID of the producer
 * @param songTitle - The title of the song
 * @param actionUrl - The URL to navigate to when clicking the notification (e.g., /release/[id])
 */
export async function notifyNewMusic(
  producerId: string,
  songTitle: string,
  actionUrl: string
) {
  try {
    await connectMongo();

    // Get the user's followers AND friends
    const user = await User.findById(producerId).select("followers friends").lean() as any;
    
    if (!user) {
      console.log(`User ${producerId} not found`);
      return { success: false, notificationsSent: 0 };
    }

    // Combine followers and friends, remove duplicates
    const followers = user.followers || [];
    const friends = user.friends || [];
    const allRecipients = Array.from(new Set([
      ...followers.map((f: any) => f.toString()),
      ...friends.map((f: any) => f.toString()),
    ]));

    if (allRecipients.length === 0) {
      console.log(`No followers or friends to notify for user ${producerId}`);
      return { success: true, notificationsSent: 0 };
    }

    // Create notifications for all recipients (followers + friends)
    const notifications = allRecipients.map((recipientId: string) => ({
      recipient: recipientId,
      type: "new_music",
      sender: producerId,
      data: {
        songTitle,
        actionUrl, // Generic action URL for navigation
      },
      isRead: false,
    }));

    // Bulk insert notifications
    const result = await Notification.insertMany(notifications);

    console.log(`✅ Sent ${result.length} notifications (followers + friends) for user ${producerId}`);

    return {
      success: true,
      notificationsSent: result.length,
    };
  } catch (error) {
    console.error("Error notifying followers and friends:", error);
    return {
      success: false,
      error: "Failed to notify followers and friends",
    };
  }
}

/**
 * Helper: Notify user when someone follows them
 * @param userId - The ID of the user being followed
 * @param followerId - The ID of the follower
 * @param actionUrl - Optional URL to navigate to (defaults to follower's profile)
 */
export async function notifyNewFollower(userId: string, followerId: string, actionUrl?: string) {
  return notifyUser(userId, "new_follower", followerId, { actionUrl });
}

/**
 * Helper: Notify user when someone likes their profile
 * @param userId - The ID of the user whose profile was liked
 * @param likerId - The ID of the user who liked
 * @param actionUrl - Optional URL to navigate to (defaults to liker's profile)
 */
export async function notifyProfileLiked(userId: string, likerId: string, actionUrl?: string) {
  return notifyUser(userId, "profile_liked", likerId, { actionUrl });
}

/**
 * Helper: Notify user when someone sends a friend request
 * @param userId - The ID of the user receiving the friend request
 * @param requesterId - The ID of the user sending the request
 * @param actionUrl - Optional URL to navigate to (defaults to /friends)
 */
export async function notifyFriendRequest(userId: string, requesterId: string, actionUrl?: string) {
  return notifyUser(userId, "friend_request", requesterId, { actionUrl });
}

/**
 * Helper: Notify user when friend request is accepted
 * @param userId - The ID of the user whose request was accepted
 * @param accepterId - The ID of the user who accepted
 * @param actionUrl - Optional URL to navigate to (defaults to accepter's profile)
 */
export async function notifyFriendAccepted(userId: string, accepterId: string, actionUrl?: string) {
  return notifyUser(userId, "friend_accepted", accepterId, { actionUrl });
}


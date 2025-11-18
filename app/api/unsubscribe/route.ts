import { NextRequest, NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";

/**
 * Unsubscribe from email notifications
 * Supports both GET (one-click unsubscribe) and POST methods
 * Can unsubscribe from specific notification types or all emails
 */
export async function GET(req: NextRequest) {
  return handleUnsubscribe(req);
}

export async function POST(req: NextRequest) {
  return handleUnsubscribe(req);
}

async function handleUnsubscribe(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const type = searchParams.get("type"); // 'all', 'friendRequest', 'profileLiked', 'message', 'weeklyDigest'
    const token = searchParams.get("token"); // Optional: for security, verify it's a valid token

    if (!userId) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    await connectMongo();

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // TODO: Verify token if you implement token-based unsubscribe
    // This prevents malicious unsubscribe requests

    // Update notification settings based on type
    switch (type) {
      case "friendRequest":
        user.notificationSettings.friendRequestNotifications = false;
        break;
      case "profileLiked":
        user.notificationSettings.profileLikedNotifications = false;
        break;
      case "message":
        user.notificationSettings.messageNotifications = false;
        break;
      case "weeklyDigest":
        user.notificationSettings.weeklyDigest = false;
        break;
      case "all":
      default:
        // Unsubscribe from all email notifications
        user.notificationSettings.emailNotifications = false;
        user.notificationSettings.friendRequestNotifications = false;
        user.notificationSettings.profileLikedNotifications = false;
        user.notificationSettings.messageNotifications = false;
        user.notificationSettings.weeklyDigest = false;
        break;
    }

    await user.save();

    // Redirect to a confirmation page
    return NextResponse.redirect(
      new URL(`/unsubscribe-success?type=${type || 'all'}`, req.url)
    );
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return NextResponse.redirect(new URL("/", req.url));
  }
}


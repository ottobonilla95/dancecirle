import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";
import { sendEmail } from "@/libs/resend";
import { profileLikedEmail } from "@/libs/email-templates";
import { notifyProfileLiked } from "@/utils/notifications";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    await connectMongo();

    const { targetUserId } = await req.json();

    if (!targetUserId) {
      return NextResponse.json(
        { error: "Target user ID is required" },
        { status: 400 }
      );
    }

    // Can't like yourself
    if (session.user.id === targetUserId) {
      return NextResponse.json(
        { error: "Cannot like your own profile" },
        { status: 400 }
      );
    }

    const currentUserId = session.user.id;

    // Get current user data for email
    const currentUser = await User.findById(currentUserId);

    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if already liked (convert ObjectIds to strings once for performance)
    const likedByIds = targetUser.likedBy.map((id: any) => id.toString());
    const isAlreadyLiked = likedByIds.includes(currentUserId);

    if (isAlreadyLiked) {
      // Unlike - remove from likedBy array
      const updatedUser = await User.findByIdAndUpdate(
        targetUserId, 
        { $pull: { likedBy: currentUserId } },
        { new: true }
      );

      return NextResponse.json({
        success: true,
        action: "unliked",
        likesCount: updatedUser.likedBy.length
      });
    } else {
      // Like - add to likedBy array
      const updatedUser = await User.findByIdAndUpdate(
        targetUserId,
        { $addToSet: { likedBy: currentUserId } },
        { new: true }
      );

      // Send in-app notification
      await notifyProfileLiked(targetUserId, currentUserId, `/${currentUser.username || currentUserId}`);

      // Send email notification (non-blocking) - Check notification settings
      if (
        targetUser.email &&
        targetUser.notificationSettings?.emailNotifications !== false &&
        targetUser.notificationSettings?.profileLikedNotifications !== false
      ) {
        const emailTemplate = profileLikedEmail(
          { name: currentUser.name, username: currentUser.username, image: currentUser.image, _id: currentUserId },
          { name: targetUser.name, email: targetUser.email, _id: targetUserId },
          targetUser.preferredLanguage || 'en'
        );
        sendEmail({
          to: targetUser.email,
          ...emailTemplate,
        }).catch(err => console.error('Failed to send profile like email:', err));
      }

      return NextResponse.json({
        success: true,
        action: "liked",
        likesCount: updatedUser.likedBy.length
      });
    }

  } catch (error) {
    console.error("Like API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";
import { revalidateTag } from "next/cache";

export const dynamic = 'force-dynamic';

// PATCH /api/admin/users/[userId]/update - Admin edits user profile
export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  try {
    await connectMongo();

    // Check if user is admin
    const config = await import("@/config");
    const isAdmin = session.user.email === config.default.admin.email;

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized - admin only" },
        { status: 403 }
      );
    }

    const { userId } = params;
    const body = await req.json();

    // Allowed fields for admin edits
    const allowedUpdates = [
      'bio',
      'image',
      'anthem',
      'socialMedia',
      'danceStyles',
      'danceRole',
      'relationshipStatus',
      'dancingStartYear',
      'citiesVisited',
      'jackAndJillCompetitions',
      'openToMeetTravelers',
      'lookingForPracticePartners',
    ];

    const updateData: any = {};

    // Filter only allowed fields from the request
    Object.keys(body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updateData[key] = body[key];
      }
    });

    // If no valid updates, return error
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Apply updates
    Object.keys(updateData).forEach(key => {
      user[key] = updateData[key];
    });

    // Invalidate cache if anthem updated
    if (updateData.anthem) {
      revalidateTag("trending-songs");
    }

    await user.save();

    // Note: NO auto-posts for admin edits
    // Admins editing user profiles shouldn't trigger activity posts

    return NextResponse.json({
      success: true,
      message: "User profile updated successfully",
      user: user.toObject(),
    });
  } catch (error: any) {
    console.error("Error updating user profile (admin):", error);
    return NextResponse.json(
      { error: error.message || "Failed to update user" },
      { status: 500 }
    );
  }
}


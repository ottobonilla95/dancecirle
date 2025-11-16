import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";

export const dynamic = "force-dynamic";

/**
 * POST /api/user/push-token
 * Register a push notification token for the authenticated user
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { token, platform, deviceInfo } = await req.json();

    if (!token || !platform) {
      return NextResponse.json(
        { error: "Token and platform are required" },
        { status: 400 }
      );
    }

    if (!['ios', 'android', 'web'].includes(platform)) {
      return NextResponse.json(
        { error: "Invalid platform" },
        { status: 400 }
      );
    }

    await connectMongo();

    // Find user
    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if token already exists
    const existingTokenIndex = user.pushTokens?.findIndex(
      (t: any) => t.token === token
    );

    if (existingTokenIndex !== undefined && existingTokenIndex >= 0) {
      // Update existing token's lastUsed
      user.pushTokens[existingTokenIndex].lastUsed = new Date();
      if (deviceInfo) {
        user.pushTokens[existingTokenIndex].deviceInfo = deviceInfo;
      }
    } else {
      // Add new token
      if (!user.pushTokens) {
        user.pushTokens = [];
      }
      user.pushTokens.push({
        token,
        platform,
        deviceInfo: deviceInfo || undefined,
        createdAt: new Date(),
        lastUsed: new Date(),
      });
    }

    await user.save();

    console.log(`✅ Push token registered for user ${user.name} (${platform})`);

    return NextResponse.json({
      success: true,
      message: "Push token registered successfully",
    });
  } catch (error) {
    console.error("Error registering push token:", error);
    return NextResponse.json(
      { error: "Failed to register push token" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/push-token
 * Remove a push notification token
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    await connectMongo();

    // Remove the token from user's pushTokens array
    const user = await User.findByIdAndUpdate(
      session.user.id,
      {
        $pull: {
          pushTokens: { token },
        },
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    console.log(`✅ Push token removed for user ${user.name}`);

    return NextResponse.json({
      success: true,
      message: "Push token removed successfully",
    });
  } catch (error) {
    console.error("Error removing push token:", error);
    return NextResponse.json(
      { error: "Failed to remove push token" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user/push-token
 * Get all push tokens for the authenticated user (for debugging)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectMongo();

    const user = await User.findById(session.user.id).select('pushTokens');

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      pushTokens: user.pushTokens || [],
    });
  } catch (error) {
    console.error("Error fetching push tokens:", error);
    return NextResponse.json(
      { error: "Failed to fetch push tokens" },
      { status: 500 }
    );
  }
}


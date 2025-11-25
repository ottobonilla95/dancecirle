import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";
import Message from "@/models/Message";
import config from "@/config";

export const dynamic = 'force-dynamic';

// GET: Fetch all messages for a specific conversation
export async function GET(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is admin
    if (!session?.user?.email || session.user.email !== config.admin.email) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    await connectMongo();

    const { conversationId } = params;

    // Fetch all messages for this conversation
    const messages = await Message.find({ conversationId })
      .populate({
        path: "senderId",
        select: "name username image",
      })
      .sort({ createdAt: 1 }) // Oldest first for chronological order
      .lean();

    return NextResponse.json({
      messages,
    });
  } catch (error: any) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch messages" },
      { status: 500 }
    );
  }
}


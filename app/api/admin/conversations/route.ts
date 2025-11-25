import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";
import Conversation from "@/models/Conversation";
import config from "@/config";

export const dynamic = 'force-dynamic';

// GET: Fetch all conversations with pagination and search
export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") || "";

    // Build search query
    const query: any = {};

    // If searching, we'll filter after populating to search user names
    const conversations = await Conversation.find(query)
      .populate({
        path: "participants",
        select: "name username image email",
      })
      .populate({
        path: "lastMessageBy",
        select: "name username",
      })
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Apply search filter on populated data
    let filteredConversations = conversations;
    if (search) {
      filteredConversations = conversations.filter((conv: any) => {
        const participantNames = conv.participants
          .map((p: any) => p.name?.toLowerCase() + " " + (p.username?.toLowerCase() || "") + " " + (p.email?.toLowerCase() || ""))
          .join(" ");
        return participantNames.includes(search.toLowerCase());
      });
    }

    const total = search 
      ? filteredConversations.length 
      : await Conversation.countDocuments(query);

    return NextResponse.json({
      conversations: filteredConversations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}


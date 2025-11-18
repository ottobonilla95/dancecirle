import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";
import Post from "@/models/Post";
import { createNotification } from "@/utils/notifications";

export const dynamic = 'force-dynamic';

// POST /api/posts/[postId]/like - Toggle like on a post
export async function POST(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongo();

    const { postId } = params;
    const userId = session.user.id;

    const post = await Post.findById(postId).populate("author", "_id");
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Toggle like
    const likeIndex = post.likes.indexOf(userId);
    const isLiking = likeIndex === -1; // true if adding like, false if removing
    
    if (likeIndex > -1) {
      // Unlike
      post.likes.splice(likeIndex, 1);
    } else {
      // Like
      post.likes.push(userId);
    }

    await post.save();

    // Create notification only when LIKING (not unliking) and not liking own post
    if (isLiking && post.author._id.toString() !== userId) {
      try {
        await createNotification({
          recipientId: post.author._id.toString(),
          senderId: userId,
          type: "like",
          message: `liked your post`,
          relatedId: postId,
        });
      } catch (error) {
        console.error("Error creating like notification:", error);
        // Don't fail the request if notification fails
      }
    }

    return NextResponse.json({
      liked: isLiking,
      likesCount: post.likes.length,
    });
  } catch (error) {
    console.error("Error toggling like:", error);
    return NextResponse.json(
      { error: "Failed to toggle like" },
      { status: 500 }
    );
  }
}


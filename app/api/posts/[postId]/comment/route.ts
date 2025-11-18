import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";
import Post from "@/models/Post";
import { createNotification } from "@/utils/notifications";

export const dynamic = 'force-dynamic';

// POST /api/posts/[postId]/comment - Add a comment to a post
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
    const { text } = await req.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "Comment text required" }, { status: 400 });
    }

    if (text.length > 500) {
      return NextResponse.json(
        { error: "Comment too long (max 500 characters)" },
        { status: 400 }
      );
    }

    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Get list of users who have already commented (before adding new comment)
    const previousCommenters = new Set<string>(
      post.comments.map((c: any) => c.author.toString())
    );

    // Add comment
    post.comments.push({
      author: session.user.id,
      text: text.trim(),
      createdAt: new Date(),
    });

    await post.save();

    // Populate author info for the new comment
    await post.populate("comments.author", "name username image");
    await post.populate("author", "name");

    const userId = session.user.id;

    // Notify everyone involved in this post thread (except yourself)
    try {
      const usersToNotify = new Set<string>();

      // 1. Notify post author (if not yourself)
      if (post.author._id.toString() !== userId) {
        usersToNotify.add(post.author._id.toString());
      }

      // 2. Notify all previous commenters (except yourself)
      previousCommenters.forEach((commenterId) => {
        if (commenterId !== userId) {
          usersToNotify.add(commenterId);
        }
      });

      // Get post type context for notification
      let postContext = "a post";
      switch (post.type) {
        case "going_out":
          postContext = `a "Going Out" post`;
          break;
        case "trip_added":
          postContext = `a trip to ${post.content?.destination || "a city"}`;
          break;
        case "new_song":
          postContext = "a new song post";
          break;
        case "new_dance_style":
          postContext = `a new dance style post`;
          break;
        case "jack_and_jill":
          postContext = "a J&J competition post";
          break;
        case "new_music":
          postContext = "a music release";
          break;
        case "just_joined":
          postContext = "a welcome post";
          break;
        case "just_moved":
          postContext = `a move to ${post.content?.city || "a new city"}`;
          break;
        default:
          postContext = "a post";
      }

      // Send notifications to all unique users
      await Promise.all(
        Array.from(usersToNotify).map((recipientId) =>
          createNotification({
            recipientId,
            senderId: userId,
            type: "comment",
            message: `commented on ${postContext}`,
            relatedId: postId,
          })
        )
      );
    } catch (error) {
      console.error("Error creating notifications:", error);
      // Don't fail the request if notification fails
    }

    // Return the new comment
    const newComment = post.comments[post.comments.length - 1];

    return NextResponse.json({ comment: newComment }, { status: 201 });
  } catch (error) {
    console.error("Error adding comment:", error);
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 }
    );
  }
}

// GET /api/posts/[postId]/comment - Get comments for a post
export async function GET(
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

    const post = await Post.findById(postId)
      .select("comments")
      .populate("comments.author", "name username image");

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ comments: post.comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}


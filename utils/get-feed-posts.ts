import connectMongo from "@/libs/mongoose";
import Post from "@/models/Post";
import User from "@/models/User";

/**
 * Server-side function to fetch feed posts for a user
 */
export async function getFeedPosts(
  userId: string,
  options: {
    limit?: number;
  } = {}
) {
  try {
    await connectMongo();

    const { limit = 20 } = options;

    const user = await User.findById(userId).select("city friends following").populate("city", "name");
    if (!user) {
      return [];
    }

    const cityName = (user.city as any)?.name;
    let query: any = {};

    // Smart feed:
    // - "going_out" posts: from ANYONE in user's city (find dance partners!)
    // - Other posts: from FRIENDS + FOLLOWING + YOUR OWN POSTS (so you can see comments and releases from producers you follow!)
    if (cityName) {
      // Combine friends and following into one array for the query
      const friendsAndFollowing = [
        ...(user.friends || []),
        ...(user.following || [])
      ];
      
      query = {
        $or: [
          // All "going out" posts in user's city
          { type: "going_out", city: cityName },
          // Other post types from friends and following
          { 
            type: { $ne: "going_out" }, 
            author: { $in: friendsAndFollowing } 
          },
          // YOUR OWN posts (so you can see comments on them!)
          {
            type: { $ne: "going_out" },
            author: userId
          }
        ],
      };
    } else {
      // If no city, show friends' and following posts + your own
      const friendsAndFollowing = [
        ...(user.friends || []),
        ...(user.following || [])
      ];
      
      query = { 
        $or: [
          { author: { $in: friendsAndFollowing } },
          { author: userId }
        ]
      };
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("author", "name username image city isFeaturedProfessional")
      .populate("comments.author", "name username image")
      .lean();

    // Add like status for current user and counts
    const postsWithMetadata = posts.map((post: any) => ({
      ...post,
      _id: post._id.toString(),
      author: {
        ...post.author,
        _id: post.author._id.toString(),
      },
      isLikedByCurrentUser: post.likes?.some(
        (likeUserId: any) => likeUserId.toString() === userId
      ),
      likesCount: post.likes?.length || 0,
      commentsCount: post.comments?.length || 0,
    }));

    return postsWithMetadata;
  } catch (error) {
    console.error("Error fetching feed posts:", error);
    return [];
  }
}


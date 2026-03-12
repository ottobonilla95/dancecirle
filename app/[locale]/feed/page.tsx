import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { redirect } from "next/navigation";
import { getFeedPosts } from "@/utils/get-feed-posts";
import FeedClient from "@/components/FeedClient";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  // Fetch initial posts on server
  const initialPosts = await getFeedPosts(session.user.id, { limit: 20 });

  return <FeedClient initialPosts={initialPosts} />;
}


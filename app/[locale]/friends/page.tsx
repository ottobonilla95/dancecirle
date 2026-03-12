import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { redirect } from "next/navigation";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";
import FriendsContent from "./FriendsContent";
import FriendsMap from "@/components/FriendsMap";
import { getMessages, getTranslation } from "@/lib/i18n";

export default async function FriendsPage({ params }: { params: { locale: string } }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin");
  }

  // Get translations
  const messages = await getMessages();
  const t = (key: string) => getTranslation(messages, key);

  await connectMongo();

  // Fetch user data with all social connections
  let user;
  try {
    user = await User.findById(session.user.id)
      .populate({
        path: "friends",
        select: "name image username city",
        populate: {
          path: "city",
          select: "name coordinates"
        }
      })
      .populate({
        path: "friendRequestsReceived.user",
        select: "name image username city",
        populate: {
          path: "city",
          select: "name"
        }
      })
      .populate({
        path: "friendRequestsSent.user", 
        select: "name image username city",
        populate: {
          path: "city",
          select: "name"
        }
      })
      .populate("likedBy", "name image username")
      .lean();
  } catch (error) {
    console.error("Population error:", error);
    // Fallback: get user without population
    user = await User.findById(session.user.id).lean();
  }

  if (!user) {
    redirect(`/${params.locale}/dashboard`);
  }

  // Convert to plain object for client component
  // Filter out any null/undefined users from arrays (e.g., deleted users)
  const userData = JSON.parse(JSON.stringify(user));
  if (userData.likedBy) {
    userData.likedBy = userData.likedBy.filter((user: any) => user && user._id);
  }
  if (userData.friends) {
    userData.friends = userData.friends.filter((friend: any) => friend && friend._id);
  }
  if (userData.friendRequestsReceived) {
    userData.friendRequestsReceived = userData.friendRequestsReceived.filter(
      (req: any) => req.user && req.user._id
    );
  }
  if (userData.friendRequestsSent) {
    userData.friendRequestsSent = userData.friendRequestsSent.filter(
      (req: any) => req.user && req.user._id
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      {/* Friends World Map - Full width on mobile - Always show */}
      <div className="mb-8 md:px-4">
        <div className="max-w-6xl md:mx-auto">
          <FriendsMap friends={userData.friends || []} />
        </div>
      </div>

      <div className="p-4">
        <div className="max-w-6xl mx-auto">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title">{t('friends.friends')}</div>
            <div className="stat-value text-primary">{userData.friends?.length || 0}</div>
            <div className="stat-desc">{t('friends.connectedDancers')}</div>
          </div>
          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title">{t('friends.pendingRequests')}</div>
            <div className="stat-value text-warning">{userData.friendRequestsReceived?.length || 0}</div>
            <div className="stat-desc">{t('friends.awaitingResponse')}</div>
          </div>
          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title">{t('friends.sentRequests')}</div>
            <div className="stat-value text-info">{userData.friendRequestsSent?.length || 0}</div>
            <div className="stat-desc">{t('friends.waitingForResponse')}</div>
          </div>
          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title">{t('friends.profileLikes')}</div>
            <div className="stat-value text-secondary">{userData.likedBy?.length || 0}</div>
            <div className="stat-desc">{t('friends.peopleWhoLikedYou')}</div>
          </div>
        </div>

          {/* Main Content */}
          <FriendsContent userData={userData} />
        </div>
      </div>
    </div>
  );
} 
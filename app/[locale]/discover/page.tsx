import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { redirect } from "next/navigation";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";
import City from "@/models/City";
import Country from "@/models/Country";
import DanceStyle from "@/models/DanceStyle";
import DiscoveryFeed from "@/components/DiscoveryFeed";
import { DanceStyle as DanceStyleType } from "@/types/dance-style";

export const dynamic = "force-dynamic";

async function getInitialDancers(currentUserId: string) {
  try {
    await connectMongo();

    // Get current user's city
    const currentUser = await User.findById(currentUserId).select("city");

    // Get local dancers for initial load (Near Me default)
    const users = await User.find({
      _id: { $ne: currentUserId },
      isProfileComplete: true,
      city: currentUser?.city,
    })
      .populate({
        path: "city",
        model: City,
        populate: {
          path: "country",
          model: Country,
          select: "name code",
        },
      })
      .select("-email -friendRequestsSent -friendRequestsReceived -friends")
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(16)
      .lean();

    // Get all dance styles for mapping
    const allDanceStyles = await DanceStyle.find({ isActive: true });
    const danceStyleMap = new Map(
      allDanceStyles.map((ds) => [ds._id.toString(), ds.name])
    );

    // Transform the data
    const transformedUsers = users.map((user: any) => {
      const danceStylesPopulated =
        user.danceStyles?.map((userStyle: any) => ({
          name: danceStyleMap.get(userStyle.danceStyle.toString()) || "Unknown",
          level: userStyle.level,
          _id: userStyle.danceStyle,
        })) || [];

      return {
        ...user,
        _id: user._id.toString(),
        city: user.city
          ? {
              ...user.city,
              _id: user.city._id.toString(),
              country: user.city.country
                ? {
                    ...user.city.country,
                    _id: user.city.country._id?.toString(),
                  }
                : null,
            }
          : null,
        danceStylesPopulated,
        likedBy: user.likedBy || [],
      };
    });

    return transformedUsers;
  } catch (error) {
    console.error("Error fetching initial dancers:", error);
    return [];
  }
}

async function getDanceStyles(): Promise<DanceStyleType[]> {
  try {
    await connectMongo();
    const styles = await DanceStyle.find({ isActive: true })
      .sort({ name: 1 })
      .lean();
    
    return styles.map((style: any) => ({
      ...style,
      _id: style._id.toString(),
    }));
  } catch (error) {
    console.error("Error fetching dance styles:", error);
    return [];
  }
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin");
  }

  const [initialDancers, danceStyles] = await Promise.all([
    getInitialDancers(session.user.id),
    getDanceStyles(),
  ]);

  // Parse filter from URL: 'nearMe', 'country', 'worldwide', 'pickCity', or 'pickCountry'
  const initialFilter = 
    searchParams.filter === 'country' ? 'country' :
    searchParams.filter === 'worldwide' ? 'worldwide' :
    searchParams.filter === 'pickCity' ? 'pickCity' :
    searchParams.filter === 'pickCountry' ? 'pickCountry' :
    'nearMe'; // Default

  return (
    <div className="min-h-screen bg-base-100 py-8">
      {/* Discovery Feed with Filters */}
      <DiscoveryFeed 
        initialDancers={initialDancers} 
        danceStyles={danceStyles}
        initialFilter={initialFilter as 'nearMe' | 'country' | 'worldwide' | 'pickCity' | 'pickCountry'}
      />
    </div>
  );
}


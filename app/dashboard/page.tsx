import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";
import City from "@/models/City";
import Country from "@/models/Country";
import Continent from "@/models/Continent";
import DanceStyle from "@/models/DanceStyle";
import { City as CityType } from "@/types";
import { DanceStyle as DanceStyleType } from "@/types/dance-style";
import DiscoveryFeed from "@/components/DiscoveryFeed";
import CityList from "@/components/organisims/CityList";
// import HotDanceStyles from "@/components/HotDanceStyles";
import StatsPreview from "@/components/StatsPreview";
import TrendyMusicPreview from "@/components/TrendyMusicPreview";
import FriendsTripsPreview from "@/components/FriendsTripsPreview";
// import TrendyCountries from "@/components/TrendyCountries";
import TripOverlaps from "@/components/TripOverlaps";
import YourCityPreview from "@/components/YourCityPreview";
import InviteFriendsBanner from "@/components/InviteFriendsBanner";
import InstallAppDashboardBanner from "@/components/InstallAppDashboardBanner";
import Link from "next/link";
import { getMessages, getTranslation } from "@/lib/i18n";
import { unstable_cache } from "next/cache";
import LeaderboardBadges from "@/components/LeaderboardBadges";
import { getUserLeaderboardBadges } from "@/utils/leaderboard-badges";
import ActivityFeed from "@/components/ActivityFeed";
import { getFeedPosts } from "@/utils/get-feed-posts";
import DashboardPostSection from "@/components/DashboardPostButton";

export const dynamic = "force-dynamic";

async function getInitialDancers(currentUserId: string) {
  try {
    await connectMongo();

    // Get current user's city
    const currentUser = await User.findById(currentUserId).select("city");

    // Simple: just get local dancers (since "Near Me" is default)
    const users = await User.find({
      _id: { $ne: currentUserId },
      isProfileComplete: true,
      city: currentUser?.city, // Only same city for initial load
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
      .limit(12)
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

// Cached: Dance styles rarely change
const getDanceStyles = unstable_cache(
  async (): Promise<DanceStyleType[]> => {
    try {
      await connectMongo();

      const danceStyles = await DanceStyle.find({ isActive: true })
        .sort({ name: 1 })
        .lean();

      const result = danceStyles.map((style: any) => ({
        ...style,
        _id: style._id.toString(),
        id: style._id.toString(),
      }));

      // Log warning if empty - but still cache it (will revalidate and fix itself)
      if (result.length === 0) {
        console.warn("⚠️ getDanceStyles returned empty - check database");
      }

      return result;
    } catch (error) {
      console.error("Error fetching dance styles:", error);
      return [];
    }
  },
  ["dance-styles"],
  { revalidate: 60, tags: ["dance-styles"] } // Reduced to 1 minute for safety
);

// Cached: Hot styles change when users update their profiles
// const getHotDanceStyles = unstable_cache(
//   async (): Promise<(DanceStyleType & { userCount: number })[]> => {
//     try {
//       await connectMongo();

//       // Aggregate to count users per dance style
//       const hotStyles = await User.aggregate([
//         // Only count users with complete profiles
//         { $match: { isProfileComplete: true } },
//         // Unwind the danceStyles array to get individual style documents
//         { $unwind: "$danceStyles" },
//         // Group by dance style and count users
//         {
//           $group: {
//             _id: "$danceStyles.danceStyle",
//             userCount: { $sum: 1 },
//           },
//         },
//         // Sort by user count (most popular first)
//         { $sort: { userCount: -1 } },
//         // Limit to top 4
//         { $limit: 4 },
//         // Lookup dance style details
//         {
//           $lookup: {
//             from: "dancestyles",
//             localField: "_id",
//             foreignField: "_id",
//             as: "styleDetails",
//           },
//         },
//         // Unwind style details
//         { $unwind: "$styleDetails" },
//         // Only include active styles
//         { $match: { "styleDetails.isActive": true } },
//         // Project final structure
//         {
//           $project: {
//             _id: "$styleDetails._id",
//             name: "$styleDetails.name",
//             category: "$styleDetails.category",
//             isActive: "$styleDetails.isActive",
//             userCount: 1,
//           },
//         },
//       ]);

//       const result = hotStyles.map((style: any) => ({
//         ...style,
//         _id: style._id.toString(),
//         id: style._id.toString(),
//       }));

//       if (result.length === 0) {
//         console.warn("⚠️ getHotDanceStyles returned empty - check database");
//       }

//       return result;
//     } catch (error) {
//       console.error("Error fetching hot dance styles:", error);
//       return [];
//     }
//   },
//   ["hot-dance-styles"],
//   { revalidate: 300, tags: ["hot-dance-styles"] } // Reduced to 5 minutes for safety
// );

// Cached: Community stats are expensive aggregations that change slowly
const getCommunityStats = unstable_cache(
  async () => {
    try {
      await connectMongo();

      // Get total dancers
      const totalDancers = await User.countDocuments({
        isProfileComplete: true,
      });

      // Get unique countries count
      const countries = await User.aggregate([
        { $match: { isProfileComplete: true, city: { $exists: true } } },
        {
          $lookup: {
            from: "cities",
            localField: "city",
            foreignField: "_id",
            as: "cityData",
          },
        },
        { $unwind: "$cityData" },
        {
          $lookup: {
            from: "countries",
            localField: "cityData.country",
            foreignField: "_id",
            as: "countryData",
          },
        },
        { $unwind: "$countryData" },
        { $group: { _id: "$countryData._id" } },
        { $count: "totalCountries" },
      ]);

      // Get unique cities count
      const cities = await User.aggregate([
        { $match: { isProfileComplete: true, city: { $exists: true } } },
        { $group: { _id: "$city" } },
        { $count: "totalCities" },
      ]);

      // Get top dance style
      const topStyle = await User.aggregate([
        { $match: { isProfileComplete: true } },
        { $unwind: "$danceStyles" },
        { $group: { _id: "$danceStyles.danceStyle", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
        {
          $lookup: {
            from: "dancestyles",
            localField: "_id",
            foreignField: "_id",
            as: "styleDetails",
          },
        },
        { $unwind: "$styleDetails" },
      ]);

      // Get leader/follower ratio - simplified query
      const roleStats = await User.aggregate([
        { $match: { isProfileComplete: true } },
        { $group: { _id: "$danceRole", count: { $sum: 1 } } },
      ]);

      // Process role stats with correct mapping
      const roleData = { leaders: 0, followers: 0, both: 0 };
      roleStats.forEach((role: any) => {
        console.log("Processing role:", role); // Debug each role
        if (role._id === "leader") {
          roleData.leaders = role.count;
        } else if (role._id === "follower") {
          roleData.followers = role.count;
        } else if (role._id === "both") {
          roleData.both = role.count;
        }
      });

      // Debug log
      console.log("Role stats debug:", {
        roleStats,
        roleData,
        totalUsers: totalDancers,
      });

      // Get category emoji for top style
      const getCategoryEmoji = (category: string) => {
        switch (category) {
          case "latin":
            return "🌶️";
          case "ballroom":
            return "👑";
          case "street":
            return "🏙️";
          case "contemporary":
            return "🎨";
          case "traditional":
            return "🏛️";
          default:
            return "💃";
        }
      };

      // Get country breakdown for map
      const countryBreakdown = await User.aggregate([
        { $match: { isProfileComplete: true, city: { $exists: true } } },
        {
          $lookup: {
            from: "cities",
            localField: "city",
            foreignField: "_id",
            as: "cityData",
          },
        },
        { $unwind: "$cityData" },
        {
          $lookup: {
            from: "countries",
            localField: "cityData.country",
            foreignField: "_id",
            as: "countryData",
          },
        },
        { $unwind: "$countryData" },
        {
          $group: {
            _id: "$countryData._id",
            name: { $first: "$countryData.name" },
            code: { $first: "$countryData.code" },
            dancerCount: { $sum: 1 },
          },
        },
        { $sort: { dancerCount: -1 } },
      ]);

      const stats = {
        totalDancers,
        totalCountries: countries[0]?.totalCountries || 0,
        totalCities: cities[0]?.totalCities || 0,
        topDanceStyle: {
          name: topStyle[0]?.styleDetails?.name || "Bachata",
          count: topStyle[0]?.count || 0,
          emoji: getCategoryEmoji(
            topStyle[0]?.styleDetails?.category || "latin"
          ),
        },
        leaderFollowerRatio: roleData,
        countryData: countryBreakdown,
      };

      if (stats.totalDancers === 0) {
        console.warn(
          "⚠️ getCommunityStats returned 0 dancers - check database"
        );
      }

      return stats;
    } catch (error) {
      console.error("Error fetching community stats:", error);
      return {
        totalDancers: 0,
        totalCountries: 0,
        totalCities: 0,
        topDanceStyle: { name: "Bachata", count: 0, emoji: "🌶️" },
        leaderFollowerRatio: { leaders: 0, followers: 0, both: 0 },
        countryData: [],
      };
    }
  },
  ["community-stats"],
  { revalidate: 120, tags: ["community-stats"] } // 2 minutes cache for safety
);

// Extract Spotify track ID from URL
function extractSpotifyTrackId(url: string): string | null {
  const match = url.match(/track\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

// Extract YouTube video ID from URL
function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

// Determine platform from URL
function detectPlatform(url: string): "spotify" | "youtube" | null {
  if (url.includes("spotify.com")) return "spotify";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  return null;
}

// Cached: Trending songs change when users update their anthems
const getTrendingSongs = unstable_cache(
  async () => {
    try {
      await connectMongo();

      // Get all users with anthem URLs
      const users = await User.find({
        "anthem.url": { $exists: true, $ne: "" },
      })
        .select("anthem name image username")
        .lean();

      // Count occurrences of each song by Spotify track ID (ignore YouTube)
      const songData: {
        [trackId: string]: { count: number; url: string; users: any[] };
      } = {};

      users.forEach((user: any) => {
        if (user.anthem?.url) {
          const platform = detectPlatform(user.anthem.url);

          // Only count Spotify songs
          if (platform === "spotify") {
            const trackId = extractSpotifyTrackId(user.anthem.url);
            if (trackId) {
              if (!songData[trackId]) {
                songData[trackId] = {
                  count: 0,
                  url: user.anthem.url,
                  users: [],
                };
              }
              songData[trackId].count += 1;
              songData[trackId].users.push({
                _id: user._id,
                name: user.name,
                image: user.image,
                username: user.username,
              });
            }
          }
        }
      });

      // Convert to array and sort by count
      const trendingSongs = Object.entries(songData)
        .map(([trackId, data]) => ({
          url: data.url,
          count: data.count,
          platform: "spotify" as const,
          spotifyTrackId: trackId,
          youtubeVideoId: null as string | null,
          users: data.users,
        }))
        .sort((a, b) => b.count - a.count);

      // Additional deduplication check by track ID (case-insensitive)
      const seenTrackIds = new Set<string>();
      const deduplicated = trendingSongs.filter((song) => {
        const normalizedId = song.spotifyTrackId.toLowerCase();
        if (seenTrackIds.has(normalizedId)) {
          return false;
        }
        seenTrackIds.add(normalizedId);
        return true;
      });

      const finalSongs = deduplicated.slice(0, 10); // Top 10

      if (finalSongs.length === 0) {
        console.warn(
          "⚠️ getTrendingSongs returned empty - users may not have anthems set"
        );
      }

      return finalSongs;
    } catch (error) {
      console.error("Error fetching trending songs:", error);
      return [];
    }
  },
  ["trending-songs"],
  { revalidate: 300, tags: ["trending-songs"] } // 5 minutes cache for safety
);

// Helper to check if two date ranges overlap
function datesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 <= end2 && start2 <= end1;
}

async function getTripOverlaps(userId: string) {
  try {
    await connectMongo();

    const now = new Date();
    // Set to start of today to include trips ending today
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    // Get current user with their trips, friends, and home city
    const user: any = await User.findById(userId)
      .select("trips friends city")
      .populate({
        path: "trips.city",
        model: City,
        select: "name image",
        populate: {
          path: "country",
          model: Country,
          select: "name",
        },
      })
      .populate({
        path: "city",
        model: City,
        select: "name image",
        populate: {
          path: "country",
          model: Country,
          select: "name",
        },
      })
      .lean();

    if (!user || !user.friends || user.friends.length === 0) {
      return [];
    }

    // Get friends with their trips (only upcoming trips - including trips ending today)
    const friends: any[] = await User.find({
      _id: { $in: user.friends },
      "trips.0": { $exists: true },
      "trips.endDate": { $gte: startOfToday },
    })
      .select("name image username trips")
      .populate({
        path: "trips.city",
        model: City,
        select: "name image",
        populate: {
          path: "country",
          model: Country,
          select: "name",
        },
      })
      .lean();

    // Find overlapping trips
    const overlaps: any[] = [];

    // Only consider user's future trips (including trips ending today)
    const userUpcomingTrips =
      user.trips?.filter(
        (trip: any) => new Date(trip.endDate) >= startOfToday
      ) || [];

    // TYPE 1: Trip vs Trip matching (existing logic)
    userUpcomingTrips.forEach((userTrip: any) => {
      const userTripStart = new Date(userTrip.startDate);
      const userTripEnd = new Date(userTrip.endDate);
      const userCityId = userTrip.city._id.toString();

      friends.forEach((friend) => {
        friend.trips?.forEach((friendTrip: any) => {
          // Skip past trips (but include trips ending today)
          if (new Date(friendTrip.endDate) < startOfToday) return;

          // Check if it's the same city
          if (userCityId === friendTrip.city._id.toString()) {
            const friendTripStart = new Date(friendTrip.startDate);
            const friendTripEnd = new Date(friendTrip.endDate);

            // Check if dates overlap
            if (
              datesOverlap(
                userTripStart,
                userTripEnd,
                friendTripStart,
                friendTripEnd
              )
            ) {
              // Calculate overlap period
              const overlapStart = new Date(
                Math.max(userTripStart.getTime(), friendTripStart.getTime())
              );
              const overlapEnd = new Date(
                Math.min(userTripEnd.getTime(), friendTripEnd.getTime())
              );

              // Calculate days overlapping
              const overlapDays =
                Math.floor(
                  (overlapEnd.getTime() - overlapStart.getTime()) /
                    (1000 * 60 * 60 * 24)
                ) + 1;

              overlaps.push({
                _id: `trip-${userTrip._id}-${friendTrip._id}`,
                type: "trip_overlap", // Both traveling
                city: {
                  _id: userTrip.city._id.toString(),
                  name: userTrip.city.name,
                  image: userTrip.city.image,
                  country: userTrip.city.country,
                },
                friend: {
                  _id: friend._id.toString(),
                  name: friend.name,
                  username: friend.username,
                  image: friend.image,
                },
                yourTrip: {
                  startDate: userTrip.startDate,
                  endDate: userTrip.endDate,
                },
                friendTrip: {
                  startDate: friendTrip.startDate,
                  endDate: friendTrip.endDate,
                },
                overlap: {
                  startDate: overlapStart,
                  endDate: overlapEnd,
                  days: overlapDays,
                },
              });
            }
          }
        });
      });
    });

    // TYPE 2: Friends visiting your home city (new logic)
    if (user.city) {
      const userHomeCityId = user.city._id.toString();

      friends.forEach((friend) => {
        friend.trips?.forEach((friendTrip: any) => {
          // Skip past trips (but include trips ending today)
          const friendTripEnd = new Date(friendTrip.endDate);
          if (friendTripEnd < startOfToday) return;

          // Check if friend is visiting user's home city
          if (friendTrip.city._id.toString() === userHomeCityId) {
            const friendTripStart = new Date(friendTrip.startDate);

            // Check if user has any conflicting trips during friend's visit
            const hasConflictingTrip = userUpcomingTrips.some(
              (userTrip: any) => {
                return datesOverlap(
                  new Date(userTrip.startDate),
                  new Date(userTrip.endDate),
                  friendTripStart,
                  friendTripEnd
                );
              }
            );

            // Only add if user will be available (no conflicting trips)
            if (!hasConflictingTrip) {
              // Calculate overlap period (entire friend trip since user is home)
              const overlapDays =
                Math.floor(
                  (friendTripEnd.getTime() - friendTripStart.getTime()) /
                    (1000 * 60 * 60 * 24)
                ) + 1;

              overlaps.push({
                _id: `home-${userId}-${friendTrip._id}`,
                type: "visiting_home", // Friend visiting your city
                city: {
                  _id: user.city._id.toString(),
                  name: user.city.name,
                  image: user.city.image,
                  country: user.city.country,
                },
                friend: {
                  _id: friend._id.toString(),
                  name: friend.name,
                  username: friend.username,
                  image: friend.image,
                },
                yourTrip: null, // User is at home, not on a trip
                friendTrip: {
                  startDate: friendTrip.startDate,
                  endDate: friendTrip.endDate,
                },
                overlap: {
                  startDate: friendTripStart,
                  endDate: friendTripEnd,
                  days: overlapDays,
                },
              });
            }
          }
        });
      });
    }

    // Sort by overlap start date (soonest first)
    overlaps.sort(
      (a, b) =>
        new Date(a.overlap.startDate).getTime() -
        new Date(b.overlap.startDate).getTime()
    );

    return overlaps;
  } catch (error) {
    console.error("Error finding trip overlaps:", error);
    return [];
  }
}

async function getFriendsTrips(userId: string) {
  try {
    await connectMongo();

    const user = await User.findById(userId).select("friends").lean();

    if (!user || !(user as any).friends || (user as any).friends.length === 0) {
      return [];
    }

    const now = new Date();

    // Get friends' upcoming trips
    const friendsWithTrips = await User.find({
      _id: { $in: (user as any).friends },
      "trips.0": { $exists: true },
    })
      .select("name image username trips")
      .populate({
        path: "trips.city",
        model: City,
        populate: {
          path: "country",
          model: Country,
          select: "name code",
        },
      })
      .lean();

    // Flatten and filter upcoming trips
    const allTrips: any[] = [];
    friendsWithTrips.forEach((friend: any) => {
      friend.trips?.forEach((trip: any) => {
        if (new Date(trip.endDate) >= now) {
          allTrips.push({
            _id: trip._id.toString(),
            friend: {
              _id: friend._id.toString(),
              name: friend.name,
              image: friend.image,
              username: friend.username,
            },
            city: trip.city
              ? {
                  _id: trip.city._id.toString(),
                  name: trip.city.name,
                  image: trip.city.image,
                  country: trip.city.country
                    ? {
                        name: trip.city.country.name,
                        code: trip.city.country.code,
                      }
                    : null,
                }
              : null,
            startDate: trip.startDate,
            endDate: trip.endDate,
          });
        }
      });
    });

    // Sort by start date and limit to 4
    return allTrips
      .sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      )
      .slice(0, 4);
  } catch (error) {
    console.error("Error fetching friends' trips:", error);
    return [];
  }
}

// Cached: Trendy countries - expensive aggregation
// const getTrendyCountries = unstable_cache(
//   async () => {
//     try {
//       await connectMongo();

//       // Calculate everything in real-time for accuracy
//       const trendyCountries = await Country.aggregate([
//       // Get all active countries
//       { $match: { isActive: true } },
//       // Lookup ALL users in each country
//       {
//         $lookup: {
//           from: "users",
//           let: { countryId: "$_id" },
//           pipeline: [
//             { $match: { isProfileComplete: true } },
//             // Lookup city
//             {
//               $lookup: {
//                 from: "cities",
//                 localField: "city",
//                 foreignField: "_id",
//                 as: "cityData",
//               },
//             },
//             { $unwind: "$cityData" },
//             // Match country
//             {
//               $match: {
//                 $expr: { $eq: ["$cityData.country", "$$countryId"] },
//               },
//             },
//             // Project only what we need
//             { $project: { _id: 1, updatedAt: 1 } },
//           ],
//           as: "dancers",
//         },
//       },
//       // Filter out countries with no dancers
//       { $match: { "dancers.0": { $exists: true } } },
//       // Calculate metrics
//       {
//         $addFields: {
//           totalDancers: { $size: "$dancers" },
//           recentlyActive: {
//             $size: {
//               $filter: {
//                 input: "$dancers",
//                 as: "dancer",
//                 cond: {
//                   $gte: [
//                     "$$dancer.updatedAt",
//                     new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
//                   ],
//                 },
//               },
//             },
//           },
//         },
//       },
//       // Calculate trending score: totalDancers + (recentlyActive * 2)
//       {
//         $addFields: {
//           trendingScore: {
//             $add: ["$totalDancers", { $multiply: ["$recentlyActive", 2] }],
//           },
//         },
//       },
//       // Sort by trending score
//       { $sort: { trendingScore: -1 } },
//       // Limit to top 6
//       { $limit: 6 },
//       // Lookup continent
//       {
//         $lookup: {
//           from: "continents",
//           localField: "continent",
//           foreignField: "_id",
//           as: "continentData",
//         },
//       },
//       // Project final structure
//       {
//         $project: {
//           _id: 1,
//           name: 1,
//           code: 1,
//           totalDancers: 1,
//           recentlyActive: 1,
//           trendingScore: 1,
//           continent: {
//             $arrayElemAt: ["$continentData", 0],
//           },
//         },
//       },
//     ]);

//     const result = trendyCountries.map((country: any) => ({
//       ...country,
//       _id: country._id.toString(),
//       continent: country.continent
//         ? {
//             _id: country.continent._id?.toString(),
//             name: country.continent.name || "",
//           }
//         : null,
//     }));

//     if (result.length === 0) {
//       console.warn("⚠️ getTrendyCountries returned empty - check database");
//     }

//     return result;
//   } catch (error) {
//     console.error("Error fetching trendy countries:", error);
//     return [];
//   }
// },
// ["trendy-countries"],
// { revalidate: 120, tags: ["trendy-countries"] } // 2 minutes cache for safety
// );

// Cached: Cities list changes when dancer counts change
// Note: Shared with landing page - we cache top 10, dashboard uses first 8
const getCitiesCached = unstable_cache(
  async (): Promise<CityType[]> => {
    console.log("🚀 getCities FUNCTION CALLED");
    try {
      await connectMongo();

      const cities = await City.find({ totalDancers: { $gt: 0 } })
        .populate({ path: "country", model: Country, select: "name code" })
        .populate({ path: "continent", model: Continent, select: "name" })
        .sort({ totalDancers: -1 })
        .limit(10) // Cache top 10 (landing uses 10, dashboard uses 8)
        .lean();

      const result = cities.map((doc: any) => ({
        ...doc,
        _id: doc._id.toString(),
        country: {
          name: doc.country?.name || "",
          code: doc.country?.code || "",
        },
        continent: { name: doc.continent?.name || "" },
      }));

      if (result.length === 0) {
        console.warn("⚠️ getCities returned empty - check database");
      }

      return result;
    } catch (error) {
      console.error("Error fetching cities:", error);
      return [];
    }
  },
  ["hot-cities"],
  { revalidate: 60, tags: ["hot-cities"] } // Shared cache with landing page
);

// Dashboard wrapper - returns only first 8 cities
async function getCities(): Promise<CityType[]> {
  const cities = await getCitiesCached();
  return cities.slice(0, 8);
}

// Get user's friends count for invite banner
async function getUserFriendsCount(userId: string): Promise<number> {
  try {
    await connectMongo();
    const user: any = await User.findById(userId).select("friends").lean();
    if (!user || !user.friends) return 0;
    return user.friends.length;
  } catch (error) {
    console.error("Error fetching friends count:", error);
    return 0;
  }
}


// Get stats about the user's home city
async function getUserCityStats(userId: string) {
  try {
    await connectMongo();

    // Get user's city
    const user: any = await User.findById(userId)
      .populate({
        path: "city",
        model: City,
        populate: {
          path: "country",
          model: Country,
          select: "name code",
        },
      })
      .select("city")
      .lean();

    if (!user || !user.city) return null;

    const cityId = user.city._id;

    // Count total dancers in this city (home city)
    const totalDancers = await User.countDocuments({
      city: cityId,
      isProfileComplete: true,
    });

    // Count travelers (people visiting this city - activeCity is this city, but home city is different)
    const travelers = await User.countDocuments({
      activeCity: cityId,
      openToMeetTravelers: true,
      isProfileComplete: true,
      city: { $ne: cityId }, // Home city is NOT this city
    });

    // Get top 3 dance styles in this city
    const topStyles = await User.aggregate([
      { $match: { city: cityId, isProfileComplete: true } },
      { $unwind: "$danceStyles" },
      { $group: { _id: "$danceStyles.danceStyle", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 },
      {
        $lookup: {
          from: "dancestyles",
          localField: "_id",
          foreignField: "_id",
          as: "styleDetails",
        },
      },
      { $unwind: "$styleDetails" },
      {
        $project: {
          name: "$styleDetails.name",
          count: 1,
        },
      },
    ]);

    return {
      cityId: cityId.toString(),
      cityName: user.city.name,
      cityImage: user.city.image || null,
      countryCode: user.city.country?.code || "",
      countryName: user.city.country?.name || "",
      totalDancers,
      travelers,
      topStyles: topStyles.map((style: any) => ({
        name: style.name,
        count: style.count,
      })),
    };
  } catch (error) {
    console.error("Error fetching user city stats:", error);
    return null;
  }
}

// This is a private page: It's protected by the layout.js component which ensures the user is authenticated.
// It's a server compoment which means you can fetch data (like the user profile) before the page is rendered.
// See https://shipfa.st/docs/tutorials/private-page
export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  // Get translations
  const messages = await getMessages();
  const t = (key: string) => getTranslation(messages, key);

  // Check if user profile is complete
  try {
    await connectMongo();
    const user = await User.findById(session.user.id);

    if (user && !user.isProfileComplete) {
      // Redirect to onboarding if profile is not complete
      redirect("/onboarding");
    }
  } catch (error) {
    console.error("Error checking user profile:", error);
  }

  // Fetch data in parallel
  const [
    initialDancers,
    danceStyles,
    cities,
    // hotDanceStyles,
    communityStats,
    trendingSongs,
    // trendyCountries,
    tripOverlaps,
    friendsTrips,
    userCityStats,
    friendsCount,
    leaderboardBadges,
    feedPosts,
  ] = await Promise.all([
    getInitialDancers(session.user.id),
    getDanceStyles(),
    getCities(),
    // getHotDanceStyles(),
    getCommunityStats(),
    getTrendingSongs(),
    // getTrendyCountries(),
    getTripOverlaps(session.user.id),
    getFriendsTrips(session.user.id),
    getUserCityStats(session.user.id),
    getUserFriendsCount(session.user.id),
    getUserLeaderboardBadges(session.user.id),
    getFeedPosts(session.user.id, { limit: 4 }), // Only 4 for preview
  ]);

  return (
    <main className="min-h-screen pb-24 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Install App Banner - Only shows if NOT installed as PWA */}
        <InstallAppDashboardBanner />

        {/* Invite Friends Banner */}
        <InviteFriendsBanner friendsCount={friendsCount} />

        {/* Leaderboard Badges */}
        {leaderboardBadges.length > 0 && (
          <div className="mb-8 card bg-gradient-to-br from-warning/10 to-accent/10 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-xl">
                🏅 Your Leaderboard Rankings
              </h2>
              <LeaderboardBadges badges={leaderboardBadges} />
            </div>
          </div>
        )}

        {/* Hot Cities Section */}
        <h2 className="max-w-3xl font-extrabold text-xl md:text-2xl tracking-tight mb-2 md:mb-8">
          {t("dashboard.hottestCities")}
        </h2>
        <CityList initialCities={cities} />
        <div className="flex justify-center mt-6">
          <Link href="/cities" className="btn btn-outline btn-sm md:btn-md">
            {t("dashboard.viewAllCities")}
          </Link>
        </div>
        {/* Your City Preview */}
        <div className="mt-8">
          <YourCityPreview cityStats={userCityStats} />
        </div>
        {/* Activity Feed Preview */}

        <div className="mt-8">
          <DashboardPostSection initialPosts={feedPosts} />
        </div>

        {/* Trip Overlaps - Meetup Opportunities */}
        <TripOverlaps overlaps={tripOverlaps} isPreview={true} />

        {/* Friends' Trips Preview */}
        {friendsTrips.length > 0 && (
          <div className="mt-12">
            <FriendsTripsPreview trips={friendsTrips} />
          </div>
        )}

        {/* Trendy Countries Section */}
        {/* <div className="mt-12">
          <TrendyCountries countries={trendyCountries} />
        </div> */}

        {/* Hot Dance Styles Section */}
        {/* <div className="mt-12">
          <HotDanceStyles danceStyles={hotDanceStyles} />
        </div> */}

        {/* Trendy Music Section */}
        <TrendyMusicPreview songs={trendingSongs} />

        {/* Community Stats Section */}
        <div className="mt-12">
          <StatsPreview
            stats={communityStats}
            countryData={communityStats.countryData}
          />
        </div>

        {/* Discovery Feed */}
        <div className="mt-12">
          <DiscoveryFeed
            initialDancers={initialDancers}
            danceStyles={danceStyles}
            showViewAllLink={true}
            isPreview={true}
          />
        </div>
      </div>
    </main>
  );
}

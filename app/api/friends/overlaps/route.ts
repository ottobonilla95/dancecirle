import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import connectDB from "@/libs/mongoose";
import User from "@/models/User";
import City from "@/models/City";
import Country from "@/models/Country";

// Helper to check if two date ranges overlap
function datesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 <= end2 && start2 <= end1;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const now = new Date();
    // Set to start of today to include trips ending today
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get current user with their trips, friends, and home city
    const user: any = await User.findById(session.user.id)
      .select("trips friends city")
      .populate({
        path: "trips.city",
        select: "name image",
        populate: {
          path: "country",
          select: "name",
        },
      })
      .populate({
        path: "city",
        select: "name image",
        populate: {
          path: "country",
          select: "name",
        },
      })
      .lean();

    if (!user || !user.friends || user.friends.length === 0) {
      return NextResponse.json({ overlaps: [] });
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
        select: "name image",
        populate: {
          path: "country",
          select: "name",
        },
      })
      .lean();

    // Find overlapping trips
    const overlaps: any[] = [];

    // Only consider user's future trips (including trips ending today)
    const userUpcomingTrips = user.trips?.filter(
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
            if (datesOverlap(userTripStart, userTripEnd, friendTripStart, friendTripEnd)) {
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
                type: 'trip_overlap', // Both traveling
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
            const hasConflictingTrip = userUpcomingTrips.some((userTrip: any) => {
              return datesOverlap(
                new Date(userTrip.startDate),
                new Date(userTrip.endDate),
                friendTripStart,
                friendTripEnd
              );
            });

            // Only add if user will be available (no conflicting trips)
            if (!hasConflictingTrip) {
              // Calculate overlap period (entire friend trip since user is home)
              const overlapDays =
                Math.floor(
                  (friendTripEnd.getTime() - friendTripStart.getTime()) /
                    (1000 * 60 * 60 * 24)
                ) + 1;

              overlaps.push({
                _id: `home-${session.user.id}-${friendTrip._id}`,
                type: 'visiting_home', // Friend visiting your city
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

    return NextResponse.json({ overlaps });
  } catch (error) {
    console.error("Error finding trip overlaps:", error);
    return NextResponse.json(
      { error: "Failed to find trip overlaps" },
      { status: 500 }
    );
  }
}


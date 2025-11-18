import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import connectDB from "@/libs/mongoose";
import User from "@/models/User";
import City from "@/models/City";
import { createTripPost, shouldAutoPost } from "@/utils/auto-posts";

// GET - Get user's trips
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user: any = await User.findById(session.user.id)
      .select("trips")
      .populate({
        path: "trips.city",
        select: "name country image",
        populate: {
          path: "country",
          select: "name code"
        }
      })
      .lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Separate upcoming and past trips
    const now = new Date();
    const upcoming = (user.trips?.filter((trip: any) => new Date(trip.endDate) >= now) || [])
      .sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()); // Sort by start date (ascending)
    
    const past = (user.trips?.filter((trip: any) => new Date(trip.endDate) < now) || [])
      .sort((a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()) // Sort by start date (descending - most recent first)
      .slice(0, 10); // Return only last 10 past trips

    return NextResponse.json({
      upcoming,
      past
    });
  } catch (error) {
    console.error("Error fetching trips:", error);
    return NextResponse.json(
      { error: "Failed to fetch trips" },
      { status: 500 }
    );
  }
}

// POST - Add a new trip
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { cityId, startDate, endDate } = body;

    // Validation
    if (!cityId || !startDate || !endDate) {
      return NextResponse.json(
        { error: "City, start date, and end date are required" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findByIdAndUpdate(
      session.user.id,
      {
        $push: {
          trips: {
            city: cityId,
            startDate: start,
            endDate: end,
            createdAt: new Date()
          }
        }
      },
      { new: true }
    ).select("trips");

    // Create auto-post for trip if user has auto-posting enabled
    if (await shouldAutoPost(session.user.id)) {
      try {
        // Get city name for the post
        const city = await City.findById(cityId).select("name");
        if (city) {
          await createTripPost(session.user.id, {
            city: city.name,
            startDate: start,
            endDate: end,
          });
        }
      } catch (error) {
        console.error("Error creating trip post:", error);
        // Don't fail the request if post creation fails
      }
    }

    return NextResponse.json({ success: true, trips: user?.trips });
  } catch (error) {
    console.error("Error adding trip:", error);
    return NextResponse.json(
      { error: "Failed to add trip" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a trip
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tripId = searchParams.get("tripId");

    if (!tripId) {
      return NextResponse.json(
        { error: "Trip ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findByIdAndUpdate(
      session.user.id,
      {
        $pull: {
          trips: { _id: tripId }
        }
      },
      { new: true }
    ).select("trips");

    return NextResponse.json({ success: true, trips: user?.trips });
  } catch (error) {
    console.error("Error deleting trip:", error);
    return NextResponse.json(
      { error: "Failed to delete trip" },
      { status: 500 }
    );
  }
}


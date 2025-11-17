import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";
import City from "@/models/City";
import Country from "@/models/Country";
import config from "@/config";

export const dynamic = 'force-dynamic';

// GET: Fetch all users with pagination
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
    const limit = parseInt(searchParams.get("limit") || "100");
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") || "";
    const filterShared = searchParams.get("filterShared"); // "true", "false", or null (all)
    const filterProfileComplete = searchParams.get("filterProfileComplete"); // "true", "false", or null (all)
    const filterCity = searchParams.get("filterCity"); // City ID or null (all)
    const isFeaturedProfessional = searchParams.get("isFeaturedProfessional"); // "true" or null
    const filterInstagramWithImage = searchParams.get("filterInstagramWithImage"); // "true" or null

    // Build search query
    const query: any = {};
    
    // Search by name or username
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by shared status
    if (filterShared === "true") {
      query.sharedOnSocialMedia = true;
    } else if (filterShared === "false") {
      query.sharedOnSocialMedia = { $ne: true }; // false or undefined
    }

    // Filter by profile completion status
    if (filterProfileComplete === "true") {
      query.isProfileComplete = true;
    } else if (filterProfileComplete === "false") {
      query.isProfileComplete = { $ne: true }; // false or undefined
    }

    // Filter by city
    if (filterCity) {
      query.city = filterCity;
    }

    // Filter by featured professional status (superstar users)
    if (isFeaturedProfessional === "true") {
      query.isFeaturedProfessional = true;
    }

    // Filter by Instagram + custom image (not Google image)
    if (filterInstagramWithImage === "true") {
      query['socialMedia.instagram'] = { $exists: true, $ne: "" };
      query.image = { 
        $exists: true, 
        $ne: "", 
        $not: { $regex: "googleusercontent.com" } // Exclude Google profile images
      };
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select("_id name username email image sharedOnSocialMedia isProfileComplete createdAt city onboardingSteps reminderSent reminderSentAt isFeaturedProfessional isTeacher isDJ isPhotographer isEventOrganizer isProducer followers")
        .populate({
          path: "city",
          select: "name country",
          populate: {
            path: "country",
            select: "name code",
          },
        })
        .sort({ createdAt: -1 }) // Newest users first
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    // Add follower counts
    const usersWithCounts = users.map((user: any) => ({
      ...user,
      followersCount: user.followers?.length || 0,
    }));

    return NextResponse.json({
      success: true,
      users: usersWithCounts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

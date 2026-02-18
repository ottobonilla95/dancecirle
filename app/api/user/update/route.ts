import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { isValidObjectId } from "mongoose";
import { authOptions } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";
import DanceStyle from "@/models/DanceStyle";
import City from "@/models/City";
import { createAutoPostsForProfileUpdate, shouldAutoPost } from "@/utils/auto-posts";
import { revalidateTag } from "next/cache";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  try {
    await connectMongo();

    const body = await req.json();
    const userId = session.user.id;

    // Allowed fields for post-onboarding updates
    const allowedUpdates = [
      // Profile fields
      "firstName",
      "lastName",
      "dateOfBirth",
      "hideAge",
      "city",
      "nationality",
      'bio',
      'image',
      'anthem',
      'socialMedia',
      'danceStyles',
      'danceRole',
      'relationshipStatus',
      'dancingStartYear',
      'citiesVisited',
      // Professional fields
      "isTeacher",
      "isDJ",
      "isPhotographer",
      "isEventOrganizer",
      "isProducer",
      "teacherProfile",
      "djProfile",
      "photographerProfile",
      "eventOrganizerProfile",
      "producerProfile",
      "professionalContact",
      // Competitions & achievements
      'jackAndJillCompetitions',
      // Settings/preferences
      'openToMeetTravelers',
      'lookingForPracticePartners',
    ];

    const updateData: any = {};

    // Filter only allowed fields from the request
    Object.keys(body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updateData[key] = body[key];
      }
    });

    // If no valid updates, return error
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Get user and old data for comparison (for auto-posts)
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const oldUserData = user.toObject();
    const oldCityId = user.city ? user.city.toString() : null;

    if (updateData.city !== undefined) {
      if (!isValidObjectId(updateData.city)) {
        return NextResponse.json({ error: "Invalid city" }, { status: 400 });
      }
      const cityExists = await City.exists({ _id: updateData.city });
      if (!cityExists) {
        return NextResponse.json({ error: "City not found" }, { status: 404 });
      }
    }

    // Apply updates
    Object.keys(updateData).forEach(key => {
      user[key] = updateData[key];
    });

    // Keep display name aligned with first/last name updates
    if (updateData.firstName !== undefined || updateData.lastName !== undefined) {
      user.name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }

    // Normalize date input when sent as string
    if (typeof updateData.dateOfBirth === "string" && updateData.dateOfBirth) {
      user.dateOfBirth = new Date(updateData.dateOfBirth);
    }

    // Keep professional contact consistent with selected roles
    const hasAnyProfessionalRole =
      user.isTeacher ||
      user.isDJ ||
      user.isPhotographer ||
      user.isEventOrganizer ||
      user.isProducer;
    if (!hasAnyProfessionalRole) {
      user.professionalContact = undefined;
    }

    // Keep city counters accurate for complete profiles
    if (updateData.city !== undefined) {
      const newCityId = user.city ? user.city.toString() : null;
      if (user.isProfileComplete && oldCityId !== newCityId) {
        if (oldCityId) {
          await City.findByIdAndUpdate(oldCityId, { $inc: { totalDancers: -1 } });
        }
        if (newCityId) {
          await City.findByIdAndUpdate(newCityId, { $inc: { totalDancers: 1 } });
        }
      }

      // Keep dashboard/discovery context aligned when home city is edited here
      if (user.city) {
        user.activeCity = user.city;
      }
    }

    // Invalidate cache if anthem updated
    if (updateData.anthem) {
      revalidateTag("trending-songs");
    }

    await user.save();

    // Create auto-posts if user has auto-posting enabled and profile is complete
    if (user.isProfileComplete && await shouldAutoPost(userId)) {
      try {
        await createAutoPostsForProfileUpdate({
          userId,
          oldData: oldUserData,
          newData: user.toObject(),
        });
      } catch (error) {
        console.error("Error creating auto-posts:", error);
        // Don't fail the request if post creation fails
      }
    }

    // Populate for response
    await user.populate({
      path: "jackAndJillCompetitions.danceStyle",
      model: DanceStyle,
      select: "name",
    });

    return NextResponse.json({
      success: true,
      user: user.toObject(),
    });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update user" },
      { status: 500 }
    );
  }
}

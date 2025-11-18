import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";
import City from "@/models/City";
import DanceStyle from "@/models/DanceStyle";
import Country from "@/models/Country";
import Continent from "@/models/Continent";
import { revalidateTag } from "next/cache";
import { shouldAutoPost } from "@/utils/auto-posts";
import Post from "@/models/Post";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  try {
    await connectMongo();

    const user = await User.findById(session.user.id)
      .select(
        "name firstName lastName username email image dateOfBirth hideAge bio dancingStartYear city activeCity citiesVisited danceStyles anthem socialMedia danceRole gender nationality relationshipStatus onboardingSteps isProfileComplete isTeacher isDJ isPhotographer isEventOrganizer isProducer teacherProfile djProfile photographerProfile eventOrganizerProfile producerProfile professionalContact openToMeetTravelers lookingForPracticePartners jackAndJillCompetitions userType createdAt"
      )
      .populate({
        path: "city",
        model: City,
        select: "name country continent rank image population totalDancers",
        populate: [
          {
            path: "country",
            model: Country,
            select: "name code"
          },
          {
            path: "continent", 
            model: Continent,
            select: "name code"
          }
        ]
      })
      .populate({
        path: "activeCity",
        model: City,
        select: "_id name country continent rank image population totalDancers",
        populate: [
          {
            path: "country",
            model: Country,
            select: "name code"
          },
          {
            path: "continent", 
            model: Continent,
            select: "name code"
          }
        ]
      })
      .populate({
        path: "citiesVisited",
        model: City,
        select: "name country continent rank image population totalDancers",
        populate: [
          {
            path: "country",
            model: Country,
            select: "name code"
          },
          {
            path: "continent",
            model: Continent,
            select: "name code"
          }
        ]
      })
      .populate({
        path: "danceStyles.danceStyle",
        model: DanceStyle,
        select: "name description category",
      })
      .populate({
        path: "jackAndJillCompetitions.danceStyle",
        model: DanceStyle,
        select: "name",
      });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  try {
    await connectMongo();

    const body = await req.json();
    const { step, data } = body;

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Store old city for change detection (before any updates)
    const oldCity = user.city;

    // Update specific onboarding step
    switch (step) {
      case "userType":
        user.userType = data.userType;
        user.onboardingSteps.userType = true;
        break;

      case "nameDetails":
        user.firstName = data.firstName;
        user.lastName = data.lastName;
        user.name = `${data.firstName} ${data.lastName}`.trim();
        user.onboardingSteps.nameDetails = true;
        break;

      case "danceStyles":
        user.danceStyles = data.danceStyles;
        user.onboardingSteps.danceStyles = true;
        break;

      case "username":
        user.username = data.username;
        user.onboardingSteps.username = true;
        break;

      case "profilePic":
        user.image = data.image;
        user.onboardingSteps.profilePic = true;
        break;

      case "profilePicture":
        user.image = data.image;
        user.onboardingSteps.profilePic = true;
        break;

      case "dateOfBirth":
        user.dateOfBirth = new Date(data.dateOfBirth);
        user.hideAge = data.hideAge || false;
        user.onboardingSteps.dateOfBirth = true;
        break;

      case "bio":
        user.bio = data.bio || "";
        user.onboardingSteps.bio = true;
        break;

      case "dancingStartYear":
        user.dancingStartYear = data.dancingStartYear;
        user.onboardingSteps.dancingStartYear = true;
        break;

      case "dancingExperience":
        user.dancingStartYear = data.dancingStartYear;
        user.onboardingSteps.dancingStartYear = true;
        break;

      case "currentLocation": {
        const oldCityId = user.city;
        const newCityId = data.city;

        // Only update city dancer counts if profile is already complete
        // (If profile is not complete yet, we'll update when it becomes complete)
        if (user.isProfileComplete) {
          // If user had a previous city, decrement its totalDancers
          if (oldCityId && oldCityId.toString() !== newCityId) {
            await City.findByIdAndUpdate(oldCityId, {
              $inc: { totalDancers: -1 },
            });
          }

          // If new city is different from old city, increment its totalDancers
          if (newCityId && (!oldCityId || oldCityId.toString() !== newCityId)) {
            await City.findByIdAndUpdate(newCityId, {
              $inc: { totalDancers: 1 },
            });
          }
        }

        user.city = newCityId;
        // Also set activeCity to home city by default (can be changed later)
        if (!user.activeCity) {
          user.activeCity = newCityId;
        }
        user.onboardingSteps.currentLocation = true;
        break;
      }

      case "citiesVisited":
        user.citiesVisited = data.citiesVisited;
        user.onboardingSteps.citiesVisited = true;
        break;

      case "anthem":
        // Anthem is now optional
        if (data.anthem && data.anthem.url) {
          user.anthem = {
            url: data.anthem.url,
            platform: data.anthem.platform,
            title: data.anthem.title,
            artist: data.anthem.artist,
          };
        } else {
          user.anthem = undefined;
        }
        user.onboardingSteps.anthem = true;
        // Invalidate trending songs cache when anthem is updated
        revalidateTag("trending-songs");
        break;

      case "socialMedia":
        user.socialMedia = {
          instagram: data.socialMedia.instagram || "",
          tiktok: data.socialMedia.tiktok || "",
          youtube: data.socialMedia.youtube || "",
        };
        user.onboardingSteps.socialMedia = true;
        break;

      case "danceRole":
        user.danceRole = data.danceRole;
        user.onboardingSteps.danceRole = true;
        break;

      case "gender":
        user.gender = data.gender;
        user.onboardingSteps.gender = true;
        break;

      case "nationality":
        user.nationality = data.nationality;
        user.onboardingSteps.nationality = true;
        break;

      case "relationshipStatus":
        user.relationshipStatus = data.relationshipStatus;
        user.onboardingSteps.relationshipStatus = true;
        break;

      case "teacherInfo":
        // Handle all professional roles
        user.isTeacher = data.isTeacher || false;
        user.isDJ = data.isDJ || false;
        user.isPhotographer = data.isPhotographer || false;
        user.isEventOrganizer = data.isEventOrganizer || false;
        user.isProducer = data.isProducer || false;
        
        // Update teacher profile
        if (data.isTeacher && data.teacherProfile) {
          user.teacherProfile = {
            bio: data.teacherProfile.bio,
            yearsOfExperience: data.teacherProfile.yearsOfExperience,
          };
        } else {
          user.teacherProfile = undefined;
        }
        
        // Update DJ profile
        if (data.isDJ && data.djProfile) {
          user.djProfile = {
            djName: data.djProfile.djName,
            genres: data.djProfile.genres,
            bio: data.djProfile.bio,
          };
        } else {
          user.djProfile = undefined;
        }
        
        // Update photographer profile
        if (data.isPhotographer && data.photographerProfile) {
          user.photographerProfile = {
            portfolioLink: data.photographerProfile.portfolioLink,
            specialties: data.photographerProfile.specialties,
            bio: data.photographerProfile.bio,
          };
        } else {
          user.photographerProfile = undefined;
        }
        
        // Update event organizer profile
        if (data.isEventOrganizer && data.eventOrganizerProfile) {
          user.eventOrganizerProfile = {
            organizationName: data.eventOrganizerProfile.organizationName,
            eventTypes: data.eventOrganizerProfile.eventTypes,
            bio: data.eventOrganizerProfile.bio,
          };
        } else {
          user.eventOrganizerProfile = undefined;
        }
        
        // Update producer profile
        if (data.isProducer && data.producerProfile) {
          user.producerProfile = {
            producerName: data.producerProfile.producerName,
            genres: data.producerProfile.genres,
            bio: data.producerProfile.bio,
          };
        } else {
          user.producerProfile = undefined;
        }
        
        // Update shared professional contact
        if (data.professionalContact && (data.isTeacher || data.isDJ || data.isPhotographer || data.isEventOrganizer || data.isProducer)) {
          user.professionalContact = {
            whatsapp: data.professionalContact.whatsapp || "",
            email: data.professionalContact.email || "",
          };
        } else {
          user.professionalContact = undefined;
        }
        
        user.onboardingSteps.teacherInfo = true;
        break;

      default:
        return NextResponse.json({ error: "Invalid step" }, { status: 400 });
    }

    // Check if profile is complete
    // Only require mandatory steps - optional ones like bio, anthem, socialMedia shouldn't block completion
    const steps = user.onboardingSteps;
    
    // Check if user is ONLY a professional (not a dancer)
    const isProfessionalOnly = user.userType === "professional";
    
    // Base mandatory steps for everyone
    const baseMandatorySteps = [
      'nameDetails',
      'username', 
      'profilePic',      // They need to at least go through this step (can skip photo)
      'dateOfBirth',
      'gender',
      'nationality',
      'currentLocation',
      'teacherInfo'      // Need to declare professional roles
    ];
    
    // Dance-related mandatory steps (only for dancers)
    const danceMandatorySteps = [
      'danceRole',
      // 'danceStyles' - optional even for dancers in case they want to skip
      // 'dancingStartYear' - optional
      // 'citiesVisited' - optional
    ];
    
    // Combine based on user type
    const mandatorySteps = isProfessionalOnly 
      ? baseMandatorySteps 
      : [...baseMandatorySteps, ...danceMandatorySteps];
    
    // Optional steps that shouldn't block profile completion:
    // - bio (truly optional)
    // - dancingStartYear (optional for everyone)
    // - danceStyles (optional - professionals don't need it)
    // - citiesVisited (optional)
    // - anthem (optional)
    // - socialMedia (optional)
    // - relationshipStatus (optional - "prefer not to say" is valid)
    
    // Profile is complete if all mandatory steps are done
    const isComplete = mandatorySteps.every((stepKey) => steps[stepKey] === true);
    const wasCompleteBeforeSave = user.isProfileComplete;
    user.isProfileComplete = isComplete;

    // If profile just became complete, increment city's totalDancers
    if (isComplete && !wasCompleteBeforeSave && user.city) {
      await City.findByIdAndUpdate(user.city, {
        $inc: { totalDancers: 1 },
      });
    }

    // Check if city changed (for already completed profiles)
    const cityChanged = wasCompleteBeforeSave && 
                        oldCity && 
                        user.city && 
                        oldCity.toString() !== user.city.toString();

    await user.save();

    // Create auto-posts
    if (await shouldAutoPost(session.user.id)) {
      try {
        if (user.city) {
          const cityDoc = await City.findById(user.city).select("name");
          
          if (cityDoc) {
            // If profile just completed for first time: "Just joined"
            if (isComplete && !wasCompleteBeforeSave) {
              await Post.create({
                author: session.user.id,
                type: "new_to_city",
                city: cityDoc.name,
                content: {
                  message: `Just joined ${cityDoc.name}! 🎉`,
                },
                isAutoGenerated: true,
              });
            }
            // If city changed on already completed profile: "Just moved to"
            else if (cityChanged) {
              await Post.create({
                author: session.user.id,
                type: "new_to_city",
                city: cityDoc.name,
                content: {
                  message: `Just moved to ${cityDoc.name}!`,
                },
                isAutoGenerated: true,
              });
            }
          }
        }
      } catch (error) {
        console.error("Error creating auto-post:", error);
        // Don't fail the request if post creation fails
      }
    }
    // Note: All post-onboarding edits should use PATCH /api/user/update

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        isProfileComplete: user.isProfileComplete,
        onboardingSteps: user.onboardingSteps,
      },
      // Signal to client if profile was just completed
      profileCompleted: isComplete && !wasCompleteBeforeSave,
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


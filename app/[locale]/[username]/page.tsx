import { notFound } from "next/navigation";
import { getBreadcrumbJsonLd } from "@/libs/seo";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";
import City from "@/models/City";
import DanceStyle from "@/models/DanceStyle";
import DJEvent from "@/models/DJEvent";
import Country from "@/models/Country";
import Continent from "@/models/Continent";
import { Link } from "@/navigation";
import { getZodiacSign } from "@/utils/zodiac";
import { getCountryCode } from "@/utils/countries";
import { DANCE_LEVELS } from "@/constants/dance-levels";
import {
  FaInstagram,
  FaTiktok,
  FaYoutube,
  FaHeart,
  FaWhatsapp,
  FaEnvelope,
} from "react-icons/fa";
import Flag from "@/components/Flag";
import DanceStyleCard from "@/components/DanceStyleCard";
import LikeButton from "@/components/LikeButton";
import LikesDisplay from "@/components/LikesDisplay";
import ConnectButton from "@/components/ConnectButton";
import { LikesProvider } from "@/contexts/LikesContext";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import AchievementBadges from "@/components/AchievementBadges";
import { calculateUserBadges } from "@/utils/badges";
import FriendsListSection from "@/components/FriendsListSection";
import MutualFriends from "@/components/MutualFriends";
import { getMessages, getTranslation, tReplace, type Locale } from "@/lib/i18n";
import ProfilePictureModal from "@/components/ProfilePictureModal";
import AdminSharedCheckbox from "@/components/AdminSharedCheckbox";
import AdminFeaturedCheckbox from "@/components/AdminFeaturedCheckbox";
import AdminSocialMediaEdit from "@/components/AdminSocialMediaEdit";
import ProfileViewTracker from "@/components/ProfileViewTracker";
import { cookies } from "next/headers";
import config from "@/config";
import LeaderboardBadges from "@/components/LeaderboardBadges";
import { getUserLeaderboardBadges } from "@/utils/leaderboard-badges";
import ProducerReleases from "@/components/ProducerReleases";
import VerifiedBadge from "@/components/VerifiedBadge";
import { unstable_cache } from "next/cache";

interface Props {
  params: {
    locale: string;
    username: string;
  };
}

export const revalidate = 3600;

// Cache dance styles for 1 hour - they rarely change
const getCachedDanceStyles = unstable_cache(
  async () => {
    await connectMongo();
    return await DanceStyle.find({}).lean();
  },
  ['all-dance-styles'],
  { revalidate: 3600, tags: ['dance-styles'] }
);

// Generate dynamic SEO metadata for dancer profiles
export async function generateMetadata({ params }: Props) {
  const locale = (params.locale || 'en') as Locale;
  const messages = await getMessages(locale);
  const mt = (key: string) => getTranslation(messages, key);

  await connectMongo();

  try {
    const user: any = await User.findOne({
      username: params.username.toLowerCase(),
    })
      .select(
        "name username image bio danceStyles city isTeacher isDJ isPhotographer isEventOrganizer isProducer"
      )
      .populate({
        path: "city",
        model: City,
        select: "name country",
        populate: {
          path: "country",
          model: Country,
          select: "name",
        },
      })
      .populate({
        path: "danceStyles.danceStyle",
        model: DanceStyle,
        select: "name",
      })
      .lean();

    if (!user) {
      return {
        title: mt('meta.dancer.notFound'),
      };
    }

    // Build professional roles
    const roles = [];
    if (user.isTeacher) roles.push(mt('meta.dancer.roleTeacher'));
    if (user.isDJ) roles.push(mt('meta.dancer.roleDJ'));
    if (user.isPhotographer) roles.push(mt('meta.dancer.rolePhotographer'));
    if (user.isEventOrganizer) roles.push(mt('meta.dancer.roleEventOrganizer'));
    if (user.isProducer) roles.push(mt('meta.dancer.roleProducer'));

    // Get dance styles
    const danceStyles =
      user.danceStyles
        ?.map((ds: any) => ds.danceStyle?.name)
        .filter(Boolean)
        .join(", ") || mt('meta.dancer.defaultRole');

    // Build location
    const location = user.city?.name
      ? `${user.city.name}${user.city.country?.name ? `, ${user.city.country.name}` : ""}`
      : "";

    // Build title
    const roleText = roles.length > 0 ? roles.join(" & ") : mt('meta.dancer.defaultRole');
    const title = location
      ? tReplace(mt('meta.dancer.title'), { name: user.name, role: roleText, styles: danceStyles, location })
      : tReplace(mt('meta.dancer.titleNoLocation'), { name: user.name, role: roleText, styles: danceStyles });

    // Build description
    const bioExcerpt = user.bio
      ? user.bio.substring(0, 150).trim() + "..."
      : "";
    const description = bioExcerpt
      ? tReplace(mt('meta.dancer.descriptionWithBio'), { name: user.name, role: roleText, styles: danceStyles, bio: bioExcerpt })
      : tReplace(mt('meta.dancer.description'), { name: user.name, role: roleText, styles: danceStyles, location: location ? ` in ${location}` : '' });

    // Build keywords
    const keywords = [
      user.name,
      danceStyles,
      ...roles,
      location,
      user.city?.name,
      user.city?.country?.name,
      mt('meta.dancer.danceCommunity'),
      mt('meta.dancer.dancePartner'),
    ]
      .filter(Boolean)
      .join(", ");

    const canonicalPath = `/${user.username}`;

    return {
      title,
      description,
      keywords,
      alternates: {
        canonical: `https://www.dancecircle.co/${params.locale}${canonicalPath}`,
        languages: {
          en: `https://www.dancecircle.co/en${canonicalPath}`,
          es: `https://www.dancecircle.co/es${canonicalPath}`,
        },
      },
      openGraph: {
        title,
        description,
        url: `https://www.dancecircle.co/${params.locale}${canonicalPath}`,
        images: user.image ? [user.image] : [],
        type: "profile",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: user.image ? [user.image] : [],
      },
    };
  } catch (error) {
    console.error("Error generating dancer metadata:", error);
    return {
      title: mt('meta.dancer.fallback'),
    };
  }
}

export default async function PublicProfile({ params }: Props) {
  await connectMongo();

  // Get translations
  const messages = await getMessages();
  const t = (key: string) => getTranslation(messages, key);

  // Get current session to check if user is logged in
  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session;

  // Check if admin mode is enabled
  const cookieStore = cookies();
  const adminModeCookie = cookieStore.get("adminMode");
  const isAdminMode =
    session?.user?.email === config.admin.email &&
    adminModeCookie?.value === "true";

  let user;
  try {
    user = await User.findOne({
      username: params.username.toLowerCase(),
    })
      .select(
        "name username email image dateOfBirth hideAge bio dancingStartYear city citiesVisited trips danceStyles anthem socialMedia danceRole gender nationality relationshipStatus createdAt likedBy friends friendRequestsSent friendRequestsReceived isTeacher isDJ isPhotographer isEventOrganizer isProducer teacherProfile djProfile photographerProfile eventOrganizerProfile producerProfile professionalContact jackAndJillCompetitions sharedOnSocialMedia heroSequence isFeaturedProfessional followers following userType"
      )
      .populate({
        path: "friends",
        model: User,
        select: "name username image", // Only fetch what's displayed: name, image, and username for alt text fallback
        options: { limit: 200 }, // Show up to 200 friends (optimized - no city queries means we can show more!)
      })
      .populate({
        path: "city",
        model: City,
        select: "name country continent rank image population",
        populate: [
          {
            path: "country",
            model: Country,
            select: "name code",
          },
          {
            path: "continent",
            model: Continent,
            select: "name code",
          },
        ],
      })
      .populate({
        path: "citiesVisited",
        model: City,
        select: "name image", // Only need name and image for display
      })
      .populate({
        path: "trips.city",
        model: City,
        select: "name country image",
        populate: {
          path: "country",
          model: Country,
          select: "name code",
        },
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
      })
      .lean();

    if (!user) {
      notFound();
    }
  } catch (error) {
    // Handle any database errors
    console.error("Error fetching user:", error);
    notFound();
  }

  const userId = (user as any)._id.toString();
  const isOwnProfile = session?.user?.id === userId;

  // Use cached dance styles - reduces DB queries significantly
  const danceStyles = await getCachedDanceStyles();

  // Fetch DJ events if user is a DJ
  let djEvents: any[] = [];
  if ((user as any).isDJ) {
    djEvents = await DJEvent.find({ djId: userId })
      .sort({ eventDate: -1 })
      .limit(10)
      .lean();
  }

  // Calculate age from date of birth
  const getAge = (dateOfBirth: Date | string) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  const getDanceStylesWithLevels = (userDanceStyles: any[]) => {
    return userDanceStyles.map((userStyle) => {
      const levelInfo = DANCE_LEVELS.find((l) => l.value === userStyle.level);

      // Handle both populated objects and ID strings
      let styleName: string;
      let styleDescription: string;

      if (
        typeof userStyle.danceStyle === "object" &&
        userStyle.danceStyle?.name
      ) {
        // Already populated
        styleName = userStyle.danceStyle.name;
        styleDescription = userStyle.danceStyle.description || "";
      } else {
        // Just an ID, look it up in danceStyles array
        const styleId = userStyle.danceStyle;
        const foundStyle = danceStyles.find(
          (style: any) => style._id === styleId || style.id === styleId
        );
        styleName = foundStyle?.name || "Unknown Style";
        styleDescription = foundStyle?.description || "";
      }

      return {
        id:
          typeof userStyle.danceStyle === "object"
            ? userStyle.danceStyle._id
            : userStyle.danceStyle,
        name: styleName,
        level: userStyle.level,
        levelLabel: levelInfo?.label || "Beginner",
        levelEmoji: levelInfo?.emoji || "🌱",
        description: styleDescription,
      };
    });
  };

  // Helper function to construct social media URLs
  const getSocialUrl = (platform: string, value: string) => {
    if (!value) return "";

    // If it's already a full URL, return as-is
    if (value.startsWith("http")) {
      return value;
    }

    // Otherwise, construct the URL based on platform
    const cleanValue = value.replace("@", "");
    switch (platform) {
      case "instagram":
        return `https://instagram.com/${cleanValue}`;
      case "tiktok":
        return `https://tiktok.com/@${cleanValue}`;
      case "youtube":
        return value; // YouTube URLs are usually full URLs
      default:
        return value;
    }
  };

  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, string> = {
      leader: `${t("profile.leader")} 🕺`,
      follower: `${t("profile.follower")} 💃`,
      both: `${t("common.both")} (${t("profile.leader")} & ${t("profile.follower")})`,
    };
    return roleMap[role] || role;
  };

  const getRelationshipStatusDisplay = (status: string) => {
    const statusMap: Record<string, string> = {
      single: `${t("profile.single")} 💙`,
      in_a_relationship: `${t("profile.relationship")} 💕`,
      married: `${t("profile.married")} 💍`,
      its_complicated: "It's complicated 🤷",
      prefer_not_to_say: "Prefer not to say",
    };
    return statusMap[status] || status;
  };

  // Type cast to avoid Mongoose lean() typing issues
  const userData = user as any;

  // Check if user is professional-only
  const isProfessionalOnly = userData.userType === "professional";

  // Check if there's any actual content to show in Dance Profile section
  const hasDanceProfileContent =
    (userData.bio && userData.bio.trim().length > 0) ||
    (userData.relationshipStatus && userData.relationshipStatus.trim && userData.relationshipStatus.trim().length > 0) ||
    (!isProfessionalOnly && userData.danceRole) ||
    (!isProfessionalOnly && userData.dancingStartYear) ||
    (!isProfessionalOnly && userData.danceStyles && userData.danceStyles.length > 0) ||
    (!isProfessionalOnly && userData.citiesVisited && userData.citiesVisited.length > 0);

  const zodiac = userData.dateOfBirth
    ? getZodiacSign(userData.dateOfBirth)
    : null;
  const age = userData.dateOfBirth ? getAge(userData.dateOfBirth) : null;

  // Social status calculations
  const likesCount = userData.likedBy?.length || 0;
  // Convert ObjectIds to strings once for performance
  const likedByIds = userData.likedBy?.map((id: any) => id.toString()) || [];
  const isLikedByCurrentUser = isLoggedIn
    ? likedByIds.includes(session?.user?.id)
    : false;

  // Separate populated friends from IDs
  // When populate has a limit, some entries stay as IDs while others become objects
  // Filter out null/undefined friends (deleted users)
  const allFriends = (userData.friends || []).filter((f: any) => f != null);
  const populatedFriends = allFriends.filter(
    (f: any) => typeof f === "object" && f !== null && f._id
  );
  const friendIds = allFriends.map((f: any) =>
    typeof f === "object" && f !== null ? f._id.toString() : f.toString()
  );
  const friendsCount = friendIds.length;

  // Follower/Following counts
  const followersCount = userData.followers?.length || 0;
  const followingCount = userData.following?.length || 0;

  // Friend request status
  const hasSentFriendRequest = isLoggedIn
    ? userData.friendRequestsReceived?.some(
        (request: any) => request.user.toString() === session?.user?.id
      )
    : false;
  const hasReceivedFriendRequest = isLoggedIn
    ? userData.friendRequestsSent?.some(
        (request: any) => request.user.toString() === session?.user?.id
      )
    : false;

  // Follow status
  const isFollowing = isLoggedIn
    ? userData.followers?.some(
        (followerId: any) => followerId.toString() === session?.user?.id
      )
    : false;

  // Get current user's featured status
  let isCurrentUserFeatured = false;
  if (isLoggedIn && session?.user?.id) {
    const currentUser = (await User.findById(session.user.id)
      .select("isFeaturedProfessional")
      .lean()) as any;
    isCurrentUserFeatured = currentUser?.isFeaturedProfessional || false;
  }

  // Check if current user's ID is in the friends list (handles both populated objects and IDs)
  const isFriend = isLoggedIn ? friendIds.includes(session?.user?.id) : false;

  // Calculate mutual friends if logged in and viewing another user's profile
  let mutualFriends: any[] = [];
  let otherFriends: any[] = populatedFriends; // Friends who are NOT mutual

  if (isLoggedIn && !isOwnProfile && populatedFriends.length > 0) {
    try {
      // Efficient query: Only fetch friend IDs (no population needed)
      const currentUser: any = await User.findById(session?.user?.id)
        .select("friends")
        .lean();

      if (
        currentUser &&
        Array.isArray(currentUser.friends) &&
        currentUser.friends.length > 0
      ) {
        // Convert to string IDs for efficient comparison
        const currentUserFriendIds = new Set(
          currentUser.friends.map((f: any) =>
            typeof f === "object" && f !== null
              ? (f._id || f.id).toString()
              : f.toString()
          )
        );

        // Separate friends into mutual and non-mutual
        mutualFriends = [];
        otherFriends = [];

        populatedFriends.forEach((friend: any) => {
          const friendId = (friend._id || friend.id).toString();
          if (currentUserFriendIds.has(friendId)) {
            mutualFriends.push(friend);
          } else {
            otherFriends.push(friend);
          }
        });
      }
    } catch (error) {
      console.error("Error calculating mutual friends:", error);
      // Continue without mutual friends if there's an error
    }
  }

  // Fetch leaderboard badges
  const leaderboardBadges = await getUserLeaderboardBadges(userId);

  const isProfessional =
    userData.isTeacher ||
    userData.isDJ ||
    userData.isPhotographer ||
    userData.isEventOrganizer ||
    userData.isProducer;

  // JSON-LD structured data for SEO
  const profileRoles = [];
  if (userData.isTeacher) profileRoles.push("Dance Teacher");
  if (userData.isDJ) profileRoles.push("DJ");
  if (userData.isPhotographer) profileRoles.push("Photographer");
  if (userData.isEventOrganizer) profileRoles.push("Event Organizer");
  if (userData.isProducer) profileRoles.push("Producer");

  const profileDanceStyles = userData.danceStyles
    ?.map((ds: any) => ds.danceStyle?.name)
    .filter(Boolean) || [];

  const canonicalPath = `/${userData.username}`;
  const jsonLd: any = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: userData.name,
    url: `https://www.dancecircle.co/${params.locale}${canonicalPath}`,
    ...(userData.image ? { image: userData.image } : {}),
    ...(userData.bio ? { description: userData.bio.substring(0, 200) } : {}),
    ...(profileRoles.length > 0 ? { jobTitle: profileRoles.join(", ") } : {}),
    ...(userData.city?.name ? {
      address: {
        "@type": "PostalAddress",
        addressLocality: userData.city.name,
        addressCountry: userData.city.country?.name,
      },
    } : {}),
    knowsAbout: profileDanceStyles,
  };

  // Add social links if available
  const sameAs = [];
  if (userData.socialMedia?.instagram) sameAs.push(`https://instagram.com/${userData.socialMedia.instagram}`);
  if (userData.socialMedia?.tiktok) sameAs.push(`https://tiktok.com/@${userData.socialMedia.tiktok}`);
  if (userData.socialMedia?.youtube) sameAs.push(userData.socialMedia.youtube);
  if (sameAs.length > 0) jsonLd.sameAs = sameAs;

  const breadcrumbItems = [
    { name: "DanceCircle", url: `https://www.dancecircle.co` },
    ...(userData.city?.country ? [{ name: userData.city.country.name, url: `https://www.dancecircle.co/${params.locale}/country/${userData.city.country.slug || userData.city.country._id}` }] : []),
    ...(userData.city ? [{ name: userData.city.name, url: `https://www.dancecircle.co/${params.locale}/city/${userData.city.slug || userData.city._id}` }] : []),
    { name: userData.name, url: `https://www.dancecircle.co/${params.locale}${canonicalPath}` },
  ];

  return (
    <LikesProvider>
      <div className="min-h-screen p-4 bg-base-100">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(getBreadcrumbJsonLd(breadcrumbItems)) }}
        />
        {/* Track profile views */}
        <ProfileViewTracker profileUserId={userId} />

        <div className="max-w-4xl mx-auto">
          {/* Admin Shared Indicator Badge - Top Right */}
          {isAdminMode && (
            <div className="fixed top-20 right-4 z-40">
              <div
                className={`badge gap-2 ${userData.sharedOnSocialMedia ? "badge-success" : "badge-warning"}`}
              >
                {userData.sharedOnSocialMedia ? "✅ Shared" : "⚠️ Not Shared"}
              </div>
            </div>
          )}

          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
              ✨ {t("profile.meet")}{" "}
              {userData.name?.split(" ")[0] || "This Amazing Dancer"} ✨
            </h1>
            <p className="text-lg text-base-content/80 font-medium">
              {userData.city?.name
                ? `${t("profile.dancingTheirWayThrough")} ${userData.city.name}`
                : "Spreading the love of dance worldwide"}
            </p>
          </div>

          {/* CTA Banner for non-authenticated users */}
          {!isLoggedIn && (
            <div className="alert alert-info shadow-lg mb-6">
              <div className="flex gap-2 items-center">
                <FaHeart className="text-lg" />

                <div className="font-bold">
                  {t("dancer.wantToConnect").replace(
                    "{name}",
                    userData.name?.split(" ")[0] || ""
                  )}
                </div>
              </div>
              {/* </div> */}
              <div className="flex-none">
                <Link
                  href="/api/auth/signin"
                  className="btn btn-sm btn-primary"
                >
                  {t("dancer.createProfile")}
                </Link>
              </div>
            </div>
          )}

          {/* Profile Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Picture & Basic Info */}
            <div className="lg:col-span-1">
              <div className="card bg-base-200 shadow-xl">
                <div className="card-body">
                  <div className="flex flex-row sm:flex-col gap-4">
                    <ProfilePictureModal
                      imageUrl={userData.image}
                      name={userData.name}
                    />
                    <div className="flex-1">
                      <h2 className="card-title text-2xl mb-2">
                        <span className="flex items-center gap-2">
                          {`${userData.name.charAt(0).toUpperCase() + userData.name.slice(1)}${age && !userData.hideAge ? `, ${age}` : ""}`}
                          {userData.isFeaturedProfessional && (
                            <VerifiedBadge size="lg" className="flex-shrink-0" />
                          )}
                        </span>
                      </h2>
                      <div className="flex items-center gap-2 flex-wrap">
                        {userData.isTeacher && (
                          <div className="badge badge-primary badge-md sm:badge-lg gap-1 whitespace-nowrap">
                            🎓 {t("profile.teacher")}
                          </div>
                        )}
                        {userData.isDJ && (
                          <div className="badge badge-secondary badge-md sm:badge-lg gap-1 whitespace-nowrap">
                            🎵 {t("profile.dj")}
                          </div>
                        )}
                        {userData.isPhotographer && (
                          <div className="badge badge-accent badge-md sm:badge-lg gap-1 whitespace-nowrap">
                            📷 {t("profile.photographer")}
                          </div>
                        )}
                        {userData.isEventOrganizer && (
                          <div className="badge badge-info badge-md sm:badge-lg gap-1 whitespace-nowrap">
                            🎪 {t("profile.eventOrganizer")}
                          </div>
                        )}
                        {userData.isProducer && (
                          <div className="badge badge-success badge-md sm:badge-lg gap-1 whitespace-nowrap">
                            🎹 {t("profile.producer")}
                          </div>
                        )}
                      </div>
                      {zodiac && !userData.hideAge && (
                        <div className="mt-1 text-small">
                          <span className="">{zodiac.sign}</span>
                        </div>
                      )}

                      {/* Social Stats */}
                      <div className="mt-2 flex gap-x-2 sm:gap-x-4 gap-y-1 sm:gap-y-2 text-xs sm:text-sm text-base-content/60 flex-wrap">
                        <LikesDisplay
                          targetUserId={userId}
                          initialLikesCount={likesCount}
                        />
                        <span className="whitespace-nowrap">
                          👥 {friendsCount} {t("profile.friends").toLowerCase()}
                        </span>
                        {userData.isFeaturedProfessional && (
                          <span className="whitespace-nowrap">
                            ⭐ {followersCount}{" "}
                            {t("connect.followers").toLowerCase()}
                          </span>
                        )}
                      </div>
                      {/* Current Location */}
                      {userData.city && typeof userData.city === "object" && (
                        <div className="mt-1">
                          <span>📍 </span>
                          <Link
                            href={`/city/${userData.city._id}`}
                            className="link link-primary hover:link-accent"
                          >
                            {userData.city.name}
                          </Link>
                          {userData.city.country && (
                            <>
                              <span>, </span>
                              <Link
                                href={`/country/${userData.city.country._id || userData.city.country.id}`}
                                className="link link-primary hover:link-accent"
                              >
                                {userData.city.country.name}
                              </Link>
                            </>
                          )}
                        </div>
                      )}
                      {/* Nationality */}
                      {userData.nationality && (
                        <div className="mt-4">
                          <div className="text-sm font-medium text-base-content/60">
                            {t("profile.nationality")}
                          </div>
                          <div className="text-md flex items-center gap-2">
                            <Flag
                              countryCode={getCountryCode(userData.nationality)}
                              size="md"
                            />
                            {userData.nationality}
                          </div>
                        </div>
                      )}

                      {/* Connect Button - show for all users except own profile */}
                      {!isOwnProfile && (
                        <div className="mt-4 space-y-2">
                          <ConnectButton
                            targetUserId={userId}
                            isFriend={isFriend}
                            hasSentRequest={hasSentFriendRequest}
                            hasReceivedRequest={hasReceivedFriendRequest}
                            isFeaturedProfessional={
                              userData.isFeaturedProfessional
                            }
                            isFollowing={isFollowing}
                            isCurrentUserFeatured={isCurrentUserFeatured}
                          />
                          {isLoggedIn && (
                            <Link
                              href={`/messages?to=${userId}`}
                              className="btn btn-outline btn-sm w-full"
                            >
                              💬 Send Message
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {isProfessional && <div className="h-4" />}
                  {/* Professional Info - Prominent (Full Width) */}
                  {userData.isTeacher && userData.teacherProfile && (
                    <div className="-mx-[2rem] px-8 py-3 sm:rounded-lg sm:mx-0 sm:px-6 bg-gradient-to-br from-primary/20 to-secondary/20 border-y-2 sm:border-2 border-primary/40">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">🎓</span>
                        <h2 className="font-bold">
                          {t("profile.danceTeacher")}
                        </h2>
                      </div>

                      {userData.teacherProfile.yearsOfExperience !==
                        undefined && (
                        <div className="mb-2">
                          <div className="text-sm text-base-content/70">
                            <span className="font-semibold text-primary">
                              {userData.teacherProfile.yearsOfExperience}
                            </span>{" "}
                            year
                            {userData.teacherProfile.yearsOfExperience !== 1
                              ? "s"
                              : ""}{" "}
                            of teaching
                          </div>
                        </div>
                      )}

                      {userData.teacherProfile.bio && (
                        <div className="mb-2">
                          <p className="text-sm text-base-content/80 italic line-clamp-3">
                            &quot;{userData.teacherProfile.bio}&quot;
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* DJ Info */}
                  {userData.isDJ && userData.djProfile && (
                    <div className="-mx-[2rem] px-8 py-3 sm:rounded-lg sm:mx-0 sm:px-6 bg-gradient-to-br from-secondary/20 to-accent/20 border-y-2 sm:border-2 border-secondary/40">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">🎵</span>
                        <h2 className="font-bold">DJ</h2>
                      </div>

                      {userData.djProfile.djName && (
                        <div className="mb-2">
                          <div className="text-sm text-base-content/70">
                            Known as:{" "}
                            <span className="font-semibold text-secondary">
                              {userData.djProfile.djName}
                            </span>
                          </div>
                        </div>
                      )}

                      {userData.djProfile.genres && (
                        <div className="mb-2">
                          <div className="text-sm text-base-content/70">
                            Genres:{" "}
                            <span className="font-medium">
                              {userData.djProfile.genres}
                            </span>
                          </div>
                        </div>
                      )}

                      {userData.djProfile.bio && (
                        <div className="mb-2">
                          <p className="text-sm text-base-content/80 italic line-clamp-3">
                            &quot;{userData.djProfile.bio}&quot;
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Photographer Info */}
                  {userData.isPhotographer && userData.photographerProfile && (
                    <div className="-mx-[2rem] px-8 py-3 sm:rounded-lg sm:mx-0 sm:px-6 bg-gradient-to-br from-accent/20 to-info/20 border-y-2 sm:border-2 border-accent/40 overflow-hidden">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">📷</span>
                          <h2 className="font-bold">
                            {t("profile.photographer")}
                          </h2>
                        </div>
                      </div>

                      {userData.photographerProfile.specialties && (
                        <div className="mb-2">
                          <div className="text-sm text-base-content/70">
                            Specialties:{" "}
                            <span className="font-medium">
                              {userData.photographerProfile.specialties}
                            </span>
                          </div>
                        </div>
                      )}

                      {userData.photographerProfile.portfolioLink && (
                        <div className="mb-2">
                          <a
                            href={
                              userData.photographerProfile.portfolioLink.startsWith(
                                "http"
                              )
                                ? userData.photographerProfile.portfolioLink
                                : `https://${userData.photographerProfile.portfolioLink}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm link link-accent"
                          >
                            📸 View Portfolio
                          </a>
                        </div>
                      )}

                      {userData.photographerProfile.bio && (
                        <div className="mb-2">
                          <p className="text-sm text-base-content/80 italic line-clamp-3">
                            &quot;{userData.photographerProfile.bio}&quot;
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Event Organizer Info */}
                  {userData.isEventOrganizer &&
                    userData.eventOrganizerProfile && (
                      <div className="-mx-[2rem] px-8 py-3 sm:rounded-lg sm:mx-0 sm:px-6 bg-gradient-to-br from-info/20 to-success/20 border-y-2 sm:border-2 border-info/40 overflow-hidden">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🎪</span>
                            <h2 className="font-bold">Event Organizer</h2>
                          </div>
                        </div>

                        {userData.eventOrganizerProfile.organizationName && (
                          <div className="mb-2">
                            <div className="text-sm text-base-content/70">
                              Organization:{" "}
                              <span className="font-medium">
                                {
                                  userData.eventOrganizerProfile
                                    .organizationName
                                }
                              </span>
                            </div>
                          </div>
                        )}

                        {userData.eventOrganizerProfile.eventTypes && (
                          <div className="mb-2">
                            <div className="text-sm text-base-content/70">
                              Event Types:{" "}
                              <span className="font-medium">
                                {userData.eventOrganizerProfile.eventTypes}
                              </span>
                            </div>
                          </div>
                        )}

                        {userData.eventOrganizerProfile.bio && (
                          <div className="mb-2">
                            <p className="text-sm text-base-content/80 italic line-clamp-3">
                              &quot;{userData.eventOrganizerProfile.bio}&quot;
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                  {/* Producer Info */}
                  {userData.isProducer && userData.producerProfile && (
                    <div className="-mx-[2rem] px-8 py-3 sm:rounded-lg sm:mx-0 sm:px-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-y-2 sm:border-2 border-purple-500/40">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">🎹</span>
                        <h2 className="font-bold">Producer</h2>
                      </div>

                      {userData.producerProfile.producerName && (
                        <div className="mb-2">
                          <div className="text-sm text-base-content/70">
                            Known as:{" "}
                            <span className="font-semibold text-purple-400">
                              {userData.producerProfile.producerName}
                            </span>
                          </div>
                        </div>
                      )}

                      {userData.producerProfile.genres && (
                        <div className="mb-2">
                          <div className="text-sm text-base-content/70">
                            Genres:{" "}
                            <span className="font-medium">
                              {userData.producerProfile.genres}
                            </span>
                          </div>
                        </div>
                      )}

                      {userData.producerProfile.bio && (
                        <div className="mb-2">
                          <p className="text-sm text-base-content/80 italic line-clamp-3">
                            &quot;{userData.producerProfile.bio}&quot;
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Shared Professional Contact */}
                  {isProfessional && userData.professionalContact && (
                    <div className="mt-4 flex flex-wrap gap-2 px-4">
                      {userData.professionalContact.whatsapp && (
                        <a
                          href={`https://wa.me/${userData.professionalContact.whatsapp.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-success btn-sm gap-2"
                        >
                          <FaWhatsapp />
                          WhatsApp
                        </a>
                      )}
                      {userData.professionalContact.email && (
                        <a
                          href={`mailto:${userData.professionalContact.email}`}
                          className="btn btn-outline btn-sm gap-2"
                        >
                          <FaEnvelope />
                          Email
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Detailed Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Admin Controls - Only visible when admin mode is enabled */}
              {isAdminMode && (
                <>
                  <AdminSharedCheckbox
                    userId={userId}
                    initialSharedStatus={userData.sharedOnSocialMedia || false}
                    instagramHandle={userData.socialMedia?.instagram}
                  />

                  <AdminFeaturedCheckbox
                    userId={userId}
                    initialFeaturedStatus={userData.isFeaturedProfessional || false}
                  />

                  {/* Hero Sequence Control */}
                  <div className="card bg-amber-50 dark:bg-amber-950 border-2 border-amber-500 shadow-xl">
                    <div className="card-body">
                      <h2 className="card-title text-amber-800 dark:text-amber-200">
                        🌟 Hero Featured Position
                      </h2>
                      <form
                        action={`/api/admin/users/${userId}/hero-sequence`}
                        method="POST"
                        className="flex gap-2"
                      >
                        <input
                          type="number"
                          name="heroSequence"
                          min="1"
                          max="999"
                          placeholder="e.g., 1 (first position)"
                          defaultValue={userData.heroSequence || ""}
                          className="input input-bordered flex-1"
                        />
                        <button type="submit" className="btn btn-primary">
                          Update
                        </button>
                        <button
                          type="submit"
                          formAction={`/api/admin/users/${userId}/hero-sequence?clear=true`}
                          className="btn btn-ghost"
                        >
                          Clear
                        </button>
                      </form>
                      {userData.heroSequence && (
                        <p className="text-xs text-success mt-2">
                          ✅ Currently featured at position{" "}
                          {userData.heroSequence}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Dance Information */}
              {hasDanceProfileContent && (
                <div className="card bg-base-200 shadow-xl">
                  <div className="card-body">
                    <h2 className="card-title text-xl mb-4">
                      {t("profile.danceProfile")}
                    </h2>

                    {/* Bio */}
                    {userData.bio && userData.bio.trim().length > 0 && (
                    <div className="mb-4">
                      <p className="text-base italic text-base-content/80">
                        &ldquo;{userData.bio}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Dance Role */}
                  {userData.danceRole && (
                    <div className="mb-4">
                      <div className="text-sm font-medium text-base-content/60 mb-1">
                        {t("profile.danceRole")}
                      </div>
                      <div className="text-lg">
                        {getRoleDisplay(userData.danceRole)}
                      </div>
                    </div>
                  )}

                  {/* Relationship Status */}
                  {userData.relationshipStatus && userData.relationshipStatus.trim && userData.relationshipStatus.trim().length > 0 && (
                    <div className="mb-4">
                      <div className="text-sm font-medium text-base-content/60 mb-1">
                        {t("profile.relationshipStatus")}
                      </div>
                      <div className="text-lg">
                        {getRelationshipStatusDisplay(
                          userData.relationshipStatus
                        )}
                      </div>
                    </div>
                  )}

                  {/* Dancing Experience - Only show for dancers */}
                  {!isProfessionalOnly && userData.dancingStartYear && (
                    <div className="mb-4">
                      <div className="text-sm font-medium text-base-content/60 mb-1">
                        {t("profile.dancingExperience")}
                      </div>
                      <div className="text-lg">
                        {new Date().getFullYear() - userData.dancingStartYear}{" "}
                        {t("profile.years")} ({t("profile.since")}{" "}
                        {userData.dancingStartYear})
                      </div>
                    </div>
                  )}

                  {/* Dance Styles - Only show for dancers */}
                  {!isProfessionalOnly &&
                    userData.danceStyles &&
                    userData.danceStyles.length > 0 && (
                      <DanceStyleCard
                        danceStyles={getDanceStylesWithLevels(
                          userData.danceStyles
                        )}
                        title={t("profile.danceStylesLevels")}
                      />
                    )}

                  {/* Cities Visited - Only show for dancers */}
                  {!isProfessionalOnly &&
                    userData.citiesVisited &&
                    userData.citiesVisited.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-base-content/60 mb-2">
                          {t("profile.citiesDancedIn")}
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {userData.citiesVisited.map(
                            (city: any, index: number) => (
                              <Link
                                key={index}
                                href={`/city/${city._id || city}`}
                                className="group"
                              >
                                <div className="flex items-center gap-2 bg-base-300 rounded-md h-10 hover:bg-base-200 transition-colors cursor-pointer">
                                  {city.image ? (
                                    <img
                                      src={city.image}
                                      alt={city.name}
                                      className="h-full aspect-square rounded object-cover"
                                    />
                                  ) : (
                                    <div className="h-full aspect-square rounded bg-primary/20 flex items-center justify-center">
                                      <span className="text-xs">🌍</span>
                                    </div>
                                  )}
                                  <span className="text-sm font-medium pl-2 pr-4 py-2 group-hover:text-primary">
                                    {typeof city === "string"
                                      ? city
                                      : city.name}
                                  </span>
                                </div>
                              </Link>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </div>
              )}

              {/* Achievement Badges - Only show for dancers */}
              {!isProfessionalOnly && (
                <div className="card bg-base-200 shadow-xl">
                  <div className="card-body">
                    <h2 className="card-title text-xl mb-4">
                      🏆 {t("profile.achievementBadges")}
                    </h2>
                    <AchievementBadges
                      badges={calculateUserBadges(userData)}
                      maxDisplay={6}
                    />
                  </div>
                </div>
              )}

              {/* Leaderboard Badges */}
              {leaderboardBadges.length > 0 && (
                <div className="card bg-base-200 shadow-xl">
                  <div className="card-body">
                    <h2 className="card-title text-xl mb-4">
                      🏅 Leaderboard Rankings
                    </h2>
                    <LeaderboardBadges badges={leaderboardBadges} />
                  </div>
                </div>
              )}

              {/* Producer Releases - Public view only (no Add button) */}
              {userData.isProducer && (
                <ProducerReleases
                  producerId={userId}
                  isOwnProfile={false}
                />
              )}

              {/* Jack & Jill Competitions - Read Only Display - Only show for dancers */}
              {!isProfessionalOnly &&
                userData.jackAndJillCompetitions &&
                userData.jackAndJillCompetitions.length > 0 && (
                  <div className="card bg-base-200 shadow-xl">
                    <div className="card-body">
                      <h2 className="card-title text-xl mb-4">
                        🏅 {t("profile.jackAndJill")}
                      </h2>
                      <div className="space-y-3">
                        {userData.jackAndJillCompetitions
                          .sort((a: any, b: any) => {
                            const placementOrder: { [key: string]: number } = {
                              "1st": 1,
                              "2nd": 2,
                              "3rd": 3,
                              participated: 4,
                            };
                            const placementDiff =
                              (placementOrder[a.placement] || 5) -
                              (placementOrder[b.placement] || 5);
                            if (placementDiff !== 0) return placementDiff;
                            return b.year - a.year;
                          })
                          .map((comp: any, index: number) => {
                            const placementEmoji =
                              comp.placement === "1st"
                                ? "🥇"
                                : comp.placement === "2nd"
                                  ? "🥈"
                                  : comp.placement === "3rd"
                                    ? "🥉"
                                    : "🎯";
                            const danceStyleName =
                              typeof comp.danceStyle === "object" &&
                              comp.danceStyle?.name
                                ? comp.danceStyle.name
                                : "Dance";

                            return (
                              <div
                                key={index}
                                className="flex items-start gap-3 p-3 rounded-lg bg-base-300/50 hover:bg-base-300 transition-colors"
                              >
                                <div className="text-3xl flex-shrink-0">
                                  {placementEmoji}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-base truncate">
                                    {comp.eventName}
                                  </h4>
                                  <p className="text-sm text-base-content/70">
                                    {danceStyleName} · {comp.year}
                                    {comp.placement !== "participated" && (
                                      <span className="ml-1 font-semibold text-primary">
                                        · {comp.placement} {t("profile.place")}
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                )}

              {/* Mutual Friends - Show if logged in and viewing another user's profile */}
              {!isOwnProfile && mutualFriends.length > 0 && (
                <MutualFriends
                  mutualFriends={mutualFriends}
                  profileUserName={userData.name?.split(" ")[0]}
                />
              )}

              {/* Friends List - Show other friends (non-mutual if viewing someone else's profile) */}
              <FriendsListSection
                friends={otherFriends}
                totalCount={friendsCount}
              />

              {/* Social Media - Admin Editable or Regular Display */}
              {isAdminMode ? (
                <AdminSocialMediaEdit
                  userId={userId}
                  initialSocialMedia={userData.socialMedia || {}}
                />
              ) : (
                userData.socialMedia &&
                (userData.socialMedia.instagram ||
                  userData.socialMedia.tiktok ||
                  userData.socialMedia.youtube) && (
                  <div className="card bg-base-200 shadow-xl">
                    <div className="card-body">
                      <h2 className="card-title text-xl mb-4">
                        🌐 {t("profile.socialMedia")}
                      </h2>
                      <div className="flex gap-3">
                        {userData.socialMedia.instagram && (
                          <a
                            href={getSocialUrl(
                              "instagram",
                              userData.socialMedia.instagram
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-circle btn-outline hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 hover:text-white hover:border-purple-500"
                            title={`@${userData.socialMedia.instagram.replace("@", "")} on Instagram`}
                          >
                            <FaInstagram className="text-xl" />
                          </a>
                        )}
                        {userData.socialMedia.tiktok && (
                          <a
                            href={getSocialUrl(
                              "tiktok",
                              userData.socialMedia.tiktok
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-circle btn-outline hover:bg-black hover:text-white hover:border-black"
                            title={`@${userData.socialMedia.tiktok.replace("@", "")} on TikTok`}
                          >
                            <FaTiktok className="text-xl" />
                          </a>
                        )}
                        {userData.socialMedia.youtube && (
                          <a
                            href={getSocialUrl(
                              "youtube",
                              userData.socialMedia.youtube
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-circle btn-outline hover:bg-red-600 hover:text-white hover:border-red-600"
                            title="YouTube Channel"
                          >
                            <FaYoutube className="text-xl" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )
              )}

              {/* Upcoming Trips */}
              {(() => {
                const now = new Date();
                const upcomingTrips = (
                  userData.trips?.filter(
                    (trip: any) => new Date(trip.endDate) >= now
                  ) || []
                ).sort((a: any, b: any) => 
                  new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
                ); // Sort by start date (ascending - soonest first)

                if (upcomingTrips.length === 0) return null;

                return (
                  <div className="card bg-base-200 shadow-xl">
                    <div className="card-body">
                      <h2 className="card-title text-xl mb-4">
                        ✈️ Upcoming Trips
                      </h2>
                      <div className="space-y-3">
                        {upcomingTrips.map((trip: any) => (
                          <Link
                            key={trip._id}
                            href={`/city/${trip.city._id}`}
                            className="card bg-base-300 overflow-hidden hover:bg-base-200 transition-colors cursor-pointer block"
                          >
                            <div className="flex items-stretch">
                              {/* City Image or Flag - Full bleed on left */}
                              <div className="w-24 h-24 flex-shrink-0 relative">
                                {trip.city.image ? (
                                  <img
                                    src={trip.city.image}
                                    alt={trip.city.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-base-200">
                                    <div className="text-5xl">
                                      <Flag
                                        countryCode={trip.city.country.code}
                                        size="lg"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Text Content with Padding */}
                              <div className="flex-1 p-4">
                                <h4 className="font-semibold">
                                  {trip.city.name}, {trip.city.country.name}
                                </h4>
                                <p className="text-sm text-base-content/70 mt-1">
                                  {new Date(trip.startDate).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    }
                                  )}{" "}
                                  -{" "}
                                  {new Date(trip.endDate).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    }
                                  )}
                                </p>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Dance Anthem */}
              {userData.anthem && userData.anthem.url && (
                <div className="card bg-base-200 shadow-xl">
                  <div className="card-body">
                    <h2 className="card-title text-xl mb-4">
                      🎵 {t("profile.danceAnthem")}
                    </h2>
                    <div className="rounded-lg">
                      {/* Iframe for Spotify */}
                      {(() => {
                        const url = userData.anthem.url;
                        let embedUrl = "";
                        let embedHeight = "152";

                        if (userData.anthem.platform === "spotify") {
                          // Check for track
                          const trackMatch = url.match(
                            /(?:spotify\.com\/track\/|spotify:track:)([a-zA-Z0-9]+)/
                          );
                          if (trackMatch) {
                            embedUrl = `https://open.spotify.com/embed/track/${trackMatch[1]}`;
                            embedHeight = "152"; // Compact for single track
                          }

                          // Check for playlist
                          const playlistMatch = url.match(
                            /(?:spotify\.com\/playlist\/|spotify:playlist:)([a-zA-Z0-9]+)/
                          );
                          if (playlistMatch) {
                            embedUrl = `https://open.spotify.com/embed/playlist/${playlistMatch[1]}`;
                            embedHeight = "380"; // Full player for playlist
                          }

                          // Check for album
                          const albumMatch = url.match(
                            /(?:spotify\.com\/album\/|spotify:album:)([a-zA-Z0-9]+)/
                          );
                          if (albumMatch) {
                            embedUrl = `https://open.spotify.com/embed/album/${albumMatch[1]}`;
                            embedHeight = "380"; // Full player for album
                          }
                        }

                        return embedUrl ? (
                          <div
                            className="rounded-lg overflow-hidden"
                            style={{ height: `${embedHeight}px` }}
                          >
                            <iframe
                              src={embedUrl}
                              width="100%"
                              height={embedHeight}
                              frameBorder="0"
                              scrolling="no"
                              className="rounded-2xl"
                              style={{ overflow: "hidden" }}
                              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                              loading="lazy"
                            />
                          </div>
                        ) : (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-xs btn-primary"
                          >
                            🎧 Listen
                          </a>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* DJ Events */}
              {userData.isDJ && djEvents.length > 0 && (
                <div className="card bg-base-200 shadow-xl">
                  <div className="card-body">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="card-title text-xl">
                        🎧 DJ Events
                      </h2>
                      {djEvents.length >= 10 && (
                        <Link
                          href={`/dj/${userId}/events`}
                          className="btn btn-sm btn-ghost"
                        >
                          See All
                        </Link>
                      )}
                    </div>
                    <div className="grid gap-3">
                      {djEvents.map((event: any) => (
                        <Link
                          key={event._id}
                          href={`/events/${event._id}`}
                          className="card bg-base-100 hover:bg-base-300 transition-all cursor-pointer"
                        >
                          <div className="card-body p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg">
                                  {event.eventName}
                                </h3>
                                <p className="text-sm text-base-content/70">
                                  📍 {event.venue && `${event.venue} • `}
                                  {event.city}
                                </p>
                                <p className="text-sm text-base-content/60 mt-1">
                                  📅 {new Date(event.eventDate).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </p>
                                {event.totalComments > 0 && (
                                  <div className="flex items-center gap-3 mt-2">
                                    <span className="text-sm">
                                      ⭐ {event.averageRating.toFixed(1)}
                                    </span>
                                    <span className="text-sm text-base-content/60">
                                      💬 {event.totalComments} {event.totalComments === 1 ? "review" : "reviews"}
                                    </span>
                                  </div>
                                )}
                              </div>
                              {event.imageUrl && (
                                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                                  <img
                                    src={event.imageUrl}
                                    alt={event.eventName}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions - only show for non-logged-in users */}
          {!isLoggedIn && (
            <div className="alert alert-info shadow-lg mt-4">
              <div className="flex-1 text-center">
                <h2 className="font-bold text-lg mb-3">
                  ⭐️ Create your dance profile now
                </h2>
                <Link
                  href="/api/auth/signin"
                  className="btn btn-primary btn-sm gap-2"
                >
                  <FaHeart className="text-sm" />
                  Get Started Free
                </Link>
              </div>
            </div>
          )}

          <div className="h-10" />
          {/* Floating Like Button - for all users */}
          {!isOwnProfile && (
            <div className="fixed bottom-6 right-6 z-50">
              <LikeButton
                targetUserId={userId}
                initialLikesCount={likesCount}
                initialIsLiked={isLikedByCurrentUser}
                className="btn btn-lg btn-circle shadow-2xl hover:shadow-3xl bg-white border-2 border-red-200 hover:border-red-300"
              />
            </div>
          )}
        </div>
      </div>
    </LikesProvider>
  );
}

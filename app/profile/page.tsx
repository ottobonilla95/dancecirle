import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { redirect } from "next/navigation";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";
import City from "@/models/City";
import DanceStyle from "@/models/DanceStyle";
import Country from "@/models/Country";
import Continent from "@/models/Continent";
import Link from "next/link";
import { getZodiacSign } from "@/utils/zodiac";
import { getCountryCode } from "@/utils/countries";
import { DANCE_LEVELS } from "@/constants/dance-levels";
import { FaWhatsapp, FaEnvelope } from "react-icons/fa";
import Flag from "@/components/Flag";
import CopyProfileLink from "@/components/CopyProfileLink";
import ProfileQRCode from "@/components/ProfileQRCode";
import AchievementBadges from "@/components/AchievementBadges";
import JackAndJillManager from "@/components/JackAndJillManager";
import CitiesVisitedManager from "@/components/CitiesVisitedManager";
import { calculateUserBadges } from "@/utils/badges";
import WelcomeModal from "@/components/WelcomeModal";
import UpcomingTrips from "@/components/UpcomingTrips";
import { getMessages, getTranslation } from "@/lib/i18n";
import BioSection from "@/components/profile/BioSection";
import DanceStylesSection from "@/components/profile/DanceStylesSection";
import SocialMediaSection from "@/components/profile/SocialMediaSection";
import AnthemSection from "@/components/profile/AnthemSection";
import DJEventsManager from "@/components/profile/DJEventsManager";
import OrganizerEventsManager from "@/components/profile/OrganizerEventsManager";
import DanceRoleSection from "@/components/profile/DanceRoleSection";
import RelationshipStatusSection from "@/components/profile/RelationshipStatusSection";
import DancingExperienceSection from "@/components/profile/DancingExperienceSection";
import ProfilePictureSection from "@/components/profile/ProfilePictureSection";
import NameSection from "@/components/profile/NameSection";
import BirthDetailsSection from "@/components/profile/BirthDetailsSection";
import HomeLocationSection from "@/components/profile/HomeLocationSection";
import NationalitySection from "@/components/profile/NationalitySection";
import ProfessionalSetupSection from "@/components/profile/ProfessionalSetupSection";
import LeaderboardBadges from "@/components/LeaderboardBadges";
import { getUserLeaderboardBadges } from "@/utils/leaderboard-badges";
import ProducerReleases from "@/components/ProducerReleases";
import VerifiedBadge from "@/components/VerifiedBadge";
import DiscoverySettings from "@/components/DiscoverySettings";

interface ProfileProps {
  searchParams: { welcome?: string };
}

export default async function Profile({ searchParams }: ProfileProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin");
  }

  // Get translations
  const messages = await getMessages();
  const t = (key: string) => getTranslation(messages, key);

  // Fetch user data server-side
  await connectMongo();

  const user = await User.findById(session.user.id)
    .select(
      "name firstName lastName username email image dateOfBirth hideAge bio dancingStartYear city citiesVisited trips danceStyles anthem socialMedia danceRole gender nationality relationshipStatus isTeacher isDJ isPhotographer isEventOrganizer isProducer teacherProfile djProfile photographerProfile eventOrganizerProfile producerProfile professionalContact friends likedBy jackAndJillCompetitions createdAt isFeaturedProfessional followers following userType activeCity openToMeetTravelers lookingForPracticePartners"
    )
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
      path: "activeCity",
      model: City,
      select: "name country",
      populate: {
        path: "country",
        model: Country,
        select: "name code",
      },
    })
    .populate({
      path: "citiesVisited",
      model: City,
      select: "name country continent rank image",
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

  // Fetch leaderboard badges
  const leaderboardBadges = await getUserLeaderboardBadges(session.user.id);

  // Fetch and sort dance styles (null/undefined sequences go last)
  let danceStyles = await DanceStyle.find({}).lean();
  danceStyles = danceStyles.sort((a: any, b: any) => {
    const seqA = a.sequence ?? Infinity;
    const seqB = b.sequence ?? Infinity;
    if (seqA !== seqB) return seqA - seqB;
    return a.name.localeCompare(b.name);
  });

  if (!user) {
    redirect("/dashboard");
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
        name: styleName,
        level: userStyle.level,
        levelLabel: levelInfo?.label || "Beginner",
        levelEmoji: levelInfo?.emoji || "🌱",
        description: styleDescription,
        id:
          typeof userStyle.danceStyle === "object"
            ? userStyle.danceStyle._id || userStyle.danceStyle.id
            : userStyle.danceStyle,
      };
    });
  };

  // Type cast to avoid Mongoose lean() typing issues
  const userData = user as any;

  // Check if user is professional-only
  const isProfessionalOnly = userData.userType === "professional";

  const zodiac = userData.dateOfBirth
    ? getZodiacSign(userData.dateOfBirth)
    : null;
  const age = userData.dateOfBirth ? getAge(userData.dateOfBirth) : null;

  // Social stats
  const friendsCount = userData.friends?.length || 0;
  const likesCount = userData.likedBy?.length || 0;
  const followersCount = userData.followers?.length || 0;
  const followingCount = userData.following?.length || 0;

  const isProfessional =
    userData.isTeacher ||
    userData.isDJ ||
    userData.isPhotographer ||
    userData.isEventOrganizer ||
    userData.isProducer;

  // Check if there's any actual content to show in Dance Profile section
  const hasDanceProfileContent =
    (userData.bio && userData.bio.trim().length > 0) ||
    (userData.relationshipStatus && userData.relationshipStatus.trim && userData.relationshipStatus.trim().length > 0) ||
    (!isProfessionalOnly && userData.danceRole) ||
    (!isProfessionalOnly && userData.dancingStartYear) ||
    (!isProfessionalOnly && userData.danceStyles && userData.danceStyles.length > 0) ||
    (!isProfessionalOnly && userData.citiesVisited && userData.citiesVisited.length > 0);

  return (
    <div className="min-h-screen p-4 bg-base-100">
      {/* Welcome Modal */}
      <WelcomeModal
        userName={userData.name || userData.username}
        userUsername={userData.username}
        userImage={userData.image}
        userData={{
          id: userData._id,
          name: userData.name,
          username: userData.username,
          profilePicture: userData.image || "/default-avatar.png",
          dateOfBirth: userData.dateOfBirth,
          hideAge: userData.hideAge,
          bio: userData.bio,
          nationality: userData.nationality,
          danceRole: userData.danceRole,
          city: userData.city
            ? {
                name: userData.city.name,
                country: { name: userData.city.country?.name || "" },
                image: userData.city.image,
              }
            : { name: "", country: { name: "" } },
          danceStyles: getDanceStylesWithLevels(userData.danceStyles || []).map(
            (s) => ({
              name: s.name,
              level: s.levelLabel || s.level,
            })
          ),
        }}
        showWelcome={searchParams?.welcome === "true"}
      />

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">{t("profile.myProfile")}</h1>
          <p className="text-base-content/70">
            {t("profile.yourDanceJourney")}
          </p>
        </div>

        {/* Profile Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Picture & Basic Info */}
          <div className="lg:col-span-1">
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <div className="flex flex-row sm:flex-col gap-4">
                  <ProfilePictureSection
                    initialImage={userData.image}
                    userName={userData.name}
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="card-title text-2xl mb-1 flex items-center gap-2">
                        {userData.firstName && userData.lastName
                          ? `${userData.firstName} ${userData.lastName}${!userData.hideAge && age !== null ? `, ${age}` : ""}`
                          : `${userData.name?.charAt(0)?.toUpperCase() + userData.name?.slice(1)}${!userData.hideAge && age !== null ? `, ${age}` : ""}`}
                        {userData.isFeaturedProfessional && (
                          <VerifiedBadge size="md" />
                        )}
                      </h2>
                      {userData.isTeacher && (
                        <div className="badge badge-primary badge-md sm:badge-lg gap-1">
                          🎓 {t("profile.teacher")}
                        </div>
                      )}
                      {userData.isDJ && (
                        <div className="badge badge-secondary badge-md sm:badge-lg gap-1">
                          🎵 {t("profile.dj")}
                        </div>
                      )}
                      {userData.isPhotographer && (
                        <div className="badge badge-accent badge-md sm:badge-lg gap-1">
                          📷 {t("profile.photographer")}
                        </div>
                      )}
                      {userData.isEventOrganizer && (
                        <div className="badge badge-info badge-md sm:badge-lg gap-1">
                          🎪 Event Organizer
                        </div>
                      )}
                      {userData.isProducer && (
                        <div className="badge badge-success badge-md sm:badge-lg gap-1">
                          🎹 {t("profile.producer")}
                        </div>
                      )}
                    </div>
                    {zodiac && !userData.hideAge && (
                      <div className="mt-1 text-small">
                        <span className="">{zodiac.sign}</span>
                      </div>
                    )}
                    {/* Current Location */}
                    {userData.city && typeof userData.city === "object" && (
                      <div className="mt-1">
                        <span>📍 </span>
                        <Link
                          href={`/city/${userData.city._id || userData.city.id}`}
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

                    {/* Social Stats */}
                    <div className="mt-2 flex gap-4 text-sm text-base-content/60 flex-wrap">
                      <span>❤️ {likesCount}</span>
                      <span>👥 {friendsCount}</span>
                      {userData.isFeaturedProfessional && (
                        <span>
                          ⭐ {followersCount}{" "}
                          {t("connect.followers").toLowerCase()}
                        </span>
                      )}
                      {!userData.isFeaturedProfessional &&
                        followingCount > 0 && (
                          <span>⭐ {followingCount} following</span>
                        )}
                    </div>
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
                  </div>
                </div>

                {isProfessional && <div className="h-4" />}

                {/* Professional Info - Prominent (Full Width) */}
                {userData.isTeacher && userData.teacherProfile && (
                  <div className="mt-4 -mx-8 sm:mx-0 px-6 py-3 sm:px-5 bg-gradient-to-br from-primary/20 to-secondary/20 sm:rounded-lg border-y-2 sm:border-2 border-primary/40">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">🎓</span>
                      <h3 className="font-bold text-base">
                        {t("profile.danceTeacher")}
                      </h3>
                    </div>

                    {userData.teacherProfile.yearsOfExperience !==
                      undefined && (
                      <div className="mb-1.5">
                        <div className="text-sm text-base-content/70">
                          <span className="font-semibold text-primary">
                            {userData.teacherProfile.yearsOfExperience}
                          </span>{" "}
                          year
                          {userData.teacherProfile.yearsOfExperience !== 1
                            ? "s"
                            : ""}{" "}
                          of teaching experience
                        </div>
                      </div>
                    )}

                    {userData.teacherProfile.bio && (
                      <div>
                        <p className="text-sm text-base-content/80 italic">
                          &quot;{userData.teacherProfile.bio}&quot;
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* DJ Info */}
                {userData.isDJ && userData.djProfile && (
                  <div className="-mx-8 sm:mx-0 px-6 py-3 sm:px-5 bg-gradient-to-br from-secondary/20 to-accent/20 sm:rounded-lg border-y-2 sm:border-2 border-secondary/40">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">🎵</span>
                      <h3 className="font-bold text-base">
                        {t("profile.djProfile")}
                      </h3>
                    </div>

                    {userData.djProfile.djName && (
                      <div className="mb-1.5">
                        <div className="text-sm text-base-content/70">
                          Known as:{" "}
                          <span className="font-semibold text-secondary">
                            {userData.djProfile.djName}
                          </span>
                        </div>
                      </div>
                    )}

                    {userData.djProfile.genres && (
                      <div className="mb-1.5">
                        <div className="text-sm text-base-content/70">
                          Genres:{" "}
                          <span className="font-medium">
                            {userData.djProfile.genres}
                          </span>
                        </div>
                      </div>
                    )}

                    {userData.djProfile.bio && (
                      <div>
                        <p className="text-sm text-base-content/80 italic">
                          &quot;{userData.djProfile.bio}&quot;
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Photographer Info */}
                {userData.isPhotographer && userData.photographerProfile && (
                  <div className="-mx-8 sm:mx-0 px-6 py-3 sm:px-5 bg-gradient-to-br from-accent/20 to-info/20 sm:rounded-lg border-y-2 sm:border-2 border-accent/40">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">📷</span>
                      <h3 className="font-bold text-base">
                        {t("profile.photographer")}
                      </h3>
                    </div>

                    {userData.photographerProfile.specialties && (
                      <div className="mb-1.5">
                        <div className="text-sm text-base-content/70">
                          Specialties:{" "}
                          <span className="font-medium">
                            {userData.photographerProfile.specialties}
                          </span>
                        </div>
                      </div>
                    )}

                    {userData.photographerProfile.portfolioLink && (
                      <div className="mb-1.5">
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
                      <div>
                        <p className="text-sm text-base-content/80 italic">
                          &quot;{userData.photographerProfile.bio}&quot;
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Event Organizer Info */}
                {userData.isEventOrganizer &&
                  userData.eventOrganizerProfile && (
                    <div className="-mx-8 sm:mx-0 px-6 py-3 sm:px-5 bg-gradient-to-br from-info/20 to-success/20 sm:rounded-lg border-y-2 sm:border-2 border-info/40">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">🎪</span>
                        <h3 className="font-bold text-base">Event Organizer</h3>
                      </div>

                      {userData.eventOrganizerProfile.organizationName && (
                        <div className="mb-1.5">
                          <div className="text-sm text-base-content/70">
                            Organization:{" "}
                            <span className="font-medium">
                              {userData.eventOrganizerProfile.organizationName}
                            </span>
                          </div>
                        </div>
                      )}

                      {userData.eventOrganizerProfile.eventTypes && (
                        <div className="mb-1.5">
                          <div className="text-sm text-base-content/70">
                            Event Types:{" "}
                            <span className="font-medium">
                              {userData.eventOrganizerProfile.eventTypes}
                            </span>
                          </div>
                        </div>
                      )}

                      {userData.eventOrganizerProfile.bio && (
                        <div>
                          <p className="text-sm text-base-content/80 italic">
                            &quot;{userData.eventOrganizerProfile.bio}&quot;
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                {/* Producer Info */}
                {userData.isProducer && userData.producerProfile && (
                  <div className="-mx-8 sm:mx-0 px-6 py-3 sm:px-5 bg-gradient-to-br from-purple-500/20 to-pink-500/20 sm:rounded-lg border-y-2 sm:border-2 border-purple-500/40">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">🎹</span>
                      <h3 className="font-bold text-base">Producer</h3>
                    </div>

                    {userData.producerProfile.producerName && (
                      <div className="mb-1.5">
                        <div className="text-sm text-base-content/70">
                          Known as:{" "}
                          <span className="font-semibold text-purple-400">
                            {userData.producerProfile.producerName}
                          </span>
                        </div>
                      </div>
                    )}

                    {userData.producerProfile.genres && (
                      <div className="mb-1.5">
                        <div className="text-sm text-base-content/70">
                          Genres:{" "}
                          <span className="font-medium">
                            {userData.producerProfile.genres}
                          </span>
                        </div>
                      </div>
                    )}

                    {userData.producerProfile.bio && (
                      <div>
                        <p className="text-sm text-base-content/80 italic">
                          &quot;{userData.producerProfile.bio}&quot;
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Shared Professional Contact */}
                {isProfessional && userData.professionalContact && (
                  <div className="mt-6 flex flex-wrap gap-2 px-0">
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

                {/* Profile Actions */}
                <div className="mt-6 space-y-3">
                  <Link
                    href="/onboarding?mode=edit"
                    className="btn btn-secondary btn-sm w-full"
                  >
                    ✏️ {t("profile.editProfile")}
                  </Link>

                  <Link
                    href={`/dancer/${userData._id}`}
                    className="btn btn-primary btn-sm w-full gap-2"
                  >
                    👁️ {t("profile.viewMyProfile")}
                  </Link>

                  <CopyProfileLink username={userData.username} />

                  <ProfileQRCode
                    userId={userData._id}
                    userName={userData.name}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body space-y-5">
                <h3 className="card-title text-xl">Basic Info</h3>
                <NameSection
                  initialFirstName={userData.firstName}
                  initialLastName={userData.lastName}
                />
                <BirthDetailsSection
                  initialDateOfBirth={userData.dateOfBirth}
                  initialHideAge={userData.hideAge}
                />
                <HomeLocationSection initialCity={userData.city} />
                <NationalitySection initialNationality={userData.nationality} />
              </div>
            </div>

            <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <h3 className="card-title text-xl mb-2">Professional Setup</h3>
                <ProfessionalSetupSection
                  initialIsTeacher={userData.isTeacher}
                  initialIsDJ={userData.isDJ}
                  initialIsPhotographer={userData.isPhotographer}
                  initialIsEventOrganizer={userData.isEventOrganizer}
                  initialIsProducer={userData.isProducer}
                  initialTeacherProfile={userData.teacherProfile}
                  initialDjProfile={userData.djProfile}
                  initialPhotographerProfile={userData.photographerProfile}
                  initialEventOrganizerProfile={userData.eventOrganizerProfile}
                  initialProducerProfile={userData.producerProfile}
                  initialProfessionalContact={userData.professionalContact}
                />
              </div>
            </div>

            {/* Dance Information - Only show if there's actual content */}
            {hasDanceProfileContent && (
              <div className="card bg-base-200 shadow-xl">
                <div className="card-body">
                  <h3 className="card-title text-xl mb-4">
                    {t("profile.danceProfile")}
                  </h3>

                  {/* Bio */}
                  {userData.bio && userData.bio.trim().length > 0 && (
                    <BioSection initialBio={userData.bio} />
                  )}

                  {/* Dance Role - Only for dancers */}
                  {!isProfessionalOnly && userData.danceRole && (
                    <DanceRoleSection initialDanceRole={userData.danceRole} />
                  )}

                  {/* Relationship Status */}
                  {userData.relationshipStatus && userData.relationshipStatus.trim && userData.relationshipStatus.trim().length > 0 && (
                    <RelationshipStatusSection
                      initialRelationshipStatus={userData.relationshipStatus}
                    />
                  )}

                  {/* Dancing Experience - Only for dancers */}
                  {!isProfessionalOnly && userData.dancingStartYear && (
                    <DancingExperienceSection
                      initialDancingStartYear={userData.dancingStartYear}
                    />
                  )}

                  {/* Dance Styles - Only for dancers */}
                  {!isProfessionalOnly &&
                    userData.danceStyles &&
                    userData.danceStyles.length > 0 && (
                      <div className="mb-8">
                        <DanceStylesSection
                          initialDanceStyles={getDanceStylesWithLevels(
                            userData.danceStyles || []
                          )}
                        />
                      </div>
                    )}

                  {/* Cities Visited - Only for dancers */}
                  {!isProfessionalOnly &&
                    userData.citiesVisited &&
                    userData.citiesVisited.length > 0 && (
                      <CitiesVisitedManager
                        cities={userData.citiesVisited || []}
                      />
                    )}
                </div>
              </div>
            )}

            {/* Achievement Badges - Only show for dancers */}
            {!isProfessionalOnly && (
              <div className="card bg-base-200 shadow-xl">
                <div className="card-body">
                  <h3 className="card-title text-xl mb-4">
                    🏆 {t("profile.achievementBadges")}
                  </h3>
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
                  <h3 className="card-title text-xl mb-4">
                    🏅 Leaderboard Rankings
                  </h3>
                  <LeaderboardBadges badges={leaderboardBadges} />
                </div>
              </div>
            )}

            {/* Jack & Jill Competitions - Only show for dancers */}
            {!isProfessionalOnly && (
              <JackAndJillManager
                competitions={userData.jackAndJillCompetitions || []}
                danceStyles={
                  userData.danceStyles?.map((ds: any) => ({
                    _id:
                      typeof ds.danceStyle === "object"
                        ? ds.danceStyle._id
                        : ds.danceStyle,
                    name:
                      typeof ds.danceStyle === "object"
                        ? ds.danceStyle.name
                        : danceStyles.find(
                            (style: any) => style._id === ds.danceStyle
                          )?.name || "",
                  })) || []
                }
                isOwnProfile={true}
              />
            )}

            {/* Producer Releases */}
            {userData.isProducer && (
              <ProducerReleases
                producerId={userData._id}
                isOwnProfile={true}
              />
            )}

            {/* Member Since */}
            {/* <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <h3 className="card-title text-xl mb-4">📅 Membership</h3>
                <div>
                  <div className="text-sm font-medium text-base-content/60">
                    Member Since
                  </div>
                  <div className="text-lg font-semibold">
                    {formatDate(userData.createdAt)}
                  </div>
                </div>
              </div>
            </div> */}

            {/* Social Media */}
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <SocialMediaSection initialSocialMedia={userData.socialMedia} />
              </div>
            </div>

            {/* Upcoming Trips */}
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <UpcomingTrips editable={true} />
              </div>
            </div>

            {/* Discovery Settings */}
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <DiscoverySettings
                  initialActiveCity={userData.activeCity || userData.city}
                  initialTravelMode={userData.openToMeetTravelers || false}
                  initialOpenToPractice={userData.lookingForPracticePartners || false}
                />
              </div>
            </div>

            {/* Dance Anthem */}
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <AnthemSection initialAnthem={userData.anthem} />
              </div>
            </div>

            {/* DJ Events Manager - Only for DJs */}
            {userData.isDJ && (
              <div className="card bg-base-200 shadow-xl">
                <div className="card-body">
                  <DJEventsManager />
                </div>
              </div>
            )}

            {/* Organizer Events Manager - Only for Event Organizers */}
            {userData.isEventOrganizer && (
              <div className="card bg-base-200 shadow-xl">
                <div className="card-body">
                  <OrganizerEventsManager />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="text-center mt-8">
          <Link href="/dashboard" className="btn btn-primary btn-lg">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

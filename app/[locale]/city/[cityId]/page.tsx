import { notFound, permanentRedirect } from "next/navigation";
import { getBreadcrumbJsonLd } from "@/libs/seo";
import connectMongo from "@/libs/mongoose";
import City from "@/models/City";
import Country from "@/models/Country";
import Continent from "@/models/Continent";
import User from "@/models/User";
import DanceStyle from "@/models/DanceStyle";
import OrganizerEvent from "@/models/OrganizerEvent";
import { isValidObjectId } from "mongoose";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { Link } from "@/navigation";
import Pagination from "@/components/Pagination";
import DancersFilter from "@/components/DancersFilter";
import { getMessages, getTranslation, tReplace, type Locale } from "@/lib/i18n";
import {
  FaMapMarkerAlt,
  FaCalendar,
  FaUsers,
  FaGlobeAmericas,
  FaHeart,
  FaMusic,
  FaWhatsapp,
  FaFacebook,
  FaInstagram,
  FaGlobe,
} from "react-icons/fa";
import { SiLine, SiTelegram } from "react-icons/si";

// Helper: find city by slug or ObjectId
// Note: isValidObjectId treats any 12-char string as valid (e.g. "paris-france"),
// so we check for 24-char hex strings which are actual MongoDB ObjectId strings.
function findCityByParam(cityId: string) {
  if (/^[0-9a-fA-F]{24}$/.test(cityId)) {
    return City.findById(cityId);
  }
  // Try slug lookup
  return City.findOne({ slug: cityId });
}

interface Props {
  params: {
    locale: string;
    cityId: string;
  };
  searchParams: {
    page?: string;
  };
}

// Hardcoded most popular dance styles for SEO
const SEO_DANCE_STYLES = ["Bachata", "Salsa", "Kizomba", "Zouk", "Urban Kiz", "Bachazouk"];

// Cache this page for 1 hour (3600 seconds) - reduces function invocations significantly!
export const revalidate = 3600;

// Generate dynamic SEO metadata
export async function generateMetadata({ params }: Props) {
  const locale = params.locale as Locale;
  const messages = await getMessages(locale);
  const mt = (key: string) => getTranslation(messages, key);

  await connectMongo();

  try {
    const city: any = await findCityByParam(params.cityId)
      ?.populate({
        path: "country",
        model: Country,
        select: "name code slug",
      })
      ?.lean();

    if (!city) {
      return {
        title: mt('meta.city.notFound'),
      };
    }

    const cityObjectId = city._id;
    const totalDancers = await User.countDocuments({
      city: cityObjectId,
      isProfileComplete: true,
    });

    // Use hardcoded popular dance styles for SEO
    const danceStylesText = SEO_DANCE_STYLES.join(", ");
    const topStyles = SEO_DANCE_STYLES.slice(0, 3).join(", ");

    const citySlug = city.slug || city._id.toString();
    const title = tReplace(mt('meta.city.title'), { cityName: city.name, topStyles });
    const description = tReplace(mt('meta.city.description'), { count: totalDancers, cityName: city.name, countryName: city.country?.name || '', styles: danceStylesText });

    return {
      title,
      description,
      keywords: `${city.name} dance, ${city.name} dancers, ${danceStylesText}, dance community ${city.name}, ${city.name} ${city.country?.name} dance, dance partners ${city.name}, dance classes ${city.name}`,
      alternates: {
        canonical: `https://www.dancecircle.co/${params.locale}/city/${citySlug}`,
        languages: {
          en: `https://www.dancecircle.co/en/city/${citySlug}`,
          es: `https://www.dancecircle.co/es/city/${citySlug}`,
        },
      },
      openGraph: {
        title,
        description,
        url: `https://www.dancecircle.co/city/${citySlug}`,
        images: city.image ? [city.image] : [],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: city.image ? [city.image] : [],
      },
    };
  } catch (error) {
    console.error("Error generating city metadata:", error);
    return {
      title: mt('meta.city.fallback'),
    };
  }
}

export default async function CityPage({ params, searchParams }: Props) {
  await connectMongo();

  // Get translations
  const messages = await getMessages();
  const t = (key: string) => getTranslation(messages, key);

  // Get current session
  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session;

  // Get current user's dance styles for filtering
  let userDanceStyles: string[] = [];
  if (session?.user?.id) {
    const currentUser: any = await User.findById(session.user.id)
      .select("danceStyles")
      .lean();
    if (currentUser?.danceStyles && Array.isArray(currentUser.danceStyles)) {
      userDanceStyles = currentUser.danceStyles.map((ds: any) =>
        ds.danceStyle.toString()
      );
    }
  }

  // Pagination setup
  const currentPage = parseInt(searchParams.page || "1");
  const dancersPerPage = 12;
  const skip = (currentPage - 1) * dancersPerPage;

  let city: any;
  try {
    city = await findCityByParam(params.cityId)
      ?.populate({
        path: "country",
        model: Country,
        select: "name code slug",
      })
      ?.populate({
        path: "continent",
        model: Continent,
        select: "name slug",
      })
      ?.lean();

    if (!city) {
      notFound();
    }

    // If accessed by ObjectId but city has a slug, redirect to slug URL (SEO)
    if (/^[0-9a-fA-F]{24}$/.test(params.cityId) && city.slug) {
      permanentRedirect(`/${params.locale}/city/${city.slug}`);
    }
  } catch (error) {
    // redirect() throws a special error in Next.js, let it propagate
    if ((error as any)?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("Error fetching city:", error);
    notFound();
  }

  // Use the city's actual ObjectId for MongoDB queries
  const cityObjectId = city._id;

  // Get ALL dancers in this city (locals + travelers)
  // Locals: home city matches
  // Travelers: activeCity matches AND openToMeetTravelers = true
  let dancers: any[] = await User.find({
    isProfileComplete: true,
    $or: [
      { city: cityObjectId }, // Locals
      { activeCity: cityObjectId, openToMeetTravelers: true }, // Travelers
    ],
  })
    .select("name username image danceStyles dateOfBirth hideAge nationality dancingStartYear danceRole socialMedia likedBy openToMeetTravelers lookingForPracticePartners activeCity city isTeacher isDJ isPhotographer isEventOrganizer isProducer isFeaturedProfessional jackAndJillCompetitions bio sharedOnSocialMedia")
    .populate({
      path: "danceStyles.danceStyle",
      model: DanceStyle,
      select: "name",
    })
    .lean();

  // Sort dancers: professionals (teachers, DJs, photographers, event organizers, producers) by likes, then regular dancers
  dancers.sort((a, b) => {
    const aIsProfessional = a.isTeacher || a.isDJ || a.isPhotographer || a.isEventOrganizer || a.isProducer;
    const bIsProfessional = b.isTeacher || b.isDJ || b.isPhotographer || b.isEventOrganizer || b.isProducer;
    const aLikes = a.likedBy?.length || 0;
    const bLikes = b.likedBy?.length || 0;

    // If both are professionals or both are not, sort by likes
    if (aIsProfessional === bIsProfessional) {
      return bLikes - aLikes; // Descending order (most likes first)
    }
    
    // Professionals come first
    return aIsProfessional ? -1 : 1;
  });

  // Get dance styles popular in this city
  const danceStylesInCity = await User.aggregate([
    { $match: { city: cityObjectId, isProfileComplete: true } },
    { $unwind: "$danceStyles" },
    { $group: { _id: "$danceStyles.danceStyle", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: "dancestyles",
        localField: "_id",
        foreignField: "_id",
        as: "style",
      },
    },
    { $unwind: "$style" },
    { $project: { name: "$style.name", slug: "$style.slug", count: 1 } },
  ]);

  // Calculate some stats
  const totalDancers = await User.countDocuments({
    city: cityObjectId,
    isProfileComplete: true,
  });

  const totalDancersWhoVisited = await User.countDocuments({
    citiesVisited: cityObjectId,
    isProfileComplete: true,
  });

  // Get role distribution
  const roleDistribution = await User.aggregate([
    { $match: { city: cityObjectId, isProfileComplete: true } },
    { $group: { _id: "$danceRole", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // Find most common role
  const mostCommonRole = roleDistribution.length > 0 ? roleDistribution[0] : null;
  const rolePercentage = mostCommonRole && totalDancers > 0 
    ? Math.round((mostCommonRole.count / totalDancers) * 100) 
    : 0;
  const roleLabel = mostCommonRole?._id 
    ? mostCommonRole._id.charAt(0).toUpperCase() + mostCommonRole._id.slice(1)
    : "N/A";

  // Get teachers in this city
  const teachers = await User.find({
    city: cityObjectId,
    isProfileComplete: true,
    isTeacher: true,
  })
    .select("name username image danceStyles teacherProfile")
    .populate({
      path: "danceStyles.danceStyle",
      model: DanceStyle,
      select: "name",
    })
    .limit(10)
    .lean();

  // Get DJs in this city
  const djs = await User.find({
    city: cityObjectId,
    isProfileComplete: true,
    isDJ: true,
  })
    .select("name username image djProfile")
    .limit(10)
    .lean();

  // Get photographers in this city
  const photographers = await User.find({
    city: cityObjectId,
    isProfileComplete: true,
    isPhotographer: true,
  })
    .select("name username image photographerProfile")
    .limit(10)
    .lean();

  // Get event organizers in this city
  const eventOrganizers = await User.find({
    city: cityObjectId,
    isProfileComplete: true,
    isEventOrganizer: true,
  })
    .select("name username image eventOrganizerProfile")
    .limit(10)
    .lean();

  // Get producers in this city
  const producers = await User.find({
    city: cityObjectId,
    isProfileComplete: true,
    isProducer: true,
  })
    .select("name username image producerProfile")
    .limit(10)
    .lean();

  const upcomingEvents = await OrganizerEvent.find({
    city: cityObjectId,
    startsAt: { $gte: new Date() },
    isPublished: true,
  })
    .select(
      "title venue startsAt flyerUrl priceAmount priceCurrency ticketUrl danceStyles organizerId"
    )
    .populate({
      path: "organizerId",
      model: User,
      select: "name username",
    })
    .sort({ startsAt: 1 })
    .limit(10)
    .lean();

  // Get most liked dancers in this city
  const mostLikedDancers = await User.aggregate([
    { 
      $match: { 
        city: cityObjectId, 
        isProfileComplete: true 
      } 
    },
    {
      $addFields: {
        likesCount: { $size: { $ifNull: ["$likedBy", []] } }
      }
    },
    { $match: { likesCount: { $gt: 0 } } },
    { $sort: { likesCount: -1 } },
    { $limit: 10 },
    {
      $project: {
        name: 1,
        username: 1,
        image: 1,
        likesCount: 1
      }
    }
  ]);

  // Pagination calculations
  const totalPages = Math.ceil(totalDancers / dancersPerPage);

  // Format population
  const formatNumber = (num: number | null | undefined) => {
    if (!num || num === 0) {
      return "Unknown";
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  // JSON-LD structured data for SEO
  const citySlug = city.slug || city._id.toString();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: `${city.name} Dance Community`,
    description: `Connect with ${totalDancers} dancers in ${city.name}, ${city.country?.name}. Find Bachata, Salsa, Kizomba partners, classes, and events.`,
    url: `https://www.dancecircle.co/city/${citySlug}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: city.name,
      addressCountry: city.country?.name,
    },
    ...(city.coordinates?.lat && city.coordinates?.lng
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: city.coordinates.lat,
            longitude: city.coordinates.lng,
          },
        }
      : {}),
    ...(city.image ? { image: city.image } : {}),
  };

  const breadcrumbItems = [
    { name: "DanceCircle", url: `https://www.dancecircle.co` },
    { name: t('breadcrumb.countries'), url: `https://www.dancecircle.co/countries` },
    ...(city.country ? [{ name: city.country.name, url: `https://www.dancecircle.co/country/${city.country.slug || city.country._id}` }] : []),
    { name: city.name, url: `https://www.dancecircle.co/city/${citySlug}` },
  ];

  return (
    <div className="min-h-screen p-4 bg-base-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getBreadcrumbJsonLd(breadcrumbItems)) }}
      />
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            {city.image && (
              <div className="w-20 h-20 rounded-lg overflow-hidden shadow-lg">
                <img
                  src={city.image}
                  alt={city.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
                {city.name}
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-base-content/70">
                <span className="flex items-center gap-1">
                  <FaMapMarkerAlt />
                  <Link 
                    href={`/country/${city.country?.slug || city.country?._id || city.country?.id}`}
                    className="link link-primary hover:link-accent whitespace-nowrap"
                  >
                    {city.country?.name}
                  </Link>
                  {city.continent && (
                    <>
                      {", "}
                      <Link 
                        href={`/continent/${city.continent?.slug || city.continent?._id || city.continent?.id}`}
                        className="link link-primary hover:link-accent whitespace-nowrap"
                      >
                        {city.continent?.name}
                      </Link>
                    </>
                  )}
                </span>
                <span className="flex items-center gap-1">
                  <FaUsers />
                  {formatNumber(totalDancers)} {t('city.dancersShort')}
                </span>
              </div>
            </div>
          </div>

          {city.description && (
            <p className="text-lg text-base-content/80 max-w-3xl">
              {city.description}
            </p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6 mb-8">
          <div className="stat bg-base-200 rounded-lg p-3 sm:p-4">
            <div className="stat-figure text-primary">
              <FaMusic className="text-2xl sm:text-3xl" />
            </div>
            <div className="stat-title text-xs sm:text-sm">
              <span className="sm:hidden">{t('city.dancersShort')}</span>
              <span className="hidden sm:inline">{t('city.dancersLivingHere')}</span>
            </div>
            <div className="stat-value text-primary text-xl sm:text-3xl leading-tight">{totalDancers}</div>
            <div className="stat-desc hidden sm:block">{t('city.activeCommunity')}</div>
          </div>

          <div className="stat bg-base-200 rounded-lg p-3 sm:p-4">
            <div className="stat-figure text-secondary">
              <FaGlobeAmericas className="text-2xl sm:text-3xl" />
            </div>
            <div className="stat-title text-xs sm:text-sm">{t('city.visitors')}</div>
            <div className="stat-value text-secondary text-xl sm:text-3xl leading-tight">
              {totalDancersWhoVisited}
            </div>
            <div className="stat-desc hidden sm:block">{t('city.visitedForDance')}</div>
          </div>

          <div className="stat bg-base-200 rounded-lg p-3 sm:p-4 hidden sm:block">
            <div className="stat-figure text-accent">
              <FaHeart className="text-2xl sm:text-3xl" />
            </div>
            <div className="stat-title text-xs sm:text-sm">
              <span className="sm:hidden">{t('city.mostCommonRoleShort')}</span>
              <span className="hidden sm:inline">{t('city.mostCommonRole')}</span>
            </div>
            <div className="stat-value text-accent text-xl sm:text-3xl leading-tight">
              {roleLabel}
            </div>
            <div className="stat-desc hidden sm:block">{rolePercentage}% {t('city.ofDancers')}</div>
          </div>
        </div>

        {upcomingEvents.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body p-4 sm:p-6">
                <h2 className="card-title mb-3 sm:mb-4 flex items-center gap-2">
                  <FaCalendar /> Upcoming Events
                </h2>
                <div className="space-y-2 sm:space-y-3">
                  {upcomingEvents.map((event: any) => (
                    <Link
                      key={event._id}
                      href={`/organizer-events/${event._id}`}
                      className="block bg-base-300 hover:bg-base-100 rounded-lg p-2 sm:p-3 transition-colors"
                    >
                      <div className="flex gap-2 sm:gap-3">
                        {event.flyerUrl && (
                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={event.flyerUrl}
                              alt={event.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold hover:text-primary transition-colors line-clamp-1">
                            {event.title}
                          </div>
                          <p className="text-xs text-base-content/70 mt-0.5 sm:mt-1">
                            {new Date(event.startsAt).toLocaleString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                          <p className="text-xs text-base-content/60 line-clamp-1">
                            {event.venue ? `${event.venue} • ` : ""}
                            by {event.organizerId?.name || "Organizer"}
                          </p>
                          {typeof event.priceAmount === "number" && (
                            <p className="text-xs text-base-content/70 mt-0.5 sm:mt-1">
                              {event.priceCurrency || "USD"} {event.priceAmount.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {(teachers.length > 0 || djs.length > 0 || photographers.length > 0 || eventOrganizers.length > 0 || producers.length > 0) && (
          <section className="mb-6 sm:mb-8">
            <h2 className="text-2xl font-bold mb-3 sm:mb-4">{tReplace(t('city.professionalsIn'), { name: city.name })}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {teachers.length > 0 && (
                <div className="card bg-base-200 shadow-xl">
                  <div className="card-body p-4 sm:p-6">
                    <h3 className="card-title mb-3 sm:mb-4 flex items-center gap-2">
                      🎓 {t('city.teachers')}
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                      {teachers.map((teacher: any) => (
                        <Link
                          key={teacher._id}
                          href={`/dancer/${teacher._id}`}
                          className="flex items-center gap-2 sm:gap-3 hover:bg-base-300 rounded p-2 transition-colors"
                        >
                          <div className="avatar">
                            <div className="w-10 h-10 rounded-full">
                              {teacher.image ? (
                                <img
                                  src={teacher.image}
                                  alt={teacher.name}
                                  className="w-full h-full object-cover rounded-full"
                                />
                              ) : (
                                <div className="bg-primary text-primary-content rounded-full w-full h-full flex items-center justify-center">
                                  <span className="text-sm">
                                    {teacher.name?.charAt(0)?.toUpperCase() || "?"}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">
                              {teacher.name}
                            </h4>
                            {teacher.teacherProfile?.yearsOfExperience && (
                              <p className="text-xs text-base-content/60">
                                {teacher.teacherProfile.yearsOfExperience} year
                                {teacher.teacherProfile.yearsOfExperience !== 1 ? "s" : ""} exp.
                              </p>
                            )}
                          </div>
                          <div className="badge badge-primary badge-sm">{t('city.view')}</div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {djs.length > 0 && (
                <div className="card bg-base-200 shadow-xl">
                  <div className="card-body p-4 sm:p-6">
                    <h3 className="card-title mb-3 sm:mb-4 flex items-center gap-2">
                      🎵 {t('city.djs')}
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                      {djs.map((dj: any) => (
                        <Link
                          key={dj._id}
                          href={`/dancer/${dj._id}`}
                          className="flex items-center gap-2 sm:gap-3 hover:bg-base-300 rounded p-2 transition-colors"
                        >
                          <div className="avatar">
                            <div className="w-10 h-10 rounded-full">
                              {dj.image ? (
                                <img
                                  src={dj.image}
                                  alt={dj.name}
                                  className="w-full h-full object-cover rounded-full"
                                />
                              ) : (
                                <div className="bg-secondary text-secondary-content rounded-full w-full h-full flex items-center justify-center">
                                  <span className="text-sm">
                                    {dj.name?.charAt(0)?.toUpperCase() || "?"}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">
                              {dj.djProfile?.djName || dj.name}
                            </h4>
                            {dj.djProfile?.genres && (
                              <p className="text-xs text-base-content/60 truncate">
                                {dj.djProfile.genres}
                              </p>
                            )}
                          </div>
                          <div className="badge badge-secondary badge-sm">{t('city.view')}</div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {photographers.length > 0 && (
                <div className="card bg-base-200 shadow-xl">
                  <div className="card-body p-4 sm:p-6">
                    <h3 className="card-title mb-3 sm:mb-4 flex items-center gap-2">
                      📷 {t('city.photographers')}
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                      {photographers.map((photographer: any) => (
                        <Link
                          key={photographer._id}
                          href={`/dancer/${photographer._id}`}
                          className="flex items-center gap-2 sm:gap-3 hover:bg-base-300 rounded p-2 transition-colors"
                        >
                          <div className="avatar">
                            <div className="w-10 h-10 rounded-full">
                              {photographer.image ? (
                                <img
                                  src={photographer.image}
                                  alt={photographer.name}
                                  className="w-full h-full object-cover rounded-full"
                                />
                              ) : (
                                <div className="bg-accent text-accent-content rounded-full w-full h-full flex items-center justify-center">
                                  <span className="text-sm">
                                    {photographer.name?.charAt(0)?.toUpperCase() || "?"}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">
                              {photographer.name}
                            </h4>
                            {photographer.photographerProfile?.specialties && (
                              <p className="text-xs text-base-content/60 truncate">
                                {photographer.photographerProfile.specialties}
                              </p>
                            )}
                          </div>
                          <div className="badge badge-accent badge-sm">{t('city.view')}</div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {eventOrganizers.length > 0 && (
                <div className="card bg-base-200 shadow-xl">
                  <div className="card-body p-4 sm:p-6">
                    <h3 className="card-title mb-3 sm:mb-4 flex items-center gap-2">
                      🎪 {t('city.eventOrganizers')}
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                      {eventOrganizers.map((organizer: any) => (
                        <Link
                          key={organizer._id}
                          href={`/dancer/${organizer._id}`}
                          className="flex items-center gap-2 sm:gap-3 hover:bg-base-300 rounded p-2 transition-colors"
                        >
                          <div className="avatar">
                            <div className="w-10 h-10 rounded-full">
                              {organizer.image ? (
                                <img
                                  src={organizer.image}
                                  alt={organizer.name}
                                  className="w-full h-full object-cover rounded-full"
                                />
                              ) : (
                                <div className="bg-accent text-accent-content rounded-full w-full h-full flex items-center justify-center">
                                  <span className="text-sm">
                                    {organizer.name?.charAt(0)?.toUpperCase() || "?"}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">
                              {organizer.name}
                            </h4>
                            {organizer.eventOrganizerProfile?.eventTypes && (
                              <p className="text-xs text-base-content/60 truncate">
                                {organizer.eventOrganizerProfile.eventTypes}
                              </p>
                            )}
                          </div>
                          <div className="badge badge-accent badge-sm">{t('city.view')}</div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {producers.length > 0 && (
                <div className="card bg-base-200 shadow-xl">
                  <div className="card-body p-4 sm:p-6">
                    <h3 className="card-title mb-3 sm:mb-4 flex items-center gap-2">
                      🎹 {t('city.producers')}
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                      {producers.map((producer: any) => (
                        <Link
                          key={producer._id}
                          href={`/dancer/${producer._id}`}
                          className="flex items-center gap-2 sm:gap-3 hover:bg-base-300 rounded p-2 transition-colors"
                        >
                          <div className="avatar">
                            <div className="w-10 h-10 rounded-full">
                              {producer.image ? (
                                <img
                                  src={producer.image}
                                  alt={producer.name}
                                  className="w-full h-full object-cover rounded-full"
                                />
                              ) : (
                                <div className="bg-accent text-accent-content rounded-full w-full h-full flex items-center justify-center">
                                  <span className="text-sm">
                                    {producer.name?.charAt(0)?.toUpperCase() || "?"}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">
                              {producer.name}
                            </h4>
                            {producer.producerProfile?.genres && (
                              <p className="text-xs text-base-content/60 truncate">
                                {producer.producerProfile.genres}
                              </p>
                            )}
                          </div>
                          <div className="badge badge-accent badge-sm">{t('city.view')}</div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        <div className="mb-8">
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body p-4 sm:p-6">
              <h2 className="card-title mb-4 sm:mb-6">{t('city.dancersIn')} {city.name}</h2>

              {dancers.length > 0 ? (
                <DancersFilter
                  dancers={dancers}
                  userDanceStyles={userDanceStyles}
                  locationName={city.name}
                  currentCityId={params.cityId}
                />
              ) : (
                <div className="text-center py-8 text-base-content/60">
                  <FaUsers className="mx-auto text-4xl mb-4 opacity-50" />
                  <p>{tReplace(t('city.noDancersFound'), { name: city.name })}</p>
                  {isLoggedIn && (
                    <p className="text-sm mt-2">
                      <Link href="/profile" className="link link-primary">
                        {t('city.setAsLocation')}
                      </Link>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mb-6 sm:mb-8">
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body p-4 sm:p-6">
              <h2 className="card-title mb-3 sm:mb-4">{t('city.popularDanceStyles')}</h2>
              {danceStylesInCity.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {danceStylesInCity.map((style: any, index: number) => (
                    <Link
                      key={style._id}
                      href={`/dance-style/${style.slug || style._id}`}
                      className="flex justify-between items-center hover:bg-base-300 rounded p-2 transition-colors"
                    >
                      <span className="text-sm font-medium hover:text-primary transition-colors">
                        {style.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-base-content/60">
                          {style.count} {t('city.dancersShort')}
                        </span>
                        <div className="badge badge-primary badge-sm">
                          #{index + 1}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-base-content/60 text-center py-3 sm:py-4">
                  {t('city.noDanceStylesYet')}
                </p>
              )}
            </div>
          </div>
        </div>

        {mostLikedDancers.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body p-4 sm:p-6">
                <h2 className="card-title mb-3 sm:mb-4 flex items-center gap-2">
                  ❤️ {t('city.mostLikedDancers')}
                </h2>
                <div className="space-y-2 sm:space-y-3">
                  {mostLikedDancers.map((dancer: any, index: number) => (
                    <Link
                      key={dancer._id}
                      href={`/dancer/${dancer._id}`}
                      className="flex items-center gap-3 hover:bg-base-300 rounded p-2 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="badge badge-lg badge-ghost">
                          #{index + 1}
                        </div>
                        <div className="avatar">
                          <div className="w-10 h-10 rounded-full">
                            {dancer.image ? (
                              <img
                                src={dancer.image}
                                alt={dancer.name}
                                className="w-full h-full object-cover rounded-full"
                              />
                            ) : (
                              <div className="bg-error text-error-content rounded-full w-full h-full flex items-center justify-center">
                                <span className="text-sm">
                                  {dancer.name?.charAt(0)?.toUpperCase() || "?"}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate">
                            {dancer.name}
                          </h3>
                          <p className="text-xs text-base-content/60">
                            ❤️ {dancer.likesCount} {dancer.likesCount === 1 ? 'like' : 'likes'}
                          </p>
                        </div>
                      </div>
                      <div className="badge badge-error badge-sm">{t('city.view')}</div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {(city.socialGroups?.whatsapp || city.socialGroups?.line || city.socialGroups?.telegram || city.socialGroups?.facebook || city.socialGroups?.instagram || city.socialGroups?.website) && (
          <div className="mb-8">
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <h2 className="card-title mb-4">💬 {t('city.communityGroups')}</h2>
                <p className="text-sm text-base-content/70 mb-4">
                  {t('city.joinCommunity')}
                </p>
                <div className="space-y-2">
                  {city.socialGroups.whatsapp && (
                    <a
                      href={city.socialGroups.whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-success btn-sm gap-2 w-full"
                    >
                      <FaWhatsapp className="text-lg" />
                      WhatsApp
                    </a>
                  )}
                  {city.socialGroups.telegram && (
                    <a
                      href={city.socialGroups.telegram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-info btn-sm gap-2 w-full"
                    >
                      <SiTelegram className="text-lg" />
                      Telegram
                    </a>
                  )}
                  {city.socialGroups.facebook && (
                    <a
                      href={city.socialGroups.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm gap-2 w-full"
                      style={{ backgroundColor: '#1877F2', color: 'white' }}
                    >
                      <FaFacebook className="text-lg" />
                      Facebook Group
                    </a>
                  )}
                  {city.socialGroups.instagram && (
                    <a
                      href={city.socialGroups.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm gap-2 w-full"
                      style={{ background: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)', color: 'white' }}
                    >
                      <FaInstagram className="text-lg" />
                      Instagram
                    </a>
                  )}
                  {city.socialGroups.line && (
                    <a
                      href={city.socialGroups.line}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm gap-2 w-full"
                      style={{ backgroundColor: '#00B900', color: 'white' }}
                    >
                      <SiLine className="text-lg" />
                      LINE
                    </a>
                  )}
                  {city.socialGroups.website && (
                    <a
                      href={city.socialGroups.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm gap-2 w-full"
                    >
                      <FaGlobe className="text-lg" />
                      {t('city.website')}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CTA for non-authenticated users */}
        {!isLoggedIn && (
          <div className="text-center mt-8">
            <div className="card bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-xl">
              <div className="card-body">
                <h2 className="card-title justify-center text-2xl mb-2">
                  {t('city.joinDanceCommunityIn')} {city.name}
                </h2>
                <p className="mb-4">
                  {tReplace(t('city.connectCTA'), { count: totalDancers })}
                </p>
                <div className="card-actions justify-center">
                  <Link href="/api/auth/signin" className="btn btn-white">
                    {t('city.joinDanceCircle')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

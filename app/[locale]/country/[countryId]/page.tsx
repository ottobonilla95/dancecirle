import { notFound, redirect } from "next/navigation";
import { getBreadcrumbJsonLd } from "@/libs/seo";
import connectMongo from "@/libs/mongoose";
import Country from "@/models/Country";
import Continent from "@/models/Continent";
import User from "@/models/User";
import City from "@/models/City";
import DanceStyle from "@/models/DanceStyle";
import { isValidObjectId } from "mongoose";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { Link } from "@/navigation";
import Pagination from "@/components/Pagination";
import DancersFilter from "@/components/DancersFilter";
import Flag from "@/components/Flag";
import { getMessages, getTranslation, tReplace, type Locale } from "@/lib/i18n";
import {
  FaMapMarkerAlt,
  FaUsers,
  FaGlobeAmericas,
  FaHeart,
  FaMusic,
  FaCity,
  FaWhatsapp,
  FaFacebook,
  FaInstagram,
  FaGlobe,
} from "react-icons/fa";
import { SiLine, SiTelegram } from "react-icons/si";

// Helper: find country by slug or ObjectId
// Note: isValidObjectId treats any 12-char string as valid, so check for 24-char hex instead
function findCountryByParam(countryId: string) {
  if (/^[0-9a-fA-F]{24}$/.test(countryId)) {
    return Country.findById(countryId);
  }
  return Country.findOne({ slug: countryId });
}

interface Props {
  params: {
    locale: string;
    countryId: string;
  };
  searchParams: {
    page?: string;
  };
}

// Hardcoded most popular dance styles for SEO
const SEO_DANCE_STYLES = ["Bachata", "Salsa", "Kizomba", "Zouk", "Urban Kiz", "Bachazouk"];

// Cache this page for 1 hour (3600 seconds)
export const revalidate = 3600;

// Generate dynamic SEO metadata
export async function generateMetadata({ params }: Props) {
  const locale = params.locale as Locale;
  const messages = await getMessages(locale);
  const mt = (key: string) => getTranslation(messages, key);

  await connectMongo();

  try {
    const country: any = await findCountryByParam(params.countryId)
      ?.populate({
        path: "continent",
        model: Continent,
        select: "name code",
      })
      ?.lean();

    if (!country) {
      return {
        title: mt('meta.country.notFound'),
      };
    }

    const countryObjectId = country._id;
    const citiesInCountry = await City.find({
      country: countryObjectId,
      isActive: true,
    })
      .select("_id")
      .lean();

    const cityIds = citiesInCountry.map((city: any) => city._id);

    const totalDancers = await User.countDocuments({
      city: { $in: cityIds },
      isProfileComplete: true,
    });

    const danceStylesText = SEO_DANCE_STYLES.join(", ");
    const topStyles = SEO_DANCE_STYLES.slice(0, 3).join(", ");

    const countrySlug = country.slug || country._id.toString();
    const title = tReplace(mt('meta.country.title'), { countryName: country.name, topStyles });
    const description = tReplace(mt('meta.country.description'), { count: totalDancers, countryName: country.name, styles: danceStylesText });

    return {
      title,
      description,
      keywords: `${country.name} dance, ${country.name} dancers, ${danceStylesText}, dance community ${country.name}, dance partners ${country.name}, ${country.name} dance scene, dance classes ${country.name}`,
      alternates: {
        canonical: `https://dancecircle.co/${params.locale}/country/${countrySlug}`,
        languages: {
          en: `https://dancecircle.co/en/country/${countrySlug}`,
          es: `https://dancecircle.co/es/country/${countrySlug}`,
        },
      },
      openGraph: {
        title,
        description,
        url: `https://dancecircle.co/country/${countrySlug}`,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    };
  } catch (error) {
    console.error("Error generating country metadata:", error);
    return {
      title: mt('meta.country.fallback'),
    };
  }
}

export default async function CountryPage({ params, searchParams }: Props) {
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

  let country: any;
  try {
    country = await findCountryByParam(params.countryId)
      ?.populate({
        path: "continent",
        model: Continent,
        select: "name code slug",
      })
      ?.lean();

    if (!country) {
      notFound();
    }

    // Redirect ObjectId URLs to slug URLs
    if (/^[0-9a-fA-F]{24}$/.test(params.countryId) && country.slug) {
      redirect(`/country/${country.slug}`);
    }
  } catch (error) {
    if ((error as any)?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("Error fetching country:", error);
    notFound();
  }

  // Use the country's actual ObjectId for MongoDB queries
  const countryObjectId = country._id;

  // Get all cities in this country first
  const citiesInCountry = await City.find({
    country: countryObjectId,
    isActive: true,
  })
    .select("_id")
    .lean();

  const cityIds = citiesInCountry.map((city: any) => city._id);

  // Get ALL dancers in this country (for client-side filtering)
  let dancers: any[] = await User.find({
    city: { $in: cityIds },
    isProfileComplete: true,
  })
    .select("name username image danceStyles city dateOfBirth hideAge nationality dancingStartYear danceRole socialMedia likedBy openToMeetTravelers lookingForPracticePartners isTeacher isDJ isPhotographer isEventOrganizer isProducer isFeaturedProfessional jackAndJillCompetitions bio sharedOnSocialMedia")
    .populate({
      path: "city",
      model: City,
      select: "name",
    })
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

  // Get dancers count for this country
  const totalDancers = await User.countDocuments({
    city: { $in: cityIds },
    isProfileComplete: true,
  });

  // Get dancers who have visited cities in this country
  const totalDancersWhoVisited = await User.countDocuments({
    citiesVisited: { $in: cityIds },
    isProfileComplete: true,
  });

  // Get dance styles popular in this country
  const danceStylesInCountry = await User.aggregate([
    { $match: { city: { $in: cityIds }, isProfileComplete: true } },
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

  // Get role distribution
  const roleDistribution = await User.aggregate([
    { $match: { city: { $in: cityIds }, isProfileComplete: true } },
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

  // Get teachers in this country
  const teachers = await User.find({
    city: { $in: cityIds },
    isProfileComplete: true,
    isTeacher: true,
  })
    .select("name username image danceStyles teacherProfile city")
    .populate({
      path: "city",
      model: City,
      select: "name",
    })
    .populate({
      path: "danceStyles.danceStyle",
      model: DanceStyle,
      select: "name",
    })
    .limit(10)
    .lean();

  // Get DJs in this country
  const djs = await User.find({
    city: { $in: cityIds },
    isProfileComplete: true,
    isDJ: true,
  })
    .select("name username image djProfile city")
    .populate({
      path: "city",
      model: City,
      select: "name",
    })
    .limit(10)
    .lean();

  // Get photographers in this country
  const photographers = await User.find({
    city: { $in: cityIds },
    isProfileComplete: true,
    isPhotographer: true,
  })
    .select("name username image photographerProfile city")
    .populate({
      path: "city",
      model: City,
      select: "name",
    })
    .limit(10)
    .lean();

  // Get event organizers in this country
  const eventOrganizers = await User.find({
    city: { $in: cityIds },
    isProfileComplete: true,
    isEventOrganizer: true,
  })
    .select("name username image eventOrganizerProfile city")
    .populate({
      path: "city",
      model: City,
      select: "name",
    })
    .limit(10)
    .lean();

  // Get producers in this country
  const producers = await User.find({
    city: { $in: cityIds },
    isProfileComplete: true,
    isProducer: true,
  })
    .select("name username image producerProfile city")
    .populate({
      path: "city",
      model: City,
      select: "name",
    })
    .limit(10)
    .lean();

  // Get most liked dancers in this country
  const mostLikedDancers = await User.aggregate([
    { 
      $match: { 
        city: { $in: cityIds },
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
      $lookup: {
        from: "cities",
        localField: "city",
        foreignField: "_id",
        as: "city"
      }
    },
    { $unwind: "$city" },
    {
      $project: {
        name: 1,
        username: 1,
        image: 1,
        likesCount: 1,
        "city.name": 1
      }
    }
  ]);

  // Get top cities in this country
  const topCities = await City.find({
    country: countryObjectId,
    isActive: true,
    totalDancers: { $gt: 0 },
  })
    .select("name slug totalDancers image")
    .sort({ totalDancers: -1 })
    .limit(10)
    .lean();

  // Pagination calculations
  const totalPages = Math.ceil(totalDancers / dancersPerPage);

  // Format numbers
  const formatNumber = (num: number | null | undefined) => {
    if (!num || num === 0) {
      return "0";
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  // JSON-LD structured data for SEO
  const countrySlug = country.slug || country._id.toString();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: `${country.name} Dance Community`,
    description: `Discover ${totalDancers} dancers across ${country.name}. Connect with ${danceStylesInCountry.map((s: any) => s.name).join(', ')} communities, find partners, teachers, and events.`,
    url: `https://dancecircle.co/country/${countrySlug}`,
    ...(country.continent ? {
      containedInPlace: {
        "@type": "Place",
        name: country.continent.name,
        url: `https://dancecircle.co/continent/${country.continent.slug || country.continent._id}`,
      },
    } : {}),
    ...(topCities.length > 0 ? {
      containsPlace: topCities.map((city: any) => ({
        "@type": "Place",
        name: city.name,
        url: `https://dancecircle.co/city/${city.slug || city._id}`,
      })),
    } : {}),
  };

  const breadcrumbItems = [
    { name: "DanceCircle", url: `https://dancecircle.co` },
    { name: t('breadcrumb.countries'), url: `https://dancecircle.co/countries` },
    { name: country.name, url: `https://dancecircle.co/country/${countrySlug}` },
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
            <div className="text-6xl">
              <Flag countryCode={country.code} size="lg" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
                {country.name}
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-base-content/70">
                {country.continent && (
                  <span className="flex items-center gap-1">
                    <FaGlobeAmericas />
                    <Link 
                      href={`/continent/${country.continent?.slug || country.continent?._id || country.continent?.id}`}
                      className="link link-primary hover:link-accent whitespace-nowrap"
                    >
                      {country.continent?.name}
                    </Link>
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <FaUsers />
                  {formatNumber(totalDancers)} {t('country.dancersShort')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6 mb-8">
          <div className="stat bg-base-200 rounded-lg p-3 sm:p-4">
            <div className="stat-figure text-primary">
              <FaMusic className="text-2xl sm:text-3xl" />
            </div>
            <div className="stat-title text-xs sm:text-sm">
              <span className="sm:hidden">{t('country.dancersShort')}</span>
              <span className="hidden sm:inline">{t('country.dancersLivingHere')}</span>
            </div>
            <div className="stat-value text-primary text-xl sm:text-3xl leading-tight">{totalDancers}</div>
            <div className="stat-desc hidden sm:block">{t('country.activeCommunity')}</div>
          </div>

          <div className="stat bg-base-200 rounded-lg p-3 sm:p-4">
            <div className="stat-figure text-secondary">
              <FaGlobeAmericas className="text-2xl sm:text-3xl" />
            </div>
            <div className="stat-title text-xs sm:text-sm">{t('country.visitors')}</div>
            <div className="stat-value text-secondary text-xl sm:text-3xl leading-tight">
              {totalDancersWhoVisited}
            </div>
            <div className="stat-desc hidden sm:block">{t('country.visitedForDance')}</div>
          </div>

          <div className="stat bg-base-200 rounded-lg p-3 sm:p-4 hidden sm:block">
            <div className="stat-figure text-accent">
              <FaHeart className="text-2xl sm:text-3xl" />
            </div>
            <div className="stat-title text-xs sm:text-sm">
              <span className="sm:hidden">{t('country.mostCommonRoleShort')}</span>
              <span className="hidden sm:inline">{t('country.mostCommonRole')}</span>
            </div>
            <div className="stat-value text-accent text-xl sm:text-3xl leading-tight">
              {roleLabel}
            </div>
            <div className="stat-desc hidden sm:block">{rolePercentage}% {t('country.ofDancers')}</div>
          </div>
        </div>

        {(teachers.length > 0 || djs.length > 0 || photographers.length > 0 || eventOrganizers.length > 0 || producers.length > 0) && (
          <section className="mb-6 sm:mb-8">
            <h2 className="text-2xl font-bold mb-3 sm:mb-4">{tReplace(t('country.professionalsIn'), { name: country.name })}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {teachers.length > 0 && (
                <div className="card bg-base-200 shadow-xl">
                  <div className="card-body p-4 sm:p-6">
                    <h3 className="card-title mb-3 sm:mb-4 flex items-center gap-2">
                      🎓 {t('country.teachers')}
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
                            {teacher.city && (
                              <p className="text-xs text-base-content/60">
                                {teacher.city.name}
                              </p>
                            )}
                          </div>
                          <div className="badge badge-primary badge-sm">{t('country.view')}</div>
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
                      🎵 {t('country.djs')}
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
                            {dj.city && (
                              <p className="text-xs text-base-content/60">
                                {dj.city.name}
                              </p>
                            )}
                          </div>
                          <div className="badge badge-secondary badge-sm">{t('country.view')}</div>
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
                      📷 {t('country.photographers')}
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
                            {photographer.city && (
                              <p className="text-xs text-base-content/60">
                                {photographer.city.name}
                              </p>
                            )}
                          </div>
                          <div className="badge badge-accent badge-sm">{t('country.view')}</div>
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
                      🎪 {t('country.eventOrganizers')}
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
                            {organizer.city && (
                              <p className="text-xs text-base-content/60">
                                {organizer.city.name}
                              </p>
                            )}
                          </div>
                          <div className="badge badge-accent badge-sm">{t('country.view')}</div>
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
                      🎹 {t('country.producers')}
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
                            {producer.city && (
                              <p className="text-xs text-base-content/60">
                                {producer.city.name}
                              </p>
                            )}
                          </div>
                          <div className="badge badge-accent badge-sm">{t('country.view')}</div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        <div className="mb-6 sm:mb-8">
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body p-4 sm:p-6">
              <h2 className="card-title mb-4 sm:mb-6">{t('country.dancersIn')} {country.name}</h2>

              {dancers.length > 0 ? (
                <DancersFilter
                  dancers={dancers}
                  userDanceStyles={userDanceStyles}
                  locationName={country.name}
                />
              ) : (
                <div className="text-center py-8 text-base-content/60">
                  <FaUsers className="mx-auto text-4xl mb-4 opacity-50" />
                  <p>{tReplace(t('country.noDancersFound'), { name: country.name })}</p>
                  {isLoggedIn && (
                    <p className="text-sm mt-2">
                      <Link href="/profile" className="link link-primary">
                        {t('country.setAsLocation')}
                      </Link>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body p-4 sm:p-6">
              <h2 className="card-title mb-3 sm:mb-4">{t('country.popularDanceStyles')}</h2>
              {danceStylesInCountry.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {danceStylesInCountry.map((style: any, index: number) => (
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
                          {style.count} {t('country.dancersShort')}
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
                  {t('country.noDanceStylesYet')}
                </p>
              )}
            </div>
          </div>

          {topCities.length > 0 && (
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body p-4 sm:p-6">
                <h2 className="card-title mb-3 sm:mb-4 flex items-center gap-2">
                  <FaCity /> {t('country.topCities')}
                </h2>
                <div className="space-y-2 sm:space-y-3">
                  {topCities.map((city: any, index: number) => (
                    <Link
                      key={city._id}
                      href={`/city/${city.slug || city._id}`}
                      className="flex items-center justify-between hover:bg-base-300 rounded p-2 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {city.image && (
                          <img
                            src={city.image}
                            alt={city.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        )}
                        <span className="text-sm font-medium hover:text-primary transition-colors">
                          {city.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-base-content/60">
                          {city.totalDancers} {t('country.dancersShort')}
                        </span>
                        <div className="badge badge-primary badge-sm">
                          #{index + 1}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {mostLikedDancers.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body p-4 sm:p-6">
                <h2 className="card-title mb-3 sm:mb-4 flex items-center gap-2">
                  ❤️ {t('country.mostLikedDancers')}
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
                            {dancer.city?.name} • ❤️ {dancer.likesCount} {dancer.likesCount === 1 ? 'like' : 'likes'}
                          </p>
                        </div>
                      </div>
                      <div className="badge badge-error badge-sm">{t('country.view')}</div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {(country.socialGroups?.whatsapp || country.socialGroups?.line || country.socialGroups?.telegram || country.socialGroups?.facebook || country.socialGroups?.instagram || country.socialGroups?.website) && (
          <div className="mb-6 sm:mb-8">
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body p-4 sm:p-6">
                <h2 className="card-title mb-3 sm:mb-4">💬 {t('country.communityGroups')}</h2>
                <p className="text-sm text-base-content/70 mb-3 sm:mb-4">
                  {t('country.joinCommunity').replace('{country}', country.name)}
                </p>
                <div className="space-y-2">
                  {country.socialGroups.whatsapp && (
                    <a
                      href={country.socialGroups.whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-success btn-sm gap-2 w-full"
                    >
                      <FaWhatsapp className="text-lg" />
                      WhatsApp
                    </a>
                  )}
                  {country.socialGroups.telegram && (
                    <a
                      href={country.socialGroups.telegram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-info btn-sm gap-2 w-full"
                    >
                      <SiTelegram className="text-lg" />
                      Telegram
                    </a>
                  )}
                  {country.socialGroups.facebook && (
                    <a
                      href={country.socialGroups.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm gap-2 w-full"
                      style={{ backgroundColor: '#1877F2', color: 'white' }}
                    >
                      <FaFacebook className="text-lg" />
                      Facebook Group
                    </a>
                  )}
                  {country.socialGroups.instagram && (
                    <a
                      href={country.socialGroups.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm gap-2 w-full"
                      style={{ background: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)', color: 'white' }}
                    >
                      <FaInstagram className="text-lg" />
                      Instagram
                    </a>
                  )}
                  {country.socialGroups.line && (
                    <a
                      href={country.socialGroups.line}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm gap-2 w-full"
                      style={{ backgroundColor: '#00B900', color: 'white' }}
                    >
                      <SiLine className="text-lg" />
                      LINE
                    </a>
                  )}
                  {country.socialGroups.website && (
                    <a
                      href={country.socialGroups.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm gap-2 w-full"
                    >
                      <FaGlobe className="text-lg" />
                      {t('country.website')}
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
              <div className="card-body p-4 sm:p-6">
                <h2 className="card-title justify-center text-2xl mb-2">
                  {t('country.joinDanceCommunityIn')} {country.name}
                </h2>
                <p className="mb-4">
                  {tReplace(t('country.connectCTA'), { count: totalDancers, name: country.name })}
                </p>
                <div className="card-actions justify-center">
                  <Link href="/api/auth/signin" className="btn btn-white">
                    {t('country.joinDanceCircle')}
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

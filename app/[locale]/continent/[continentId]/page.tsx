import { notFound, redirect } from "next/navigation";
import connectMongo from "@/libs/mongoose";
import Continent from "@/models/Continent";
import Country from "@/models/Country";
import User from "@/models/User";
import City from "@/models/City";
import DanceStyle from "@/models/DanceStyle";
import { isValidObjectId } from "mongoose";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { Link } from "@/navigation";
import DancersFilter from "@/components/DancersFilter";
import {
  FaMapMarkerAlt,
  FaUsers,
  FaGlobeAmericas,
  FaHeart,
  FaMusic,
  FaCity,
  FaFlag,
} from "react-icons/fa";
import { getMessages, getTranslation, tReplace, type Locale } from "@/lib/i18n";

// Helper: find continent by slug or ObjectId
function findContinentByParam(continentId: string) {
  if (isValidObjectId(continentId)) {
    return Continent.findById(continentId);
  }
  return Continent.findOne({ slug: continentId });
}

interface Props {
  params: {
    locale: string;
    continentId: string;
  };
}

// Cache this page for 1 hour
export const revalidate = 3600;

// Generate dynamic SEO metadata
export async function generateMetadata({ params }: Props) {
  const locale = params.locale as Locale;
  const messages = await getMessages(locale);
  const mt = (key: string) => getTranslation(messages, key);

  await connectMongo();

  try {
    const continent: any = await findContinentByParam(params.continentId)?.lean();

    if (!continent) {
      return { title: mt('meta.continent.notFound') };
    }

    const continentSlug = continent.slug || continent._id.toString();
    const title = tReplace(mt('meta.continent.title'), { continentName: continent.name });
    const description = tReplace(mt('meta.continent.description'), { continentName: continent.name });

    return {
      title,
      description,
      keywords: `${continent.name} dance, ${continent.name} dancers, dance community ${continent.name}, Bachata ${continent.name}, Salsa ${continent.name}, Kizomba ${continent.name}`,
      alternates: {
        canonical: `https://dancecircle.co/${params.locale}/continent/${continentSlug}`,
        languages: {
          en: `https://dancecircle.co/en/continent/${continentSlug}`,
          es: `https://dancecircle.co/es/continent/${continentSlug}`,
        },
      },
      openGraph: {
        title,
        description,
        url: `https://dancecircle.co/continent/${continentSlug}`,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    };
  } catch (error) {
    console.error("Error generating continent metadata:", error);
    return { title: mt('meta.continent.fallback') };
  }
}

export default async function ContinentPage({ params }: Props) {
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

  let continent: any;
  try {
    continent = await findContinentByParam(params.continentId)?.lean();

    if (!continent) {
      notFound();
    }

    // Redirect ObjectId URLs to slug URLs
    if (isValidObjectId(params.continentId) && continent.slug) {
      redirect(`/continent/${continent.slug}`);
    }
  } catch (error) {
    if ((error as any)?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("Error fetching continent:", error);
    notFound();
  }

  // Use the continent's actual ObjectId for MongoDB queries
  const continentObjectId = continent._id;

  // Get all countries in this continent
  const countriesInContinent = await Country.find({
    continent: continentObjectId,
    isActive: true,
  })
    .select("_id")
    .lean();

  const countryIds = countriesInContinent.map((country: any) => country._id);

  // Get all cities in these countries
  const citiesInContinent = await City.find({
    country: { $in: countryIds },
    isActive: true,
  })
    .select("_id")
    .lean();

  const cityIds = citiesInContinent.map((city: any) => city._id);

  // Get ALL dancers in this continent (for client-side filtering)
  const dancers: any[] = await User.find({
    city: { $in: cityIds },
    isProfileComplete: true,
  })
    .select("name username image danceStyles city dateOfBirth hideAge nationality dancingStartYear danceRole socialMedia likedBy openToMeetTravelers lookingForPracticePartners isTeacher isDJ isPhotographer jackAndJillCompetitions sharedOnSocialMedia")
    .populate({
      path: "city",
      model: City,
      select: "name country",
      populate: {
        path: "country",
        model: Country,
        select: "name code"
      }
    })
    .populate({
      path: "danceStyles.danceStyle",
      model: DanceStyle,
      select: "name",
    })
    .lean();

  // Get dancers count for this continent
  const totalDancers = await User.countDocuments({
    city: { $in: cityIds },
    isProfileComplete: true,
  });

  // Get dance styles popular in this continent
  const danceStylesInContinent = await User.aggregate([
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

  // Get all countries in this continent
  const allCountries = await Country.find({
    continent: continentObjectId,
    isActive: true,
  })
    .select("name code slug")
    .lean();

  // Calculate dancers per country dynamically
  const countriesWithDancers = await Promise.all(
    allCountries.map(async (country: any) => {
      const citiesInCountry = await City.find({
        country: country._id,
        isActive: true,
      }).select("_id").lean();
      
      const cityIdsInCountry = citiesInCountry.map((c: any) => c._id);
      
      const dancerCount = await User.countDocuments({
        city: { $in: cityIdsInCountry },
        isProfileComplete: true,
      });

      return {
        ...country,
        totalDancers: dancerCount,
      };
    })
  );

  // Filter and sort countries with dancers
  const topCountries = countriesWithDancers
    .filter((c: any) => c.totalDancers > 0)
    .sort((a: any, b: any) => b.totalDancers - a.totalDancers)
    .slice(0, 10);

  // Get top cities in this continent
  const topCities = await City.find({
    country: { $in: countryIds },
    isActive: true,
    totalDancers: { $gt: 0 },
  })
    .select("name slug totalDancers image country")
    .populate({
      path: "country",
      model: Country,
      select: "name code"
    })
    .sort({ totalDancers: -1 })
    .limit(10)
    .lean();

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

  // Get continent emoji
  const getContinentEmoji = (name: string) => {
    const emojiMap: { [key: string]: string } = {
      "Africa": "🌍",
      "Asia": "🌏",
      "Europe": "🌍",
      "North America": "🌎",
      "South America": "🌎",
      "Oceania": "🌏",
      "Antarctica": "🧊"
    };
    return emojiMap[name] || "🌐";
  };

  // JSON-LD structured data for SEO
  const continentSlug = continent.slug || continent._id.toString();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: `${continent.name} Dance Community`,
    description: `Discover dancers across ${continent.name}. Connect with Bachata, Salsa, Kizomba communities and events.`,
    url: `https://dancecircle.co/continent/${continentSlug}`,
  };

  return (
    <div className="min-h-screen p-4 bg-base-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <span>{getContinentEmoji(continent.name)}</span>
            <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
              {continent.name}
            </span>
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-base-content/70">
            <span className="flex items-center gap-1">
              <FaUsers />
              {formatNumber(totalDancers)} {t('continent.dancersShort')}
            </span>
            <span className="flex items-center gap-1">
              <FaFlag />
              {topCountries.length} {t('continent.countries')}
            </span>
            <span className="flex items-center gap-1">
              <FaCity />
              {citiesInContinent.length} {t('continent.cities')}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6 mb-8">
          <div className="stat bg-base-200 rounded-lg p-3 sm:p-4">
            <div className="stat-figure text-primary">
              <FaMusic className="text-2xl sm:text-3xl" />
            </div>
            <div className="stat-title text-xs sm:text-sm">
              <span className="sm:hidden">{t('continent.dancersShort')}</span>
              <span className="hidden sm:inline">{t('continent.totalDancers')}</span>
            </div>
            <div className="stat-value text-primary text-xl sm:text-3xl leading-tight">{formatNumber(totalDancers)}</div>
            <div className="stat-desc hidden sm:block">{t('continent.activeCommunity')}</div>
          </div>

          <div className="stat bg-base-200 rounded-lg p-3 sm:p-4">
            <div className="stat-figure text-secondary">
              <FaFlag className="text-2xl sm:text-3xl" />
            </div>
            <div className="stat-title text-xs sm:text-sm">{t('continent.countries')}</div>
            <div className="stat-value text-secondary text-xl sm:text-3xl leading-tight">{topCountries.length}</div>
            <div className="stat-desc hidden sm:block">{t('continent.withActiveDancers')}</div>
          </div>

          <div className="stat bg-base-200 rounded-lg p-3 sm:p-4">
            <div className="stat-figure text-accent">
              <FaCity className="text-2xl sm:text-3xl" />
            </div>
            <div className="stat-title text-xs sm:text-sm">{t('continent.cities')}</div>
            <div className="stat-value text-accent text-xl sm:text-3xl leading-tight">{formatNumber(citiesInContinent.length)}</div>
            <div className="stat-desc hidden sm:block">{t('continent.danceCommunities')}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Popular Dance Styles */}
            <div className="card bg-base-200 shadow-xl mb-4 sm:mb-6">
              <div className="card-body p-4 sm:p-6">
                <h2 className="card-title mb-3 sm:mb-4">{t('continent.popularDanceStyles')}</h2>
                {danceStylesInContinent.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {danceStylesInContinent.map((style: any, index: number) => (
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
                            {formatNumber(style.count)} {t('continent.dancersShort')}
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
                    {t('continent.noDanceStylesYet')}
                  </p>
                )}
              </div>
            </div>

            {/* Top Countries */}
            {topCountries.length > 0 && (
              <div className="card bg-base-200 shadow-xl mb-4 sm:mb-6">
                <div className="card-body p-4 sm:p-6">
                  <h2 className="card-title mb-3 sm:mb-4">{t('continent.topCountries')}</h2>
                  <div className="space-y-2">
                    {topCountries.map((country: any) => (
                      <Link
                        key={country._id}
                        href={`/country/${country.slug || country._id}`}
                        className="flex justify-between items-center hover:bg-base-300 rounded p-2 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">
                            {String.fromCodePoint(...[...country.code].map((c: string) => 127397 + c.charCodeAt(0)))}
                          </span>
                          <span className="text-sm font-medium">
                            {country.name}
                          </span>
                        </div>
                        <span className="text-xs text-base-content/60">
                          {formatNumber(country.totalDancers)}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Top Cities */}
            {topCities.length > 0 && (
              <div className="card bg-base-200 shadow-xl">
                <div className="card-body p-4 sm:p-6">
                  <h2 className="card-title mb-3 sm:mb-4">{t('continent.topCities')}</h2>
                  <div className="space-y-2">
                    {topCities.map((city: any) => (
                      <Link
                        key={city._id}
                        href={`/city/${city.slug || city._id}`}
                        className="flex justify-between items-center hover:bg-base-300 rounded p-2 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {city.image && (
                            <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0">
                              <img
                                src={city.image}
                                alt={city.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium">
                              {city.name}
                            </div>
                            <div className="text-xs text-base-content/60">
                              {city.country?.name}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-base-content/60">
                          {formatNumber(city.totalDancers)}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dancers in this Continent */}
          <div className="lg:col-span-2">
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body p-4 sm:p-6">
                <h2 className="card-title mb-4 sm:mb-6">{tReplace(t('continent.dancersIn'), { name: continent.name })}</h2>

                {dancers.length > 0 ? (
                  <DancersFilter
                    dancers={dancers}
                    userDanceStyles={userDanceStyles}
                    locationName={continent.name}
                  />
                ) : (
                  <div className="text-center py-8 text-base-content/60">
                    <FaUsers className="mx-auto text-4xl mb-4 opacity-50" />
                    <p>{tReplace(t('continent.noDancersIn'), { name: continent.name })}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CTA for non-authenticated users */}
        {!isLoggedIn && (
          <div className="text-center mt-8">
            <div className="card bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-xl">
              <div className="card-body p-4 sm:p-6">
                <h2 className="card-title justify-center text-2xl mb-2">
                  {tReplace(t('continent.joinCommunityIn'), { name: continent.name })}
                </h2>
                <p className="mb-4">
                  {tReplace(t('continent.connectWithDancers'), { count: formatNumber(totalDancers), countries: topCountries.length })}
                </p>
                <div className="card-actions justify-center">
                  <Link href="/api/auth/signin" className="btn btn-white">
                    {t('continent.joinDanceCircle')}
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

import { notFound, redirect } from "next/navigation";
import connectMongo from "@/libs/mongoose";
import DanceStyle from "@/models/DanceStyle";
import User from "@/models/User";
import City from "@/models/City";
import { isValidObjectId } from "mongoose";
import mongoose from "mongoose";

// Helper: find dance style by slug or ObjectId
function findDanceStyleByParam(styleId: string) {
  if (isValidObjectId(styleId)) {
    return DanceStyle.findById(styleId);
  }
  return DanceStyle.findOne({ slug: styleId });
}
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { Link } from "@/navigation";
import { DANCE_LEVELS } from "@/constants/dance-levels";
import Pagination from "@/components/Pagination";
import { 
  FaUsers, 
  FaMapMarkerAlt, 
  FaHeart, 
  FaCrown, 
  FaFire,
  FaStar,
  FaSeedling,
  FaGlobeAmericas
} from "react-icons/fa";
import { getMessages, getTranslation, tReplace, type Locale } from "@/lib/i18n";

interface Props {
  params: {
    locale: string;
    styleId: string;
  };
  searchParams: {
    page?: string;
  };
}

const getLevelIcon = (level: string) => {
  switch (level) {
    case 'beginner': return <FaSeedling className="text-green-500" />;
    case 'intermediate': return <FaStar className="text-yellow-500" />;
    case 'advanced': return <FaFire className="text-orange-500" />;
    case 'expert': return <FaCrown className="text-purple-500" />;
    default: return <FaSeedling className="text-green-500" />;
  }
};

const getCategoryEmoji = (category: string) => {
  switch (category) {
    case 'latin': return '🌶️';
    case 'ballroom': return '👑';
    case 'street': return '🏙️';
    case 'contemporary': return '🎭';
    case 'traditional': return '🏛️';
    default: return '💃';
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'latin': return 'bg-red-500';
    case 'ballroom': return 'bg-purple-500';
    case 'street': return 'bg-gray-600';
    case 'contemporary': return 'bg-blue-500';
    case 'traditional': return 'bg-amber-600';
    default: return 'bg-primary';
  }
};

// Cache this page for 1 hour
export const revalidate = 3600;

// Generate dynamic SEO metadata
export async function generateMetadata({ params }: Props) {
  const locale = params.locale as Locale;
  const messages = await getMessages(locale);
  const mt = (key: string) => getTranslation(messages, key);

  await connectMongo();

  try {
    const danceStyle: any = await findDanceStyleByParam(params.styleId)?.lean();

    if (!danceStyle) {
      return { title: mt('meta.danceStyle.notFound') };
    }

    const totalDancers = await User.countDocuments({
      "danceStyles.danceStyle": danceStyle._id,
      isProfileComplete: true,
    });

    const styleSlug = danceStyle.slug || danceStyle._id.toString();
    const title = tReplace(mt('meta.danceStyle.title'), { styleName: danceStyle.name });
    const description = danceStyle.description
      ? tReplace(mt('meta.danceStyle.descriptionWithBio'), { bio: danceStyle.description.substring(0, 120), count: totalDancers, styleName: danceStyle.name })
      : tReplace(mt('meta.danceStyle.description'), { count: totalDancers, styleName: danceStyle.name });

    return {
      title,
      description,
      keywords: `${danceStyle.name}, ${danceStyle.name} dance, ${danceStyle.name} dancers, ${danceStyle.name} classes, ${danceStyle.name} partners, ${danceStyle.name} community, learn ${danceStyle.name}`,
      alternates: {
        canonical: `https://dancecircle.co/${params.locale}/dance-style/${styleSlug}`,
        languages: {
          en: `https://dancecircle.co/en/dance-style/${styleSlug}`,
          es: `https://dancecircle.co/es/dance-style/${styleSlug}`,
        },
      },
      openGraph: {
        title,
        description,
        url: `https://dancecircle.co/dance-style/${styleSlug}`,
        images: danceStyle.image ? [danceStyle.image] : [],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: danceStyle.image ? [danceStyle.image] : [],
      },
    };
  } catch (error) {
    console.error("Error generating dance style metadata:", error);
    return { title: mt('meta.danceStyle.fallback') };
  }
}

export default async function DanceStylePage({ params, searchParams }: Props) {
  // Get translations
  const messages = await getMessages();
  const t = (key: string) => getTranslation(messages, key);

  await connectMongo();

  // Get current session
  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session;

  // Pagination setup
  const currentPage = parseInt(searchParams.page || '1');
  const dancersPerPage = 12;
  const skip = (currentPage - 1) * dancersPerPage;

  let danceStyle: any;
  try {
    danceStyle = await findDanceStyleByParam(params.styleId)?.lean();

    if (!danceStyle) {
      notFound();
    }

    // Redirect ObjectId URLs to slug URLs
    if (isValidObjectId(params.styleId) && danceStyle.slug) {
      redirect(`/dance-style/${danceStyle.slug}`);
    }
  } catch (error) {
    if ((error as any)?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("Error fetching dance style:", error);
    notFound();
  }

  // Use the dance style's actual ObjectId for MongoDB queries
  const styleObjectId = danceStyle._id;

  // Get dancers who practice this style (with pagination)
  const dancers = await User.find({
    "danceStyles.danceStyle": styleObjectId,
    isProfileComplete: true,
  })
    .select("name username image city danceStyles")
    .populate({
      path: "city",
      model: City,
      select: "name",
    })
    .skip(skip)
    .limit(dancersPerPage)
    .lean();

  // Get level distribution
  const levelDistribution = await User.aggregate([
    { $match: { "danceStyles.danceStyle": styleObjectId, isProfileComplete: true } },
    { $unwind: "$danceStyles" },
    { $match: { "danceStyles.danceStyle": styleObjectId } },
    { $group: { _id: "$danceStyles.level", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  // Get cities where this style is popular
  const popularCities = await User.aggregate([
    { $match: { "danceStyles.danceStyle": styleObjectId, isProfileComplete: true } },
    { $group: { _id: "$city", count: { $sum: 1 } } },
    { $match: { _id: { $ne: null } } },
    { $sort: { count: -1 } },
    { $limit: 8 },
    {
      $lookup: {
        from: "cities",
        localField: "_id",
        foreignField: "_id",
        as: "cityInfo",
      },
    },
    { $unwind: "$cityInfo" },
    { $project: { name: "$cityInfo.name", count: 1, cityId: "$_id" } },
  ]);

  // Calculate total dancers
  const totalDancers = await User.countDocuments({
    "danceStyles.danceStyle": styleObjectId,
    isProfileComplete: true,
  });

  // Get most experienced dancers (experts and advanced)
  const expertDancers = await User.find({
    "danceStyles.danceStyle": styleObjectId,
    "danceStyles.level": { $in: ["expert", "advanced"] },
    isProfileComplete: true,
  })
    .select("name username image city danceStyles")
    .populate({
      path: "city",
      model: City,
      select: "name",
    })
    .limit(6)
    .lean();

  // Pagination calculations
  const totalPages = Math.ceil(totalDancers / dancersPerPage);

  // Format numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  // JSON-LD structured data for SEO
  const styleSlug = danceStyle.slug || danceStyle._id.toString();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Thing",
    name: danceStyle.name,
    description: danceStyle.description || `${danceStyle.name} dance community on DanceCircle`,
    url: `https://dancecircle.co/dance-style/${styleSlug}`,
    ...(danceStyle.image ? { image: danceStyle.image } : {}),
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
          <div className="flex items-center gap-4 mb-4">
            {danceStyle.image && (
              <div className="w-20 h-20 rounded-lg overflow-hidden shadow-lg">
                <img
                  src={danceStyle.image}
                  alt={danceStyle.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
                  {danceStyle.name}
                </h1>
                <div className={`badge badge-lg ${getCategoryColor(danceStyle.category)} text-white`}>
                  {getCategoryEmoji(danceStyle.category)} {danceStyle.category}
                </div>
              </div>
              <div className="flex items-center gap-4 text-base-content/70">
                <span className="flex items-center gap-1">
                  <FaUsers />
                  {formatNumber(totalDancers)} {t('danceStylePage.dancers')}
                </span>
                <span className="flex items-center gap-1">
                  {danceStyle.isPartnerDance ? `👫 ${t('danceStylePage.partnerDance')}` : `🕺 ${t('danceStylePage.soloDance')}`}
                </span>
              </div>
            </div>
          </div>

          {danceStyle.description && (
            <p className="text-lg text-base-content/80 max-w-4xl">
              {danceStyle.description}
            </p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-figure text-primary">
              <FaUsers className="text-2xl" />
            </div>
            <div className="stat-title">{t('danceStylePage.totalDancers')}</div>
            <div className="stat-value text-primary text-2xl">{formatNumber(totalDancers)}</div>
          </div>

          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-figure text-secondary">
              <FaGlobeAmericas className="text-2xl" />
            </div>
            <div className="stat-title">{t('danceStylePage.cities')}</div>
            <div className="stat-value text-secondary text-2xl">{popularCities.length}</div>
          </div>

          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-figure text-accent">
              <FaCrown className="text-2xl" />
            </div>
            <div className="stat-title">{t('danceStylePage.expertLevel')}</div>
            <div className="stat-value text-accent text-2xl">{expertDancers.length}</div>
          </div>

          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-figure text-info">
              <FaHeart className="text-2xl" />
            </div>
            <div className="stat-title">{t('danceStylePage.category')}</div>
            <div className="stat-value text-info text-xl capitalize">{danceStyle.category}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Level Distribution */}
          <div className="lg:col-span-1">
            <div className="card bg-base-200 shadow-xl mb-6">
              <div className="card-body">
                <h2 className="card-title mb-4">{t('danceStylePage.skillLevelDistribution')}</h2>
                {levelDistribution.length > 0 ? (
                  <div className="space-y-3">
                    {DANCE_LEVELS.map(level => {
                      const levelData = levelDistribution.find(l => l._id === level.value);
                      const count = levelData?.count || 0;
                      const percentage = totalDancers > 0 ? (count / totalDancers) * 100 : 0;
                      
                      return (
                        <div key={level.value} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              {getLevelIcon(level.value)}
                              <span className="text-sm font-medium capitalize">{level.label}</span>
                            </div>
                            <span className="text-xs text-base-content/60">
                              {count} ({percentage.toFixed(0)}%)
                            </span>
                          </div>
                          <div className="w-full bg-base-content/20 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-base-content/60 text-center py-4">
                    {t('danceStylePage.noLevelData')}
                  </p>
                )}
              </div>
            </div>

            {/* Popular Cities */}
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <h2 className="card-title mb-4">{t('danceStylePage.popularCities')}</h2>
                {popularCities.length > 0 ? (
                  <div className="space-y-2">
                    {popularCities.map((city: any, index: number) => (
                      <Link
                        key={city.cityId}
                        href={`/city/${city.cityId}`}
                        className="flex justify-between items-center hover:bg-base-300 rounded p-2 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-primary font-medium">#{index + 1}</span>
                          <FaMapMarkerAlt className="text-xs text-base-content/50" />
                          <span className="text-sm font-medium">{city.name}</span>
                        </div>
                        <span className="text-xs text-base-content/60">
                          {city.count} {city.count !== 1 ? t('danceStylePage.dancers') : t('musicPage.dancer')}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-base-content/60 text-center py-4">
                    {t('danceStylePage.noCityData')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Dancers Grid */}
          <div className="lg:col-span-2">
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="card-title">{t('danceStylePage.dancersPracticing')} {danceStyle.name}</h2>
                  <span className="text-sm text-base-content/60">
                    {t('danceStylePage.pageOf').replace('{current}', currentPage.toString()).replace('{total}', totalPages.toString()).replace('{count}', formatNumber(totalDancers))}
                  </span>
                </div>

                {dancers.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                      {dancers.map((dancer: any) => {
                        const userDanceStyle = dancer.danceStyles.find(
                          (ds: any) => ds.danceStyle.toString() === styleObjectId.toString()
                        );
                        const level = userDanceStyle?.level || 'beginner';
                        const levelInfo = DANCE_LEVELS.find(l => l.value === level);

                        return (
                          <Link
                            key={dancer._id}
                            href={`/dancer/${dancer._id}`}
                            className="group"
                          >
                            <div className="card bg-base-100 shadow-sm hover:shadow-md transition-all duration-200 group-hover:scale-105">
                              <div className="card-body p-3">
                                <div className="flex flex-col items-center text-center">
                                  <div className="avatar mb-2">
                                    <div className="w-12 h-12 rounded-full">
                                      {dancer.image ? (
                                        <img
                                          src={dancer.image}
                                          alt={dancer.name}
                                          className="w-full h-full object-cover rounded-full"
                                        />
                                      ) : (
                                        <div className="bg-primary text-primary-content rounded-full w-full h-full flex items-center justify-center">
                                          <span className="text-sm">
                                            {dancer.name?.charAt(0)?.toUpperCase() || "?"}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <h3 className="font-medium text-sm truncate w-full">
                                    {dancer.name}
                                  </h3>
                                  
                                  {dancer.username && (
                                    <p className="text-xs text-base-content/60 truncate w-full">
                                      @{dancer.username}
                                    </p>
                                  )}
                                  
                                  {dancer.city && (
                                    <div className="flex items-center gap-1 text-xs text-base-content/50 mt-1">
                                      <FaMapMarkerAlt className="h-2 w-2" />
                                      <span className="truncate">{dancer.city.name}</span>
                                    </div>
                                  )}
                                  
                                  {levelInfo && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <span className="text-xs">{levelInfo.emoji}</span>
                                      <span className="badge badge-xs badge-outline">
                                        {levelInfo.label}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>

                    {/* Pagination */}
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      baseUrl={`/dance-style/${params.styleId}`}
                    />
                  </>
                ) : (
                  <div className="text-center py-8 text-base-content/60">
                    <FaUsers className="mx-auto text-4xl mb-4 opacity-50" />
                    <p>{t('danceStylePage.noDancersPracticing')} {danceStyle.name} {t('danceStylePage.yet')}</p>
                    {isLoggedIn && (
                      <p className="text-sm mt-2">
                        {t('danceStylePage.beTheFirst')}{" "}
                        <Link href="/profile" className="link link-primary">
                          {t('danceStylePage.addThisToProfile')}
                        </Link>
                        !
                      </p>
                    )}
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
              <div className="card-body">
                <h2 className="card-title justify-center text-2xl mb-2">
                  {t('danceStylePage.love')} {danceStyle.name}?
                </h2>
                <p className="mb-4">
                  {t('danceStylePage.join')} {formatNumber(totalDancers)} {t('danceStylePage.dancersAndConnect')} {danceStyle.name} {t('danceStylePage.communityWorldwide')}
                </p>
                <div className="card-actions justify-center">
                  <Link href="/api/auth/signin" className="btn btn-white">
                    {t('danceStylePage.joinDanceCircle')}
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
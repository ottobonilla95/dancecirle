import { notFound } from "next/navigation";
import { Link } from "@/navigation";
import Image from "next/image";
import { Metadata } from "next";
import connectMongo from "@/libs/mongoose";
import Release from "@/models/Release";
import User from "@/models/User";
import { FaArrowLeft, FaSpotify, FaYoutube, FaExternalLinkAlt } from "react-icons/fa";
import config from "@/config";
import { getMessages, getTranslation, tReplace, type Locale } from "@/lib/i18n";

interface ReleasesPageProps {
  params: {
    locale: string;
    producerId: string;
  };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ReleasesPageProps): Promise<Metadata> {
  const locale = (params.locale || 'en') as Locale;
  const messages = await getMessages(locale);
  const mt = (key: string) => getTranslation(messages, key);

  try {
    await connectMongo();

    const producer = await User.findById(params.producerId)
      .select("name username image isProducer")
      .lean() as any;

    if (!producer || !producer.isProducer) {
      return {
        title: mt('meta.releases.notFound'),
      };
    }

    const releasesCount = await Release.countDocuments({ producer: params.producerId });
    const title = tReplace(mt('meta.releases.title'), { producer: producer.name });
    const description = tReplace(mt('meta.releases.description'), { producer: producer.name, count: releasesCount, releaseWord: releasesCount === 1 ? mt('meta.releases.release') : mt('meta.releases.releasesPl') });

    return {
      title,
      description,
      alternates: {
        canonical: `https://dancecircle.co/${params.locale}/releases/${params.producerId}`,
        languages: {
          en: `https://dancecircle.co/en/releases/${params.producerId}`,
          es: `https://dancecircle.co/es/releases/${params.producerId}`,
        },
      },
      openGraph: {
        title,
        description,
        type: "profile",
        url: `${config.domainName}/releases/${params.producerId}`,
        images: producer.image ? [producer.image] : [],
      },
      twitter: {
        card: "summary",
        title,
        description,
        images: producer.image ? [producer.image] : [],
      },
    };
  } catch (error) {
    return {
      title: mt('meta.releases.fallback'),
    };
  }
}

export default async function ReleasesPage({ params }: ReleasesPageProps) {
  const locale = (params.locale || 'en') as Locale;
  const messages = await getMessages(locale);
  const t = (key: string) => getTranslation(messages, key);

  await connectMongo();

  // Fetch producer
  const producer = await User.findById(params.producerId)
    .select("name username image isProducer producerProfile")
    .lean() as any;

  if (!producer || !producer.isProducer) {
    notFound();
  }

  // Fetch all releases for this producer
  const releases = await Release.find({ producer: params.producerId })
    .sort({ createdAt: -1 })
    .lean() as any[];

  const formatDate = (date: Date) => {
    const releaseDate = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - releaseDate.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return t('releasesPage.today');
    if (diffDays === 1) return t('releasesPage.yesterday');
    if (diffDays < 7) return tReplace(t('releasesPage.daysAgo'), { count: diffDays });
    if (diffDays < 30) return tReplace(t('releasesPage.weeksAgo'), { count: Math.floor(diffDays / 7) });
    return releaseDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Back Button */}
      <Link
        href={`/${producer.username || producer._id}`}
        className="btn btn-ghost btn-sm gap-2 mb-6"
      >
        <FaArrowLeft />
        {t('releasesPage.backToProfile')}
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="avatar">
            <div className="w-20 h-20 rounded-full">
              <Image
                src={producer.image || "/default-avatar.png"}
                alt={producer.name}
                width={80}
                height={80}
              />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold">{producer.name}</h1>
            <p className="text-base-content/60">{t('releasesPage.allReleases')}</p>
          </div>
        </div>
      </div>

      {/* Releases Grid */}
      {releases.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-lg text-base-content/60">{t('releasesPage.noReleasesYet')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {releases.map((release: any) => (
            <Link
              key={release._id.toString()}
              href={`/release/${release._id.toString()}`}
              className="card bg-base-200 hover:bg-base-300 transition-colors shadow-lg"
            >
              <div className="card-body">
                <div className="flex items-start gap-3">
                  {/* Platform Icon */}
                  <div className="flex-shrink-0">
                    {release.platform === "spotify" ? (
                      <FaSpotify className="text-4xl text-green-500" />
                    ) : (
                      <FaYoutube className="text-4xl text-red-500" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg line-clamp-2">
                      {release.title}
                    </h3>
                    {release.description && (
                      <p className="text-sm text-base-content/70 line-clamp-2 mt-1">
                        {release.description}
                      </p>
                    )}
                    <p className="text-xs text-base-content/50 mt-2">
                      {formatDate(release.createdAt)}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="flex-shrink-0">
                    <FaExternalLinkAlt className="text-base-content/40" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Back to Profile Button */}
      <div className="mt-12 text-center">
        <Link
          href={`/${producer.username || producer._id}`}
          className="btn btn-outline btn-lg"
        >
          {tReplace(t('releasesPage.backTo'), { name: producer.name })}
        </Link>
      </div>
    </div>
  );
}


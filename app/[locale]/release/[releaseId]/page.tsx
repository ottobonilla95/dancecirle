import { notFound } from "next/navigation";
import { Link } from "@/navigation";
import Image from "next/image";
import { Metadata } from "next";
import { getBreadcrumbJsonLd } from "@/libs/seo";
import connectMongo from "@/libs/mongoose";
import Release from "@/models/Release";
import User from "@/models/User";
import { FaArrowLeft, FaSpotify, FaYoutube, FaExternalLinkAlt } from "react-icons/fa";
import config from "@/config";
import { getMessages, getTranslation, tReplace, type Locale } from "@/lib/i18n";

interface ReleasePageProps {
  params: {
    locale: string;
    releaseId: string;
  };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ReleasePageProps): Promise<Metadata> {
  const locale = (params.locale || 'en') as Locale;
  const messages = await getMessages(locale);
  const mt = (key: string) => getTranslation(messages, key);

  try {
    await connectMongo();

    const release = await Release.findById(params.releaseId)
      .populate({
        path: "producer",
        select: "name username image",
      })
      .lean() as any;

    if (!release) {
      return {
        title: mt('meta.release.notFound'),
      };
    }

    const producer = release.producer;
    const title = tReplace(mt('meta.release.title'), { title: release.title, producer: producer.name });
    const description = release.description
      ? `${release.description.substring(0, 155)}...`
      : tReplace(mt('meta.release.description'), { title: release.title, producer: producer.name, platform: release.platform === 'spotify' ? 'Spotify' : 'YouTube' });

    return {
      title,
      description,
      alternates: {
        canonical: `https://www.dancecircle.co/${params.locale}/release/${params.releaseId}`,
        languages: {
          en: `https://www.dancecircle.co/en/release/${params.releaseId}`,
          es: `https://www.dancecircle.co/es/release/${params.releaseId}`,
        },
      },
      openGraph: {
        title,
        description,
        type: "music.song",
        url: `https://${config.domainName}/release/${params.releaseId}`,
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
      title: mt('meta.release.fallback'),
    };
  }
}

export default async function ReleasePage({ params }: ReleasePageProps) {
  const locale = (params.locale || 'en') as Locale;
  const messages = await getMessages(locale);
  const t = (key: string) => getTranslation(messages, key);

  await connectMongo();

  // Fetch release with producer info
  const release = await Release.findById(params.releaseId)
    .populate({
      path: "producer",
      select: "name username image isProducer producerProfile",
    })
    .lean() as any;

  if (!release) {
    notFound();
  }

  const producer = release.producer;

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // JSON-LD structured data for music release
  const releaseJsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicRecording",
    name: release.title,
    byArtist: {
      "@type": "Person",
      name: producer.name,
      url: `https://${config.domainName}/${producer.username || producer._id}`,
      ...(producer.image ? { image: producer.image } : {}),
    },
    ...(release.description ? { description: release.description } : {}),
    ...(release.createdAt ? { datePublished: release.createdAt } : {}),
    ...(release.genres?.length > 0 ? { genre: release.genres } : {}),
    ...(release.url ? {
      subjectOf: {
        "@type": "MediaObject",
        contentUrl: release.url,
        encodingFormat: release.platform === "spotify" ? "audio" : "video",
      }
    } : {}),
    url: `https://${config.domainName}/release/${params.releaseId}`,
  };

  const breadcrumbItems = [
    { name: "DanceCircle", url: `https://${config.domainName}` },
    { name: t('breadcrumb.music'), url: `https://${config.domainName}/music` },
    { name: release.title, url: `https://${config.domainName}/release/${params.releaseId}` },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(releaseJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getBreadcrumbJsonLd(breadcrumbItems)) }}
      />
      {/* Back Button */}
      <Link
        href={`/${producer.username || producer._id}`}
        className="btn btn-ghost btn-sm gap-2 mb-6"
      >
        <FaArrowLeft />
        {t('releasePage.backToProfile')}
      </Link>

      {/* Release Card */}
      <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              {/* Producer Image */}
              <Link href={`/${producer.username || producer._id}`}>
                <div className="avatar">
                  <div className="w-16 h-16 rounded-full">
                    <Image
                      src={producer.image || "/default-avatar.png"}
                      alt={producer.name}
                      width={64}
                      height={64}
                    />
                  </div>
                </div>
              </Link>

              {/* Producer Info */}
              <div>
                <Link
                  href={`/${producer.username || producer._id}`}
                  className="font-bold text-lg hover:underline"
                >
                  {producer.name}
                </Link>
                <p className="text-sm text-base-content/60">
                  {formatDate(release.createdAt)}
                </p>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold mb-4">{release.title}</h1>

            {/* Description */}
            {release.description && (
              <p className="text-base-content/80 whitespace-pre-wrap mb-6">
                {release.description}
              </p>
            )}

            {/* Embedded Player */}
            <div className="mb-6">
              {release.platform === "spotify" && release.spotifyTrackId && (
                <iframe
                  src={`https://open.spotify.com/embed/track/${release.spotifyTrackId}`}
                  width="100%"
                  height="352"
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  className="rounded-lg"
                ></iframe>
              )}

              {release.platform === "youtube" && release.youtubeVideoId && (
                <div className="aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${release.youtubeVideoId}`}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="rounded-lg"
                  ></iframe>
                </div>
              )}
            </div>

            {/* External Link Button */}
            <a
              href={release.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary gap-2"
            >
              {release.platform === "spotify" ? (
                <>
                  <FaSpotify />
                  {t('releasePage.listenOnSpotify')}
                </>
              ) : (
                <>
                  <FaYoutube />
                  {t('releasePage.watchOnYouTube')}
                </>
              )}
              <FaExternalLinkAlt className="text-sm" />
            </a>

            {/* Producer Bio (if available) */}
            {producer.producerProfile?.bio && (
              <div className="divider"></div>
            )}
            {producer.producerProfile?.bio && (
              <div>
                <h3 className="font-bold text-lg mb-2">{t('releasePage.aboutProducer')}</h3>
                <p className="text-base-content/70">
                  {producer.producerProfile.bio}
                </p>
              </div>
            )}
          </div>
        </div>

      {/* More from this producer */}
      <div className="mt-8 text-center">
        <Link
          href={`/${producer.username || producer._id}`}
          className="btn btn-outline btn-lg gap-2"
        >
          {tReplace(t('releasePage.moreFrom'), { name: producer.name })}
        </Link>
      </div>
    </div>
  );
}


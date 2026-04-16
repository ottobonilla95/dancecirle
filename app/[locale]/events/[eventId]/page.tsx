import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getBreadcrumbJsonLd } from "@/libs/seo";
import connectMongo from "@/libs/mongoose";
import DJEvent from "@/models/DJEvent";
import EventComment from "@/models/EventComment";
import EventCommentForm from "@/components/EventCommentForm";
import config from "@/config";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import { Link } from "@/navigation";
import { FaArrowLeft, FaCalendar, FaMapMarkerAlt, FaStar } from "react-icons/fa";
import { getMessages, getTranslation, tReplace, type Locale } from "@/lib/i18n";

interface EventPageProps {
  params: {
    locale: string;
    eventId: string;
  };
}

// Cache this page for 1 hour
export const revalidate = 3600;

// Generate metadata for SEO
export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const locale = (params.locale || 'en') as Locale;
  const messages = await getMessages(locale);
  const mt = (key: string) => getTranslation(messages, key);

  try {
    await connectMongo();

    const event = await DJEvent.findById(params.eventId)
      .populate({
        path: "djId",
        select: "name username image",
      })
      .lean() as any;

    if (!event) {
      return {
        title: mt('meta.event.notFound'),
      };
    }

    const title = tReplace(mt('meta.event.title'), { eventName: event.eventName, city: event.city });
    const description = event.description
      ? `${event.description.substring(0, 155)}...`
      : tReplace(mt('meta.event.description'), { eventName: event.eventName, djName: event.djId?.name || 'Unknown', city: event.city, venue: event.venue ? `At ${event.venue}. ` : '', date: new Date(event.eventDate).toLocaleDateString() });

    return {
      title,
      description,
      alternates: {
        canonical: `https://www.dancecircle.co/${params.locale}/events/${params.eventId}`,
        languages: {
          en: `https://www.dancecircle.co/en/events/${params.eventId}`,
          es: `https://www.dancecircle.co/es/events/${params.eventId}`,
        },
      },
      openGraph: {
        title,
        description,
        type: "website",
        url: `https://${config.domainName}/${params.locale}/events/${params.eventId}`,
        images: event.imageUrl ? [event.imageUrl] : (event.djId?.image ? [event.djId.image] : []),
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: event.imageUrl ? [event.imageUrl] : (event.djId?.image ? [event.djId.image] : []),
      },
    };
  } catch (error) {
    return {
      title: mt('meta.event.fallback'),
    };
  }
}

export default async function EventDetailPage({ params }: EventPageProps) {
  await connectMongo();

  const messages = await getMessages();
  const t = (key: string) => getTranslation(messages, key);

  const session = await getServerSession(authOptions);

  const event = await DJEvent.findById(params.eventId)
    .populate({
      path: "djId",
      select: "name username image",
    })
    .lean() as any;

  if (!event) {
    notFound();
  }

  // Fetch comments server-side
  const comments = await EventComment.find({ eventId: params.eventId })
    .sort({ createdAt: -1 })
    .lean();

  const serializedComments = comments.map((c: any) => ({
    _id: c._id.toString(),
    userId: c.userId.toString(),
    userName: c.userName,
    userImage: c.userImage,
    comment: c.comment,
    rating: c.rating,
    createdAt: c.createdAt.toISOString(),
  }));

  // Check if current user has already commented
  const hasCommented = session?.user
    ? serializedComments.some((c: any) => c.userId === session.user.id)
    : false;

  const eventJsonLd = {
    "@context": "https://schema.org",
    "@type": "DanceEvent",
    name: event.eventName,
    startDate: event.eventDate,
    location: {
      "@type": "Place",
      ...(event.venue ? { name: event.venue } : {}),
      address: {
        "@type": "PostalAddress",
        addressLocality: event.city,
      },
    },
    ...(event.description ? { description: event.description.slice(0, 200) } : {}),
    ...(event.imageUrl ? { image: event.imageUrl } : {}),
    ...(event.genres?.length > 0 ? { about: event.genres.map((g: string) => ({ "@type": "Thing", name: g })) } : {}),
    performer: event.djId ? {
      "@type": "Person",
      name: event.djId.name,
      url: `https://${config.domainName}/${event.djId.username || `dancer/${event.djId._id}`}`,
    } : undefined,
    url: `https://${config.domainName}/${params.locale}/events/${params.eventId}`,
  };

  const breadcrumbItems = [
    { name: "DanceCircle", url: `https://${config.domainName}` },
    { name: event.eventName, url: `https://${config.domainName}/${params.locale}/events/${params.eventId}` },
  ];

  return (
    <div className="min-h-screen bg-base-100 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getBreadcrumbJsonLd(breadcrumbItems)) }}
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back button */}
        <Link href="/dashboard" className="btn btn-ghost btn-sm mb-4">
          <FaArrowLeft /> {t('eventDetail.back')}
        </Link>

        {/* Event Details */}
        <div className="card bg-base-200 shadow-xl mb-6">
          <div className="card-body">
            {event.imageUrl && (
              <div className="w-full h-64 rounded-lg overflow-hidden mb-4">
                <img
                  src={event.imageUrl}
                  alt={event.eventName}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <h1 className="text-3xl font-bold mb-4">{event.eventName}</h1>

            <div className="space-y-2 text-base-content/70 mb-4">
              <p className="flex items-center gap-2">
                <FaMapMarkerAlt />
                <span>
                  {event.venue && `${event.venue} • `}
                  {event.city}
                </span>
              </p>
              <p className="flex items-center gap-2">
                <FaCalendar />
                <span>
                  {new Date(event.eventDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </p>
            </div>

            {event.description && (
              <p className="text-base-content/80 mb-4">{event.description}</p>
            )}

            {event.genres && event.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {event.genres.map((genre: string, index: number) => (
                  <span key={index} className="badge badge-primary">
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {/* DJ Info */}
            {event.djId && (
              <>
                <div className="divider">{t('eventDetail.dj')}</div>
                <Link
                  href={`/${event.djId.username || `dancer/${event.djId._id}`}`}
                  className="flex items-center gap-3 hover:bg-base-300 p-3 rounded-lg transition-all"
                >
                  {event.djId.image && (
                    <div className="avatar">
                      <div className="w-12 h-12 rounded-full">
                        <img src={event.djId.image} alt={event.djId.name} />
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{event.djId.name}</p>
                    <p className="text-sm text-base-content/60">@{event.djId.username}</p>
                  </div>
                </Link>
              </>
            )}

            {/* Rating Summary */}
            {event.totalComments > 0 && (
              <div className="mt-4 p-4 bg-base-300 rounded-lg">
                <div className="flex items-center gap-2">
                  <FaStar className="text-yellow-500 text-xl" />
                  <span className="text-2xl font-bold">{event.averageRating.toFixed(1)}</span>
                  <span className="text-base-content/60">
                    ({event.totalComments} {event.totalComments === 1 ? t('eventDetail.review') : t('eventDetail.reviews')})
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Comment Form (client-side interactive) */}
        <EventCommentForm
          eventId={params.eventId}
          isLoggedIn={!!session}
          hasCommented={hasCommented}
        />

        {/* Comments List (server-rendered) */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title mb-4">
              {t('eventDetail.reviewsTitle')} ({serializedComments.length})
            </h2>

            {serializedComments.length === 0 ? (
              <p className="text-center text-base-content/60 py-8">
                {t('eventDetail.noReviews')}
              </p>
            ) : (
              <div className="space-y-4">
                {serializedComments.map((comment: any) => (
                  <div key={comment._id} className="bg-base-300 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      {comment.userImage && (
                        <div className="avatar">
                          <div className="w-10 h-10 rounded-full">
                            <img src={comment.userImage} alt={comment.userName} />
                          </div>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold">{comment.userName}</p>
                          <div className="flex items-center gap-1 text-yellow-500">
                            {[...Array(comment.rating)].map((_: any, i: number) => (
                              <FaStar key={i} />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-base-content/60 mt-1">
                          {new Date(comment.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                        <p className="mt-2">{comment.comment}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { Metadata } from "next";
import { Link } from "@/navigation";
import { notFound } from "next/navigation";
import { isValidObjectId } from "mongoose";
import BackButton from "@/components/BackButton";
import connectMongo from "@/libs/mongoose";
import OrganizerEvent from "@/models/OrganizerEvent";
import User from "@/models/User";
import City from "@/models/City";
import Country from "@/models/Country";
import config from "@/config";
import { getMessages, getTranslation, tReplace, type Locale } from "@/lib/i18n";

interface EventPageProps {
  params: {
    locale: string;
    eventId: string;
  };
}

async function getEvent(eventId: string) {
  await connectMongo();

  return OrganizerEvent.findById(eventId)
    .populate({
      path: "organizerId",
      model: User,
      select: "name username image eventOrganizerProfile.organizationName",
    })
    .populate({
      path: "city",
      model: City,
      select: "name country",
      populate: {
        path: "country",
        model: Country,
        select: "name code",
      },
    })
    .lean();
}

export async function generateMetadata({
  params,
}: EventPageProps): Promise<Metadata> {
  const locale = (params.locale || 'en') as Locale;
  const messages = await getMessages(locale);
  const mt = (key: string) => getTranslation(messages, key);

  if (!isValidObjectId(params.eventId)) {
    return {
      title: mt('meta.organizerEvent.notFound'),
    };
  }

  try {
    const event: any = await getEvent(params.eventId);

    if (!event) {
      return {
        title: mt('meta.organizerEvent.notFound'),
      };
    }

    const cityName = event.city?.name ? ` in ${event.city.name}` : "";
    const title = tReplace(mt('meta.organizerEvent.title'), { eventTitle: event.title, city: cityName });
    const description =
      event.description?.slice(0, 160) ||
      tReplace(mt('meta.organizerEvent.description'), { city: cityName });

    return {
      title,
      description,
      alternates: {
        canonical: `https://dancecircle.co/${params.locale}/organizer-events/${params.eventId}`,
        languages: {
          en: `https://dancecircle.co/en/organizer-events/${params.eventId}`,
          es: `https://dancecircle.co/es/organizer-events/${params.eventId}`,
        },
      },
      openGraph: {
        title,
        description,
        url: `https://${config.domainName}/organizer-events/${params.eventId}`,
        images: event.flyerUrl ? [event.flyerUrl] : [],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: event.flyerUrl ? [event.flyerUrl] : [],
      },
    };
  } catch (error) {
    console.error("Error generating organizer event metadata:", error);
    return {
      title: mt('meta.organizerEvent.fallback'),
    };
  }
}

export default async function OrganizerEventPage({ params }: EventPageProps) {
  const locale = (params.locale || 'en') as Locale;
  const messages = await getMessages(locale);
  const t = (key: string) => getTranslation(messages, key);

  if (!isValidObjectId(params.eventId)) {
    notFound();
  }

  const event: any = await getEvent(params.eventId);

  if (!event) {
    notFound();
  }

  const formattedDate = new Date(event.startsAt).toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  // JSON-LD structured data for event
  const eventJsonLd = {
    "@context": "https://schema.org",
    "@type": "DanceEvent",
    name: event.title,
    startDate: event.startsAt,
    ...(event.endsAt ? { endDate: event.endsAt } : {}),
    location: {
      "@type": "Place",
      name: event.venue || event.city?.name,
      address: {
        "@type": "PostalAddress",
        addressLocality: event.city?.name,
        addressCountry: event.city?.country?.name,
      },
    },
    ...(event.description ? { description: event.description.slice(0, 200) } : {}),
    ...(event.flyerUrl ? { image: event.flyerUrl } : {}),
    ...(event.ticketUrl ? { url: event.ticketUrl } : {}),
    organizer: {
      "@type": "Organization",
      name: event.organizerId?.eventOrganizerProfile?.organizationName || event.organizerId?.name,
    },
    ...(typeof event.priceAmount === "number" ? {
      offers: {
        "@type": "Offer",
        price: event.priceAmount,
        priceCurrency: event.priceCurrency || "USD",
        ...(event.ticketUrl ? { url: event.ticketUrl } : {}),
      },
    } : {}),
  };

  return (
    <main className="min-h-screen bg-base-100 pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
      />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <BackButton label={t('organizerEvent.back')} className="mb-4" />

        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            {event.flyerUrl && (
              <div className="w-full h-64 md:h-96 rounded-xl overflow-hidden mb-4">
                <img
                  src={event.flyerUrl}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <h1 className="text-3xl font-bold">{event.title}</h1>

            <div className="space-y-2 text-base-content/75 mt-4">
              <p>{formattedDate}</p>
              <p>
                {event.venue ? `${event.venue} • ` : ""}
                {event.city?.name}
                {event.city?.country?.name ? `, ${event.city.country.name}` : ""}
              </p>
              {typeof event.priceAmount === "number" && (
                <p>
                  {t('organizerEvent.price')} {event.priceCurrency || "USD"} {event.priceAmount.toFixed(2)}
                </p>
              )}
            </div>

            {event.description && (
              <p className="mt-4 text-base-content/85 whitespace-pre-wrap">
                {event.description}
              </p>
            )}

            {event.danceStyles?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {event.danceStyles.map((style: string) => (
                  <span key={style} className="badge badge-primary">
                    {style}
                  </span>
                ))}
              </div>
            )}

            <div className="divider my-2" />

            <div className="flex items-center justify-between gap-4 flex-wrap">
              <Link
                href={`/dancer/${event.organizerId?._id}`}
                className="flex items-center gap-3 hover:bg-base-300 rounded-lg p-2 transition-colors"
              >
                <div className="avatar">
                  <div className="w-12 rounded-full">
                    {event.organizerId?.image ? (
                      <img src={event.organizerId.image} alt={event.organizerId.name} />
                    ) : (
                      <div className="bg-primary text-primary-content w-full h-full flex items-center justify-center rounded-full">
                        {(event.organizerId?.name || "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <p className="font-semibold">
                    {event.organizerId?.eventOrganizerProfile?.organizationName ||
                      event.organizerId?.name}
                  </p>
                  <p className="text-sm text-base-content/60">
                    @{event.organizerId?.username}
                  </p>
                </div>
              </Link>

              {event.ticketUrl && (
                <a
                  href={event.ticketUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary"
                >
                  {t('organizerEvent.getTickets')}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

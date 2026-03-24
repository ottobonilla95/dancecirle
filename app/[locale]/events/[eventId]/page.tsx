import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getBreadcrumbJsonLd } from "@/libs/seo";
import connectMongo from "@/libs/mongoose";
import DJEvent from "@/models/DJEvent";
import EventDetailClient from "@/components/EventDetailClient";
import config from "@/config";
import { getMessages, getTranslation, tReplace, type Locale } from "@/lib/i18n";

interface EventPageProps {
  params: {
    locale: string;
    eventId: string;
  };
}

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
        url: `https://${config.domainName}/events/${params.eventId}`,
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

  const event = await DJEvent.findById(params.eventId)
    .populate({
      path: "djId",
      select: "name username image",
    })
    .lean() as any;

  const eventJsonLd = event ? {
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
      url: `https://${config.domainName}/dancer/${event.djId._id}`,
    } : undefined,
    url: `https://${config.domainName}/events/${params.eventId}`,
  } : null;

  const breadcrumbItems = [
    { name: "DanceCircle", url: `https://${config.domainName}` },
    ...(event ? [{ name: event.eventName, url: `https://${config.domainName}/events/${params.eventId}` }] : []),
  ];

  return (
    <>
      {eventJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getBreadcrumbJsonLd(breadcrumbItems)) }}
      />
      <EventDetailClient eventId={params.eventId} />
    </>
  );
}

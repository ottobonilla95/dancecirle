import { notFound } from "next/navigation";
import { Metadata } from "next";
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
        canonical: `https://dancecircle.co/${params.locale}/events/${params.eventId}`,
        languages: {
          en: `https://dancecircle.co/en/events/${params.eventId}`,
          es: `https://dancecircle.co/es/events/${params.eventId}`,
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
  return <EventDetailClient eventId={params.eventId} />;
}

import { notFound } from "next/navigation";
import { Metadata } from "next";
import connectMongo from "@/libs/mongoose";
import DJEvent from "@/models/DJEvent";
import EventDetailClient from "@/components/EventDetailClient";
import config from "@/config";

interface EventPageProps {
  params: {
    eventId: string;
  };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
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
        title: "Event Not Found | DanceCircle",
      };
    }

    const title = `${event.eventName} - ${event.city} | DanceCircle`;
    const description = event.description 
      ? `${event.description.substring(0, 155)}...` 
      : `${event.eventName} by DJ ${event.djId?.name || 'Unknown'} in ${event.city}. ${event.venue ? `At ${event.venue}. ` : ''}${new Date(event.eventDate).toLocaleDateString()}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        url: `${config.domainName}/events/${params.eventId}`,
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
      title: "Event | DanceCircle",
    };
  }
}

export default async function EventDetailPage({ params }: EventPageProps) {
  return <EventDetailClient eventId={params.eventId} />;
}

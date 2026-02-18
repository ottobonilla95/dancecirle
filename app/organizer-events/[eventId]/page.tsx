import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isValidObjectId } from "mongoose";
import BackButton from "@/components/BackButton";
import connectMongo from "@/libs/mongoose";
import OrganizerEvent from "@/models/OrganizerEvent";
import User from "@/models/User";
import City from "@/models/City";
import Country from "@/models/Country";
import config from "@/config";

interface EventPageProps {
  params: {
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
  if (!isValidObjectId(params.eventId)) {
    return {
      title: "Event Not Found | DanceCircle",
    };
  }

  try {
    const event: any = await getEvent(params.eventId);

    if (!event) {
      return {
        title: "Event Not Found | DanceCircle",
      };
    }

    const cityName = event.city?.name ? ` in ${event.city.name}` : "";
    const title = `${event.title}${cityName} | DanceCircle`;
    const description =
      event.description?.slice(0, 160) ||
      `Discover this social dance event${cityName} on DanceCircle.`;

    return {
      title,
      description,
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
      title: "Event | DanceCircle",
    };
  }
}

export default async function OrganizerEventPage({ params }: EventPageProps) {
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

  return (
    <main className="min-h-screen bg-base-100 pb-24">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <BackButton label="Back" className="mb-4" />

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
                  Price: {event.priceCurrency || "USD"} {event.priceAmount.toFixed(2)}
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
                  Get Tickets
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

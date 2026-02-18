import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isValidObjectId } from "mongoose";
import { authOptions } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";
import OrganizerEvent from "@/models/OrganizerEvent";
import User from "@/models/User";
import City from "@/models/City";
import Country from "@/models/Country";

function parseOptionalUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";

  const parsed = new URL(trimmed);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("URL must start with http or https");
  }
  return trimmed;
}

function parseDanceStyles(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 10);
}

async function getPopulatedEvent(eventId: string) {
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

// GET /api/organizer-events/[eventId]
export async function GET(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    if (!isValidObjectId(params.eventId)) {
      return NextResponse.json({ error: "Invalid eventId" }, { status: 400 });
    }

    await connectMongo();

    const event = await getPopulatedEvent(params.eventId);

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Error fetching organizer event:", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}

// PUT /api/organizer-events/[eventId]
export async function PUT(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isValidObjectId(params.eventId)) {
      return NextResponse.json({ error: "Invalid eventId" }, { status: 400 });
    }

    const body = await req.json();

    await connectMongo();

    const event = await OrganizerEvent.findById(params.eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.organizerId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (body.title !== undefined) {
      if (typeof body.title !== "string" || !body.title.trim()) {
        return NextResponse.json(
          { error: "title must be a non-empty string" },
          { status: 400 }
        );
      }
      event.title = body.title.trim().slice(0, 120);
    }

    if (body.venue !== undefined) {
      if (typeof body.venue !== "string") {
        return NextResponse.json(
          { error: "venue must be a string" },
          { status: 400 }
        );
      }
      event.venue = body.venue.trim().slice(0, 160);
    }

    if (body.cityId !== undefined) {
      if (typeof body.cityId !== "string" || !isValidObjectId(body.cityId)) {
        return NextResponse.json({ error: "Invalid cityId" }, { status: 400 });
      }

      const cityExists = await City.exists({ _id: body.cityId });
      if (!cityExists) {
        return NextResponse.json({ error: "City not found" }, { status: 404 });
      }

      event.city = body.cityId;
    }

    if (body.startsAt !== undefined) {
      if (typeof body.startsAt !== "string" || !body.startsAt.trim()) {
        return NextResponse.json(
          { error: "startsAt must be a valid date string" },
          { status: 400 }
        );
      }

      const startsAt = new Date(body.startsAt);
      if (Number.isNaN(startsAt.getTime())) {
        return NextResponse.json(
          { error: "startsAt must be a valid date string" },
          { status: 400 }
        );
      }

      event.startsAt = startsAt;
    }

    if (body.description !== undefined) {
      if (typeof body.description !== "string") {
        return NextResponse.json(
          { error: "description must be a string" },
          { status: 400 }
        );
      }
      event.description = body.description.trim().slice(0, 2000);
    }

    if (body.flyerUrl !== undefined) {
      try {
        event.flyerUrl = parseOptionalUrl(body.flyerUrl);
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Invalid flyerUrl" },
          { status: 400 }
        );
      }
    }

    if (body.ticketUrl !== undefined) {
      try {
        event.ticketUrl = parseOptionalUrl(body.ticketUrl);
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Invalid ticketUrl" },
          { status: 400 }
        );
      }
    }

    if (body.danceStyles !== undefined) {
      event.danceStyles = parseDanceStyles(body.danceStyles);
    }

    if (body.priceAmount !== undefined) {
      if (body.priceAmount === null || body.priceAmount === "") {
        event.priceAmount = undefined;
        event.priceCurrency = "USD";
      } else {
        const parsedPrice = Number(body.priceAmount);
        if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
          return NextResponse.json(
            { error: "priceAmount must be a number greater than or equal to 0" },
            { status: 400 }
          );
        }
        event.priceAmount = parsedPrice;
      }
    }

    if (body.priceCurrency !== undefined) {
      if (typeof body.priceCurrency !== "string" || body.priceCurrency.trim().length !== 3) {
        return NextResponse.json(
          { error: "priceCurrency must be a 3-letter code" },
          { status: 400 }
        );
      }
      event.priceCurrency = body.priceCurrency.trim().toUpperCase();
    }

    await event.save();

    const populatedEvent = await getPopulatedEvent(params.eventId);

    return NextResponse.json({
      success: true,
      event: populatedEvent,
    });
  } catch (error) {
    console.error("Error updating organizer event:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

// DELETE /api/organizer-events/[eventId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isValidObjectId(params.eventId)) {
      return NextResponse.json({ error: "Invalid eventId" }, { status: 400 });
    }

    await connectMongo();

    const event = await OrganizerEvent.findById(params.eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.organizerId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await OrganizerEvent.deleteOne({ _id: params.eventId });

    return NextResponse.json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting organizer event:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}

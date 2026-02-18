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

// GET /api/organizer-events?organizerId=...&cityId=...&upcoming=true
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const organizerId = searchParams.get("organizerId");
    const cityId = searchParams.get("cityId");
    const upcoming = searchParams.get("upcoming") === "true";
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "10", 10), 1),
      50
    );

    if (organizerId && !isValidObjectId(organizerId)) {
      return NextResponse.json(
        { error: "Invalid organizerId" },
        { status: 400 }
      );
    }

    if (cityId && !isValidObjectId(cityId)) {
      return NextResponse.json({ error: "Invalid cityId" }, { status: 400 });
    }

    await connectMongo();

    const query: Record<string, unknown> = {
      isPublished: true,
    };

    if (organizerId) query.organizerId = organizerId;
    if (cityId) query.city = cityId;
    if (upcoming) query.startsAt = { $gte: new Date() };

    const skip = (page - 1) * limit;
    const sort: { startsAt: 1 | -1 } = upcoming
      ? { startsAt: 1 }
      : { startsAt: -1 };

    const events = await OrganizerEvent.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
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

    const total = await OrganizerEvent.countDocuments(query);

    return NextResponse.json({
      events,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching organizer events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

// POST /api/organizer-events
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const title =
      typeof body.title === "string" ? body.title.trim().slice(0, 120) : "";
    const venue =
      typeof body.venue === "string" ? body.venue.trim().slice(0, 160) : "";
    const cityId =
      typeof body.cityId === "string" ? body.cityId.trim() : "";
    const startsAtRaw =
      typeof body.startsAt === "string" ? body.startsAt.trim() : "";
    const description =
      typeof body.description === "string"
        ? body.description.trim().slice(0, 2000)
        : "";
    const danceStyles = parseDanceStyles(body.danceStyles);

    if (!title || !cityId || !startsAtRaw) {
      return NextResponse.json(
        { error: "Missing required fields: title, cityId, startsAt" },
        { status: 400 }
      );
    }

    if (!isValidObjectId(cityId)) {
      return NextResponse.json({ error: "Invalid cityId" }, { status: 400 });
    }

    const startsAt = new Date(startsAtRaw);
    if (Number.isNaN(startsAt.getTime())) {
      return NextResponse.json({ error: "Invalid startsAt value" }, { status: 400 });
    }

    await connectMongo();

    const user = (await User.findById(session.user.id)
      .select("isEventOrganizer")
      .lean()) as { isEventOrganizer?: boolean } | null;
    if (!user?.isEventOrganizer) {
      return NextResponse.json(
        { error: "Only event organizers can create events" },
        { status: 403 }
      );
    }

    const cityExists = await City.exists({ _id: cityId });
    if (!cityExists) {
      return NextResponse.json({ error: "City not found" }, { status: 404 });
    }

    let flyerUrl = "";
    let ticketUrl = "";
    try {
      flyerUrl = parseOptionalUrl(body.flyerUrl);
      ticketUrl = parseOptionalUrl(body.ticketUrl);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Invalid URL" },
        { status: 400 }
      );
    }

    let priceAmount: number | undefined;
    if (
      body.priceAmount !== undefined &&
      body.priceAmount !== null &&
      body.priceAmount !== ""
    ) {
      const parsedPrice = Number(body.priceAmount);
      if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
        return NextResponse.json(
          { error: "priceAmount must be a number greater than or equal to 0" },
          { status: 400 }
        );
      }
      priceAmount = parsedPrice;
    }

    const rawCurrency =
      typeof body.priceCurrency === "string"
        ? body.priceCurrency.trim().toUpperCase()
        : "USD";

    if (priceAmount !== undefined && rawCurrency.length !== 3) {
      return NextResponse.json(
        { error: "priceCurrency must be a valid 3-letter currency code" },
        { status: 400 }
      );
    }

    const newEventData: Record<string, unknown> = {
      organizerId: session.user.id,
      title,
      venue,
      city: cityId,
      startsAt,
      description,
      flyerUrl,
      ticketUrl,
      danceStyles,
      isPublished: true,
    };

    if (priceAmount !== undefined) {
      newEventData.priceAmount = priceAmount;
      newEventData.priceCurrency = rawCurrency;
    }

    const newEvent = await OrganizerEvent.create(newEventData);

    const populatedEvent = await OrganizerEvent.findById(newEvent._id)
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

    return NextResponse.json({
      success: true,
      event: populatedEvent,
    });
  } catch (error) {
    console.error("Error creating organizer event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}

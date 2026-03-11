import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";
import City from "@/models/City";
import Country from "@/models/Country";
import Continent from "@/models/Continent";
import config from "@/config";
import { generateSlug } from "@/utils/generate-slug";

// GET: Fetch all cities (with pagination and search)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is admin
    if (!session?.user?.email || session.user.email !== config.admin.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectMongo();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build search query
    const query: any = {};
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const [cities, total] = await Promise.all([
      City.find(query)
        .populate("country", "name code")
        .populate("continent", "name code")
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      City.countDocuments(query),
    ]);

    return NextResponse.json({
      cities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching cities:", error);
    return NextResponse.json(
      { error: "Failed to fetch cities" },
      { status: 500 }
    );
  }
}

// POST: Create new city
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is admin
    if (!session?.user?.email || session.user.email !== config.admin.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectMongo();

    const body = await req.json();

    // Generate slug from city name + country name
    let slug = "";
    if (body.name && body.country) {
      const country = await Country.findById(body.country).select("name").lean() as any;
      slug = generateSlug(body.name, country?.name || "");
    }

    // Create new city
    const city = await City.create({
      name: body.name,
      slug,
      country: body.country,
      continent: body.continent,
      population: body.population,
      totalDancers: body.totalDancers || 0,
      image: body.image || "",
      description: body.description || "",
      rank: body.rank || 0,
      coordinates: {
        lat: body.coordinates?.lat || 0,
        lng: body.coordinates?.lng || 0,
      },
      isActive: body.isActive !== undefined ? body.isActive : true,
      socialGroups: {
        whatsapp: body.socialGroups?.whatsapp || "",
        line: body.socialGroups?.line || "",
        telegram: body.socialGroups?.telegram || "",
        facebook: body.socialGroups?.facebook || "",
        instagram: body.socialGroups?.instagram || "",
        website: body.socialGroups?.website || "",
      },
    });

    const populatedCity = await City.findById(city._id)
      .populate("country", "name code")
      .populate("continent", "name code")
      .lean();

    return NextResponse.json({
      success: true,
      city: populatedCity,
    });
  } catch (error) {
    console.error("Error creating city:", error);
    return NextResponse.json(
      { error: "Failed to create city" },
      { status: 500 }
    );
  }
}


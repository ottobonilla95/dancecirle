import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";
import Country from "@/models/Country";
import Continent from "@/models/Continent";
import config from "@/config";
import { generateSlug } from "@/utils/generate-slug";

// GET - Fetch all countries with pagination and search
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (!session || session.user.email !== config.admin.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongo();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";

    // Build search query
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    // Fetch countries
    const countries = await Country.find(query)
      .populate("continent", "name code")
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Country.countDocuments(query);

    return NextResponse.json({
      countries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching countries:", error);
    return NextResponse.json(
      { error: "Failed to fetch countries" },
      { status: 500 }
    );
  }
}

// POST - Create new country
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (!session || session.user.email !== config.admin.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongo();

    const body = await req.json();

    const newCountry = await Country.create({
      name: body.name,
      slug: body.name ? generateSlug(body.name) : undefined,
      code: body.code,
      continent: body.continent,
      totalDancers: body.totalDancers || 0,
      isActive: body.isActive !== undefined ? body.isActive : true,
      socialGroups: body.socialGroups || {},
    });

    return NextResponse.json({ country: newCountry }, { status: 201 });
  } catch (error) {
    console.error("Error creating country:", error);
    return NextResponse.json(
      { error: "Failed to create country" },
      { status: 500 }
    );
  }
}


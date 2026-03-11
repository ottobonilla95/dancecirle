import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";
import DanceStyle from "@/models/DanceStyle";
import config from "@/config";
import { generateSlug } from "@/utils/generate-slug";

// GET: Fetch all dance styles
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

    // Build search query
    const query: any = {};
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const danceStyles = await DanceStyle.find(query)
      .sort({ sequence: 1, name: 1 }) // Sort by sequence first, then name
      .lean();

    return NextResponse.json({
      danceStyles,
      total: danceStyles.length,
    });
  } catch (error) {
    console.error("Error fetching dance styles:", error);
    return NextResponse.json(
      { error: "Failed to fetch dance styles" },
      { status: 500 }
    );
  }
}

// POST: Create new dance style
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
    
    // Create new dance style
    const danceStyle = await DanceStyle.create({
      name: body.name,
      slug: body.name ? generateSlug(body.name) : undefined,
      description: body.description || "",
      image: body.image || "",
      category: body.category || "latin",
      isPartnerDance: body.isPartnerDance !== undefined ? body.isPartnerDance : true,
      isActive: body.isActive !== undefined ? body.isActive : true,
      sequence: body.sequence || 0,
    });

    return NextResponse.json({
      success: true,
      danceStyle,
    });
  } catch (error) {
    console.error("Error creating dance style:", error);
    return NextResponse.json(
      { error: "Failed to create dance style" },
      { status: 500 }
    );
  }
}


import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";
import DanceStyle from "@/models/DanceStyle";
import config from "@/config";
import { generateSlug } from "@/utils/generate-slug";

// GET: Fetch single dance style
export async function GET(
  req: Request,
  { params }: { params: { styleId: string } }
) {
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

    const danceStyle = await DanceStyle.findById(params.styleId).lean();

    if (!danceStyle) {
      return NextResponse.json(
        { error: "Dance style not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ danceStyle });
  } catch (error) {
    console.error("Error fetching dance style:", error);
    return NextResponse.json(
      { error: "Failed to fetch dance style" },
      { status: 500 }
    );
  }
}

// PUT: Update dance style
export async function PUT(
  req: Request,
  { params }: { params: { styleId: string } }
) {
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
    
    // Update dance style
    const danceStyle = await DanceStyle.findByIdAndUpdate(
      params.styleId,
      {
        name: body.name,
        ...(body.name && { slug: generateSlug(body.name) }),
        description: body.description,
        image: body.image,
        category: body.category,
        isPartnerDance: body.isPartnerDance,
        isActive: body.isActive,
        sequence: body.sequence,
      },
      { new: true }
    ).lean();

    if (!danceStyle) {
      return NextResponse.json(
        { error: "Dance style not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      danceStyle,
    });
  } catch (error) {
    console.error("Error updating dance style:", error);
    return NextResponse.json(
      { error: "Failed to update dance style" },
      { status: 500 }
    );
  }
}


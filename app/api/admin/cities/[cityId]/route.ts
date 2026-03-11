import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";
import City from "@/models/City";
import Country from "@/models/Country";
import config from "@/config";
import { generateSlug } from "@/utils/generate-slug";

// GET: Fetch single city
export async function GET(
  req: Request,
  { params }: { params: { cityId: string } }
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

    const city = await City.findById(params.cityId)
      .populate("country", "name code")
      .populate("continent", "name code")
      .lean();

    if (!city) {
      return NextResponse.json(
        { error: "City not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ city });
  } catch (error) {
    console.error("Error fetching city:", error);
    return NextResponse.json(
      { error: "Failed to fetch city" },
      { status: 500 }
    );
  }
}

// PUT: Update city
export async function PUT(
  req: Request,
  { params }: { params: { cityId: string } }
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

    // Regenerate slug from city name + country name
    let slug: string | undefined;
    if (body.name && body.country) {
      const country = await Country.findById(body.country).select("name").lean() as any;
      slug = generateSlug(body.name, country?.name || "");
    }

    // Update city
    const city = await City.findByIdAndUpdate(
      params.cityId,
      {
        name: body.name,
        ...(slug && { slug }),
        country: body.country,
        continent: body.continent,
        population: body.population,
        totalDancers: body.totalDancers,
        image: body.image,
        description: body.description,
        rank: body.rank,
        coordinates: {
          lat: body.coordinates?.lat || 0,
          lng: body.coordinates?.lng || 0,
        },
        isActive: body.isActive,
        socialGroups: {
          whatsapp: body.socialGroups?.whatsapp || "",
          line: body.socialGroups?.line || "",
          telegram: body.socialGroups?.telegram || "",
          facebook: body.socialGroups?.facebook || "",
          instagram: body.socialGroups?.instagram || "",
          website: body.socialGroups?.website || "",
        },
      },
      { new: true }
    )
      .populate("country", "name code")
      .populate("continent", "name code")
      .lean();

    if (!city) {
      return NextResponse.json(
        { error: "City not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      city,
    });
  } catch (error) {
    console.error("Error updating city:", error);
    return NextResponse.json(
      { error: "Failed to update city" },
      { status: 500 }
    );
  }
}

// DELETE: Delete city
export async function DELETE(
  req: Request,
  { params }: { params: { cityId: string } }
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

    // Check if city exists
    const city = await City.findById(params.cityId);
    if (!city) {
      return NextResponse.json(
        { error: "City not found" },
        { status: 404 }
      );
    }

    // Delete the city
    await City.findByIdAndDelete(params.cityId);

    return NextResponse.json({
      success: true,
      message: "City deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting city:", error);
    return NextResponse.json(
      { error: "Failed to delete city" },
      { status: 500 }
    );
  }
}


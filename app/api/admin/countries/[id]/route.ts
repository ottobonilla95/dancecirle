import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";
import Country from "@/models/Country";
import config from "@/config";
import { generateSlug } from "@/utils/generate-slug";

// PUT - Update country
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (!session || session.user.email !== config.admin.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongo();

    const body = await req.json();

    const updatedCountry = await Country.findByIdAndUpdate(
      params.id,
      {
        name: body.name,
        ...(body.name && { slug: generateSlug(body.name) }),
        code: body.code,
        continent: body.continent,
        totalDancers: body.totalDancers,
        isActive: body.isActive,
        socialGroups: body.socialGroups,
      },
      { new: true, runValidators: true }
    ).populate("continent", "name code");

    if (!updatedCountry) {
      return NextResponse.json({ error: "Country not found" }, { status: 404 });
    }

    return NextResponse.json({ country: updatedCountry });
  } catch (error) {
    console.error("Error updating country:", error);
    return NextResponse.json(
      { error: "Failed to update country" },
      { status: 500 }
    );
  }
}

// DELETE - Delete country
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (!session || session.user.email !== config.admin.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongo();

    const deletedCountry = await Country.findByIdAndDelete(params.id);

    if (!deletedCountry) {
      return NextResponse.json({ error: "Country not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Country deleted successfully" });
  } catch (error) {
    console.error("Error deleting country:", error);
    return NextResponse.json(
      { error: "Failed to delete country" },
      { status: 500 }
    );
  }
}


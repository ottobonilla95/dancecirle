import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";
import Country from "@/models/Country";
import DanceStyle from "@/models/DanceStyle";
import config from "@/config";

export const dynamic = "force-dynamic";

// GET: Fetch available filter options (countries + dance styles)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || session.user.email !== config.admin.email) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    await connectMongo();

    const [countries, danceStyles] = await Promise.all([
      Country.find({ isActive: true })
        .select("name code")
        .sort({ name: 1 }),
      DanceStyle.find({ isActive: true })
        .select("name category")
        .sort({ sequence: 1, name: 1 }),
    ]);

    return NextResponse.json({ countries, danceStyles });
  } catch (error: any) {
    console.error("Error fetching filters:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

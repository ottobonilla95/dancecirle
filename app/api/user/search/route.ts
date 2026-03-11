import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";
import City from "@/models/City";
import Country from "@/models/Country";
import { createAccentInsensitivePattern } from "@/utils/search";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  try {
    await connectMongo();
    
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    
    if (!query || query.length < 2) {
      return NextResponse.json({ 
        users: [],
        cities: [],
        countries: [],
        message: "Query must be at least 2 characters" 
      });
    }

    // Create accent-insensitive search pattern
    const accentInsensitivePattern = createAccentInsensitivePattern(query);
    
    // Search Users (limit to 5 for variety)
    const userSearchConditions = {
      $and: [
        { _id: { $ne: session.user.id } },
        { isProfileComplete: true },
        {
          $or: [
            { username: { $regex: accentInsensitivePattern, $options: "i" } },
            { name: { $regex: accentInsensitivePattern, $options: "i" } },
          ]
        }
      ]
    };

    const users = await User.find(userSearchConditions)
      .select("name username image city isFeaturedProfessional")
      .populate({
        path: "city",
        model: City,
        select: "name"
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Search Cities (limit to 3 for variety)
    const cities = await City.find({
      $or: [
        { name: { $regex: accentInsensitivePattern, $options: "i" } }
      ],
      isActive: true
    })
      .select("name slug country image totalDancers")
      .populate({
        path: "country",
        model: Country,
        select: "name code"
      })
      .sort({ totalDancers: -1 })
      .limit(3)
      .lean();

    // Search Countries (limit to 2 for variety)
    const countries = await Country.find({
      name: { $regex: accentInsensitivePattern, $options: "i" },
      isActive: true
    })
      .select("name code slug")
      .sort({ name: 1 })
      .limit(2)
      .lean();

    // Format results
    const formattedUsers = users.map((user: any) => ({
      _id: user._id,
      name: user.name,
      username: user.username,
      image: user.image,
      city: user.city ? { name: user.city.name } : null,
      isFeaturedProfessional: user.isFeaturedProfessional || false,
    }));

    const formattedCities = cities.map((city: any) => ({
      _id: city._id,
      name: city.name,
      country: city.country ? {
        name: city.country.name,
        code: city.country.code
      } : null,
      image: city.image,
      totalDancers: city.totalDancers || 0
    }));

    const formattedCountries = countries.map((country: any) => ({
      _id: country._id,
      name: country.name,
      code: country.code
    }));

    return NextResponse.json({
      users: formattedUsers,
      cities: formattedCities,
      countries: formattedCountries,
      totalResults: formattedUsers.length + formattedCities.length + formattedCountries.length
    });

  } catch (error) {
    console.error("User search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
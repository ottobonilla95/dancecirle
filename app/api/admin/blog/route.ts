import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";
import BlogPost from "@/models/BlogPost";
import config from "@/config";
import { generateSlug } from "@/utils/generate-slug";

// GET: Fetch all blog posts (with pagination, search, and locale filter)
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
    const locale = searchParams.get("locale") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build search query
    const query: any = {};
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }
    if (locale) {
      query.locale = locale;
    }

    const [posts, total] = await Promise.all([
      BlogPost.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BlogPost.countDocuments(query),
    ]);

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog posts" },
      { status: 500 }
    );
  }
}

// POST: Create new blog post
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

    // Generate slug from title
    const slug = body.title ? generateSlug(body.title) : "";

    // Create new blog post
    const post = await BlogPost.create({
      title: body.title,
      slug,
      body: body.body,
      excerpt: body.excerpt || "",
      coverImage: body.coverImage || "",
      locale: body.locale || "en",
      category: body.category || "",
      isPublished: body.isPublished || false,
      publishedAt: body.isPublished ? new Date() : undefined,
      seo: {
        metaTitle: body.seo?.metaTitle || "",
        metaDescription: body.seo?.metaDescription || "",
        keywords: body.seo?.keywords || "",
      },
    });

    return NextResponse.json({
      success: true,
      post,
    });
  } catch (error) {
    console.error("Error creating blog post:", error);
    return NextResponse.json(
      { error: "Failed to create blog post" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import connectMongo from "@/libs/mongoose";
import BlogPost from "@/models/BlogPost";
import config from "@/config";
import { generateSlug } from "@/utils/generate-slug";

// GET: Fetch single blog post
export async function GET(
  req: Request,
  { params }: { params: { postId: string } }
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

    const post = await BlogPost.findById(params.postId).lean();

    if (!post) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Error fetching blog post:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog post" },
      { status: 500 }
    );
  }
}

// PUT: Update blog post
export async function PUT(
  req: Request,
  { params }: { params: { postId: string } }
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

    // Use custom slug if provided, otherwise regenerate from title
    let slug: string | undefined;
    if (body.slug) {
      slug = body.slug;
    } else if (body.title) {
      slug = generateSlug(body.title);
    }

    // Check if publishing for the first time
    let publishedAt: Date | undefined;
    if (body.isPublished) {
      const existing = await BlogPost.findById(params.postId)
        .select("isPublished publishedAt")
        .lean() as any;
      if (existing && !existing.isPublished) {
        publishedAt = new Date();
      }
    }

    // Update blog post
    const post = await BlogPost.findByIdAndUpdate(
      params.postId,
      {
        title: body.title,
        ...(slug && { slug }),
        body: body.body,
        excerpt: body.excerpt,
        coverImage: body.coverImage,
        locale: body.locale,
        category: body.category,
        isPublished: body.isPublished,
        ...(publishedAt && { publishedAt }),
        seo: {
          metaTitle: body.seo?.metaTitle || "",
          metaDescription: body.seo?.metaDescription || "",
          keywords: body.seo?.keywords || "",
        },
      },
      { new: true }
    ).lean();

    if (!post) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      post,
    });
  } catch (error) {
    console.error("Error updating blog post:", error);
    return NextResponse.json(
      { error: "Failed to update blog post" },
      { status: 500 }
    );
  }
}

// DELETE: Delete blog post
export async function DELETE(
  req: Request,
  { params }: { params: { postId: string } }
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

    // Check if post exists
    const post = await BlogPost.findById(params.postId);
    if (!post) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    // Delete the blog post
    await BlogPost.findByIdAndDelete(params.postId);

    return NextResponse.json({
      success: true,
      message: "Blog post deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting blog post:", error);
    return NextResponse.json(
      { error: "Failed to delete blog post" },
      { status: 500 }
    );
  }
}

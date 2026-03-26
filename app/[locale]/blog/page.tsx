import React from "react";
import connectMongo from "@/libs/mongoose";
import BlogPost from "@/models/BlogPost";
import { getMessages, getTranslation, type Locale } from "@/lib/i18n";
import { Link } from "@/navigation";
import Image from "next/image";

export const revalidate = 1800;

interface Props {
  params: {
    locale: string;
  };
}

export async function generateMetadata({ params }: Props) {
  const locale = params.locale as Locale;

  const title = "Dance Blog - Tips, Guides & Travel | DanceCircle";
  const description =
    "Explore dance tips, city guides, travel advice, and stories from the global dance community. Stay inspired with DanceCircle's blog.";

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.dancecircle.co/${locale}/blog`,
      languages: {
        en: "https://www.dancecircle.co/en/blog",
        es: "https://www.dancecircle.co/es/blog",
      },
    },
    openGraph: {
      title,
      description,
      url: `https://www.dancecircle.co/${locale}/blog`,
      siteName: "DanceCircle",
      type: "website",
    },
    twitter: {
      title,
      description,
      card: "summary_large_image" as const,
    },
  };
}

export default async function BlogListingPage({ params }: Props) {
  const locale = (params.locale || "en") as Locale;

  await connectMongo();

  const posts = await BlogPost.find({ isPublished: true, locale })
    .sort({ publishedAt: -1 })
    .lean();

  return (
    <main className="min-h-screen bg-base-200">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Dance Blog</h1>
          <p className="text-base-content/70 text-lg max-w-2xl mx-auto">
            Tips, guides, and stories from the global dance community.
          </p>
        </div>

        {/* Posts Grid */}
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post: any) => (
              <Link
                key={post._id.toString()}
                href={`/blog/${post.slug}`}
                className="card bg-base-100 shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden group"
              >
                {/* Cover Image or Gradient Placeholder */}
                <figure className="relative h-48 overflow-hidden">
                  {post.coverImage ? (
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
                      <span className="text-4xl opacity-50">💃</span>
                    </div>
                  )}
                </figure>

                <div className="card-body p-5">
                  {/* Category Badge */}
                  {post.category && (
                    <span className="badge badge-primary badge-sm w-fit">
                      {post.category}
                    </span>
                  )}

                  {/* Title */}
                  <h2 className="card-title text-lg line-clamp-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>

                  {/* Excerpt */}
                  {post.excerpt && (
                    <p className="text-base-content/60 text-sm line-clamp-3">
                      {post.excerpt}
                    </p>
                  )}

                  {/* Date + Read More */}
                  <div className="flex items-center justify-between mt-3">
                    <time
                      className="text-xs text-base-content/50"
                      dateTime={
                        post.publishedAt
                          ? new Date(post.publishedAt).toISOString()
                          : undefined
                      }
                    >
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString(
                            locale === "es" ? "es-ES" : "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )
                        : ""}
                    </time>
                    <span className="text-primary text-sm font-medium">
                      Read more &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4 opacity-30">📝</div>
            <h2 className="text-xl font-semibold mb-2">No articles yet</h2>
            <p className="text-base-content/60">
              We&apos;re working on great content. Check back soon!
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

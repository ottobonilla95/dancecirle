import React from "react";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getBreadcrumbJsonLd } from "@/libs/seo";
import connectMongo from "@/libs/mongoose";
import BlogPost from "@/models/BlogPost";
import { Link } from "@/navigation";
import { getMessages, getTranslation, type Locale } from "@/lib/i18n";
import { FaCalendar, FaTag, FaArrowLeft } from "react-icons/fa";
import Image from "next/image";

export const revalidate = 3600;

interface Props {
  params: {
    locale: string;
    slug: string;
  };
}

export async function generateMetadata({ params }: Props) {
  const locale = params.locale as Locale;

  await connectMongo();

  const post: any = await BlogPost.findOne({
    slug: params.slug,
    locale,
    isPublished: true,
  }).lean();

  if (!post) {
    return { title: "Article Not Found" };
  }

  const title = post.seo?.metaTitle || post.title;
  const description = post.seo?.metaDescription || post.excerpt || "";
  const url = `https://www.dancecircle.co/${locale}/blog/${post.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: `https://www.dancecircle.co/en/blog/${post.slug}`,
        es: `https://www.dancecircle.co/es/blog/${post.slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "DanceCircle",
      type: "article",
      ...(post.coverImage && {
        images: [
          {
            url: post.coverImage,
            width: 1200,
            height: 630,
            alt: post.title,
          },
        ],
      }),
    },
    twitter: {
      title,
      description,
      card: "summary_large_image" as const,
      ...(post.coverImage && { images: [post.coverImage] }),
    },
  };
}

export default async function BlogArticlePage({ params }: Props) {
  const locale = (params.locale || "en") as Locale;

  await connectMongo();

  const post: any = await BlogPost.findOne({
    slug: params.slug,
    locale,
    isPublished: true,
  }).lean();

  if (!post) {
    notFound();
  }

  const publishedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(
        locale === "es" ? "es-ES" : "en-US",
        { year: "numeric", month: "long", day: "numeric" }
      )
    : null;

  const publishedISO = post.publishedAt
    ? new Date(post.publishedAt).toISOString()
    : undefined;

  const updatedISO = post.updatedAt
    ? new Date(post.updatedAt).toISOString()
    : publishedISO;

  const articleUrl = `https://www.dancecircle.co/${locale}/blog/${post.slug}`;

  // JSON-LD Article schema
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt || "",
    ...(publishedISO && { datePublished: publishedISO }),
    ...(updatedISO && { dateModified: updatedISO }),
    author: {
      "@type": "Organization",
      name: "DanceCircle",
    },
    publisher: {
      "@type": "Organization",
      name: "DanceCircle",
    },
    ...(post.coverImage && { image: post.coverImage }),
    url: articleUrl,
  };

  // Breadcrumb JSON-LD
  const breadcrumbJsonLd = getBreadcrumbJsonLd([
    { name: "DanceCircle", url: `https://www.dancecircle.co/${locale}` },
    { name: "Blog", url: `https://www.dancecircle.co/${locale}/blog` },
    { name: post.title, url: articleUrl },
  ]);

  return (
    <main className="min-h-screen bg-base-200">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <article className="max-w-3xl mx-auto px-4 py-12">
        {/* Back Link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-base-content/60 hover:text-primary transition-colors mb-8"
        >
          <FaArrowLeft className="text-sm" />
          <span>Back to Blog</span>
        </Link>

        {/* Cover Image */}
        {post.coverImage && (
          <div className="relative w-full h-64 sm:h-80 md:h-96 rounded-xl overflow-hidden mb-8">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </div>
        )}

        {/* Category + Date */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          {post.category && (
            <span className="badge badge-primary gap-1">
              <FaTag className="text-xs" />
              {post.category}
            </span>
          )}
          {publishedDate && (
            <span className="flex items-center gap-1 text-sm text-base-content/50">
              <FaCalendar className="text-xs" />
              <time dateTime={publishedISO}>{publishedDate}</time>
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold mb-8 leading-tight">
          {post.title}
        </h1>

        {/* Markdown Body */}
        <div className="prose prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.body}
          </ReactMarkdown>
        </div>

        {/* DanceCircle CTA Promo Section */}
        <div className="mt-16 rounded-2xl bg-gradient-to-r from-primary/90 to-secondary/90 p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-primary-content mb-3">
            Join DanceCircle
          </h2>
          <p className="text-primary-content/80 max-w-lg mx-auto mb-8 text-lg">
            Connect with dancers worldwide. Discover dance cities, events,
            music, and communities.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="btn btn-lg bg-white text-primary hover:bg-white/90 border-none"
            >
              Sign Up Free
            </Link>
            <Link
              href="/cities"
              className="btn btn-lg btn-outline border-white text-white hover:bg-white/10 hover:border-white"
            >
              Explore Cities
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}

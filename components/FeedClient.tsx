"use client";

import { useTranslation } from "@/components/I18nProvider";
import ActivityFeed from "@/components/ActivityFeed";

interface FeedClientProps {
  initialPosts: any[];
}

export default function FeedClient({ initialPosts }: FeedClientProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-base-100 pb-24">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold">🔥 {t("feed.title")}</h1>
        </div>

        {/* Feed */}
        <ActivityFeed initialPosts={initialPosts} />
      </div>
    </div>
  );
}


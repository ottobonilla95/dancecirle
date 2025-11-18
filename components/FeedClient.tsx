"use client";

import { useState } from "react";
import { useTranslation } from "@/components/I18nProvider";
import ActivityFeed from "@/components/ActivityFeed";
import CreatePostModal from "@/components/CreatePostModal";

interface FeedClientProps {
  initialPosts: any[];
}

export default function FeedClient({ initialPosts }: FeedClientProps) {
  const { t } = useTranslation();
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePostCreated = () => {
    setIsCreatePostOpen(false);
    // Refresh the feed by changing the key
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-base-100 pb-24">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-extrabold">🔥 {t("feed.title")}</h1>
          <button
            onClick={() => setIsCreatePostOpen(true)}
            className="btn btn-primary gap-2"
          >
            <span className="text-xl">🕺</span>
            {t("feed.goingOut")}
          </button>
        </div>

        {/* Feed */}
        <ActivityFeed key={refreshKey} initialPosts={initialPosts} />

        {/* Create Post Modal */}
        <CreatePostModal
          isOpen={isCreatePostOpen}
          onClose={() => setIsCreatePostOpen(false)}
          onPostCreated={handlePostCreated}
        />
      </div>
    </div>
  );
}


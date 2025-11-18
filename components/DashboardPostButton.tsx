"use client";

import { useState } from "react";
import { useTranslation } from "@/components/I18nProvider";
import CreatePostModal from "./CreatePostModal";
import ActivityFeed from "./ActivityFeed";

interface DashboardPostSectionProps {
  initialPosts: any[];
}

export default function DashboardPostSection({ initialPosts }: DashboardPostSectionProps) {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePostCreated = () => {
    setIsModalOpen(false);
    // Reload to show new post
    window.location.reload();
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-extrabold">
          🔥 {t("feed.title")}
        </h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary btn-sm gap-1"
        >
          <span className="text-lg">🕺</span>
          {t("feed.goingOut")}
        </button>
      </div>
      
      <ActivityFeed 
        isPreview={true} 
        initialPosts={initialPosts}
        onCreatePost={() => setIsModalOpen(true)}
      />

      <CreatePostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPostCreated={handlePostCreated}
      />
    </>
  );
}


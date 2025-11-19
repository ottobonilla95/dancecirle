"use client";

import { useTranslation } from "@/components/I18nProvider";
import ActivityFeed from "./ActivityFeed";

interface DashboardPostSectionProps {
  initialPosts: any[];
  friendsCount: number;
}

export default function DashboardPostSection({ initialPosts, friendsCount }: DashboardPostSectionProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-extrabold">
          🔥 {t("feed.title")}
        </h2>
      </div>
      
      <ActivityFeed 
        isPreview={true} 
        initialPosts={initialPosts}
        friendsCount={friendsCount}
      />
    </>
  );
}


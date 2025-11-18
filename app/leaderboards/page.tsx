"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { FaHeart, FaTrophy, FaChalkboardTeacher, FaMusic, FaCamera } from "react-icons/fa";
import { useTranslation } from "@/components/I18nProvider";
import VerifiedBadge from "@/components/VerifiedBadge";

type LeaderboardUser = {
  _id: string;
  name: string;
  username?: string;
  image?: string;
  likesCount?: number;
  firstPlaces?: number;
  podiumFinishes?: number;
  competitionsCount?: number;
  isFeaturedProfessional?: boolean;
};

type LeaderboardData = {
  mostLiked: LeaderboardUser[];
  jjChampions: LeaderboardUser[];
  jjPodium: LeaderboardUser[];
  jjParticipation: LeaderboardUser[];
  mostLikedTeachers: LeaderboardUser[];
  mostLikedDJs: LeaderboardUser[];
  mostLikedPhotographers: LeaderboardUser[];
  mostLikedProducers: LeaderboardUser[];
};

export default function LeaderboardsPage() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryParam = searchParams.get('category') as 'mostLiked' | 'jjChampions' | 'jjPodium' | 'jjParticipation' | 'mostLikedTeachers' | 'mostLikedDJs' | 'mostLikedPhotographers' | 'mostLikedProducers' | null;
  
  const [activeTab, setActiveTab] = useState<'mostLiked' | 'jjChampions' | 'jjPodium' | 'jjParticipation' | 'mostLikedTeachers' | 'mostLikedDJs' | 'mostLikedPhotographers' | 'mostLikedProducers'>(categoryParam || 'mostLiked');
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const currentUserId = session?.user?.id;

  const handleTabChange = (tabId: 'mostLiked' | 'jjChampions' | 'jjPodium' | 'jjParticipation' | 'mostLikedTeachers' | 'mostLikedDJs' | 'mostLikedPhotographers' | 'mostLikedProducers') => {
    setActiveTab(tabId);
    router.push(`/leaderboards?category=${tabId}`);
  };

  // Update active tab when URL parameter changes
  useEffect(() => {
    if (categoryParam && ['mostLiked', 'jjChampions', 'jjPodium', 'jjParticipation', 'mostLikedTeachers', 'mostLikedDJs', 'mostLikedPhotographers', 'mostLikedProducers'].includes(categoryParam)) {
      setActiveTab(categoryParam);
    }
  }, [categoryParam]);

  useEffect(() => {
    async function fetchLeaderboards() {
      try {
        const response = await fetch('/api/leaderboards');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching leaderboards:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboards();
  }, []);

  const tabs = [
    { id: 'mostLiked', label: t('leaderboards.mostLiked'), icon: <FaHeart className="text-error" /> },
    { id: 'jjChampions', label: 'J&J Champions', icon: <FaTrophy className="text-warning" /> },
    { id: 'jjPodium', label: 'J&J Podium', icon: <span className="text-warning">🥇</span> },
    { id: 'jjParticipation', label: 'J&J Participation', icon: <span>🎉</span> },
    { id: 'mostLikedTeachers', label: 'Most Liked Teachers', icon: <FaChalkboardTeacher className="text-info" /> },
    { id: 'mostLikedDJs', label: 'Most Liked DJs', icon: <FaMusic className="text-secondary" /> },
    { id: 'mostLikedPhotographers', label: 'Most Liked Photographers', icon: <FaCamera className="text-accent" /> },
    { id: 'mostLikedProducers', label: 'Most Liked Producers', icon: <span className="text-success">🎹</span> },
  ];

  const getCurrentUsers = () => {
    if (!data) return [];
    switch (activeTab) {
      case 'mostLiked':
        return data.mostLiked;
      case 'jjChampions':
        return data.jjChampions;
      case 'jjPodium':
        return data.jjPodium;
      case 'jjParticipation':
        return data.jjParticipation;
      case 'mostLikedTeachers':
        return data.mostLikedTeachers;
      case 'mostLikedDJs':
        return data.mostLikedDJs;
      case 'mostLikedPhotographers':
        return data.mostLikedPhotographers;
      case 'mostLikedProducers':
        return data.mostLikedProducers;
      default:
        return [];
    }
  };

  const getMetricInfo = () => {
    switch (activeTab) {
      case 'mostLiked':
        return { metric: 'likesCount', label: t('leaderboards.likes') };
      case 'jjChampions':
        return { metric: 'firstPlaces', label: t('leaderboards.wins') };
      case 'jjPodium':
        return { metric: 'podiumFinishes', label: 'Podiums' };
      case 'jjParticipation':
        return { metric: 'competitionsCount', label: 'Competitions' };
      case 'mostLikedTeachers':
        return { metric: 'likesCount', label: t('leaderboards.likes') };
      case 'mostLikedDJs':
        return { metric: 'likesCount', label: t('leaderboards.likes') };
      case 'mostLikedPhotographers':
        return { metric: 'likesCount', label: t('leaderboards.likes') };
      case 'mostLikedProducers':
        return { metric: 'likesCount', label: t('leaderboards.likes') };
      default:
        return { metric: 'likesCount', label: '' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  const currentUsers = getCurrentUsers();
  const { metric, label: metricLabel } = getMetricInfo();

  return (
    <div className="min-h-screen bg-base-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold mb-3">
            🏆 {t('leaderboards.title')}
          </h1>
          <p className="text-lg text-base-content/70">
            {t('leaderboards.subtitle')}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`btn gap-2 ${
                activeTab === tab.id ? 'btn-primary' : 'btn-outline'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Leaderboard Content */}
        {currentUsers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-base-content/60">
              No data available yet. Be the first! 🌟
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {currentUsers.map((user: any, index: number) => {
              const isCurrentUser = currentUserId && user._id.toString() === currentUserId;
              const rankClass =
                index === 0
                  ? "bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-500"
                  : index === 1
                  ? "bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400"
                  : index === 2
                  ? "bg-gradient-to-r from-orange-600/20 to-orange-700/20 border-orange-600"
                  : "bg-base-200 border-base-300";

              return (
                <Link
                  key={user._id}
                  href={`/dancer/${user._id}`}
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all hover:scale-[1.02] ${rankClass} ${
                    isCurrentUser ? "ring-2 ring-primary" : ""
                  }`}
                >
                  {/* Rank */}
                  <div className="flex-shrink-0 w-12 text-center">
                    {index === 0 ? (
                      <span className="text-3xl">🥇</span>
                    ) : index === 1 ? (
                      <span className="text-3xl">🥈</span>
                    ) : index === 2 ? (
                      <span className="text-3xl">🥉</span>
                    ) : (
                      <span className="text-xl font-bold text-base-content/70">
                        #{index + 1}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="avatar">
                    <div className="w-14 h-14 rounded-full">
                      {user.image ? (
                        <img src={user.image} alt={user.name} />
                      ) : (
                        <div className="bg-primary text-primary-content rounded-full w-full h-full flex items-center justify-center font-bold text-lg">
                          {user.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Name & Username */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg truncate flex items-center gap-2">
                      <span>{user.name}</span>
                      {user.isFeaturedProfessional && (
                        <VerifiedBadge size="sm" />
                      )}
                      {isCurrentUser && (
                        <span className="badge badge-primary badge-sm">You</span>
                      )}
                    </h3>
                    {user.username && (
                      <p className="text-sm text-base-content/60">@{user.username}</p>
                    )}
                  </div>

                  {/* Metric */}
                  <div className="text-right">
                    <div className="text-2xl font-bold">{user[metric]}</div>
                    <div className="text-xs text-base-content/60">{metricLabel}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Link } from "@/navigation";
import { FaSpotify, FaYoutube, FaExternalLinkAlt } from "react-icons/fa";
import AddRelease from "./AddRelease";

interface Release {
  _id: string;
  title: string;
  description: string;
  url: string;
  platform: "spotify" | "youtube";
  spotifyTrackId?: string;
  youtubeVideoId?: string;
  createdAt: string;
}

interface ProducerReleasesProps {
  producerId: string;
  isOwnProfile: boolean;
}

export default function ProducerReleases({ producerId, isOwnProfile }: ProducerReleasesProps) {
  const [releases, setReleases] = useState<Release[]>([]);
  const [totalReleases, setTotalReleases] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchReleases = async () => {
    try {
      const response = await fetch(`/api/releases?producerId=${producerId}`);
      const data = await response.json();

      if (data.success) {
        setTotalReleases(data.releases.length);
        // Only show top 10 on profile
        setReleases(data.releases.slice(0, 10));
      }
    } catch (error) {
      console.error("Error fetching releases:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReleases();
  }, [producerId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">🎵 Releases</h2>
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        </div>
      </div>
    );
  }

  // Hide section completely if no releases on public view
  if (!isOwnProfile && releases.length === 0) {
    return null;
  }

  return (
    <div className="card bg-base-200 shadow-xl">
      <div className="card-body">
        <div className="flex items-center justify-between mb-4">
          <h2 className="card-title">🎵 Releases</h2>
          {isOwnProfile && (
            <AddRelease onReleaseAdded={fetchReleases} />
          )}
        </div>

        {releases.length === 0 ? (
          <div className="text-center py-8 text-base-content/60">
            {isOwnProfile ? (
              <>
                <p>No releases yet.</p>
                <p className="text-sm mt-2">
                  Add your first release and notify your followers!
                </p>
              </>
            ) : (
              <p>No releases yet.</p>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {releases.map((release) => (
                <Link
                  key={release._id}
                  href={`/release/${release._id}`}
                  className="block p-4 rounded-lg bg-base-300 hover:bg-base-100 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Platform Icon */}
                    <div className="flex-shrink-0">
                      {release.platform === "spotify" ? (
                        <FaSpotify className="text-3xl text-green-500" />
                      ) : (
                        <FaYoutube className="text-3xl text-red-500" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg truncate">
                        {release.title}
                      </h3>
                      {release.description && (
                        <p className="text-sm text-base-content/70 line-clamp-2 mt-1">
                          {release.description}
                        </p>
                      )}
                      <p className="text-xs text-base-content/50 mt-2">
                        {formatDate(release.createdAt)}
                      </p>
                    </div>

                    {/* Arrow */}
                    <div className="flex-shrink-0">
                      <FaExternalLinkAlt className="text-base-content/40" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* See All Button - only show if there are more than 10 releases */}
            {totalReleases > 10 && (
              <div className="mt-6 text-center">
                <Link
                  href={`/releases/${producerId}`}
                  className="btn btn-outline btn-sm gap-2"
                >
                  See All {totalReleases} Releases
                  <FaExternalLinkAlt />
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}


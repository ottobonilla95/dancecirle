"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/components/I18nProvider";
import Link from "next/link";
import VerifiedBadge from "./VerifiedBadge";

// Simple time ago function
function timeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };
  
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval === 1 ? "" : "s"} ago`;
    }
  }
  
  return "just now";
}

// Format date nicely: "12 June 2025"
function formatNiceDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
}

// Extract Spotify track ID from URL
function getSpotifyEmbedUrl(url: string): string | null {
  // Handle different Spotify URL formats
  const trackMatch = url.match(/track\/([a-zA-Z0-9]+)/);
  if (trackMatch) {
    return `https://open.spotify.com/embed/track/${trackMatch[1]}`;
  }
  return null;
}

// Extract YouTube video ID from URL
function getYouTubeEmbedUrl(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
    /youtu\.be\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }
  return null;
}

interface Post {
  _id: string;
  type: string;
  author: {
    _id: string;
    name: string;
    username?: string;
    image?: string;
    city?: string;
    isFeaturedProfessional?: boolean;
  };
  city: string;
  content: any;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  isLikedByCurrentUser: boolean;
}

interface ActivityFeedProps {
  isPreview?: boolean; // If true, show limited posts with "See All" button
  initialPosts?: Post[]; // Server-rendered initial posts
  friendsCount?: number; // Number of friends (for smart empty state)
}

export default function ActivityFeed({ 
  isPreview = false,
  initialPosts = [],
  friendsCount
}: ActivityFeedProps) {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [loading, setLoading] = useState(false);
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [postComments, setPostComments] = useState<{[key: string]: any[]}>({});
  const [loadingComments, setLoadingComments] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    // Only fetch if no initial posts provided
    if (initialPosts.length === 0) {
      fetchPosts();
    }
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const limit = isPreview ? 4 : 20;
      const response = await fetch(`/api/posts?limit=${limit}`);
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
      });
      const data = await response.json();
      
      // Update the post in the list
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId
            ? {
                ...post,
                likesCount: data.likesCount,
                isLikedByCurrentUser: data.liked,
              }
            : post
        )
      );
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const loadComments = async (postId: string) => {
    if (postComments[postId]) return; // Already loaded
    
    setLoadingComments(prev => ({ ...prev, [postId]: true }));
    try {
      const response = await fetch(`/api/posts/${postId}/comment`);
      if (response.ok) {
        const data = await response.json();
        setPostComments(prev => ({ ...prev, [postId]: data.comments || [] }));
      }
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleCommentClick = (postId: string) => {
    if (commentingOn === postId) {
      setCommentingOn(null);
    } else {
      setCommentingOn(postId);
      loadComments(postId);
    }
  };

  const handleComment = async (postId: string) => {
    if (!commentText.trim()) return;
    
    try {
      const response = await fetch(`/api/posts/${postId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: commentText.trim() }),
      });
      
      if (response.ok) {
        const data = await response.json();
        // Add new comment to list
        setPostComments(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), data.comment]
        }));
        // Increment comment count
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post._id === postId
              ? { ...post, commentsCount: post.commentsCount + 1 }
              : post
          )
        );
        setCommentText("");
      }
    } catch (error) {
      console.error("Error commenting:", error);
    }
  };

  const getPostContent = (post: Post) => {
    switch (post.type) {
      case "going_out":
        return (
          <div>
            <p className="font-medium">{t("feed.postTypes.goingTo")} {post.content.venue || "a venue"}? 🕺💃</p>
            {post.content.message && (
              <p className="text-sm mt-2">{post.content.message}</p>
            )}
          </div>
        );

      case "new_to_city":
        return (
          <div>
            <p className="font-medium">{t("feed.postTypes.justJoined")} {post.city}! 🎉</p>
            {post.content.message && (
              <p className="text-sm mt-1">{post.content.message}</p>
            )}
          </div>
        );

      case "trip_added":
        return (
          <div>
            <p className="font-medium">
              {t("feed.postTypes.addedTrip")} {post.content.destinationCity}
            </p>
            {post.content.startDate && post.content.endDate && (
              <p className="text-sm text-base-content/70">
                {formatNiceDate(post.content.startDate)} - {formatNiceDate(post.content.endDate)}
              </p>
            )}
          </div>
        );

      case "new_song": {
        const spotifyEmbedUrl = post.content.spotifyUrl ? getSpotifyEmbedUrl(post.content.spotifyUrl) : null;
        return (
          <div>
            <p className="font-medium">{t("feed.postTypes.newSong")} 🎵</p>
            {post.content.songName && (
              <p className="text-sm mb-3">{post.content.songName}</p>
            )}
            {spotifyEmbedUrl && (
              <iframe
                src={spotifyEmbedUrl}
                width="100%"
                height="152"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="rounded-xl"
              ></iframe>
            )}
          </div>
        );
      }

      case "new_dance_style":
        return (
          <div>
            <p className="font-medium">
              {t("feed.postTypes.startedDancing")} {post.content.danceStyle} 💃
            </p>
          </div>
        );

      case "jj_competition":
        return (
          <div>
            <p className="font-medium">
              {t("feed.postTypes.competed")} {post.content.competitionName || "J&J"} 🏆
            </p>
            {post.content.placement && (
              <p className="text-sm">Placement: {post.content.placement}</p>
            )}
            {post.content.competitionCity && (
              <p className="text-sm text-base-content/70">
                {post.content.competitionCity}
              </p>
            )}
          </div>
        );

      case "new_music": {
        const embedUrl = post.content.platform === "spotify" 
          ? getSpotifyEmbedUrl(post.content.releaseUrl || "")
          : getYouTubeEmbedUrl(post.content.releaseUrl || "");
        
        return (
          <div>
            <p className="font-medium">{t("feed.postTypes.newRelease")}: {post.content.releaseTitle} 🎧</p>
            {embedUrl && (
              <div className="mt-3">
                <iframe
                  src={embedUrl}
                  width="100%"
                  height={post.content.platform === "spotify" ? "152" : "200"}
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  className="rounded-xl"
                ></iframe>
              </div>
            )}
            {post.content.releaseId && (
              <a
                href={`/release/${post.content.releaseId}`}
                className="btn btn-sm btn-primary mt-3"
              >
                {t("feed.postTypes.viewReleaseDetails")} →
              </a>
            )}
          </div>
        );
      }

      default:
        return <p>Activity update</p>;
    }
  };

  const getPostIcon = (type: string) => {
    switch (type) {
      case "going_out":
        return "🎉";
      case "new_to_city":
        return "🆕";
      case "trip_added":
        return "✈️";
      case "new_song":
        return "🎵";
      case "new_dance_style":
        return "💃";
      case "jj_competition":
        return "🏆";
      case "new_music":
        return "🎧";
      default:
        return "📌";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (posts.length === 0) {
    // Smart empty state: encourage making friends if they have 0 friends
    const hasNoFriends = friendsCount !== undefined && friendsCount === 0;
    
    if (hasNoFriends) {
      return (
        <div className="text-center py-12">
          <p className="text-2xl mb-2">👋</p>
          <p className="text-lg text-base-content/70 mb-2 font-semibold">
            No activity yet
          </p>
          <p className="text-sm text-base-content/50 mb-6">
            Connect with dancers to see what&apos;s happening!
          </p>
          <Link href="/discover" className="btn btn-primary gap-2">
            <span className="text-lg">🌍</span>
            Discover People
          </Link>
        </div>
      );
    }
    
    // Has friends but no posts yet
    return (
      <div className="text-center py-12">
        <p className="text-2xl mb-2">🌙</p>
        <p className="text-lg text-base-content/70 mb-2 font-semibold">
          No activity yet
        </p>
          <p className="text-sm text-base-content/50 mb-6">
            When your friends add trips, update their favorite songs, or join competitions, you&apos;ll see it here!
          </p>
        {!isPreview && (
          <Link href="/discover" className="btn btn-outline gap-2">
            <span className="text-lg">🌍</span>
            Discover More Dancers
          </Link>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Posts */}
      <div className="space-y-4">
        {posts.map((post) => (
          <div
            key={post._id}
            className="card bg-base-200 shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="card-body p-4">
              {/* Post Header */}
              <div className="flex items-start gap-3">
                <Link href={`/dancer/${post.author._id}`}>
                  <div className="avatar">
                    <div className="w-12 h-12 rounded-full">
                      {post.author.image ? (
                        <img src={post.author.image} alt={post.author.name} />
                      ) : (
                        <div className="bg-primary text-primary-content w-full h-full flex items-center justify-center font-bold">
                          {post.author.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dancer/${post.author._id}`}
                      className="font-bold hover:underline"
                    >
                      {post.author.name}
                    </Link>
                    {post.author.isFeaturedProfessional && (
                      <VerifiedBadge size="sm" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-base-content/60">
                    <span>{getPostIcon(post.type)}</span>
                    <span>{post.city}</span>
                    <span>•</span>
                    <span>
                      {timeAgo(new Date(post.createdAt))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Post Content */}
              <div className="mt-3">{getPostContent(post)}</div>

              {/* Post Actions */}
              <div className="mt-3">
                <div className="flex items-center gap-4 text-sm">
                  <button
                    onClick={() => handleLike(post._id)}
                    className={`flex items-center gap-1 ${
                      post.isLikedByCurrentUser ? "text-error" : ""
                    }`}
                  >
                    <span>{post.isLikedByCurrentUser ? "❤️" : "🤍"}</span>
                    <span>{post.likesCount}</span>
                  </button>
                  <button
                    onClick={() => handleCommentClick(post._id)}
                    className="flex items-center gap-1"
                  >
                    <span>💬</span>
                    <span>{post.commentsCount}</span>
                  </button>
                </div>

                {/* Comments Section */}
                {commentingOn === post._id && (
                  <div className="mt-3">
                    {/* Existing Comments */}
                    {loadingComments[post._id] ? (
                      <div className="text-center py-2">
                        <span className="loading loading-spinner loading-sm"></span>
                      </div>
                    ) : postComments[post._id]?.length > 0 ? (
                      <div className="space-y-2 mb-3 max-h-60 overflow-y-auto">
                        {postComments[post._id].map((comment: any, idx: number) => (
                          <div key={idx} className="flex gap-2 text-sm bg-base-300 p-2 rounded">
                            <div className="avatar">
                              <div className="w-6 h-6 rounded-full">
                                {comment.author?.image ? (
                                  <img src={comment.author.image} alt={comment.author.name} />
                                ) : (
                                  <div className="bg-primary text-primary-content w-full h-full flex items-center justify-center text-xs font-bold">
                                    {comment.author?.name?.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold">{comment.author?.name}</div>
                              <div>{comment.text}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {/* Comment Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Write a comment..."
                        className="input input-bordered input-sm flex-1"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleComment(post._id);
                          }
                        }}
                        autoFocus
                      />
                      <button
                        onClick={() => handleComment(post._id)}
                        className="btn btn-primary btn-sm"
                        disabled={!commentText.trim()}
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* See All Button - Only show in preview mode */}
      {isPreview && posts.length > 0 && (
        <div className="text-center mt-6">
          <Link href="/feed" className="btn btn-outline btn-wide">
            See All Activity →
          </Link>
        </div>
      )}
    </div>
  );
}


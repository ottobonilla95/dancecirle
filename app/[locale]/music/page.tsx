import { Metadata } from "next";
import connectDB from "@/libs/mongoose";
import User from "@/models/User";
import config from "@/config";
import { FaMusic, FaFire, FaUsers } from "react-icons/fa";
import { getMessages, getTranslation } from "@/lib/i18n";
import { unstable_cache } from "next/cache";
import { Link } from "@/navigation";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Trending Dance Music | Bachata, Salsa, Kizomba Songs | DanceCircle",
  description: "Discover the most popular dance anthems from our community. Trending Bachata, Salsa, Kizomba, and Zouk music picked by dancers worldwide.",
  keywords: "dance music, Bachata songs, Salsa music, Kizomba songs, Zouk music, dance anthems, trending dance songs",
  alternates: {
    canonical: `https://${config.domainName}/en/music`,
    languages: {
      en: `https://${config.domainName}/en/music`,
      es: `https://${config.domainName}/es/music`,
    },
  },
  openGraph: {
    title: "Trending Dance Music | DanceCircle",
    description: "Discover the most popular dance anthems from our community. Trending Bachata, Salsa, Kizomba, and Zouk music picked by dancers worldwide.",
    url: `https://${config.domainName}/music`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Trending Dance Music | DanceCircle",
    description: "Discover the most popular dance anthems from our community.",
  },
};

// Extract Spotify track ID from URL
function extractSpotifyTrackId(url: string): string | null {
  const match = url.match(/track\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

// Determine platform from URL
function detectPlatform(url: string): "spotify" | "youtube" | null {
  if (url.includes("spotify.com")) return "spotify";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  return null;
}

// Cached: Trending songs - change when users update their anthems
const getTrendingSongs = unstable_cache(
  async () => {
    try {
      await connectDB();

      // Get all users with anthem URLs
      const users = await User.find({
        "anthem.url": { $exists: true, $ne: "" },
      })
        .select("anthem name image username")
        .lean();

      // Count occurrences of each song by Spotify track ID (ignore YouTube)
      const songData: { [trackId: string]: { count: number; url: string; users: any[] } } = {};
      
      users.forEach((user: any) => {
        if (user.anthem?.url) {
          const platform = detectPlatform(user.anthem.url);
          
          // Only count Spotify songs
          if (platform === "spotify") {
            const trackId = extractSpotifyTrackId(user.anthem.url);
            if (trackId) {
              if (!songData[trackId]) {
                songData[trackId] = { count: 0, url: user.anthem.url, users: [] };
              }
              songData[trackId].count += 1;
              songData[trackId].users.push({
                _id: user._id,
                name: user.name,
                image: user.image,
                username: user.username,
              });
            }
          }
        }
      });

      // Convert to array and sort by count
      const trendingSongs = Object.entries(songData)
        .map(([trackId, data]) => ({
          url: data.url,
          count: data.count,
          platform: "spotify" as const,
          spotifyTrackId: trackId,
          youtubeVideoId: null as string | null,
          users: data.users,
        }))
        .sort((a, b) => b.count - a.count);

      // Additional deduplication check by track ID (case-insensitive)
      const seenTrackIds = new Set<string>();
      const deduplicated = trendingSongs.filter(song => {
        const normalizedId = song.spotifyTrackId.toLowerCase();
        if (seenTrackIds.has(normalizedId)) {
          return false;
        }
        seenTrackIds.add(normalizedId);
        return true;
      });

      return deduplicated.slice(0, 10); // Top 10
    } catch (error) {
      console.error("Error fetching trending songs:", error);
      return [];
    }
  },
  ["music-trending-songs"],
  { revalidate: 300, tags: ["trending-songs"] } // 5 minutes cache, same as dashboard
);

export default async function MusicPage() {
  // Get translations
  const messages = await getMessages();
  const t = (key: string) => getTranslation(messages, key);

  // Fetch trending songs (cached)
  const trendingSongs = await getTrendingSongs();

  return (
    <div className="bg-base-100">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/20 to-secondary/20 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 flex items-center gap-3">
            <FaFire className="text-error" />
            {t('musicPage.title')}
          </h1>
          <p className="text-lg text-base-content/80">
            {t('musicPage.subtitle')} 🎵
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {trendingSongs.length === 0 ? (
          <div className="text-center py-12">
            <FaMusic className="text-6xl text-base-content/20 mx-auto mb-4" />
            <p className="text-xl text-base-content/60">
              {t('musicPage.noSongsYet')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl mx-auto">
            {trendingSongs.map((song, index) => (
              <div key={song.url} className="card bg-base-300 shadow-xl overflow-hidden">
                <div className="px-4 pt-4 pb-2">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl font-bold text-primary">
                        #{index + 1}
                      </div>
                      <div className="badge badge-primary gap-2">
                        <FaUsers className="text-xs" />
                        {song.count} {song.count === 1 ? t('musicPage.dancer') : t('musicPage.dancers')}
                      </div>
                    </div>
                    
                    {/* User Avatars */}
                    {song.users && song.users.length > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="flex -space-x-2">
                          {song.users.slice(0, 5).map((user: any) => (
                            <Link
                              key={user._id}
                              href={`/${user.username || `dancer/${user._id}`}`}
                              className="relative"
                            >
                              <div className="avatar">
                                <div className="w-7 h-7 rounded-full ring ring-base-300 ring-offset-base-100 ring-offset-1">
                                  <Image
                                    src={user.image || '/default-avatar.png'}
                                    alt={user.name}
                                    width={28}
                                    height={28}
                                    className="rounded-full object-cover"
                                  />
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                        {song.users.length > 5 && (
                          <span className="text-xs text-base-content/60 ml-1">
                            +{song.users.length - 5}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Spotify Embed */}
                {song.spotifyTrackId && (
                  <div className="w-full rounded-xl overflow-hidden" style={{ height: "152px" }}>
                    <iframe
                      src={`https://open.spotify.com/embed/track/${song.spotifyTrackId}?utm_source=generator`}
                      width="100%"
                      height="152"
                      frameBorder="0"
                      scrolling="no"
                      style={{ overflow: "hidden" }}
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                    ></iframe>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

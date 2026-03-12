import { Link } from "@/navigation";
import Image from "next/image";
import { FaMusic, FaSpotify, FaYoutube, FaFire } from "react-icons/fa";
import { getMessages, getTranslation } from "@/lib/i18n";

interface Song {
  url: string;
  count: number;
  platform: 'spotify' | 'youtube' | null;
  spotifyTrackId?: string | null;
  youtubeVideoId?: string | null;
  users?: Array<{
    _id: string;
    name: string;
    image: string;
    username: string;
  }>;
}

export default async function TrendyMusicPreview({ songs }: { songs: Song[] }) {
  const messages = await getMessages();
  const t = (key: string) => getTranslation(messages, key);

  if (songs.length === 0) {
    return null;
  }

  // Show top 3 songs
  const topSongs = songs.slice(0, 3);

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-extrabold text-xl md:text-2xl tracking-tight flex items-center gap-2">
          <FaFire className="text-error" />
          {t('dashboard.trendyMusic')}
        </h2>
        <Link href="/music" className="btn btn-outline btn-sm md:btn-md">
          {t('common.viewAll')}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topSongs.map((song, index) => (
          <div key={song.url} className="card bg-base-200 shadow-xl overflow-hidden">
            <div className="card-body p-4 pb-0 md:pb-4">
              <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-primary">
                    #{index + 1}
                  </div>
                  <div className="badge badge-sm badge-primary">
                    {song.count} {song.count === 1 ? t('common.dancer') : t('common.dancers').toLowerCase()}
                  </div>
                </div>

                {/* User Avatars */}
                {song.users && song.users.length > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="flex -space-x-2">
                      {song.users.slice(0, 4).map((user) => (
                        <Link
                          key={user._id}
                          href={`/${user.username || `dancer/${user._id}`}`}
                          className="relative"
                        >
                          <div className="avatar">
                            <div className="w-6 h-6 rounded-full ring ring-base-200 ring-offset-base-100 ring-offset-1">
                              <Image
                                src={user.image || '/default-avatar.png'}
                                alt={user.name}
                                width={24}
                                height={24}
                                className="rounded-full object-cover"
                              />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                    {song.users.length > 4 && (
                      <span className="text-xs text-base-content/60 ml-1">
                        +{song.users.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Spotify Embed */}
              {song.platform === 'spotify' && song.spotifyTrackId && (
                <div className="w-[calc(100%+2rem)] rounded-2xl overflow-hidden -mx-4 md:w-full md:mx-0" style={{ height: "152px" }}>
                  <iframe
                    src={`https://open.spotify.com/embed/track/${song.spotifyTrackId}?utm_source=generator`}
                    width="100%"
                    height="152"
                    frameBorder="0"
                    scrolling="no"
                    className="md:rounded-2xl"
                    style={{ overflow: "hidden" }}
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                  ></iframe>
                </div>
              )}

              {/* YouTube Embed */}
              {song.platform === 'youtube' && song.youtubeVideoId && (
                <div className="w-[calc(100%+2rem)] aspect-video rounded-lg overflow-hidden -mx-4 md:w-full md:mx-0">
                  <iframe
                    className="md:rounded-xl"
                    src={`https://www.youtube.com/embed/${song.youtubeVideoId}`}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    loading="lazy"
                  ></iframe>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


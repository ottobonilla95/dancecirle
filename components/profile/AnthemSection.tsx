"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaEdit, FaSave, FaTimes } from "react-icons/fa";

interface Anthem {
  url: string;
  platform: string;
  title?: string;
  artist?: string;
}

interface AnthemSectionProps {
  initialAnthem?: Anthem;
}

export default function AnthemSection({ initialAnthem }: AnthemSectionProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [anthem, setAnthem] = useState<Anthem>(initialAnthem || {
    url: "",
    platform: "",
    title: "",
    artist: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Only Spotify is supported
      const platform = "spotify";
      
      const response = await fetch("/api/user/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          anthem: {
            ...anthem,
            platform
          }
        }),
      });

      if (!response.ok) throw new Error("Failed to update anthem");
      
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error("Error saving anthem:", error);
      alert("Failed to save anthem");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setAnthem(initialAnthem || { url: "", platform: "", title: "", artist: "" });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div>
        <div className="space-y-3 mb-3">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Spotify URL</span>
            </label>
            <input
              type="url"
              value={anthem.url}
              onChange={(e) => setAnthem({ ...anthem, url: e.target.value })}
              className="input input-bordered input-sm"
              placeholder="Paste Spotify track, playlist, or album link"
            />
            <label className="label">
              <span className="label-text-alt">💡 Works with tracks, playlists, and albums!</span>
            </label>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving || !anthem.url}
            className="btn btn-primary btn-sm gap-2"
          >
            {saving ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                Saving...
              </>
            ) : (
              <>
                <FaSave /> Save
              </>
            )}
          </button>
          <button onClick={handleCancel} className="btn btn-ghost btn-sm gap-2">
            <FaTimes /> Cancel
          </button>
        </div>
      </div>
    );
  }

  const hasAnthem = anthem?.url;

  return (
    <div className="relative">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="card-title text-xl">🎵 Favorite Music</h3>
        <button
          onClick={() => setIsEditing(true)}
          className="btn btn-ghost btn-xs gap-1"
        >
          <FaEdit /> Edit
        </button>
      </div>
      {hasAnthem ? (
        <div className="rounded-lg">
          {(() => {
            const url = anthem.url;
            let embedUrl = "";
            let embedHeight = "152"; // Default for tracks

            // Detect Spotify type (track, playlist, album)
            const trackMatch = url.match(/(?:spotify\.com\/track\/|spotify:track:)([a-zA-Z0-9]+)/);
            const playlistMatch = url.match(/(?:spotify\.com\/playlist\/|spotify:playlist:)([a-zA-Z0-9]+)/);
            const albumMatch = url.match(/(?:spotify\.com\/album\/|spotify:album:)([a-zA-Z0-9]+)/);
            
            if (trackMatch) {
              embedUrl = `https://open.spotify.com/embed/track/${trackMatch[1]}`;
              embedHeight = "152"; // Compact for single track
            } else if (playlistMatch) {
              embedUrl = `https://open.spotify.com/embed/playlist/${playlistMatch[1]}`;
              embedHeight = "380"; // Full player for playlist
            } else if (albumMatch) {
              embedUrl = `https://open.spotify.com/embed/album/${albumMatch[1]}`;
              embedHeight = "380"; // Full player for album
            }

            return embedUrl ? (
              <div
                className="rounded-lg overflow-hidden"
                style={{ height: `${embedHeight}px` }}
              >
                <iframe
                  src={embedUrl}
                  width="100%"
                  height={embedHeight}
                  frameBorder="0"
                  scrolling="no"
                  className="rounded-2xl"
                  style={{ overflow: "hidden" }}
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                />
              </div>
            ) : (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-xs btn-primary"
              >
                🎧 Listen
              </a>
            );
          })()}
        </div>
      ) : (
        <p className="text-base-content/50 italic">No music added yet. Click edit to add your favorite Spotify track, playlist, or album.</p>
      )}
    </div>
  );
}


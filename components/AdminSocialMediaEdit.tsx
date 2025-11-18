"use client";

import { useState } from "react";
import { FaInstagram, FaTiktok, FaYoutube, FaEdit, FaSave, FaTimes } from "react-icons/fa";
import { useRouter } from "next/navigation";

interface AdminSocialMediaEditProps {
  userId: string;
  initialSocialMedia: {
    instagram?: string;
    tiktok?: string;
    youtube?: string;
  };
}

export default function AdminSocialMediaEdit({ userId, initialSocialMedia }: AdminSocialMediaEditProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [instagram, setInstagram] = useState(initialSocialMedia?.instagram || "");
  const [tiktok, setTiktok] = useState(initialSocialMedia?.tiktok || "");
  const [youtube, setYoutube] = useState(initialSocialMedia?.youtube || "");

  const handleSave = async () => {
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/users/${userId}/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          socialMedia: {
            instagram: instagram.trim(),
            tiktok: tiktok.trim(),
            youtube: youtube.trim(),
          },
        }),
      });

      if (res.ok) {
        setIsEditing(false);
        router.refresh();
      } else {
        alert("Failed to update social media");
      }
    } catch (error) {
      console.error("Error updating social media:", error);
      alert("Error updating social media");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setInstagram(initialSocialMedia?.instagram || "");
    setTiktok(initialSocialMedia?.tiktok || "");
    setYoutube(initialSocialMedia?.youtube || "");
    setIsEditing(false);
  };

  // Helper function to construct social media URLs
  const getSocialUrl = (platform: string, value: string) => {
    if (!value) return "";
    if (value.startsWith("http")) return value;

    const cleanValue = value.replace("@", "");
    switch (platform) {
      case "instagram":
        return `https://instagram.com/${cleanValue}`;
      case "tiktok":
        return `https://tiktok.com/@${cleanValue}`;
      case "youtube":
        return value;
      default:
        return value;
    }
  };

  if (!isEditing) {
    return (
      <div className="card bg-warning/10 border-2 border-warning shadow-xl">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h3 className="card-title text-xl">
              🌐 Social Media
            </h3>
            <button
              onClick={() => setIsEditing(true)}
              className="btn btn-warning btn-sm gap-2"
            >
              <FaEdit />
              Edit (Admin)
            </button>
          </div>
          
          <div className="flex gap-3">
            {instagram && (
              <a
                href={getSocialUrl("instagram", instagram)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-circle btn-outline hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 hover:text-white hover:border-purple-500"
                title={`@${instagram.replace("@", "")} on Instagram`}
              >
                <FaInstagram className="text-xl" />
              </a>
            )}
            {tiktok && (
              <a
                href={getSocialUrl("tiktok", tiktok)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-circle btn-outline hover:bg-black hover:text-white hover:border-black"
                title={`@${tiktok.replace("@", "")} on TikTok`}
              >
                <FaTiktok className="text-xl" />
              </a>
            )}
            {youtube && (
              <a
                href={getSocialUrl("youtube", youtube)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-circle btn-outline hover:bg-red-600 hover:text-white hover:border-red-600"
                title="YouTube Channel"
              >
                <FaYoutube className="text-xl" />
              </a>
            )}
            {!instagram && !tiktok && !youtube && (
              <p className="text-sm text-base-content/60 italic">No social media links added yet</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-warning/10 border-2 border-warning shadow-xl">
      <div className="card-body">
        <h3 className="card-title text-xl mb-4">
          🌐 Edit Social Media (Admin)
        </h3>

        <div className="space-y-4">
          {/* Instagram */}
          <div className="form-control">
            <label className="label">
              <span className="label-text flex items-center gap-2">
                <FaInstagram className="text-pink-500" />
                Instagram
              </span>
            </label>
            <input
              type="text"
              placeholder="username or profile URL"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              className="input input-bordered"
              disabled={saving}
            />
          </div>

          {/* TikTok */}
          <div className="form-control">
            <label className="label">
              <span className="label-text flex items-center gap-2">
                <FaTiktok className="text-black" />
                TikTok
              </span>
            </label>
            <input
              type="text"
              placeholder="@username or profile URL"
              value={tiktok}
              onChange={(e) => setTiktok(e.target.value)}
              className="input input-bordered"
              disabled={saving}
            />
          </div>

          {/* YouTube */}
          <div className="form-control">
            <label className="label">
              <span className="label-text flex items-center gap-2">
                <FaYoutube className="text-red-500" />
                YouTube
              </span>
            </label>
            <input
              type="text"
              placeholder="Channel URL"
              value={youtube}
              onChange={(e) => setYoutube(e.target.value)}
              className="input input-bordered"
              disabled={saving}
            />
          </div>
        </div>

        <div className="card-actions justify-end mt-6">
          <button
            onClick={handleCancel}
            className="btn btn-ghost gap-2"
            disabled={saving}
          >
            <FaTimes />
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn btn-warning gap-2"
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Saving...
              </>
            ) : (
              <>
                <FaSave />
                Save
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


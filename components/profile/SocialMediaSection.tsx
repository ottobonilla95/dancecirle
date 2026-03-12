"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaEdit, FaSave, FaTimes, FaInstagram, FaTiktok, FaYoutube } from "react-icons/fa";
import { useTranslation } from "@/components/I18nProvider";

interface SocialMedia {
  instagram?: string;
  tiktok?: string;
  youtube?: string;
}

interface SocialMediaSectionProps {
  initialSocialMedia?: SocialMedia;
}

export default function SocialMediaSection({ initialSocialMedia }: SocialMediaSectionProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [socialMedia, setSocialMedia] = useState<SocialMedia>(initialSocialMedia || {});
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/user/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socialMedia }),
      });

      if (!response.ok) throw new Error("Failed to update social media");
      
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error("Error saving social media:", error);
      alert("Failed to save social media");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setSocialMedia(initialSocialMedia || {});
    setIsEditing(false);
  };

  const getSocialUrl = (platform: string, value: string) => {
    if (!value) return "";
    if (value.startsWith("http")) return value;
    
    const cleanValue = value.replace("@", "");
    switch (platform) {
      case "instagram":
        return `https://instagram.com/${cleanValue}`;
      case "tiktok":
        return `https://tiktok.com/@${cleanValue}`;
      default:
        return value;
    }
  };

  if (isEditing) {
    return (
      <div>
        <div className="space-y-3 mb-3">
          <div className="form-control">
            <label className="label">
              <span className="label-text flex items-center gap-2">
                <FaInstagram /> Instagram
              </span>
            </label>
            <input
              type="text"
              value={socialMedia.instagram || ""}
              onChange={(e) => setSocialMedia({ ...socialMedia, instagram: e.target.value })}
              className="input input-bordered input-sm"
              placeholder="@username or full URL"
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text flex items-center gap-2">
                <FaTiktok /> TikTok
              </span>
            </label>
            <input
              type="text"
              value={socialMedia.tiktok || ""}
              onChange={(e) => setSocialMedia({ ...socialMedia, tiktok: e.target.value })}
              className="input input-bordered input-sm"
              placeholder="@username or full URL"
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text flex items-center gap-2">
                <FaYoutube /> YouTube
              </span>
            </label>
            <input
              type="text"
              value={socialMedia.youtube || ""}
              onChange={(e) => setSocialMedia({ ...socialMedia, youtube: e.target.value })}
              className="input input-bordered input-sm"
              placeholder="Channel URL"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary btn-sm gap-2"
          >
            {saving ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                {t('common.saving')}
              </>
            ) : (
              <>
                <FaSave /> {t('common.save')}
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

  const hasSocial = socialMedia.instagram || socialMedia.tiktok || socialMedia.youtube;

  return (
    <div className="relative">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="card-title text-xl">🌐 Social Media</h3>
        <button
          onClick={() => setIsEditing(true)}
          className="btn btn-ghost btn-xs gap-1"
        >
          <FaEdit /> Edit
        </button>
      </div>
      {hasSocial ? (
        <div className="flex gap-3">
          {socialMedia.instagram && (
            <a
              href={getSocialUrl("instagram", socialMedia.instagram)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-circle btn-outline hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 hover:text-white hover:border-purple-500"
              title={`@${socialMedia.instagram.replace("@", "")} on Instagram`}
            >
              <FaInstagram className="text-xl" />
            </a>
          )}
          {socialMedia.tiktok && (
            <a
              href={getSocialUrl("tiktok", socialMedia.tiktok)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-circle btn-outline hover:bg-black hover:text-white hover:border-black"
              title={`@${socialMedia.tiktok.replace("@", "")} on TikTok`}
            >
              <FaTiktok className="text-xl" />
            </a>
          )}
          {socialMedia.youtube && (
            <a
              href={getSocialUrl("youtube", socialMedia.youtube)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-circle btn-outline hover:bg-red-600 hover:text-white hover:border-red-600"
              title="YouTube Channel"
            >
              <FaYoutube className="text-xl" />
            </a>
          )}
        </div>
      ) : (
        <p className="text-base-content/50 italic">No social media added yet. Click edit to add your profiles.</p>
      )}
    </div>
  );
}


"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/navigation";
import { FaSave, FaArrowLeft } from "react-icons/fa";

interface User {
  _id: string;
  name: string;
  email: string;
  username?: string;
  bio?: string;
  isProfileComplete?: boolean;
  preferredLanguage?: string;
  anthem?: {
    url?: string;
    platform?: string;
    title?: string;
    artist?: string;
  };
  socialMedia?: {
    instagram?: string;
    tiktok?: string;
    twitter?: string;
    youtube?: string;
  };
}

export default function EditUserPage({ params }: { params: Promise<{ userId: string }> }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    bio: "",
    preferredLanguage: "en",
    anthem: {
      url: "",
      platform: "spotify",
      title: "",
      artist: "",
    },
    socialMedia: {
      instagram: "",
      tiktok: "",
      twitter: "",
      youtube: "",
    },
  });

  useEffect(() => {
    const initParams = async () => {
      const resolvedParams = await params;
      setUserId(resolvedParams.userId);
    };
    initParams();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (userId) {
      fetchUser();
    }
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUser = async () => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setFormData({
          name: data.user.name || "",
          email: data.user.email || "",
          username: data.user.username || "",
          bio: data.user.bio || "",
          preferredLanguage: data.user.preferredLanguage || "en",
          anthem: {
            url: data.user.anthem?.url || "",
            platform: data.user.anthem?.platform || "spotify",
            title: data.user.anthem?.title || "",
            artist: data.user.anthem?.artist || "",
          },
          socialMedia: {
            instagram: data.user.socialMedia?.instagram || "",
            tiktok: data.user.socialMedia?.tiktok || "",
            twitter: data.user.socialMedia?.twitter || "",
            youtube: data.user.socialMedia?.youtube || "",
          },
        });
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("User updated successfully!");
        router.push("/admin/users");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Error updating user");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-8">
        <div className="alert alert-error">
          <span>User not found</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push("/admin/users")}
          className="btn btn-ghost btn-sm gap-2"
        >
          <FaArrowLeft /> Back
        </button>
        <h1 className="text-3xl font-bold">Edit User: {user.name}</h1>
      </div>

      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <div className="space-y-4">
            {/* Bio */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Bio</span>
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="textarea textarea-bordered h-24"
                placeholder="User bio"
              />
            </div>

            {/* Favorite Song (Anthem) */}
            <div className="divider">Favorite Song / Anthem</div>

            <div className="grid grid-cols-2 gap-4">
              {/* Song Title */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Song Title</span>
                </label>
                <input
                  type="text"
                  value={formData.anthem.title}
                  onChange={(e) => setFormData({ ...formData, anthem: { ...formData.anthem, title: e.target.value } })}
                  className="input input-bordered"
                  placeholder="Song title"
                />
              </div>

              {/* Artist */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Artist</span>
                </label>
                <input
                  type="text"
                  value={formData.anthem.artist}
                  onChange={(e) => setFormData({ ...formData, anthem: { ...formData.anthem, artist: e.target.value } })}
                  className="input input-bordered"
                  placeholder="Artist name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Platform */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Platform</span>
                </label>
                <select
                  value={formData.anthem.platform}
                  onChange={(e) => setFormData({ ...formData, anthem: { ...formData.anthem, platform: e.target.value } })}
                  className="select select-bordered"
                >
                  <option value="spotify">Spotify</option>
                  <option value="youtube">YouTube</option>
                </select>
              </div>

              {/* URL */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Song URL</span>
                </label>
                <input
                  type="url"
                  value={formData.anthem.url}
                  onChange={(e) => setFormData({ ...formData, anthem: { ...formData.anthem, url: e.target.value } })}
                  className="input input-bordered"
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Social Media Section */}
            <div className="divider">Social Media</div>

            {/* Instagram */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Instagram</span>
              </label>
              <input
                type="text"
                value={formData.socialMedia.instagram}
                onChange={(e) => setFormData({ ...formData, socialMedia: { ...formData.socialMedia, instagram: e.target.value } })}
                className="input input-bordered"
                placeholder="@username"
              />
            </div>

            {/* TikTok */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">TikTok</span>
              </label>
              <input
                type="text"
                value={formData.socialMedia.tiktok}
                onChange={(e) => setFormData({ ...formData, socialMedia: { ...formData.socialMedia, tiktok: e.target.value } })}
                className="input input-bordered"
                placeholder="@username"
              />
            </div>

            {/* Twitter */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Twitter / X</span>
              </label>
              <input
                type="text"
                value={formData.socialMedia.twitter}
                onChange={(e) => setFormData({ ...formData, socialMedia: { ...formData.socialMedia, twitter: e.target.value } })}
                className="input input-bordered"
                placeholder="@username"
              />
            </div>

            {/* YouTube */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">YouTube</span>
              </label>
              <input
                type="text"
                value={formData.socialMedia.youtube}
                onChange={(e) => setFormData({ ...formData, socialMedia: { ...formData.socialMedia, youtube: e.target.value } })}
                className="input input-bordered"
                placeholder="Channel name or handle"
              />
            </div>
          </div>

          <div className="card-actions justify-end mt-6">
            <button
              onClick={() => router.push("/admin/users")}
              className="btn btn-ghost"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="btn btn-success gap-2"
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Saving...
                </>
              ) : (
                <>
                  <FaSave /> Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


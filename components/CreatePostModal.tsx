"use client";

import { useState, FormEvent } from "react";
import { useTranslation } from "@/components/I18nProvider";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

export default function CreatePostModal({
  isOpen,
  onClose,
  onPostCreated,
}: CreatePostModalProps) {
  const { t } = useTranslation();
  const [venue, setVenue] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!venue.trim()) {
      setError(t("feed.createPostModal.enterVenue"));
      return;
    }

    setLoading(true);

    try {
      // Set time to tonight at 9 PM by default
      const tonight = new Date();
      tonight.setHours(21, 0, 0, 0);
      
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "going_out",
          content: {
            venue: venue.trim(),
            time: tonight.toISOString(),
            message: message.trim() || undefined,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create post");
      }

      // Reset form
      setVenue("");
      setMessage("");
      
      // Call success callback
      onPostCreated();
    } catch (err) {
      console.error("Error creating post:", err);
      setError("Failed to create post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setVenue("");
      setMessage("");
      setError("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-2xl mb-2">🎉 {t("feed.createPostModal.title")}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Venue */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">{t("feed.createPostModal.whereLabel")} *</span>
            </label>
            <input
              type="text"
              placeholder={t("feed.createPostModal.wherePlaceholder")}
              className="input input-bordered w-full"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              disabled={loading}
              maxLength={100}
              autoFocus
            />
          </div>

          {/* Optional Message */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">
                {t("feed.createPostModal.messageLabel")}
              </span>
            </label>
            <textarea
              placeholder={t("feed.createPostModal.messagePlaceholder")}
              className="textarea textarea-bordered w-full h-24"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
              maxLength={500}
            />
            <label className="label">
              <span className="label-text-alt text-base-content/60">
                {message.length}/500
              </span>
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="modal-action">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-ghost"
              disabled={loading}
            >
              {t("feed.createPostModal.cancel")}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  {t("feed.createPostModal.posting")}
                </>
              ) : (
                t("feed.createPostModal.shareWithFriends")
              )}
            </button>
          </div>
        </form>
      </div>
      
      {/* Backdrop */}
      <div className="modal-backdrop" onClick={handleClose}></div>
    </div>
  );
}


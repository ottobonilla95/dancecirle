"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaEdit, FaSave, FaTimes } from "react-icons/fa";
import { useTranslation } from "@/components/I18nProvider";

interface BioSectionProps {
  initialBio?: string;
}

export default function BioSection({ initialBio }: BioSectionProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState(initialBio || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/user/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio }),
      });

      if (!response.ok) throw new Error("Failed to update bio");
      
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error("Error saving bio:", error);
      alert("Failed to save bio");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setBio(initialBio || "");
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="mb-4">
        <div className="text-sm font-medium text-base-content/60 mb-2">
          Bio
        </div>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="textarea textarea-bordered w-full h-24"
          placeholder="Tell us about yourself and your dance journey..."
          maxLength={500}
        />
        <div className="text-xs text-base-content/50 mb-2">{bio.length}/500</div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary btn-sm"
          >
            {saving ? t('common.saving') : t('common.save')}
          </button>
          <button onClick={handleCancel} className="btn btn-ghost btn-sm">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div className="flex justify-between items-start mb-1">
        <div className="text-sm font-medium text-base-content/60">
          Bio
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="btn btn-ghost btn-xs"
        >
          Edit
        </button>
      </div>
      {bio ? (
        <p className="text-base italic text-base-content/80">
          &ldquo;{bio}&rdquo;
        </p>
      ) : (
        <p className="text-base-content/50 italic">No bio added yet. Click edit to add one.</p>
      )}
    </div>
  );
}


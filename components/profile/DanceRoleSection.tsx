"use client";

import { useState } from "react";
import { useTranslation } from "@/components/I18nProvider";

interface DanceRoleSectionProps {
  initialDanceRole?: string;
}

export default function DanceRoleSection({ initialDanceRole }: DanceRoleSectionProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [danceRole, setDanceRole] = useState(initialDanceRole || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, string> = {
      leader: "Leader 🕺",
      follower: "Follower 💃",
      both: "Both (Leader & Follower)",
    };
    return roleMap[role] || role;
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError("");

    try {
      const response = await fetch("/api/user/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ danceRole }),
      });

      if (!response.ok) {
        throw new Error("Failed to update dance role");
      }

      setIsEditing(false);
      window.location.reload();
    } catch (err) {
      setError("Failed to save. Please try again.");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDanceRole(initialDanceRole || "");
    setIsEditing(false);
    setError("");
  };

  if (isEditing) {
    return (
      <div className="mb-4">
        <div className="text-sm font-medium text-base-content/60 mb-2">
          Dance Role
        </div>
        <select
          value={danceRole}
          onChange={(e) => setDanceRole(e.target.value)}
          className="select select-bordered w-full mb-2"
        >
          <option value="">Select your dance role</option>
          <option value="leader">Leader 🕺</option>
          <option value="follower">Follower 💃</option>
          <option value="both">Both (Leader & Follower)</option>
        </select>
        {error && <p className="text-error text-sm mb-2">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn btn-primary btn-sm"
          >
            {isSaving ? t('common.saving') : t('common.save')}
          </button>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="btn btn-ghost btn-sm"
          >
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
          Dance Role
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="btn btn-ghost btn-xs"
        >
          Edit
        </button>
      </div>
      <div className="text-lg">
        {danceRole ? getRoleDisplay(danceRole) : "Not set"}
      </div>
    </div>
  );
}


"use client";

import { useState } from "react";
import { useTranslation } from "@/components/I18nProvider";

interface RelationshipStatusSectionProps {
  initialRelationshipStatus?: string;
}

export default function RelationshipStatusSection({ initialRelationshipStatus }: RelationshipStatusSectionProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [relationshipStatus, setRelationshipStatus] = useState(initialRelationshipStatus || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const getRelationshipStatusDisplay = (status: string) => {
    const statusMap: Record<string, string> = {
      single: "Single 💙",
      in_a_relationship: "In a Relationship 💕",
      married: "Married 💍",
      its_complicated: "It's complicated 🤷",
      prefer_not_to_say: "Prefer not to say",
    };
    return statusMap[status] || status;
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError("");

    try {
      const response = await fetch("/api/user/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ relationshipStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update relationship status");
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
    setRelationshipStatus(initialRelationshipStatus || "");
    setIsEditing(false);
    setError("");
  };

  if (isEditing) {
    return (
      <div className="mb-4">
        <div className="text-sm font-medium text-base-content/60 mb-2">
          Relationship Status
        </div>
        <select
          value={relationshipStatus}
          onChange={(e) => setRelationshipStatus(e.target.value)}
          className="select select-bordered w-full mb-2"
        >
          <option value="">Select your status</option>
          <option value="single">Single 💙</option>
          <option value="in_a_relationship">In a Relationship 💕</option>
          <option value="married">Married 💍</option>
          <option value="its_complicated">It&apos;s complicated 🤷</option>
          <option value="prefer_not_to_say">Prefer not to say</option>
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
          Relationship Status
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="btn btn-ghost btn-xs"
        >
          Edit
        </button>
      </div>
      <div className="text-lg">
        {relationshipStatus ? getRelationshipStatusDisplay(relationshipStatus) : "Not set"}
      </div>
    </div>
  );
}


"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/components/I18nProvider";

interface NameSectionProps {
  initialFirstName?: string;
  initialLastName?: string;
}

export default function NameSection({
  initialFirstName,
  initialLastName,
}: NameSectionProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(initialFirstName || "");
  const [lastName, setLastName] = useState(initialLastName || "");
  const [saving, setSaving] = useState(false);

  const fullName = `${firstName} ${lastName}`.trim();

  const handleCancel = () => {
    setFirstName(initialFirstName || "");
    setLastName(initialLastName || "");
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      alert("First name and last name are required");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/user/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update name");
      }

      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error("Error updating name:", error);
      alert("Failed to update name");
    } finally {
      setSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        <div className="text-sm font-medium text-base-content/60">Name</div>
        <input
          className="input input-bordered w-full input-sm"
          placeholder="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          maxLength={50}
        />
        <input
          className="input input-bordered w-full input-sm"
          placeholder="Last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          maxLength={50}
        />
        <div className="flex gap-2">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? t('common.saving') : t('common.save')}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={saving}
            onClick={handleCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-medium text-base-content/60">Name</div>
          <div className="text-base">{fullName || "Not set"}</div>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-xs"
          onClick={() => setIsEditing(true)}
        >
          Edit
        </button>
      </div>
    </div>
  );
}

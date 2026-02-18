"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface BirthDetailsSectionProps {
  initialDateOfBirth?: string | Date;
  initialHideAge?: boolean;
}

function toDateInputValue(value?: string | Date): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

function formatBirthDate(value?: string | Date): string {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function BirthDetailsSection({
  initialDateOfBirth,
  initialHideAge = false,
}: BirthDetailsSectionProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState(toDateInputValue(initialDateOfBirth));
  const [hideAge, setHideAge] = useState(initialHideAge);
  const [saving, setSaving] = useState(false);

  const handleCancel = () => {
    setDateOfBirth(toDateInputValue(initialDateOfBirth));
    setHideAge(initialHideAge);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!dateOfBirth) {
      alert("Please choose your date of birth");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/user/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateOfBirth,
          hideAge,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update birth details");
      }

      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error("Error updating birth details:", error);
      alert("Failed to update birth details");
    } finally {
      setSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        <div className="text-sm font-medium text-base-content/60">
          Date of Birth and Age Visibility
        </div>
        <input
          type="date"
          className="input input-bordered w-full input-sm"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          max={new Date().toISOString().split("T")[0]}
        />
        <label className="label cursor-pointer justify-start gap-2">
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={hideAge}
            onChange={(e) => setHideAge(e.target.checked)}
          />
          <span className="label-text text-sm">Hide my age on profile</span>
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? "Saving..." : "Save"}
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
          <div className="text-sm font-medium text-base-content/60">Date of Birth</div>
          <div className="text-base">{formatBirthDate(initialDateOfBirth)}</div>
          <div className="text-xs text-base-content/60">
            Age visibility: {initialHideAge ? "Hidden" : "Visible"}
          </div>
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

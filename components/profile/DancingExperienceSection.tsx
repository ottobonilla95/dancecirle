"use client";

import { useState } from "react";

interface DancingExperienceSectionProps {
  initialDancingStartYear?: number;
}

export default function DancingExperienceSection({ initialDancingStartYear }: DancingExperienceSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [dancingStartYear, setDancingStartYear] = useState(initialDancingStartYear || new Date().getFullYear());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setIsSaving(true);
    setError("");

    try {
      const response = await fetch("/api/user/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dancingStartYear }),
      });

      if (!response.ok) {
        throw new Error("Failed to update dancing experience");
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
    setDancingStartYear(initialDancingStartYear || new Date().getFullYear());
    setIsEditing(false);
    setError("");
  };

  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear; year >= 1950; year--) {
    years.push(year);
  }

  if (isEditing) {
    return (
      <div className="mb-4">
        <div className="text-sm font-medium text-base-content/60 mb-2">
          Dancing Experience
        </div>
        <select
          value={dancingStartYear}
          onChange={(e) => setDancingStartYear(parseInt(e.target.value))}
          className="select select-bordered w-full mb-2"
        >
          <option value="">When did you start dancing?</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        {error && <p className="text-error text-sm mb-2">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn btn-primary btn-sm"
          >
            {isSaving ? "Saving..." : "Save"}
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
          Dancing Experience
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="btn btn-ghost btn-xs"
        >
          Edit
        </button>
      </div>
      <div className="text-lg">
        {initialDancingStartYear ? (
          <>
            {currentYear - initialDancingStartYear} years (Since {initialDancingStartYear})
          </>
        ) : (
          "Not set"
        )}
      </div>
    </div>
  );
}


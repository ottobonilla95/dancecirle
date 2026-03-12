"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { COUNTRIES } from "@/constants/countries";
import { useTranslation } from "@/components/I18nProvider";
import Flag from "@/components/Flag";
import { getCountryCode } from "@/utils/countries";

interface NationalitySectionProps {
  initialNationality?: string;
}

export default function NationalitySection({
  initialNationality,
}: NationalitySectionProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [nationality, setNationality] = useState(initialNationality || "");
  const [saving, setSaving] = useState(false);

  const handleCancel = () => {
    setNationality(initialNationality || "");
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!nationality) {
      alert("Please select your nationality");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/user/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nationality }),
      });

      if (!response.ok) {
        throw new Error("Failed to update nationality");
      }

      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error("Error updating nationality:", error);
      alert("Failed to update nationality");
    } finally {
      setSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        <div className="text-sm font-medium text-base-content/60">Nationality</div>
        <select
          className="select select-bordered w-full select-sm"
          value={nationality}
          onChange={(e) => setNationality(e.target.value)}
        >
          <option value="">Select your nationality</option>
          {COUNTRIES.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
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
          <div className="text-sm font-medium text-base-content/60">Nationality</div>
          <div className="text-base flex items-center gap-2">
            {initialNationality ? (
              <>
                <Flag countryCode={getCountryCode(initialNationality)} size="sm" />
                {initialNationality}
              </>
            ) : (
              "Not set"
            )}
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

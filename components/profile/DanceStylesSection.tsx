"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaEdit, FaSave, FaTimes } from "react-icons/fa";

interface DanceStyle {
  _id?: string;
  id?: string;
  name: string;
  level: string;
  levelLabel: string;
  levelEmoji: string;
}

interface DanceStyleOption {
  _id: string;
  name: string;
}

interface DanceStylesSectionProps {
  initialDanceStyles: DanceStyle[];
}

const DANCE_LEVELS = [
  { value: "beginner", label: "Beginner", emoji: "🌱" },
  { value: "intermediate", label: "Intermediate", emoji: "🌿" },
  { value: "advanced", label: "Advanced", emoji: "🌳" },
  { value: "professional", label: "Professional", emoji: "🏆" },
];

export default function DanceStylesSection({ initialDanceStyles }: DanceStylesSectionProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [danceStyles, setDanceStyles] = useState<any[]>([]);
  const [availableStyles, setAvailableStyles] = useState<DanceStyleOption[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Fetch available dance styles
    fetch("/api/dance-styles")
      .then((res) => res.json())
      .then((data) => {
        // Handle both array and object responses
        if (Array.isArray(data)) {
          setAvailableStyles(data);
        } else if (data.danceStyles && Array.isArray(data.danceStyles)) {
          setAvailableStyles(data.danceStyles);
        } else {
          console.error("Unexpected dance styles response format:", data);
          setAvailableStyles([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching dance styles:", err);
        setAvailableStyles([]);
      });

    // Initialize with current styles - ensure IDs are strings
    setDanceStyles(
      initialDanceStyles.map((ds) => ({
        danceStyle: (ds._id || ds.id || "").toString(),
        level: ds.level,
      }))
    );
  }, [initialDanceStyles]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/user/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          danceStyles,
        }),
      });

      if (!response.ok) throw new Error("Failed to update dance styles");
      
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error("Error saving dance styles:", error);
      alert("Failed to save dance styles");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDanceStyles(
      initialDanceStyles.map((ds) => ({
        danceStyle: (ds._id || ds.id || "").toString(),
        level: ds.level,
      }))
    );
    setIsEditing(false);
  };

  const addStyle = () => {
    setDanceStyles([...danceStyles, { danceStyle: "", level: "beginner" }]);
  };

  const removeStyle = (index: number) => {
    setDanceStyles(danceStyles.filter((_, i) => i !== index));
  };

  const updateStyle = (index: number, field: string, value: string) => {
    const updated = [...danceStyles];
    updated[index][field] = value;
    setDanceStyles(updated);
  };

  if (isEditing) {
    return (
      <div>
        <div className="space-y-3 mb-3">
          {danceStyles.map((style, index) => {
            return (
              <div key={index} className="flex gap-2 items-start">
                <div className="form-control flex-1">
                  <select
                    key={`style-${index}-${style.danceStyle}`}
                    value={style.danceStyle || ""}
                    onChange={(e) => updateStyle(index, "danceStyle", e.target.value)}
                    className="select select-bordered select-sm"
                  >
                    <option value="" disabled>Select dance style</option>
                    {availableStyles.map((ds) => {
                      const optionValue = String(ds._id);
                      return (
                        <option key={optionValue} value={optionValue}>
                          {ds.name}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="form-control flex-1">
                  <select
                    value={style.level}
                    onChange={(e) => updateStyle(index, "level", e.target.value)}
                    className="select select-bordered select-sm"
                  >
                    {DANCE_LEVELS.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.emoji} {level.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => removeStyle(index)}
                  className="btn btn-ghost btn-sm btn-square"
                >
                  <FaTimes />
                </button>
              </div>
            );
          })}
          <button onClick={addStyle} className="btn btn-outline btn-sm w-full">
            + Add Dance Style
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving || danceStyles.some((s) => !s.danceStyle)}
            className="btn btn-primary btn-sm gap-2"
          >
            {saving ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                Saving...
              </>
            ) : (
              <>
                <FaSave /> Save
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

  return (
    <div className="relative">
      {isEditing ? null : (
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-base-content/60">
            Dance Styles & Levels
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="btn btn-ghost btn-xs gap-1"
          >
            <FaEdit /> Edit
          </button>
        </div>
      )}
      {initialDanceStyles.length > 0 ? (
        <div className="space-y-4">
          {initialDanceStyles.map((style, index) => {
            // Convert level to number (1-4)
            const levelMap: { [key: string]: number } = {
              'beginner': 1,
              'intermediate': 2, 
              'advanced': 3,
              'expert': 4
            };
            const levelNum = levelMap[style.level] || 1;
            
            return (
              <div key={index} className="bg-base-300 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span>{style.levelEmoji}</span>
                    <span className="font-medium">{style.name}</span>
                  </div>
                  <span className="text-xs text-base-content/70 capitalize">
                    {style.levelLabel}
                  </span>
                </div>
                {/* Level Progress Bar */}
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((bar) => (
                    <div
                      key={bar}
                      className={`h-2 flex-1 rounded-full ${
                        bar <= levelNum 
                          ? 'bg-primary' 
                          : 'bg-base-content/20'
                      }`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-base-content/50 italic">No dance styles added yet. Click edit to add your styles.</p>
      )}
    </div>
  );
}


"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CitySelector from "@/components/CitySelector";
import { City } from "@/types";

interface HomeLocationSectionProps {
  initialCity?: any;
}

function normalizeCity(city: any): City | null {
  if (!city) return null;
  return {
    _id: city._id || city.id,
    id: city.id || city._id,
    name: city.name || "",
    country: {
      name: city.country?.name || "",
      code: city.country?.code || "",
    },
    continent: {
      name: city.continent?.name || "",
    },
    totalDancers: city.totalDancers || 0,
    rank: city.rank || 0,
    image: city.image,
  };
}

export default function HomeLocationSection({ initialCity }: HomeLocationSectionProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCities, setSelectedCities] = useState<City[]>(
    normalizeCity(initialCity) ? [normalizeCity(initialCity) as City] : []
  );
  const [saving, setSaving] = useState(false);

  const selectedCity = selectedCities.length > 0 ? selectedCities[0] : null;

  const handleCitiesChange = (cities: City[]) => {
    const latest = cities[cities.length - 1];
    setSelectedCities(latest ? [latest] : []);
  };

  const handleCancel = () => {
    setSelectedCities(normalizeCity(initialCity) ? [normalizeCity(initialCity) as City] : []);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!selectedCity?._id) {
      alert("Please select a city");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/user/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: selectedCity._id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update location");
      }

      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error("Error updating location:", error);
      alert("Failed to update location");
    } finally {
      setSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        <div className="text-sm font-medium text-base-content/60">Home Location</div>
        <CitySelector
          selectedCities={selectedCities}
          onCitiesChange={handleCitiesChange}
          placeholder="Search your home city..."
          label="City"
        />
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
          <div className="text-sm font-medium text-base-content/60">Home Location</div>
          <div className="text-base">
            {selectedCity ? `${selectedCity.name}, ${selectedCity.country?.name}` : "Not set"}
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

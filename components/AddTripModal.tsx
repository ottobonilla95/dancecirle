"use client";

import { useState } from "react";
import { FaPlane } from "react-icons/fa";
import { useTranslation } from "@/components/I18nProvider";
import CityDropdown from "./CityDropdown";
import Flag from "./Flag";

interface AddTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTripAdded?: () => void;
}

export default function AddTripModal({ isOpen, onClose, onTripAdded }: AddTripModalProps) {
  const { t } = useTranslation();
  const [selectedCity, setSelectedCity] = useState<any>(null);
  const [citySearch, setCitySearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const resetForm = () => {
    setSelectedCity(null);
    setCitySearch("");
    setStartDate("");
    setEndDate("");
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleAddTrip = async () => {
    if (!selectedCity || !startDate || !endDate) {
      setError(t('trips.fillAllFields'));
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      setError("End date must be after start date");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/user/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cityId: selectedCity._id,
          startDate,
          endDate,
        }),
      });

      if (res.ok) {
        resetForm();
        onClose();
        onTripAdded?.();
      } else {
        const data = await res.json();
        setError(data.error || t('trips.failedToAdd'));
      }
    } catch (error) {
      setError(t('trips.failedToAdd'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
          <FaPlane className="text-primary" />
          {t('trips.addTrip')}
        </h3>

        <div className="space-y-4">
          {/* Destination */}
          <div>
            <label className="label">
              <span className="label-text">Destination</span>
            </label>
            {!selectedCity ? (
              <CityDropdown
                searchTerm={citySearch}
                onSearchChange={setCitySearch}
                onCitySelect={setSelectedCity}
                placeholder="Search for a city..."
                selectedCities={[]}
              />
            ) : (
              <div className="flex items-center gap-2 p-3 bg-base-200 rounded-lg">
                <Flag countryCode={selectedCity.country.code} size="sm" />
                <span className="flex-1">
                  {selectedCity.name}, {selectedCity.country.name}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedCity(null)}
                  className="btn btn-ghost btn-sm btn-circle"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">
                <span className="label-text">Start Date</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input input-bordered w-full"
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div>
              <label className="label">
                <span className="label-text">End Date</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input input-bordered w-full"
                min={startDate || new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>

          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="modal-action">
          <button onClick={handleClose} className="btn btn-ghost" disabled={isLoading}>
            {t('common.cancel')}
          </button>
          <button
            onClick={handleAddTrip}
            disabled={isLoading}
            className="btn btn-primary"
          >
            {isLoading ? t('common.adding') : t('trips.addTrip')}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={handleClose} />
    </div>
  );
}

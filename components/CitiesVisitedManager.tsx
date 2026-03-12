"use client";

import { useState } from "react";
import { FaPlus, FaTimes } from "react-icons/fa";
import CitySelector from "./CitySelector";
import { Link } from "@/navigation";
import { City } from "@/types";
import { useTranslation } from "./I18nProvider";

interface CitiesVisitedManagerProps {
  cities: City[];
}

export default function CitiesVisitedManager({ cities: initialCities }: CitiesVisitedManagerProps) {
  const { t } = useTranslation();
  const [cities, setCities] = useState<City[]>(initialCities || []);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [cityToDelete, setCityToDelete] = useState<City | null>(null);

  const handleAdd = async () => {
    if (!selectedCity) {
      alert(t('profile.pleaseSelectCity'));
      return;
    }

    // Check if city already exists
    const cityId = selectedCity._id || (selectedCity as any).id;
    if (cities.some(c => (c._id || (c as any).id) === cityId)) {
      alert(t('profile.cityAlreadyAdded'));
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/user/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          citiesVisited: [...cities.map(c => c._id || (c as any).id), cityId],
        }),
      });

      if (response.ok) {
        setCities([...cities, selectedCity]);
        setSelectedCity(null);
        setIsAdding(false);
        window.location.reload(); // Reload to get populated city data
      } else {
        alert(t('profile.failedToAddCity'));
      }
    } catch (error) {
      console.error("Error adding city:", error);
      alert(t('profile.failedToAddCity'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (city: City) => {
    setCityToDelete(city);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!cityToDelete) return;

    setIsSaving(true);
    try {
      const cityId = cityToDelete._id || (cityToDelete as any).id;
      const updatedCities = cities.filter(c => (c._id || (c as any).id) !== cityId);
      
      const response = await fetch("/api/user/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          citiesVisited: updatedCities.map(c => c._id || (c as any).id),
        }),
      });

      if (response.ok) {
        setCities(updatedCities);
        setShowDeleteConfirm(false);
        setCityToDelete(null);
      } else {
        alert(t('profile.failedToRemoveCity'));
      }
    } catch (error) {
      console.error("Error removing city:", error);
      alert(t('profile.failedToRemoveCity'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-base-content/60">
            {t('profile.citiesDancedIn')}
          </div>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="btn btn-primary btn-xs gap-1"
              disabled={isSaving}
            >
              <FaPlus className="text-xs" /> {t('profile.addCity')}
            </button>
          )}
        </div>

        {cities.length === 0 && !isAdding ? (
          <div className="text-center py-6 text-base-content/60 text-sm">
            <p>{t('profile.noCitiesAdded')}</p>
            <p className="text-xs mt-1">{t('profile.shareYourJourney')}</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {cities.map((city: any, index: number) => (
              <div
                key={index}
                className="relative"
              >
                <Link
                  href={`/city/${city._id || city.id || city}`}
                  className="block"
                >
                  <div className="flex items-center gap-2 bg-base-300 rounded-md h-10 hover:bg-base-200 transition-colors cursor-pointer pr-8">
                    {city.image ? (
                      <img
                        src={city.image}
                        alt={city.name}
                        className="h-full aspect-square rounded object-cover"
                      />
                    ) : (
                      <div className="h-full aspect-square rounded bg-primary/20 flex items-center justify-center">
                        <span className="text-xs">🌆</span>
                      </div>
                    )}
                    <span className="text-sm font-medium pr-1">
                      {city.name}
                    </span>
                  </div>
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleDeleteClick(city);
                  }}
                  className="absolute top-0.5 right-0.5 btn btn-ghost btn-xs btn-circle bg-error/80 hover:bg-error text-white"
                  disabled={isSaving}
                  title={t('profile.removeCity')}
                >
                  <FaTimes className="text-[10px]" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add City Modal */}
      {isAdding && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => !isSaving && setIsAdding(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-base-100 rounded-2xl shadow-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">{t('profile.addCity')}</h3>
                  <button
                    onClick={() => setIsAdding(false)}
                    className="btn btn-ghost btn-sm btn-circle"
                    disabled={isSaving}
                  >
                    <FaTimes />
                  </button>
                </div>

                <div className="mb-6">
                  <CitySelector
                    selectedCities={selectedCity ? [selectedCity] : []}
                    onCitiesChange={(cities) => {
                      // Only take the most recent selection (last city in array)
                      const newCity = cities[cities.length - 1] || null;
                      setSelectedCity(newCity);
                    }}
                    placeholder={t('profile.searchCityPlaceholder')}
                    label={t('profile.selectCity')}
                  />
                  {selectedCity && (
                    <p className="text-xs text-base-content/60 mt-2">
                      {t('profile.selected')}: <strong>{selectedCity.name}</strong>
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleAdd}
                    className="btn btn-primary flex-1"
                    disabled={isSaving || !selectedCity}
                  >
                    {isSaving ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        {t('profile.adding')}
                      </>
                    ) : (
                      t('profile.addCity')
                    )}
                  </button>
                  <button
                    onClick={() => setIsAdding(false)}
                    className="btn btn-ghost"
                    disabled={isSaving}
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && cityToDelete && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => !isSaving && setShowDeleteConfirm(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-base-100 rounded-2xl shadow-2xl max-w-sm w-full">
              <div className="p-6">
                <h3 className="text-xl font-bold mb-4">{t('profile.removeCityConfirm')}</h3>
                <p className="text-base-content/70 mb-6">
                  {t('profile.removeCityQuestion')} <strong>{cityToDelete.name}</strong> {t('profile.fromVisitedCities')}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteConfirm}
                    className="btn btn-error flex-1"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        {t('profile.removing')}
                      </>
                    ) : (
                      t('profile.yesRemove')
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setCityToDelete(null);
                    }}
                    className="btn btn-ghost"
                    disabled={isSaving}
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}


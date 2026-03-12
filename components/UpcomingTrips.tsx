"use client";

import { useState, useEffect } from "react";
import { FaPlus, FaTrash, FaPlane, FaMapMarkerAlt, FaCalendar } from "react-icons/fa";
import { Link } from "@/navigation";
import { useTranslation } from "@/components/I18nProvider";
import Flag from "./Flag";
import CityDropdown from "./CityDropdown";

interface Trip {
  _id: string;
  city: {
    _id: string;
    name: string;
    country: {
      name: string;
      code: string;
    };
    image?: string;
  };
  startDate: string;
  endDate: string;
}

interface UpcomingTripsProps {
  editable?: boolean;
}

export default function UpcomingTrips({ editable = false }: UpcomingTripsProps) {
  const { t } = useTranslation();
  const [trips, setTrips] = useState<{ upcoming: Trip[]; past: Trip[] }>({ upcoming: [], past: [] });
  const [isAdding, setIsAdding] = useState(false);
  const [selectedCity, setSelectedCity] = useState<any>(null);
  const [citySearch, setCitySearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const res = await fetch("/api/user/trips");
      if (res.ok) {
        const data = await res.json();
        setTrips(data);
      }
    } catch (error) {
      console.error("Error fetching trips:", error);
    }
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
        await fetchTrips();
        setIsAdding(false);
        setSelectedCity(null);
        setStartDate("");
        setEndDate("");
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

  const handleDeleteTrip = async (tripId: string) => {
    if (!confirm("Delete this trip?")) return;

    try {
      const res = await fetch(`/api/user/trips?tripId=${tripId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchTrips();
      }
    } catch (error) {
      console.error("Error deleting trip:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (!editable && trips.upcoming.length === 0) {
    return null; // Don't show section if no trips and not editable
  }

  return (
    <div className="space-y-6">
      {/* Upcoming Trips */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <FaPlane className="text-primary" />
            {t('trips.upcomingTrips')}
          </h3>
          {editable && (
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="btn btn-sm btn-primary gap-2"
            >
              <FaPlus />
              {t('trips.addTrip')}
            </button>
          )}
        </div>

        {/* Add Trip Form */}
        {isAdding && (
          <div className="card bg-base-200 p-4 mb-4">
            <div className="space-y-4">
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

              <div className="flex gap-2">
                <button
                  onClick={handleAddTrip}
                  disabled={isLoading}
                  className="btn btn-primary"
                >
                  {isLoading ? t('common.adding') : t('trips.addTrip')}
                </button>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setError("");
                  }}
                  className="btn btn-ghost"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Trips List */}
        {trips.upcoming.length > 0 ? (
          <div className="space-y-3">
            {trips.upcoming.map((trip) => (
              <div
                key={trip._id}
                className="card bg-base-200 hover:bg-base-300 transition-colors overflow-hidden"
              >
                <div className="flex items-stretch">
                  <Link href={`/city/${trip.city._id}`} className="flex items-stretch flex-1 cursor-pointer">
                    {/* City Image or Flag - Full bleed on left */}
                    <div className="w-24 h-24 flex-shrink-0 relative">
                      {trip.city.image ? (
                        <img
                          src={trip.city.image}
                          alt={trip.city.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-base-300">
                          <div className="text-5xl">
                            <Flag countryCode={trip.city.country.code} size="lg" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Text Content with Padding */}
                    <div className="flex-1 p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold flex items-center gap-2">
                          <FaMapMarkerAlt className="text-primary text-sm" />
                          {trip.city.name}, {trip.city.country.name}
                        </h4>
                        <p className="text-sm text-base-content/70 flex items-center gap-2 mt-1">
                          <FaCalendar className="text-xs" />
                          {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                        </p>
                      </div>
                    </div>
                  </Link>
                  {editable && (
                    <div className="flex items-center pr-4">
                      <button
                        onClick={() => handleDeleteTrip(trip._id)}
                        className="btn btn-ghost btn-sm btn-circle text-error"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-base-content/60 py-8">
            {editable ? t('trips.noTripsYet') : t('trips.noTrips')}
          </div>
        )}
      </div>

      {/* Past Trips (if any) */}
      {trips.past.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-base-content/70">
            Past Trips
          </h3>
          <div className="space-y-2">
            {trips.past.slice(0, 5).map((trip) => (
              <Link 
                key={trip._id} 
                href={`/city/${trip.city._id}`}
                className="flex items-center gap-3 text-sm opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Flag countryCode={trip.city.country.code} size="sm" />
                <span>
                  {trip.city.name} • {formatDate(trip.endDate)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


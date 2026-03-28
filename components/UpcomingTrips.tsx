"use client";

import { useState, useEffect } from "react";
import { FaPlus, FaTrash, FaPlane, FaMapMarkerAlt, FaCalendar } from "react-icons/fa";
import { Link } from "@/navigation";
import { useTranslation } from "@/components/I18nProvider";
import Flag from "./Flag";
import AddTripModal from "./AddTripModal";

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
  const [showModal, setShowModal] = useState(false);

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
              onClick={() => setShowModal(true)}
              className="btn btn-sm btn-primary gap-2"
            >
              <FaPlus />
              {t('trips.addTrip')}
            </button>
          )}
        </div>

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

      {/* Add Trip Modal */}
      <AddTripModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onTripAdded={fetchTrips}
      />
    </div>
  );
}

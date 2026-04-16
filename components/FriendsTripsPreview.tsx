"use client";

import { useState } from "react";
import { Link } from "@/navigation";
import { FaPlane, FaCalendar, FaMapMarkerAlt, FaPlus } from "react-icons/fa";
import { useTranslation } from "./I18nProvider";
import AddTripModal from "./AddTripModal";

interface FriendTrip {
  _id: string;
  city: {
    _id: string;
    name: string;
    image?: string;
    country: {
      name: string;
      code: string;
    };
  };
  startDate: Date;
  endDate: Date;
  friend: {
    _id: string;
    name: string;
    username: string;
    image?: string;
  };
}

interface FriendsTripsPreviewProps {
  trips: FriendTrip[];
}

export default function FriendsTripsPreview({ trips = [] }: FriendsTripsPreviewProps) {
  const { t } = useTranslation();
  const [showTripModal, setShowTripModal] = useState(false);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatDistanceToNow = (date: Date) => {
    const now = new Date();
    const diff = new Date(date).getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return "started";
    if (days === 0) return "today";
    if (days === 1) return "in 1 day";
    if (days < 7) return `in ${days} days`;
    if (days < 30) {
      const weeks = Math.floor(days / 7);
      return `in ${weeks} ${weeks === 1 ? "week" : "weeks"}`;
    }
    const months = Math.floor(days / 30);
    return `in ${months} ${months === 1 ? "month" : "months"}`;
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="max-w-3xl font-extrabold text-xl md:text-2xl tracking-tight flex items-center gap-2">
          <FaPlane className="text-primary" />
          {t('dashboard.friendActivity')}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTripModal(true)}
            className="btn btn-primary btn-sm gap-2"
          >
            <FaPlus /> {t('trips.addTrip')}
          </button>
          <Link href="/friends/trips" className="btn btn-outline btn-sm">
            {t('common.viewAll')}
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        {trips.map((trip) => (
          <div
            key={trip._id}
            className="hover:bg-base-200 rounded-lg p-3 transition-colors"
          >
            <div className="flex items-start gap-3">
              {/* Friend Avatar */}
              <Link
                href={`/${trip.friend.username || `dancer/${trip.friend._id}`}`}
                className="avatar flex-shrink-0"
              >
                <div className="w-10 h-10 rounded-full">
                  {trip.friend.image ? (
                    <img
                      src={trip.friend.image}
                      alt={trip.friend.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="bg-primary text-primary-content rounded-full w-full h-full flex items-center justify-center">
                      <span className="text-sm">
                        {trip.friend.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </Link>

              {/* Trip Info */}
              <Link
                href={`/city/${trip.city._id}`}
                className="flex-1 min-w-0 block"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm truncate">
                    {trip.friend.name}
                  </span>
                  <FaPlane className="text-xs text-primary" />
                  <span className="font-semibold text-sm truncate">
                    {trip.city.name}
                  </span>
                </div>
                
                <div className="flex items-center gap-3 text-xs text-base-content/60">
                  <span className="flex items-center gap-1">
                    <FaCalendar className="text-[10px]" />
                    {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <FaMapMarkerAlt className="text-[10px]" />
                    {trip.city.country.name}
                  </span>
                </div>

                <p className="text-xs text-primary mt-1">
                  {formatDistanceToNow(new Date(trip.startDate))}
                </p>
              </Link>
            </div>
          </div>
        ))}
      </div>

      <AddTripModal
        isOpen={showTripModal}
        onClose={() => setShowTripModal(false)}
      />
    </section>
  );
}


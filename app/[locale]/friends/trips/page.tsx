"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/navigation";
import { FaPlane, FaCalendar, FaMapMarkerAlt, FaArrowLeft } from "react-icons/fa";
import TripOverlaps from "@/components/TripOverlaps";

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
  dancer: {
    _id: string;
    name: string;
    username: string;
    image?: string;
  };
}

interface TripOverlap {
  _id: string;
  type: 'trip_overlap' | 'visiting_home';
  city: any;
  friend: any;
  yourTrip: any | null;
  friendTrip: any;
  overlap: any;
}

export default function FriendsTripsPage() {
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter');
  
  const [trips, setTrips] = useState<FriendTrip[]>([]);
  const [overlaps, setOverlaps] = useState<TripOverlap[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'overlaps'>(
    filterParam === 'overlaps' ? 'overlaps' : 'all'
  );

  useEffect(() => {
    if (activeFilter === 'overlaps') {
      fetchOverlaps();
    } else {
      fetchTrips();
      // Also fetch overlaps count for badge (without loading spinner)
      if (overlaps.length === 0) {
        fetchOverlaps(false);
      }
    }
  }, [activeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTrips = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/friends/trips");
      if (res.ok) {
        const data = await res.json();
        setTrips(data.trips);
      }
    } catch (error) {
      console.error("Error fetching friends' trips:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOverlaps = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const res = await fetch("/api/friends/overlaps");
      if (res.ok) {
        const data = await res.json();
        setOverlaps(data.overlaps || []);
      }
    } catch (error) {
      console.error("Error fetching overlaps:", error);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateRange = (start: Date, end: Date) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (startDate.getMonth() === endDate.getMonth()) {
      return `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endDate.getDate()}`;
    }
    
    return `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
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
    <div className="min-h-screen p-4 pt-8 bg-base-100">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="btn btn-ghost btn-sm gap-2 mb-4">
            <FaArrowLeft />
            Back to Dashboard
          </Link>
          
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
            {activeFilter === 'overlaps' ? '🎉 Meetup Opportunities' : "Friends' Upcoming Trips ✈️"}
          </h1>
          <p className="text-base-content/70">
            {activeFilter === 'overlaps' 
              ? 'You and your friends will be in the same city!'
              : 'See where your dance friends are traveling and plan to meet up!'}
          </p>

          {/* Filter Tabs */}
          <div className="tabs tabs-boxed mt-4 bg-base-200">
            <button
              className={`tab ${activeFilter === 'all' ? 'tab-active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All Trips
            </button>
            <button
              className={`tab ${activeFilter === 'overlaps' ? 'tab-active' : ''}`}
              onClick={() => setActiveFilter('overlaps')}
            >
              🎉 Meetup Opportunities
              {overlaps.length > 0 && activeFilter !== 'overlaps' && (
                <span className="badge badge-primary badge-sm ml-2">{overlaps.length}</span>
              )}
            </button>
          </div>
        </div>

        {/* Show Overlaps or Trips based on active filter */}
        {activeFilter === 'overlaps' ? (
          <>
            {isLoading && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-32 w-full"></div>
                ))}
              </div>
            )}
            {!isLoading && <TripOverlaps overlaps={overlaps} isPreview={false} />}
          </>
        ) : (
          <>
            {/* Loading State */}
            {isLoading && (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="skeleton h-32 w-full"></div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && trips.length === 0 && (
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body text-center py-16">
              <FaPlane className="mx-auto text-6xl mb-4 text-base-content/30" />
              <h2 className="text-2xl font-bold mb-2">No Upcoming Trips</h2>
              <p className="text-base-content/60 mb-6">
                Your friends haven&apos;t added any upcoming trips yet.
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/friends" className="btn btn-primary">
                  Connect with More Dancers
                </Link>
                <Link href="/connect" className="btn btn-outline">
                  Add Your Own Trip
                </Link>
              </div>
            </div>
          </div>
            )}

            {/* Trips List */}
            {!isLoading && trips.length > 0 && (
          <div className="space-y-4">
            {trips.map((trip) => (
              <div key={trip._id} className="card bg-base-200 shadow-lg hover:shadow-xl transition-shadow">
                <div className="card-body">
                  <div className="flex items-start gap-4">
                    {/* Friend Info */}
                    <Link href={`/dancer/${trip.dancer._id}`} className="flex-shrink-0">
                      <div className="avatar">
                        <div className="w-16 h-16 rounded-full">
                          {trip.dancer.image ? (
                            <img
                              src={trip.dancer.image}
                              alt={trip.dancer.name}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <div className="bg-primary text-primary-content rounded-full w-full h-full flex items-center justify-center">
                              <span className="text-xl font-bold">
                                {trip.dancer.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>

                    {/* Trip Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Link
                          href={`/dancer/${trip.dancer._id}`}
                          className="font-bold text-lg hover:text-primary transition-colors"
                        >
                          {trip.dancer.name}
                        </Link>
                        <span className="text-base-content/60">is traveling to</span>
                      </div>

                      <Link
                        href={`/city/${trip.city._id}`}
                        className="flex items-center gap-2 mb-3 group"
                      >
                        {trip.city.image && (
                          <div className="w-12 h-12 rounded-lg overflow-hidden">
                            <img
                              src={trip.city.image}
                              alt={trip.city.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-xl group-hover:text-primary transition-colors">
                            {trip.city.name}
                          </h3>
                          <p className="text-sm text-base-content/60">
                            {trip.city.country.name}
                          </p>
                        </div>
                      </Link>

                      {/* Dates */}
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2 text-base-content/70">
                          <FaCalendar className="text-primary" />
                          <span className="font-medium">{formatDateRange(trip.startDate, trip.endDate)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-primary">
                          <FaPlane />
                          <span className="font-medium">
                            {formatDistanceToNow(new Date(trip.startDate))}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-4">
                        <Link
                          href={`/city/${trip.city._id}`}
                          className="btn btn-primary btn-sm"
                        >
                          View City
                        </Link>
                        <Link
                          href={`/dancer/${trip.dancer._id}`}
                          className="btn btn-outline btn-sm"
                        >
                          View Profile
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}


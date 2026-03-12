"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Link, useRouter } from "@/navigation";
import { FaArrowLeft, FaCalendar, FaMapMarkerAlt } from "react-icons/fa";

interface DJEvent {
  _id: string;
  eventName: string;
  venue?: string;
  city: string;
  eventDate: string;
  description?: string;
  imageUrl?: string;
  averageRating: number;
  totalComments: number;
}

export default function DJEventsPage() {
  const params = useParams();
  const router = useRouter();
  const [events, setEvents] = useState<DJEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [djName, setDjName] = useState("");

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch(`/api/dj/events?djId=${params.djId}`);
      const data = await res.json();
      
      if (res.ok) {
        setEvents(data.events);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 pb-20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="btn btn-ghost btn-sm mb-4"
          >
            <FaArrowLeft /> Back
          </button>
          <h1 className="text-3xl font-bold">🎧 DJ Events</h1>
          <p className="text-base-content/70 mt-2">
            {events.length} {events.length === 1 ? "event" : "events"} played
          </p>
        </div>

        {/* Events List */}
        {events.length === 0 ? (
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body text-center">
              <p className="text-base-content/70">No events yet</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {events.map((event) => (
              <Link
                key={event._id}
                href={`/events/${event._id}`}
                className="card bg-base-200 hover:bg-base-300 transition-all shadow-lg"
              >
                <div className="card-body">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h2 className="card-title text-xl mb-2">
                        {event.eventName}
                      </h2>
                      <div className="space-y-1 text-sm text-base-content/70">
                        <p className="flex items-center gap-2">
                          <FaMapMarkerAlt className="flex-shrink-0" />
                          {event.venue && `${event.venue} • `}
                          {event.city}
                        </p>
                        <p className="flex items-center gap-2">
                          <FaCalendar className="flex-shrink-0" />
                          {new Date(event.eventDate).toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      {event.description && (
                        <p className="text-sm text-base-content/60 mt-3 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                      {event.totalComments > 0 && (
                        <div className="flex items-center gap-4 mt-3">
                          <div className="badge badge-primary gap-1">
                            ⭐ {event.averageRating.toFixed(1)}
                          </div>
                          <span className="text-sm text-base-content/60">
                            💬 {event.totalComments} {event.totalComments === 1 ? "review" : "reviews"}
                          </span>
                        </div>
                      )}
                    </div>
                    {event.imageUrl && (
                      <div className="w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={event.imageUrl}
                          alt={event.eventName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


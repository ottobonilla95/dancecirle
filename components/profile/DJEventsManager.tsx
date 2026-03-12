"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Link } from "@/navigation";
import { FaPlus, FaEdit, FaTrash, FaCalendar, FaMapMarkerAlt } from "react-icons/fa";
import { useTranslation } from "@/components/I18nProvider";

interface DJEvent {
  _id: string;
  eventName: string;
  venue?: string;
  city: string;
  eventDate: string;
  description?: string;
  imageUrl?: string;
  genres: string[];
  averageRating: number;
  totalComments: number;
}

export default function DJEventsManager() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [events, setEvents] = useState<DJEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<DJEvent | null>(null);
  const [formData, setFormData] = useState({
    eventName: "",
    venue: "",
    city: "",
    eventDate: "",
    description: "",
    imageUrl: "",
    genres: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    if (!session?.user?.id) return;
    
    try {
      const res = await fetch(`/api/dj/events?djId=${session.user.id}`);
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

  const handleOpenModal = (event?: DJEvent) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        eventName: event.eventName,
        venue: event.venue || "",
        city: event.city,
        eventDate: new Date(event.eventDate).toISOString().split("T")[0],
        description: event.description || "",
        imageUrl: event.imageUrl || "",
        genres: event.genres || [],
      });
    } else {
      setEditingEvent(null);
      setFormData({
        eventName: "",
        venue: "",
        city: "",
        eventDate: "",
        description: "",
        imageUrl: "",
        genres: [],
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingEvent
        ? `/api/dj/events/${editingEvent._id}`
        : "/api/dj/events";
      const method = editingEvent ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        await fetchEvents();
        handleCloseModal();
      } else {
        alert(data.error || "Failed to save event");
      }
    } catch (error) {
      console.error("Error saving event:", error);
      alert("Failed to save event");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const res = await fetch(`/api/dj/events/${eventId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchEvents();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete event");
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">My DJ Events</h3>
        <button
          onClick={() => handleOpenModal()}
          className="btn btn-primary btn-sm gap-2"
        >
          <FaPlus /> Add Event
        </button>
      </div>

      {/* Events List */}
      {events.length === 0 ? (
        <div className="card bg-base-200">
          <div className="card-body text-center py-8">
            <p className="text-base-content/60">No events yet</p>
            <p className="text-sm text-base-content/50">
              Add events you&apos;ve played to showcase your work
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event._id} className="card bg-base-200">
              <div className="card-body p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Link
                      href={`/events/${event._id}`}
                      className="font-semibold hover:text-primary transition-colors"
                    >
                      {event.eventName}
                    </Link>
                    <p className="text-sm text-base-content/70 flex items-center gap-2 mt-1">
                      <FaMapMarkerAlt className="flex-shrink-0" />
                      {event.venue && `${event.venue} • `}
                      {event.city}
                    </p>
                    <p className="text-sm text-base-content/60 flex items-center gap-2 mt-1">
                      <FaCalendar className="flex-shrink-0" />
                      {new Date(event.eventDate).toLocaleDateString()}
                    </p>
                    {event.totalComments > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="badge badge-sm badge-primary">
                          ⭐ {event.averageRating.toFixed(1)}
                        </span>
                        <span className="text-xs text-base-content/60">
                          {event.totalComments} {event.totalComments === 1 ? "review" : "reviews"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenModal(event)}
                      className="btn btn-sm btn-ghost"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(event._id)}
                      className="btn btn-sm btn-ghost text-error"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">
              {editingEvent ? t('profileSections.editDJEvent') : t('profileSections.addDJEvent')}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Event Name */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Event Name *</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={formData.eventName}
                  onChange={(e) =>
                    setFormData({ ...formData, eventName: e.target.value })
                  }
                  required
                  maxLength={100}
                />
              </div>

              {/* Venue */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Venue (optional)</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  placeholder="Club, venue, or location name"
                  value={formData.venue}
                  onChange={(e) =>
                    setFormData({ ...formData, venue: e.target.value })
                  }
                  maxLength={100}
                />
              </div>

              {/* City */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">City *</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  placeholder="e.g., Barcelona, New York, Tokyo"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  required
                  maxLength={100}
                />
              </div>

              {/* Date */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Event Date *</span>
                </label>
                <input
                  type="date"
                  className="input input-bordered"
                  value={formData.eventDate}
                  onChange={(e) =>
                    setFormData({ ...formData, eventDate: e.target.value })
                  }
                  required
                />
              </div>

              {/* Description */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Description (optional)</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-24"
                  placeholder="Tell people about this event..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  maxLength={500}
                />
              </div>

              {/* Image URL */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Image URL (optional)</span>
                </label>
                <input
                  type="url"
                  className="input input-bordered"
                  placeholder="https://example.com/event-photo.jpg"
                  value={formData.imageUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, imageUrl: e.target.value })
                  }
                />
              </div>

              {/* Actions */}
              <div className="modal-action">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn btn-ghost"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? t('common.saving') : t('profileSections.saveEvent')}
                </button>
              </div>
            </form>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={handleCloseModal}>close</button>
          </form>
        </dialog>
      )}
    </div>
  );
}


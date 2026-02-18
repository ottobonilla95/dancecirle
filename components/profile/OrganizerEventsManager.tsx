"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { upload } from "@imagekit/next";
import { FaCalendar, FaEdit, FaMapMarkerAlt, FaPlus, FaTrash, FaUpload } from "react-icons/fa";
import CityDropdown from "@/components/CityDropdown";
import { City } from "@/types";

interface EventCity {
  _id: string;
  name: string;
  country?: {
    name?: string;
    code?: string;
  };
}

interface OrganizerEvent {
  _id: string;
  title: string;
  venue?: string;
  startsAt: string;
  description?: string;
  flyerUrl?: string;
  priceAmount?: number;
  priceCurrency?: string;
  ticketUrl?: string;
  danceStyles: string[];
  city?: EventCity;
}

interface EventFormData {
  title: string;
  venue: string;
  startsAt: string;
  description: string;
  flyerUrl: string;
  priceAmount: string;
  priceCurrency: string;
  ticketUrl: string;
  danceStylesText: string;
}

function toDateTimeLocalInput(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

function formatEventDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function parseDanceStyles(text: string): string[] {
  return text
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 10);
}

const EMPTY_FORM: EventFormData = {
  title: "",
  venue: "",
  startsAt: "",
  description: "",
  flyerUrl: "",
  priceAmount: "",
  priceCurrency: "USD",
  ticketUrl: "",
  danceStylesText: "",
};

export default function OrganizerEventsManager() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<OrganizerEvent | null>(null);
  const [formData, setFormData] = useState<EventFormData>(EMPTY_FORM);
  const [selectedCity, setSelectedCity] = useState<{
    id: string;
    name: string;
    countryName?: string;
  } | null>(null);
  const [citySearchTerm, setCitySearchTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFlyer, setUploadingFlyer] = useState(false);

  const sortedEvents = useMemo(
    () =>
      [...events].sort(
        (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
      ),
    [events]
  );

  useEffect(() => {
    fetchEvents();
  }, [session?.user?.id]);

  const fetchEvents = async () => {
    if (!session?.user?.id) return;

    try {
      const res = await fetch(
        `/api/organizer-events?organizerId=${session.user.id}&limit=50`
      );
      const data = await res.json();

      if (res.ok) {
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error("Error fetching organizer events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (event?: OrganizerEvent) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        title: event.title || "",
        venue: event.venue || "",
        startsAt: toDateTimeLocalInput(event.startsAt),
        description: event.description || "",
        flyerUrl: event.flyerUrl || "",
        priceAmount:
          typeof event.priceAmount === "number" ? String(event.priceAmount) : "",
        priceCurrency: event.priceCurrency || "USD",
        ticketUrl: event.ticketUrl || "",
        danceStylesText: (event.danceStyles || []).join(", "),
      });
      if (event.city?._id) {
        setSelectedCity({
          id: event.city._id,
          name: event.city.name,
          countryName: event.city.country?.name || "",
        });
        setCitySearchTerm(event.city.name);
      } else {
        setSelectedCity(null);
        setCitySearchTerm("");
      }
    } else {
      setEditingEvent(null);
      setFormData(EMPTY_FORM);
      setSelectedCity(null);
      setCitySearchTerm("");
    }

    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (submitting || uploadingFlyer) return;
    setIsModalOpen(false);
    setEditingEvent(null);
  };

  const handleCitySelect = (city: City) => {
    const cityId = city._id || city.id;
    if (!cityId) return;

    setSelectedCity({
      id: cityId,
      name: city.name,
      countryName: city.country?.name || "",
    });
    setCitySearchTerm(city.name);
  };

  const handleFlyerUpload = async (file: File) => {
    setUploadingFlyer(true);

    try {
      const authResponse = await fetch("/api/imagekit-auth");
      if (!authResponse.ok) {
        throw new Error("Failed to authenticate upload");
      }

      const { token, signature, expire, publicKey } = await authResponse.json();

      const extension = file.name.split(".").pop() || "jpg";
      const fileName = `event-flyer-${Date.now()}.${extension}`;

      const uploadResponse = await upload({
        file,
        fileName,
        token,
        signature,
        expire,
        publicKey,
        folder: "/dancecircle/event-flyers",
        useUniqueFileName: false,
        transformation: {
          pre: "w-1200,h-1200,c-at_max",
        },
      });

      setFormData((prev) => ({
        ...prev,
        flyerUrl: uploadResponse.url,
      }));
    } catch (error) {
      console.error("Error uploading flyer:", error);
      alert("Failed to upload flyer. Please try again.");
    } finally {
      setUploadingFlyer(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedCity?.id) {
      alert("Please select a city");
      return;
    }

    if (!formData.startsAt) {
      alert("Please select a date and time");
      return;
    }

    const priceAmount =
      formData.priceAmount.trim() === ""
        ? null
        : Number(formData.priceAmount.trim());

    if (priceAmount !== null && (!Number.isFinite(priceAmount) || priceAmount < 0)) {
      alert("Price must be a number greater than or equal to 0");
      return;
    }

    setSubmitting(true);

    try {
      const url = editingEvent
        ? `/api/organizer-events/${editingEvent._id}`
        : "/api/organizer-events";
      const method = editingEvent ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          venue: formData.venue,
          cityId: selectedCity.id,
          startsAt: formData.startsAt,
          description: formData.description,
          flyerUrl: formData.flyerUrl,
          priceAmount,
          priceCurrency: formData.priceCurrency.trim().toUpperCase() || "USD",
          ticketUrl: formData.ticketUrl,
          danceStyles: parseDanceStyles(formData.danceStylesText),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        await fetchEvents();
        handleCloseModal();
      } else {
        alert(data.error || "Failed to save event");
      }
    } catch (error) {
      console.error("Error saving organizer event:", error);
      alert("Failed to save event");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const res = await fetch(`/api/organizer-events/${eventId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchEvents();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete event");
      }
    } catch (error) {
      console.error("Error deleting organizer event:", error);
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
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">My Organizer Events</h3>
        <button
          onClick={() => handleOpenModal()}
          className="btn btn-primary btn-sm gap-2"
        >
          <FaPlus /> Add Event
        </button>
      </div>

      {sortedEvents.length === 0 ? (
        <div className="card bg-base-200">
          <div className="card-body text-center py-8">
            <p className="text-base-content/60">No organizer events yet</p>
            <p className="text-sm text-base-content/50">
              Publish your socials, workshops, and parties so dancers can find them
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedEvents.map((event) => (
            <div key={event._id} className="card bg-base-200">
              <div className="card-body p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Link
                      href={`/organizer-events/${event._id}`}
                      className="font-semibold hover:text-primary transition-colors"
                    >
                      {event.title}
                    </Link>
                    <p className="text-sm text-base-content/70 flex items-center gap-2 mt-1">
                      <FaMapMarkerAlt className="flex-shrink-0" />
                      {event.venue ? `${event.venue} • ` : ""}
                      {event.city?.name || "Unknown city"}
                    </p>
                    <p className="text-sm text-base-content/60 flex items-center gap-2 mt-1">
                      <FaCalendar className="flex-shrink-0" />
                      {formatEventDate(event.startsAt)}
                    </p>
                    {typeof event.priceAmount === "number" && (
                      <p className="text-xs text-base-content/70 mt-2">
                        {event.priceCurrency || "USD"} {event.priceAmount.toFixed(2)}
                      </p>
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

      {isModalOpen && (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">
              {editingEvent ? "Edit Organizer Event" : "Add Organizer Event"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Event Title *</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  required
                  maxLength={120}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">City *</span>
                </label>
                <CityDropdown
                  searchTerm={citySearchTerm}
                  onSearchChange={setCitySearchTerm}
                  onCitySelect={handleCitySelect}
                  placeholder="Search city..."
                  selectedCities={
                    selectedCity
                      ? [
                          {
                            id: selectedCity.id,
                            _id: selectedCity.id,
                            name: selectedCity.name,
                            country: {
                              name: selectedCity.countryName || "",
                              code: "",
                            },
                            continent: {
                              name: "",
                            },
                            totalDancers: 0,
                            rank: 0,
                          },
                        ]
                      : []
                  }
                />
                {selectedCity && (
                  <p className="text-xs text-base-content/60 mt-1">
                    Selected: {selectedCity.name}
                    {selectedCity.countryName ? `, ${selectedCity.countryName}` : ""}
                  </p>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Venue (optional)</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  placeholder="Club, studio, rooftop..."
                  value={formData.venue}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, venue: e.target.value }))
                  }
                  maxLength={160}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Date & Time *</span>
                </label>
                <input
                  type="datetime-local"
                  className="input input-bordered"
                  value={formData.startsAt}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, startsAt: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Description (optional)</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-28"
                  placeholder="Tell dancers what to expect..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  maxLength={2000}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Flyer</span>
                </label>
                <div className="flex flex-col gap-3">
                  <label className="btn btn-outline w-fit cursor-pointer gap-2">
                    <FaUpload />
                    {uploadingFlyer ? "Uploading..." : "Upload Flyer"}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          void handleFlyerUpload(file);
                        }
                      }}
                      disabled={uploadingFlyer}
                    />
                  </label>

                  <input
                    type="url"
                    className="input input-bordered"
                    placeholder="Or paste flyer URL"
                    value={formData.flyerUrl}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, flyerUrl: e.target.value }))
                    }
                  />

                  {formData.flyerUrl && (
                    <div className="w-full max-w-sm rounded-lg overflow-hidden border border-base-300">
                      <img
                        src={formData.flyerUrl}
                        alt="Event flyer preview"
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Price (optional)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input input-bordered"
                    placeholder="0.00"
                    value={formData.priceAmount}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, priceAmount: e.target.value }))
                    }
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Currency</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered uppercase"
                    maxLength={3}
                    placeholder="USD"
                    value={formData.priceCurrency}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        priceCurrency: e.target.value.toUpperCase(),
                      }))
                    }
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Ticket Link (optional)</span>
                </label>
                <input
                  type="url"
                  className="input input-bordered"
                  placeholder="https://..."
                  value={formData.ticketUrl}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, ticketUrl: e.target.value }))
                  }
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">
                    Dance Styles / Tags (optional)
                  </span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  placeholder="Bachata, Salsa, Kizomba"
                  value={formData.danceStylesText}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      danceStylesText: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn btn-ghost"
                  disabled={submitting || uploadingFlyer}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || uploadingFlyer}
                >
                  {submitting ? "Saving..." : "Save Event"}
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

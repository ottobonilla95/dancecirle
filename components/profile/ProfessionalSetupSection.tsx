"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ProfessionalSetupSectionProps {
  initialIsTeacher?: boolean;
  initialIsDJ?: boolean;
  initialIsPhotographer?: boolean;
  initialIsEventOrganizer?: boolean;
  initialIsProducer?: boolean;
  initialTeacherProfile?: {
    bio?: string;
    yearsOfExperience?: number;
  };
  initialDjProfile?: {
    djName?: string;
    genres?: string;
    bio?: string;
  };
  initialPhotographerProfile?: {
    portfolioLink?: string;
    specialties?: string;
    bio?: string;
  };
  initialEventOrganizerProfile?: {
    organizationName?: string;
    eventTypes?: string;
    bio?: string;
  };
  initialProducerProfile?: {
    producerName?: string;
    genres?: string;
    bio?: string;
  };
  initialProfessionalContact?: {
    whatsapp?: string;
    email?: string;
  };
}

export default function ProfessionalSetupSection({
  initialIsTeacher = false,
  initialIsDJ = false,
  initialIsPhotographer = false,
  initialIsEventOrganizer = false,
  initialIsProducer = false,
  initialTeacherProfile,
  initialDjProfile,
  initialPhotographerProfile,
  initialEventOrganizerProfile,
  initialProducerProfile,
  initialProfessionalContact,
}: ProfessionalSetupSectionProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [isTeacher, setIsTeacher] = useState(initialIsTeacher);
  const [isDJ, setIsDJ] = useState(initialIsDJ);
  const [isPhotographer, setIsPhotographer] = useState(initialIsPhotographer);
  const [isEventOrganizer, setIsEventOrganizer] = useState(initialIsEventOrganizer);
  const [isProducer, setIsProducer] = useState(initialIsProducer);

  const [teacherBio, setTeacherBio] = useState(initialTeacherProfile?.bio || "");
  const [yearsOfExperience, setYearsOfExperience] = useState(
    initialTeacherProfile?.yearsOfExperience
      ? String(initialTeacherProfile.yearsOfExperience)
      : ""
  );

  const [djName, setDjName] = useState(initialDjProfile?.djName || "");
  const [djGenres, setDjGenres] = useState(initialDjProfile?.genres || "");
  const [djBio, setDjBio] = useState(initialDjProfile?.bio || "");

  const [photographerPortfolio, setPhotographerPortfolio] = useState(
    initialPhotographerProfile?.portfolioLink || ""
  );
  const [photographerSpecialties, setPhotographerSpecialties] = useState(
    initialPhotographerProfile?.specialties || ""
  );
  const [photographerBio, setPhotographerBio] = useState(
    initialPhotographerProfile?.bio || ""
  );

  const [eventOrganizerName, setEventOrganizerName] = useState(
    initialEventOrganizerProfile?.organizationName || ""
  );
  const [eventTypes, setEventTypes] = useState(
    initialEventOrganizerProfile?.eventTypes || ""
  );
  const [eventOrganizerBio, setEventOrganizerBio] = useState(
    initialEventOrganizerProfile?.bio || ""
  );

  const [producerName, setProducerName] = useState(
    initialProducerProfile?.producerName || ""
  );
  const [producerGenres, setProducerGenres] = useState(
    initialProducerProfile?.genres || ""
  );
  const [producerBio, setProducerBio] = useState(initialProducerProfile?.bio || "");

  const [whatsapp, setWhatsapp] = useState(
    initialProfessionalContact?.whatsapp || ""
  );
  const [email, setEmail] = useState(initialProfessionalContact?.email || "");

  const hasAnyRole =
    isTeacher || isDJ || isPhotographer || isEventOrganizer || isProducer;

  const resetForm = () => {
    setIsTeacher(initialIsTeacher);
    setIsDJ(initialIsDJ);
    setIsPhotographer(initialIsPhotographer);
    setIsEventOrganizer(initialIsEventOrganizer);
    setIsProducer(initialIsProducer);

    setTeacherBio(initialTeacherProfile?.bio || "");
    setYearsOfExperience(
      initialTeacherProfile?.yearsOfExperience
        ? String(initialTeacherProfile.yearsOfExperience)
        : ""
    );

    setDjName(initialDjProfile?.djName || "");
    setDjGenres(initialDjProfile?.genres || "");
    setDjBio(initialDjProfile?.bio || "");

    setPhotographerPortfolio(initialPhotographerProfile?.portfolioLink || "");
    setPhotographerSpecialties(initialPhotographerProfile?.specialties || "");
    setPhotographerBio(initialPhotographerProfile?.bio || "");

    setEventOrganizerName(initialEventOrganizerProfile?.organizationName || "");
    setEventTypes(initialEventOrganizerProfile?.eventTypes || "");
    setEventOrganizerBio(initialEventOrganizerProfile?.bio || "");

    setProducerName(initialProducerProfile?.producerName || "");
    setProducerGenres(initialProducerProfile?.genres || "");
    setProducerBio(initialProducerProfile?.bio || "");

    setWhatsapp(initialProfessionalContact?.whatsapp || "");
    setEmail(initialProfessionalContact?.email || "");
  };

  const handleCancel = () => {
    resetForm();
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (hasAnyRole && !whatsapp.trim() && !email.trim()) {
      alert("Please add at least one professional contact (WhatsApp or email)");
      return;
    }

    setSaving(true);
    try {
      const parsedYears = yearsOfExperience ? parseInt(yearsOfExperience, 10) : undefined;

      const payload: any = {
        isTeacher,
        isDJ,
        isPhotographer,
        isEventOrganizer,
        isProducer,
        teacherProfile: isTeacher
          ? {
              bio: teacherBio,
              yearsOfExperience:
                typeof parsedYears === "number" && !Number.isNaN(parsedYears)
                  ? parsedYears
                  : undefined,
            }
          : {},
        djProfile: isDJ
          ? {
              djName,
              genres: djGenres,
              bio: djBio,
            }
          : {},
        photographerProfile: isPhotographer
          ? {
              portfolioLink: photographerPortfolio,
              specialties: photographerSpecialties,
              bio: photographerBio,
            }
          : {},
        eventOrganizerProfile: isEventOrganizer
          ? {
              organizationName: eventOrganizerName,
              eventTypes,
              bio: eventOrganizerBio,
            }
          : {},
        producerProfile: isProducer
          ? {
              producerName,
              genres: producerGenres,
              bio: producerBio,
            }
          : {},
      };

      if (hasAnyRole) {
        payload.professionalContact = {
          whatsapp: whatsapp.trim(),
          email: email.trim(),
        };
      }

      const response = await fetch("/api/user/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to update professional setup");
      }

      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error("Error updating professional setup:", error);
      alert("Failed to update professional setup");
    } finally {
      setSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="text-sm font-medium text-base-content/60">
          Professional Roles and Contact
        </div>

        <div className="space-y-2">
          <label className="label cursor-pointer justify-start gap-3">
            <input
              type="checkbox"
              className="checkbox checkbox-sm"
              checked={isTeacher}
              onChange={(e) => setIsTeacher(e.target.checked)}
            />
            <span className="label-text">Teacher</span>
          </label>
          {isTeacher && (
            <div className="pl-7 space-y-2">
              <label className="text-xs text-base-content/70 block">
                Years of experience (optional)
              </label>
              <input
                type="number"
                className="input input-bordered input-sm w-full"
                min="0"
                max="60"
                placeholder="Years of experience"
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(e.target.value)}
              />
              <label className="text-xs text-base-content/70 block">
                Teaching bio (optional)
              </label>
              <textarea
                className="textarea textarea-bordered w-full"
                placeholder="Teaching bio"
                value={teacherBio}
                onChange={(e) => setTeacherBio(e.target.value)}
              />
            </div>
          )}

          <label className="label cursor-pointer justify-start gap-3">
            <input
              type="checkbox"
              className="checkbox checkbox-sm"
              checked={isDJ}
              onChange={(e) => setIsDJ(e.target.checked)}
            />
            <span className="label-text">DJ</span>
          </label>
          {isDJ && (
            <div className="pl-7 space-y-2">
              <label className="text-xs text-base-content/70 block">
                DJ name (optional)
              </label>
              <input
                className="input input-bordered input-sm w-full"
                placeholder="DJ name"
                value={djName}
                onChange={(e) => setDjName(e.target.value)}
              />
              <label className="text-xs text-base-content/70 block">
                Genres (optional)
              </label>
              <input
                className="input input-bordered input-sm w-full"
                placeholder="Genres"
                value={djGenres}
                onChange={(e) => setDjGenres(e.target.value)}
              />
              <label className="text-xs text-base-content/70 block">
                DJ bio (optional)
              </label>
              <textarea
                className="textarea textarea-bordered w-full"
                placeholder="DJ bio"
                value={djBio}
                onChange={(e) => setDjBio(e.target.value)}
              />
            </div>
          )}

          <label className="label cursor-pointer justify-start gap-3">
            <input
              type="checkbox"
              className="checkbox checkbox-sm"
              checked={isPhotographer}
              onChange={(e) => setIsPhotographer(e.target.checked)}
            />
            <span className="label-text">Photographer</span>
          </label>
          {isPhotographer && (
            <div className="pl-7 space-y-2">
              <label className="text-xs text-base-content/70 block">
                Portfolio link (optional)
              </label>
              <input
                className="input input-bordered input-sm w-full"
                placeholder="Portfolio link"
                value={photographerPortfolio}
                onChange={(e) => setPhotographerPortfolio(e.target.value)}
              />
              <label className="text-xs text-base-content/70 block">
                Specialties (optional)
              </label>
              <input
                className="input input-bordered input-sm w-full"
                placeholder="Specialties"
                value={photographerSpecialties}
                onChange={(e) => setPhotographerSpecialties(e.target.value)}
              />
              <label className="text-xs text-base-content/70 block">
                Bio (optional)
              </label>
              <textarea
                className="textarea textarea-bordered w-full"
                placeholder="Bio"
                value={photographerBio}
                onChange={(e) => setPhotographerBio(e.target.value)}
              />
            </div>
          )}

          <label className="label cursor-pointer justify-start gap-3">
            <input
              type="checkbox"
              className="checkbox checkbox-sm"
              checked={isEventOrganizer}
              onChange={(e) => setIsEventOrganizer(e.target.checked)}
            />
            <span className="label-text">Event Organizer</span>
          </label>
          {isEventOrganizer && (
            <div className="pl-7 space-y-2">
              <label className="text-xs text-base-content/70 block">
                Organization name (optional)
              </label>
              <input
                className="input input-bordered input-sm w-full"
                placeholder="Organization name"
                value={eventOrganizerName}
                onChange={(e) => setEventOrganizerName(e.target.value)}
              />
              <label className="text-xs text-base-content/70 block">
                Event types (optional)
              </label>
              <input
                className="input input-bordered input-sm w-full"
                placeholder="Event types"
                value={eventTypes}
                onChange={(e) => setEventTypes(e.target.value)}
              />
              <label className="text-xs text-base-content/70 block">
                Bio (optional)
              </label>
              <textarea
                className="textarea textarea-bordered w-full"
                placeholder="Bio"
                value={eventOrganizerBio}
                onChange={(e) => setEventOrganizerBio(e.target.value)}
              />
            </div>
          )}

          <label className="label cursor-pointer justify-start gap-3">
            <input
              type="checkbox"
              className="checkbox checkbox-sm"
              checked={isProducer}
              onChange={(e) => setIsProducer(e.target.checked)}
            />
            <span className="label-text">Producer</span>
          </label>
          {isProducer && (
            <div className="pl-7 space-y-2">
              <label className="text-xs text-base-content/70 block">
                Producer name (optional)
              </label>
              <input
                className="input input-bordered input-sm w-full"
                placeholder="Producer name"
                value={producerName}
                onChange={(e) => setProducerName(e.target.value)}
              />
              <label className="text-xs text-base-content/70 block">
                Genres (optional)
              </label>
              <input
                className="input input-bordered input-sm w-full"
                placeholder="Genres"
                value={producerGenres}
                onChange={(e) => setProducerGenres(e.target.value)}
              />
              <label className="text-xs text-base-content/70 block">
                Bio (optional)
              </label>
              <textarea
                className="textarea textarea-bordered w-full"
                placeholder="Bio"
                value={producerBio}
                onChange={(e) => setProducerBio(e.target.value)}
              />
            </div>
          )}
        </div>

        {hasAnyRole && (
          <div className="space-y-2 pt-2 border-t border-base-300">
            <div className="text-sm font-medium text-base-content/60">
              Professional Contact
            </div>
            <div className="text-xs text-base-content/70">
              At least one contact is required when any role is selected
            </div>
            <label className="text-xs text-base-content/70 block">
              WhatsApp number (optional)
            </label>
            <input
              type="tel"
              className="input input-bordered input-sm w-full"
              placeholder="WhatsApp number"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
            <label className="text-xs text-base-content/70 block">
              Professional email (optional)
            </label>
            <input
              type="email"
              className="input input-bordered input-sm w-full"
              placeholder="Professional email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        )}

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

  const activeRoles = [
    isTeacher ? "Teacher" : "",
    isDJ ? "DJ" : "",
    isPhotographer ? "Photographer" : "",
    isEventOrganizer ? "Event Organizer" : "",
    isProducer ? "Producer" : "",
  ].filter(Boolean);

  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-medium text-base-content/60">
            Professional Setup
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {activeRoles.length > 0 ? (
              activeRoles.map((role) => (
                <span key={role} className="badge badge-outline badge-sm">
                  {role}
                </span>
              ))
            ) : (
              <span className="text-sm text-base-content/70">No roles selected</span>
            )}
          </div>
          {activeRoles.length > 0 && (
            <div className="text-xs text-base-content/60 mt-1">
              Contact:{" "}
              {initialProfessionalContact?.whatsapp || initialProfessionalContact?.email
                ? "Configured"
                : "Missing"}
            </div>
          )}
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

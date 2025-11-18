"use client";

import { useState } from "react";
import ImageCropPicker from "@/components/ImageCropPicker";
import { FaCamera } from "react-icons/fa";
import { upload } from "@imagekit/next";

interface ProfilePictureSectionProps {
  initialImage?: string;
  userName?: string;
}

export default function ProfilePictureSection({ initialImage, userName }: ProfilePictureSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleImageSelect = async (file: File) => {
    setUploading(true);
    setError("");

    try {
      // Get authentication parameters from server
      const authResponse = await fetch("/api/imagekit-auth");
      if (!authResponse.ok) {
        throw new Error("Failed to authenticate upload");
      }

      const { token, signature, expire, publicKey } = await authResponse.json();

      // Upload using ImageKit SDK
      const uploadResponse = await upload({
        file,
        fileName: `profile-${Date.now()}.${file.name.split('.').pop()}`,
        token,
        signature,
        expire,
        publicKey,
        folder: "/dancecircle/profile-pics",
        useUniqueFileName: false,
        // Simplified transformation - resize to 800x800 with high quality
        // ImageKit will auto-optimize format and quality
        transformation: {
          pre: "w-800,h-800,c-at_max,fo-face",
        },
      });

      const imageUrl = uploadResponse.url;

      // Update user profile with new image URL
      const updateResponse = await fetch("/api/user/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageUrl }),
      });

      if (!updateResponse.ok) {
        throw new Error("Failed to update profile picture");
      }

      setIsEditing(false);
      window.location.reload();
    } catch (err) {
      setError("Failed to save. Please try again.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError("");
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="avatar self-center">
          <div className="w-28 h-28 rounded-full relative group">
            {initialImage ? (
              <img
                src={initialImage}
                alt={userName || "Profile"}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="bg-primary text-primary-content rounded-full w-full h-full flex items-center justify-center">
                <span className="text-4xl">
                  {userName?.charAt(0)?.toUpperCase() || "👤"}
                </span>
              </div>
            )}
            {/* Desktop hover overlay */}
            <button
              onClick={() => setIsEditing(true)}
              className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center justify-center text-white text-sm font-medium"
            >
              Edit
            </button>
          </div>
        </div>
        {/* Mobile/Always visible edit button - positioned outside the avatar */}
        <button
          onClick={() => setIsEditing(true)}
          className="btn btn-circle btn-sm btn-primary shadow-lg self-center -mt-6 z-10 relative"
          aria-label="Edit profile picture"
        >
          <FaCamera className="text-base" />
        </button>
      </div>

      {/* Modal for editing */}
      {isEditing && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl max-h-[90vh] flex flex-col p-0">
            {/* Header - fixed at top */}
            <div className="p-4 border-b border-base-300 flex justify-between items-center">
              <h3 className="font-bold text-lg">Update Profile Picture</h3>
              <button
                onClick={handleCancel}
                disabled={uploading}
                className="btn btn-ghost btn-sm btn-circle"
              >
                ✕
              </button>
            </div>
            
            {/* Content - scrollable */}
            <div className="flex-1 overflow-y-auto p-4">
              <ImageCropPicker
                currentImage={initialImage}
                userName={userName}
                onImageSelect={handleImageSelect}
                uploading={uploading}
              />
              {error && <p className="text-error text-sm text-center mt-4">{error}</p>}
            </div>
          </div>
          <div className="modal-backdrop" onClick={!uploading ? handleCancel : undefined}>
            <button className="cursor-default">close</button>
          </div>
        </div>
      )}
    </>
  );
}


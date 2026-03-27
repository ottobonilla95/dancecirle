"use client";

import React, { useState, useRef } from "react";
import { upload } from "@imagekit/next";
import { FaImage, FaSpinner, FaTimes } from "react-icons/fa";

interface ImageBlockUploaderProps {
  imageUrl?: string;
  onUpload: (url: string) => void;
  onRemove?: () => void;
  compact?: boolean;
}

export default function ImageBlockUploader({
  imageUrl,
  onUpload,
  onRemove,
  compact = false,
}: ImageBlockUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const authResponse = await fetch("/api/imagekit-auth");
      if (!authResponse.ok) throw new Error("Failed to authenticate upload");

      const { token, signature, expire, publicKey } = await authResponse.json();

      const ext = file.name.split(".").pop();
      const uploadResponse = await upload({
        file,
        fileName: `blog-${Date.now()}.${ext}`,
        token,
        signature,
        expire,
        publicKey,
        folder: "/dancecircle/blog-images",
        useUniqueFileName: false,
        transformation: {
          pre: "w-1200,h-auto,c-scale",
        },
      });

      onUpload(uploadResponse.url);
    } catch (err) {
      console.error("Upload failed:", err);
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (imageUrl) {
    return (
      <div className="relative group">
        <img
          src={imageUrl}
          alt="Uploaded"
          className={`w-full rounded-lg object-cover ${compact ? "max-h-48" : "max-h-96"}`}
        />
        {onRemove && (
          <button
            onClick={onRemove}
            className="absolute top-2 right-2 btn btn-circle btn-sm btn-error opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <FaTimes />
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <label
        className={`flex flex-col items-center justify-center border-2 border-dashed border-base-content/20 rounded-lg cursor-pointer hover:border-primary/50 hover:bg-base-200 transition-colors ${
          compact ? "p-4" : "p-8"
        }`}
      >
        {uploading ? (
          <FaSpinner className="text-2xl animate-spin text-primary" />
        ) : (
          <>
            <FaImage className={`text-base-content/30 ${compact ? "text-xl mb-1" : "text-3xl mb-2"}`} />
            <span className={`text-base-content/50 ${compact ? "text-xs" : "text-sm"}`}>
              Click to upload image
            </span>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
      </label>
      {error && <p className="text-error text-xs mt-1">{error}</p>}
    </div>
  );
}

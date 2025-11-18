"use client";

import React, { useState, useRef } from "react";
import ReactCrop, { Crop, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { useTranslation } from "./I18nProvider";

interface ImageCropPickerProps {
  currentImage?: string;
  userName?: string;
  onImageSelect: (file: File) => void;
  uploading?: boolean;
  selectedFileName?: string;
}

export default function ImageCropPicker({
  currentImage,
  userName,
  onImageSelect,
  uploading = false,
  selectedFileName,
}: ImageCropPickerProps) {
  const { t } = useTranslation();
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    width: 80,
    height: 80,
    x: 10,
    y: 10,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [imgSrc, setImgSrc] = useState<string>("");
  const [showCropModal, setShowCropModal] = useState(false);
  const [profilePicPreview, setProfilePicPreview] = useState<string>("");
  const imgRef = useRef<HTMLImageElement>(null);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    
    // Calculate the initial crop in pixels based on the default percentage crop
    const pixelCrop: PixelCrop = {
      unit: 'px',
      x: (width * crop.x) / 100,
      y: (height * crop.y) / 100,
      width: (width * crop.width) / 100,
      height: (height * crop.height) / 100,
    };
    
    setCompletedCrop(pixelCrop);
  };

  // Resize large images before cropping (for iPhone photos, etc.)
  const resizeImageIfNeeded = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Max dimensions for crop UI (larger images slow down the UI)
          const MAX_DIMENSION = 2400;
          
          // If image is small enough, use as-is
          if (img.width <= MAX_DIMENSION && img.height <= MAX_DIMENSION) {
            resolve(e.target?.result as string);
            return;
          }

          // Calculate new dimensions maintaining aspect ratio
          let newWidth = img.width;
          let newHeight = img.height;
          
          if (img.width > img.height) {
            if (img.width > MAX_DIMENSION) {
              newWidth = MAX_DIMENSION;
              newHeight = (img.height * MAX_DIMENSION) / img.width;
            }
          } else {
            if (img.height > MAX_DIMENSION) {
              newHeight = MAX_DIMENSION;
              newWidth = (img.width * MAX_DIMENSION) / img.height;
            }
          }

          // Resize using canvas
          const canvas = document.createElement('canvas');
          canvas.width = newWidth;
          canvas.height = newHeight;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, newWidth, newHeight);
            resolve(canvas.toDataURL('image/jpeg', 0.92));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        alert("Please select a valid image file (JPEG, PNG, or WebP)");
        return;
      }

      // Note: We removed the 10MB limit - large images will be auto-resized
      // This allows iPhone photos and other high-res images

      // Resize if needed, then show crop modal
      const resizedImage = await resizeImageIfNeeded(file);
      setImgSrc(resizedImage);
      setShowCropModal(true);
      setCompletedCrop(undefined);
    }
  };

  const getCroppedImg = (
    image: HTMLImageElement,
    crop: PixelCrop
  ): Promise<Blob> => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("No 2d context");
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Calculate the actual crop dimensions from the natural (full resolution) image
    const cropWidth = crop.width * scaleX;
    const cropHeight = crop.height * scaleY;

    // Target output size - maintain high resolution (1200px max for quality)
    const MAX_OUTPUT_SIZE = 1200;
    let outputWidth = cropWidth;
    let outputHeight = cropHeight;

    // Only scale down if the crop is larger than our max size
    if (cropWidth > MAX_OUTPUT_SIZE || cropHeight > MAX_OUTPUT_SIZE) {
      const scale = Math.min(MAX_OUTPUT_SIZE / cropWidth, MAX_OUTPUT_SIZE / cropHeight);
      outputWidth = cropWidth * scale;
      outputHeight = cropHeight * scale;
    }

    // Set canvas to high-res output size (not just crop size)
    canvas.width = outputWidth;
    canvas.height = outputHeight;

    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw the cropped portion at full/high resolution
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      cropWidth,
      cropHeight,
      0,
      0,
      outputWidth,
      outputHeight
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          }
        },
        "image/jpeg",
        0.95  // Increased quality from 0.9 to 0.95
      );
    });
  };

  const handleCropComplete = async () => {
    if (completedCrop && imgRef.current) {
      try {
        const croppedImageBlob = await getCroppedImg(
          imgRef.current,
          completedCrop
        );
        const croppedFile = new File(
          [croppedImageBlob],
          "cropped-profile.jpg",
          { type: "image/jpeg" }
        );

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setProfilePicPreview(e.target?.result as string);
        };
        reader.readAsDataURL(croppedFile);

        setShowCropModal(false);
        onImageSelect(croppedFile);
      } catch (error) {
        console.error("Error cropping image:", error);
        alert("Error cropping image. Please try again.");
      }
    }
  };

  return (
    <div className="text-center py-8">
      <div className="flex flex-col items-center space-y-6">
        {/* Profile picture preview */}
        <div className="avatar">
          <div className="w-32 h-32 rounded-full relative">
            {uploading ? (
              <div className="w-full h-full rounded-full bg-base-300 flex items-center justify-center">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : profilePicPreview ? (
              <img
                src={profilePicPreview}
                alt="Profile preview"
                className="w-full h-full object-cover rounded-full"
              />
            ) : currentImage ? (
              <img
                src={currentImage}
                alt="Current profile"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="bg-neutral-focus text-neutral-content rounded-full w-full h-full flex items-center justify-center">
                <span className="text-4xl">
                  {userName?.charAt(0)?.toUpperCase() || "👤"}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-base-content/70">
            {t('onboarding.profilePicHelp')}
          </p>
          <p className="text-sm text-base-content/50">
            {t('onboarding.profilePicFormats')}
          </p>
        </div>

        {/* File upload button */}
        <div className="space-y-3">
          <input
            type="file"
            id="profilePicInput"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
          <label
            htmlFor="profilePicInput"
            className={`btn btn-primary cursor-pointer ${uploading ? "btn-disabled" : ""}`}
          >
            📷{" "}
            {profilePicPreview || currentImage
              ? t('onboarding.changePhoto')
              : t('onboarding.uploadPhoto')}
          </label>

          {selectedFileName && !uploading && (
            <p className="text-sm text-success">
              ✓ Photo ready to upload: {selectedFileName}
            </p>
          )}

          {uploading && (
            <p className="text-sm text-info">📤 Uploading your photo...</p>
          )}
        </div>
      </div>

      {/* Crop Modal */}
      {showCropModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4">
          <div className="bg-base-100 rounded-lg w-full max-w-md flex flex-col h-[450px] sm:h-[450px] sm:max-h-[85vh]">
            {/* Header - fixed */}
            <div className="p-3 sm:p-4 border-b border-base-300 flex-shrink-0">
              <h3 className="text-base sm:text-lg font-bold">{t('onboarding.cropPhoto')}</h3>
              <p className="text-xs sm:text-sm text-base-content/70 mt-1">
                {t('onboarding.cropPhotoDesc')}
              </p>
            </div>

            {/* Image area - fixed height, centered */}
            <div className="flex-1 p-3 sm:p-4 overflow-hidden flex items-center justify-center">
              <div className="flex justify-center items-center w-full h-full">
                <ReactCrop
                  crop={crop}
                  onChange={setCrop}
                  onComplete={setCompletedCrop}
                  aspect={1}
                  locked={false}
                  className="max-w-full max-h-[300px]"
                >
                  <img
                    ref={imgRef}
                    src={imgSrc}
                    alt="Crop preview"
                    className="max-w-full max-h-[50vh] sm:max-h-[40vh] w-auto h-auto object-contain"
                    onLoad={onImageLoad}
                  />
                </ReactCrop>
              </div>
            </div>

            {/* Buttons - always visible, fixed at bottom */}
            <div className="p-3 sm:p-4 border-t border-base-300 flex gap-2 sm:gap-3 justify-end flex-shrink-0">
              <button
                className="btn btn-outline btn-sm sm:btn-md"
                onClick={() => setShowCropModal(false)}
              >
                {t('common.cancel')}
              </button>
              <button
                className="btn btn-primary btn-sm sm:btn-md"
                onClick={handleCropComplete}
                disabled={!completedCrop}
              >
                {t('onboarding.useThisCrop')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { FaQrcode, FaTimes } from "react-icons/fa";
import QRCode from "qrcode";

interface ProfileQRCodeProps {
  userId: string;
  userName: string;
}

export default function ProfileQRCode({
  userId,
  userName,
}: ProfileQRCodeProps) {
  const [showModal, setShowModal] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  const profileUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/dancer/${userId}`
      : `https://www.dancecircle.co/dancer/${userId}`;

  useEffect(() => {
    if (showModal && !qrCodeDataUrl) {
      generateQRCode();
    }
  }, [showModal]); // eslint-disable-line react-hooks/exhaustive-deps

  const generateQRCode = async () => {
    try {
      const dataUrl = await QRCode.toDataURL(profileUrl, {
        width: 512,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
      setQrCodeDataUrl(dataUrl);
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeDataUrl) return;

    const link = document.createElement("a");
    link.download = `${userName.replace(/\s+/g, "_")}_DanceCircle_QR.png`;
    link.href = qrCodeDataUrl;
    link.click();
  };

  return (
    <>
      {/* QR Code Button */}
      <button
        onClick={() => setShowModal(true)}
        className="btn btn-outline btn-primary btn-sm w-full gap-2"
      >
        <FaQrcode className="text-lg" />
        Share QR Code
      </button>

      {/* Modal */}
      {showModal && (
        <div className="modal modal-open" onClick={() => setShowModal(false)}>
          <div
            className="modal-box max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-xl">Profile QR Code</h3>
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <FaTimes />
              </button>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center gap-4">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="Profile QR Code"
                    className="w-64 h-64"
                  />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center">
                    <span className="loading loading-spinner loading-lg"></span>
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="text-center">
                <p className="font-semibold text-lg">{userName}</p>
                <p className="text-sm text-base-content/60">
                  DanceCircle Profile
                </p>
              </div>
            </div>
          </div>

          {/* Backdrop */}
          <div className="modal-backdrop" onClick={() => setShowModal(false)} />
        </div>
      )}
    </>
  );
}

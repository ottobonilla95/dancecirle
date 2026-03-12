"use client";

import { useState, useEffect } from "react";
import { FaTimes, FaWhatsapp, FaCopy, FaCheck } from "react-icons/fa";
import { useTranslation } from "@/components/I18nProvider";
import { Link } from "@/navigation";

interface InviteFriendsBannerProps {
  friendsCount: number;
}

export default function InviteFriendsBanner({ friendsCount }: InviteFriendsBannerProps) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Check localStorage only on client after mount (prevents hydration error)
  useEffect(() => {
    setIsClient(true);
    const lastDismissed = localStorage.getItem('inviteBannerDismissed');
    if (lastDismissed) {
      const daysSinceDismissed = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 5) {  // Show every 3 days
        setDismissed(true);
      }
    }
  }, []);

  // Don't render until client-side hydration is complete
  if (!isClient || dismissed) return null;

  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://dancecircle.co';

  const whatsappMessage = `Hey! 👋 Found this amazing app for dancers - DanceCircle!\n\n✨ Find dancers in any city\n🌍 Connect globally\n🎯 Plan trips together\n\nIt's FREE and the community is growing fast!\n\nJoin me: ${baseUrl}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(baseUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const shareViaWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(url, '_blank');
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('inviteBannerDismissed', Date.now().toString());
  };

  return (
    <div className="relative bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20 rounded-lg p-4 mb-6">
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 btn btn-ghost btn-xs btn-circle opacity-50 hover:opacity-100"
        aria-label="Dismiss"
      >
        <FaTimes className="text-xs" />
      </button>

      <div className="flex items-center gap-3 pr-6">
        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-base-content/90">
            💃 <span className="font-semibold">{t('inviteBanner.message') || "Know other dancers?"}</span> {t('inviteBanner.invite') || "Invite your crew - they'll love it too!"}
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-shrink-0 gap-2">
          <button
            onClick={shareViaWhatsApp}
            className="btn btn-primary btn-xs gap-1 hidden sm:flex"
            title="Share on WhatsApp"
          >
            <FaWhatsapp />
            <span className="hidden md:inline">{t('inviteBanner.share') || "Share"}</span>
          </button>
          
          <button
            onClick={copyLink}
            className={`btn btn-xs gap-1 ${copied ? 'btn-success' : 'btn-outline'}`}
            title="Copy invite link"
          >
            {copied ? (
              <>
                <FaCheck />
                <span className="hidden md:inline">{t('inviteBanner.copied') || "Copied!"}</span>
              </>
            ) : (
              <>
                <FaCopy />
                <span className="hidden md:inline">{t('inviteBanner.copy') || "Copy"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


"use client";

import { useEffect, useState } from "react";
import { Link, useRouter } from "@/navigation";
import { FaCompass, FaCopy, FaUserFriends, FaLink } from "react-icons/fa";
import InstallPrompt from "./InstallPrompt";
import { useTranslation } from "./I18nProvider";

interface WelcomeModalProps {
  userName: string;
  userUsername: string;
  userImage?: string;
  userData: any;
  showWelcome: boolean;
}

export default function WelcomeModal({ userName, userUsername, userImage, userData, showWelcome }: WelcomeModalProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const router = useRouter();

  useEffect(() => {
    console.log("🎉 WelcomeModal: showWelcome =", showWelcome);
    // Show modal when showWelcome is true (from URL param)
    if (showWelcome) {
      console.log("✅ Opening welcome modal!");
      setIsOpen(true);
      // Mark as seen in localStorage
      localStorage.setItem("hasSeenWelcome", "true");
    }
  }, [showWelcome]);

  const handleClose = () => {
    console.log("🚪 WelcomeModal: Closing modal");
    setIsOpen(false);
    // Show install prompt after closing welcome modal
    setTimeout(() => {
      console.log("📱 WelcomeModal: Setting showInstallPrompt to true");
      setShowInstallPrompt(true);
    }, 500); // Small delay for smooth transition
    // Redirect to dashboard to explore the app
    router.push("/dashboard");
  };

  const profileUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/${userUsername}`;

  const copyProfileLink = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Install Prompt - Shows after welcome modal is closed */}
      <InstallPrompt
        show={showInstallPrompt}
        onClose={() => setShowInstallPrompt(false)}
      />

      {/* Only render welcome modal if isOpen */}
      {!isOpen ? null : (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50 z-50" onClick={handleClose} />
      
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-base-100 rounded-2xl shadow-2xl max-w-md sm:max-w-lg w-full max-h-[90vh] overflow-y-auto relative">
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 btn btn-sm btn-circle btn-ghost z-10"
              >
                ✕
              </button>

              <div className="p-6 sm:p-8 md:p-10">
                {/* Celebration Header */}
                <div className="text-center mb-6 sm:mb-8">
                  <div className="text-6xl sm:text-7xl mb-3 sm:mb-4 animate-bounce">🎉</div>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 px-2">
                    {t('welcome.welcomeTo')} {userName}!
                  </h2>
                  <p className="text-base sm:text-lg text-base-content/60">
                    {t('welcome.profileLive')} 🌍
                  </p>
                </div>

                {/* Share Instructions */}
                <div className="bg-primary/10 rounded-xl p-4 sm:p-5 mb-6">
                  <div className="flex gap-3 items-start">
                    <div className="text-2xl sm:text-3xl">💡</div>
                    <div className="flex-1">
                      <h3 className="font-bold mb-2 text-base sm:text-lg">{t('welcome.shareProfile')}</h3>
                      <ul className="text-sm sm:text-base space-y-1 text-base-content/80">
                        <li>✨ {t('welcome.addToBio')}</li>
                        <li>✨ {t('welcome.shareWithFriends')}</li>
                        <li>✨ {t('welcome.connectWorldwide')}</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Main Actions */}
                <div className="space-y-3 sm:space-y-4 mb-6">
                  {/* Copy Profile Link - Primary Action */}
                  <button
                    onClick={copyProfileLink}
                    className="btn btn-primary btn-lg btn-block gap-2 sm:gap-3 text-base sm:text-lg h-14 sm:h-16"
                  >
                    <FaCopy className="text-xl sm:text-2xl" />
                    {copied ? t('welcome.linkCopied') : t('welcome.copyLink')}
                  </button>

                  {/* Start Discovering */}
                  <Link
                    href="/discover"
                    className="btn btn-outline btn-lg btn-block gap-2 sm:gap-3 text-base sm:text-lg h-14 sm:h-16"
                    onClick={handleClose}
                  >
                    <FaCompass className="text-xl sm:text-2xl" />
                    <span>{t('welcome.startDiscovering')}</span>
                  </Link>
                </div>

                {/* Skip Button */}
                <button
                  onClick={handleClose}
                  className="btn btn-ghost btn-block text-sm sm:text-base text-base-content/60"
                >
                  {t('welcome.doLater')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}


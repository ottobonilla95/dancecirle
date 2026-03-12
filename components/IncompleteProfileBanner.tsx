"use client";

import { useSession } from "next-auth/react";
import { Link, usePathname } from "@/navigation";
import { useTranslation } from "./I18nProvider";
import { useState, useEffect } from "react";

export default function IncompleteProfileBanner() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { t } = useTranslation();
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Make it sticky after scrolling 100px
      setIsSticky(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Don't show on onboarding page or if not logged in
  if (!session?.user || pathname === "/onboarding") {
    return null;
  }

  // Don't show if profile is complete
  if (session.user.isProfileComplete) {
    return null;
  }

  return (
    <div className={`${isSticky ? 'fixed top-0 left-0 right-0 z-50 shadow-lg animate-in slide-in-from-top' : 'relative'} bg-warning text-warning-content`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <h3 className="font-bold">
                {t("banner.incompleteProfileTitle")}
              </h3>
              <div className="text-sm">
                {t("banner.incompleteProfileMessage")}
              </div>
            </div>
          </div>
          <Link
            href="/onboarding"
            className="btn btn-sm btn-neutral whitespace-nowrap"
          >
            {t("banner.completeNow")}
          </Link>
        </div>
      </div>
    </div>
  );
}


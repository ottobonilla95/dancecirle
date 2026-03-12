"use client";

import { useState, useEffect } from "react";
import type { JSX } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Link } from "@/navigation";
import Image from "next/image";
import ButtonSignin from "./ButtonSignin";
import SearchBar from "./SearchBar";
import logo from "@/app/icon.png";
import config from "@/config";
import { FaUser, FaUserFriends, FaCog, FaSignOutAlt, FaHome, FaUserPlus, FaMusic, FaSearch, FaPlane, FaShieldAlt, FaTrophy, FaComment } from "react-icons/fa";
import { signOut } from "next-auth/react";
import { CONTACT } from "@/constants/contact";
import InstallAppButton from "./InstallAppButton";
import SupportModal from "./SupportModal";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "./I18nProvider";
import DeleteAccountButton from "./DeleteAccountButton";
import ActiveUsersCounter from "./ActiveUsersCounter";
import AdminModeToggle from "./AdminModeToggle";
import NotificationBell from "./NotificationBell";

const links: {
  href: string;
  label: string;
}[] = [
  // {
  //   href: "/#testimonials",
  //   label: "Reviews",
  // },
];

const cta: JSX.Element = <ButtonSignin extraStyle="btn-primary" />;

// A header with a logo on the left, links in the center (like Pricing, etc...), and a CTA (like Get Started or Login) on the right.
// The header is responsive, and on mobile, the links are hidden behind a burger button.
const Header = () => {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState<boolean>(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);

  // setIsOpen(false) when the route changes (i.e: when the user clicks on a link on mobile)
  useEffect(() => {
    setIsOpen(false);
    setIsSearchOpen(false);
  }, [searchParams]);

  // Fetch user status (notifications + unread messages) in ONE call
  useEffect(() => {
    if (session?.user) {
      const fetchUserStatus = async () => {
        try {
          const res = await fetch("/api/user/status");
          const data = await res.json();
          if (res.ok) {
            setNotifications(data.notifications);
            setUnreadNotificationsCount(data.unreadNotificationsCount);
            setUnreadMessagesCount(data.unreadMessagesCount);
          }
        } catch (error) {
          console.error("Error fetching user status:", error);
        }
      };

      fetchUserStatus();
      // Poll every 30 seconds
      const interval = setInterval(fetchUserStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);



  // Check if user is admin
  const isAdmin = session?.user?.email === config.admin.email;

  const loggedInNavItems = [
    { href: "/dashboard", label: t('nav.dashboard'), icon: FaHome },
    { href: "/discover", label: t('nav.discoverDancers'), icon: FaUserPlus },
    { href: "/messages", label: t('nav.messages'), icon: FaComment },
    { href: "/leaderboards", label: t('nav.leaderboards'), icon: FaTrophy },
    { href: "/profile", label: t('nav.myProfile'), icon: FaUser },
    { href: "/friends", label: t('nav.friends'), icon: FaUserFriends },
    { href: "/music", label: t('nav.trendyMusic'), icon: FaMusic },
    { href: "/settings", label: t('nav.settings'), icon: FaCog },
    { href: "/invite", label: t('nav.inviteFriends'), icon: FaUserPlus, highlight: true },
    // Admin link - only visible to admin
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: FaShieldAlt, highlight: true }] : []),
  ];

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <header className="bg-base-200 text-neutral-content">
      <nav
        className="container flex items-center justify-between px-8 py-4 mx-auto"
        aria-label="Global"
      >
        {/* Your logo/name on large screens */}
        <div className="flex lg:flex-1 items-center gap-4">
          <Link
            className="flex items-center gap-2 shrink-0 "
            href="/"
            title={`${config.appName} homepage`}
          >
            <Image
              src={logo}
              alt={`${config.appName} logo`}
              className="w-8"
              placeholder="blur"
              priority={true}
              width={32}
              height={32}
            />
            <span className="font-extrabold text-lg">{config.appName}</span>
          </Link>
          
          {/* Active Users Counter - Admin Only */}
          {isAdmin && session && (
            <div className="hidden lg:block">
              <ActiveUsersCounter />
            </div>
          )}
        </div>
        {/* Search, Notifications and Burger buttons on mobile */}
        <div className="flex lg:hidden gap-2 items-center">
          {/* Search button on mobile */}
          {session && (
            <button
              type="button"
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5"
              onClick={() => setIsSearchOpen(true)}
            >
              <span className="sr-only">{t('nav.openSearch')}</span>
              <FaSearch className="w-5 h-5 text-base-content" />
            </button>
          )}

          {/* Notification Bell on mobile */}
          {session && (
            <div className="-m-1">
              <NotificationBell 
                notifications={notifications} 
                unreadCount={unreadNotificationsCount} 
              />
            </div>
          )}
          
          {/* Burger button to open menu on mobile */}
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 relative"
            onClick={() => setIsOpen(true)}
          >
            <span className="sr-only">{t('nav.openMenu')}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-base-content"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
            </svg>
            {/* Badge for unread messages on hamburger */}
            {(unreadMessagesCount > 0) && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex items-center justify-center rounded-full h-5 w-5 bg-primary text-primary-content text-xs font-bold">
                  {unreadMessagesCount}
                </span>
              </span>
            )}
        </button>
        </div>

        {/* Your links on large screens */}
        <div className="hidden lg:flex lg:justify-center lg:gap-12 lg:items-center">
          {links.map((link) => (
            <Link
              href={link.href}
              key={link.href}
              className="link link-hover"
              title={link.label}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Search Bar */}
        {session && (
          <div className="hidden lg:flex lg:justify-center lg:flex-1 lg:max-w-lg lg:mx-6">
            <SearchBar compact className="w-full" />
          </div>
        )}

        {/* CTA on large screens */}
        <div className="hidden lg:flex lg:justify-end lg:flex-1">
          {session ? (
            <div className="flex items-center gap-4">
              {/* Collaborate Button */}
              {/* <a
                href={`mailto:${CONTACT.COLLABORATION_EMAIL}`}
                className="btn btn-outline btn-sm gap-2"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
                Collab
              </a> */}

              {/* Language Switcher */}
              <LanguageSwitcher />

              {/* Notification Bell */}
              <NotificationBell 
                notifications={notifications}
                unreadCount={unreadNotificationsCount}
              />
              
              {/* User Avatar/Menu */}
              <div className="dropdown dropdown-end">
                <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar relative">
                  <div className="w-8 rounded-full">
                    {session.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user?.name || "Profile"}
                        width={32}
                        height={32}
                        className="rounded-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="bg-primary text-primary-content rounded-full w-full h-full flex items-center justify-center">
                        <span className="text-sm font-bold">
                          {session.user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Badge for unread messages on desktop */}
                  {unreadMessagesCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex items-center justify-center rounded-full h-5 w-5 bg-primary text-primary-content text-xs font-bold">
                        {unreadMessagesCount}
                      </span>
                    </span>
                  )}
                </div>
                <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
                  {loggedInNavItems.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className="flex items-center gap-2">
                        <item.icon />
                        {item.label}
                        {item.href === "/messages" && unreadMessagesCount > 0 && (
                          <span className="badge badge-primary badge-sm">
                            {unreadMessagesCount}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                  <li><hr /></li>
                  {config.resend.supportEmail && (
                    <li>
                      <button
                        onClick={() => setIsSupportModalOpen(true)}
                        className="flex items-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                        </svg>
                        {t('nav.getSupport')}
                      </button>
                    </li>
                  )}
                  <li><hr /></li>
                  {/* Admin Mode Toggle - Only for admins */}
                  {isAdmin && (
                    <>
                      <li>
                        <div className="px-2 py-1">
                          <AdminModeToggle />
                        </div>
                      </li>
                      <li><hr /></li>
                    </>
                  )}
                  <li>
                    <div className="px-2 py-1">
                      <DeleteAccountButton />
                    </div>
                  </li>
                  <li><hr /></li>
                  <li>
                    <button onClick={handleSignOut} className="flex items-center gap-2 text-error">
                      <FaSignOutAlt />
                      {t('nav.signOut')}
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              {cta}
            </div>
          )}
        </div>
      </nav>

      {/* Mobile menu, show/hide based on menu state. */}
      <div className={`relative z-50 ${isOpen ? "" : "hidden"}`}>
        <div
          className={`fixed inset-y-0 right-0 z-10 w-full px-8 py-4 overflow-y-auto bg-base-200 sm:max-w-sm sm:ring-1 sm:ring-neutral/10 transform origin-right transition ease-in-out duration-300`}
        >
          {/* Your logo/name on small screens */}
          <div className="flex items-center justify-between">
            <Link
              className="flex items-center gap-2 shrink-0 "
              title={`${config.appName} homepage`}
              href="/"
            >
              <Image
                src={logo}
                alt={`${config.appName} logo`}
                className="w-8"
                placeholder="blur"
                priority={true}
                width={32}
                height={32}
              />
              <span className="font-extrabold text-lg">{config.appName}</span>
            </Link>
            <button
              type="button"
              className="-m-2.5 rounded-md p-2.5"
              onClick={() => setIsOpen(false)}
            >
              <span className="sr-only">{t('nav.closeMenu')}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Your links on small screens */}
          <div className="flow-root mt-6">
            {session ? (
              /* Logged-in user menu */
              <>
                {/* User Info */}
                <div className="flex items-center gap-3 pb-4 border-b border-base-300">
                  <div className="avatar">
                    <div className="w-12 h-12 rounded-full">
                      {session.user?.image ? (
                        <Image
                          src={session.user.image}
                          alt={session.user?.name || "Profile"}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover rounded-full"
                          unoptimized
                        />
                      ) : (
                        <div className="bg-primary text-primary-content rounded-full w-full h-full flex items-center justify-center">
                          <span className="text-lg font-bold">
                            {session.user?.name?.charAt(0)?.toUpperCase() || "U"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{session.user?.name || "User"}</h3>
                    <p className="text-sm text-base-content/60 truncate">{session.user?.email}</p>
                  </div>
                </div>

                {/* Navigation Items */}
                <div className="py-4 mt-4">
                  <div className="flex flex-col gap-y-3">
                    {loggedInNavItems.map((item) => (
                      <Link
                        href={item.href}
                        key={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          (item as any).highlight 
                            ? "bg-gradient-to-r from-primary/20 to-secondary/20 hover:from-primary/30 hover:to-secondary/30 border border-primary/30" 
                            : "hover:bg-base-300"
                        }`}
                        title={item.label}
                      >
                        <item.icon className="text-lg" />
                        <span className="font-medium">{item.label}</span>
                        {item.href === "/messages" && unreadMessagesCount > 0 && (
                          <span className="badge badge-primary badge-sm ml-auto">
                            {unreadMessagesCount}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="divider"></div>

                {/* Language Switcher */}
                <div className="py-2">
                  <LanguageSwitcher />
                </div>

                {/* Install App Button */}
                <div className="py-2">
                  <InstallAppButton />
                </div>

                {/* Support Button */}
                {config.resend.supportEmail && (
                  <div className="py-2">
                    <button
                      onClick={() => setIsSupportModalOpen(true)}
                      className="btn btn-outline btn-block gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                      </svg>
                      {t('nav.getSupport')}
                    </button>
                  </div>
                )}

                <div className="divider"></div>

                {/* Admin Mode Toggle - Only for admins */}
                {isAdmin && (
                  <>
                    <div className="py-2">
                      <AdminModeToggle />
                    </div>
                    <div className="divider"></div>
                  </>
                )}
                
                {/* Delete Account */}
                <div className="py">
                  <DeleteAccountButton />
                </div>

                <div className="divider"></div>
                
                {/* Sign Out */}
                <div className="py-2">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg w-full text-left hover:bg-error hover:text-error-content transition-colors"
                  >
                    <FaSignOutAlt className="text-lg" />
                    <span className="font-medium">{t('nav.signOut')}</span>
                  </button>
                </div>
              </>
            ) : (
              /* Non-logged-in user menu */
              <>
                <div className="py-4">
                  <div className="flex flex-col gap-y-4 items-start">
                    {links.map((link) => (
                      <Link
                        href={link.href}
                        key={link.href}
                        className="link link-hover"
                        title={link.label}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="divider"></div>
                {/* Language Switcher */}
                <div className="py-2">
                  <LanguageSwitcher />
                </div>
                <div className="divider"></div>
                {/* Your CTA on small screens */}
                <div className="flex flex-col">{cta}</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      <div className={`relative z-50 ${isSearchOpen ? "" : "hidden"}`}>
        <div className="fixed inset-0 bg-base-300/80 backdrop-blur-sm" onClick={() => setIsSearchOpen(false)} />
        <div className="fixed inset-x-0 top-0 z-10 bg-base-200 p-4 shadow-lg">
          <div className="container mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-circle"
                onClick={() => setIsSearchOpen(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <div className="flex-1">
                <SearchBar />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Support Modal */}
      <SupportModal 
        isOpen={isSupportModalOpen} 
        onClose={() => setIsSupportModalOpen(false)} 
      />
    </header>
  );
};

export default Header;

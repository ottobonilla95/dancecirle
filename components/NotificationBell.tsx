"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Link } from "@/navigation";
import { FaBell, FaMusic, FaUserFriends, FaHeart, FaUserPlus, FaCheck, FaComment } from "react-icons/fa";
import { useTranslation } from "./I18nProvider";

interface Notification {
  _id: string;
  type: string;
  sender: {
    _id: string;
    name: string;
    username: string;
    image?: string;
    isFeaturedProfessional?: boolean;
  } | null;
  data: any;
  isRead: boolean;
  createdAt: string;
}

interface NotificationBellProps {
  notifications: Notification[];
  unreadCount: number;
}

export default function NotificationBell({ notifications = [], unreadCount = 0 }: NotificationBellProps) {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      // Note: State will be updated on next poll (30s)
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      // Note: State will be updated on next poll (30s)
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_music":
        return <FaMusic className="text-primary" />;
      case "friend_request":
        return <FaUserFriends className="text-secondary" />;
      case "friend_accepted":
        return <FaCheck className="text-success" />;
      case "profile_liked":
        return <FaHeart className="text-error" />;
      case "new_follower":
        return <FaUserPlus className="text-info" />;
      case "message":
        return <FaComment className="text-primary" />;
      case "comment":
        return <FaComment className="text-info" />;
      case "like":
        return <FaHeart className="text-error" />;
      default:
        return <FaBell />;
    }
  };

  // Get notification message
  const getNotificationMessage = (notification: Notification) => {
    const senderName = notification.sender?.name || "Someone";
    
    // Use generic actionUrl if provided, otherwise fall back to defaults
    const getActionUrl = () => {
      if (notification.data.actionUrl) {
        return notification.data.actionUrl;
      }
      
      // Fallback default: sender's profile (works for all notification types)
      return `/${notification.sender?.username || notification.sender?._id}`;
    };
    
    switch (notification.type) {
      case "new_music":
        return {
          text: t("notifications.newMusic")
            .replace("{name}", senderName)
            .replace("{title}", notification.data.songTitle || "new music"),
          link: getActionUrl(),
        };
      case "friend_request":
        return {
          text: t("notifications.friendRequest").replace("{name}", senderName),
          link: getActionUrl(),
        };
      case "friend_accepted":
        return {
          text: t("notifications.friendAccepted").replace("{name}", senderName),
          link: getActionUrl(),
        };
      case "profile_liked":
        return {
          text: t("notifications.profileLiked").replace("{name}", senderName),
          link: getActionUrl(),
        };
      case "new_follower":
        return {
          text: t("notifications.newFollower").replace("{name}", senderName),
          link: getActionUrl(),
        };
      case "message":
        return {
          text: t("notifications.message").replace("{name}", senderName),
          link: `/messages/${notification.data.conversationId}`,
        };
      case "comment":
        return {
          text: `${senderName} ${notification.data.message || "commented on your post"}`,
          link: "/feed",
        };
      case "like":
        return {
          text: `${senderName} ${notification.data.message || "liked your post"}`,
          link: "/feed",
        };
      default:
        return {
          text: "New notification",
          link: getActionUrl(),
        };
    }
  };

  // Format time ago
  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    
    if (seconds < 60) return t("notifications.justNow");
    if (seconds < 3600) return t("notifications.minutesAgo").replace("{count}", String(Math.floor(seconds / 60)));
    if (seconds < 86400) return t("notifications.hoursAgo").replace("{count}", String(Math.floor(seconds / 3600)));
    return t("notifications.daysAgo").replace("{count}", String(Math.floor(seconds / 86400)));
  };

  if (!session?.user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-ghost btn-circle relative"
        aria-label="Notifications"
      >
        <FaBell className="text-xl" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 badge badge-secondary badge-xs">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-base-100 shadow-xl rounded-lg z-50 max-h-[500px] flex flex-col border border-base-300">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-base-300">
            <h3 className="font-bold text-lg">{t("notifications.title")}</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="btn btn-ghost btn-xs"
              >
                {t("notifications.markAllRead")}
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-base-content/60">
                <FaBell className="text-4xl mx-auto mb-2 opacity-30" />
                <p>{t("notifications.noNotifications")}</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const { text, link } = getNotificationMessage(notification);
                
                return (
                  <Link
                    key={notification._id}
                    href={link}
                    onClick={() => {
                      if (!notification.isRead) {
                        markAsRead(notification._id);
                      }
                      setIsOpen(false);
                    }}
                    className={`flex gap-3 p-4 hover:bg-base-200 transition-colors border-b border-base-300 last:border-b-0 ${
                      !notification.isRead ? "bg-primary/5" : ""
                    }`}
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.isRead ? "font-semibold" : ""}`}>
                        {text}
                      </p>
                      <p className="text-xs text-base-content/60 mt-1">
                        {timeAgo(notification.createdAt)}
                      </p>
                    </div>

                    {/* Unread indicator */}
                    {!notification.isRead && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                      </div>
                    )}
                  </Link>
                );
              })
            )}
          </div>

          {/* Footer - show if there are many notifications */}
          {notifications.length >= 30 && (
            <div className="p-3 text-center border-t border-base-300">
              <p className="text-xs text-base-content/60">
                {t("notifications.showingRecent")} {notifications.length}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


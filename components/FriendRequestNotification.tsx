"use client";

import { Link } from "@/navigation";
import { FaUserFriends, FaBell } from "react-icons/fa";

interface FriendRequestNotificationProps {
  pendingRequests: number;
}

export default function FriendRequestNotification({ pendingRequests }: FriendRequestNotificationProps) {
  if (pendingRequests === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 z-40">
      <Link 
        href="/friends"
        className="btn btn-secondary btn-sm gap-2 shadow-lg hover:shadow-xl transition-all duration-300 animate-bounce"
      >
        <FaBell className="text-sm" />
        <span className="hidden sm:inline">
          {pendingRequests} Friend Request{pendingRequests > 1 ? 's' : ''}
        </span>
        <span className="sm:hidden">
          {pendingRequests}
        </span>
      </Link>
    </div>
  );
} 
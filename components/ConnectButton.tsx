"use client";

import { useState, useRef, useEffect } from "react";
import { FaUserPlus, FaUserCheck, FaUserClock, FaCheck, FaTimes, FaChevronDown } from "react-icons/fa";
import { useSession } from "next-auth/react";
import { Link } from "@/navigation";
import { useTranslation } from "./I18nProvider";
import { useRefreshFriendRequests } from "@/contexts/FriendRequestContext";

interface ConnectButtonProps {
  targetUserId: string;
  isFriend: boolean;
  hasSentRequest: boolean;
  hasReceivedRequest: boolean;
  isFeaturedProfessional?: boolean;
  isFollowing?: boolean;
  isCurrentUserFeatured?: boolean;
  className?: string;
}

export default function ConnectButton({ 
  targetUserId, 
  isFriend, 
  hasSentRequest, 
  hasReceivedRequest,
  isFeaturedProfessional = false,
  isFollowing = false,
  isCurrentUserFeatured = false,
  className = ""
}: ConnectButtonProps) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const refreshFriendRequests = useRefreshFriendRequests();
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState({
    isFriend,
    hasSentRequest,
    hasReceivedRequest,
    isFollowing
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [dropdownOpen]);

  const handleFollow = async () => {
    if (!session) {
      window.location.href = '/api/auth/signin';
      return;
    }

    setLoading(true);
    try {
      if (status.isFollowing) {
        // Unfollow
        const response = await fetch(`/api/user/follow?userId=${targetUserId}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (data.success) {
          setStatus(prev => ({ ...prev, isFollowing: false }));
        } else {
          alert(data.error || 'Something went wrong');
        }
      } else {
        // Follow
        const response = await fetch('/api/user/follow', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: targetUserId }),
        });
        const data = await response.json();
        if (data.success) {
          setStatus(prev => ({ ...prev, isFollowing: true }));
        } else {
          alert(data.error || 'Something went wrong');
        }
      }
    } catch (error) {
      console.error('Error handling follow:', error);
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFriendRequest = async (action: string) => {
    if (!session) {
      window.location.href = '/api/auth/signin';
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/user/friend-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, targetUserId }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state based on action
        switch (action) {
          case 'send':
            setStatus(prev => ({ ...prev, hasSentRequest: true }));
            break;
          case 'accept':
            setStatus(prev => ({ ...prev, isFriend: true, hasReceivedRequest: false }));
            // Refresh friend request count to update bell notification
            await refreshFriendRequests();
            break;
          case 'reject':
            setStatus(prev => ({ ...prev, hasReceivedRequest: false }));
            // Refresh friend request count to update bell notification
            await refreshFriendRequests();
            break;
          case 'cancel':
            setStatus(prev => ({ ...prev, hasSentRequest: false }));
            break;
        }
      } else {
        alert(data.error || 'Something went wrong');
      }
    } catch (error) {
      console.error('Error handling friend request:', error);
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <Link href="/api/auth/signin" className={`btn btn-primary btn-sm gap-2 ${className}`}>
        <FaUserPlus className="text-sm" />
        {t('connect.connect')}
      </Link>
    );
  }

  // Featured Professional: Dropdown with Follow primary, Add Friend secondary
  if (isFeaturedProfessional) {
    return (
      <div className="relative" ref={dropdownRef}>
        <div className="flex gap-0">
          {/* Primary: Follow Button */}
          <button
            onClick={handleFollow}
            disabled={loading}
            className={`btn ${status.isFollowing ? 'btn-outline' : 'btn-primary'} btn-sm gap-2 rounded-r-none`}
          >
            <FaUserCheck className="text-sm" />
            {loading ? t('connect.loading') : (status.isFollowing ? t('connect.following') : t('connect.follow'))}
          </button>

          {/* Dropdown Toggle */}
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            disabled={loading}
            className={`btn ${status.isFollowing ? 'btn-outline' : 'btn-primary'} btn-sm rounded-l-none border-l-0 px-2`}
          >
            <FaChevronDown className={`text-xs transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div className="absolute top-full left-0 mt-1 w-48 bg-base-200 rounded-lg shadow-lg border border-base-300 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <ul className="menu menu-sm p-2">
              {status.isFriend ? (
                <li>
                  <button disabled className="gap-2">
                    <FaUserCheck className="text-sm" />
                    {t('connect.friends')}
                  </button>
                </li>
              ) : status.hasReceivedRequest ? (
                <>
                  <li>
                    <button
                      onClick={() => {
                        handleFriendRequest('accept');
                        setDropdownOpen(false);
                      }}
                      disabled={loading}
                      className="gap-2 text-success"
                    >
                      <FaCheck className="text-sm" />
                      {t('connect.acceptRequest')}
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        handleFriendRequest('reject');
                        setDropdownOpen(false);
                      }}
                      disabled={loading}
                      className="gap-2 text-error"
                    >
                      <FaTimes className="text-sm" />
                      {t('connect.rejectRequest')}
                    </button>
                  </li>
                </>
              ) : status.hasSentRequest ? (
                <li>
                  <button
                    onClick={() => {
                      handleFriendRequest('cancel');
                      setDropdownOpen(false);
                    }}
                    disabled={loading}
                    className="gap-2"
                  >
                    <FaUserClock className="text-sm" />
                    {t('connect.pending')}
                  </button>
                </li>
              ) : (
                <li>
                  <button
                    onClick={() => {
                      handleFriendRequest('send');
                      setDropdownOpen(false);
                    }}
                    disabled={loading}
                    className="gap-2"
                  >
                    <FaUserPlus className="text-sm" />
                    {t('connect.connect')}
                  </button>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // FRIEND REQUEST SYSTEM: Normal users (no follow system)
  // Already friends
  if (status.isFriend) {
    return (
      <button className={`btn btn-success btn-sm gap-2 ${className}`} disabled>
        <FaUserCheck className="text-sm" />
        {t('connect.friends')}
      </button>
    );
  }

  // Has received a friend request (can accept/reject)
  if (status.hasReceivedRequest) {
    return (
      <div className="flex gap-1">
        <button
          onClick={() => handleFriendRequest('accept')}
          disabled={loading}
          className="btn btn-success btn-sm"
          title={t('connect.acceptRequest')}
        >
          <FaCheck className="text-sm" />
        </button>
        <button
          onClick={() => handleFriendRequest('reject')}
          disabled={loading}
          className="btn btn-error btn-sm"
          title={t('connect.rejectRequest')}
        >
          <FaTimes className="text-sm" />
        </button>
      </div>
    );
  }

  // Has sent a friend request (can cancel)
  if (status.hasSentRequest) {
    return (
      <button
        onClick={() => handleFriendRequest('cancel')}
        disabled={loading}
        className={`btn btn-outline btn-sm gap-2 ${className}`}
      >
        <FaUserClock className="text-sm" />
        {t('connect.pending')}
      </button>
    );
  }

  // Default: can send friend request
  return (
    <button
      onClick={() => handleFriendRequest('send')}
      disabled={loading}
      className={`btn btn-primary btn-sm gap-2 ${className}`}
    >
      <FaUserPlus className="text-sm" />
      {t('connect.connect')}
    </button>
  );
} 
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "@/navigation";
import apiClient from "@/libs/api";
import { useTranslation } from "@/components/I18nProvider";
import { FaBell, FaEnvelope, FaUserFriends, FaHeart, FaCalendarWeek } from "react-icons/fa";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [friendRequestNotifications, setFriendRequestNotifications] = useState(true);
  const [profileLikedNotifications, setProfileLikedNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    } else if (status === "authenticated") {
      fetchSettings();
    }
  }, [status, router]);

  const fetchSettings = async () => {
    try {
      const data = await apiClient.get("/user/settings") as {
        notificationSettings: {
          emailNotifications: boolean;
          friendRequestNotifications: boolean;
          profileLikedNotifications: boolean;
          messageNotifications: boolean;
          weeklyDigest: boolean;
        };
      };
      
      // Set notification settings
      setEmailNotifications(data.notificationSettings?.emailNotifications ?? true);
      setFriendRequestNotifications(data.notificationSettings?.friendRequestNotifications ?? true);
      setProfileLikedNotifications(data.notificationSettings?.profileLikedNotifications ?? true);
      setMessageNotifications(data.notificationSettings?.messageNotifications ?? true);
      setWeeklyDigest(data.notificationSettings?.weeklyDigest ?? true);
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching settings:", error);
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      await apiClient.post("/user/settings/notifications", {
        emailNotifications,
        friendRequestNotifications,
        profileLikedNotifications,
        messageNotifications,
        weeklyDigest,
      });
      
      setMessage({ type: 'success', text: t('settings.saved') });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error saving notification settings:", error);
      setMessage({ type: 'error', text: t('settings.saveFailed') });
    } finally {
      setSaving(false);
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('settings.title')}</h1>
        <p className="text-base-content/70">{t('settings.subtitle')}</p>
      </div>

      {/* Tabs */}
      <div role="tablist" className="tabs tabs-lifted mb-8">
        <input
          type="radio"
          name="settings_tabs"
          role="tab"
          className="tab"
          aria-label={t('settings.notifications')}
          defaultChecked
        />
        <div role="tabpanel" className="tab-content bg-base-100 border-base-300 rounded-box p-6">
          {/* Notifications Settings */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <FaBell className="text-2xl text-primary" />
              <div>
                <h2 className="text-xl font-bold">{t('settings.emailNotifications')}</h2>
                <p className="text-sm text-base-content/70">{t('settings.notificationsDesc')}</p>
              </div>
            </div>

            {/* Master Email Notifications Toggle */}
            <div className="form-control">
              <label className="label cursor-pointer justify-between p-4 bg-base-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <FaEnvelope className="text-lg text-primary" />
                  <div>
                    <span className="label-text font-semibold">{t('settings.enableEmailNotifications')}</span>
                    <p className="text-xs text-base-content/60 mt-1">{t('settings.masterToggleDesc')}</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                />
              </label>
            </div>

            {/* Individual notification types */}
            <div className={`space-y-4 ${!emailNotifications ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="divider">{t('settings.notificationTypes')}</div>

              {/* Friend Request Notifications */}
              <div className="form-control">
                <label className="label cursor-pointer justify-between p-4 bg-base-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FaUserFriends className="text-lg text-info" />
                    <div>
                      <span className="label-text font-semibold">{t('settings.friendRequests')}</span>
                      <p className="text-xs text-base-content/60 mt-1">{t('settings.friendRequestsDesc')}</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-info"
                    checked={friendRequestNotifications}
                    onChange={(e) => setFriendRequestNotifications(e.target.checked)}
                    disabled={!emailNotifications}
                  />
                </label>
              </div>

              {/* Profile Liked Notifications */}
              <div className="form-control">
                <label className="label cursor-pointer justify-between p-4 bg-base-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FaHeart className="text-lg text-error" />
                    <div>
                      <span className="label-text font-semibold">{t('settings.profileLikes')}</span>
                      <p className="text-xs text-base-content/60 mt-1">{t('settings.profileLikesDesc')}</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-error"
                    checked={profileLikedNotifications}
                    onChange={(e) => setProfileLikedNotifications(e.target.checked)}
                    disabled={!emailNotifications}
                  />
                </label>
              </div>

              {/* Message Notifications */}
              <div className="form-control">
                <label className="label cursor-pointer justify-between p-4 bg-base-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FaEnvelope className="text-lg text-warning" />
                    <div>
                      <span className="label-text font-semibold">{t('settings.messages')}</span>
                      <p className="text-xs text-base-content/60 mt-1">{t('settings.messagesDesc')}</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-warning"
                    checked={messageNotifications}
                    onChange={(e) => setMessageNotifications(e.target.checked)}
                    disabled={!emailNotifications}
                  />
                </label>
              </div>

              {/* Weekly Digest */}
              <div className="form-control">
                <label className="label cursor-pointer justify-between p-4 bg-base-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FaCalendarWeek className="text-lg text-success" />
                    <div>
                      <span className="label-text font-semibold">{t('settings.weeklyDigest')}</span>
                      <p className="text-xs text-base-content/60 mt-1">{t('settings.weeklyDigestDesc')}</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-success"
                    checked={weeklyDigest}
                    onChange={(e) => setWeeklyDigest(e.target.checked)}
                    disabled={!emailNotifications}
                  />
                </label>
              </div>
            </div>

            {/* Success/Error Message */}
            {message && (
              <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={message.type === 'success' ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" : "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"} />
                </svg>
                <span>{message.text}</span>
              </div>
            )}

            {/* Save Button */}
            <button
              className="btn btn-primary w-full"
              onClick={handleSaveNotifications}
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  {t('settings.saving')}
                </>
              ) : (
                t('settings.saveChanges')
              )}
            </button>
          </div>
        </div>

        {/* Future tabs can be added here */}
        {/* <input
          type="radio"
          name="settings_tabs"
          role="tab"
          className="tab"
          aria-label="Privacy"
        />
        <div role="tabpanel" className="tab-content bg-base-100 border-base-300 rounded-box p-6">
          Privacy settings coming soon...
        </div> */}
      </div>
    </div>
  );
}


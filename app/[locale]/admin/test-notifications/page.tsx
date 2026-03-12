"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Link } from "@/navigation";

export default function TestNotificationsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [notificationType, setNotificationType] = useState<string>("new_music");
  const [songTitle, setSongTitle] = useState("Test Song Title");

  const sendTestNotification = async () => {
    if (!session?.user?.id) {
      setMessage("❌ Not logged in");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/test-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: notificationType,
          songTitle: notificationType === "new_music" ? songTitle : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ ${data.message}`);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      console.error("Error sending test notification:", error);
      setMessage("❌ Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">🔔 Test Notifications</h1>
            <p className="text-base-content/60 mt-2">
              Send test notifications to your own profile
            </p>
          </div>
          <Link href="/admin/cleanup" className="btn btn-ghost btn-sm">
            ← Back to Admin
          </Link>
        </div>

        {/* Test Notification Card */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Send Test Notification</h2>
            <p className="text-sm text-base-content/60">
              This will send a notification to your profile (
              <strong>{session?.user?.email}</strong>). Check the bell icon in
              the navbar to see it.
            </p>

            <div className="divider"></div>

            {/* Notification Type */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-semibold">
                  Notification Type
                </span>
              </label>
              <select
                className="select select-bordered w-full"
                value={notificationType}
                onChange={(e) => setNotificationType(e.target.value)}
              >
                <option value="new_music">🎵 New Music (Producer)</option>
                <option value="new_follower">👤 New Follower</option>
                <option value="profile_liked">❤️ Profile Liked</option>
                <option value="friend_request">👥 Friend Request</option>
                <option value="friend_accepted">✓ Friend Accepted</option>
              </select>
            </div>

            {/* Song Title (only for new_music) */}
            {notificationType === "new_music" && (
              <div className="form-control w-full mt-4">
                <label className="label">
                  <span className="label-text font-semibold">Song Title</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter song title"
                  className="input input-bordered w-full"
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                />
              </div>
            )}

            {/* Send Button */}
            <div className="card-actions justify-end mt-6">
              <button
                onClick={sendTestNotification}
                disabled={loading || !session?.user}
                className="btn btn-primary gap-2"
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                    Send Test Notification
                  </>
                )}
              </button>
            </div>

            {/* Message */}
            {message && (
              <div
                className={`alert ${
                  message.startsWith("✅") ? "alert-success" : "alert-error"
                } mt-4`}
              >
                <span>{message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="alert alert-info mt-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-current shrink-0 w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <div>
            <h3 className="font-bold">How to Test:</h3>
            <ol className="text-sm list-decimal list-inside mt-2 space-y-1">
              <li>Select a notification type from the dropdown</li>
              <li>Click &quot;Send Test Notification&quot;</li>
              <li>Check the bell icon (🔔) in the navbar</li>
              <li>You should see a red badge with notification count</li>
              <li>Click the bell to see the notification details</li>
            </ol>
          </div>
        </div>

        {/* Notification Types Reference */}
        <div className="card bg-base-200 shadow-xl mt-6">
          <div className="card-body">
            <h3 className="card-title text-lg">Notification Types Reference</h3>
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Icon</th>
                    <th>Message</th>
                    <th>Use Case</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <code className="text-xs">new_music</code>
                    </td>
                    <td>🎵</td>
                    <td>Producer Name posted Song Title</td>
                    <td>When producer releases new music</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="text-xs">new_follower</code>
                    </td>
                    <td>👤</td>
                    <td>User Name started following you</td>
                    <td>When someone follows your profile</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="text-xs">profile_liked</code>
                    </td>
                    <td>❤️</td>
                    <td>User Name liked your profile</td>
                    <td>When someone likes your profile</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="text-xs">friend_request</code>
                    </td>
                    <td>👥</td>
                    <td>User Name sent you a friend request</td>
                    <td>When someone sends friend request</td>
                  </tr>
                  <tr>
                    <td>
                      <code className="text-xs">friend_accepted</code>
                    </td>
                    <td>✓</td>
                    <td>User Name accepted your friend request</td>
                    <td>When friend request is accepted</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


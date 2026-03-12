import { Link } from "@/navigation";
import { FaCheckCircle, FaCog } from "react-icons/fa";

export default function UnsubscribeSuccessPage({
  searchParams,
}: {
  searchParams: { type?: string };
}) {
  const type = searchParams.type || "all";

  const typeMessages: Record<string, { title: string; description: string }> = {
    friendRequest: {
      title: "Friend Request Emails Disabled",
      description: "You won't receive emails about new friend requests anymore.",
    },
    profileLiked: {
      title: "Profile Liked Emails Disabled",
      description: "You won't receive emails when someone likes your profile.",
    },
    message: {
      title: "Message Notification Emails Disabled",
      description: "You won't receive emails about new messages.",
    },
    weeklyDigest: {
      title: "Weekly Digest Disabled",
      description: "You won't receive the weekly digest email anymore.",
    },
    all: {
      title: "All Email Notifications Disabled",
      description: "You've been unsubscribed from all email notifications.",
    },
  };

  const message = typeMessages[type] || typeMessages.all;

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="card max-w-lg w-full bg-base-100 shadow-xl">
        <div className="card-body items-center text-center">
          <FaCheckCircle className="text-6xl text-success mb-4" />
          <h1 className="card-title text-3xl mb-2">{message.title}</h1>
          <p className="text-base-content/70 mb-6">{message.description}</p>

          <div className="divider"></div>

          <div className="space-y-4 w-full">
            <p className="text-sm text-base-content/60">
              {type === "all" 
                ? "You can still receive in-app notifications and re-enable emails anytime from your settings."
                : "You'll still receive other email notifications. You can manage all preferences in your settings."}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/settings" className="btn btn-primary gap-2">
                <FaCog />
                Manage All Preferences
              </Link>
              <Link href="/dashboard" className="btn btn-outline">
                Go to Dashboard
              </Link>
            </div>
          </div>

          <div className="mt-6 text-xs text-base-content/50">
            <p>
              Changed your mind? You can re-enable email notifications at any
              time from your{" "}
              <Link href="/settings" className="link link-primary">
                account settings
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/navigation";
import { FaComments, FaArrowLeft } from "react-icons/fa";
import { useTranslation } from "@/components/I18nProvider";
import { tReplace } from "@/lib/t-replace";

interface Conversation {
  _id: string;
  participants: Array<{
    _id: string;
    name: string;
    username: string;
    image?: string;
  }>;
  lastMessage: string;
  lastMessageAt: string;
  lastMessageBy?: {
    _id: string;
    name: string;
  };
  hasUnread: boolean;
}

export default function MessagesPage() {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/api/auth/signin";
    }
  }, [status]);

  useEffect(() => {
    if (session) {
      const toUserId = searchParams.get("to");
      if (toUserId) {
        // Auto-create/navigate to conversation
        handleStartConversation(toUserId);
      } else {
        fetchConversations();
      }
    }
  }, [session, searchParams]);

  const handleStartConversation = async (otherUserId: string) => {
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push(`/messages/${data.conversation._id}`);
      } else {
        alert(data.error || t('messages.failedToStart'));
        fetchConversations();
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
      fetchConversations();
    }
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/conversations");
      const data = await res.json();

      if (res.ok) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const getOtherUser = (conversation: Conversation) => {
    return conversation.participants.find((p) => p._id !== session?.user?.id);
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diff = now.getTime() - messageDate.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t('messages.justNow');
    if (minutes < 60) return tReplace(t('messages.minutesAgo'), { count: minutes });
    if (hours < 24) return tReplace(t('messages.hoursAgo'), { count: hours });
    if (days < 7) return tReplace(t('messages.daysAgo'), { count: days });
    return messageDate.toLocaleDateString();
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 pb-20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FaComments /> {t('messages.title')}
          </h1>
          <p className="text-base-content/70 mt-2">
            {conversations.length} {conversations.length === 1 ? t('messages.conversation') : t('messages.conversations')}
          </p>
        </div>

        {/* Conversations List */}
        {conversations.length === 0 ? (
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body text-center py-12">
              <FaComments className="text-6xl mx-auto text-base-content/30 mb-4" />
              <h2 className="text-xl font-semibold mb-2">{t('messages.noMessages')}</h2>
              <p className="text-base-content/60">
                {t('messages.noMessagesDesc')}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => {
              const otherUser = getOtherUser(conversation);
              const isFromMe = conversation.lastMessageBy?._id === session?.user?.id;
              const hasUnread = conversation.hasUnread;

              return (
                <Link
                  key={conversation._id}
                  href={`/messages/${conversation._id}`}
                  className={`card transition-all shadow-lg ${
                    hasUnread 
                      ? "bg-primary/5 hover:bg-primary/10 border-l-4 border-primary" 
                      : "bg-base-200 hover:bg-base-300"
                  }`}
                >
                  <div className="card-body p-4">
                    <div className="flex items-center gap-4">
                      {/* Avatar with unread indicator */}
                      <div className="avatar">
                        <div className="w-14 h-14 rounded-full relative">
                          {otherUser?.image ? (
                            <img src={otherUser.image} alt={otherUser.name} />
                          ) : (
                            <div className="bg-primary text-primary-content flex items-center justify-center text-xl font-bold">
                              {otherUser?.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          {hasUnread && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-base-100"></div>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`text-lg ${hasUnread ? "font-bold" : "font-semibold"}`}>
                            {otherUser?.name}
                          </h3>
                          <span className={`text-xs ${hasUnread ? "text-primary font-semibold" : "text-base-content/60"}`}>
                            {getTimeAgo(conversation.lastMessageAt)}
                          </span>
                        </div>
                        <p className={`text-sm truncate ${hasUnread ? "font-semibold text-base-content" : "text-base-content/70"}`}>
                          {isFromMe && "You: "}
                          {conversation.lastMessage || t('messages.noMessages')}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


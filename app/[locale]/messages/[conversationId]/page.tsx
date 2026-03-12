"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { Link, useRouter } from "@/navigation";
import { FaArrowLeft, FaPaperPlane } from "react-icons/fa";

interface Message {
  _id: string;
  senderId: string;
  senderName: string;
  senderImage?: string;
  text: string;
  createdAt: string;
}

interface User {
  _id: string;
  name: string;
  username: string;
  image?: string;
}

export default function ChatPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/api/auth/signin";
    }
  }, [status]);

  useEffect(() => {
    if (session) {
      fetchMessages();
      // Poll for new messages every 5 seconds
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [session, params.conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/conversations/${params.conversationId}/messages`);
      const data = await res.json();

      if (res.ok) {
        setMessages(data.messages);

        // Get other user from first message or conversation
        if (data.messages.length > 0) {
          const firstMessage = data.messages[0];
          if (firstMessage.senderId !== session?.user?.id) {
            setOtherUser({
              _id: firstMessage.senderId,
              name: firstMessage.senderName,
              username: "",
              image: firstMessage.senderImage,
            });
          } else {
            // Find the other person's message
            const otherMessage = data.messages.find(
              (m: Message) => m.senderId !== session?.user?.id
            );
            if (otherMessage) {
              setOtherUser({
                _id: otherMessage.senderId,
                name: otherMessage.senderName,
                username: "",
                image: otherMessage.senderImage,
              });
            }
          }
        }
      } else if (res.status === 403 || res.status === 404) {
        router.push("/messages");
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${params.conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newMessage }),
      });

      if (res.ok) {
        setNewMessage("");
        await fetchMessages();
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
      } else {
        const data = await res.json();
        alert(data.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    // Auto-resize textarea
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-base-100">
      {/* Header */}
      <div className="navbar bg-base-200 shadow-lg">
        <div className="flex-none">
          <Link href="/messages" className="btn btn-ghost btn-sm">
            <FaArrowLeft />
          </Link>
        </div>
        <div className="flex-1">
          {otherUser && (
            <Link href={`/dancer/${otherUser._id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="avatar">
                <div className="w-10 h-10 rounded-full">
                  {otherUser.image ? (
                    <img src={otherUser.image} alt={otherUser.name} />
                  ) : (
                    <div className="bg-primary text-primary-content flex items-center justify-center text-lg font-bold">
                      {otherUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h2 className="font-semibold">{otherUser.name}</h2>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-base-content/60 mt-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => {
            const isMe = message.senderId === session?.user?.id;

            return (
              <div
                key={message._id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex gap-2 max-w-md ${isMe ? "flex-row-reverse" : ""}`}>
                  {/* Avatar */}
                  {!isMe && (
                    <div className="avatar flex-shrink-0">
                      <div className="w-8 h-8 rounded-full">
                        {message.senderImage ? (
                          <img src={message.senderImage} alt={message.senderName} />
                        ) : (
                          <div className="bg-primary text-primary-content flex items-center justify-center text-sm font-bold">
                            {message.senderName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div>
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        isMe
                          ? "bg-primary text-primary-content"
                          : "bg-base-300 text-base-content"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{message.text}</p>
                    </div>
                    <span className={`text-xs text-base-content/50 mt-1 block ${isMe ? "text-right" : ""}`}>
                      {formatTime(message.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-base-300 p-4">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            className="textarea textarea-bordered flex-1 resize-none min-h-[44px] max-h-32"
            placeholder="Type a message..."
            value={newMessage}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={sending}
          />
          <button
            onClick={handleSend}
            className="btn btn-primary btn-circle"
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <FaPaperPlane />
            )}
          </button>
        </div>
        <p className="text-xs text-base-content/50 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}


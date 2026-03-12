"use client";

import { useState, useEffect } from "react";
import { FaComments, FaSearch, FaUser, FaEnvelope, FaClock, FaEye } from "react-icons/fa";

interface User {
  _id: string;
  name: string;
  username?: string;
  image?: string;
  email?: string;
}

interface Conversation {
  _id: string;
  participants: User[];
  lastMessage: string;
  lastMessageAt: string;
  lastMessageBy?: User;
  createdAt: string;
}

interface Message {
  _id: string;
  conversationId: string;
  senderId: User;
  senderName: string;
  senderImage?: string;
  text: string;
  isRead: boolean;
  createdAt: string;
}

export default function AdminConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalConversations, setTotalConversations] = useState(0);
  
  // Selected conversation and messages
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showMessagesModal, setShowMessagesModal] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, [page, searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
        search: searchTerm,
      });

      const res = await fetch(`/api/admin/conversations?${params}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations);
        setTotalPages(data.pagination.pages);
        setTotalConversations(data.pagination.total);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/admin/conversations/${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleViewConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setShowMessagesModal(true);
    fetchMessages(conversation._id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getParticipantNames = (participants: User[]) => {
    return participants.map(p => p.name).join(" & ");
  };

  const getOtherParticipant = (participants: User[], currentUserId?: string) => {
    if (!currentUserId) return participants[0];
    return participants.find(p => p._id !== currentUserId) || participants[0];
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <FaComments className="text-primary text-3xl" />
          <div>
            <h1 className="text-3xl font-bold">Conversations Audit</h1>
            <p className="text-base-content/70">
              View and audit all conversations between users
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats shadow mb-6">
        <div className="stat">
          <div className="stat-title">Total Conversations</div>
          <div className="stat-value text-primary">{totalConversations}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Active Page</div>
          <div className="stat-value text-secondary">{page}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Total Pages</div>
          <div className="stat-value text-accent">{totalPages}</div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
          <input
            type="text"
            placeholder="Search by user name, username, or email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="input input-bordered w-full pl-10"
          />
        </div>
      </div>

      {/* Conversations Table */}
      <div className="bg-base-100 rounded-lg overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th className="w-8">#</th>
                <th className="min-w-[200px]">Participants</th>
                <th className="min-w-[200px]">Last Message</th>
                <th className="min-w-[120px]">Last Message By</th>
                <th className="min-w-[120px]">Last Activity</th>
                <th className="min-w-[100px]">Created</th>
                <th className="w-32 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8">
                    <span className="loading loading-spinner loading-lg"></span>
                  </td>
                </tr>
              ) : conversations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-base-content/60">
                    No conversations found
                  </td>
                </tr>
              ) : (
                conversations.map((conversation, index) => (
                  <tr 
                    key={conversation._id}
                    className="hover:bg-base-200 transition-colors"
                  >
                    <td>{(page - 1) * 50 + index + 1}</td>
                    <td>
                      <div className="flex flex-col gap-2">
                        {conversation.participants.map((participant) => (
                          <div key={participant._id} className="flex items-center gap-2">
                            <div className="avatar">
                              <div className="w-8 h-8 rounded-full">
                                {participant.image ? (
                                  <img src={participant.image} alt={participant.name} />
                                ) : (
                                  <div className="bg-primary text-primary-content w-full h-full flex items-center justify-center text-sm font-bold">
                                    {participant.name?.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="font-semibold text-sm">{participant.name}</div>
                              {participant.username && (
                                <div className="text-xs text-base-content/60 font-mono">
                                  @{participant.username}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="text-sm line-clamp-2">
                        {conversation.lastMessage || <span className="italic text-base-content/60">No messages yet</span>}
                      </div>
                    </td>
                    <td>
                      {conversation.lastMessageBy ? (
                        <div className="flex items-center gap-2">
                          <FaUser className="text-xs text-base-content/60" />
                          <span className="text-sm">{conversation.lastMessageBy.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm italic text-base-content/60">N/A</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-2 text-sm">
                        <FaClock className="text-xs text-base-content/60" />
                        {formatDateTime(conversation.lastMessageAt)}
                      </div>
                    </td>
                    <td className="text-sm">
                      {formatDate(conversation.createdAt)}
                    </td>
                    <td className="text-center">
                      <button
                        onClick={() => handleViewConversation(conversation)}
                        className="btn btn-primary btn-sm gap-2"
                      >
                        <FaEye />
                        View Messages
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4 bg-base-200">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="btn btn-sm"
            >
              Previous
            </button>
            <span className="flex items-center px-4 font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="btn btn-sm"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Messages Modal */}
      {showMessagesModal && selectedConversation && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="mb-4 pb-4 border-b border-base-300">
              <h3 className="font-bold text-xl mb-3 flex items-center gap-2">
                <FaComments className="text-primary" />
                Conversation Details
              </h3>
              
              {/* Participants */}
              <div className="flex items-center gap-4 mb-3">
                {selectedConversation.participants.map((participant) => (
                  <div key={participant._id} className="flex items-center gap-2">
                    <div className="avatar">
                      <div className="w-10 h-10 rounded-full">
                        {participant.image ? (
                          <img src={participant.image} alt={participant.name} />
                        ) : (
                          <div className="bg-primary text-primary-content w-full h-full flex items-center justify-center font-bold">
                            {participant.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold">{participant.name}</div>
                      <div className="text-xs text-base-content/60">
                        {participant.username ? `@${participant.username}` : participant.email}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Metadata */}
              <div className="flex gap-4 text-sm text-base-content/70">
                <div className="flex items-center gap-1">
                  <FaClock className="text-xs" />
                  <span>Created: {formatDate(selectedConversation.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <FaClock className="text-xs" />
                  <span>Last Activity: {formatDateTime(selectedConversation.lastMessageAt)}</span>
                </div>
              </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto mb-4">
              {loadingMessages ? (
                <div className="flex justify-center items-center h-full">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex justify-center items-center h-full text-base-content/60">
                  No messages in this conversation
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isFirstParticipant = message.senderId._id === selectedConversation.participants[0]._id;
                    
                    return (
                      <div
                        key={message._id}
                        className={`flex gap-3 ${isFirstParticipant ? '' : 'flex-row-reverse'}`}
                      >
                        {/* Avatar */}
                        <div className="avatar flex-shrink-0">
                          <div className="w-10 h-10 rounded-full">
                            {message.senderId.image ? (
                              <img src={message.senderId.image} alt={message.senderId.name} />
                            ) : (
                              <div className="bg-primary text-primary-content w-full h-full flex items-center justify-center font-bold">
                                {message.senderId.name?.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Message Content */}
                        <div className={`flex-1 ${isFirstParticipant ? '' : 'flex flex-col items-end'}`}>
                          <div className={`max-w-[70%] ${isFirstParticipant ? '' : 'text-right'}`}>
                            <div className="text-xs font-semibold text-base-content/70 mb-1">
                              {message.senderId.name}
                              {message.senderId.username && (
                                <span className="font-mono ml-1">@{message.senderId.username}</span>
                              )}
                            </div>
                            <div
                              className={`rounded-lg p-3 ${
                                isFirstParticipant
                                  ? 'bg-base-200'
                                  : 'bg-primary text-primary-content'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                            </div>
                            <div className="text-xs text-base-content/60 mt-1 flex items-center gap-2">
                              <FaClock className="text-[10px]" />
                              {formatDateTime(message.createdAt)}
                              {message.isRead && (
                                <span className="badge badge-success badge-xs">Read</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="modal-action mt-4 pt-4 border-t border-base-300">
              <button
                onClick={() => {
                  setShowMessagesModal(false);
                  setSelectedConversation(null);
                  setMessages([]);
                }}
                className="btn btn-ghost"
              >
                Close
              </button>
              <a
                href={`/messages?conversationId=${selectedConversation._id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary gap-2"
              >
                <FaEnvelope />
                Open in Messages
              </a>
            </div>
          </div>
          
          <div
            className="modal-backdrop"
            onClick={() => {
              setShowMessagesModal(false);
              setSelectedConversation(null);
              setMessages([]);
            }}
          />
        </div>
      )}
    </div>
  );
}


"use client";

import { useState, useEffect } from "react";
import { 
  FaLightbulb, 
  FaCheck, 
  FaTimes, 
  FaHourglass, 
  FaClock,
  FaFilter,
  FaSearch 
} from "react-icons/fa";

interface Suggestion {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  category: "feature" | "improvement" | "bug" | "other";
  suggestion: string;
  status: "pending" | "in-progress" | "completed" | "rejected";
  adminNotes?: string;
  completedAt?: string;
  notifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  pending: number;
  "in-progress": number;
  completed: number;
  rejected: number;
}

export default function SuggestionsAdminPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [stats, setStats] = useState<Stats>({
    pending: 0,
    "in-progress": 0,
    completed: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  const categoryEmoji: { [key: string]: string } = {
    feature: "✨",
    improvement: "🚀",
    bug: "🐛",
    other: "💭",
  };

  const statusColors: { [key: string]: string } = {
    pending: "badge-warning",
    "in-progress": "badge-info",
    completed: "badge-success",
    rejected: "badge-error",
  };

  const statusIcons: { [key: string]: any } = {
    pending: FaClock,
    "in-progress": FaHourglass,
    completed: FaCheck,
    rejected: FaTimes,
  };

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedStatus !== "all") params.append("status", selectedStatus);
      if (selectedCategory !== "all") params.append("category", selectedCategory);

      const response = await fetch(`/api/admin/suggestions?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setSuggestions(data.suggestions);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [selectedStatus, selectedCategory]);

  const handleStatusUpdate = async (suggestionId: string, newStatus: string) => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/suggestions/${suggestionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          adminNotes: adminNotes || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSelectedSuggestion(null);
        setAdminNotes("");
        fetchSuggestions();
        
        if (newStatus === "completed") {
          alert("✅ Suggestion marked as completed! User has been notified via email.");
        }
      }
    } catch (error) {
      console.error("Error updating suggestion:", error);
      alert("Failed to update suggestion");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FaLightbulb className="text-accent" />
          User Suggestions
        </h1>
        <p className="text-base-content/60 mt-2">
          Manage user feedback, feature requests, and bug reports
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { key: "pending", label: "Pending", icon: FaClock, color: "text-warning" },
          { key: "in-progress", label: "In Progress", icon: FaHourglass, color: "text-info" },
          { key: "completed", label: "Completed", icon: FaCheck, color: "text-success" },
          { key: "rejected", label: "Rejected", icon: FaTimes, color: "text-error" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.key} className="stat bg-base-100 rounded-lg shadow">
              <div className="stat-figure">
                <Icon className={`text-3xl ${stat.color}`} />
              </div>
              <div className="stat-title">{stat.label}</div>
              <div className="stat-value text-3xl">
                {stats[stat.key as keyof Stats]}
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex flex-wrap gap-4">
            {/* Status Filter */}
            <div className="form-control">
              <label className="label">
                <span className="label-text flex items-center gap-2">
                  <FaFilter /> Status
                </span>
              </label>
              <select
                className="select select-bordered select-sm"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="form-control">
              <label className="label">
                <span className="label-text flex items-center gap-2">
                  <FaSearch /> Category
                </span>
              </label>
              <select
                className="select select-bordered select-sm"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="feature">✨ Features</option>
                <option value="improvement">🚀 Improvements</option>
                <option value="bug">🐛 Bugs</option>
                <option value="other">💭 Other</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Suggestions List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body items-center text-center py-12">
            <FaLightbulb className="text-6xl text-base-content/20 mb-4" />
            <h3 className="text-xl font-bold">No suggestions found</h3>
            <p className="text-base-content/60">
              No suggestions match your current filters
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {suggestions.map((suggestion) => {
            const StatusIcon = statusIcons[suggestion.status];
            return (
              <div key={suggestion._id} className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">
                          {categoryEmoji[suggestion.category]}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold">{suggestion.userName}</span>
                            <span className="text-sm text-base-content/60">
                              ({suggestion.userEmail})
                            </span>
                            <span
                              className={`badge badge-sm ${
                                statusColors[suggestion.status]
                              } gap-1`}
                            >
                              <StatusIcon className="text-xs" />
                              {suggestion.status}
                            </span>
                            <span className="badge badge-sm badge-outline">
                              {suggestion.category}
                            </span>
                          </div>
                          <div className="text-xs text-base-content/50 mt-1">
                            {new Date(suggestion.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Suggestion Text */}
                      <div className="bg-base-200 p-4 rounded-lg mb-3">
                        <p className="whitespace-pre-wrap">{suggestion.suggestion}</p>
                      </div>

                      {/* Admin Notes */}
                      {suggestion.adminNotes && (
                        <div className="bg-info/10 p-3 rounded-lg mb-3">
                          <div className="text-xs font-semibold text-info mb-1">
                            Admin Notes:
                          </div>
                          <p className="text-sm">{suggestion.adminNotes}</p>
                        </div>
                      )}

                      {/* Completion Info */}
                      {suggestion.completedAt && (
                        <div className="text-xs text-base-content/60">
                          Completed: {new Date(suggestion.completedAt).toLocaleString()}
                          {suggestion.notifiedAt && " • User notified ✅"}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="dropdown dropdown-end">
                      <label tabIndex={0} className="btn btn-sm btn-ghost">
                        Actions
                      </label>
                      <ul
                        tabIndex={0}
                        className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 z-10"
                      >
                        {suggestion.status !== "pending" && (
                          <li>
                            <button
                              onClick={() =>
                                handleStatusUpdate(suggestion._id, "pending")
                              }
                            >
                              <FaClock /> Mark as Pending
                            </button>
                          </li>
                        )}
                        {suggestion.status !== "in-progress" && (
                          <li>
                            <button
                              onClick={() =>
                                handleStatusUpdate(suggestion._id, "in-progress")
                              }
                            >
                              <FaHourglass /> Mark as In Progress
                            </button>
                          </li>
                        )}
                        {suggestion.status !== "completed" && (
                          <li>
                            <button
                              onClick={() => {
                                setSelectedSuggestion(suggestion);
                                setAdminNotes(suggestion.adminNotes || "");
                              }}
                            >
                              <FaCheck /> Mark as Completed
                            </button>
                          </li>
                        )}
                        {suggestion.status !== "rejected" && (
                          <li>
                            <button
                              onClick={() =>
                                handleStatusUpdate(suggestion._id, "rejected")
                              }
                              className="text-error"
                            >
                              <FaTimes /> Reject
                            </button>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Completion Modal */}
      {selectedSuggestion && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">
              Mark as Completed & Notify User
            </h3>
            
            <div className="space-y-4">
              <div className="bg-base-200 p-3 rounded-lg">
                <div className="text-xs text-base-content/60 mb-1">Suggestion:</div>
                <p className="text-sm">{selectedSuggestion.suggestion}</p>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">
                    Admin Notes (optional - will be sent to user)
                  </span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-24"
                  placeholder="Add any notes about the implementation..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  disabled={updating}
                />
              </div>

              <div className="alert alert-info">
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
                  />
                </svg>
                <span className="text-xs">
                  The user will receive an email notification that their suggestion
                  has been implemented.
                </span>
              </div>
            </div>

            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setSelectedSuggestion(null);
                  setAdminNotes("");
                }}
                disabled={updating}
              >
                Cancel
              </button>
              <button
                className="btn btn-success"
                onClick={() =>
                  handleStatusUpdate(selectedSuggestion._id, "completed")
                }
                disabled={updating}
              >
                {updating ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Updating...
                  </>
                ) : (
                  <>
                    <FaCheck /> Mark Complete & Notify
                  </>
                )}
              </button>
            </div>
          </div>
          <div
            className="modal-backdrop"
            onClick={() => {
              if (!updating) {
                setSelectedSuggestion(null);
                setAdminNotes("");
              }
            }}
          />
        </div>
      )}
    </div>
  );
}


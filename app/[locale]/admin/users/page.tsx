"use client";

import { useState, useEffect } from "react";
import { FaUsers, FaSearch, FaCheck, FaTimes, FaInstagram, FaFacebook, FaTwitter, FaUserPlus, FaEnvelope, FaInfoCircle } from "react-icons/fa";

interface User {
  _id: string;
  name: string;
  username?: string;
  image?: string;
  sharedOnSocialMedia: boolean;
  isProfileComplete?: boolean;
  createdAt: string;
  reminderSent?: boolean;
  reminderSentAt?: string;
  userType?: "dancer" | "professional" | "both";
  city?: {
    _id: string;
    name: string;
    country?: {
      _id: string;
      name: string;
      code: string;
    };
  };
  onboardingSteps?: {
    nameDetails?: boolean;
    danceStyles?: boolean;
    username?: boolean;
    profilePic?: boolean;
    dateOfBirth?: boolean;
    bio?: boolean;
    dancingStartYear?: boolean;
    currentLocation?: boolean;
    citiesVisited?: boolean;
    anthem?: boolean;
    socialMedia?: boolean;
    danceRole?: boolean;
    gender?: boolean;
    nationality?: boolean;
    relationshipStatus?: boolean;
    teacherInfo?: boolean;
  };
}

interface City {
  _id: string;
  name: string;
  country?: {
    name: string;
    code: string;
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterShared, setFilterShared] = useState<"all" | "shared" | "not-shared">("all");
  const [showOnlyIncomplete, setShowOnlyIncomplete] = useState(false);
  const [showOnlyComplete, setShowOnlyComplete] = useState(false);
  const [filterCity, setFilterCity] = useState<string>(""); // City ID filter
  const [showInstagramWithImage, setShowInstagramWithImage] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [updatingUsers, setUpdatingUsers] = useState<Set<string>>(new Set());
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showMarkCompleteModal, setShowMarkCompleteModal] = useState(false);
  const [userToMarkComplete, setUserToMarkComplete] = useState<User | null>(null);
  const [markingComplete, setMarkingComplete] = useState(false);
  
  // Send reminder modal state
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [userToRemind, setUserToRemind] = useState<User | null>(null);
  const [sendingReminder, setSendingReminder] = useState(false);
  
  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [inviteError, setInviteError] = useState("");

  // Fetch cities on mount
  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      const res = await fetch("/api/admin/cities?limit=1000");
      if (res.ok) {
        const data = await res.json();
        setCities(data.cities);
      }
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, searchTerm, filterShared, showOnlyIncomplete, showOnlyComplete, filterCity, showInstagramWithImage]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "100",
        search: searchTerm,
      });

      // Add filter parameter for shared status
      if (filterShared === "shared") {
        params.append("filterShared", "true");
      } else if (filterShared === "not-shared") {
        params.append("filterShared", "false");
      }

      // Add filter parameter for profile completion
      if (showOnlyIncomplete) {
        params.append("filterProfileComplete", "false");
      } else if (showOnlyComplete) {
        params.append("filterProfileComplete", "true");
      }

      // Add city filter
      if (filterCity) {
        params.append("filterCity", filterCity);
      }

      // Add Instagram + custom image filter
      if (showInstagramWithImage) {
        params.append("filterInstagramWithImage", "true");
      }

      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotalPages(data.pagination.pages);
        setTotalUsers(data.pagination.total);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSharedStatus = async (userId: string, currentStatus: boolean) => {
    // Add to updating set
    setUpdatingUsers(prev => new Set(prev).add(userId));

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sharedOnSocialMedia: !currentStatus }),
      });

      if (res.ok) {
        // Update local state
        setUsers(prev =>
          prev.map(user =>
            user._id === userId
              ? { ...user, sharedOnSocialMedia: !currentStatus }
              : user
          )
        );
      } else {
        alert("Failed to update user status");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Error updating user status");
    } finally {
      // Remove from updating set
      setUpdatingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getMissingSteps = (user: User) => {
    // Check if user is professional-only
    const isProfessionalOnly = user.userType === "professional";
    
    // Base steps for everyone
    const baseStepLabels: Record<string, string> = {
      nameDetails: "Name & Details",
      username: "Username",
      profilePic: "Profile Picture",
      dateOfBirth: "Date of Birth",
      gender: "Gender",
      nationality: "Nationality",
      currentLocation: "Current Location",
      teacherInfo: "Professional Info",
    };
    
    // Dance-related mandatory steps (only for dancers)
    const danceStepLabels: Record<string, string> = {
      danceRole: "Dance Role",
    };
    
    // Optional steps (shown but not required for completion)
    const optionalStepLabels: Record<string, string> = {
      bio: "Bio",
      danceStyles: "Dance Styles",
      dancingStartYear: "Dancing Start Year",
      citiesVisited: "Cities Visited",
      anthem: "Dance Anthem",
      socialMedia: "Social Media",
      relationshipStatus: "Relationship Status",
    };
    
    // Combine based on user type
    const mandatoryStepLabels = isProfessionalOnly
      ? baseStepLabels
      : { ...baseStepLabels, ...danceStepLabels };
    
    // All steps (mandatory + optional)
    const allStepLabels = { ...mandatoryStepLabels, ...optionalStepLabels };

    const missing: string[] = [];
    const completed: string[] = [];

    if (user.onboardingSteps) {
      Object.entries(allStepLabels).forEach(([key, label]) => {
        if (user.onboardingSteps?.[key as keyof typeof user.onboardingSteps]) {
          completed.push(label);
        } else {
          // Only show as missing if it's a mandatory step for this user type
          if (key in mandatoryStepLabels) {
            missing.push(label);
          }
        }
      });
    } else {
      // If no onboarding steps data, consider all mandatory steps as missing
      return { missing: Object.values(mandatoryStepLabels), completed: [] };
    }

    return { missing, completed };
  };

  const handleShowDetails = (user: User) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const handleMarkCompleteClick = (user: User) => {
    setUserToMarkComplete(user);
    setShowMarkCompleteModal(true);
  };

  const handleMarkCompleteConfirm = async () => {
    if (!userToMarkComplete) return;

    setMarkingComplete(true);
    try {
      const res = await fetch(`/api/admin/users/${userToMarkComplete._id}/mark-complete`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        // Update local state
        setUsers(prev =>
          prev.map(user =>
            user._id === userToMarkComplete._id
              ? { ...user, isProfileComplete: true }
              : user
          )
        );
        setShowMarkCompleteModal(false);
        setUserToMarkComplete(null);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to mark profile as complete");
      }
    } catch (error) {
      console.error("Error marking profile complete:", error);
      alert("Error marking profile as complete");
    } finally {
      setMarkingComplete(false);
    }
  };

  const handleSendReminderClick = (user: User) => {
    setUserToRemind(user);
    setShowReminderModal(true);
  };

  const handleSendReminderConfirm = async () => {
    if (!userToRemind) return;

    setSendingReminder(true);
    try {
      const res = await fetch(`/api/admin/users/${userToRemind._id}/send-reminder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        // Update local state to mark reminder as sent
        setUsers(prev =>
          prev.map(user =>
            user._id === userToRemind._id
              ? { ...user, reminderSent: true, reminderSentAt: new Date().toISOString() }
              : user
          )
        );
        setShowReminderModal(false);
        setUserToRemind(null);
        alert("Reminder email sent successfully!");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to send reminder");
      }
    } catch (error) {
      console.error("Error sending reminder:", error);
      alert("Error sending reminder");
    } finally {
      setSendingReminder(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail || !inviteEmail.includes("@")) {
      setInviteError("Please enter a valid email address");
      return;
    }

    setInviting(true);
    setInviteError("");
    setInviteSuccess(false);

    try {
      const res = await fetch("/api/admin/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });

      const data = await res.json();

      if (res.ok) {
        setInviteSuccess(true);
        setInviteEmail("");
        // Refresh user list
        setTimeout(() => {
          fetchUsers();
          setShowInviteModal(false);
          setInviteSuccess(false);
        }, 2000);
      } else {
        setInviteError(data.error || "Failed to invite user");
      }
    } catch (error) {
      console.error("Error inviting user:", error);
      setInviteError("Error sending invite");
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3 mb-2">
            <FaUsers className="text-primary text-3xl" />
            <div>
              <h1 className="text-3xl font-bold">Social Media Tracker</h1>
              <p className="text-base-content/70">
                Track which users you&apos;ve shared on social media
              </p>
            </div>
          </div>
          <button 
            onClick={() => setShowInviteModal(true)}
            className="btn btn-primary gap-2"
          >
            <FaUserPlus />
            Invite User
          </button>
        </div>
        <div className="flex gap-2 mt-4 text-sm">
          <div className="badge badge-outline gap-1">
            <FaInstagram /> Instagram
          </div>
          <div className="badge badge-outline gap-1">
            <FaFacebook /> Facebook
          </div>
          <div className="badge badge-outline gap-1">
            <FaTwitter /> Twitter/X
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats shadow mb-6">
        <div className="stat">
          <div className="stat-title">Total Users</div>
          <div className="stat-value text-primary">{totalUsers}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Shared</div>
          <div className="stat-value text-success">
            {users.filter(u => u.sharedOnSocialMedia).length}
          </div>
        </div>
        <div className="stat">
          <div className="stat-title">Not Shared</div>
          <div className="stat-value text-warning">
            {users.filter(u => !u.sharedOnSocialMedia).length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
          <input
            type="text"
            placeholder="Search by name or username..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="input input-bordered w-full pl-10"
          />
        </div>

        {/* Filter Tabs */}
        <div className="tabs tabs-boxed">
          <button
            className={`tab ${filterShared === "all" ? "tab-active" : ""}`}
            onClick={() => {
              setFilterShared("all");
              setPage(1);
            }}
          >
            All Users
          </button>
          <button
            className={`tab ${filterShared === "shared" ? "tab-active" : ""}`}
            onClick={() => {
              setFilterShared("shared");
              setPage(1);
            }}
          >
            Shared ✅
          </button>
          <button
            className={`tab ${filterShared === "not-shared" ? "tab-active" : ""}`}
            onClick={() => {
              setFilterShared("not-shared");
              setPage(1);
            }}
          >
            Not Shared
          </button>
        </div>

        {/* Filter Checkboxes */}
        <div className="space-y-2">
          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-3">
              <input
                type="checkbox"
                checked={showOnlyComplete}
                onChange={(e) => {
                  setShowOnlyComplete(e.target.checked);
                  if (e.target.checked) setShowOnlyIncomplete(false); // Uncheck incomplete
                  setPage(1);
                }}
                className="checkbox checkbox-success"
              />
              <span className="label-text font-medium">
                Show only users with complete profiles
              </span>
            </label>
          </div>
          
          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-3">
              <input
                type="checkbox"
                checked={showOnlyIncomplete}
                onChange={(e) => {
                  setShowOnlyIncomplete(e.target.checked);
                  if (e.target.checked) setShowOnlyComplete(false); // Uncheck complete
                  setPage(1);
                }}
                className="checkbox checkbox-error"
              />
              <span className="label-text font-medium">
                Show only users with incomplete profiles
              </span>
            </label>
          </div>

          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-3">
              <input
                type="checkbox"
                checked={showInstagramWithImage}
                onChange={(e) => {
                  setShowInstagramWithImage(e.target.checked);
                  setPage(1);
                }}
                className="checkbox checkbox-primary"
              />
              <span className="label-text font-medium flex items-center gap-2">
                <FaInstagram className="text-pink-600" />
                Show only users with Instagram + custom image
              </span>
            </label>
          </div>

          {/* City Filter */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Filter by City</span>
            </label>
            <select
              value={filterCity}
              onChange={(e) => {
                setFilterCity(e.target.value);
                setPage(1);
              }}
              className="select select-bordered w-full"
            >
              <option value="">All Cities</option>
              {cities.map((city) => (
                <option key={city._id} value={city._id}>
                  {city.name}{city.country ? `, ${city.country.name}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-base-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-zebra table-compact w-full text-sm">
            <thead>
              <tr>
                <th className="w-8 text-xs">#</th>
                <th className="min-w-[120px] max-w-[150px]">User</th>
                <th className="min-w-[100px]">Username</th>
                <th className="min-w-[100px]">Location</th>
                <th className="min-w-[120px]">Status</th>
                <th className="min-w-[80px] text-xs">Reminder</th>
                <th className="min-w-[80px] text-xs">Joined</th>
                <th className="min-w-[100px] text-xs">Social</th>
                <th className="w-16 text-xs">Edit</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-8">
                    <span className="loading loading-spinner loading-lg"></span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-base-content/60">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <tr 
                    key={user._id} 
                    className="cursor-pointer hover:bg-base-300 transition-colors"
                    onClick={() => window.open(`/dancer/${user._id}`, '_blank')}
                  >
                    <td>{(page - 1) * 100 + index + 1}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar">
                          <div className="w-12 h-12 rounded-full">
                            {user.image ? (
                              <img src={user.image} alt={user.name} />
                            ) : (
                              <div className="bg-primary text-primary-content w-full h-full flex items-center justify-center text-xl font-bold">
                                {user.name?.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="font-semibold">{user.name}</span>
                      </div>
                    </td>
                    <td>
                      {user.username ? (
                        <span className="font-mono text-sm">@{user.username}</span>
                      ) : (
                        <span className="text-base-content/50 text-sm italic">No username</span>
                      )}
                    </td>
                    <td>
                      {user.city ? (
                        <div className="text-sm">
                          <div className="font-medium">{user.city.name}</div>
                          {user.city.country && (
                            <div className="text-base-content/60 text-xs">
                              {user.city.country.name}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-base-content/50 text-sm italic">No location</span>
                      )}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        {user.isProfileComplete ? (
                          <span className="badge badge-success gap-1">
                            <FaCheck className="text-xs" /> Complete
                          </span>
                        ) : (
                          <>
                            <span className="badge badge-warning gap-1">
                              <FaTimes className="text-xs" /> Incomplete
                            </span>
                            <button
                              onClick={() => handleShowDetails(user)}
                              className="btn btn-ghost btn-xs gap-1 text-info"
                              title="View missing steps"
                            >
                              <FaInfoCircle /> Details
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="text-xs">
                      {!user.isProfileComplete && (
                        user.reminderSent ? (
                          <div className="flex flex-col items-start">
                            <span className="badge badge-success badge-xs gap-1">
                              <FaCheck className="text-[8px]" /> Sent
                            </span>
                            <span className="text-[10px] text-base-content/60 mt-0.5">
                              {user.reminderSentAt ? formatDate(user.reminderSentAt) : ''}
                            </span>
                          </div>
                        ) : (
                          <span className="badge badge-ghost badge-xs gap-1">
                            <FaTimes className="text-[8px]" /> Not sent
                          </span>
                        )
                      )}
                    </td>
                    <td className="text-xs">{formatDate(user.createdAt)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={user.sharedOnSocialMedia}
                          onChange={() => toggleSharedStatus(user._id, user.sharedOnSocialMedia)}
                          disabled={updatingUsers.has(user._id)}
                          className="checkbox checkbox-xs checkbox-success"
                        />
                        {updatingUsers.has(user._id) ? (
                          <span className="loading loading-spinner loading-xs"></span>
                        ) : user.sharedOnSocialMedia ? (
                          <FaCheck className="text-success text-xs" />
                        ) : (
                          <FaTimes className="text-base-content/30 text-xs" />
                        )}
                      </div>
                    </td>
                    <td onClick={(e) => e.stopPropagation()} className="text-center">
                      <a
                        href={`/admin/users/${user._id}/edit`}
                        className="btn btn-warning btn-xs"
                      >
                        Edit
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="btn btn-sm"
            >
              Previous
            </button>
            <span className="flex items-center px-4">
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

        {/* Total count */}
        <div className="text-center text-sm text-base-content/60 pb-4">
          Showing {(page - 1) * 100 + 1} - {Math.min(page * 100, totalUsers)} of {totalUsers} users
        </div>
      </div>

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <FaUserPlus className="text-primary" />
              Invite New User
            </h3>

            <p className="text-sm text-base-content/70 mb-4">
              Enter the user&apos;s email address. They will receive an invitation email with a login link.
            </p>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Email Address</span>
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={inviteEmail}
                  onChange={(e) => {
                    setInviteEmail(e.target.value);
                    setInviteError("");
                  }}
                  className="input input-bordered w-full pl-10"
                  disabled={inviting}
                />
              </div>
            </div>

            {inviteError && (
              <div className="alert alert-error mt-4">
                <FaTimes />
                <span>{inviteError}</span>
              </div>
            )}

            {inviteSuccess && (
              <div className="alert alert-success mt-4">
                <FaCheck />
                <span>Invite sent successfully! 🎉</span>
              </div>
            )}

            <div className="modal-action">
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteEmail("");
                  setInviteError("");
                  setInviteSuccess(false);
                }}
                className="btn btn-ghost"
                disabled={inviting}
              >
                Cancel
              </button>
              <button
                onClick={handleInviteUser}
                className="btn btn-primary gap-2"
                disabled={inviting || !inviteEmail}
              >
                {inviting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Sending...
                  </>
                ) : (
                  <>
                    <FaEnvelope />
                    Send Invite
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => !inviting && setShowInviteModal(false)} />
        </div>
      )}

      {/* Profile Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">
              Profile Completion Details: {selectedUser.name}
            </h3>

            {(() => {
              const { missing, completed } = getMissingSteps(selectedUser);
              const completionPercentage = Math.round((completed.length / (completed.length + missing.length)) * 100);

              return (
                <>
                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Profile Completion</span>
                      <span className="font-bold">{completionPercentage}%</span>
                    </div>
                    <progress 
                      className="progress progress-primary w-full" 
                      value={completionPercentage} 
                      max="100"
                    ></progress>
                    <div className="text-xs text-base-content/60 mt-1">
                      {completed.length} of {completed.length + missing.length} steps completed
                    </div>
                  </div>

                  {/* Reminder Status */}
                  {!selectedUser.isProfileComplete && (
                    <div className="mb-6 p-4 rounded-lg bg-base-300">
                      <div className="flex items-center gap-2 mb-2">
                        <FaEnvelope className={selectedUser.reminderSent ? "text-success" : "text-base-content/60"} />
                        <span className="font-semibold">Reminder Status</span>
                      </div>
                      {selectedUser.reminderSent ? (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="badge badge-success gap-1">
                            <FaCheck className="text-xs" /> Reminder Sent
                          </span>
                          <span className="text-base-content/70">
                            on {selectedUser.reminderSentAt ? formatDate(selectedUser.reminderSentAt) : 'N/A'}
                          </span>
                        </div>
                      ) : (
                        <div className="text-sm text-base-content/70">
                          <span className="badge badge-ghost gap-1">
                            <FaTimes className="text-xs" /> No reminder sent yet
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Missing Steps */}
                  {missing.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-error mb-2 flex items-center gap-2">
                        <FaTimes /> Missing Steps ({missing.length})
                      </h4>
                      <div className="space-y-1">
                        {missing.map((step, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <FaTimes className="text-error text-xs" />
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Completed Steps */}
                  {completed.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-success mb-2 flex items-center gap-2">
                        <FaCheck /> Completed Steps ({completed.length})
                      </h4>
                      <div className="space-y-1">
                        {completed.map((step, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-base-content/70">
                            <FaCheck className="text-success text-xs" />
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}

            <div className="modal-action">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="btn btn-ghost"
              >
                Close
              </button>
              {!selectedUser.isProfileComplete && (
                <>
                  {!selectedUser.reminderSent && (
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        handleSendReminderClick(selectedUser);
                      }}
                      className="btn btn-primary gap-1"
                    >
                      <FaEnvelope /> Send Reminder
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleMarkCompleteClick(selectedUser);
                    }}
                    className="btn btn-success gap-1"
                  >
                    <FaCheck /> Mark as Complete
                  </button>
                </>
              )}
              <a
                href={`/dancer/${selectedUser._id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-info gap-1"
              >
                View Profile
              </a>
            </div>
          </div>
          
          <div className="modal-backdrop" onClick={() => setShowDetailsModal(false)} />
        </div>
      )}

      {/* Mark Complete Confirmation Modal */}
      {showMarkCompleteModal && userToMarkComplete && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">
              Mark Profile as Complete?
            </h3>
            
            <div className="space-y-4">
              <div className="alert alert-info">
                <FaCheck />
                <div>
                  <p className="font-semibold">Confirm Action</p>
                  <p className="text-sm">
                    Are you sure you want to mark <strong>{userToMarkComplete.name}</strong>&apos;s profile as complete?
                  </p>
                </div>
              </div>

              <p className="text-sm text-base-content/70">
                This will set <code className="bg-base-300 px-1 rounded">isProfileComplete = true</code> for this user, even if they haven&apos;t completed all onboarding steps.
              </p>
            </div>

            <div className="modal-action">
              <button
                onClick={() => {
                  setShowMarkCompleteModal(false);
                  setUserToMarkComplete(null);
                }}
                className="btn btn-ghost"
                disabled={markingComplete}
              >
                Cancel
              </button>
              <button
                onClick={handleMarkCompleteConfirm}
                className="btn btn-success"
                disabled={markingComplete}
              >
                {markingComplete ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Marking...
                  </>
                ) : (
                  <>
                    <FaCheck /> Confirm
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div 
            className="modal-backdrop" 
            onClick={() => {
              if (!markingComplete) {
                setShowMarkCompleteModal(false);
                setUserToMarkComplete(null);
              }
            }}
          />
        </div>
      )}

      {/* Send Reminder Modal */}
      {showReminderModal && userToRemind && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">
              Send Reminder Email?
            </h3>
            
            <div className="space-y-4">
              <div className="alert alert-info">
                <FaEnvelope />
                <div>
                  <p className="font-semibold">Confirm Action</p>
                  <p className="text-sm">
                    Send a reminder email to <strong>{userToRemind.name}</strong> to complete their profile?
                  </p>
                </div>
              </div>

              {(() => {
                const { missing } = getMissingSteps(userToRemind);
                return (
                  <div className="text-sm text-base-content/70">
                    <p className="font-medium mb-2">The email will include:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Progress percentage</li>
                      <li>Missing steps ({missing.length})</li>
                      <li>Link to complete profile</li>
                    </ul>
                  </div>
                );
              })()}

              {userToRemind.reminderSent && (
                <div className="alert alert-warning">
                  <FaTimes />
                  <div>
                    <p className="font-semibold">Already Sent</p>
                    <p className="text-sm">
                      A reminder was already sent on {userToRemind.reminderSentAt ? formatDate(userToRemind.reminderSentAt) : 'a previous date'}.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-action">
              <button
                onClick={() => {
                  setShowReminderModal(false);
                  setUserToRemind(null);
                }}
                className="btn btn-ghost"
                disabled={sendingReminder}
              >
                Cancel
              </button>
              <button
                onClick={handleSendReminderConfirm}
                className="btn btn-primary"
                disabled={sendingReminder}
              >
                {sendingReminder ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Sending...
                  </>
                ) : (
                  <>
                    <FaEnvelope /> Send Reminder
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div 
            className="modal-backdrop" 
            onClick={() => {
              if (!sendingReminder) {
                setShowReminderModal(false);
                setUserToRemind(null);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { FaTrash, FaCheckCircle, FaSpinner, FaClock } from "react-icons/fa";

interface CleanupResult {
  success: boolean;
  task?: string;
  message?: string;
  usersAffected?: number;
  snapshotsDeleted?: number;
  notificationsDeleted?: number;
  results?: Array<{ task: string; affected?: number; deleted?: number }>;
}

interface TaskStatus {
  taskName: string;
  lastRunAt: string;
  lastRunBy: string;
  status: string;
  details: any;
}

export default function AdminCleanupPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<CleanupResult | null>(null);
  const [taskStatuses, setTaskStatuses] = useState<TaskStatus[]>([]);

  // Fetch task statuses on mount
  useEffect(() => {
    fetchTaskStatuses();
  }, []);

  const fetchTaskStatuses = async () => {
    try {
      const response = await fetch("/api/admin/task-status");
      const data = await response.json();
      if (data.success) {
        setTaskStatuses(data.tasks);
      }
    } catch (error) {
      console.error("Error fetching task statuses:", error);
    }
  };

  const getTaskStatus = (taskId: string) => {
    return taskStatuses.find(t => t.taskName === taskId || t.taskName === "all-cleanup-tasks");
  };

  const formatLastRun = (lastRunAt: string) => {
    const date = new Date(lastRunAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const runCleanup = async (task: string) => {
    if (!confirm(`Are you sure you want to run cleanup for: ${task}?`)) {
      return;
    }

    setLoading(task);
    setResults(null);

    try {
      const response = await fetch("/api/admin/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task }),
      });

      const data = await response.json();

      if (response.ok) {
        setResults(data);
        // Refresh task statuses after cleanup
        fetchTaskStatuses();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Cleanup error:", error);
      alert("Failed to run cleanup task");
    } finally {
      setLoading(null);
    }
  };

  const cleanupOrphanedAccounts = async () => {
    if (!confirm('Clean up orphaned OAuth accounts? (Accounts where user was deleted)')) {
      return;
    }

    setLoading('orphaned-accounts');
    setResults(null);

    try {
      const response = await fetch("/api/admin/cleanup-orphaned-accounts", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setResults(data);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Cleanup error:", error);
      alert("Failed to cleanup orphaned accounts");
    } finally {
      setLoading(null);
    }
  };

  const cleanupTasks = [
    {
      id: "old-trips",
      name: "Old Trips",
      description: "Remove trips that ended 30+ days ago",
      icon: "✈️",
      color: "btn-primary",
    },
    {
      id: "orphaned-friend-requests",
      name: "Orphaned Friend Requests",
      description: "Remove friend requests from deleted users",
      icon: "👥",
      color: "btn-accent",
    },
    {
      id: "old-snapshots",
      name: "Old Leaderboard Snapshots",
      description: "Delete snapshots older than 12 weeks",
      icon: "📊",
      color: "btn-warning",
    },
    {
      id: "old-notifications",
      name: "Old Notifications",
      description: "Delete read notifications older than 30 days",
      icon: "🔔",
      color: "btn-info",
    },
    {
      id: "all",
      name: "Run All Cleanups",
      description: "Execute all cleanup tasks at once",
      icon: "🧹",
      color: "btn-success",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Database Cleanup</h1>
        <p className="text-base-content/70">
          Maintain database health by removing old or orphaned data
        </p>
      </div>

      {/* Snapshot Leaderboards Last Run */}
      {taskStatuses.find(t => t.taskName === "snapshot-leaderboards") && (
        <div className="alert mb-6">
          <FaClock className="text-xl" />
          <div className="flex-1">
            <h3 className="font-bold">📊 Snapshot Leaderboards</h3>
            <div className="text-sm">
              Last run: {formatLastRun(taskStatuses.find(t => t.taskName === "snapshot-leaderboards")!.lastRunAt)}
              {" by " + taskStatuses.find(t => t.taskName === "snapshot-leaderboards")!.lastRunBy}
            </div>
          </div>
        </div>
      )}

      {/* Results Card */}
      {results && (
        <div className="alert alert-success mb-6">
          <FaCheckCircle className="text-2xl" />
          <div className="flex-1">
            <h3 className="font-bold">{results.message || 'Operation completed successfully'}</h3>
            {results.results ? (
              <div className="text-sm mt-2">
                {results.results.map((r, i) => (
                  <div key={i}>
                    • {r.task}: {r.affected !== undefined ? `${r.affected} users affected` : `${r.deleted} snapshots deleted`}
                  </div>
                ))}
              </div>
            ) : results.usersAffected !== undefined ? (
              <div className="text-sm">
                {results.usersAffected} users affected
              </div>
            ) : results.snapshotsDeleted !== undefined ? (
              <div className="text-sm">
                {results.snapshotsDeleted} snapshots deleted
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Special Cleanup: Orphaned OAuth Accounts */}
      <div className="alert alert-warning mb-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="stroke-current shrink-0 h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div className="flex-1">
          <h3 className="font-bold">🔑 Fix Sign-In Issues</h3>
          <div className="text-sm">
            Clean up orphaned OAuth accounts (Google, Email) from deleted users. 
            Run this if users cannot sign in after deleting their account.
          </div>
        </div>
        <button
          onClick={cleanupOrphanedAccounts}
          disabled={loading !== null}
          className={`btn btn-warning btn-sm gap-2 ${
            loading === 'orphaned-accounts' ? 'loading' : ''
          }`}
        >
          {loading === 'orphaned-accounts' ? (
          <>
              <FaSpinner className="animate-spin" />
              Cleaning...
            </>
          ) : (
            <>
              <FaTrash />
              Clean Up Now
            </>
          )}
        </button>
      </div>

      {/* Cleanup Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cleanupTasks.map((task) => {
          const taskStatus = getTaskStatus(task.id);
          return (
            <div key={task.id} className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <div className="flex items-start gap-3">
                  <div className="text-4xl">{task.icon}</div>
                  <div className="flex-1">
                    <h2 className="card-title">{task.name}</h2>
                    <p className="text-sm text-base-content/70 mb-2">
                      {task.description}
                    </p>

                    {/* Last Run Info */}
                    {taskStatus && (
                      <div className="flex items-center gap-2 text-xs text-base-content/60 mb-3">
                        <FaClock className="w-3 h-3" />
                        <span>Last run: {formatLastRun(taskStatus.lastRunAt)}</span>
                      </div>
                    )}

                    <button
                      onClick={() => runCleanup(task.id)}
                      disabled={loading !== null}
                      className={`btn ${task.color} btn-sm gap-2 ${
                        loading === task.id ? "loading" : ""
                      }`}
                    >
                      {loading === task.id ? (
                        <>
                          <FaSpinner className="animate-spin" />
                          Running...
                        </>
                      ) : (
                        <>
                          <FaTrash />
                          Run Cleanup
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Section */}
      <div className="alert alert-info mt-8">
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
          <h3 className="font-bold">Cleanup Information</h3>
          <div className="text-xs">
            • <strong>Recommended Schedule:</strong> Monthly (1st of month at 2:00 AM)
            <br />
            • Cleanup tasks can be run manually or automated via cron/Lambda
            <br />
            • Safe to run multiple times - idempotent operations
            <br />
            • API endpoint: POST /api/admin/cleanup (admin auth required)
          </div>
        </div>
      </div>

      {/* API Documentation */}
      <div className="mt-6 p-4 bg-base-200 rounded-lg">
        <h3 className="font-bold mb-2">API Usage (Lambda/Cron)</h3>
        <pre className="text-xs bg-base-300 p-3 rounded overflow-x-auto">
          {`curl -X POST https://dancecircle.co/api/admin/cleanup \\
  -H "Content-Type: application/json" \\
  -H "Cookie: your-admin-session-cookie" \\
  -d '{"task": "all"}'

# Or specific tasks: "old-trips", "orphaned-friend-requests", "old-snapshots"`}
        </pre>
      </div>
    </div>
  );
}


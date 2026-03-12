"use client";

import { useState } from "react";
import { FaCheckCircle, FaSpinner, FaCamera, FaEnvelope, FaFlask } from "react-icons/fa";

interface DigestResult {
  success: boolean;
  message?: string;
  status?: string;
  snapshots?: number;
  totalUsers?: number;
  emailsSent?: number;
  emailsSkipped?: number;
  emailsFailed?: number;
  timestamp?: string;
  recipient?: string;
  digestData?: any;
  note?: string;
}

export default function AdminDigestPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<DigestResult | null>(null);

  const snapshotLeaderboards = async () => {
    if (!confirm("Take a snapshot of all leaderboards? This should be done weekly.")) {
      return;
    }

    setLoading("snapshot");
    setResults(null);

    try {
      const response = await fetch("/api/admin/snapshot-leaderboards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (response.ok) {
        setResults(data);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Snapshot error:", error);
      alert("Failed to snapshot leaderboards");
    } finally {
      setLoading(null);
    }
  };

  const sendWeeklyDigest = async () => {
    if (!confirm("Send weekly digest emails to all active users? Emails will be sent in the background.")) {
      return;
    }

    setLoading("weekly-digest");
    setResults(null);

    try {
      const response = await fetch("/api/cron/weekly-digest", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResults(data);
        // Show success message with instructions
        alert(`✅ Weekly digest job started!\n\n${data.totalUsers} users will be processed.\n\nEmails are being sent in the background. Check Vercel logs to monitor progress.`);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Weekly digest error:", error);
      alert("Failed to send weekly digest");
    } finally {
      setLoading(null);
    }
  };

  const testWeeklyDigest = async () => {
    if (!confirm("Send a test weekly digest email to your admin email?")) {
      return;
    }

    setLoading("test-digest");
    setResults(null);

    try {
      const response = await fetch("/api/admin/test-weekly-digest", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResults(data);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Test digest error:", error);
      alert("Failed to send test email");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Weekly Digest</h1>
        <p className="text-base-content/70">
          Manage leaderboard snapshots and send weekly digest emails
        </p>
      </div>

      {/* Results Card */}
      {results && (
        <div className="alert alert-success mb-6">
          <FaCheckCircle className="text-2xl" />
          <div className="flex-1">
            <h3 className="font-bold">{results.message || 'Operation completed successfully'}</h3>
            {results.snapshots !== undefined ? (
              <div className="text-sm">
                {results.snapshots} snapshots created
              </div>
            ) : results.recipient ? (
              <div className="text-sm mt-2">
                <div>📧 Test email sent to: <strong>{results.recipient}</strong></div>
                {results.digestData && (
                  <div className="mt-2 text-xs opacity-70">
                    <div>Profile views: {results.digestData.profileViews}</div>
                    <div>New likes: {results.digestData.newLikes}</div>
                    <div>Trip overlaps: {results.digestData.tripOverlaps?.length || 0}</div>
                  </div>
                )}
              </div>
            ) : results.status === 'processing' ? (
              <div className="text-sm mt-2">
                <div>🚀 <strong>Weekly digest job started!</strong></div>
                <div className="mt-1">{results.totalUsers} users will be processed in the background</div>
                {results.note && <div className="mt-1 text-xs opacity-70">{results.note}</div>}
              </div>
            ) : results.emailsSent !== undefined ? (
              <div className="text-sm mt-2">
                <div>📧 Emails sent: <strong>{results.emailsSent}</strong></div>
                <div>⏭️ Skipped (no activity): <strong>{results.emailsSkipped}</strong></div>
                {results.emailsFailed ? <div>❌ Failed: <strong>{results.emailsFailed}</strong></div> : null}
                <div className="mt-1 text-xs opacity-70">Total active users: {results.totalUsers}</div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Action Cards */}
      <div className="space-y-6">
        {/* Test Button */}
        <div className="card bg-gradient-to-br from-yellow-500/20 to-orange-500/20 shadow-xl border-2 border-yellow-500/30">
          <div className="card-body">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-500 text-white">
                <FaFlask />
              </div>
              <div className="flex-1">
                <h2 className="card-title flex items-center gap-2">
                  <FaFlask className="text-yellow-400" />
                  Test Weekly Digest
                </h2>
                <p className="text-sm text-base-content/70 mb-4">
                  Send a test weekly digest email <strong>only to your admin email</strong> (mr.bonilla51@gmail.com). Safe to use anytime for testing.
                </p>

                <button
                  onClick={testWeeklyDigest}
                  disabled={loading !== null}
                  className={`btn btn-warning btn-sm gap-2 ${
                    loading === "test-digest" ? "loading" : ""
                  }`}
                >
                  {loading === "test-digest" ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Sending Test...
                    </>
                  ) : (
                    <>
                      <FaFlask />
                      Send Test Email
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Step 1: Snapshot */}
        <div className="card bg-gradient-to-br from-purple-500/20 to-pink-500/20 shadow-xl border-2 border-purple-500/30">
          <div className="card-body">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-500 text-white font-bold">
                1
              </div>
              <div className="flex-1">
                <h2 className="card-title flex items-center gap-2">
                  <FaCamera className="text-purple-400" />
                  Snapshot Leaderboards
                </h2>
                <p className="text-sm text-base-content/70 mb-4">
                  Take a snapshot of all current leaderboard rankings. Run this <strong>first</strong> before sending the weekly digest to track rank changes.
                </p>

                <div className="bg-base-100/50 p-3 rounded-lg mb-4 text-sm">
                  <div className="font-semibold mb-1">📋 What it does:</div>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Captures top 100 users per leaderboard</li>
                    <li>Stores rankings with scores</li>
                    <li>Enables week-over-week comparison</li>
                  </ul>
                </div>

                <button
                  onClick={snapshotLeaderboards}
                  disabled={loading !== null}
                  className={`btn btn-secondary btn-sm gap-2 ${
                    loading === "snapshot" ? "loading" : ""
                  }`}
                >
                  {loading === "snapshot" ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Snapshotting...
                    </>
                  ) : (
                    <>
                      <FaCamera />
                      Take Snapshot
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Send Digest */}
        <div className="card bg-gradient-to-br from-green-500/20 to-blue-500/20 shadow-xl border-2 border-green-500/30">
          <div className="card-body">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500 text-white font-bold">
                2
              </div>
              <div className="flex-1">
                <h2 className="card-title flex items-center gap-2">
                  <FaEnvelope className="text-green-400" />
                  Send Weekly Digest
                </h2>
                <p className="text-sm text-base-content/70 mb-4">
                  Send personalized weekly digest emails to all active users. Includes profile activity, leaderboard changes, friend updates, and trip overlaps.
                </p>

                <div className="bg-base-100/50 p-3 rounded-lg mb-4 text-sm">
                  <div className="font-semibold mb-1">✉️ Email includes:</div>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>📊 Leaderboard rank changes</li>
                    <li>👀 Profile views & new likes</li>
                    <li>👥 Friend activity</li>
                    <li>✈️ Trip overlaps</li>
                  </ul>
                </div>

                <button
                  onClick={sendWeeklyDigest}
                  disabled={loading !== null}
                  className={`btn btn-success btn-sm gap-2 ${
                    loading === "weekly-digest" ? "loading" : ""
                  }`}
                >
                  {loading === "weekly-digest" ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <FaEnvelope />
                      Send Digest
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
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
          <h3 className="font-bold">Automation Schedule</h3>
          <div className="text-xs">
            • <strong>Sunday 11:59 PM:</strong> Snapshot leaderboards (step 1)
            <br />
            • <strong>Monday 9:00 AM:</strong> Send weekly digest emails (step 2)
            <br />
            • Manual triggering is safe for testing - operations are idempotent
          </div>
        </div>
      </div>

      {/* API Documentation */}
      <div className="mt-6 p-4 bg-base-200 rounded-lg">
        <h3 className="font-bold mb-2">API Usage (Cron/Lambda)</h3>
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold mb-1">1. Sunday 11:59 PM - Snapshot Leaderboards:</p>
            <pre className="text-xs bg-base-300 p-3 rounded overflow-x-auto">
              {`curl -X POST https://dancecircle.co/api/admin/snapshot-leaderboards \\
  -H "Content-Type: application/json" \\
  -H "Cookie: your-admin-session-cookie"`}
            </pre>
          </div>
          <div>
            <p className="text-xs font-semibold mb-1">2. Monday 9:00 AM - Send Weekly Digest:</p>
            <pre className="text-xs bg-base-300 p-3 rounded overflow-x-auto">
              {`curl -X POST https://dancecircle.co/api/cron/weekly-digest \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_CRON_SECRET"`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}


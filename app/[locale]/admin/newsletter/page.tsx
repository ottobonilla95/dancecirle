"use client";

import { useState } from "react";
import { FaEnvelope, FaPaperPlane, FaFlask, FaUsers, FaExclamationTriangle } from "react-icons/fa";

export default function NewsletterPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSend = async (testMode: boolean = false) => {
    if (!subject.trim() || !message.trim()) {
      alert("Please fill in both subject and message");
      return;
    }

    if (!testMode && !confirm(`Are you sure you want to send this newsletter to ALL users?`)) {
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          message: message.trim(),
          testMode,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        if (!testMode) {
          // Clear form after successful send
          setSubject("");
          setMessage("");
        }
      } else {
        alert(`Error: ${data.error || "Failed to send newsletter"}`);
      }
    } catch (error) {
      console.error("Error sending newsletter:", error);
      alert("Failed to send newsletter");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FaEnvelope className="text-primary" />
          Newsletter
        </h1>
        <p className="text-base-content/60 mt-2">
          Send feature announcements and updates to all users
        </p>
      </div>

      {/* Warning */}
      <div className="alert alert-warning shadow-lg">
        <FaExclamationTriangle className="text-xl" />
        <div>
          <h3 className="font-bold">Important!</h3>
          <div className="text-sm">
            This will send emails to all users with email notifications enabled.
            Always send a test email first to verify the content.
          </div>
        </div>
      </div>

      {/* Newsletter Form */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Compose Newsletter</h2>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Subject</span>
              <span className="label-text-alt">{subject.length}/100</span>
            </label>
            <input
              type="text"
              placeholder="e.g., New Feature: Dance Style Preferences"
              className="input input-bordered"
              value={subject}
              onChange={(e) => {
                if (e.target.value.length <= 100) {
                  setSubject(e.target.value);
                }
              }}
              disabled={sending}
              maxLength={100}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Message</span>
              <span className="label-text-alt">{message.length}/2000</span>
            </label>
            <textarea
              className="textarea textarea-bordered h-64 font-mono text-sm"
              placeholder="Write your announcement here...&#10;&#10;You can use line breaks for formatting.&#10;&#10;Example:&#10;Hey dancers! 🎉&#10;&#10;We're excited to announce a new feature...&#10;&#10;Check it out now!"
              value={message}
              onChange={(e) => {
                if (e.target.value.length <= 2000) {
                  setMessage(e.target.value);
                }
              }}
              disabled={sending}
              maxLength={2000}
            />
            <label className="label">
              <span className="label-text-alt">
                Tip: Use emojis and line breaks to make your message engaging
              </span>
            </label>
          </div>

          <div className="divider"></div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              className="btn btn-outline gap-2"
              onClick={() => handleSend(true)}
              disabled={sending || !subject.trim() || !message.trim()}
            >
              {sending ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Sending...
                </>
              ) : (
                <>
                  <FaFlask />
                  Send Test Email
                </>
              )}
            </button>

            <button
              className="btn btn-primary gap-2"
              onClick={() => handleSend(false)}
              disabled={sending || !subject.trim() || !message.trim()}
            >
              {sending ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Sending...
                </>
              ) : (
                <>
                  <FaPaperPlane />
                  Send to All Users
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div
          className={`alert ${
            result.success ? "alert-success" : "alert-error"
          } shadow-lg`}
        >
          <div className="flex-1">
            <div className="flex items-start gap-3">
              {result.success ? (
                <FaPaperPlane className="text-2xl" />
              ) : (
                <FaExclamationTriangle className="text-2xl" />
              )}
              <div>
                <h3 className="font-bold">{result.message}</h3>
                {result.stats && (
                  <div className="text-sm mt-2">
                    <div className="flex items-center gap-2">
                      <FaUsers />
                      <span>
                        Total: {result.stats.total} | Sent: {result.stats.sent}
                        {result.stats.failed > 0 &&
                          ` | Failed: ${result.stats.failed}`}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      {(subject || message) && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Preview</h2>
            <div className="mockup-window bg-base-300 border">
              <div className="bg-base-200 p-6">
                <div
                  style={{
                    fontFamily: "Arial, sans-serif",
                    maxWidth: "600px",
                    margin: "0 auto",
                  }}
                >
                  <div
                    style={{
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      padding: "30px",
                      textAlign: "center",
                      borderRadius: "10px 10px 0 0",
                    }}
                  >
                    <h1
                      style={{
                        color: "white",
                        margin: 0,
                        fontSize: "28px",
                      }}
                    >
                      {subject || "Newsletter Subject"}
                    </h1>
                  </div>

                  <div
                    style={{
                      background: "#f8f9fa",
                      padding: "30px",
                      borderRadius: "0 0 10px 10px",
                    }}
                  >
                    <div
                      style={{
                        background: "white",
                        padding: "25px",
                        borderRadius: "8px",
                        marginBottom: "20px",
                      }}
                    >
                      <div
                        style={{
                          color: "#333",
                          lineHeight: "1.8",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {message || "Your message will appear here..."}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


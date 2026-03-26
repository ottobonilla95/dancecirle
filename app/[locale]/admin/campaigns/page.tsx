"use client";

import React, { useState, useEffect } from "react";

interface FilterOption {
  _id: string;
  name: string;
  code?: string;
  category?: string;
}

interface CampaignRecord {
  _id: string;
  subject: string;
  bodyText: string;
  imageUrl?: string;
  ctaLink?: string;
  ctaText?: string;
  filters: {
    countries: FilterOption[];
    danceStyles: FilterOption[];
  };
  recipientCount: number;
  status: string;
  sentAt: string;
  sentBy: string;
  createdAt: string;
}

export default function CampaignsPage() {
  // Filter options
  const [countries, setCountries] = useState<FilterOption[]>([]);
  const [danceStyles, setDanceStyles] = useState<FilterOption[]>([]);

  // Form state
  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [ctaLink, setCtaLink] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedDanceStyles, setSelectedDanceStyles] = useState<string[]>([]);

  // Test email
  const [testEmail, setTestEmail] = useState("");
  const [testLoading, setTestLoading] = useState(false);

  // Send state
  const [sending, setSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Campaign history
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);

  // Status messages
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchFilters();
    fetchCampaigns();
  }, []);

  async function fetchFilters() {
    try {
      const res = await fetch("/api/admin/campaigns/filters");
      const data = await res.json();
      setCountries(data.countries || []);
      setDanceStyles(data.danceStyles || []);
    } catch (err) {
      console.error("Failed to fetch filters:", err);
    }
  }

  async function fetchCampaigns() {
    try {
      setLoadingCampaigns(true);
      const res = await fetch("/api/admin/campaigns");
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch (err) {
      console.error("Failed to fetch campaigns:", err);
    } finally {
      setLoadingCampaigns(false);
    }
  }

  function toggleCountry(id: string) {
    setSelectedCountries((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  function toggleDanceStyle(id: string) {
    setSelectedDanceStyles((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  }

  async function handleTestSend() {
    if (!testEmail || !subject || !bodyText) {
      setMessage({
        type: "error",
        text: "Fill in subject, body, and test email first",
      });
      return;
    }

    setTestLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/campaigns/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testEmail,
          subject,
          bodyText,
          imageUrl: imageUrl || undefined,
          ctaLink: ctaLink || undefined,
          ctaText: ctaText || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setMessage({ type: "success", text: `Test email sent to ${testEmail}` });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setTestLoading(false);
    }
  }

  async function handleSend() {
    if (!subject || !bodyText) {
      setMessage({ type: "error", text: "Subject and body text are required" });
      return;
    }

    setSending(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          bodyText,
          imageUrl: imageUrl || undefined,
          ctaLink: ctaLink || undefined,
          ctaText: ctaText || undefined,
          countries: selectedCountries.length > 0 ? selectedCountries : undefined,
          danceStyles:
            selectedDanceStyles.length > 0 ? selectedDanceStyles : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setMessage({
        type: "success",
        text: `Campaign sent to ${data.sentCount}/${data.totalRecipients} recipients${data.errors ? ` (${data.errors.length} failed)` : ""}`,
      });

      // Reset form
      setSubject("");
      setBodyText("");
      setImageUrl("");
      setCtaLink("");
      setCtaText("");
      setSelectedCountries([]);
      setSelectedDanceStyles([]);
      setShowConfirm(false);

      // Refresh history
      fetchCampaigns();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSending(false);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Email Campaigns</h1>

      {/* Status message */}
      {message && (
        <div
          className={`alert ${message.type === "success" ? "alert-success" : "alert-error"}`}
        >
          <span>{message.text}</span>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setMessage(null)}
          >
            x
          </button>
        </div>
      )}

      {/* Compose Section */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Compose Campaign</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Content */}
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Subject *</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="e.g., Salsa Festival in Barcelona!"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Body Text *</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full h-40"
                  placeholder="Write your message here..."
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Image URL</span>
                  <span className="label-text-alt">Optional</span>
                </label>
                <input
                  type="url"
                  className="input input-bordered w-full"
                  placeholder="https://ik.imagekit.io/..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
                {imageUrl && (
                  <div className="mt-2">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="max-h-40 rounded-lg object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">CTA Link</span>
                  </label>
                  <input
                    type="url"
                    className="input input-bordered w-full"
                    placeholder="https://..."
                    value={ctaLink}
                    onChange={(e) => setCtaLink(e.target.value)}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Button Text</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    placeholder="Learn More"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Right: Filters */}
            <div className="space-y-4">
              {/* Countries */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Target Countries
                  </span>
                  <span className="label-text-alt">
                    {selectedCountries.length === 0
                      ? "All countries"
                      : `${selectedCountries.length} selected`}
                  </span>
                </label>
                <div className="bg-base-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                  {countries.map((country) => (
                    <label
                      key={country._id}
                      className="flex items-center gap-2 cursor-pointer py-1 hover:bg-base-300 px-2 rounded"
                    >
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm checkbox-primary"
                        checked={selectedCountries.includes(country._id)}
                        onChange={() => toggleCountry(country._id)}
                      />
                      <span className="text-sm">
                        {country.name} {country.code ? `(${country.code})` : ""}
                      </span>
                    </label>
                  ))}
                  {countries.length === 0 && (
                    <p className="text-sm text-base-content/50 p-2">
                      Loading countries...
                    </p>
                  )}
                </div>
              </div>

              {/* Dance Styles */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Target Dance Styles
                  </span>
                  <span className="label-text-alt">
                    {selectedDanceStyles.length === 0
                      ? "All styles"
                      : `${selectedDanceStyles.length} selected`}
                  </span>
                </label>
                <div className="bg-base-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                  {danceStyles.map((style) => (
                    <label
                      key={style._id}
                      className="flex items-center gap-2 cursor-pointer py-1 hover:bg-base-300 px-2 rounded"
                    >
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm checkbox-primary"
                        checked={selectedDanceStyles.includes(style._id)}
                        onChange={() => toggleDanceStyle(style._id)}
                      />
                      <span className="text-sm">{style.name}</span>
                    </label>
                  ))}
                  {danceStyles.length === 0 && (
                    <p className="text-sm text-base-content/50 p-2">
                      Loading dance styles...
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="divider"></div>

          <div className="flex flex-wrap items-end gap-4">
            {/* Test Email */}
            <div className="form-control flex-1 min-w-[250px]">
              <label className="label">
                <span className="label-text font-semibold">Test Email</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  className="input input-bordered flex-1"
                  placeholder="test@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
                <button
                  className={`btn btn-outline btn-info ${testLoading ? "loading" : ""}`}
                  onClick={handleTestSend}
                  disabled={testLoading}
                >
                  {testLoading ? "Sending..." : "Send Test"}
                </button>
              </div>
            </div>

            {/* Send Campaign */}
            <div>
              {!showConfirm ? (
                <button
                  className="btn btn-primary"
                  onClick={() => setShowConfirm(true)}
                  disabled={!subject || !bodyText}
                >
                  Send Campaign
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-warning text-sm font-semibold">
                    Are you sure?
                  </span>
                  <button
                    className={`btn btn-error ${sending ? "loading" : ""}`}
                    onClick={handleSend}
                    disabled={sending}
                  >
                    {sending ? "Sending..." : "Yes, Send Now"}
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setShowConfirm(false)}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Campaign History */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Campaign History</h2>

          {loadingCampaigns ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : campaigns.length === 0 ? (
            <p className="text-base-content/50 py-4">
              No campaigns sent yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Subject</th>
                    <th>Recipients</th>
                    <th>Filters</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => (
                    <tr key={campaign._id}>
                      <td className="whitespace-nowrap text-sm">
                        {formatDate(campaign.sentAt || campaign.createdAt)}
                      </td>
                      <td>
                        <div className="font-medium">{campaign.subject}</div>
                        <div className="text-sm text-base-content/50 truncate max-w-xs">
                          {campaign.bodyText}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-primary">
                          {campaign.recipientCount}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {campaign.filters.countries?.map((c: any) => (
                            <span
                              key={c._id}
                              className="badge badge-outline badge-sm"
                            >
                              {c.name || c.code}
                            </span>
                          ))}
                          {campaign.filters.danceStyles?.map((d: any) => (
                            <span
                              key={d._id}
                              className="badge badge-secondary badge-sm"
                            >
                              {d.name}
                            </span>
                          ))}
                          {(!campaign.filters.countries ||
                            campaign.filters.countries.length === 0) &&
                            (!campaign.filters.danceStyles ||
                              campaign.filters.danceStyles.length === 0) && (
                              <span className="text-sm text-base-content/50">
                                All users
                              </span>
                            )}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge ${campaign.status === "sent" ? "badge-success" : "badge-ghost"}`}
                        >
                          {campaign.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

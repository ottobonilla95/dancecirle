"use client";

import { useState } from "react";
import { FaDatabase, FaSync, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

export default function CacheSettingsPage() {
  const [isClearing, setIsClearing] = useState(false);
  const [lastCleared, setLastCleared] = useState<Date | null>(null);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleClearCache = async () => {
    setIsClearing(true);
    setStatus("idle");
    setMessage("");

    try {
      const response = await fetch("/api/cache/clear", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage(`Successfully cleared ${data.tags.length} cache tags`);
        setLastCleared(new Date());
      } else {
        setStatus("error");
        setMessage(data.error || "Failed to clear cache");
      }
    } catch (error) {
      setStatus("error");
      setMessage("Network error: Could not clear cache");
    } finally {
      setIsClearing(false);
    }
  };

  const cacheInfo = [
    {
      name: "Hot Dance Styles",
      tag: "hot-dance-styles",
      revalidate: "5 minutes",
      shared: true,
      description: "Top 4 most popular dance styles",
    },
    {
      name: "Hot Cities",
      tag: "hot-cities",
      revalidate: "1 minute",
      shared: true,
      description: "Top 10 hottest cities (dashboard uses first 6)",
    },
    {
      name: "Dance Styles List",
      tag: "dance-styles",
      revalidate: "1 minute",
      shared: false,
      description: "All active dance styles",
    },
    {
      name: "Community Stats",
      tag: "community-stats",
      revalidate: "2 minutes",
      shared: false,
      description: "Total dancers, countries, cities, etc.",
    },
    {
      name: "Trending Songs",
      tag: "trending-songs",
      revalidate: "5 minutes",
      shared: false,
      description: "Top 10 most popular user anthems",
    },
    {
      name: "Trendy Countries",
      tag: "trendy-countries",
      revalidate: "2 minutes",
      shared: false,
      description: "Countries with most active dancers",
    },
    {
      name: "Community Map",
      tag: "landing-community-map",
      revalidate: "10 minutes",
      shared: false,
      description: "Dancers displayed on landing page map",
    },
    {
      name: "Featured Users",
      tag: "landing-featured-users",
      revalidate: "10 minutes",
      shared: false,
      description: "Users in hero section",
    },
    {
      name: "Recent Dancers",
      tag: "landing-recent-dancers",
      revalidate: "5 minutes",
      shared: false,
      description: "Newest members",
    },
  ];

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FaDatabase className="text-primary" />
            Cache Settings
          </h1>
          <p className="text-base-content/60 mt-2">
            Manage application cache and force revalidation
          </p>
        </div>
      </div>

      {/* Clear Cache Section */}
      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <h2 className="card-title text-xl mb-4">Clear All Caches</h2>
          
          <div className="alert alert-warning mb-4">
            <FaExclamationTriangle />
            <div>
              <div className="font-bold">Warning</div>
              <div className="text-sm">
                Clearing the cache will force all data to be refetched from the database on the next request.
                This may cause slower response times temporarily.
              </div>
            </div>
          </div>

          {status === "success" && (
            <div className="alert alert-success mb-4">
              <FaCheckCircle />
              <span>{message}</span>
            </div>
          )}

          {status === "error" && (
            <div className="alert alert-error mb-4">
              <FaExclamationTriangle />
              <span>{message}</span>
            </div>
          )}

          <div className="flex items-center gap-4">
            <button
              className="btn btn-primary btn-lg"
              onClick={handleClearCache}
              disabled={isClearing}
            >
              {isClearing ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Clearing Cache...
                </>
              ) : (
                <>
                  <FaSync />
                  Clear All Caches
                </>
              )}
            </button>

            {lastCleared && (
              <div className="text-sm text-base-content/60">
                Last cleared: {lastCleared.toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cache Info Table */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-xl mb-4">Active Cache Tags</h2>
          
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Tag</th>
                  <th>Revalidate</th>
                  <th>Type</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {cacheInfo.map((cache) => (
                  <tr key={cache.tag}>
                    <td className="font-medium">{cache.name}</td>
                    <td>
                      <code className="text-xs bg-base-200 px-2 py-1 rounded">
                        {cache.tag}
                      </code>
                    </td>
                    <td>
                      <span className="badge badge-ghost">{cache.revalidate}</span>
                    </td>
                    <td>
                      {cache.shared ? (
                        <span className="badge badge-primary badge-sm">Shared</span>
                      ) : (
                        <span className="badge badge-ghost badge-sm">Page-specific</span>
                      )}
                    </td>
                    <td className="text-sm text-base-content/60">
                      {cache.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm text-base-content/60">
            <p>
              <strong>Shared caches</strong> are used by both landing page and dashboard.
              <br />
              <strong>Page-specific caches</strong> are only used by one page.
            </p>
          </div>
        </div>
      </div>

      {/* Cache Strategy Info */}
      <div className="card bg-base-100 shadow-xl mt-6">
        <div className="card-body">
          <h2 className="card-title text-xl mb-4">Cache Strategy</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Why We Cache</h3>
              <p className="text-sm text-base-content/60">
                Caching reduces database load and improves response times. Expensive aggregations 
                (like community stats) are cached to prevent slow queries on every page load.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">When to Clear Cache</h3>
              <ul className="list-disc list-inside text-sm text-base-content/60 space-y-1">
                <li>After bulk data imports or migrations</li>
                <li>If you notice stale or incorrect data being displayed</li>
                <li>After making changes to dance styles or cities in the database</li>
                <li>If the cache gets into a bad state (showing empty results)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Auto-Revalidation</h3>
              <p className="text-sm text-base-content/60">
                Caches automatically revalidate based on their revalidate time. You only need to 
                manually clear cache if you need immediate updates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


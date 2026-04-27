"use client";

import React, { useEffect, useRef, useState } from "react";
import { City } from "@/types";
import CityCard from "@/components/molecules/CityCard";
import { FaSort, FaSpinner, FaSearch } from "react-icons/fa";
import { useTranslation } from "@/components/I18nProvider";
import { tReplace } from "@/lib/t-replace";

type SortOption = "rank" | "totalDancers" | "name" | "population";

interface CitiesPageClientProps {
  initialCities: City[];
  initialTotalCount: number;
  initialHasMore: boolean;
}

export default function CitiesPageClient({
  initialCities,
  initialTotalCount,
  initialHasMore,
}: CitiesPageClientProps) {
  const { t } = useTranslation();
  const [cities, setCities] = useState<City[]>(initialCities);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("totalDancers");
  const [searchQuery, setSearchQuery] = useState("");
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(initialTotalCount);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastCityRef = useRef<HTMLDivElement | null>(null);
  const skippedInitialFetchRef = useRef(false);

  const fetchCities = async (pageNum: number, reset = false) => {
    if (loading || loadingMore) return;

    if (reset) {
      setLoading(true);
      setPage(1);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams({
        sortBy,
        page: pageNum.toString(),
        limit: "12",
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/cities?${params}`);
      if (response.ok) {
        const data = await response.json();

        if (reset) {
          setCities(data.cities || []);
        } else {
          setCities(prev => [...prev, ...(data.cities || [])]);
        }

        setHasMore(data.hasMore || false);
        setTotalCount(data.totalCount || 0);
      }
    } catch (error) {
      console.error("Error fetching cities:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!skippedInitialFetchRef.current) {
      skippedInitialFetchRef.current = true;
      return;
    }

    setPage(1);
    setHasMore(true);
    fetchCities(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, searchQuery]);

  useEffect(() => {
    if (page > 1) {
      fetchCities(page, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (lastCityRef.current) {
      observerRef.current.observe(lastCityRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadingMore, loading]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const getSortLabel = (sort: SortOption) => {
    switch (sort) {
      case "totalDancers":
        return t("common.mostDancers");
      case "rank":
        return t("common.mostPopular");
      case "name":
        return t("common.az");
      case "population":
        return t("citiesPage.largestCities");
      default:
        return t("common.mostDancers");
    }
  };

  return (
    <div className="min-h-screen p-4 bg-base-100">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-500 to-pink-400 bg-clip-text text-transparent">
            {t("citiesPage.title")}
          </h1>
          <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
            {t("citiesPage.subtitle")}
          </p>
        </div>

        <div className="mb-8 space-y-4">
          <div className="relative max-w-md mx-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-4 w-4 text-base-content/50" />
            </div>
            <input
              type="text"
              className="input input-bordered w-full pl-10"
              placeholder={t("citiesPage.searchPlaceholder")}
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <FaSort className="text-sm text-base-content/60" />
              <span className="text-sm text-base-content/60">{t("citiesPage.sortBy")}</span>
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              {(["totalDancers", "rank", "name", "population"] as SortOption[]).map(option => (
                <button
                  key={option}
                  onClick={() => setSortBy(option)}
                  className={`btn btn-sm ${sortBy === option ? "btn-primary" : "btn-outline"}`}
                  disabled={loading}
                >
                  {getSortLabel(option)}
                </button>
              ))}
            </div>
          </div>

          <div className="text-center text-sm text-base-content/60">
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <FaSpinner className="animate-spin" />
                <span>{t("citiesPage.loadingCities")}</span>
              </div>
            ) : (
              <span>
                {totalCount > 0
                  ? tReplace(t("citiesPage.citiesFound"), { count: totalCount })
                  : t("citiesPage.noCitiesFound")}
                {searchQuery && ` for "${searchQuery}"`}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {cities.map((city, index) => (
            <CityCard key={city._id || city.id} city={city} index={index + 1} />
          ))}
        </div>

        {loadingMore && (
          <div className="flex justify-center py-8">
            <div className="flex items-center gap-2 text-base-content/60">
              <FaSpinner className="animate-spin" />
              <span>Loading more cities...</span>
            </div>
          </div>
        )}

        {cities.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏙️</div>
            <h3 className="text-2xl font-bold mb-2">{t("citiesPage.noCitiesFoundTitle")}</h3>
            <p className="text-base-content/70">
              {searchQuery
                ? tReplace(t("citiesPage.noMatchingCities"), { query: searchQuery })
                : t("citiesPage.noCitiesAvailable")}
            </p>
          </div>
        )}

        <div ref={lastCityRef} className="h-4" />
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "@/navigation";
import Flag from "@/components/Flag";
import { FaSort, FaSpinner, FaSearch, FaUsers } from "react-icons/fa";
import { useTranslation } from "@/components/I18nProvider";
import { tReplace } from "@/lib/t-replace";

type SortOption = "totalDancers" | "name";

interface Country {
  _id: string;
  name: string;
  slug?: string;
  code: string;
  totalDancers: number;
  continent: {
    name: string;
    code: string;
  };
}

export default function CountriesPage() {
  const { t } = useTranslation();
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("totalDancers");
  const [searchQuery, setSearchQuery] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastCountryRef = useRef<HTMLDivElement | null>(null);

  const fetchCountries = useCallback(async (pageNum: number, reset = false) => {
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
        ...(searchQuery && { search: searchQuery })
      });

      const response = await fetch(`/api/countries?${params}`);
      if (response.ok) {
        const data = await response.json();
        
        if (reset) {
          setCountries(data.countries || []);
        } else {
          setCountries(prev => [...prev, ...(data.countries || [])]);
        }
        
        setHasMore(data.hasMore || false);
        setTotalCount(data.totalCount || 0);
      }
    } catch (error) {
      console.error("Error fetching countries:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [sortBy, searchQuery, loading, loadingMore]);

  // Initial load and when sort/search changes
  useEffect(() => {
    fetchCountries(1, true);
  }, [sortBy, searchQuery]);

  // Infinite scroll setup
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          setPage(prev => {
            const nextPage = prev + 1;
            fetchCountries(nextPage, false);
            return nextPage;
          });
        }
      },
      { threshold: 0.1 }
    );

    if (lastCountryRef.current) {
      observerRef.current.observe(lastCountryRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadingMore, fetchCountries]);

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const getSortLabel = (sort: SortOption) => {
    switch (sort) {
      case "totalDancers": return t('common.mostDancers');
      case "name": return t('countriesPage.az');
      default: return t('common.mostDancers');
    }
  };

  return (
    <div className="min-h-screen p-4 bg-base-100">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-500 to-pink-400 bg-clip-text text-transparent">
            {t('countriesPage.title')}
          </h1>
          <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
            {t('countriesPage.subtitle')}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-md mx-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-4 w-4 text-base-content/50" />
            </div>
            <input
              type="text"
              className="input input-bordered w-full pl-10"
              placeholder={t('countriesPage.searchPlaceholder')}
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>

          {/* Sort Controls */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <FaSort className="text-sm text-base-content/60" />
              <span className="text-sm text-base-content/60">{t('countriesPage.sortBy')}</span>
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              {(["totalDancers", "name"] as SortOption[]).map((option) => (
                <button
                  key={option}
                  onClick={() => handleSortChange(option)}
                  className={`btn btn-sm ${
                    sortBy === option ? 'btn-primary' : 'btn-outline'
                  }`}
                  disabled={loading}
                >
                  {getSortLabel(option)}
                </button>
              ))}
            </div>
          </div>

          {/* Results Count */}
          <div className="text-center text-sm text-base-content/60">
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <FaSpinner className="animate-spin" />
                <span>{t('countriesPage.loadingCountries')}</span>
              </div>
            ) : (
              <span>
                {totalCount > 0 ? tReplace(t('countriesPage.countriesFound'), { count: totalCount }) : t('countriesPage.noCountriesFound')}
                {searchQuery && ` for "${searchQuery}"`}
              </span>
            )}
          </div>
        </div>

        {/* Countries Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {countries.map((country) => (
            <Link
              key={country._id}
              href={`/country/${country.slug || country._id}`}
              className="group"
            >
              <div className="card bg-base-200 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <div className="card-body p-4">
                  <div className="flex items-start gap-3">
                    {/* Flag */}
                    <div className="text-5xl flex-shrink-0">
                      <Flag countryCode={country.code} size="lg" />
                    </div>

                    {/* Country Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="card-title text-lg mb-1 group-hover:text-primary transition-colors">
                        {country.name}
                      </h3>
                      <p className="text-sm text-base-content/60 mb-2">
                        {country.continent.name}
                      </p>
                      
                      {/* Stats */}
                      <div className="flex items-center gap-2 text-sm">
                        <FaUsers className="text-primary" />
                        <span className="font-semibold">
                          {formatNumber(country.totalDancers)}
                        </span>
                        <span className="text-base-content/60">
                          {country.totalDancers !== 1 ? t('common.dancers') : t('common.dancer')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Loading More Indicator */}
        {loadingMore && (
          <div className="flex justify-center py-8">
            <div className="flex items-center gap-2 text-base-content/60">
              <FaSpinner className="animate-spin" />
              <span>{t('countriesPage.loadingCountries')}</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {countries.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🌍</div>
            <h3 className="text-2xl font-bold mb-2">{t('countriesPage.noCountriesFoundTitle')}</h3>
            <p className="text-base-content/70">
              {searchQuery
                ? tReplace(t('countriesPage.noMatchingCountries'), { query: searchQuery })
                : t('countriesPage.noCountriesAvailable')
              }
            </p>
          </div>
        )}

        {/* Intersection Observer Target */}
        <div ref={lastCountryRef} className="h-4" />
      </div>
    </div>
  );
}

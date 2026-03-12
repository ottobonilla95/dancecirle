"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Link } from "@/navigation";
import Image from "next/image";
import { FaSearch, FaTimes, FaUser, FaCity, FaGlobe, FaUsers } from "react-icons/fa";
import { SearchUser, SearchCity, SearchCountry, UnifiedSearchResponse } from "@/types/search";
import Flag from "./Flag";
import VerifiedBadge from "./VerifiedBadge";
import { useTranslation } from "./I18nProvider";

interface SearchBarProps {
  placeholder?: string;
  onUserSelect?: (user: SearchUser) => void;
  className?: string;
  compact?: boolean;
}

export default function SearchBar({
  placeholder,
  onUserSelect,
  className = "",
  compact = false
}: SearchBarProps) {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [cities, setCities] = useState<SearchCity[]>([]);
  const [countries, setCountries] = useState<SearchCountry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search function with debouncing
  const searchAll = async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setUsers([]);
      setCities([]);
      setCountries([]);
      setError("");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/user/search?q=${encodeURIComponent(searchQuery)}`);
      const data: UnifiedSearchResponse = await response.json();

      if (response.ok) {
        setUsers(data.users || []);
        setCities(data.cities || []);
        setCountries(data.countries || []);
        if (data.totalResults === 0 && searchQuery.length >= 2) {
          setError(t('search.noResults'));
        }
      } else {
        setError(data.message || t('search.searchFailed'));
        setUsers([]);
        setCities([]);
        setCountries([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setError(t('search.networkError'));
      setUsers([]);
      setCities([]);
      setCountries([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change with debouncing
  const handleInputChange = (value: string) => {
    setQuery(value);
    setIsOpen(value.length > 0);

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce search
    timeoutRef.current = setTimeout(() => {
      searchAll(value);
    }, 300);
  };

  const handleUserClick = (user: SearchUser) => {
    if (onUserSelect) {
      onUserSelect(user);
    }
    setQuery("");
    setIsOpen(false);
    setUsers([]);
    setCities([]);
    setCountries([]);
  };

  const clearSearch = () => {
    setQuery("");
    setUsers([]);
    setCities([]);
    setCountries([]);
    setIsOpen(false);
    setError("");
    inputRef.current?.focus();
  };

  // Don't show search for non-authenticated users
  if (!session) {
    return null;
  }

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaSearch className="h-4 w-4 text-base-content/50" />
        </div>
        <input
          ref={inputRef}
          type="text"
          className={`input input-bordered w-full pl-10 pr-10 ${
            compact ? "input-sm" : ""
          } ${isOpen && (users.length > 0 || cities.length > 0 || countries.length > 0) ? "rounded-b-none" : ""}`}
          placeholder={placeholder || t('search.placeholder')}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => query.length > 0 && setIsOpen(true)}
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <FaTimes className="h-4 w-4 text-base-content/50 hover:text-base-content" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-base-100 border border-base-300 border-t-0 rounded-b-lg shadow-lg z-50 max-h-96 overflow-y-auto min-w-full lg:min-w-[400px]">
          {isLoading && (
            <div className="p-4 text-center">
              <span className="loading loading-spinner loading-sm"></span>
              <span className="ml-2">{t('search.searching')}</span>
            </div>
          )}

          {error && !isLoading && (
            <div className="p-4 text-center text-base-content/60">
              {error}
            </div>
          )}

          {!isLoading && !error && (users.length > 0 || cities.length > 0 || countries.length > 0) && (
            <div className="py-2">
              {/* Dancers Section */}
              {users.length > 0 && (
                <div className="mb-2">
                  <div className="px-4 py-2 text-xs font-semibold text-base-content/60 flex items-center gap-2">
                    <FaUsers className="h-3 w-3" />
                    {t('search.dancers').toUpperCase()} ({users.length})
                  </div>
                  {users.map((user) => (
                    <Link
                      key={user._id}
                      href={`/dancer/${user._id}`}
                      onClick={() => handleUserClick(user)}
                      className="block px-6 py-3 hover:bg-base-200 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="avatar flex-shrink-0">
                          <div className="w-10 h-10 rounded-full">
                            {user.image ? (
                              <Image
                                src={user.image}
                                alt={user.name}
                                width={40}
                                height={40}
                                className="rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-base-300 flex items-center justify-center rounded-full">
                                <FaUser className="text-base-content/50" />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-medium text-sm truncate">{user.name}</span>
                            {user.isFeaturedProfessional && (
                              <VerifiedBadge size="sm" />
                            )}
                            <span className="text-xs text-base-content/60">@{user.username}</span>
                          </div>
                          {user.city && (
                            <div className="text-xs text-base-content/50 truncate">
                              {user.city.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Cities Section */}
              {cities.length > 0 && (
                <div className="mb-2">
                  <div className="px-4 py-2 text-xs font-semibold text-base-content/60 flex items-center gap-2">
                    <FaCity className="h-3 w-3" />
                    {t('common.cities').toUpperCase()} ({cities.length})
                  </div>
                  {cities.map((city) => (
                    <Link
                      key={city._id}
                      href={`/city/${city.slug || city._id}`}
                      onClick={clearSearch}
                      className="block px-6 py-3 hover:bg-base-200 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <Flag countryCode={city.country?.code || ''} size="md" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{city.name}</div>
                          <div className="text-xs text-base-content/50">
                            {city.country?.name} • {city.totalDancers} {t('search.dancers').toLowerCase()}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Countries Section */}
              {countries.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-base-content/60 flex items-center gap-2">
                    <FaGlobe className="h-3 w-3" />
                    {t('common.countries').toUpperCase()} ({countries.length})
                  </div>
                  {countries.map((country) => (
                    <Link
                      key={country._id}
                      href={`/country/${country.slug || country._id}`}
                      onClick={clearSearch}
                      className="block px-6 py-3 hover:bg-base-200 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <Flag countryCode={country.code} size="md" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{country.name}</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {!isLoading && !error && query.length >= 2 && users.length === 0 && cities.length === 0 && countries.length === 0 && (
            <div className="p-4 text-center text-base-content/60">
              {t('search.noResultsFor')} &quot;{query}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
} 
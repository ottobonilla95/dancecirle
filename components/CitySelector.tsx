"use client";

import React, { useState, useEffect, useRef } from "react";
import { City } from "@/types";
import apiClient from "@/libs/api";
import { useTranslation } from "@/components/I18nProvider";

interface CitySelectorProps {
  selectedCities: City[];
  onCitiesChange: (cities: City[]) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export default function CitySelector({
  selectedCities,
  onCitiesChange,
  placeholder = "Search cities...",
  label = "Cities",
  className = "",
}: CitySelectorProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search function
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchTerm.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(async () => {
        await searchCities(searchTerm);
      }, 300);
    } else {
      setSearchResults([]);
      setIsDropdownOpen(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Handle clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchCities = async (query: string) => {
    setIsLoading(true);
    try {
      const data = (await apiClient.get(
        `/cities?search=${encodeURIComponent(query)}&limit=10&includeEmpty=true`
      )) as { cities: City[] };

      // Filter out already selected cities
      const selectedIds = selectedCities.map((city) => city._id);
      const filteredResults = data.cities.filter(
        (city) => !selectedIds.includes(city._id)
      );

      setSearchResults(filteredResults);
      setIsDropdownOpen(filteredResults.length > 0);
      setFocusedIndex(-1);
    } catch (error) {
      console.error("Error searching cities:", error);
      setSearchResults([]);
      setIsDropdownOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCitySelect = (city: City) => {
    onCitiesChange([...selectedCities, city]);
    setSearchTerm("");
    setSearchResults([]);
    setIsDropdownOpen(false);
    setFocusedIndex(-1);
    inputRef.current?.focus();
  };

  const handleCityRemove = (cityId: string) => {
    onCitiesChange(selectedCities.filter((city) => city._id !== cityId));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isDropdownOpen || searchResults.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < searchResults.length) {
          handleCitySelect(searchResults[focusedIndex]);
        }
        break;
      case "Escape":
        setIsDropdownOpen(false);
        setFocusedIndex(-1);
        break;
    }
  };

  return (
    <div className={`form-control ${className}`}>
      <label className="label">
        <span className="label-text">{label}</span>
      </label>

      {/* Selected cities as badges */}
      {selectedCities.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedCities.map((city) => (
            <div key={city._id} className="badge badge-primary gap-2 p-3">
              <span>
                {city.name}, {city.country?.name}
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-xs btn-circle"
                onClick={() => handleCityRemove(city._id)}
                aria-label={`Remove ${city.name}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search input with dropdown */}
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            className="input input-bordered w-full pr-10"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (searchResults.length > 0) {
                setIsDropdownOpen(true);
              }
            }}
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <span className="loading loading-spinner loading-sm"></span>
            </div>
          )}
        </div>

        {/* Dropdown results */}
        {isDropdownOpen && (
          <div className="absolute z-50 w-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {searchResults.length > 0 ? (
              searchResults.map((city, index) => (
                <button
                  key={city._id}
                  type="button"
                  className={`w-full text-left px-4 py-3 hover:bg-base-200 transition-colors ${
                    index === focusedIndex ? "bg-base-200" : ""
                  }`}
                  onClick={() => handleCitySelect(city)}
                  onMouseEnter={() => setFocusedIndex(index)}
                >
                  <div className="font-medium">{city.name}</div>
                  <div className="text-sm text-base-content/60">
                    {city.country?.name}
                    {city.population && (
                      <span className="ml-2">
                        ({city.population.toLocaleString()} people)
                      </span>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-base-content/60">
                {isLoading ? t('citySearch.searching') : t('citySearch.noCitiesFound')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Helper text */}
      <label className="label">
        <span className="label-text-alt text-base-content/60">
          {t('citySearch.typeToSearch')}
        </span>
      </label>
    </div>
  );
}

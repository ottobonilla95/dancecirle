"use client";

import React, { useState, useEffect, useRef } from "react";
import { City } from "@/types";
import apiClient from "@/libs/api";
import { useTranslation } from "@/components/I18nProvider";
import { tReplace } from "@/lib/t-replace";

interface CityDropdownProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onCitySelect: (city: City) => void;
  placeholder?: string;
  selectedCities?: City[];
  className?: string;
}

export default function CityDropdown({
  searchTerm,
  onSearchChange,
  onCitySelect,
  placeholder = "Search cities...",
  selectedCities = [],
  className = "",
}: CityDropdownProps) {
  const { t } = useTranslation();
  const [searchResults, setSearchResults] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search function
  useEffect(() => {
    if (searchTerm.length >= 2) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      searchTimeoutRef.current = setTimeout(() => {
        searchCities(searchTerm);
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const searchCities = async (term: string) => {
    try {
      setIsLoading(true);
      const data = (await apiClient.get(`/cities?search=${encodeURIComponent(term)}&limit=10&includeEmpty=true`)) as {
        cities: City[];
      };
      
      // Filter out already selected cities
      const filteredCities = data.cities.filter(
        city => !selectedCities.some(selected => selected._id === city._id)
      );
      
      setSearchResults(filteredCities);
      setIsDropdownOpen(true);
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
    onCitySelect(city);
    onSearchChange("");
    setSearchResults([]);
    setIsDropdownOpen(false);
    setFocusedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isDropdownOpen || searchResults.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex(prev => 
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
        inputRef.current?.blur();
        break;
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <input
        ref={inputRef}
        type="text"
        className="input input-bordered w-full"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (searchResults.length > 0) {
            setIsDropdownOpen(true);
          }
        }}
      />

      {/* Dropdown */}
      {isDropdownOpen && (
        <div className="absolute z-50 w-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center">
              <span className="loading loading-spinner loading-sm"></span>
              <span className="ml-2">{t('citySearch.searchingCities')}</span>
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.map((city, index) => (
              <div
                key={city._id}
                className={`p-3 cursor-pointer border-b border-base-200 last:border-b-0 hover:bg-base-200 transition-colors ${
                  index === focusedIndex ? "bg-base-200" : ""
                }`}
                onClick={() => handleCitySelect(city)}
              >
                <div className="font-medium">{city.name}</div>
                <div className="text-sm text-base-content/60">
                  {typeof city.country === 'string' ? city.country : city.country?.name}
                </div>
              </div>
            ))
          ) : searchTerm.length >= 2 ? (
            <div className="p-4 text-center text-base-content/60">
              {tReplace(t('citySearch.noCitiesForTerm'), { query: searchTerm })}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
} 
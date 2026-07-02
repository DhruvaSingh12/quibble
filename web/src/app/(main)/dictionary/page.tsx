"use client";

import { Input } from "@/components/ui/Input";
import { DictionaryResponse } from "@/lib/types";
import { SearchIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import ClearButton from "./components/ClearButton";
import Main from "./components/Main";
import kyInstance from "@/lib/ky";

export default function DictionaryPage() {
  const [inputWord, setInputWord] = useState("");
  const [activeSearchWord, setActiveSearchWord] = useState("");
  const [debouncedInputWord, setDebouncedInputWord] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const inputRef = useRef<HTMLDivElement | null>(null);

  // Handle clicking outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce input for suggestions
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedInputWord(inputWord);
    }, 300);
    return () => clearTimeout(timeout);
  }, [inputWord]);

  // Query for dictionary definitions
  const { 
    data: dictionaryData, 
    isFetching: isLoading, 
    error: queryError 
  } = useQuery({
    queryKey: ["dictionary", activeSearchWord],
    queryFn: async () => {
      try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${activeSearchWord}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`"${activeSearchWord}" not found in dictionary. Please check the spelling.`);
            }
            throw new Error(`Dictionary service error: ${response.statusText}`);
        }

        const data = await response.json() as DictionaryResponse[];
        if (!data || data.length === 0) {
          throw new Error(`No definitions found for "${activeSearchWord}".`);
        }
        return data[0];
      } catch (err: any) {
        throw new Error(err.message || "Dictionary service unavailable. Please try again later.");
      }
    },
    enabled: !!activeSearchWord,
    staleTime: 1000 * 60 * 60, // 1 hour cache
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Query for suggestions
  const { data: suggestions = [] } = useQuery({
    queryKey: ["dictionary-suggestions", debouncedInputWord],
    queryFn: async () => {
      try {
        const response = await fetch(`https://api.datamuse.com/sug?s=${debouncedInputWord}&max=5`);
        if (!response.ok) return [];
        const data = await response.json() as { word: string }[];
        return data.map(item => item.word);
      } catch {
        return [];
      }
    },
    enabled: debouncedInputWord.length >= 2,
    staleTime: 1000 * 60 * 60, // 1 hour cache
    retry: false,
    refetchOnWindowFocus: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputWord(e.target.value);
    setSelectedSuggestionIndex(-1);
    setShowSuggestions(true);
  };

  const executeSearch = (wordToSearch: string) => {
    const trimmed = wordToSearch.trim();
    if (!trimmed) return;
    setInputWord(trimmed);
    setActiveSearchWord(trimmed);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (showSuggestions && selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
        executeSearch(suggestions[selectedSuggestionIndex]);
      } else {
        executeSearch(inputWord);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedSuggestionIndex((prevIndex) => Math.min(prevIndex + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedSuggestionIndex((prevIndex) => Math.max(prevIndex - 1, 0));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleClearSearch = () => {
    setInputWord("");
    setActiveSearchWord("");
    setDebouncedInputWord("");
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  };

  // Convert TanStack Query error to string
  const errorMessage = queryError ? queryError.message : "";

  return (
    <div className="w-full mt-[3px] lg:mt-[8px] flex-col rounded-lg items-center justify-center">
      <div className="w-full max-w-none">
        <div className="p-3 sm:p-4">
          <div className="flex gap-2 sm:gap-3 items-center">
            <div ref={inputRef} className="flex-1 relative min-w-0">
              <Input
                type="text"
                value={inputWord}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search for a word"
                className="pr-16 sm:pr-20 text-sm sm:text-base"
              />
              <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2 sm:pr-3">
                <ClearButton onClick={handleClearSearch} />
                <button
                  type="button"
                  onClick={() => executeSearch(inputWord)}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Search"
                >
                  <SearchIcon size={16} className="sm:w-[18px] sm:h-[18px]" />
                </button>
              </div>

              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute top-full left-0 w-full bg-card border rounded-lg mt-1 shadow-lg z-10 py-1 max-h-48 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <li
                      key={suggestion}
                      onClick={() => executeSearch(suggestion)}
                      className={`px-3 py-2 cursor-pointer text-sm transition-colors ${index === selectedSuggestionIndex
                        ? "bg-secondary text-secondary-foreground"
                        : "hover:bg-secondary/50"
                        }`}
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <Main
          data={dictionaryData || null}
          error={errorMessage}
          loading={isLoading}
          handleSynonymAntonymClick={executeSearch}
        />
      </div>
    </div>
  );
}

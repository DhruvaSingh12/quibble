"use client";

import { Input } from "@/components/ui/Input";
import { DictionaryResponse } from "@/lib/types";
import { SearchIcon } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import ClearButton from "./components/ClearButton";
import Main from "./components/Main";
import { BackButton, ForwardButton } from "./components/NavigationButtons";

export default function DictionaryPage() {
  const [word, setWord] = useState("");
  const [data, setData] = useState<DictionaryResponse | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"meanings" | "synonyms">("meanings");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem("searchHistory") || "[]");
    setHistory(savedHistory);
    setHistoryIndex(0);

    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    
    // Cleanup function
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [debounceTimeout]);

  const fetchWord = async (searchWord: string, saveToHistory = true) => {
    if (!searchWord.trim()) {
      setError("Please enter a word to search.");
      return;
    }

    setError("");
    setData(null);
    setLoading(true);

    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${searchWord.trim()}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`"${searchWord}" not found in dictionary. Please check the spelling.`);
        } else {
          throw new Error("Dictionary service unavailable. Please try again later.");
        }
      }
      
      const result = await response.json();
      
      if (!result || result.length === 0) {
        throw new Error(`No definitions found for "${searchWord}".`);
      }
      
      setData(result[0]);

      if (saveToHistory) {
        setHistory((prevHistory) => {
          const updatedHistory = [searchWord, ...prevHistory.filter(word => word !== searchWord)].slice(0, 50); // Limit history
          localStorage.setItem("searchHistory", JSON.stringify(updatedHistory));
          return updatedHistory;
        });
        setHistoryIndex(0);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = useCallback(async (prefix: string) => {
    if (prefix.trim() === "" || prefix.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(`https://api.datamuse.com/sug?s=${prefix}&max=5`);
      if (!response.ok) throw new Error('Failed to fetch suggestions');
      const result = await response.json();
      setSuggestions(result.map((item: { word: string }) => item.word));
    } catch (err) {
      console.error("Error fetching suggestions:", err);
      setSuggestions([]);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputWord = e.target.value;
    setWord(inputWord);
    setSelectedSuggestionIndex(-1);
    
    // Clear existing timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    
    // Set new timeout for debounced suggestions
    const newTimeout = setTimeout(() => {
      fetchSuggestions(inputWord);
    }, 300);
    
    setDebounceTimeout(newTimeout);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
        handleSuggestionClick(suggestions[selectedSuggestionIndex]);
      } else {
        fetchWord(word);
      }
      setSuggestions([]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedSuggestionIndex((prevIndex) => Math.min(prevIndex + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedSuggestionIndex((prevIndex) => Math.max(prevIndex - 1, 0));
    } else if (e.key === "Escape") {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setWord(suggestion);
    fetchWord(suggestion);
    setSuggestions([]);
  };

  const handleTabClick = (tab: "meanings" | "synonyms") => {
    setActiveTab(tab);
  };

  const handleSynonymAntonymClick = (word: string) => {
    setWord(word);
    fetchWord(word);
  };

  const handleClearSearch = () => {
    setWord("");
    setData(null);
    setError("");
    setSuggestions([]);
    setSelectedSuggestionIndex(-1);
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
  };

  return (
    <div className="w-full min-h-screen bg-background p-3 sm:p-4 lg:p-6">
      <div className="w-full max-w-none space-y-4 sm:space-y-6">
        {/* Search Section */}
        <div className="bg-card rounded-xl border p-3 sm:p-4">
          <div className="flex gap-2 sm:gap-3 items-center">
            <div className="flex gap-1 sm:gap-2 flex-shrink-0">
              <BackButton
                history={history}
                historyIndex={historyIndex}
                setHistoryIndex={setHistoryIndex}
                setWord={setWord}
                fetchWord={fetchWord}
              />
              <ForwardButton
                history={history}
                historyIndex={historyIndex}
                setHistoryIndex={setHistoryIndex}
                setWord={setWord}
                fetchWord={fetchWord}
              />
            </div>

            <div ref={inputRef} className="flex-1 relative min-w-0">
              <Input
                type="text"
                value={word}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Search for a word..."
                className="pr-16 sm:pr-20 text-sm sm:text-base"
              />
              <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2 sm:pr-3">
                <ClearButton onClick={handleClearSearch} />
                <button
                  type="submit"
                  onClick={() => {
                    fetchWord(word);
                    setSuggestions([]);
                  }}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Search"
                >
                  <SearchIcon size={16} className="sm:w-[18px] sm:h-[18px]" />
                </button>
              </div>
              
              {suggestions.length > 0 && (
                <ul className="absolute top-full left-0 w-full bg-card border rounded-lg mt-1 shadow-lg z-10 py-1 max-h-48 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <li
                      key={suggestion}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className={`px-3 py-2 cursor-pointer text-sm transition-colors ${
                        index === selectedSuggestionIndex 
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

        {/* Results Section */}
        <Main
          data={data}
          error={error}
          loading={loading}
          activeTab={activeTab}
          handleTabClick={handleTabClick}
          handleSynonymAntonymClick={handleSynonymAntonymClick}
        />
      </div>
    </div>
  );
}

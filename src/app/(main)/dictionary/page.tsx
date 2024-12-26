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
  const [activeTab, setActiveTab] = useState<"phonetics" | "meanings" | "synonyms" | "license">("meanings");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchWord = async (searchWord: string, saveToHistory = true) => {
    setError("");
    setData(null);
    setLoading(true);

    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${searchWord}`);
      if (!response.ok) {
        throw new Error("Uh oh! Word not found.");
      }
      const result = await response.json();
      setData(result[0]);

      if (saveToHistory) {
        setHistory((prevHistory) => {
          const updatedHistory = [searchWord, ...prevHistory];
          localStorage.setItem("searchHistory", JSON.stringify(updatedHistory));
          return updatedHistory;
        });
        setHistoryIndex(0);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = useCallback(async (prefix: string) => {
    if (prefix.trim() === "") {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(`https://api.datamuse.com/sug?s=${prefix}&max=5`);
      const result = await response.json();
      setSuggestions(result.map((item: { word: string }) => item.word));
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputWord = e.target.value;
    setWord(inputWord);
    setSelectedSuggestionIndex(-1);
    fetchSuggestions(inputWord);
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

  const handleTabClick = (tab: "phonetics" | "meanings" | "synonyms" | "license") => {
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
  };

  return (
    <div className="flex w-full p-3 lg:p-5 mt-[3px] lg:mt-[8px] flex-col rounded-2xl items-center relative justify-center space-y-5 bg-accent">
      <div className="w-full flex flex-row gap-2">
        <div>
          <BackButton
            history={history}
            historyIndex={historyIndex}
            setHistoryIndex={setHistoryIndex}
            setWord={setWord}
            fetchWord={fetchWord}
          />
        </div>
        <div>
          <ForwardButton
            history={history}
            historyIndex={historyIndex}
            setHistoryIndex={setHistoryIndex}
            setWord={setWord}
            fetchWord={fetchWord}
          />
        </div>

        <div ref={inputRef} className="w-full relative gap-2">
          <Input
            type="text"
            value={word}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Enter a word"
            className="bg-background text-foreground"
          />
          <button
            type="submit"
            onClick={() => {
              fetchWord(word);
              setSuggestions([]);
            }}
            className="absolute top-1/2 right-2 lg:right-4 transform -translate-y-1/2 text-muted-foreground"
            aria-label="Search"
          >
            <SearchIcon />
          </button>
          <ClearButton
            onClick={handleClearSearch}
            className="absolute top-1/2 right-10 lg:right-12 transform -translate-y-1/2 text-muted-foreground"
          />
          {suggestions.length > 0 && (
            <ul className="absolute top-full left-0 w-full overflow-y-auto bg-background rounded-lg mt-1.5 shadow-lg z-10">
              {suggestions.map((suggestion, index) => (
                <li
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`px-3 py-1.5 cursor-pointer rounded-2xl ${index === selectedSuggestionIndex ? "bg-secondary" : "hover:bg-secondary"
                    }`}
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <Main
        data={data}
        error={error}
        loading={loading}
        activeTab={activeTab}
        handleTabClick={handleTabClick}
        handleSynonymAntonymClick={handleSynonymAntonymClick}
      />
    </div>
  );
}

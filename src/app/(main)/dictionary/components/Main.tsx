"use client";

import { useState, useEffect, useMemo } from "react";
import { DictionaryResponse } from "@/lib/types";
import ErrorMessage from "./ErrorMessage";
import DictionaryLoadingSkeleton from "./LoadingSkeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";

interface MainProps {
  data: DictionaryResponse | null;
  error: string;
  loading: boolean;
  activeTab: "meanings" | "synonyms";
  handleTabClick: (tab: "meanings" | "synonyms") => void;
  handleSynonymAntonymClick: (word: string) => void;
}

export default function Main({
  data,
  error,
  loading,
  activeTab,
  handleTabClick,
  handleSynonymAntonymClick,
}: MainProps) {
  const [relatedWords, setRelatedWords] = useState<string[]>([]);
  const [visibleWords, setVisibleWords] = useState<string[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [relatedError, setRelatedError] = useState("");
  const [showMoreState, setShowMoreState] = useState<"show-more" | "show-less">("show-more");

  // Memoize combined synonyms and antonyms to avoid redundant processing
  const combinedSynonymsAntonyms = useMemo(() => {
    if (!data) return { synonyms: [], antonyms: [] };
    
    const allSynonyms = new Set<string>();
    const allAntonyms = new Set<string>();
    
    data.meanings.forEach(meaning => {
      meaning.synonyms.forEach(syn => allSynonyms.add(syn));
      meaning.antonyms.forEach(ant => allAntonyms.add(ant));
      meaning.definitions.forEach(def => {
        def.synonyms.forEach(syn => allSynonyms.add(syn));
        def.antonyms.forEach(ant => allAntonyms.add(ant));
      });
    });
    
    return {
      synonyms: Array.from(allSynonyms),
      antonyms: Array.from(allAntonyms)
    };
  }, [data]);

  useEffect(() => {
    if (activeTab === "synonyms" && data?.word && relatedWords.length === 0) {
      fetchRelatedWords(data.word);
    }
  }, [activeTab, data]);

  const fetchRelatedWords = async (word: string) => {
    setRelatedError("");
    setRelatedLoading(true);
    setRelatedWords([]);
    setVisibleWords([]);
    setShowMoreState("show-more");

    try {
      const response = await fetch(`https://api.datamuse.com/words?ml=${word}&max=30`);
      if (!response.ok) {
        throw new Error("Unable to fetch related words at this time.");
      }
      const result = await response.json();
      const words = result.map((item: { word: string }) => item.word).filter((w: string) => w !== word);

      if (words.length === 0) {
        setRelatedError("No related words found.");
        return;
      }

      setRelatedWords(words);
      setVisibleWords(words.slice(0, 15));
      if (words.length > 15) {
        setShowMoreState("show-more");
      }
    } catch (err) {
      if (err instanceof Error) {
        setRelatedError(err.message);
      } else {
        setRelatedError("Failed to load related words.");
      }
    } finally {
      setRelatedLoading(false);
    }
  };

  const handleShowMoreClick = () => {
    if (showMoreState === "show-more") {
      setVisibleWords(relatedWords);
      setShowMoreState("show-less");
    } else {
      setVisibleWords(relatedWords.slice(0, 15));
      setShowMoreState("show-more");
    }
  };

  return (
    <div className="w-full">
      {error && <ErrorMessage message={error} />}
      {loading && <DictionaryLoadingSkeleton />}

      {data && (
        <div className="bg-card rounded-xl border w-full">
          {/* Header Section */}
          <div className="p-4 sm:p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-semibold text-foreground truncate">{data.word}</h1>
                {data.phonetics.length > 0 && data.phonetics[0].text && (
                  <p className="text-muted-foreground mt-1 text-sm sm:text-base">/{data.phonetics[0].text}/</p>
                )}
              </div>
              {data.phonetics.length > 0 && data.phonetics[0].audio && (
                <div className="ml-4 flex-shrink-0">
                  <audio controls className="h-8 w-20 sm:w-auto">
                    <source src={data.phonetics[0].audio} type="audio/mpeg" />
                  </audio>
                </div>
              )}
            </div>
          </div>
          {/* Content Section */}
          <div className="p-4 sm:p-6">
            <Tabs value={activeTab} onValueChange={(value) => handleTabClick(value as "meanings" | "synonyms")}>
              <TabsList className="w-full bg-muted/30 mb-4 sm:mb-6">
                <TabsTrigger value="meanings" className="flex-1 text-sm sm:text-base">Definitions</TabsTrigger>
                <TabsTrigger value="synonyms" className="flex-1 text-sm sm:text-base">Related</TabsTrigger>
              </TabsList>

            <TabsContent value="meanings" className="space-y-3 sm:space-y-4">
              {data.meanings.slice(0, 2).map((meaning, index) => (
                <div key={index} className="space-y-2 sm:space-y-3">
                  <h3 className="text-xs sm:text-sm font-medium text-primary uppercase tracking-wide">
                    {meaning.partOfSpeech}
                  </h3>
                  <div className="space-y-2">
                    {meaning.definitions.slice(0, 2).map((definition, idx) => (
                      <div key={idx} className="group">
                        <p className="text-sm sm:text-base text-foreground leading-relaxed">
                          {meaning.definitions.length > 1 && (
                            <span className="text-muted-foreground mr-2 text-xs sm:text-sm">{idx + 1}.</span>
                          )}
                          {definition.definition}
                        </p>
                        {definition.example && (
                          <p className="text-xs sm:text-sm text-muted-foreground italic mt-1 pl-3 sm:pl-4 border-l-2 border-muted">
                            "{definition.example}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="synonyms" className="space-y-3 sm:space-y-4">
              {/* Dictionary Synonyms & Antonyms - More Compact */}
              {(combinedSynonymsAntonyms.synonyms.length > 0 || combinedSynonymsAntonyms.antonyms.length > 0) && (
                <div className="space-y-3">
                  {combinedSynonymsAntonyms.synonyms.length > 0 && (
                    <div>
                      <h3 className="text-xs sm:text-sm font-medium text-foreground mb-2">Similar</h3>
                      <div className="flex flex-wrap gap-1 sm:gap-1.5">
                        {combinedSynonymsAntonyms.synonyms.slice(0, 12).map((synonym, idx) => (
                          <button
                            key={idx}
                            className="px-2 sm:px-2.5 py-1 rounded-md text-xs bg-primary/5 text-primary hover:bg-primary/10 transition-colors border border-primary/10"
                            onClick={() => handleSynonymAntonymClick(synonym)}
                          >
                            {synonym}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {combinedSynonymsAntonyms.antonyms.length > 0 && (
                    <div>
                      <h3 className="text-xs sm:text-sm font-medium text-foreground mb-2">Opposite</h3>
                      <div className="flex flex-wrap gap-1 sm:gap-1.5">
                        {combinedSynonymsAntonyms.antonyms.slice(0, 8).map((antonym, idx) => (
                          <button
                            key={idx}
                            className="px-2 sm:px-2.5 py-1 rounded-md text-xs bg-destructive/5 text-destructive hover:bg-destructive/10 transition-colors border border-destructive/10"
                            onClick={() => handleSynonymAntonymClick(antonym)}
                          >
                            {antonym}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Related Words - Simplified */}
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-foreground mb-2">Related</h3>
                {relatedLoading && (
                  <div className="flex gap-1 sm:gap-1.5 flex-wrap">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="h-6 w-12 sm:w-16 bg-muted animate-pulse rounded-md" />
                    ))}
                  </div>
                )}
                {relatedError && (
                  <p className="text-xs text-muted-foreground">{relatedError}</p>
                )}
                {!relatedLoading && visibleWords.length > 0 && (
                  <div className="flex flex-wrap gap-1 sm:gap-1.5">
                    {visibleWords.slice(0, 15).map((word, idx) => (
                      <button
                        key={idx}
                        className="px-2 sm:px-2.5 py-1 rounded-md text-xs bg-secondary/50 text-secondary-foreground hover:bg-secondary/70 transition-colors"
                        onClick={() => handleSynonymAntonymClick(word)}
                      >
                        {word}
                      </button>
                    ))}
                  </div>
                )}
                {!relatedLoading && !relatedError && visibleWords.length === 0 && (
                  <p className="text-xs text-muted-foreground">No related words available</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
          </div>
        </div>
      )}
    </div>
  );
}

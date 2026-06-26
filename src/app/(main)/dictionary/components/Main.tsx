"use client";

import { useState, useMemo } from "react";
import { DictionaryResponse } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import ErrorMessage from "./ErrorMessage";
import DictionaryLoadingSkeleton from "./LoadingSkeleton";
import { Volume2, VolumeX } from "lucide-react";
import kyInstance from "@/lib/ky";

interface MainProps {
  data: DictionaryResponse | null;
  error: string;
  loading: boolean;
  handleSynonymAntonymClick: (word: string) => void;
}

export default function Main({
  data,
  error,
  loading,
  handleSynonymAntonymClick,
}: MainProps) {
  const [, setShowMoreState] = useState<"show-more" | "show-less">("show-more");
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

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

  // Query for related words
  const { 
    data: relatedWordsData, 
    isFetching: relatedLoading, 
    error: relatedErrorObj 
  } = useQuery({
    queryKey: ["related-words", data?.word],
    queryFn: async () => {
      if (!data?.word) return [];
      const response = await kyInstance.get(`https://api.datamuse.com/words?ml=${data.word}&max=30`).json<{ word: string }[]>();
      const words = response.map(item => item.word).filter(w => w !== data.word);
      if (words.length === 0) {
        throw new Error("No related words found.");
      }
      return words;
    },
    enabled: !!data?.word,
    staleTime: 1000 * 60 * 60, // 1 hour cache
    retry: false,
    refetchOnWindowFocus: false,
  });

  const visibleWords = useMemo(() => {
    if (!relatedWordsData) return [];
    if (relatedWordsData.length > 15) {
      setShowMoreState("show-more");
    }
    return relatedWordsData.slice(0, 15);
  }, [relatedWordsData]);

  const relatedError = relatedErrorObj ? relatedErrorObj.message : "";

  const playPhonetic = (audioUrl: string) => {
    if (playingAudio === audioUrl) {
      setPlayingAudio(null);
      const audioElements = document.querySelectorAll('audio');
      audioElements.forEach(audio => {
        if (audio.src === audioUrl) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
    } else {
      const audioElements = document.querySelectorAll('audio');
      audioElements.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });

      setPlayingAudio(audioUrl);
      const audio = new Audio(audioUrl);
      audio.play().catch(err => {
        console.error('Error playing audio:', err);
        setPlayingAudio(null);
      });

      audio.onended = () => {
        setPlayingAudio(null);
      };
    }
  };

  return (
    <div className="w-full">
      {error && <ErrorMessage message={error} />}
      {loading && <DictionaryLoadingSkeleton />}

      {data && (
        <div className="w-full">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-semibold text-foreground truncate">{data.word}</h1>
                {(() => {
                  const phoneticWithAudio = data.phonetics.find(p => p.text && p.audio);
                  const phoneticTextOnly = data.phonetics.find(p => p.text);

                  const selectedPhonetic = phoneticWithAudio || phoneticTextOnly;

                  if (selectedPhonetic) {
                    return (
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-muted-foreground text-sm sm:text-base">/{selectedPhonetic.text}/</p>
                        {selectedPhonetic.audio && (
                          <button
                            onClick={() => selectedPhonetic.audio && playPhonetic(selectedPhonetic.audio)}
                            className="flex items-center justify-center w-6 h-6 rounded-full bg-primary"
                          >
                            {playingAudio === selectedPhonetic.audio ? (
                              <VolumeX className="w-3 h-3 text-primary-foreground" />
                            ) : (
                              <Volume2 className="w-3 h-3 text-primary-foreground" />
                            )}
                          </button>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="space-y-3 sm:space-y-4 mb-6">
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
                            &quot;{definition.example}&quot;
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {(combinedSynonymsAntonyms.synonyms.length > 0 || combinedSynonymsAntonyms.antonyms.length > 0 || visibleWords.length > 0) && (
              <div className="space-y-4 border-t pt-4">
                {combinedSynonymsAntonyms.synonyms.length > 0 && (
                  <div>
                    <h3 className="text-xs sm:text-sm font-medium text-primary mb-2">SYNONYMS</h3>
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      {combinedSynonymsAntonyms.synonyms.slice(0, 12).map((synonym, idx) => (
                        <button
                          key={idx}
                          className="text-sm sm:text-base hover:underline transition-all cursor-pointer"
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
                    <h3 className="text-xs sm:text-sm font-medium text-destructive mb-2">ANTONYMS</h3>
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      {combinedSynonymsAntonyms.antonyms.slice(0, 8).map((antonym, idx) => (
                        <button
                          key={idx}
                          className="text-sm sm:text-base hover:underline transition-all cursor-pointer"
                          onClick={() => handleSynonymAntonymClick(antonym)}
                        >
                          {antonym}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-xs sm:text-sm font-medium text-primary mb-2">RELATED WORDS</h3>
                  {relatedLoading && (
                    <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                      {[...Array(8)].map((_, i) => (
                        <div key={i} className="h-6 w-12 sm:w-16 bg-muted animate-pulse rounded-lg" />
                      ))}
                    </div>
                  )}
                  {relatedError && (
                    <p className="text-xs text-muted-foreground">{relatedError}</p>
                  )}
                  {!relatedLoading && visibleWords.length > 0 && (
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      {visibleWords.slice(0, 15).map((word, idx) => (
                        <button
                          key={idx}
                          className="text-sm sm:text-base text-secondary-foreground hover:underline transition-all cursor-pointer"
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
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

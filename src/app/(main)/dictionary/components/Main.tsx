"use client";

import { useState, useEffect } from "react";
import { DictionaryResponse } from "@/lib/types";
import ErrorMessage from "./ErrorMessage";
import DictionaryLoadingSkeleton from "./LoadingSkeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";

interface MainProps {
  data: DictionaryResponse | null;
  error: string;
  loading: boolean;
  activeTab: "phonetics" | "meanings" | "synonyms" | "license";
  handleTabClick: (tab: "phonetics" | "meanings" | "synonyms" | "license") => void;
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

  useEffect(() => {
    if (activeTab === "synonyms" && data?.word) {
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
        throw new Error("Failed to fetch related words.");
      }
      const result = await response.json();
      const words = result.map((item: { word: string }) => item.word);

      setRelatedWords(words);
      setVisibleWords(words.slice(0, 15));
      if (words.length > 15) {
        setShowMoreState("show-more");
      }
    } catch (err) {
      if (err instanceof Error) {
        setRelatedError(err.message || "An error occurred while fetching related words.");
      } else {
        setRelatedError("An unknown error occurred while fetching related words.");
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
    <div className="w-full h-full">
      {error && <ErrorMessage message={error} />}
      {loading && <DictionaryLoadingSkeleton />}

      {data && (
        <div className="bg-card p-4 lg:p-7 rounded-2xl shadow-lg w-full h-full">
          <h1 className="text-3xl font-bold text-center mb-5 text-foreground">{data.word}</h1>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => handleTabClick(value as "phonetics" | "meanings" | "synonyms" | "license")}>
            <TabsList className="flex flex-wrap bg-background">
              <TabsTrigger value="phonetics">Phonetics</TabsTrigger>
              <TabsTrigger value="meanings">Meanings</TabsTrigger>
              <TabsTrigger value="synonyms">Synonyms & Antonyms</TabsTrigger>
              <TabsTrigger value="license">License & Source</TabsTrigger>
            </TabsList>

            <TabsContent value="phonetics">
              <div className="mb-6 h-full">
                <h3 className="text-lg font-semibold text-foreground border-b">Phonetics:</h3>
                {data.phonetics.map((phonetic, index) => (
                  <div key={index} className="mt-4 flex items-center justify-between">
                    {phonetic.text && (
                      <div className="text-muted-foreground flex flex-row gap-2 items-center">
                        <span className="font-semibold mr-1">{index + 1}.</span>
                        <p className="font-semibold">Text:</p> {phonetic.text}
                      </div>
                    )}
                    {phonetic.audio && (
                      <audio controls className="ml-4">
                        <source src={phonetic.audio} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="meanings">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground border-b">Meanings:</h3>
                {data.meanings.map((meaning, index) => (
                  <div key={index} className="mt-4">
                    <h4 className="text-md font-bold text-foreground underline">{meaning.partOfSpeech}</h4>
                    <div className="mt-2">
                      {meaning.definitions.length > 0 && (
                        <p className="text-muted-foreground font-semibold">
                          {meaning.definitions.length > 1 ? "Definitions:" : "Definition:"}
                        </p>
                      )}
                      <div className="mt-2">
                        {meaning.definitions.map((definition, idx) => (
                          <div key={idx} className="border rounded-lg p-4 mb-2">
                            <p className="text-muted-foreground">
                              {meaning.definitions.length > 1 && (
                                <span className="font-semibold mr-1">{idx + 1}.</span>
                              )}
                              {definition.definition}
                            </p>
                            {definition.example && (
                              <p className="mt-2 text-sm text-muted-foreground">
                                <span className="font-semibold">Example:</span> {definition.example}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="synonyms">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground border-b">Synonyms & Antonyms:</h3>
                {data.meanings.map((meaning, index) => (
                  <div key={index} className="mt-4">
                    <h4 className="text-md font-bold text-foreground underline">{meaning.partOfSpeech}</h4>
                    <div className="mt-2">
                      {meaning.synonyms.length > 0 && (
                        <div>
                          <p className="font-semibold text-foreground">Synonyms:</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {meaning.synonyms.map((synonym, idx) => (
                              <span
                                key={idx}
                                className="bg-background px-3 py-1 rounded-full text-sm text-muted-foreground hover:bg-secondary cursor-pointer"
                                onClick={() => handleSynonymAntonymClick(synonym)}
                              >
                                {synonym}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {meaning.antonyms.length > 0 && (
                        <div className="mt-4">
                          <p className="font-semibold text-foreground">Antonyms:</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {meaning.antonyms.map((antonym, idx) => (
                              <span
                                key={idx}
                                className="bg-background px-3 py-1 rounded-full text-sm text-muted-foreground hover:bg-secondary cursor-pointer"
                                onClick={() => handleSynonymAntonymClick(antonym)}
                              >
                                {antonym}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div className="mt-6 relative">
                  <h3 className="text-lg font-semibold text-foreground border-b">Related Words:</h3>
                  {relatedLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
                  {relatedError && <p className="text-sm text-destructive">{relatedError}</p>}
                  {!relatedLoading && visibleWords.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {visibleWords.map((word, idx) => (
                        <span
                          key={idx}
                          className="bg-background px-3 py-1 rounded-full text-sm text-muted-foreground hover:bg-secondary cursor-pointer"
                          onClick={() => handleSynonymAntonymClick(word)}
                        >
                          {word}
                        </span>
                      ))}
                    </div>
                  )}
                  {relatedWords.length > 15 && (
                    <button
                      className="text-primary absolute right-2 hover:underline mt-2 block text-sm"
                      onClick={handleShowMoreClick}
                    >
                      {showMoreState === "show-more" ? "Show More" : "Show Less"}
                    </button>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="license">
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-foreground border-b">License & Source:</h3>
                {data.license && (
                  <div className="mt-4">
                    <p className="text-muted-foreground">
                      <span className="font-semibold">License:</span>{" "}
                      <a
                        href={data.license.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {data.license.name}
                      </a>
                    </p>
                  </div>
                )}
                {data.sourceUrls.map((url, index) => (
                  <div key={index} className="flex flex-row gap-2 mt-2 items-center">
                    <p className="text-muted-foreground font-semibold">Source:</p>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline block"
                    >
                      {url}
                    </a>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}

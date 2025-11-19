"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FaMagnifyingGlass, FaX } from "react-icons/fa6";
import kyInstance from "@/lib/ky";
import Image from "next/image";
import { Loader2 } from "lucide-react";

interface GifPickerProps {
  onSelect: (gifUrl: string) => void;
  onClose: () => void;
}

interface TenorGif {
  id: string;
  media_formats: {
    gif: {
      url: string;
      dims: [number, number];
    };
    tinygif: {
      url: string;
      dims: [number, number];
    };
  };
  content_description: string;
}

interface TenorResponse {
  results: TenorGif[];
  next: string;
}

export default function GifPicker({ onSelect, onClose }: GifPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [gifs, setGifs] = useState<TenorGif[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [nextPos, setNextPos] = useState("");

  const fetchGifs = async (query: string, pos?: string) => {
    setIsLoading(true);
    try {
      const searchParams: Record<string, string> = {};
      if (query) {
        searchParams.q = query;
      } else {
        searchParams.type = "trending";
      }
      if (pos) {
        searchParams.pos = pos;
      }

      const response = await kyInstance
        .get("/api/tenor", { searchParams })
        .json<TenorResponse>();

      if (pos) {
        setGifs((prev) => [...prev, ...response.results]);
      } else {
        setGifs(response.results);
      }
      setNextPos(response.next);
    } catch (error) {
      console.error("Error fetching GIFs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGifs("");
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchGifs(searchQuery);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && !isLoading && nextPos) {
      fetchGifs(searchQuery, nextPos);
    }
  };

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="flex items-center gap-2 border-b p-3">
        <form onSubmit={handleSearch} className="relative flex-1">
          <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search GIFs..."
            className="pl-9 bg-card text-card-foreground"
          />
        </form>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <FaX />
        </Button>
      </div>

      <div
        className="flex-1 overflow-y-auto p-2"
        onScroll={handleScroll}
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {gifs.map((gif) => (
            <button
              key={gif.id}
              className="relative aspect-video w-full overflow-hidden rounded-md bg-muted transition-opacity hover:opacity-80"
              onClick={() => onSelect(gif.media_formats.gif.url)}
            >
              <Image
                src={gif.media_formats.tinygif.url}
                alt={gif.content_description}
                fill
                className="object-cover"
                unoptimized
              />
            </button>
          ))}
        </div>
        {isLoading && (
          <div className="flex justify-center p-4">
            <Loader2 className="animate-spin text-primary" />
          </div>
        )}
      </div>
    </div>
  );
}

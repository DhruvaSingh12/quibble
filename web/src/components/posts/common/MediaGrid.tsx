"use client";

import type { Media } from "@prisma/client";
import { Play } from "lucide-react";
import { useRef, useState, useCallback } from "react";
import PdfPreviewCard from "./PdfPreviewCard";

interface MediaGridProps {
  attachments: Media[];
}

export default function MediaGrid({ attachments }: MediaGridProps) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none">
      {attachments.map((media) => (
        <div
          key={media.id}
          className="relative flex-none h-[200px] md:h-[280px] rounded-lg overflow-hidden bg-muted/30 snap-start border"
        >
          {media.type === "PDF" || media.mimeType === "application/pdf" ? (
            <PdfPreviewCard url={media.url} className="h-[200px] md:h-[280px] rounded-lg border-none" />
          ) : media.type === "VIDEO" ? (
            <VideoPlayer media={media} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={media.url}
              alt="Post attachment"
              className="h-full w-auto min-w-[150px] max-w-[85vw] object-cover"
            />
          )}
        </div>
      ))}
    </div>
  );
}

// Click-to-play video component
function VideoPlayer({ media }: { media: Media }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
  }, []);

  return (
    <>
      <video
        ref={videoRef}
        src={media.url}
        className="h-full w-auto min-w-[200px] max-w-[85vw] object-cover bg-foreground/5"
        preload="metadata"
        controls={isPlaying}
        playsInline
        muted={false}
        onClick={(e) => {
          if (!isPlaying) {
            e.preventDefault();
            handlePlay();
          }
        }}
        onPause={handlePause}
        onEnded={handleEnded}
      />
      {!isPlaying && (
        <button
          onClick={handlePlay}
          className="absolute inset-0 flex items-center justify-center bg-foreground/20 transition-colors hover:bg-foreground/30"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background/90 shadow-lg transition-transform hover:scale-110">
            <Play className="h-6 w-6 text-foreground fill-foreground ml-0.5" />
          </div>
        </button>
      )}
    </>
  );
}

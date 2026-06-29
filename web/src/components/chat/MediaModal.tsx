import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Check, CheckCheck } from 'lucide-react';
import { format } from "date-fns";
import { CustomVideoPlayer } from './MediaPlayers';

interface MediaModalProps {
    isOpen: boolean;
    onClose: () => void;
    mediaList: { type: "image" | "gif" | "video"; content: string; createdAt?: string; readAt?: string; isMe?: boolean }[];
    initialIndex: number;
}

export function MediaModal({ isOpen, onClose, mediaList, initialIndex }: MediaModalProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    // Reset index when opened with a new initial index
    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex);
        }
    }, [isOpen, initialIndex]);

    const handlePrevious = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentIndex < mediaList.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowLeft" && currentIndex > 0) setCurrentIndex(prev => prev - 1);
            if (e.key === "ArrowRight" && currentIndex < mediaList.length - 1) setCurrentIndex(prev => prev + 1);
        };
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose, currentIndex, mediaList.length]);

    if (!isOpen || mediaList.length === 0) return null;

    const media = mediaList[currentIndex];
    if (!media) return null;

    return (
        <div
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-4"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-[90vw] md:max-w-[70vw] h-[70vh] bg-background border border-border/50 rounded-2xl shadow-2xl p-4 flex flex-col items-center justify-center animate-in zoom-in-95 duration-200 group/modal"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking media
            >
                <button
                    className="absolute top-3 p-2 right-3 z-50 text-muted-foreground hover:text-foreground rounded-full transition-colors"
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                >
                    <X className="w-5 h-5" />
                </button>

                {currentIndex > 0 && (
                    <button
                        className="absolute left-2 md:left-4 top-1/2 px-2 -translate-y-1/2 z-50 transition-colors text-foreground"
                        onClick={handlePrevious}
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                )}

                {currentIndex < mediaList.length - 1 && (
                    <button
                        className="absolute right-2 md:right-4 top-1/2 px-2 -translate-y-1/2 z-50 transition-colors text-foreground"
                        onClick={handleNext}
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                )}

                {media.type === "video" ? (
                    <div className="h-full w-full rounded-xl overflow-hidden bg-muted/10 flex items-center justify-center">
                        <CustomVideoPlayer src={media.content} />
                    </div>
                ) : (
                    <div className="relative h-full w-full flex items-center justify-center overflow-hidden">
                        <img
                            src={media.content}
                            alt="Expanded media"
                            className="max-h-full w-auto max-w-full rounded-xl object-contain shadow-md select-none"
                        />
                        {media.type === "gif" && (
                            <div className="absolute bottom-4 left-4 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded shadow-sm backdrop-blur-sm pointer-events-none">
                                GIF
                            </div>
                        )}
                    </div>
                )}

                {media.createdAt && (
                    <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 flex items-center gap-1.5 text-[12px] font-medium text-white bg-black/50 px-2.5 py-1 rounded-full backdrop-blur-md pointer-events-none z-50 shadow-sm">
                        <span>{format(new Date(media.createdAt), "h:mm a")}</span>
                        {media.isMe && (media.readAt ? <CheckCheck className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />)}
                    </div>
                )}
            </div>
        </div>
    );
}

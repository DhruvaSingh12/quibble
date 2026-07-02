import React, { useEffect, useState, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Check, CheckCheck, Trash2, Smile } from 'lucide-react';
import { format } from "date-fns";
import { CustomVideoPlayer } from './MediaPlayers';
import PdfPreviewCard from '../posts/common/PdfPreviewCard';
import { FaFaceDizzy, FaFaceGrinWide, FaFaceGrinHearts, FaFaceGrinSquintTears, FaFaceKissWinkHeart, FaFaceSadCry, FaFaceSurprise, FaHeart, FaThumbsUp, FaFaceKiss, FaG, FaI, FaF } from 'react-icons/fa6';

const emojiMap: Record<string, any> = {
    'face-dizzy': FaFaceDizzy,
    'face-grin-wide': FaFaceGrinWide,
    'face-grin-hearts': FaFaceGrinHearts,
    'face-grin-squint-tears': FaFaceGrinSquintTears,
    'face-kiss-wink-heart': FaFaceKissWinkHeart,
    'face-sad-cry': FaFaceSadCry,
    'face-surprise': FaFaceSurprise,
    'heart': FaHeart,
    'thumbsup': FaThumbsUp,
    'face-kiss': FaFaceKiss,
};

interface MediaModalProps {
    isOpen: boolean;
    onClose: () => void;
    mediaList: {
        id?: string;
        type: "image" | "gif" | "video" | "pdf";
        content: string;
        createdAt?: string;
        readAt?: string;
        isMe?: boolean;
        reactions?: { userId: string, emoji: string }[];
    }[];
    initialIndex: number;
    onReact?: (messageId: string, emoji: string) => void;
    currentUserId?: string;
}

export function MediaModal({ isOpen, onClose, mediaList, initialIndex, onReact, currentUserId }: MediaModalProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [showReactPanel, setShowReactPanel] = useState(false);
    const [activeEmojiMenu, setActiveEmojiMenu] = useState<string | null>(null);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);

    // Reset states when opened with a new initial index or closing
    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex);
            setShowReactPanel(false);
            setActiveEmojiMenu(null);
        }
    }, [isOpen, initialIndex]);

    useEffect(() => {
        if (!activeEmojiMenu) return;
        const handleOutsideClick = () => setActiveEmojiMenu(null);
        window.addEventListener("click", handleOutsideClick);
        return () => window.removeEventListener("click", handleOutsideClick);
    }, [activeEmojiMenu]);

    const touchStartX = useRef<number | null>(null);
    const touchEndX = useRef<number | null>(null);
    const minSwipeDistance = 50;

    const handleTouchStart = (e: React.TouchEvent) => {
        longPressTimer.current = setTimeout(() => {
            setShowReactPanel(prev => !prev);
        }, 500);
        touchStartX.current = e.targetTouches[0].clientX;
        touchEndX.current = null;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        touchEndX.current = e.targetTouches[0].clientX;
    };

    const handleTouchEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        if (touchStartX.current && touchEndX.current) {
            const distance = touchStartX.current - touchEndX.current;
            const isLeftSwipe = distance > minSwipeDistance;
            const isRightSwipe = distance < -minSwipeDistance;

            if (isLeftSwipe && currentIndex < mediaList.length - 1) {
                setCurrentIndex(prev => prev + 1);
            } else if (isRightSwipe && currentIndex > 0) {
                setCurrentIndex(prev => prev - 1);
            }
        }
        touchStartX.current = null;
        touchEndX.current = null;
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setShowReactPanel(prev => !prev);
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setShowReactPanel(prev => !prev);
    };

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
                <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-2.5 bg-black/50 text-white px-3 py-1.5 rounded-full backdrop-blur-md z-50 shadow-sm text-[12px] font-medium h-[30px]">
                    {media.type === "gif" && (
                        <div className="flex items-center gap-0.5 text-white/95 border-r border-white/20 pr-2">
                            <FaG className="w-[10px] h-[10px]" />
                            <FaI className="w-[10px] h-[10px]" />
                            <FaF className="w-[10px] h-[10px]" />
                        </div>
                    )}

                    {onReact && media.id && (
                        <button
                            className={`transition-colors flex items-center justify-center ${showReactPanel ? 'text-primary-foreground bg-primary/20 p-0.5 rounded-full' : 'text-white/90 hover:text-white'}`}
                            onClick={(e) => { e.stopPropagation(); setShowReactPanel(prev => !prev); }}
                            title="React to media"
                        >
                            <Smile className="w-3.5 h-3.5" />
                        </button>
                    )}

                    {onReact && media.id && <div className="w-px h-3 bg-white/20" />}

                    <button
                        className="transition-colors flex items-center justify-center text-white/90 hover:text-white"
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        title="Close"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>

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
                    <div
                        className="h-full w-full rounded-xl overflow-hidden bg-muted/10 flex items-center justify-center cursor-pointer"
                        onContextMenu={handleContextMenu}
                        onDoubleClick={handleDoubleClick}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                        onTouchMove={handleTouchMove}
                    >
                        <CustomVideoPlayer src={media.content} />
                    </div>
                ) : media.type === "pdf" ? (
                    <div
                        className="relative h-full w-full flex items-center justify-center overflow-hidden cursor-pointer p-4 md:p-10"
                        onContextMenu={handleContextMenu}
                        onDoubleClick={handleDoubleClick}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                        onTouchMove={handleTouchMove}
                    >
                        <PdfPreviewCard url={media.content} className="max-w-[800px] w-full shadow-md" />
                    </div>
                ) : (
                    <div
                        className="relative h-full w-full flex items-center justify-center overflow-hidden cursor-pointer"
                        onContextMenu={handleContextMenu}
                        onDoubleClick={handleDoubleClick}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                        onTouchMove={handleTouchMove}
                    >
                        <img
                            src={media.content}
                            alt="Expanded media"
                            className="max-h-full w-auto max-w-full rounded-xl object-contain shadow-md select-none"
                        />
                    </div>
                )}

                {media.createdAt && (
                    <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 flex items-center gap-1.5 text-[12px] font-medium text-white bg-black/50 px-2.5 py-1 rounded-full backdrop-blur-md pointer-events-none z-50 shadow-sm">
                        <span>{format(new Date(media.createdAt), "h:mm a")}</span>
                        {media.isMe && (media.readAt ? <CheckCheck className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />)}
                    </div>
                )}

                {media.reactions && media.reactions.length > 0 && (
                    <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 flex items-center gap-2 bg-black/50 text-white px-3 py-1.5 rounded-full backdrop-blur-md z-50 shadow-sm text-[12px] font-medium h-[30px] pointer-events-auto">
                        {Object.entries(
                            media.reactions.reduce((acc, r) => {
                                acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                                return acc;
                            }, {} as Record<string, number>)
                        ).map(([emoji, count], index) => {
                            const Icon = emojiMap[emoji];
                            if (!Icon) return null;
                            const hasMyReaction = media.reactions?.some(r => r.userId === currentUserId && r.emoji === emoji);
                            return (
                                <React.Fragment key={emoji}>
                                    {index > 0 && <div className="w-px h-3 bg-white/20" />}
                                    <div
                                        onClick={(e) => {
                                            if (!hasMyReaction) return;
                                            e.stopPropagation();
                                            e.preventDefault();
                                            setActiveEmojiMenu(prev => prev === emoji ? null : emoji);
                                        }}
                                        className={`flex items-center gap-1 relative ${hasMyReaction ? 'cursor-pointer hover:text-white/80 transition-colors' : ''}`}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        {count > 1 && <span className="ml-0.5 text-[11px]">{count}</span>}

                                        {activeEmojiMenu === emoji && (
                                            <div className="absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground border border-border shadow-lg rounded-lg px-2 py-1.5 text-[11px] whitespace-nowrap z-50 flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-1 duration-150">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        e.preventDefault();
                                                        onReact?.(media.id!, emoji);
                                                        setActiveEmojiMenu(null);
                                                    }}
                                                    className="text-destructive hover:text-destructive/80 flex items-center gap-1 font-semibold"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    Remove
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </React.Fragment>
                            );
                        })}
                    </div>
                )}

                {onReact && media.id && showReactPanel && (
                    <div className="absolute bottom-16 md:bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 bg-background/90 border border-border shadow-lg p-1 rounded-2xl md:rounded-full backdrop-blur max-w-[90vw] md:max-w-none overflow-x-auto">
                        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1">
                            {[
                                { id: 'face-dizzy', icon: FaFaceDizzy },
                                { id: 'face-grin-wide', icon: FaFaceGrinWide },
                                { id: 'face-grin-hearts', icon: FaFaceGrinHearts },
                                { id: 'face-grin-squint-tears', icon: FaFaceGrinSquintTears },
                                { id: 'face-kiss-wink-heart', icon: FaFaceKissWinkHeart },
                                { id: 'face-sad-cry', icon: FaFaceSadCry },
                                { id: 'face-surprise', icon: FaFaceSurprise },
                                { id: 'heart', icon: FaHeart },
                                { id: 'thumbsup', icon: FaThumbsUp },
                                { id: 'face-kiss', icon: FaFaceKiss }
                            ].map((reaction) => {
                                const isSelected = media.reactions?.some(r => r.userId === currentUserId && r.emoji === reaction.id);
                                return (
                                    <button
                                        key={reaction.id}
                                        className={`p-1.5 hover:bg-muted rounded-full transition-transform active:scale-95 flex items-center justify-center ${isSelected ? 'bg-primary/10 scale-105 border border-primary/20' : ''}`}
                                        onClick={(e) => { e.stopPropagation(); onReact(media.id!, reaction.id); setShowReactPanel(false); }}
                                    >
                                        <reaction.icon className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-foreground'}`} />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

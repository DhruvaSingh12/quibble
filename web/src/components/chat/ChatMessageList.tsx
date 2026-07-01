import React, { useState, useEffect } from 'react';
import { Play, Check, CheckCheck, Trash2 } from 'lucide-react';
import { FaFaceDizzy, FaFaceGrinWide, FaFaceGrinHearts, FaFaceGrinSquintTears, FaFaceKissWinkHeart, FaFaceSadCry, FaFaceSurprise, FaHeart, FaThumbsUp, FaFaceKiss } from 'react-icons/fa6';
import { format, isSameDay, isToday, isYesterday } from "date-fns";
import { CustomAudioPlayer } from "@/components/chat/MediaPlayers";
import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import BounceLoader from "@/components/BounceLoader";
import { MediaModal } from "@/components/chat/MediaModal";

interface ChatPayload {
    type: "text" | "image" | "video" | "audio" | "gif";
    content: string;
}

interface ChatMessageListProps {
    messages: any[];
    user: any;
    peerTyping: boolean;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    hasMore: boolean;
    fetchMoreMessages: () => void;
    selectedMessageIds?: Set<string>;
    toggleMessageSelection?: (id: string) => void;
    selectionMode?: boolean;
    onReact?: (messageId: string, emoji: string) => void;
    onRemoveReaction?: (messageIds: string[], emoji: string) => void;
}

const ReactionBadge = ({
    reactions,
    isMe,
    currentUserId,
    messageIds,
    onRemoveReaction
}: {
    reactions?: { userId: string, emoji: string }[],
    isMe: boolean,
    currentUserId: string,
    messageIds: string[],
    onRemoveReaction?: (messageIds: string[], emoji: string) => void
}) => {
    if (!reactions || reactions.length === 0) return null;

    const [activeEmojiMenu, setActiveEmojiMenu] = useState<string | null>(null);

    useEffect(() => {
        if (!activeEmojiMenu) return;
        const handleOutsideClick = () => setActiveEmojiMenu(null);
        window.addEventListener("click", handleOutsideClick);
        return () => window.removeEventListener("click", handleOutsideClick);
    }, [activeEmojiMenu]);

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

    const grouped = reactions.reduce((acc, r) => {
        acc[r.emoji] = (acc[r.emoji] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className={`absolute -bottom-3 ${isMe ? 'right-2' : 'left-2'} flex items-center gap-1 z-30 pointer-events-none`}>
            {Object.entries(grouped).map(([emoji, count]) => {
                const Icon = emojiMap[emoji];
                if (!Icon) return null;
                const hasMyReaction = reactions.some(r => r.userId === currentUserId && r.emoji === emoji);
                const isSingle = count === 1;

                const shapeClass = isSingle ? "w-[26px] h-[26px]" : "h-[26px] px-2.5 gap-1";
                const colorClass = hasMyReaction
                    ? "bg-primary/15 border-primary/25 text-primary shadow-sm hover:bg-primary/25"
                    : "bg-muted/80 border-border/30 text-foreground shadow-sm hover:bg-muted";

                return (
                    <div
                        key={emoji}
                        onClick={(e) => {
                            if (!hasMyReaction) return;
                            e.stopPropagation();
                            e.preventDefault();
                            setActiveEmojiMenu(prev => prev === emoji ? null : emoji);
                        }}
                        className={`flex items-center justify-center rounded-full border text-[11px] font-semibold animate-in zoom-in duration-200 pointer-events-auto relative ${shapeClass} ${colorClass} ${hasMyReaction ? 'cursor-pointer' : ''}`}
                    >
                        <Icon className="w-3.5 h-3.5" />
                        {!isSingle && <span className="text-[10px] text-foreground/90 font-medium">{count}</span>}

                        {activeEmojiMenu === emoji && (
                            <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground border border-border shadow-lg rounded-lg px-2 py-1.5 text-[11px] whitespace-nowrap z-50 flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-1 duration-150">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        onRemoveReaction?.(messageIds, emoji);
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
                );
            })}
        </div>
    );
};

const ExpandableText = ({ content }: { content: string }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const limit = 400;
    const shouldTruncate = content.length > limit;

    if (!shouldTruncate) {
        return <p className="whitespace-pre-wrap wrap-break-word leading-relaxed">{content}</p>;
    }

    const displayedText = isExpanded ? content : `${content.slice(0, limit)}...`;

    return (
        <div>
            <p className="whitespace-pre-wrap wrap-break-word leading-relaxed">{displayedText}</p>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setIsExpanded(!isExpanded);
                }}
                className="text-[11px] mt-1 block font-semibold hover:underline opacity-80 hover:opacity-100 transition-opacity underline-offset-2"
                style={{ color: 'inherit' }}
            >
                {isExpanded ? "See less" : "See more"}
            </button>
        </div>
    );
};

export function ChatMessageList({
    messages,
    user,
    peerTyping,
    messagesEndRef,
    hasMore,
    fetchMoreMessages,
    selectedMessageIds = new Set(),
    toggleMessageSelection = () => { },
    selectionMode = false,
    onReact,
    onRemoveReaction
}: ChatMessageListProps) {
    const chronMessages = messages.slice().reverse();
    const allMedia = chronMessages
        .filter(m => !m.deletedAt && ["image", "gif", "video"].includes(m.payload?.type))
        .map(m => ({
            ...m.payload,
            id: m.id || m.localId,
            createdAt: m.createdAt,
            readAt: m.readAt,
            isMe: m.senderId === user?.id,
            reactions: m.reactions
        }));

    const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(null);
    const longPressTimer = React.useRef<NodeJS.Timeout | null>(null);

    const handleMessageInteraction = (e: React.MouseEvent | React.TouchEvent, id: string, isContextMenu: boolean = false) => {
        if (isContextMenu) {
            e.preventDefault();
            toggleMessageSelection(id);
            return;
        }
        if (selectionMode) {
            e.preventDefault();
            toggleMessageSelection(id);
        }
    };

    const handleTouchStart = (id: string) => {
        if (selectionMode) return;
        longPressTimer.current = setTimeout(() => {
            toggleMessageSelection(id);
        }, 500); // 500ms for long press
    };

    const handleTouchEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    const handleMediaClick = (payload: ChatPayload, messageId: string) => {
        if (selectionMode) {
            toggleMessageSelection(messageId);
            return;
        }
        const idx = allMedia.findIndex(m => m.content === payload.content);
        if (idx !== -1) setSelectedMediaIndex(idx);
    };

    const renderMessageContent = (payload: ChatPayload, messageId: string, compact = false) => {
        if (!payload) return null;
        switch (payload.type) {
            case "image":
            case "gif":
                return compact ? (
                    <div className="relative w-full bg-muted/20 overflow-hidden group/media cursor-pointer block rounded-xl" onClick={() => handleMediaClick(payload, messageId)}>
                        <img src={payload.content} alt="Media" className="w-full h-auto object-cover transition-transform group-hover/item:scale-105 duration-500 block rounded-xl" />
                        {payload.type === "gif" && <div className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[9px] font-bold px-1 rounded backdrop-blur-sm pointer-events-none">GIF</div>}
                    </div>
                ) : (
                    <div className="relative h-full w-full bg-transparent overflow-hidden flex items-center justify-center cursor-pointer group/item" onClick={() => handleMediaClick(payload, messageId)}>
                        <img
                            src={payload.content}
                            alt="Media"
                            className="h-full w-auto max-w-full rounded-xl shadow-sm object-cover transition-transform group-hover/item:scale-105 duration-500"
                        />
                        {payload.type === "gif" && (
                            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm backdrop-blur-sm pointer-events-none">
                                GIF
                            </div>
                        )}
                    </div>
                );
            case "video":
                return compact ? (
                    <div className="relative w-full bg-muted/20 overflow-hidden group/media cursor-pointer block rounded-xl" onClick={() => handleMediaClick(payload, messageId)}>
                        <video src={payload.content} className="w-full h-auto object-cover opacity-90 block rounded-xl" />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/10">
                            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-md border border-white/20">
                                <Play className="w-5 h-5 ml-1" fill="currentColor" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="relative h-full w-full bg-black rounded-xl overflow-hidden flex items-center justify-center cursor-pointer group/item" onClick={() => handleMediaClick(payload, messageId)}>
                        <video src={payload.content} className="h-full w-auto max-w-full rounded-xl shadow-sm object-cover opacity-90 transition-transform group-hover/item:scale-105 duration-500" />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white shadow-md border border-white/20">
                                <Play className="w-6 h-6 ml-1" fill="currentColor" />
                            </div>
                        </div>
                    </div>
                );
            case "audio":
                return <CustomAudioPlayer src={payload.content} />;
            case "text":
            default:
                return <ExpandableText content={payload.content || "Empty"} />;
        }
    };
    const formatDateSeparator = (date: Date) => {
        if (isToday(date)) return "Today";
        if (isYesterday(date)) return "Yesterday";
        return format(date, "MMMM d, yyyy");
    };

    const groupedMessages: any[] = [];
    let lastDate: Date | null = null;

    for (let i = 0; i < chronMessages.length; i++) {
        const m = chronMessages[i];

        const mDate = new Date(m.createdAt || Date.now());
        if (!lastDate || !isSameDay(lastDate, mDate)) {
            groupedMessages.push({ type: "date_separator", text: formatDateSeparator(mDate) });
            lastDate = mDate;
        }

        const payloadType = m.payload?.type;
        const isMedia = payloadType === "image" || payloadType === "gif" || payloadType === "video";

        if (isMedia) {
            const mediaGroup = [m];
            while (i + 1 < chronMessages.length) {
                const next = chronMessages[i + 1];
                const nextPayloadType = next.payload?.type;
                const nextIsMedia = nextPayloadType === "image" || nextPayloadType === "gif" || nextPayloadType === "video";
                if (nextIsMedia && next.senderId === m.senderId) {
                    mediaGroup.push(next);
                    i++;
                } else {
                    break;
                }
            }
            if (mediaGroup.length > 1) {
                groupedMessages.push({ type: "media_group", senderId: m.senderId, messages: mediaGroup });
            } else {
                groupedMessages.push({ type: "single", message: m });
            }
        } else {
            groupedMessages.push({ type: "single", message: m });
        }
    }

    return (
        <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
                {hasMore && (
                    <InfiniteScrollContainer onButtonReached={fetchMoreMessages} className="flex justify-center py-4">
                        <BounceLoader />
                    </InfiniteScrollContainer>
                )}

                {groupedMessages.map((group, groupIdx) => {
                    if (group.type === "date_separator") {
                        return (
                            <div key={`date-${groupIdx}`} className="flex justify-center my-4">
                                <span className="bg-muted/50 text-muted-foreground text-[11px] font-medium px-3 py-1 rounded-full shadow-sm">
                                    {group.text}
                                </span>
                            </div>
                        );
                    }

                    if (group.type === "single") {
                        const m = group.message;
                        const isMe = m.senderId === user?.id;
                        const isText = m.payload?.type === "text" || !m.payload;
                        const isMedia = !isText && ["image", "gif", "video"].includes(m.payload?.type);

                        const isSelected = selectedMessageIds.has(m.id) || (m.localId && selectedMessageIds.has(m.localId));
                        const interactionId = m.id || m.localId;

                        if (m.deletedAt) {
                            return (
                                <div key={m.localId || m.id} className={`flex w-full ${isMe ? "justify-end" : "justify-start"} items-center group my-2`}>
                                    {selectionMode && (
                                        <div className="shrink-0 mr-3">
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"}`}>
                                                {isSelected && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                                            </div>
                                        </div>
                                    )}
                                    <div
                                        className={`rounded-xl px-4 py-2 border border-border/40 shadow-sm flex items-center gap-2 text-sm text-muted-foreground italic bg-muted/20 cursor-pointer relative overflow-hidden`}
                                        onClick={(e) => handleMessageInteraction(e, interactionId)}
                                        onContextMenu={(e) => handleMessageInteraction(e, interactionId, true)}
                                        onTouchStart={() => handleTouchStart(interactionId)}
                                        onTouchEnd={handleTouchEnd}
                                        onTouchMove={handleTouchEnd}
                                    >
                                        {isSelected && <div className="absolute inset-0 bg-primary/20 z-10 pointer-events-none"></div>}
                                        <Trash2 className="w-4 h-4 opacity-70" />
                                        This message was deleted
                                    </div>
                                </div>
                            );
                        }

                        const hasReactions = m.reactions && m.reactions.length > 0;
                        if (isMedia) {
                            return (
                                <div key={m.localId || m.id} className={`flex w-full ${isMe ? "justify-end" : "justify-start"} items-center group ${hasReactions ? "pb-3" : ""}`}>
                                    {selectionMode && (
                                        <div className="shrink-0 mr-3">
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"}`}>
                                                {isSelected && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                                            </div>
                                        </div>
                                    )}
                                    <div
                                        className={`relative ${isMe ? "items-end" : "items-start"} opacity-100 transition-opacity cursor-pointer`}
                                        onClick={(e) => handleMessageInteraction(e, interactionId)}
                                        onContextMenu={(e) => handleMessageInteraction(e, interactionId, true)}
                                        onTouchStart={() => handleTouchStart(interactionId)}
                                        onTouchEnd={handleTouchEnd}
                                        onTouchMove={handleTouchEnd}
                                    >
                                        <div className="rounded-2xl w-fit max-w-[250px] sm:max-w-[300px] h-[250px] bg-muted/20 border border-border/10 shadow-sm p-1 relative">
                                            {isSelected && <div className="absolute inset-0 bg-primary/20 z-20 pointer-events-none rounded-2xl"></div>}
                                            <div className="relative w-full h-full overflow-hidden rounded-xl pointer-events-auto">
                                                {renderMessageContent(m.payload, m.id, false)}
                                                <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[10px] text-white bg-black/40 px-1.5 py-0.5 rounded-full backdrop-blur-sm pointer-events-none">
                                                    <span>{format(new Date(m.createdAt || Date.now()), "h:mm a")}</span>
                                                    {isMe && (m.readAt ? <CheckCheck className="w-[14px] h-[14px] ml-0.5" strokeWidth={1.5} /> : <Check className="w-[13px] h-[13px] ml-0.5" strokeWidth={1.5} />)}
                                                </div>
                                            </div>
                                        </div>
                                        <ReactionBadge
                                            reactions={m.reactions}
                                            isMe={isMe}
                                            currentUserId={user?.id}
                                            messageIds={[m.id]}
                                            onRemoveReaction={onRemoveReaction}
                                        />
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div key={m.localId || m.id} className={`flex w-full ${isMe ? "justify-end" : "justify-start"} items-center group ${hasReactions ? "pb-3" : ""}`}>
                                {selectionMode && (
                                    <div className="shrink-0 mr-3">
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"}`}>
                                            {isSelected && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                                        </div>
                                    </div>
                                )}
                                <div className={`
                                    max-w-[85%] lg:max-w-[70%] relative
                                    ${isMe ? "items-end" : "items-start"}
                                    ${m.isError ? "opacity-80 ring-2 ring-destructive" : ""} 
                                    ${m.isSending ? "opacity-60 transition-opacity" : "opacity-100 transition-opacity"}
                                `}>
                                    <div
                                        className={`
                                            rounded-2xl px-4 py-2.5 shadow-sm min-w-[80px] cursor-pointer relative overflow-hidden border
                                            ${isMe ? "bg-primary/10 text-primary border-primary/15 rounded-br-sm" : "bg-muted/40 border-border/30 text-foreground rounded-bl-sm"}
                                        `}
                                        onClick={(e) => handleMessageInteraction(e, interactionId)}
                                        onContextMenu={(e) => handleMessageInteraction(e, interactionId, true)}
                                        onTouchStart={() => handleTouchStart(interactionId)}
                                        onTouchEnd={handleTouchEnd}
                                        onTouchMove={handleTouchEnd}
                                    >
                                        {isSelected && <div className="absolute inset-0 bg-black/10 dark:bg-white/20 z-10 pointer-events-none"></div>}
                                        <div className="pointer-events-auto">
                                            {renderMessageContent(m.payload, m.id, false)}
                                            <div className="float-right flex items-center gap-1 text-[10px] opacity-70 mt-1 ml-3 -mb-1">
                                                <span>{format(new Date(m.createdAt || Date.now()), "h:mm a")}</span>
                                                {isMe && (m.readAt ? <CheckCheck className="w-[14px] h-[14px] ml-0.5" strokeWidth={1.5} /> : <Check className="w-[13px] h-[13px] ml-0.5" strokeWidth={1.5} />)}
                                            </div>
                                            <div className="clear-both" />
                                        </div>
                                    </div>
                                    <ReactionBadge
                                        reactions={m.reactions}
                                        isMe={isMe}
                                        currentUserId={user?.id}
                                        messageIds={[m.id]}
                                        onRemoveReaction={onRemoveReaction}
                                    />
                                </div>
                            </div>
                        );
                    } else {
                        const isMe = group.senderId === user?.id;
                        const groupReactions = group.messages.flatMap((m: any) => m.reactions || []);
                        const hasGroupReactions = groupReactions.length > 0;
                        return (
                            <div key={`group-${groupIdx}`} className="flex flex-col gap-1 relative z-10 w-full group/group">
                                <div className={`flex w-full ${isMe ? "justify-end" : "justify-start"} items-center ${hasGroupReactions ? "pb-3" : ""}`}>
                                    {selectionMode && (
                                        <div className="shrink-0 mr-3 self-end mb-2">
                                            <div className="w-5 h-5 rounded-full border flex items-center justify-center border-muted-foreground/30 opacity-0 pointer-events-none"></div>
                                        </div>
                                    )}
                                    <div className={`max-w-[85%] lg:max-w-[70%] relative ${isMe ? "items-end" : "items-start"} opacity-100 transition-opacity`}>
                                        <div className="columns-2 gap-1 rounded-2xl w-[250px] sm:w-[300px] bg-muted/20 border border-border/10 shadow-sm p-1">
                                            {group.messages.map((m: any) => {
                                                const interactionId = m.id || m.localId;
                                                const isSelected = selectedMessageIds.has(interactionId);
                                                return (
                                                    <div
                                                        key={m.localId || m.id}
                                                        className={`relative mb-2 overflow-visible group/item cursor-pointer rounded-xl break-inside-avoid pointer-events-auto`}
                                                        onClick={(e) => handleMessageInteraction(e, interactionId)}
                                                        onContextMenu={(e) => handleMessageInteraction(e, interactionId, true)}
                                                        onTouchStart={() => handleTouchStart(interactionId)}
                                                        onTouchEnd={handleTouchEnd}
                                                        onTouchMove={handleTouchEnd}
                                                    >
                                                        {isSelected && (
                                                            <div className="absolute inset-0 bg-primary/20 z-20 pointer-events-none flex items-center justify-center">
                                                                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-md">
                                                                    <Check className="w-4 h-4 text-primary-foreground" />
                                                                </div>
                                                            </div>
                                                        )}
                                                        {m.deletedAt ? (
                                                            <div className="w-full h-full min-h-[150px] flex flex-col items-center justify-center bg-muted/50 border border-border/40 text-muted-foreground p-4 gap-2 rounded-xl overflow-hidden">
                                                                <Trash2 className="w-5 h-5 opacity-70" />
                                                                <span className="text-xs text-center italic">Deleted</span>
                                                            </div>
                                                        ) : (
                                                            <div className="rounded-xl overflow-hidden relative">
                                                                {renderMessageContent(m.payload, m.id, true)}
                                                                <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[10px] text-white bg-black/40 px-1.5 py-0.5 rounded-full backdrop-blur-sm pointer-events-none">
                                                                    <span>{format(new Date(m.createdAt || Date.now()), "h:mm a")}</span>
                                                                    {isMe && (m.readAt ? <CheckCheck className="w-[14px] h-[14px] ml-0.5" strokeWidth={1.5} /> : <Check className="w-[13px] h-[13px] ml-0.5" strokeWidth={1.5} />)}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <ReactionBadge
                                            reactions={group.messages.flatMap((m: any) => m.reactions || [])}
                                            isMe={isMe}
                                            currentUserId={user?.id}
                                            messageIds={group.messages.map((m: any) => m.id)}
                                            onRemoveReaction={onRemoveReaction}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    }
                })}

                {
                    peerTyping && (
                        <div className="flex justify-start opacity-70 animate-in fade-in slide-in-from-bottom-2">
                            <div className="max-w-[75%] relative items-start">
                                <div className="rounded-2xl px-4 py-3 shadow-sm bg-muted/50 border border-border/50 rounded-bl-sm flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce delay-75"></div>
                                    <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce delay-150"></div>
                                </div>
                            </div>
                        </div>
                    )
                }

                <div ref={messagesEndRef} />
            </div >

            <MediaModal
                isOpen={selectedMediaIndex !== null}
                onClose={() => setSelectedMediaIndex(null)}
                mediaList={allMedia as any}
                initialIndex={selectedMediaIndex ?? 0}
                onReact={onReact}
                currentUserId={user?.id}
            />
        </>
    );
}
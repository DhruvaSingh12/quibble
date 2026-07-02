"use client";

import { useEffect, useState } from "react";
import ky from "@/lib/ky";
import Link from "next/link";
import UserAvatar from "@/components/UserAvatar";
import { formatDistanceToNow } from "date-fns";
import { decryptMessage } from "@/lib/chatCrypto";
import { useSocket } from "@/providers/SocketProvider";

type Conversation = {
    conversationId: string;
    keyHex: string;
    friend: {
        id: string;
        username: string;
        displayName: string;
        avatarUrl: string | null;
    };
    lastMessage: {
        id: string;
        senderId: string;
        text: string;
        createdAt: string;
        isRead: boolean;
        deletedAt?: string | null;
    } | null;
    unreadCount: number;
};

function formatLastMessageText(decryptedText: string, deletedAt?: string | null): string {
    if (deletedAt) {
        return "Message was deleted";
    }
    try {
        const payload = JSON.parse(decryptedText);
        if (payload && typeof payload === "object" && "type" in payload && "content" in payload) {
            switch (payload.type) {
                case "image":
                    return "Shared an image";
                case "video":
                    return "Shared a video";
                case "audio":
                    return "Shared an audio";
                case "pdf":
                    return "Shared a pdf";
                case "gif":
                    return "Shared a gif";
                case "text":
                default:
                    return payload.content || "";
            }
        }
    } catch {
        // Fallback if not stringified JSON
    }
    return decryptedText;
}

export default function MessagesInboxPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const socket = useSocket();

    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const url = `chat/conversations`;
                const res = await ky.get(url).json<{ conversations: Conversation[] }>();

                // Decrypt last messages
                const decrypted = await Promise.all(res.conversations.map(async c => {
                    if (c.lastMessage) {
                        try {
                            const decryptedText = await decryptMessage(c.lastMessage.text, c.keyHex);
                            c.lastMessage.text = formatLastMessageText(decryptedText, c.lastMessage.deletedAt);
                        } catch (e) {
                            c.lastMessage.text = "Decryption error";
                        }
                    }
                    return c;
                }));

                setConversations(decrypted);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchConversations();
    }, []);

    useEffect(() => {
        if (!socket) return;

        const handleUpdate = async (data: any) => {
            // find convo from current state
            setConversations(prev => {
                const idx = prev.findIndex(c => c.conversationId === data.conversationId);
                if (idx === -1) return prev;

                const convo = { ...prev[idx] };
                const keyHex = convo.keyHex;

                // Decrypt asynchronously
                if (data.lastMessage) {
                    decryptMessage(data.lastMessage.text, keyHex).then(decryptedText => {
                        setConversations(currentPrev => {
                            const newIdx = currentPrev.findIndex(c => c.conversationId === data.conversationId);
                            if (newIdx === -1) return currentPrev;
                            const newConvo = { ...currentPrev[newIdx] };
                            newConvo.lastMessage = {
                                ...data.lastMessage,
                                text: formatLastMessageText(decryptedText, data.lastMessage.deletedAt)
                            };
                            newConvo.unreadCount += 1;
                            const newArray = [...currentPrev];
                            newArray[newIdx] = newConvo;
                            return newArray.sort((a, b) => {
                                const at = a.lastMessage?.createdAt || "";
                                const bt = b.lastMessage?.createdAt || "";
                                return bt.localeCompare(at);
                            });
                        });
                    }).catch(() => { });
                } else {
                    // Handled if lastMessage becomes null (e.g. all messages deleted)
                    setConversations(currentPrev => {
                        const newIdx = currentPrev.findIndex(c => c.conversationId === data.conversationId);
                        if (newIdx === -1) return currentPrev;
                        const newConvo = { ...currentPrev[newIdx] };
                        newConvo.lastMessage = null;
                        const newArray = [...currentPrev];
                        newArray[newIdx] = newConvo;
                        return newArray;
                    });
                }

                return prev;
            });
        };

        socket.on("chat:conversation_update", handleUpdate);
        return () => {
            socket.off("chat:conversation_update", handleUpdate);
        };
    }, [socket]);

    if (loading) return <div className="p-4 text-center text-muted-foreground">Loading messages...</div>;

    return (
        <div className="flex flex-col h-full w-full">
            <div className="p-4 border-b">
                <h1 className="text-2xl font-bold">Messages</h1>
            </div>
            <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                        No messages yet.
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {conversations.map(c => (
                            <Link
                                href={`/messages/${c.conversationId}`}
                                key={c.conversationId}
                                className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors border-b last:border-b-0"
                            >
                                <UserAvatar avatarUrl={c.friend.avatarUrl} size={48} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <p className="font-semibold truncate">{c.friend.displayName}</p>
                                        <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                                            {c.lastMessage ? formatDistanceToNow(new Date(c.lastMessage.createdAt), { addSuffix: true }) : ""}
                                        </span>
                                    </div>
                                    <p className={`text-sm truncate ${c.unreadCount > 0 ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                                        {c.lastMessage ? c.lastMessage.text : "Say hi!"}
                                    </p>
                                </div>
                                {c.unreadCount > 0 && (
                                    <div className="bg-primary text-primary-foreground text-xs rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center font-bold">
                                        {c.unreadCount}
                                    </div>
                                )}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

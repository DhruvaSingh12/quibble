"use client";

import { useEffect, useState, useRef, use } from "react";
import ky from "ky";
import { encryptMessage, decryptMessage } from "@/lib/chatCrypto";
import { useSocket } from "@/providers/SocketProvider";
import { useSession } from "@/providers/SessionProvider";
import BounceLoader from "@/components/BounceLoader";
import { useUploadThing } from "@/lib/uploadthing";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatInputArea } from "@/components/chat/ChatInputArea";
import { ChatMessageList } from "@/components/chat/ChatMessageList";
import { ChatSelectionActionBar } from "@/components/chat/ChatSelectionActionBar";

interface ChatPayload {
    type: "text" | "image" | "video" | "audio" | "gif";
    content: string;
}

function parsePayload(raw: string): ChatPayload {
    try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && "type" in parsed && "content" in parsed) {
            return parsed as ChatPayload;
        }
    } catch {
        // Fallback for old plaintext messages
    }
    return { type: "text", content: raw };
}

export default function ChatRoomPage(props: { params: Promise<{ conversationId: string }> }) {
    const { conversationId } = use(props.params);
    const { user } = useSession();
    const socket = useSocket();

    const [messages, setMessages] = useState<any[]>([]);
    const [friend, setFriend] = useState<any>(null);
    const [keyHex, setKeyHex] = useState<string>("");
    const [isMutualFollow, setIsMutualFollow] = useState<boolean>(true);

    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState<boolean>(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set());
    const selectionMode = selectedMessageIds.size > 0;

    const [inputText, setInputText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [peerTyping, setPeerTyping] = useState(false);

    // UI Panels
    const [activePanel, setActivePanel] = useState<"none" | "emoji" | "gif" | "upload">("none");
    const [isUploading, setIsUploading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const fetchingInitial = useRef(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { startUpload } = useUploadThing("attachment");

    // Fetch conversation info
    useEffect(() => {
        const fetchInfo = async () => {
            try {
                const url = `/api/chat/conversations`;
                const res = await ky.get(url).json<{ conversations: any[] }>();

                const convo = res.conversations.find(c => c.conversationId === conversationId);
                if (convo) {
                    setFriend(convo.friend);
                    setKeyHex(convo.keyHex);
                    setIsMutualFollow(convo.isMutualFollow);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchInfo();
    }, [conversationId]);

    // Initial Fetch messages
    useEffect(() => {
        if (!keyHex || fetchingInitial.current) return;

        const fetchMessages = async () => {
            fetchingInitial.current = true;
            try {
                const url = `/api/chat/${conversationId}/messages?limit=40`;
                const res = await ky.get(url).json<{ messages: any[], nextCursor: string | null, hasMore: boolean }>();

                const decrypted = await Promise.all(res.messages.map(async (m) => {
                    try {
                        const rawDecrypted = await decryptMessage(m.text, keyHex);
                        return { ...m, payload: parsePayload(rawDecrypted) };
                    } catch {
                        return { ...m, payload: { type: "text", content: "Decryption error" } };
                    }
                }));

                setMessages(decrypted);
                setNextCursor(res.nextCursor);
                setHasMore(res.hasMore);

                setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: "instant" as ScrollBehavior });
                }, 100);
            } catch (err) {
                console.error(err);
            }
        };
        fetchMessages();
    }, [keyHex, conversationId]);

    const fetchMoreMessages = async () => {
        if (!keyHex || !hasMore || isLoadingMore || !nextCursor) return;
        setIsLoadingMore(true);
        try {
            const url = `/api/chat/${conversationId}/messages?limit=40&cursor=${nextCursor}`;
            const res = await ky.get(url).json<{ messages: any[], nextCursor: string | null, hasMore: boolean }>();

            const decrypted = await Promise.all(res.messages.map(async (m) => {
                try {
                    const rawDecrypted = await decryptMessage(m.text, keyHex);
                    return { ...m, payload: parsePayload(rawDecrypted) };
                } catch {
                    return { ...m, payload: { type: "text", content: "Decryption error" } };
                }
            }));

            setMessages(prev => {
                const existingIds = new Set(prev.map(p => p.id));
                const newMsgs = decrypted.filter(d => !existingIds.has(d.id));
                return [...prev, ...newMsgs];
            });
            setNextCursor(res.nextCursor);
            setHasMore(res.hasMore);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoadingMore(false);
        }
    };

    // Socket setup
    useEffect(() => {
        if (!socket || !keyHex) return;

        socket.emit("chat_join", { conversationId });
        socket.emit("chat_read", { conversationId });

        const handleNewMsg = (data: any) => {
            if (data.conversationId === conversationId) {
                decryptMessage(data.text, keyHex).then(decryptedText => {
                    const payload = parsePayload(decryptedText);
                    setMessages(prev => {
                        if (data.localId && prev.some(m => m.localId === data.localId)) {
                            return prev.map(m => m.localId === data.localId ? { ...m, ...data, payload } : m);
                        }
                        if (prev.some(m => m.id === data.id)) return prev;
                        return [{ ...data, payload }, ...prev];
                    });

                    if (data.senderId !== user?.id) {
                        socket.emit("chat_read", { conversationId });
                    }
                }).catch(() => { });
            }
        };

        const handleTyping = (data: any) => {
            if (data.senderId !== user?.id) {
                setPeerTyping(data.isTyping);
            }
        };

        const handleDeletedMsgs = (data: any) => {
            if (data.conversationId === conversationId && data.forEveryone) {
                setMessages(prev => prev.map(m => data.messageIds.includes(m.id) ? { ...m, deletedAt: new Date().toISOString() } : m));
            }
        };

        socket.on("chat_new_message", handleNewMsg);
        socket.on("chat_typing", handleTyping);
        socket.on("chat_messages_deleted", handleDeletedMsgs);

        return () => {
            socket.off("chat_new_message", handleNewMsg);
            socket.off("chat_typing", handleTyping);
            socket.off("chat_messages_deleted", handleDeletedMsgs);
        };
    }, [socket, keyHex, conversationId, user?.id]);

    const handleSendPayload = async (payload: ChatPayload) => {
        if (!socket || !keyHex || !isMutualFollow) return;

        setActivePanel("none");
        setIsTyping(false);
        socket.emit("chat_typing", { conversationId, isTyping: false });

        const localId = crypto.randomUUID();
        const optimisticMsg = {
            id: localId,
            localId,
            conversationId,
            senderId: user?.id,
            payload,
            createdAt: new Date().toISOString(),
            isSending: true
        };

        setMessages(prev => [optimisticMsg, ...prev]);
        scrollToBottom();

        try {
            const rawString = JSON.stringify(payload);
            const encrypted = await encryptMessage(rawString, keyHex);

            socket.emit("chat_message", {
                conversationId,
                text: encrypted,
                localId
            }, (response: any) => {
                if (response?.success) {
                    setMessages(prev => prev.map(m => m.localId === localId ? { ...m, id: response.message.id, isSending: false } : m));
                } else {
                    setMessages(prev => prev.map(m => m.localId === localId ? { ...m, isError: true, isSending: false } : m));
                }
            });
        } catch (error) {
            setMessages(prev => prev.map(m => m.localId === localId ? { ...m, isError: true, isSending: false } : m));
        }
    };

    const handleSendText = () => {
        if (!inputText.trim()) return;
        const text = inputText.trim();
        setInputText("");
        handleSendPayload({ type: "text", content: text });
    };

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputText(e.target.value);
        if (!socket || !isMutualFollow) return;

        if (!isTyping) {
            setIsTyping(true);
            socket.emit("chat_typing", { conversationId, isTyping: true });
        }
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            socket.emit("chat_typing", { conversationId, isTyping: false });
        }, 2000);
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const toggleMessageSelection = (id: string) => {
        setSelectedMessageIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const clearSelection = () => setSelectedMessageIds(new Set());

    const handleDeleteMessages = (forEveryone: boolean) => {
        if (!socket || selectedMessageIds.size === 0) return;
        const messageIds = Array.from(selectedMessageIds);
        
        socket.emit("chat_delete_messages", { conversationId, messageIds, forEveryone }, (res: any) => {
            if (res?.success) {
                if (!forEveryone) {
                    // Instantly remove from local view if deleted for me
                    setMessages(prev => prev.filter(m => !messageIds.includes(m.id) && !(m.localId && messageIds.includes(m.localId))));
                } else {
                    // Update to tombstones instantly
                    setMessages(prev => prev.map(m => (messageIds.includes(m.id) || (m.localId && messageIds.includes(m.localId))) ? { ...m, deletedAt: new Date().toISOString() } : m));
                }
                clearSelection();
            }
        });
    };

    const canDeleteEveryone = Array.from(selectedMessageIds).length > 0 && Array.from(selectedMessageIds).every(id => {
        const msg = messages.find(m => m.id === id || m.localId === id);
        return msg && msg.senderId === user?.id;
    });

    const onEmojiClick = (emojiData: any) => {
        setInputText(prev => prev + emojiData.emoji);
    };

    const onGifSelect = (url: string) => {
        handleSendPayload({ type: "gif", content: url });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        let type: ChatPayload["type"] = "text";
        if (file.type.startsWith("image/")) type = "image";
        else if (file.type.startsWith("video/")) type = "video";
        else if (file.type.startsWith("audio/")) type = "audio";
        else return alert("Unsupported file type.");

        setIsUploading(true);
        setActivePanel("none");
        try {
            const res = await startUpload([file]);
            if (res && res[0]) {
                const finalUrl = res[0].ufsUrl ?? res[0].url;
                handleSendPayload({ type, content: finalUrl });
            }
        } catch (error) {
            alert("File upload failed.");
        } finally {
            setIsUploading(false);
        }
    };

    if (!friend || !keyHex) return (
        <div className="flex h-full w-full items-center justify-center">
            <BounceLoader />
        </div>
    );

    return (
        <div className="flex flex-col h-full w-full relative overflow-hidden bg-background">
            {/* Header */}
            <ChatHeader friend={friend} peerTyping={peerTyping} />

            <ChatSelectionActionBar
                selectedCount={selectedMessageIds.size}
                onCancel={clearSelection}
                onDeleteMe={() => handleDeleteMessages(false)}
                onDeleteEveryone={() => handleDeleteMessages(true)}
                canDeleteEveryone={canDeleteEveryone}
            />

            {/* Messages Area */}
            <ChatMessageList 
                messages={messages}
                user={user}
                peerTyping={peerTyping}
                messagesEndRef={messagesEndRef}
                hasMore={hasMore}
                fetchMoreMessages={fetchMoreMessages}
                selectedMessageIds={selectedMessageIds}
                toggleMessageSelection={toggleMessageSelection}
                selectionMode={selectionMode}
            />

            {/* Input Area */}
            <ChatInputArea
                inputText={inputText}
                setInputText={setInputText}
                handleSendText={handleSendText}
                handleTyping={handleTyping}
                activePanel={activePanel}
                setActivePanel={setActivePanel}
                isUploading={isUploading}
                isMutualFollow={isMutualFollow}
                fileInputRef={fileInputRef}
                handleFileUpload={handleFileUpload}
                onEmojiClick={onEmojiClick}
                onGifSelect={onGifSelect}
            />
        </div>
    );
}

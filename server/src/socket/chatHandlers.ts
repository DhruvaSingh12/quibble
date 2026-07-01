import { Server } from "socket.io";
import { prisma } from "../config/prisma";

// Verify the user is part of the conversation
async function verifyConversationMember(conversationId: string, userId: string) {
    const convo = await prisma.chatConversation.findUnique({
        where: { id: conversationId },
        select: { user1Id: true, user2Id: true }
    });
    if (!convo) return null;
    if (convo.user1Id !== userId && convo.user2Id !== userId) return null;
    return convo;
}

async function emitConversationUpdate(io: Server, conversationId: string, userId: string) {
    const convo = await prisma.chatConversation.findUnique({
        where: { id: conversationId },
        include: {
            messages: {
                where: {
                    NOT: {
                        deletedFor: { has: userId }
                    }
                },
                orderBy: { createdAt: "desc" },
                take: 1,
                select: { id: true, senderId: true, text: true, createdAt: true, readAt: true, deletedAt: true }
            }
        }
    });

    if (!convo) return;

    const lastMessage = convo.messages[0];
    io.to(`user:${userId}`).emit("chat:conversation_update", {
        conversationId,
        lastMessage: lastMessage ? {
            id: lastMessage.id,
            senderId: lastMessage.senderId,
            text: lastMessage.text,
            createdAt: lastMessage.createdAt.toISOString(),
            isRead: lastMessage.readAt !== null || lastMessage.senderId === userId,
            deletedAt: lastMessage.deletedAt ? lastMessage.deletedAt.toISOString() : null,
        } : null
    });
}

export const registerChatHandlers = (io: Server, socket: any) => {

    socket.on("chat_join", async (data: { conversationId: string }) => {
        try {
            const userId = socket.data.user.id;
            const { conversationId } = data;

            const convo = await verifyConversationMember(conversationId, userId);
            if (!convo) {
                socket.emit("chat_error", { message: "Forbidden" });
                return;
            }

            const room = `chat:${conversationId}`;
            socket.join(room);

            // Cache recipient for fast message broadcasting
            const recipientId = convo.user1Id === userId ? convo.user2Id : convo.user1Id;
            if (!socket.data.chatRecipients) socket.data.chatRecipients = {};
            socket.data.chatRecipients[conversationId] = recipientId;

            socket.emit("chat_joined", { conversationId });
            socket.to(room).emit("chat_peer_online", { userId, conversationId });
        } catch (error) {
            console.error("Error in chat_join:", error);
        }
    });

    socket.on("chat_message", async (data: { conversationId: string, text: string, localId?: string }, callback?: (res: any) => void) => {
        try {
            const userId = socket.data.user.id;
            const { conversationId, text, localId } = data;

            if (!text || text.trim().length === 0) {
                if (callback) callback({ error: "Empty message" });
                return;
            }

            const room = `chat:${conversationId}`;
            if (!socket.rooms.has(room)) {
                const convo = await verifyConversationMember(conversationId, userId);
                if (!convo) {
                    if (callback) callback({ error: "Forbidden" });
                    return;
                }
                socket.join(room);
                const recipientId = convo.user1Id === userId ? convo.user2Id : convo.user1Id;
                if (!socket.data.chatRecipients) socket.data.chatRecipients = {};
                socket.data.chatRecipients[conversationId] = recipientId;
            }

            const message = await prisma.chatMessage.create({
                data: {
                    conversationId,
                    senderId: userId,
                    text: text.trim(),
                },
            });

            const payload = {
                id: message.id,
                conversationId,
                senderId: userId,
                text: message.text,
                createdAt: message.createdAt.toISOString(),
                readAt: null,
                localId // Send back localId for optimistic UI confirmation
            };

            // Broadcast to the chat room
            socket.to(room).emit("chat_new_message", payload);

            if (callback) {
                callback({ success: true, message: payload });
            }

            // Update inbox views for both users via personal socket rooms
            await emitConversationUpdate(io, conversationId, userId);
            const recipientId = convo.user1Id === userId ? convo.user2Id : convo.user1Id;
            await emitConversationUpdate(io, conversationId, recipientId);
        } catch (error) {
            console.error("Error in chat_message:", error);
            if (callback) callback({ error: "Internal server error" });
        }
    });

    socket.on("chat_typing", (data: { conversationId: string, isTyping: boolean }) => {
        try {
            const userId = socket.data.user.id;
            const { conversationId, isTyping } = data;
            const room = `chat:${conversationId}`;

            if (!socket.rooms.has(room)) {
                return;
            }

            socket.to(room).emit("chat_typing", { senderId: userId, isTyping });
        } catch (error) {
            console.error("Error in chat_typing:", error);
        }
    });

    socket.on("chat_read", async (data: { conversationId: string }) => {
        try {
            const userId = socket.data.user.id;
            const { conversationId } = data;
            const room = `chat:${conversationId}`;

            if (!socket.rooms.has(room)) {
                const convo = await verifyConversationMember(conversationId, userId);
                if (!convo) {
                    return;
                }
                socket.join(room);
            }

            const now = new Date();

            await prisma.chatMessage.updateMany({
                where: {
                    conversationId,
                    senderId: { not: userId },
                    readAt: null,
                },
                data: { readAt: now },
            });

            socket.to(room).emit("chat_messages_read", {
                conversationId,
                readBy: userId,
                readAt: now.toISOString(),
            });
        } catch (error) {
            console.error("Error in chat_read:", error);
        }
    });

    socket.on("chat_delete_messages", async (data: { conversationId: string, messageIds: string[], forEveryone: boolean }, callback?: (res: any) => void) => {
        try {
            const userId = socket.data.user.id;
            const { conversationId, messageIds, forEveryone } = data;
            if (!messageIds || messageIds.length === 0) return;

            const room = `chat:${conversationId}`;
            if (!socket.rooms.has(room)) {
                const convo = await verifyConversationMember(conversationId, userId);
                if (!convo) {
                    if (callback) callback({ error: "Forbidden" });
                    return;
                }
                socket.join(room);
            }

            if (forEveryone) {
                const count = await prisma.chatMessage.count({
                    where: { id: { in: messageIds }, senderId: userId, conversationId }
                });
                
                if (count !== messageIds.length) {
                    if (callback) callback({ error: "Unauthorized" });
                    return;
                }

                await prisma.chatMessage.updateMany({
                    where: { id: { in: messageIds } },
                    data: { deletedAt: new Date() }
                });

                socket.to(room).emit("chat_messages_deleted", { conversationId, messageIds, forEveryone: true, deletedBy: userId });
                if (callback) callback({ success: true, messageIds, forEveryone: true });
            } else {
                await prisma.chatMessage.updateMany({
                    where: { id: { in: messageIds } },
                    data: { deletedFor: { push: userId } }
                });

                if (callback) callback({ success: true, messageIds, forEveryone: false });
            }

            // Sync conversation inbox view
            const convo = await verifyConversationMember(conversationId, userId);
            if (convo) {
                await emitConversationUpdate(io, conversationId, userId);
                if (forEveryone) {
                    const recipientId = convo.user1Id === userId ? convo.user2Id : convo.user1Id;
                    await emitConversationUpdate(io, conversationId, recipientId);
                }
            }
        } catch (error) {
            console.error("Error in chat_delete_messages:", error);
            if (callback) callback({ error: "Internal server error" });
        }
    });

    socket.on("chat_react_message", async (data: { conversationId: string, messageId: string, emoji: string }, callback?: (res: any) => void) => {
        try {
            const userId = socket.data.user.id;
            const { conversationId, messageId, emoji } = data;
            
            const room = `chat:${conversationId}`;
            if (!socket.rooms.has(room)) {
                const convo = await verifyConversationMember(conversationId, userId);
                if (!convo) {
                    if (callback) callback({ error: "Forbidden" });
                    return;
                }
                socket.join(room);
            }

            if (emoji) {
                await prisma.chatMessageReaction.upsert({
                    where: {
                        messageId_userId: { messageId, userId }
                    },
                    update: { emoji },
                    create: { messageId, userId, emoji }
                });
            } else {
                await prisma.chatMessageReaction.deleteMany({
                    where: { messageId, userId }
                });
            }

            const payload = { conversationId, messageId, userId, emoji };
            socket.to(room).emit("chat_message_reacted", payload);
            if (callback) callback({ success: true, reaction: payload });

        } catch (error) {
            console.error("Error in chat_react_message:", error);
            if (callback) callback({ error: "Internal server error" });
        }
    });

    // --- WebRTC Calling Handlers ---

    socket.on("call_initiate", async (data: { conversationId: string, isVideo: boolean }, callback?: (res: any) => void) => {
        try {
            const userId = socket.data.user.id;
            const { conversationId, isVideo } = data;

            const convo = await verifyConversationMember(conversationId, userId);
            if (!convo) {
                if (callback) callback({ error: "Forbidden" });
                return;
            }

            const caller = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, username: true, displayName: true, avatarUrl: true }
            });

            const recipientId = convo.user1Id === userId ? convo.user2Id : convo.user1Id;
            
            io.to(`user:${recipientId}`).emit("call_incoming", {
                conversationId,
                caller,
                isVideo
            });

            if (callback) callback({ success: true });
        } catch (error) {
            console.error("Error in call_initiate:", error);
            if (callback) callback({ error: "Internal Error" });
        }
    });

    socket.on("call_accept", async (data: { conversationId: string }) => {
        const userId = socket.data.user.id;
        const { conversationId } = data;
        const convo = await verifyConversationMember(conversationId, userId);
        if (convo) {
            const recipientId = convo.user1Id === userId ? convo.user2Id : convo.user1Id;
            io.to(`user:${recipientId}`).emit("call_accepted", { conversationId, peerId: userId });
        }
    });

    socket.on("call_reject", async (data: { conversationId: string }) => {
        const userId = socket.data.user.id;
        const { conversationId } = data;
        const convo = await verifyConversationMember(conversationId, userId);
        if (convo) {
            const recipientId = convo.user1Id === userId ? convo.user2Id : convo.user1Id;
            io.to(`user:${recipientId}`).emit("call_rejected", { conversationId });
        }
    });

    socket.on("call_signal", async (data: { conversationId: string, signal: any }) => {
        const userId = socket.data.user.id;
        const { conversationId, signal } = data;
        const convo = await verifyConversationMember(conversationId, userId);
        if (convo) {
            const recipientId = convo.user1Id === userId ? convo.user2Id : convo.user1Id;
            io.to(`user:${recipientId}`).emit("call_signal", { conversationId, signal, senderId: userId });
        }
    });

    socket.on("call_end", async (data: { conversationId: string }) => {
        const userId = socket.data.user.id;
        const { conversationId } = data;
        const convo = await verifyConversationMember(conversationId, userId);
        if (convo) {
            const recipientId = convo.user1Id === userId ? convo.user2Id : convo.user1Id;
            io.to(`user:${recipientId}`).emit("call_ended", { conversationId });
        }
    });
};

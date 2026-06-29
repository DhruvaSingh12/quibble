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

            // Update recipient's inbox via their personal socket room
            const recipientId = socket.data.chatRecipients?.[conversationId];
            if (recipientId) {
                io.to(`user:${recipientId}`).emit("chat:conversation_update", {
                    conversationId,
                    lastMessage: {
                        id: message.id,
                        senderId: userId,
                        text: message.text,
                        createdAt: message.createdAt.toISOString(),
                        isRead: false,
                    },
                });
            }
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

            if (!socket.rooms.has(room)) return;

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

            if (!socket.rooms.has(room)) return;

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
            if (!socket.rooms.has(room)) return;

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
        } catch (error) {
            console.error("Error in chat_delete_messages:", error);
            if (callback) callback({ error: "Internal server error" });
        }
    });
};

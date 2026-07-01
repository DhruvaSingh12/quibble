import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { deriveConversationKey } from "../../shared/chatCrypto";

async function getConversation(conversationId: string, userId: string) {
    const convo = await prisma.chatConversation.findUnique({
        where: { id: conversationId },
        select: { id: true, user1Id: true, user2Id: true },
    });
    if (!convo) return null;
    if (convo.user1Id !== userId && convo.user2Id !== userId) return null;
    return convo;
}

export const getConversations = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;

        const conversations = await prisma.chatConversation.findMany({
            where: {
                OR: [{ user1Id: userId }, { user2Id: userId }],
            },
            include: {
                user1: { select: { id: true, username: true, displayName: true, avatarUrl: true, followers: { select: { followerId: true } }, following: { select: { followingId: true } } } },
                user2: { select: { id: true, username: true, displayName: true, avatarUrl: true, followers: { select: { followerId: true } }, following: { select: { followingId: true } } } },
                messages: {
                    where: {
                        NOT: {
                            deletedFor: { has: userId }
                        }
                    },
                    orderBy: { createdAt: "desc" },
                    take: 1,
                    select: { id: true, senderId: true, text: true, createdAt: true, readAt: true, deletedAt: true },
                },
            },
        });

        const conversationIds = conversations.map(c => c.id);
        const unreadCounts = conversationIds.length > 0
            ? await prisma.chatMessage.groupBy({
                by: ["conversationId"],
                where: {
                    conversationId: { in: conversationIds },
                    senderId: { not: userId },
                    readAt: null,
                },
                _count: { id: true },
            })
            : [];

        const unreadMap = new Map(unreadCounts.map(r => [r.conversationId, r._count.id]));

        const results = conversations.map(c => {
            const friend = c.user1Id === userId ? c.user2 : c.user1;
            const lastMessage = c.messages[0];
            const keyHex = deriveConversationKey(c.user1Id, c.user2Id).toString("hex");

            const isMutualFollow = 
                friend.followers.some(f => f.followerId === userId) && 
                friend.following.some(f => f.followingId === userId);

            return {
                conversationId: c.id,
                keyHex,
                isMutualFollow,
                friend: {
                    id: friend.id,
                    username: friend.username,
                    displayName: friend.displayName,
                    avatarUrl: friend.avatarUrl,
                },
                lastMessage: lastMessage
                    ? {
                        id: lastMessage.id,
                        senderId: lastMessage.senderId,
                        text: lastMessage.text,
                        createdAt: lastMessage.createdAt.toISOString(),
                        isRead: lastMessage.readAt !== null || lastMessage.senderId === userId,
                        deletedAt: lastMessage.deletedAt ? lastMessage.deletedAt.toISOString() : null,
                    }
                    : null,
                unreadCount: unreadMap.get(c.id) ?? 0,
            };
        }).sort((a, b) => {
            const at = a.lastMessage?.createdAt ?? "";
            const bt = b.lastMessage?.createdAt ?? "";
            return bt.localeCompare(at);
        });

        res.json({ conversations: results });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch conversations" });
    }
};

export const getMessages = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const conversationId = String(req.params.conversationId);
        const cursor = req.query.cursor as string | undefined;
        const limit = Math.min(parseInt(req.query.limit as string) || 40, 100);

        const convo = await getConversation(conversationId, userId);
        if (!convo) {
            return res.status(403).json({ error: "Access denied" });
        }

        let cursorDate: Date | undefined;
        if (cursor) {
            const cursorMsg = await prisma.chatMessage.findUnique({
                where: { id: cursor },
                select: { createdAt: true },
            });
            if (cursorMsg) cursorDate = cursorMsg.createdAt;
        }

        const messages = await prisma.chatMessage.findMany({
            where: {
                conversationId,
                NOT: { deletedFor: { has: userId } },
                ...(cursorDate ? { createdAt: { lt: cursorDate } } : {}),
            },
            orderBy: { createdAt: "desc" },
            take: limit,
            select: {
                id: true,
                senderId: true,
                text: true,
                createdAt: true,
                readAt: true,
                deletedAt: true,
                reactions: {
                    select: {
                        userId: true,
                        emoji: true,
                    },
                },
            },
        });

        res.json({
            messages,
            hasMore: messages.length === limit,
            nextCursor: messages.length === limit ? messages[messages.length - 1].id : null,
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch messages" });
    }
};

export const getOrCreateConversation = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { targetUserId } = req.body;

        if (!targetUserId) return res.status(400).json({ error: "targetUserId is required" });

        const sorted = [userId, targetUserId].sort();
        const user1Id = sorted[0];
        const user2Id = sorted[1];

        // Ensure both users exist and check follow status
        const target = await prisma.user.findUnique({ where: { id: targetUserId } });
        if (!target) return res.status(404).json({ error: "User not found" });

        const isMutualFollow = await prisma.user.count({
            where: {
                id: userId,
                following: { some: { followingId: targetUserId } },
                followers: { some: { followerId: targetUserId } }
            }
        });

        if (isMutualFollow === 0) {
            return res.status(403).json({ error: "You can only message mutually followed users" });
        }

        let convo = await prisma.chatConversation.findUnique({
            where: {
                user1Id_user2Id: { user1Id, user2Id }
            }
        });

        if (!convo) {
            convo = await prisma.chatConversation.create({
                data: { user1Id, user2Id }
            });
        }

        const keyHex = deriveConversationKey(user1Id, user2Id).toString("hex");

        res.json({
            conversationId: convo.id,
            keyHex,
            friend: {
                id: target.id,
                username: target.username,
                displayName: target.displayName,
                avatarUrl: target.avatarUrl
            }
        });

    } catch (error) {
        res.status(500).json({ error: "Failed to start conversation" });
    }
};

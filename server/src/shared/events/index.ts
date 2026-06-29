export type AppEvent =
  | "post:created"
  | "post:deleted"
  | "post:liked"
  | "post:disliked"
  | "post:bookmarked"
  | "comment:created"
  | "comment:liked"
  | "user:followed"
  | "user:unfollowed"
  | "message:sent"
  | "message:read"
  | "call:initiated"
  | "call:ended"
  | "live:started"
  | "live:ended";

export interface EventMap {
  "post:created": { postId: string; authorId: string };
  "post:deleted": { postId: string; authorId: string };
  "post:liked": { postId: string; userId: string; authorId: string };
  "post:disliked": { postId: string; userId: string; authorId: string };
  "post:bookmarked": { postId: string; userId: string; authorId: string };
  "comment:created": { commentId: string; postId: string; authorId: string; commenterId: string };
  "comment:liked": { commentId: string; userId: string; commenterId: string };
  "user:followed": { followerId: string; followingId: string };
  "user:unfollowed": { followerId: string; followingId: string };
  "message:sent": { messageId: string; conversationId: string; senderId: string };
  "message:read": { messageId: string; conversationId: string; readerId: string };
  "call:initiated": { callId: string; callerId: string; receiverId: string };
  "call:ended": { callId: string };
  "live:started": { roomId: string; hostId: string };
  "live:ended": { roomId: string };
}


import { prisma } from "../config/prisma";
import { EventEmitter } from "events";
import { AppEvent, EventMap } from "../shared";
import { logger } from "../logging/logger";
import { io } from "../socket";


class AppEventBus extends EventEmitter {
  emitEvent<K extends AppEvent>(event: K, payload: EventMap[K]): boolean {
    logger.debug({ event, payload }, "Event emitted");
    return this.emit(event, payload);
  }

  onEvent<K extends AppEvent>(event: K, listener: (payload: EventMap[K]) => void): this {
    return this.on(event, listener);
  }
}

export const eventBus = new AppEventBus();

// Initialize handlers
export function initEventHandlers() {
  eventBus.onEvent("post:created", async (payload) => {
    logger.info({ payload }, "Handling post:created");
    
    // Notify followers
    const followers = await prisma.follow.findMany({
      where: { followingId: payload.authorId },
      select: { followerId: true }
    });
    
    followers.forEach(({ followerId }) => {
      io?.to(`user:${followerId}`).emit("post:created", payload);
    });
  });

  eventBus.onEvent("comment:created", (payload) => {
    logger.info({ payload }, "Handling comment:created");
    if (payload.authorId !== payload.commenterId) {
      io?.to(`user:${payload.authorId}`).emit("notification:new_comment", payload);
    }
  });

  eventBus.onEvent("user:followed", (payload) => {
    logger.info({ payload }, "Handling user:followed");
    io?.to(`user:${payload.followingId}`).emit("notification:new_follower", payload);
  });

  logger.info("Event handlers initialized");
}

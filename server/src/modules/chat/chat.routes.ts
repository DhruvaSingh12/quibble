import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { getConversations, getMessages, getOrCreateConversation } from "./chat.controller";

const router = Router();

router.use(authenticate);

router.get("/conversations", getConversations);
router.post("/conversations", getOrCreateConversation);
router.get("/:conversationId/messages", getMessages);

export default router;

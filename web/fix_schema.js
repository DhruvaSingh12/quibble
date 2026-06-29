const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');
content = content.replace(/\0/g, ''); // remove null bytes
const bmEnd = content.indexOf('model Bookmark');
const endOfBm = content.indexOf('}', bmEnd) + 1;
content = content.substring(0, endOfBm) + '\n\nmodel ChatConversation {\n  id        String   @id @default(cuid())\n  user1Id   String\n  user2Id   String\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  user1     User     @relation("ConversationUser1", fields: [user1Id], references: [id], onDelete: Cascade)\n  user2     User     @relation("ConversationUser2", fields: [user2Id], references: [id], onDelete: Cascade)\n  messages  ChatMessage[]\n\n  @@unique([user1Id, user2Id])\n  @@map("chat_conversations")\n}\n\nmodel ChatMessage {\n  id             String           @id @default(cuid())\n  conversationId String\n  conversation   ChatConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)\n  senderId       String\n  sender         User             @relation("MessageSender", fields: [senderId], references: [id], onDelete: Cascade)\n  text           String\n  readAt         DateTime?\n  deletedAt      DateTime?\n  deletedFor     String[]         @default([])\n  createdAt      DateTime         @default(now())\n\n  @@index([conversationId, createdAt])\n  @@index([senderId])\n  @@map("chat_messages")\n}\n';

// Remove url = env(DATABASE_URL)
content = content.replace(/url\s*=\s*env\(\"DATABASE_URL\"\)/, '');

fs.writeFileSync('prisma/schema.prisma', content);

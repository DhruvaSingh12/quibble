import { createHmac, createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// Derives a deterministic 32-byte AES-256 key for a conversation channel.
export function deriveConversationKey(user1Id: string, user2Id: string): Buffer {
    const secret = process.env.SESSION_SECRET || "default_dev_secret_please_change";

    const sorted = [user1Id, user2Id].sort().join(':');
    return createHmac('sha256', secret).update(sorted).digest();
}

// Encrypts a plaintext string with AES-256-GCM.
export function encryptMessage(plaintext: string, key: Buffer): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);

    const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return [
        iv.toString('base64'),
        encrypted.toString('base64'),
        authTag.toString('base64'),
    ].join(':');
}

// Decrypts a "iv:ciphertext:authTag" base64 string produced by encryptMessage.
export function decryptMessage(encrypted: string, key: Buffer): string {
    const parts = encrypted.split(':');
    if (parts.length !== 3) throw new Error('Invalid encrypted message format');

    const [ivB64, ctB64, tagB64] = parts;
    const iv = Buffer.from(ivB64!, 'base64');
    const ciphertext = Buffer.from(ctB64!, 'base64');
    const authTag = Buffer.from(tagB64!, 'base64');

    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
    ]).toString('utf8');
}

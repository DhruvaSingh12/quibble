// Uses Web Crypto API for browser compatibility without polyfills

function hexToArrayBuffer(hex: string): ArrayBuffer {
    const bytes = new Uint8Array(Math.ceil(hex.length / 2));
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
    }
    return bytes.buffer;
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

const keyCache = new Map<string, CryptoKey>();

async function getCryptoKey(keyHex: string): Promise<CryptoKey> {
    if (keyCache.has(keyHex)) return keyCache.get(keyHex)!;
    const keyData = hexToArrayBuffer(keyHex);
    const key = await window.crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "AES-GCM" },
        false,
        ["encrypt", "decrypt"]
    );
    keyCache.set(keyHex, key);
    return key;
}

export async function encryptMessage(plaintext: string, keyHex: string): Promise<string> {
    const key = await getCryptoKey(keyHex);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    
    const encryptedBuffer = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        encoder.encode(plaintext)
    );
    
    const encryptedBytes = new Uint8Array(encryptedBuffer);
    const ciphertext = encryptedBytes.slice(0, -16);
    const authTag = encryptedBytes.slice(-16);
    
    return [
        arrayBufferToBase64(iv.buffer),
        arrayBufferToBase64(ciphertext.buffer),
        arrayBufferToBase64(authTag.buffer)
    ].join(':');
}

export async function decryptMessage(encrypted: string, keyHex: string): Promise<string> {
    const parts = encrypted.split(':');
    if (parts.length !== 3) throw new Error('Invalid encrypted message format');
    
    const [ivB64, ctB64, tagB64] = parts;
    const key = await getCryptoKey(keyHex);
    
    const iv = base64ToArrayBuffer(ivB64);
    const ciphertext = base64ToArrayBuffer(ctB64);
    const authTag = base64ToArrayBuffer(tagB64);
    
    const combined = new Uint8Array(ciphertext.byteLength + authTag.byteLength);
    combined.set(new Uint8Array(ciphertext), 0);
    combined.set(new Uint8Array(authTag), ciphertext.byteLength);
    
    const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: new Uint8Array(iv) },
        key,
        combined.buffer
    );
    
    return new TextDecoder().decode(decryptedBuffer);
}

/**
 * Derives an AES key from a password using PBKDF2 with a random salt.
 * @param key - The password or key string
 * @param salt - Random salt for key derivation
 * @returns CryptoKey for AES encryption/decryption
 */
async function deriveKey(key: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(key),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

/**
 * Decrypts an AES-encrypted secret using the provided key.
 * @param encrypted - Base64-encoded encrypted string (salt + IV + ciphertext)
 * @param key - Decryption key
 * @returns Decrypted string
 * @throws Error if decryption fails or results in empty content
 */
export async function decryptSecret(encrypted: string, key: string): Promise<string> {
    try {
        const encryptedBuffer = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
        const saltLength = 16; // 16 bytes for salt
        const ivLength = 12; // 12 bytes for AES-GCM IV
        const salt = encryptedBuffer.slice(0, saltLength);
        const iv = encryptedBuffer.slice(saltLength, saltLength + ivLength);
        const data = encryptedBuffer.slice(saltLength + ivLength);

        const cryptoKey = await deriveKey(key, salt);
        const decrypted = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            cryptoKey,
            data
        );

        const decryptedText = new TextDecoder().decode(decrypted);
        if (!decryptedText) {
            throw new Error("Decryption resulted in empty content");
        }
        return decryptedText;
    } catch (error) {
        console.error(error);
        throw new Error("Decryption failed: invalid key or corrupted data");
    }
}

/**
 * Encrypts a secret using AES with the provided key.
 * @param decrypted - Plaintext secret
 * @param key - Encryption key
 * @returns Base64-encoded encrypted string (salt + IV + ciphertext)
 * @throws Error if encryption fails or results in empty content
 */
export async function encryptSecret(decrypted: string, key: string): Promise<string> {
    try {
        if (!decrypted) {
            throw new Error("Input cannot be empty");
        }

        const encoder = new TextEncoder();
        const data = encoder.encode(decrypted);
        const salt = crypto.getRandomValues(new Uint8Array(16)); // 16-byte random salt
        const iv = crypto.getRandomValues(new Uint8Array(12)); // 12-byte IV for AES-GCM
        const cryptoKey = await deriveKey(key, salt);

        const encrypted = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv },
            cryptoKey,
            data
        );

        const encryptedArray = new Uint8Array(encrypted);
        const combined = new Uint8Array(salt.length + iv.length + encryptedArray.length);
        combined.set(salt);
        combined.set(iv, salt.length);
        combined.set(encryptedArray, salt.length + iv.length);

        const encryptedBase64 = btoa(String.fromCharCode(...combined));
        if (!encryptedBase64) {
            throw new Error("Encryption resulted in empty content");
        }
        return encryptedBase64;
    } catch (error) {
        console.error(error);
        throw new Error("Encryption failed: invalid input or processing error");
    }
}
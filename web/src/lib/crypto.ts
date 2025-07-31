import CryptoJS from 'crypto-js';

/**
 * Decrypts an AES-encrypted secret using the provided key.
 * @param encrypted - Base64-encoded encrypted string
 * @param key - Decryption key
 * @returns Decrypted string
 * @throws Error if decryption fails or results in empty content
 */
export function decryptSecret(encrypted: string, key: string): string {
    try {
        const decryptedBytes = CryptoJS.AES.decrypt(encrypted, key);
        const decrypted = decryptedBytes.toString(CryptoJS.enc.Utf8);
        if (!decrypted) {
            throw new Error('Decryption resulted in empty content');
        }
        return decrypted;
    } catch (error) {
        console.error(error);
        throw new Error('Decryption failed: invalid key or corrupted data');
    }
}
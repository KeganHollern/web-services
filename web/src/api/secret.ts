import axios from 'axios';

/**
 * Fetches the encrypted secret from the API.
 * @param id The secret ID.
 * @returns The encrypted data as a string.
 * @throws Error on fetch failure.
 */
export async function fetchSecret(id: string): Promise<string> {
    try {
        const response = await axios.get<string>(`/api/secret/${id}`);
        return response.data;
    } catch (error: any) {
        throw new Error(`API fetch failed: ${error.response?.data?.error || error.message || "unknown"}`);
    }
}
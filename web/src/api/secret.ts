import axios, { AxiosError } from 'axios';

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
    } catch (error: unknown) {
        if (error instanceof AxiosError) {
            throw new Error(`API fetch failed: ${error.response?.data?.error || error.message || "unknown"}`);
        } else if (error instanceof Error) {
            throw new Error(`API fetch failed: ${error.message}`);
        } else {
            throw new Error("API fetch failed: unknown error");
        }
    }
}

/**
 * Pushes the encrypted secret to the API.
 * @param content The encrypted content
 * @returns The unique ID of the secret.
 * @throws Error on fetch failure
 */
export async function pushSecret(content: string): Promise<string> {
    try {
        const response = await axios.post<string>("/api/secret/create", { content });
        return response.data;
    } catch (error: unknown) {
        if (error instanceof AxiosError) {
            throw new Error(`API fetch failed: ${error.response?.data?.error || error.message || "unknown"}`);
        } else if (error instanceof Error) {
            throw new Error(`API fetch failed: ${error.message}`);
        } else {
            throw new Error("API fetch failed: unknown error");
        }
    }
}
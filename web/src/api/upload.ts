
import axios, { AxiosError } from 'axios';

export async function uploadFile(password: string, file: File): Promise<{ message: string; path: string }> {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await axios.put('/api/upload/', formData, {
            headers: {
                'X-Secret-Password': password,
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data as { message: string; path: string };
    } catch (error: unknown) {
        if (error instanceof AxiosError) {
            throw new Error(`Upload failed: ${error.response?.data?.error || error.message || "unknown"}`);
        } else if (error instanceof Error) {
            throw new Error(`Upload failed: ${error.message}`);
        } else {
            throw new Error("Upload failed: unknown error");
        }
    }
}
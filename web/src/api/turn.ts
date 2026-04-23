import axios, { AxiosError } from "axios";

export interface TurnConfig {
    iceServers: RTCIceServer[];
    ttlSeconds: number;
}

interface RawTurnServer {
    urls: string | string[];
    username?: string;
    credential?: string;
}

interface RawTurnResponse {
    iceServers: RawTurnServer[];
    ttlSeconds: number;
}

export async function fetchTurnConfig(): Promise<TurnConfig> {
    try {
        const res = await axios.get<RawTurnResponse>("/api/share/turn");
        const iceServers: RTCIceServer[] = (res.data.iceServers ?? []).map((s) => ({
            urls: s.urls,
            ...(s.username ? { username: s.username } : {}),
            ...(s.credential ? { credential: s.credential } : {}),
        }));
        return { iceServers, ttlSeconds: res.data.ttlSeconds ?? 0 };
    } catch (error: unknown) {
        if (error instanceof AxiosError) {
            if (error.response?.status === 503) {
                throw new Error("Relay is not configured on this server.");
            }
            throw new Error(`Relay lookup failed: ${error.response?.statusText || error.message}`);
        }
        throw new Error("Relay lookup failed: unknown error");
    }
}

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

function formatRelativeTime(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 5) return "Just now";
    if (seconds < 60) return seconds + "s ago";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + "m ago";
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

interface ConnectionStatusProps {
    status: "connecting" | "connected" | "disconnected";
    lastUpdate: Date | null;
}

export function ConnectionStatus({ status, lastUpdate }: ConnectionStatusProps) {
    const [, setTick] = useState(0);

    useEffect(() => {
        const id = setInterval(() => setTick((t) => t + 1), 10000);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
                <span
                    className={cn(
                        "h-2 w-2 rounded-full",
                        status === "connected" && "bg-green-500",
                        status === "connecting" && "bg-amber-500 animate-pulse",
                        status === "disconnected" && "bg-red-500",
                    )}
                />
                <span className="hidden sm:inline">
                    {status === "connected"
                        ? "Connected"
                        : status === "connecting"
                          ? "Connecting..."
                          : "Disconnected"}
                </span>
            </span>
            {lastUpdate && (
                <>
                    <span className="hidden sm:inline text-muted-foreground/50">·</span>
                    <span className="hidden sm:inline">{formatRelativeTime(lastUpdate)}</span>
                </>
            )}
        </div>
    );
}

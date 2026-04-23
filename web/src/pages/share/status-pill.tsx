import { Lock } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type ShareStatus = "waiting" | "verifying" | "live" | "disconnected";
export type Transport = "direct" | "relay" | "unknown";

const variants: Record<ShareStatus, { label: string; cls: string; dot?: string }> = {
    waiting: {
        label: "Waiting for viewer",
        cls: "bg-muted text-muted-foreground",
    },
    verifying: {
        label: "Verifying",
        cls: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
        dot: "bg-yellow-500",
    },
    live: {
        label: "Live",
        cls: "bg-green-500/15 text-green-700 dark:text-green-400",
        dot: "bg-green-500 animate-pulse",
    },
    disconnected: {
        label: "Disconnected",
        cls: "bg-red-500/15 text-red-700 dark:text-red-400",
        dot: "bg-red-500",
    },
};

const transportVariants: Record<Exclude<Transport, "unknown">, {
    cls: string;
    title: string;
    body: string;
}> = {
    direct: {
        cls: "bg-green-500/15 text-green-700 dark:text-green-400",
        title: "Direct peer-to-peer",
        body: "Traffic flows directly between the two browsers. No relay is involved.",
    },
    relay: {
        cls: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
        title: "Relay in use",
        body: "A TURN relay is forwarding traffic. The relay sees only encrypted bytes — it cannot read the stream.",
    },
};

export function StatusPill({ status, transport = "unknown" }: { status: ShareStatus; transport?: Transport }) {
    const v = variants[status];
    return (
        <div className="inline-flex items-center gap-2">
            {transport !== "unknown" && <TransportBadge transport={transport} />}
            <div className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium", v.cls)}>
                {v.dot && <span className={cn("h-2 w-2 rounded-full", v.dot)} />}
                {v.label}
            </div>
        </div>
    );
}

function TransportBadge({ transport }: { transport: Exclude<Transport, "unknown"> }) {
    const t = transportVariants[transport];
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span
                    className={cn(
                        "inline-flex items-center rounded-full p-1.5",
                        t.cls,
                    )}
                    aria-label={t.title}
                >
                    <Lock className="size-3.5" />
                </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-56">
                <div className="font-semibold">{t.title}</div>
                <div className="mt-1 text-xs opacity-90">{t.body}</div>
            </TooltipContent>
        </Tooltip>
    );
}

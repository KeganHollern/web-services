import { cn } from "@/lib/utils";

export type ShareStatus = "waiting" | "verifying" | "live" | "disconnected";

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

export function StatusPill({ status }: { status: ShareStatus }) {
    const v = variants[status];
    return (
        <div className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium", v.cls)}>
            {v.dot && <span className={cn("h-2 w-2 rounded-full", v.dot)} />}
            {v.label}
        </div>
    );
}

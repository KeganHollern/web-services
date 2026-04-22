import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

import { SasBody, SasTitle } from "./constants";

interface SasConfirmProps {
    code: string | null;
    localConfirmed: boolean;
    remoteConfirmed: boolean;
    onConfirm: () => void;
    onReject: () => void;
}

export function SasConfirm({
    code,
    localConfirmed,
    remoteConfirmed,
    onConfirm,
    onReject,
}: SasConfirmProps) {
    return (
        <div className="space-y-4">
            <div>
                <h3 className="font-semibold">{SasTitle}</h3>
                <p className="text-muted-foreground mt-1 text-sm">{SasBody}</p>
            </div>
            <div className="bg-muted rounded-md p-6 text-center">
                <div className="font-mono text-3xl tracking-widest tabular-nums">
                    {code ?? "———-———"}
                </div>
            </div>
            <div className="text-muted-foreground flex items-center justify-between text-xs">
                <span>
                    You: {localConfirmed ? "confirmed" : "waiting"}
                </span>
                <span>
                    Peer: {remoteConfirmed ? "confirmed" : "waiting"}
                </span>
            </div>
            <div className="flex gap-2">
                <Button
                    className="flex-1"
                    variant="destructive"
                    onClick={onReject}
                    disabled={localConfirmed}
                >
                    <X /> Mismatch
                </Button>
                <Button
                    className="flex-1"
                    onClick={onConfirm}
                    disabled={localConfirmed || !code}
                >
                    <Check /> Codes match
                </Button>
            </div>
        </div>
    );
}

import { Loader2, Lock, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface RelayPromptProps {
    open: boolean;
    busy: boolean;
    peerRequested: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function RelayPrompt({ open, busy, peerRequested, onConfirm, onCancel }: RelayPromptProps) {
    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v && !busy) onCancel(); }}>
            <DialogContent showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldAlert className="size-4" /> Direct connection failed
                    </DialogTitle>
                    <DialogDescription>
                        {peerRequested
                            ? "The other side enabled a relay server. Enable it on your side to continue the session."
                            : "Your network blocked a direct peer-to-peer connection. You can retry through a relay server."}
                    </DialogDescription>
                </DialogHeader>
                <div className="text-muted-foreground flex items-start gap-2 rounded-md border p-3 text-xs">
                    <Lock className="mt-0.5 size-4 shrink-0" />
                    <span>
                        A relay server will see encrypted traffic but <strong>cannot read the contents</strong>
                        {" "}of your screen share. End-to-end encryption between the two browsers is preserved.
                    </span>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onCancel} disabled={busy}>
                        Cancel
                    </Button>
                    <Button onClick={onConfirm} disabled={busy}>
                        {busy ? <Loader2 className="animate-spin" /> : <Lock />}
                        Enable Relay
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

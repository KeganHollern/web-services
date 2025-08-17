
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { LinkShareState } from "./constants";
import { LinkShareContext } from "./useShareLink";

function InternalLinkShareDialog({
    title,
    description,
    url,
    open,
    onOpenChanged,
}: {
    title: string;
    description: string;
    url: string;
    open: boolean;
    onOpenChanged: (open: boolean) => void;
}) {
    const copyToClipboard = () => {
        navigator.clipboard.writeText(url);
        toast.success("URL Copied to Clipboard.");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChanged}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription className="text-xs">{description}</DialogDescription>
                </DialogHeader>
                <div className="flex items-center space-x-2">
                    {/* TODO: on text overflow add `...` to end of dialog view */}
                    <Input readOnly value={url} className="font-mono" />
                    <Button variant="outline" onClick={copyToClipboard}>
                        Copy
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function LinkShareProvider({ children }: { children: ReactNode }) {
    const [dialogState, setDialogState] = useState<LinkShareState>({
        open: false,
        title: "",
        description: "",
        url: "",
    });

    const shareLink = (title: string, description: string, url: string) => {
        setDialogState({ open: true, title, description, url });
    };

    const closeDialog = () => {
        setDialogState((prev) => ({ ...prev, open: false }));
    };

    return (
        <LinkShareContext.Provider value={{ shareLink, closeDialog }}>
            {children}
            <InternalLinkShareDialog
                title={dialogState.title}
                description={dialogState.description}
                url={dialogState.url}
                open={dialogState.open}
                onOpenChanged={(open) => setDialogState((prev) => ({ ...prev, open }))}
            />
        </LinkShareContext.Provider>
    );
}


// File: src/components/LinkShareProvider.tsx
// This file defines a self-contained LinkShareProvider that manages the dialog state,
// renders a built-in LinkShareDialog component, and provides a useLinkShare hook for triggering it.
// You can import and wrap your app with <LinkShareProvider> to make useLinkShare() available everywhere.
// Usage: const { shareLink } = useLinkShare(); shareLink("Title", "Description", "https://example.com");

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"; // Assuming shadcn/ui is set up
import { Input } from "@/components/ui/input";
import { createContext, useContext, useState, type ReactNode } from "react";
import { toast } from "sonner";

interface LinkShareState {
    open: boolean;
    title: string;
    description: string;
    url: string;
}

interface LinkShareContextType {
    shareLink: (title: string, description: string, url: string) => void;
    closeDialog: () => void;
}

const LinkShareContext = createContext<LinkShareContextType | undefined>(undefined);

// Built-in LinkShareDialog component (self-contained, not reusing the existing one)
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

export function LinkShareProvider({ children }: { children: ReactNode }) {
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

export function useLinkShare() {
    const context = useContext(LinkShareContext);
    if (!context) {
        throw new Error("useLinkShare must be used within a LinkShareProvider");
    }
    return context;
}
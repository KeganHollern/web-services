import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type LinkShareDialogProps = {
    url: string
    title: string
    description: string
    open: boolean
    onOpenChanged(open: boolean): void
}

export function LinkShareDialog({ url, title, description, open, onOpenChanged }: LinkShareDialogProps) {
    const copyToClipboard = () => {
        toast("URL Copied to Clipboard.")
        navigator.clipboard.writeText(url);
    }

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
    )
}
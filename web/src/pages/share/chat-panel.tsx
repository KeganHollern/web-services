import { MessageSquare, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import type { DataChannelHandle } from "@/lib/share/rtc";
import { cn } from "@/lib/utils";

export const CHAT_CHANNEL_LABEL = "chat";

interface ChatMessage {
    id: number;
    sender: "self" | "peer";
    text: string;
    sentAt: number;
}

interface ChatPanelProps {
    channel: DataChannelHandle | null;
}

function formatRelative(ts: number, now: number): string {
    const diff = Math.max(0, Math.floor((now - ts) / 1000));
    if (diff < 5) return "just now";
    if (diff < 60) return `${diff}s ago`;
    const minutes = Math.floor(diff / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
}

export function ChatPanel({ channel }: ChatPanelProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [open, setOpen] = useState(false);
    const [unread, setUnread] = useState(0);
    const [now, setNow] = useState(() => Date.now());
    const idRef = useRef(0);
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const openRef = useRef(open);

    useEffect(() => {
        openRef.current = open;
        if (open) setUnread(0);
    }, [open]);

    useEffect(() => {
        if (!channel) {
            setMessages([]);
            setUnread(0);
            setInput("");
            setOpen(false);
            return;
        }
        channel.onMessage((data) => {
            if (typeof data !== "string") return;
            const text = data.slice(0, 4000);
            if (!text) return;
            idRef.current += 1;
            setMessages((prev) => [
                ...prev,
                { id: idRef.current, sender: "peer", text, sentAt: Date.now() },
            ]);
            if (!openRef.current) setUnread((u) => u + 1);
        });
    }, [channel]);

    useEffect(() => {
        const t = window.setInterval(() => setNow(Date.now()), 30_000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        if (open && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [open, messages]);

    if (!channel) return null;

    const send = () => {
        const text = input.trim();
        if (!text) return;
        try {
            channel.send(text);
        } catch {
            return;
        }
        idRef.current += 1;
        setMessages((prev) => [
            ...prev,
            { id: idRef.current, sender: "self", text, sentAt: Date.now() },
        ]);
        setInput("");
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="relative">
                    <MessageSquare /> Chat
                    {unread > 0 && (
                        <span className="bg-primary text-primary-foreground absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium">
                            {unread > 9 ? "9+" : unread}
                        </span>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col gap-0 p-0">
                <SheetHeader className="border-b">
                    <SheetTitle>Chat</SheetTitle>
                    <p className="text-muted-foreground text-xs">
                        Messages stay in this tab and are cleared when the session ends.
                    </p>
                </SheetHeader>
                <div
                    ref={scrollRef}
                    className="flex-1 space-y-3 overflow-y-auto px-4 py-3"
                >
                    {messages.length === 0 ? (
                        <p className="text-muted-foreground py-8 text-center text-sm">
                            No messages yet.
                        </p>
                    ) : (
                        messages.map((m) => (
                            <div
                                key={m.id}
                                className={cn(
                                    "flex flex-col gap-0.5",
                                    m.sender === "self" ? "items-end" : "items-start",
                                )}
                            >
                                <div className="text-muted-foreground flex items-center gap-1.5 text-[10px]">
                                    <span className="font-medium">
                                        {m.sender === "self" ? "You" : "Peer"}
                                    </span>
                                    <span>·</span>
                                    <span>{formatRelative(m.sentAt, now)}</span>
                                </div>
                                <div
                                    className={cn(
                                        "max-w-[85%] rounded-md px-3 py-1.5 text-sm break-words whitespace-pre-wrap",
                                        m.sender === "self"
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-foreground",
                                    )}
                                >
                                    {m.text}
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <form
                    className="flex gap-2 border-t p-3"
                    onSubmit={(e) => {
                        e.preventDefault();
                        send();
                    }}
                >
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type a message"
                        maxLength={4000}
                        autoFocus
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!input.trim()}
                        aria-label="Send message"
                    >
                        <Send />
                    </Button>
                </form>
            </SheetContent>
        </Sheet>
    );
}

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

interface SasConfirmProps {
    sasEmojis: string[];
    onConfirm: () => void;
    onReject: () => void;
}

export function SasConfirm({ sasEmojis, onConfirm, onReject }: SasConfirmProps) {
    return (
        <Card className="max-w-md">
            <CardHeader>
                <CardTitle>Verify your connection</CardTitle>
                <CardDescription>
                    Read these emojis to the other person over voice or video.
                    Only click Match if you both see the same sequence.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div
                    className="flex items-center justify-center gap-3 rounded-lg bg-muted py-6 text-5xl sm:text-6xl"
                    aria-label="Short authentication string"
                    role="group"
                >
                    {sasEmojis.map((emoji, i) => (
                        <span key={i} aria-hidden="true">
                            {emoji}
                        </span>
                    ))}
                </div>
            </CardContent>
            <CardFooter className="gap-3">
                <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={onReject}
                >
                    Does not match
                </Button>
                <Button className="flex-1" onClick={onConfirm}>
                    Match
                </Button>
            </CardFooter>
        </Card>
    );
}

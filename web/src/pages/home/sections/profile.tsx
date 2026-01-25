
import { Avatar } from "@/components/avatar-kegan";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function Profile() {
    // TODO: can we make these icons?
    const socialLinks = [
        { label: "X", href: "https://x.com/lystic" },
        { label: "Telegram", href: "https://t.me/lmaokegan" },
        { label: "GitHub", href: "https://github.com/KeganHollern" },
        { label: "LinkedIn", href: "https://www.linkedin.com/in/kegan-hollern" },
        { label: "Discord", href: "https://discord.com/users/kegan.eth" }, // Assuming standard Discord link format
        { label: "Email", href: "mailto:keganhollern@gmail.com" },
    ];

    return (
        <Card className="px-6 mx-6">
            <CardHeader className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24" />
                <CardTitle className="text-3xl">Kegan Hollern (kegan.eth)</CardTitle>
                <CardDescription className="text-center max-w-2xl text-accent-foreground">
                    <p>Hi... I like to make things and break things.</p>
                    <p className="my-1">I am a <b className="text-primary">Software</b>, <b className="text-primary">Robot</b>, and <b className="text-primary">Cheat</b> Engineer.</p>
                    <p>I started as a game-cheat developer.</p>
                    <p>Spent years working in game development and modding.</p>
                    <p>Then, I became a full-time distributed systems engineer.</p>
                </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center flex-wrap gap-2">
                {socialLinks.map((link, index) => (
                    <Badge key={index} variant="secondary" asChild>
                        <a href={link.href} target="_blank" rel="noopener noreferrer">{link.label}</a>
                    </Badge>
                ))}
            </CardContent>
        </Card>
    )
}
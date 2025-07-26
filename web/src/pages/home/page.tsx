import "@/styles/globals.css"

import { Button } from "@/components/ui/button";
import { Header } from "@/components/page-header"
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselPrevious,
    CarouselNext,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"

export function HomePage() {
    const breadcrumbs = [
        { label: "lystic.dev" }
    ];

    const profilePic = "https://pbs.twimg.com/profile_images/1560447882842480645/GufFfJSY.jpg"; // From your X profile

    // TODO: can we make these icons?
    const socialLinks = [
        { label: "X", href: "https://x.com/_lystic" },
        { label: "Telegram", href: "https://t.me/lmaokegan" },
        { label: "GitHub", href: "https://github.com/KeganHollern" },
        { label: "LinkedIn", href: "https://www.linkedin.com/in/kegan-hollern" },
        { label: "Discord", href: "https://discord.com/users/kegan.eth" }, // Assuming standard Discord link format
        { label: "Email", href: "mailto:keganhollern@gmail.com" },
    ];

    const languages = [
        { name: "Go", thought: "Daily usage" },
        { name: "C", thought: "Favorite language" },
        { name: "C++", thought: "Pain" },
        { name: "Intel x86/x86_64 ASM", thought: "Suffering" },
        { name: "Java", thought: "First language" },
        { name: "C#", thought: "Second language" },
        { name: "JavaScript", thought: "Everyone learns this" },
        { name: "Python", thought: "For AI" },
        { name: "SQL", thought: "Everyone needs DBs" },
        { name: "Solidity", thought: "Smart Contracts on EVM" },
        { name: "Bash", thought: "Scripting" },
        { name: "PowerShell", thought: "Windows Scripting" },
    ];

    const tools = {
        "IDEs": ["VS Code", "Visual Studio", "CLion", "IntelliJ", "GoLand"],
        "Build Tools": ["Docker", "Github Actions", "CMake", "Make", "Bazel"],
        "Deployments": ["Kubernetes", "Helm", "ArgoCD"],
        "Monitoring": ["Prometheus", "Grafana", "OpsGenie"],
        "Reversing": ["IDA Pro", "Binary Ninja", "ReClass", "dnSpy", "Cheat Engine", "x64dbg"],
        "Orchestration": ["Temporal"],
        "Libraries": ["gRPC", "Gin", "ExpressJS", "GraphQL"],
        "Databases": ["Clickhouse", "MySQL", "ElasticSearch", "Redis", "Kafka"],
    };

    const projects = [
        {
            title: "Aika",
            short: "An AI Anime Waifu",
            description: `Aika is a discord bot with numerous integrations.
Her key features are Text Chat, Voice Chat, and Vision.
She is a companion, an assistant, and a utility.`,
            link: "https://github.com/KeganHollern/Aika",
            picture: "https://aika.lystic.zip/selfies/932890148_aika,%20cute,%20tongue,%20blonde,%20green%20eyes,%20white%20shirt,%20nature,%20close%20up,%20facial%20shot,%20open%20mouth,%20winking,%20rawr_0.png",
        },
        {
            title: "Randal",
            short: "AI Chatbot with ReAct loops.",
            description: `Randal was my first LLM app. I used a new research
paper to implement actions and thought loops in
Randal before OpenAI functions were introduced.`,
            link: "https://github.com/keganhollern/randal",
            picture: "https://user-images.githubusercontent.com/15372623/227073663-2591d3e7-79a8-4b34-b322-1340eabbf0fe.png",
        },
        {
            title: "DayZ BR",
            short: "BattleRoyale mod for DayZ Standalone",
            description: `DayZBR was a continuation of my years developing the
Battle Royale genre in gaming. I brough the game mode
to the popular Zombie-Survival game DayZ.`,
            link: "https://dayzbr.dev",
            video: "https://youtu.be/KUxwJuG81GY"
        },
        {
            title: "Desolation Redux",
            short: "Zombie-Survival mod for Arma 3.",
            description: `DSR was a total-overhaul of the game Arma 3. It aimed
to bring a DayZ-like experience to the game and offer
a survival style game mode to players.`,
            link: "http://desolationredux.com/",
            video: "https://youtu.be/Ve4-SprE5sM"
        },
    ];

    return (
        <Header breadcrumbItems={breadcrumbs}>
            <div className="container mx-auto py-6 space-y-12">
                {/* Profile Section */}
                <Card className="px-6 mx-6">
                    <CardHeader className="flex flex-col items-center space-y-4">
                        <Avatar className="h-24 w-24">
                            <AvatarImage src={profilePic} alt="Kegan Hollern" />
                            <AvatarFallback>KH</AvatarFallback>
                        </Avatar>
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

                <Separator />

                {/* Projects Section */}
                <section className="px-6 mx-6">
                    <h2 className="text-2xl font-bold mb-4">Projects</h2>
                    <Carousel className="w-full max-w-4xl mx-auto" opts={{ loop: true }} plugins={[Autoplay({ delay: 5000 })]}>
                        <CarouselContent>
                            {projects.map((project, index) => (
                                <CarouselItem key={index}>
                                    <div className="p-4 flex flex-col items-center text-center">
                                        <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
                                        <h4 className="text-lg font-medium mb-2">{project.short}</h4>
                                        <p className="text-muted-foreground mb-4 max-w-prose">{project.description}</p>
                                        {project.picture ? (
                                            <div className="w-full aspect-video mb-4 overflow-hidden rounded-lg">
                                                <img
                                                    src={project.picture}
                                                    alt={project.title}
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                        ) : project.video ? (
                                            <div className="w-full aspect-video mb-4 overflow-hidden rounded-lg">
                                                <iframe
                                                    className="w-full h-full"
                                                    src={`https://www.youtube.com/embed/${project.video.split('/').pop()}`}
                                                    title={`${project.title} video`}
                                                    frameBorder="0"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                ></iframe>
                                            </div>
                                        ) : null}
                                        <Button variant="link" asChild>
                                            <a href={project.link} target="_blank" rel="noopener noreferrer">View Project</a>
                                        </Button>
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious />
                        <CarouselNext />
                    </Carousel>
                </section>

                <Separator />

                {/* Skills Section */}
                <section className="px-6 mx-6">
                    <h2 className="text-2xl font-bold mb-4">Programming Languages</h2>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Language</TableHead>
                                <TableHead>Thoughts</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {languages.map((lang, index) => (
                                <TableRow key={index}>
                                    <TableCell>{lang.name}</TableCell>
                                    <TableCell className="text-accent-foreground">{lang.thought}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <p className="mt-4 text-muted-foreground">Also familiar with React/TypeScript, but not an expert.</p>
                </section>

                <Separator />

                {/* Tools Section */}
                <section className="px-6 mx-6">
                    <h2 className="text-2xl font-bold mb-4">Tools & Technologies</h2>
                    <p className="mb-4 text-muted-foreground">Having worked in many unique areas, I have gained experience with a wide variety of tools.</p>
                    <Accordion type="single" collapsible defaultValue="ides">
                        {Object.entries(tools).map(([category, items], index) => (
                            <AccordionItem key={index} value={category.toLowerCase()}>
                                <AccordionTrigger>{category}</AccordionTrigger>
                                <AccordionContent>
                                    <div className="flex flex-wrap gap-2">
                                        {items.map((item, i) => (
                                            <Badge key={i} variant="outline">{item}</Badge>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </section>
            </div>
        </Header>
    )
}


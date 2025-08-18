import { Button } from "@/components/ui/button";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

export function Projects() {
    const projects = [
        // TODO: equalcheats / echeats slide for DMA cheats
        {
            title: "Aika",
            short: "An AI Anime Waifu",
            description: `Aika is a discord bot with numerous integrations.
Her key features are Text Chat, Voice Chat, and Vision.
She is a companion, an assistant, and a utility.`,
            link: "https://github.com/KeganHollern/Aika",
            picture: "https://aika.lystic.dev/selfies/932890148_aika,%20cute,%20tongue,%20blonde,%20green%20eyes,%20white%20shirt,%20nature,%20close%20up,%20facial%20shot,%20open%20mouth,%20winking,%20rawr_0.png",
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
            link: "https://dayzbr.dev", // TODO: improve link || bring it back ?
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
    )
}
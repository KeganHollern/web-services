
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

export function Tools() {
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


    return (
        < section className="px-6 mx-6" >
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
        </section >
    )
}

import { Header } from "@/components/page-header"
import { Separator } from "@/components/ui/separator"

import { Profile } from "./sections/profile"
import { Projects } from "./sections/projects"
import { Skills } from "./sections/skills"
import { Tools } from "./sections/tools"

export function HomePage() {
    const breadcrumbs = [
        { label: "lystic.dev" }
    ];

    return (
        <>
            <Header breadcrumbItems={breadcrumbs} />
            <main className="flex flex-1 flex-col overflow-hidden">
                <div className="container mx-auto py-6 space-y-12">
                    {/* TODO: add #tag links for each section to allow quick linking */}
                    <Profile />
                    <Separator />
                    <Projects />
                    <Separator />
                    <Skills />
                    <Separator />
                    <Tools />
                </div>
            </main>
        </>
    );
}


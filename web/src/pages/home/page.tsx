
import { Header } from "@/components/page-header"
import { Separator } from "@/components/ui/separator"

import { Tools } from "./sections/tools"
import { Skills } from "./sections/skills"
import { Projects } from "./sections/projects"
import { Profile } from "./sections/profile"

export function HomePage() {
    const breadcrumbs = [
        { label: "lystic.dev" }
    ];

    return (
        <Header breadcrumbItems={breadcrumbs}>
            <div className="container mx-auto py-6 space-y-12">
                <Profile />
                <Separator />
                <Projects />
                <Separator />
                <Skills />
                <Separator />
                <Tools />
            </div>
        </Header>
    )
}


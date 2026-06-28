
import { Sidebar as BaseSidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { ArrowLeftRight, BookLock, ChevronRight, Code, Gamepad2, Home, MonitorUp, Newspaper, Trophy } from "lucide-react";
import React from "react";

type SidebarProps = {
    children: React.ReactNode
}

type Item = { title: string; url: string; icon: React.ComponentType };

export function Sidebar({ children }: SidebarProps) {
    // TODO: probably move sidebar to page level and let page add custom sidebar items under a new "section"
    // so domains/pages can have custom sidebar segments
    const items: Item[] = [
        { title: "Home", url: "/", icon: Home },
        { title: "Blog", url: "/blog", icon: Newspaper },
        { title: "Editor", url: "/edit", icon: Code },
        { title: "Secret", url: "/secret", icon: BookLock },
        { title: "Swap", url: "/swap", icon: ArrowLeftRight },
        { title: "Share", url: "/share", icon: MonitorUp },
    ];

    // "Playground" — small standalone toys/experiments. Expanded by default.
    const playground: Item[] = [
        { title: "Ping", url: "/ping", icon: Gamepad2 },
        { title: "FIFA Bracket", url: "/fifa", icon: Trophy },
    ];

    const [playgroundOpen, setPlaygroundOpen] = React.useState(true);

    const renderItem = (item: Item) => (
        <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild>
                <a href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                </a>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );

    return (
        <>
            <BaseSidebar>
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel>Lystic's Platform</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {items.map(renderItem)}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>

                    <SidebarGroup>
                        <SidebarGroupLabel asChild>
                            <button
                                type="button"
                                aria-expanded={playgroundOpen}
                                onClick={() => setPlaygroundOpen((o) => !o)}
                                className="flex w-full cursor-pointer items-center justify-between gap-2 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            >
                                <span>Playground</span>
                                <ChevronRight
                                    className={`!size-3.5 shrink-0 opacity-60 transition-transform duration-200 ${playgroundOpen ? "rotate-90" : ""}`}
                                />
                            </button>
                        </SidebarGroupLabel>
                        {playgroundOpen && (
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {playground.map(renderItem)}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        )}
                    </SidebarGroup>
                </SidebarContent>
            </BaseSidebar>
            <SidebarInset>
                {children}
            </SidebarInset>
        </>
    )
}

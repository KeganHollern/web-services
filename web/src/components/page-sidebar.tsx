
import { Sidebar as BaseSidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { ArrowLeftRight, BookLock, Code, Gamepad2, Home, MonitorUp, Newspaper } from "lucide-react";
import React from "react";

type SidebarProps = {
    children: React.ReactNode
}

export function Sidebar({ children }: SidebarProps) {
    // TODO: probably move sidebar to page level and let page add custom sidebar items under a new "section"
    // so domains/pages can have custom sidebar segments
    const items = [
        {
            title: "Home",
            url: "/",
            icon: Home,
        },
        {
            title: "Blog",
            url: "/blog",
            icon: Newspaper,
        },
        {
            title: "Editor",
            url: "/edit",
            icon: Code,
        },
        {
            title: "Secret",
            url: "/secret",
            icon: BookLock,
        },
        {
            title: "Swap",
            url: "/swap",
            icon: ArrowLeftRight,
        },
        {
            title: "Share",
            url: "/share",
            icon: MonitorUp,
        },
        {
            title: "Ping",
            url: "https://lystic.dev/ping",
            icon: Gamepad2,
        },
    ];

    return (
        <>
            <BaseSidebar>
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel>Lystic's Platform</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {items.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild>
                                            <a href={item.url}>
                                                <item.icon />
                                                <span>{item.title}</span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
            </BaseSidebar>
            <SidebarInset>
                {children}
            </SidebarInset>
        </>
    )
}

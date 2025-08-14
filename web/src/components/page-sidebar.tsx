
import { Sidebar as BaseSidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { BookLock, Code, Home, Newspaper } from "lucide-react";
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
            url: "https://lystic.dev",
            icon: Home,
        },
        {
            title: "Blog",
            url: "https://blog.lystic.dev",
            icon: Newspaper,
        },
        {
            title: "Editor",
            url: "https://rustpad.lystic.dev",
            icon: Code,
        },
        {
            title: "Secret",
            url: "https://secret.lystic.dev",
            icon: BookLock,
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

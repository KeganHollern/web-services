
import { SidebarInset, Sidebar as BaseSidebar, SidebarGroup, SidebarContent, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Code, Home, Newspaper, BookLock } from "lucide-react";
import React from "react";

type SidebarProps = {
    children: React.ReactNode
}

export function Sidebar({ children }: SidebarProps) {
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

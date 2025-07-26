import { ThemeProvider } from "@/components/theme-provider"
import { SidebarProvider, SidebarInset, Sidebar, SidebarGroup, SidebarContent, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "./components/ui/sidebar";
import { Code, Home, Newspaper, BookLock } from "lucide-react";

import HomePage from "@/pages/home/page"

function App() {
  const defaultOpen: boolean = true; // TODO: get this from cookies!

  // Menu items remain the same
  const platform_items = [
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
  ]

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <SidebarProvider defaultOpen={defaultOpen}>
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Lystic's Platform</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {platform_items.map((item) => (
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
        </Sidebar>
        <SidebarInset>
          <HomePage />
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  )
}

export default App

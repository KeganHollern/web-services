import './styles/globals.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { BrowserRouter } from "react-router";
import { ThemeProvider } from "@/context/theme-provider"
import { DomainRouter } from "@/pages/domain-router"

import { Code, Home, Newspaper, BookLock } from "lucide-react";

import { Sidebar } from "@/components/page-sidebar"


// TODO: may want to add child sidebar items (collapsable sidebar items) for segments under each
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
];

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark">
      <Sidebar title="Lystic's Platform" items={platform_items}>
        <BrowserRouter>
          <DomainRouter />
        </BrowserRouter>
      </Sidebar>
    </ThemeProvider>
  </StrictMode>,
)

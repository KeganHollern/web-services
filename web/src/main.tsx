import '@/styles/globals.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { BrowserRouter } from "react-router";
import { ThemeProvider } from "@/context/theme-provider"
import { DomainRouter } from "@/pages/domain-router"
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from "@/components/ui/sonner"


import Cookies from 'js-cookie';
import { Sidebar } from "@/components/page-sidebar"

const open = (Cookies.get('sidebar_state') ?? "true") === "true";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <SidebarProvider defaultOpen={open}>
        <Sidebar> {/* global sidebar for all my website */}
          <BrowserRouter>
            <DomainRouter />
          </BrowserRouter>
        </Sidebar>
      </SidebarProvider>
      <Toaster /> {/* for global toast notifications */}
    </ThemeProvider>
  </StrictMode>,
)

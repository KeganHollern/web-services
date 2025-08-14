import '@/styles/globals.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/context/theme-provider";
import { DomainRouter } from "@/pages/domain-router";
import { BrowserRouter } from "react-router";


import { Sidebar } from "@/components/page-sidebar";
import { LinkShareProvider } from '@/context/linkshare-provider';
import Cookies from 'js-cookie';


const open = (Cookies.get('sidebar_state') ?? "true") === "true";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <LinkShareProvider>
        <SidebarProvider defaultOpen={open}>
          <Sidebar> {/* global sidebar for all my website */}
            <BrowserRouter>
              <DomainRouter />
            </BrowserRouter>
          </Sidebar>
        </SidebarProvider>
        <Toaster /> {/* for global toast notifications */}
      </LinkShareProvider>
    </ThemeProvider>
  </StrictMode>,
)

import '@/styles/globals.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { Sidebar } from "@/components/page-sidebar";
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from "@/components/ui/sonner";
import { LinkShareProvider } from '@/context/linkshare-provider';
import { ThemeProvider } from "@/context/theme-provider";
import { resolveDomain } from '@/lib/domain';
import { getItem } from '@/lib/state';
import { DomainRouter } from "@/pages/domain-router";
import { BrowserRouter } from "react-router";
import ScrollToTop from './hooks/scroll';

const open = (getItem('sidebar_state') ?? "true") === "true";
const { basename } = resolveDomain();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <LinkShareProvider>
        <SidebarProvider defaultOpen={open}>
          <Sidebar>
            <BrowserRouter basename={basename}>
              <ScrollToTop />
              <DomainRouter />
            </BrowserRouter>
          </Sidebar>
        </SidebarProvider>
        <Toaster />
      </LinkShareProvider>
    </ThemeProvider>
  </StrictMode>,
)

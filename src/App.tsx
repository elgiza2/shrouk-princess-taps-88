
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { TonConnectUIProvider, THEME } from '@tonconnect/ui-react';
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Use the correct manifest URL for this app
const manifestUrl = window.location.origin + '/tonconnect-manifest.json';

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TonConnectUIProvider 
      manifestUrl={manifestUrl}
      uiPreferences={{
        theme: THEME.DARK,
        colorsSet: {
          [THEME.DARK]: {
            connectButton: {
              background: '#7c3aed',
              foreground: '#ffffff',
            },
            accent: '#7c3aed',
            telegramButton: '#0088cc',
          },
          [THEME.LIGHT]: {
            connectButton: {
              background: '#7c3aed', 
              foreground: '#ffffff',
            },
            accent: '#7c3aed',
            telegramButton: '#0088cc',
          }
        }
      }}
      actionsConfiguration={{
        twaReturnUrl: 'https://t.me/shm8bot'
      }}
    >
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </TonConnectUIProvider>
  </QueryClientProvider>
);

export default App;

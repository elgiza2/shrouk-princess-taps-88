
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// TON Connect manifest - using a proper manifest for the project
const manifestUrl = 'https://raw.githubusercontent.com/ton-community/tutorials/main/03-client/test/public/tonconnect-manifest.json';

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TonConnectUIProvider 
      manifestUrl={manifestUrl}
      uiPreferences={{
        theme: 'SYSTEM',
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

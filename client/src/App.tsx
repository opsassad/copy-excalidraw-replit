import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/use-theme";
import DrawingBoard from "@/pages/drawing-board";
import NotFound from "@/pages/not-found";
import { useEffect } from 'react';

function Router() {
  return (
    <Switch>
      <Route path="/" component={DrawingBoard} />
      <Route path="/board/:sessionId?" component={DrawingBoard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Prevent browser zoom globally (trackpad pinch, ctrl/cmd+wheel, and keyboard shortcuts)
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };
    const handleKeydown = (e) => {
      if (
        e.ctrlKey &&
        (e.key === '=' || e.key === '+' || e.key === '-' || e.key === '_' || e.key === '0')
      ) {
        e.preventDefault();
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeydown);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

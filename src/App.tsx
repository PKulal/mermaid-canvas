import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useMermaidStore } from "@/store/mermaid-store";
import Landing from "./pages/Landing";
import Editor from "./pages/Editor";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ThemeSync() {
  const uiTheme = useMermaidStore(s => s.uiTheme);
  useEffect(() => {
    const root = document.documentElement;
    if (uiTheme === 'light') root.classList.add('light');
    else root.classList.remove('light');
  }, [uiTheme]);
  return null;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <Landing />
          </motion.div>
        } />
        <Route path="/editor" element={
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Editor />
          </motion.div>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

function AppToaster() {
  const uiTheme = useMermaidStore(s => s.uiTheme);
  return <Sonner theme={uiTheme} position="bottom-right" />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeSync />
      <AppToaster />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AnimatedRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

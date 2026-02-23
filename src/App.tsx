import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Papers from "./pages/Papers";
import Notes from "./pages/Notes";
import Admin from "./pages/Admin";
import ResetPassword from "./pages/ResetPassword";
import Rewards from "./pages/Rewards";
import HelpSupport from "./pages/HelpSupport";
import Catalog from "./pages/Catalog";
import Downloads from "./pages/Downloads";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/papers" element={<Papers />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/rewards" element={<Rewards />} />
            <Route path="/help" element={<HelpSupport />} />
            <Route path="/downloads" element={<Downloads />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

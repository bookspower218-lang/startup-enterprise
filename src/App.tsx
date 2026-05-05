import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import ComingSoon from "./pages/ComingSoon.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route
            path="/startup/register"
            element={
              <ComingSoon
                title="Startup Registration — coming next"
                description="The 3-step startup signup flow with plan selection and payment is being built. Hook up Lovable Cloud to enable accounts and persistence."
              />
            }
          />
          <Route
            path="/company/register"
            element={
              <ComingSoon
                title="Company Registration — coming next"
                description="Free signup for validator companies. We'll wire up auth and the company profile form in the next iteration."
              />
            }
          />
          <Route
            path="/terms"
            element={
              <ComingSoon
                title="Terms & Conditions"
                description="Full terms covering platform usage, payment obligations, refund policy and the 7-day company response SLA — coming next."
              />
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

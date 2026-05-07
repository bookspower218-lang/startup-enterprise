import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Terms from "./pages/Terms.tsx";
import Login from "./pages/auth/Login.tsx";
import StartupRegister from "./pages/auth/StartupRegister.tsx";
import CompanyRegister from "./pages/auth/CompanyRegister.tsx";
import Dashboard from "./pages/dashboard/Dashboard.tsx";
import MyPitches from "./pages/dashboard/MyPitches.tsx";
import NewPitch from "./pages/dashboard/NewPitch.tsx";
import Browse from "./pages/dashboard/Browse.tsx";
import Profile from "./pages/dashboard/Profile.tsx";
import PitchThread from "./pages/dashboard/PitchThread.tsx";
import AdminPayments from "./pages/dashboard/AdminPayments.tsx";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

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
            <Route path="/login" element={<Login />} />
            <Route path="/startup/register" element={<StartupRegister />} />
            <Route path="/company/register" element={<CompanyRegister />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/pitches" element={<ProtectedRoute><MyPitches /></ProtectedRoute>} />
            <Route path="/pitches/new" element={<ProtectedRoute><NewPitch /></ProtectedRoute>} />
            <Route path="/pitches/:id" element={<ProtectedRoute><PitchThread /></ProtectedRoute>} />
            <Route path="/browse" element={<ProtectedRoute><Browse /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/admin/payments" element={<ProtectedRoute><AdminPayments /></ProtectedRoute>} />
            <Route path="/terms" element={<Terms />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Terms from "./pages/Terms.tsx";
import Privacy from "./pages/Privacy.tsx";
import Login from "./pages/auth/Login.tsx";
import Register from "./pages/auth/Register.tsx";
import OAuthComplete from "./pages/auth/OAuthComplete.tsx";
import Dashboard from "./pages/dashboard/Dashboard.tsx";
import MyPitches from "./pages/dashboard/MyPitches.tsx";
import NewPitch from "./pages/dashboard/NewPitch.tsx";
import Browse from "./pages/dashboard/Browse.tsx";
import Profile from "./pages/dashboard/Profile.tsx";
import PitchThread from "./pages/dashboard/PitchThread.tsx";
import AdminPayments from "./pages/dashboard/AdminPayments.tsx";
import Chat from "./pages/dashboard/Chat.tsx";
import Account from "./pages/settings/Account.tsx";
import NotificationSettings from "./pages/settings/Notifications.tsx";
import Billing from "./pages/settings/Billing.tsx";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import CookieConsent from "./components/site/CookieConsent";
import EnvSetupBanner from "./components/EnvSetupBanner";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <EnvSetupBanner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/startup/register" element={<Navigate to="/register?type=startup" replace />} />
            <Route path="/company/register" element={<Navigate to="/register?type=company" replace />} />
            <Route path="/auth/complete" element={<OAuthComplete />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/pitches" element={<ProtectedRoute><MyPitches /></ProtectedRoute>} />
            <Route path="/pitches/new" element={<ProtectedRoute><NewPitch /></ProtectedRoute>} />
            <Route path="/pitches/:id" element={<ProtectedRoute><PitchThread /></ProtectedRoute>} />
            <Route path="/browse" element={<ProtectedRoute><Browse /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/admin" element={<Navigate to="/admin/payments" replace />} />
            <Route path="/admin/payments" element={<ProtectedRoute><AdminPayments /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/settings/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
            <Route path="/settings/notifications" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
            <Route path="/settings/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <CookieConsent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

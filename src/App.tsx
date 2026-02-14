import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import RequestAssistance from "./pages/RequestAssistance";
import TrackRequest from "./pages/TrackRequest";
import Auth from "./pages/Auth";
import MyRequests from "./pages/MyRequests";
import AdminDashboard from "./pages/AdminDashboard";
import MechanicDashboard from "./pages/MechanicDashboard";
import NotFound from "./pages/NotFound";
import RequireRole from "@/components/auth/RequireRole";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/request" element={<RequestAssistance />} />
          <Route path="/track/:requestId" element={<TrackRequest />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/my-requests" element={<MyRequests />} />
          <Route
            path="/admin"
            element={
              <RequireRole allowedRoles={["admin"]} unauthorizedMessage="Access denied. Admin privileges required.">
                <AdminDashboard />
              </RequireRole>
            }
          />
          <Route
            path="/mechanic"
            element={
              <RequireRole
                allowedRoles={["mechanic"]}
                unauthorizedMessage="Access denied. Mechanic privileges required."
              >
                <MechanicDashboard />
              </RequireRole>
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

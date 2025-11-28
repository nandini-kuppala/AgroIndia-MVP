import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import FieldManagement from "./pages/FieldManagement";
import AddField from "./pages/AddField";
import Analysis from "./pages/AnalysisNew";
import Pricing from "./pages/Pricing";
import Consultation from "./pages/Consultation";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Header />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/fields" element={<ProtectedRoute><FieldManagement /></ProtectedRoute>} />
            <Route path="/fields/new" element={<ProtectedRoute><AddField /></ProtectedRoute>} />
            <Route path="/analysis" element={<ProtectedRoute><Analysis /></ProtectedRoute>} />
            <Route path="/analysis/:fieldId" element={<ProtectedRoute><Analysis /></ProtectedRoute>} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/consultation" element={<Consultation />} />
            <Route path="/services" element={<Consultation />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

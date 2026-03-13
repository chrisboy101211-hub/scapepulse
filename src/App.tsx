import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ServerProvider } from "@/lib/server-context";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import DashboardLayout from "./layouts/DashboardLayout.tsx";
import Overview from "./pages/dashboard/Overview.tsx";
import Servers from "./pages/dashboard/Servers.tsx";
import Products from "./pages/dashboard/Products.tsx";
import Categories from "./pages/dashboard/Categories.tsx";
import Orders from "./pages/dashboard/Orders.tsx";
import Votes from "./pages/dashboard/Votes.tsx";
import ApiKeys from "./pages/dashboard/ApiKeys.tsx";
import Settings from "./pages/dashboard/Settings.tsx";
import HiscoresSettings from "./pages/dashboard/HiscoresSettings.tsx";
import StoreFront from "./pages/StoreFront.tsx";
import NotFound from "./pages/NotFound.tsx";
import Docs from "./pages/Docs.tsx";
import Pricing from "./pages/Pricing.tsx";
import Hiscores from "./pages/Hiscores.tsx";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <ServerProvider>
                  <DashboardLayout />
                </ServerProvider>
              </ProtectedRoute>
            }>
              <Route index element={<Overview />} />
              <Route path="servers" element={<Servers />} />
              <Route path="products" element={<Products />} />
              <Route path="categories" element={<Categories />} />
              <Route path="orders" element={<Orders />} />
              <Route path="votes" element={<Votes />} />
              <Route path="api" element={<ApiKeys />} />
              <Route path="settings" element={<Settings />} />
              <Route path="hiscores-settings" element={<HiscoresSettings />} />
            </Route>
            <Route path="/store/:slug" element={<StoreFront />} />
            <Route path="/hiscores/:slug" element={<Hiscores />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

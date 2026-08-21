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
import Transactions from "./pages/dashboard/Transactions.tsx";
import DashboardToplistServer from "./pages/dashboard/ToplistServer.tsx";
import VideoHubAnalytics from "./pages/dashboard/VideoHubAnalytics.tsx";
import StoreFront from "./pages/StoreFront.tsx";
import NotFound from "./pages/NotFound.tsx";
import Docs from "./pages/Docs.tsx";
import Pricing from "./pages/Pricing.tsx";
import Hiscores from "./pages/Hiscores.tsx";
import ToplistHome from "./pages/toplist/ToplistHome.tsx";
import ToplistServerDetail from "./pages/toplist/ToplistServerDetail.tsx";
import ToplistVote from "./pages/toplist/ToplistVote.tsx";
import ToplistSubmitServer from "./pages/toplist/ToplistSubmitServer.tsx";
import VideoHubHome from "./pages/video-hub/VideoHubHome.tsx";
import VideoHubSubmit from "./pages/video-hub/VideoHubSubmit.tsx";
import VideoHubWatch from "./pages/video-hub/VideoHubWatch.tsx";
import ProfilePage from "./pages/profile/ProfilePage.tsx";
import MyProfile from "./pages/profile/MyProfile.tsx";
import ProfileSettings from "./pages/dashboard/ProfileSettings.tsx";
import PaymentMethods from "./pages/dashboard/PaymentMethods.tsx";
import PageAppearance from "./pages/dashboard/PageAppearance.tsx";

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
            <Route path="/" element={<ToplistHome />} />
            <Route path="/storefront" element={<Index />} />
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
              <Route path="transactions" element={<Transactions />} />
              <Route path="toplist" element={<DashboardToplistServer />} />
              <Route path="video-hub" element={<VideoHubAnalytics />} />
              <Route path="profile" element={<ProfileSettings />} />
              <Route path="payment-methods" element={<PaymentMethods />} />
              <Route path="page-appearance" element={<PageAppearance />} />
            </Route>
            <Route path="/store/:slug" element={<StoreFront />} />
            <Route path="/hiscores/:slug" element={<Hiscores />} />
            <Route path="/toplist" element={<ToplistHome />} />
            <Route path="/toplist/servers/:id" element={<ToplistServerDetail />} />
            <Route path="/toplist/vote/:id" element={<ToplistVote />} />
            <Route path="/toplist/submit" element={<ProtectedRoute><ToplistSubmitServer /></ProtectedRoute>} />
            <Route path="/video-hub" element={<VideoHubHome />} />
            <Route path="/video-hub/submit" element={<ProtectedRoute><VideoHubSubmit /></ProtectedRoute>} />
            <Route path="/video-hub/:id" element={<VideoHubWatch />} />
            <Route path="/profile" element={<MyProfile />} />
            <Route path="/u/:username" element={<ProfilePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

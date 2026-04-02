import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import DialerPage from "./pages/DialerPage";
import ActiveCallsPage from "./pages/ActiveCallsPage";
import QueuePage from "./pages/QueuePage";
import ContactsPage from "./pages/ContactsPage";
import HistoryPage from "./pages/HistoryPage";
import ScriptsPage from "./pages/ScriptsPage";
import CampaignsPage from "./pages/CampaignsPage";
import ReportsPage from "./pages/ReportsPage";
import AgentsPage from "./pages/AgentsPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/dialer" element={<DialerPage />} />
            <Route path="/active-calls" element={<ActiveCallsPage />} />
            <Route path="/queue" element={<QueuePage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/scripts" element={<ScriptsPage />} />
            <Route path="/campaigns" element={<CampaignsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/agents" element={<AgentsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

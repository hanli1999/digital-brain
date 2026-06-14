import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { HeaderBar } from "@/components/layout/HeaderBar";

import Dashboard from "@/pages/Dashboard";
import Inbox from "@/pages/Inbox";
import Tasks from "@/pages/Tasks";
import Tools from "@/pages/Tools";
import Methods from "@/pages/Methods";
import Library from "@/pages/Library";
import Files from "@/pages/Files";
import Calendar from "@/pages/Calendar";
import Analytics from "@/pages/Analytics";
import Resources from "@/pages/Resources";
import AiEngine from "@/pages/AiEngine";
import Insight from "@/pages/Insight";
import Jiyuanlu from "@/pages/Jiyuanlu";
import Search from "@/pages/Search";
import Settings from "@/pages/Settings";
import Guide from "@/pages/Guide";
import Login from "@/pages/Login";
import Register from "@/pages/Register";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppLayout() {
  return (
    <ProtectedRoute>
      <SidebarNav />
      <HeaderBar />
      <main className="ml-56 mt-14 p-6 min-h-[calc(100vh-3.5rem)]">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/methods" element={<Methods />} />
          <Route path="/library" element={<Library />} />
          <Route path="/files" element={<Files />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/ai-engine" element={<AiEngine />} />
          <Route path="/insight" element={<Insight />} />
          <Route path="/jiyuanlu" element={<Jiyuanlu />} />
          <Route path="/search" element={<Search />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryProvider>
          <Toaster richColors position="top-right" />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/guide" element={<Guide />} />
            <Route path="*" element={<AppLayout />} />
          </Routes>
        </QueryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

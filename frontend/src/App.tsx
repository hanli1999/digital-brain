import { Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
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
import Search from "@/pages/Search";
import Settings from "@/pages/Settings";

export default function App() {
  return (
    <ThemeProvider>
      <QueryProvider>
        <Toaster richColors position="top-right" />
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
            <Route path="/search" element={<Search />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </QueryProvider>
    </ThemeProvider>
  );
}

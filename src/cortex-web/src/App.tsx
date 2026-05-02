import { Navigate, Route, Routes } from "react-router-dom";

import CommandPalette from "@/components/CommandPalette";
import Layout from "@/components/Layout";
import Automations from "@/pages/Automations";
import DailyReportPage from "@/pages/DailyReportPage";
import DebuggingHelper from "@/pages/DebuggingHelper";
import EntryDetail from "@/pages/EntryDetail";
import GitHubActivityPage from "@/pages/GitHubActivityPage";
import IdeaMapper from "@/pages/IdeaMapper";
import InSessionAnalytics from "@/pages/InSessionAnalytics";
import Login from "@/pages/Login";
import Search from "@/pages/Search";
import Settings from "@/pages/Settings";
import Timeline from "@/pages/Timeline";
import TodayHub from "@/pages/TodayHub";
import TouchGrass from "@/pages/TouchGrass";
import UserProfilePage from "@/pages/UserProfilePage";
import { useAuth } from "@/hooks/useAuth";

export default function App() {
  const { token } = useAuth();

  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <CommandPalette />
      <Routes>
        <Route path="/" element={<Navigate to="/today" replace />} />
        <Route path="/today" element={<TodayHub />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/search" element={<Search />} />
        <Route path="/ideas" element={<IdeaMapper />} />
        <Route path="/debug" element={<DebuggingHelper />} />
        <Route path="/report" element={<DailyReportPage />} />
        <Route path="/analytics" element={<InSessionAnalytics />} />
        <Route path="/github" element={<GitHubActivityPage />} />
        <Route path="/automations" element={<Automations />} />
        <Route path="/wellness" element={<TouchGrass />} />
        <Route path="/profile" element={<UserProfilePage />} />
        <Route path="/entry/:id" element={<EntryDetail />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/today" replace />} />
      </Routes>
    </Layout>
  );
}

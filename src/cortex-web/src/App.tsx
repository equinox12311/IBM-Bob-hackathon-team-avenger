import { Navigate, Route, Routes } from "react-router-dom";

import CommandPalette from "@/components/CommandPalette";
import Layout from "@/components/Layout";
import EntryDetail from "@/pages/EntryDetail";
import Login from "@/pages/Login";
import Search from "@/pages/Search";
import Settings from "@/pages/Settings";
import Timeline from "@/pages/Timeline";
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
        <Route path="/" element={<Navigate to="/timeline" replace />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/search" element={<Search />} />
        <Route path="/entry/:id" element={<EntryDetail />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/timeline" replace />} />
      </Routes>
    </Layout>
  );
}

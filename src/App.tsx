import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { PublicWebsiteLayout } from '@/layouts/PublicWebsiteLayout';
import { AppLayout } from '@/layouts/AppLayout';

// Public Website Pages
import { HomePage } from '@/pages/public/HomePage';
import { CloudExperiencePage } from '@/pages/public/CloudExperiencePage';
import { LocalDriveExperiencePage } from '@/pages/public/LocalDriveExperiencePage';
import { DownloadPage } from '@/pages/public/DownloadPage';
import { PublicSecurityPage } from '@/pages/public/PublicSecurityPage';
import { FeaturesCatalogPage } from '@/pages/public/FeaturesCatalogPage';
import { ContactPage } from '@/pages/public/ContactPage';

// Authenticated Cloud App Pages
import { DashboardPage } from '@/pages/DashboardPage';
import { DrivePage } from '@/pages/DrivePage';
import { AIPage } from '@/pages/AIPage';
import { SharedPage } from '@/pages/SharedPage';
import { RecentPage } from '@/pages/RecentPage';
import { StarredPage } from '@/pages/StarredPage';
import { MediaPage } from '@/pages/MediaPage';
import { TrashPage } from '@/pages/TrashPage';
import { StoragePage } from '@/pages/StoragePage';
import { DevicePage } from '@/pages/DevicePage';
import { ActivityPage } from '@/pages/ActivityPage';
import { AdminPage } from '@/pages/AdminPage';
import { SettingsPage } from '@/pages/SettingsPage';
// import { CanvasPage } from '@/pages/CanvasPage';
// import { CanvasEditorPage } from '@/pages/CanvasEditorPage';
import { SyncCenterPage } from '@/pages/SyncCenterPage';
import { OfflineCenterPage } from '@/pages/OfflineCenterPage';
import { SecurityCenterPage } from '@/pages/SecurityCenterPage';
import { DiagnosticsPage } from '@/pages/DiagnosticsPage';

// Standalone Shared & Auth Pages
import { PublicSharePage } from '@/pages/PublicSharePage';
import { FileRequestPage } from '@/pages/FileRequestPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { NativeMobileService } from '@/services/nativeMobile';

export function App() {
  const { theme } = useUIStore();
  const { init } = useAuthStore();

  // Initialize auth session and native mobile handlers on load
  React.useEffect(() => {
    init();
    NativeMobileService.init();
  }, [init]);

  // Initialize theme on root document
  React.useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <Routes>
      {/* ─── 1. PUBLIC MARKETING WEBSITE ROUTES ─── */}
      <Route element={<PublicWebsiteLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/cloud" element={<CloudExperiencePage />} />
        <Route path="/local-drive" element={<LocalDriveExperiencePage />} />
        <Route path="/download" element={<DownloadPage />} />
        <Route path="/security" element={<PublicSecurityPage />} />
        <Route path="/features" element={<FeaturesCatalogPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Route>

      {/* ─── 2. STANDALONE PUBLIC & AUTH ROUTES ─── */}
      <Route path="/share/:token" element={<PublicSharePage />} />
      <Route path="/request/:token" element={<FileRequestPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<RegisterPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* ─── 3. AUTHENTICATED CLOUD APP WORKSPACE ROUTES ─── */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/app" element={<DashboardPage />} />
        <Route path="/drive" element={<DrivePage />} />
        <Route path="/ai" element={<AIPage />} />
        <Route path="/shared" element={<SharedPage />} />
        <Route path="/recent" element={<RecentPage />} />
        <Route path="/starred" element={<StarredPage />} />
        <Route path="/media" element={<MediaPage />} />
        <Route path="/trash" element={<TrashPage />} />
        <Route path="/storage" element={<StoragePage />} />
        <Route path="/sync" element={<SyncCenterPage />} />
        <Route path="/offline" element={<OfflineCenterPage />} />
        <Route path="/security-center" element={<SecurityCenterPage />} />
        <Route path="/diagnostics" element={<DiagnosticsPage />} />
        <Route path="/devices" element={<DevicePage />} />
        <Route path="/activity" element={<ActivityPage />} />
        {/* Master Canvas temporarily hidden until upcoming full upgrade */}
        <Route path="/canvas" element={<Navigate to="/drive" replace />} />
        <Route path="/canvas/*" element={<Navigate to="/drive" replace />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* ─── 4. FALLBACK ─── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';

// Pages
import { SetupWizard } from './pages/SetupWizard';
import { DriveBrowser } from './pages/DriveBrowser';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage }    from './pages/LoginPage';

type AuthStatus = { status: 'logged_in' | 'logged_out' | 'logging_in' | 'error'; email?: string };

export default function App() {
  const [auth, setAuth]         = useState<AuthStatus | null>(null);
  const [setupDone, setSetupDone] = useState(false);

  useEffect(() => {
    // Check auth on startup
    invoke<AuthStatus>('cmd_get_auth_status').then(setAuth).catch(() =>
      setAuth({ status: 'logged_out' })
    );

    // Check if setup has been completed before
    invoke<string | null>('cmd_get_settings').then((s: any) => {
      if (s?.drive_letter) setSetupDone(true);
    }).catch(() => {});
  }, []);

  if (!auth) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (auth.status === 'logged_out') {
    return <LoginPage onLogin={() => invoke<AuthStatus>('cmd_get_auth_status').then(setAuth)} />;
  }

  if (!setupDone) {
    return <SetupWizard onComplete={() => setSetupDone(true)} />;
  }

  return (
    <Routes>
      <Route path="/"          element={<DriveBrowser />} />
      <Route path="/settings"  element={<SettingsPage />} />
      <Route path="*"          element={<Navigate to="/" replace />} />
    </Routes>
  );
}

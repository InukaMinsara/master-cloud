import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/common/Sidebar';
import { AppHeader } from '@/components/common/AppHeader';
import { FileDetailsSidebar } from '@/components/common/FileDetailsSidebar';
import { CommandPalette } from '@/components/common/CommandPalette';
import { UploadCenter } from '@/components/upload/UploadCenter';
import { FileActionBar } from '@/components/files/FileActionBar';
import { FilePreviewModal } from '@/components/preview/FilePreviewModal';
import { ShareDialog } from '@/components/sharing/ShareDialog';
import { FileRequestDialog } from '@/components/sharing/FileRequestDialog';
import { VersionHistoryDialog } from '@/components/versions/VersionHistoryDialog';
import { SmartCleanupDialog } from '@/components/cleanup/SmartCleanupDialog';
import { NewFolderModal } from '@/components/files/NewFolderModal';
import { Toaster } from 'sonner';
import { useFileStore } from '@/stores/fileStore';
import { ContextMenu } from '@/components/context-menu/ContextMenu';


export function AppLayout() {
  const { activeDetailsItem } = useFileStore();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground antialiased">
      {/* Left Navigation Sidebar */}
      <Sidebar />

      {/* Main Column */}
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden">
        <AppHeader />
        
        <main className="flex flex-1 h-full min-h-0 overflow-hidden relative">
          <div className="flex flex-col flex-1 h-full min-h-0 min-w-0 overflow-hidden">
            <Outlet />
          </div>

          {/* Right-hand details sidebar workspace */}
          {activeDetailsItem && <FileDetailsSidebar />}
        </main>
      </div>

      {/* Global Interactive Elements & Modals */}
      <ContextMenu />
      <CommandPalette />
      <UploadCenter />
      <FileActionBar />
      <FilePreviewModal />
      <ShareDialog />
      <FileRequestDialog />
      <VersionHistoryDialog />
      <SmartCleanupDialog />
      <NewFolderModal />

      {/* Toast notifications */}
      <Toaster position="bottom-left" richColors closeButton />
    </div>
  );
}


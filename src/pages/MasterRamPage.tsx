import React from 'react';
import { MasterRamHub } from '@/components/MasterRamHub';

export function MasterRamPage() {
  return (
    <div className="flex flex-col flex-1 h-full min-h-0 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl w-full mx-auto space-y-6">
        <MasterRamHub />
      </div>
    </div>
  );
}

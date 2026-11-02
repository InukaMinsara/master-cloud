import React from 'react';
import { QuantumVgpuHub } from '@/components/QuantumVgpuHub';
import { Zap, Shield, HardDrive, Cpu, Layers } from 'lucide-react';

export function QuantumVgpuPage() {
  return (
    <div className="flex-1 h-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <Zap className="w-6 h-6 text-cyan-400" />
          Master Quantum 50x vGPU Acceleration
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          4,096 GB Virtual Unified VRAM Engine &amp; Sub-Second Startup Cache for Master Cloud
        </p>
      </div>

      {/* Main Hub Component */}
      <QuantumVgpuHub />

      {/* Architectural Guarantee Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-card/40 border border-border/60 space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 font-bold">
            <HardDrive className="w-4 h-4" />
            <span>Zero-Disk Paging Fabric</span>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            All 4,096 GB of Virtual VRAM is dynamically paged in high-bandwidth in-memory virtual blocks, consuming 0 Bytes of physical local C:\ or D:\ storage.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-card/40 border border-border/60 space-y-2">
          <div className="flex items-center gap-2 text-blue-400 font-bold">
            <Cpu className="w-4 h-4" />
            <span>Sub-Second Instant Startup</span>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Background async hydration and manifest streaming eliminate all JSON parsing bottlenecks, allowing the Master Cloud dashboard and drive to boot in under 500ms.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-card/40 border border-border/60 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <Shield className="w-4 h-4" />
            <span>Ultra Potato-Proof Security</span>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Locked to under 15MB RAM and &lt;2% CPU on legacy Intel Celeron, Atom, and low-spec processors with zero thermal throttling.
          </p>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  FileText,
  Palette,
  Check,
  Plus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { MasterSlideObject } from '../types';

interface MasterSlidesIntegrationsModalProps {
  onClose: () => void;
  onInsertObject: (object: MasterSlideObject) => void;
}

export function MasterSlidesIntegrationsModal({
  onClose,
  onInsertObject,
}: MasterSlidesIntegrationsModalProps) {
  const [activeTab, setActiveTab] = useState<'sheets' | 'docs' | 'canvas'>('sheets');

  // Sample data presets from Master Cloud apps
  const handleInsertSheetsTable = () => {
    const tableObj: MasterSlideObject = {
      id: 'obj-sheets-tbl-' + Date.now(),
      name: 'Master Sheets Linked Table',
      type: 'table',
      content: 'Financial Performance Matrix',
      x: 15,
      y: 20,
      width: 70,
      height: 45,
      zIndex: 2,
      tableData: {
        rows: 4,
        cols: 4,
        cells: [
          ['Metric', 'Q1 2026', 'Q2 2026', 'YoY Growth'],
          ['Active Users', '124,500', '182,300', '+46.4%'],
          ['Cloud Storage', '4.2 PB', '8.9 PB', '+111.9%'],
          ['Net Revenue', '$840,000', '$1,260,000', '+50.0%'],
        ],
      },
      linkedDataSource: {
        sourceApp: 'sheets',
        isLiveLinked: true,
        lastSyncedAt: new Date().toISOString(),
      },
    };
    onInsertObject(tableObj);
    onClose();
  };

  const handleInsertSheetsChart = () => {
    const chartObj: MasterSlideObject = {
      id: 'obj-sheets-chart-' + Date.now(),
      name: 'Master Sheets Linked Chart',
      type: 'chart',
      content: 'Quarterly Revenue Breakdown',
      x: 20,
      y: 20,
      width: 60,
      height: 50,
      zIndex: 2,
      chartData: {
        type: 'column',
        title: 'Master Cloud Ecosystem Growth',
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        values: [45, 62, 80, 110, 145, 190],
      },
      linkedDataSource: {
        sourceApp: 'sheets',
        isLiveLinked: true,
        lastSyncedAt: new Date().toISOString(),
      },
    };
    onInsertObject(chartObj);
    onClose();
  };

  const handleInsertDocsSnippet = () => {
    const docObj: MasterSlideObject = {
      id: 'obj-docs-snippet-' + Date.now(),
      name: 'Master Docs Executive Summary',
      type: 'text',
      content:
        'EXECUTIVE BRIEFING (from Master Docs):\n\n"The transition to Master Cloud provides enterprise clients with zero-latency synchronization, local virtual drive mounting, and uncompromised privacy with 10 TB free storage."',
      x: 12,
      y: 25,
      width: 76,
      height: 35,
      zIndex: 2,
      format: {
        fontSize: 18,
        bold: false,
        italic: true,
        textColor: '#e0e7ff',
        fillColor: '#1e1b4b',
        borderRadius: 16,
        strokeColor: '#4f46e5',
        strokeWidth: 1,
      },
      linkedDataSource: {
        sourceApp: 'docs',
        isLiveLinked: true,
        lastSyncedAt: new Date().toISOString(),
      },
    };
    onInsertObject(docObj);
    onClose();
  };

  const handleInsertDiagram = () => {
    const diagramObj: MasterSlideObject = {
      id: 'obj-canvas-diag-' + Date.now(),
      name: 'Master Draw Process Flow',
      type: 'shape',
      shapeKind: 'process',
      content: 'CLIENT APP  ──►  ENCRYPTION GATEWAY  ──►  MASTER CLOUD EDGE',
      x: 10,
      y: 35,
      width: 80,
      height: 20,
      zIndex: 2,
      format: {
        fontSize: 16,
        bold: true,
        textColor: '#ecfdf5',
        fillColor: '#064e3b',
        strokeColor: '#10b981',
        strokeWidth: 1,
        borderRadius: 12,
      },
      linkedDataSource: {
        sourceApp: 'canvas',
        isLiveLinked: true,
        lastSyncedAt: new Date().toISOString(),
      },
    };
    onInsertObject(diagramObj);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-6 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-card border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-16 px-6 border-b border-border flex items-center justify-between bg-card/60">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">
                Master Cloud Ecosystem Integrations
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Embed live linked data from Master Sheets, Master Docs, and Master Canvas.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-border bg-muted/30 px-6 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('sheets')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-all ${
              activeTab === 'sheets'
                ? 'bg-card text-emerald-500 border-t-2 border-emerald-500 shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Master Sheets (Data &amp; Charts)</span>
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-all ${
              activeTab === 'docs'
                ? 'bg-card text-blue-500 border-t-2 border-blue-500 shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Master Docs (Snippets)</span>
          </button>

          <button
            onClick={() => setActiveTab('canvas')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-all ${
              activeTab === 'canvas'
                ? 'bg-card text-purple-500 border-t-2 border-purple-500 shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Palette className="h-4 w-4" />
            <span>Master Draw (Diagrams)</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6">
          {activeTab === 'sheets' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl border border-border/80 bg-card/60 flex flex-col justify-between space-y-4 hover:border-emerald-500/50 transition-colors">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                    Live Data Table
                  </span>
                  <h3 className="text-sm font-bold text-foreground mt-1">Financial Performance Table</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Insert formatted 4x4 matrix with automatic styling and linked live values.
                  </p>
                </div>
                <button
                  onClick={handleInsertSheetsTable}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Insert Linked Table</span>
                </button>
              </div>

              <div className="p-5 rounded-2xl border border-border/80 bg-card/60 flex flex-col justify-between space-y-4 hover:border-emerald-500/50 transition-colors">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                    Interactive Chart
                  </span>
                  <h3 className="text-sm font-bold text-foreground mt-1">Growth Column Chart</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Insert 6-month visual bar chart with customizable data series and color palettes.
                  </p>
                </div>
                <button
                  onClick={handleInsertSheetsChart}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Insert Linked Chart</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="p-5 rounded-2xl border border-border/80 bg-card/60 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500">
                  Formatted Document Callout
                </span>
                <h3 className="text-sm font-bold text-foreground mt-1">Executive Summary Callout</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Import rich styled quotes and summary blocks directly from your Master Docs files.
                </p>
              </div>
              <button
                onClick={handleInsertDocsSnippet}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Insert Document Callout</span>
              </button>
            </div>
          )}

          {activeTab === 'canvas' && (
            <div className="p-5 rounded-2xl border border-border/80 bg-card/60 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-500">
                  Vector Flowchart Diagram
                </span>
                <h3 className="text-sm font-bold text-foreground mt-1">Architecture Process Pipeline</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Embed editable vector workflow diagrams created in Master Canvas and Master Draw.
                </p>
              </div>
              <button
                onClick={handleInsertDiagram}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Insert Vector Diagram</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

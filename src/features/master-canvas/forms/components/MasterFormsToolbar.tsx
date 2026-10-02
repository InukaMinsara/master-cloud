import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckSquare,
  Eye,
  BarChart3,
  Settings,
  Palette,
  Share2,
  HardDrive,
  CheckCircle2,
  Clock,
  LayoutTemplate,
  GitBranch,
  FileSpreadsheet,
  Download,
  Printer,
  Sparkles,
  Undo2,
  Redo2,
} from 'lucide-react';
import { MasterFormData } from '../types';
import { FormExportService } from '../services/FormExportService';
import { toast } from 'sonner';

interface MasterFormsToolbarProps {
  formData: MasterFormData;
  activeTab: 'editor' | 'responses' | 'analytics' | 'preview';
  setActiveTab: (tab: 'editor' | 'responses' | 'analytics' | 'preview') => void;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onTitleChange: (title: string) => void;
  onOpenThemes: () => void;
  onOpenTemplates: () => void;
  onOpenSettings: () => void;
  onOpenShare: () => void;
  onOpenLogicModal?: () => void;
}

export function MasterFormsToolbar({
  formData,
  activeTab,
  setActiveTab,
  saveStatus,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onTitleChange,
  onOpenThemes,
  onOpenTemplates,
  onOpenSettings,
  onOpenShare,
  onOpenLogicModal,
}: MasterFormsToolbarProps) {
  const navigate = useNavigate();

  const handleExportSheets = async () => {
    const sheetId = await FormExportService.exportToMasterSheets(formData);
    if (sheetId) {
      window.open(`/canvas/sheets/${sheetId}`, '_blank');
    }
  };

  return (
    <header className="h-14 border-b border-border/60 px-3 sm:px-4 flex items-center justify-between bg-card/60 backdrop-blur-md shrink-0 select-none z-30">
      {/* Left section: Back, App Icon, Title, Save Status */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => navigate('/canvas')}
          className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
          title="Back to Master Canvas"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
            style={{ backgroundColor: `${formData.theme?.primaryColor || '#8b5cf6'}20`, color: formData.theme?.primaryColor || '#8b5cf6' }}
          >
            <CheckSquare className="h-4 w-4" />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={formData.title}
                onChange={(e) => onTitleChange(e.target.value)}
                className="font-bold text-sm bg-transparent border-b border-transparent hover:border-border/60 focus:border-primary focus:outline-none px-1 py-0.5 max-w-[200px] sm:max-w-xs truncate transition-colors text-foreground"
                placeholder="Untitled Form"
              />
              {formData.quizSettings?.isQuiz && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-500 shrink-0">
                  QUIZ MODE
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[10px] text-muted-foreground px-1">
              {saveStatus === 'saving' && (
                <span className="flex items-center gap-1 text-amber-500">
                  <Clock className="h-3 w-3 animate-spin" /> Saving...
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="flex items-center gap-1 text-emerald-500 font-medium">
                  <CheckCircle2 className="h-3 w-3" /> Saved in Master Cloud
                </span>
              )}
              {saveStatus === 'unsaved' && (
                <span className="flex items-center gap-1 text-muted-foreground">Unsaved edits</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Center Navigation Tabs */}
      <div className="hidden md:flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/40">
        <button
          onClick={() => setActiveTab('editor')}
          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'editor'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Questions ({formData.questions?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('responses')}
          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === 'responses'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span>Responses</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary-foreground/20">
            {formData.responses?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === 'analytics'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <BarChart3 className="h-3.5 w-3.5" />
          <span>Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('preview')}
          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === 'preview'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Eye className="h-3.5 w-3.5" />
          <span>Preview & Test</span>
        </button>
      </div>

      {/* Right Controls: Tools, Exports, Quota Badge, Share */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Undo / Redo */}
        <div className="hidden lg:flex items-center gap-0.5 border-r border-border/60 pr-1.5 mr-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded-lg hover:bg-accent disabled:opacity-30 text-muted-foreground hover:text-foreground transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded-lg hover:bg-accent disabled:opacity-30 text-muted-foreground hover:text-foreground transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="h-4 w-4" />
          </button>
        </div>

        {/* Templates */}
        <button
          onClick={onOpenTemplates}
          className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          title="Browse Templates"
        >
          <LayoutTemplate className="h-4 w-4" />
        </button>

        {/* Theme Studio */}
        <button
          onClick={onOpenThemes}
          className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          title="Customize Theme & Styling"
        >
          <Palette className="h-4 w-4" />
        </button>

        {/* Logic Branching */}
        {onOpenLogicModal && (
          <button
            onClick={onOpenLogicModal}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="Conditional Logic & Branching"
          >
            <GitBranch className="h-4 w-4" />
          </button>
        )}

        {/* Master Sheets Bridge */}
        <button
          onClick={handleExportSheets}
          className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20 transition-colors"
          title="Open & Sync with Master Sheets"
        >
          <FileSpreadsheet className="h-3.5 w-3.5" />
          <span className="hidden xl:inline">Master Sheets</span>
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          title="Form Settings & Quiz Options"
        >
          <Settings className="h-4 w-4" />
        </button>

        {/* 10 TB Storage Indicator Badge */}
        <div className="hidden 2xl:flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-bold border border-primary/20">
          <HardDrive className="h-3 w-3" />
          <span>10 TB FREE</span>
        </div>

        {/* Share Button */}
        <button
          onClick={onOpenShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-500/20 transition-all active:scale-95"
        >
          <Share2 className="h-3.5 w-3.5" />
          <span>Share</span>
        </button>
      </div>
    </header>
  );
}

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Plus,
  Layers,
  Sparkles,
  LayoutTemplate,
  FileSpreadsheet,
  Palette,
  Settings,
  Share2,
  GitBranch,
} from 'lucide-react';
import {
  MasterFormData,
  MasterFormQuestion,
  FormSection,
  MasterFormResponse,
  FormTheme,
  FormQuizSettings,
  FormAccessSettings,
} from './types';
import { FormSyncService } from './services/FormSyncService';
import { FormExportService } from './services/FormExportService';
import { MasterFormsToolbar } from './components/MasterFormsToolbar';
import { MasterFormsQuestionCard } from './components/MasterFormsQuestionCard';
import { MasterFormsSectionCard } from './components/MasterFormsSectionCard';
import { MasterFormsPublicRenderer } from './components/MasterFormsPublicRenderer';
import { MasterFormsResponsesTable } from './components/MasterFormsResponsesTable';
import { MasterFormsAnalyticsDashboard } from './components/MasterFormsAnalyticsDashboard';
import { MasterFormsSettingsModal } from './components/MasterFormsSettingsModal';
import { MasterFormsThemesModal } from './components/MasterFormsThemesModal';
import { MasterFormsTemplatesModal } from './components/MasterFormsTemplatesModal';
import { MasterFormsShareModal } from './components/MasterFormsShareModal';
import { MasterFormsLogicModal } from './components/MasterFormsLogicModal';
import { FileItem } from '@/types/file';
import { toast } from 'sonner';

interface MasterFormsEditorProps {
  initialFile?: FileItem | null;
  initialData?: any;
  onSave?: (data: any) => Promise<void>;
}

export function MasterFormsEditor({ initialFile, initialData, onSave }: MasterFormsEditorProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Convert legacy CanvasFormData to MasterFormData if necessary
  const normalizeFormData = useCallback((raw: any): MasterFormData => {
    if (!raw) {
      return FormSyncService.getDefaultFormData(initialFile?.name?.replace(/\.[^/.]+$/, '') || 'Untitled Form');
    }

    const defaultSectionId = 'sec-1';
    const sections: FormSection[] = raw.sections?.length > 0
      ? raw.sections
      : [{ id: defaultSectionId, title: 'Section 1', order: 1 }];

    const questions: MasterFormQuestion[] = (raw.questions || []).map((q: any, idx: number) => {
      // If legacy options were strings, convert to ChoiceOption objects
      let mappedOptions = q.options;
      if (Array.isArray(q.options) && q.options.length > 0 && typeof q.options[0] === 'string') {
        mappedOptions = q.options.map((lbl: string, oIdx: number) => ({
          id: `opt-${idx}-${oIdx}-${Math.random().toString(36).substr(2, 4)}`,
          label: lbl,
        }));
      }

      return {
        id: q.id || `q-${Date.now()}-${idx}`,
        sectionId: q.sectionId || defaultSectionId,
        type: q.type || 'short-text',
        title: q.title || 'Untitled Question',
        description: q.description || '',
        required: Boolean(q.required),
        options: mappedOptions,
        points: q.points ?? (raw.quizSettings?.isQuiz ? 10 : undefined),
        correctAnswers: q.correctAnswers || [],
        explanation: q.explanation || '',
        scaleMin: q.scaleMin,
        scaleMax: q.scaleMax,
        scaleMinLabel: q.scaleMinLabel,
        scaleMaxLabel: q.scaleMaxLabel,
        gridRows: q.gridRows,
        gridColumns: q.gridColumns,
        logicRules: q.logicRules || [],
      };
    });

    return {
      id: raw.id || initialFile?.id || 'form-' + Date.now(),
      title: raw.title || initialFile?.name?.replace(/\.[^/.]+$/, '') || 'Untitled Form',
      description: raw.description || 'Please complete the questions below.',
      version: raw.version || 1,
      createdAt: raw.createdAt || new Date().toISOString(),
      updatedAt: raw.updatedAt || new Date().toISOString(),
      sections,
      questions: questions.length > 0 ? questions : FormSyncService.getDefaultFormData().questions,
      theme: raw.theme || {
        themeId: 'purple-modern',
        primaryColor: '#8b5cf6',
        accentColor: '#c084fc',
        backgroundColor: '#ffffff',
        cardColor: '#ffffff',
        textColor: '#0f172a',
        fontFamily: 'Inter',
        borderRadius: 'lg',
        layoutMode: 'single-page',
        darkMode: false,
      },
      quizSettings: raw.quizSettings || {
        isQuiz: false,
        shuffleQuestions: false,
        shuffleChoices: false,
        showResultsImmediately: true,
        showCorrectAnswers: true,
        showPointsPerQuestion: true,
        passPercentage: 70,
      },
      accessSettings: raw.accessSettings || {
        isOpen: true,
        requireLogin: false,
        singleResponsePerUser: false,
        passwordProtected: false,
        collectEmail: 'none',
        showProgressBar: true,
        allowEditAfterSubmission: false,
        confirmationMessage: 'Your response has been recorded. Thank you for participating!',
        sendEmailNotification: false,
      },
      responses: raw.responses || [],
    };
  }, [initialFile]);

  // Main State
  const [formData, setFormData] = useState<MasterFormData>(() => normalizeFormData(initialData));
  const [activeTab, setActiveTab] = useState<'editor' | 'responses' | 'analytics' | 'preview'>('editor');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  // History Stack for Undo/Redo
  const [history, setHistory] = useState<MasterFormData[]>([formData]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isUndoRedoAction = useRef(false);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isThemesOpen, setIsThemesOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isLogicOpen, setIsLogicOpen] = useState(false);

  const saveTimeoutRef = useRef<any>(null);

  // Check URL params for public responder mode
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('mode') === 'public') {
      setActiveTab('preview');
    }
  }, [location.search]);

  // Push state to undo/redo history
  const pushHistory = useCallback((newState: MasterFormData) => {
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }
    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1);
      if (trimmed.length > 30) trimmed.shift();
      return [...trimmed, newState];
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 30));
  }, [historyIndex]);

  // Debounced auto-save to Master Cloud & Local storage
  const triggerAutoSave = useCallback((updated: MasterFormData) => {
    setSaveStatus('unsaved');
    FormSyncService.saveLocalDraft(updated.id, updated);

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      if (onSave) {
        setSaveStatus('saving');
        try {
          await onSave(updated);
          setSaveStatus('saved');
        } catch (err) {
          setSaveStatus('unsaved');
          console.error('Failed to auto-save form:', err);
        }
      }
    }, 1200);
  }, [onSave]);

  // Update form state helper
  const updateFormData = useCallback((updater: (prev: MasterFormData) => MasterFormData) => {
    setFormData((prev) => {
      const next = updater(prev);
      pushHistory(next);
      triggerAutoSave(next);
      return next;
    });
  }, [pushHistory, triggerAutoSave]);

  // Undo / Redo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedoAction.current = true;
      const targetState = history[historyIndex - 1];
      setHistoryIndex((prev) => prev - 1);
      setFormData(targetState);
      triggerAutoSave(targetState);
      toast.info('Undo');
    }
  }, [historyIndex, history, triggerAutoSave]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedoAction.current = true;
      const targetState = history[historyIndex + 1];
      setHistoryIndex((prev) => prev + 1);
      setFormData(targetState);
      triggerAutoSave(targetState);
      toast.info('Redo');
    }
  }, [historyIndex, history, triggerAutoSave]);

  // Keyboard Shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (onSave) {
          setSaveStatus('saving');
          onSave(formData)
            .then(() => {
              setSaveStatus('saved');
              toast.success('Form saved to Master Cloud');
            })
            .catch(() => setSaveStatus('unsaved'));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, onSave, formData]);

  // --------------------------------------------------------------------------------
  // Question & Section Operations
  // --------------------------------------------------------------------------------

  const handleAddQuestion = (type: MasterFormQuestion['type'] = 'short-text', sectionId?: string) => {
    const targetSecId = sectionId || formData.sections[0]?.id || 'sec-1';
    const newQ: MasterFormQuestion = {
      id: 'q-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      sectionId: targetSecId,
      title: 'Untitled Question',
      type,
      required: false,
      options: ['multiple-choice', 'checkbox', 'dropdown', 'ranking'].includes(type)
        ? [
            { id: 'opt-1', label: 'Option 1' },
            { id: 'opt-2', label: 'Option 2' },
          ]
        : undefined,
      points: formData.quizSettings?.isQuiz ? 10 : undefined,
    };

    updateFormData((prev) => ({
      ...prev,
      questions: [...prev.questions, newQ],
    }));
    toast.success('Question added');
  };

  const handleUpdateQuestion = (qId: string, updates: Partial<MasterFormQuestion>) => {
    updateFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => (q.id === qId ? { ...q, ...updates } : q)),
    }));
  };

  const handleDuplicateQuestion = (q: MasterFormQuestion) => {
    const clone: MasterFormQuestion = {
      ...q,
      id: 'q-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      title: `${q.title} (Copy)`,
    };
    updateFormData((prev) => ({
      ...prev,
      questions: [...prev.questions, clone],
    }));
    toast.success('Question duplicated');
  };

  const handleDeleteQuestion = (qId: string) => {
    if (formData.questions.length <= 1) {
      toast.warning('A form must contain at least one question.');
      return;
    }
    updateFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== qId),
    }));
    toast.info('Question deleted');
  };

  const handleMoveQuestion = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= formData.questions.length) return;
    updateFormData((prev) => {
      const qs = [...prev.questions];
      const [moved] = qs.splice(fromIndex, 1);
      qs.splice(toIndex, 0, moved);
      return { ...prev, questions: qs };
    });
  };

  // Section Management
  const handleAddSection = () => {
    const newSection: FormSection = {
      id: 'sec-' + Date.now(),
      title: `Section ${formData.sections.length + 1}`,
      description: '',
      order: formData.sections.length + 1,
    };

    updateFormData((prev) => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));
    toast.success('New section added');
  };

  const handleUpdateSection = (sectionId: string, updates: Partial<FormSection>) => {
    updateFormData((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === sectionId ? { ...s, ...updates } : s)),
    }));
  };

  const handleDeleteSection = (sectionId: string) => {
    if (formData.sections.length <= 1) return;
    const fallbackSecId = formData.sections.find((s) => s.id !== sectionId)?.id || 'sec-1';

    updateFormData((prev) => ({
      ...prev,
      sections: prev.sections.filter((s) => s.id !== sectionId),
      // Move orphaned questions to first available section
      questions: prev.questions.map((q) =>
        q.sectionId === sectionId ? { ...q, sectionId: fallbackSecId } : q
      ),
    }));
    toast.info('Section deleted (questions moved to previous section)');
  };

  // Responses operations
  const handleSubmitNewResponse = (response: MasterFormResponse) => {
    updateFormData((prev) => ({
      ...prev,
      responses: [response, ...prev.responses],
    }));
    FormSyncService.recordResponseLocally(formData.id, response);
    toast.success('Response recorded in Master Cloud!');
  };

  const handleDeleteResponse = (responseId: string) => {
    updateFormData((prev) => ({
      ...prev,
      responses: prev.responses.filter((r) => r.id !== responseId),
    }));
  };

  const handleClearAllResponses = () => {
    updateFormData((prev) => ({
      ...prev,
      responses: [],
    }));
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground select-none overflow-hidden">
      {/* Top Application Toolbar */}
      <MasterFormsToolbar
        formData={formData}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        saveStatus={saveStatus}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onTitleChange={(title) => updateFormData((prev) => ({ ...prev, title }))}
        onOpenThemes={() => setIsThemesOpen(true)}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
        onOpenLogicModal={() => setIsLogicOpen(true)}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 overflow-y-auto bg-muted/15 p-4 sm:p-8 flex justify-center">
        {/* ===================================================================== */}
        {/* TAB 1: FORM QUESTIONS DESIGNER                                        */}
        {/* ===================================================================== */}
        {activeTab === 'editor' && (
          <div className="w-full max-w-3xl space-y-6 pb-20">
            {/* Form Title & Overview Card */}
            <div
              className="bg-card border-t-8 border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-3"
              style={{ borderTopColor: formData.theme?.primaryColor || '#8b5cf6' }}
            >
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Form Title"
                className="w-full text-2xl sm:text-3xl font-black bg-transparent border-b border-transparent hover:border-border/60 focus:border-primary focus:outline-none py-1 transition-colors text-foreground tracking-tight"
              />

              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => updateFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Form description or guidance for your respondents..."
                className="w-full text-xs sm:text-sm text-muted-foreground bg-transparent border-none outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Render Questions Section by Section */}
            {formData.sections.map((section, sIdx) => {
              const sectionQuestions = formData.questions.filter(
                (q) => (q.sectionId || formData.sections[0]?.id) === section.id
              );

              return (
                <div key={section.id} className="space-y-4">
                  {/* Section Divider Card (if multiple sections exist) */}
                  {formData.sections.length > 1 && (
                    <MasterFormsSectionCard
                      section={section}
                      sectionIndex={sIdx}
                      totalSections={formData.sections.length}
                      allSections={formData.sections}
                      onUpdate={(updates) => handleUpdateSection(section.id, updates)}
                      onDelete={() => handleDeleteSection(section.id)}
                    />
                  )}

                  {/* Question Cards inside this section */}
                  {sectionQuestions.map((q) => {
                    const globalIndex = formData.questions.findIndex((item) => item.id === q.id);
                    return (
                      <MasterFormsQuestionCard
                        key={q.id}
                        question={q}
                        index={globalIndex}
                        totalQuestions={formData.questions.length}
                        isQuiz={Boolean(formData.quizSettings?.isQuiz)}
                        onUpdate={(updates) => handleUpdateQuestion(q.id, updates)}
                        onDuplicate={() => handleDuplicateQuestion(q)}
                        onDelete={() => handleDeleteQuestion(q.id)}
                        onMoveUp={() => handleMoveQuestion(globalIndex, globalIndex - 1)}
                        onMoveDown={() => handleMoveQuestion(globalIndex, globalIndex + 1)}
                        onOpenLogic={() => setIsLogicOpen(true)}
                      />
                    );
                  })}

                  {/* Add Question to Section Action Bar */}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => handleAddQuestion('short-text', section.id)}
                      className="flex-1 py-3 rounded-2xl border-2 border-dashed border-border/80 hover:border-primary hover:bg-primary/5 text-xs font-bold text-muted-foreground hover:text-primary flex items-center justify-center gap-2 transition-all"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Question</span>
                    </button>

                    <button
                      onClick={handleAddSection}
                      className="px-4 py-3 rounded-2xl border border-border/80 hover:bg-accent text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-all"
                      title="Add a new page / section"
                    >
                      <Layers className="h-4 w-4" />
                      <span className="hidden sm:inline">Add Section</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 2: RESPONSES DATA GRID & MANAGEMENT                                */}
        {/* ===================================================================== */}
        {activeTab === 'responses' && (
          <MasterFormsResponsesTable
            formData={formData}
            onDeleteResponse={handleDeleteResponse}
            onClearAllResponses={handleClearAllResponses}
            onExportSheets={async () => {
              const sheetId = await FormExportService.exportToMasterSheets(formData);
              if (sheetId) window.open(`/canvas/sheets/${sheetId}`, '_blank');
            }}
          />
        )}

        {/* ===================================================================== */}
        {/* TAB 3: LIVE ANALYTICS & INSIGHTS                                      */}
        {/* ===================================================================== */}
        {activeTab === 'analytics' && <MasterFormsAnalyticsDashboard formData={formData} />}

        {/* ===================================================================== */}
        {/* TAB 4: PREVIEW & RESPONDER TEST RUNTIME                               */}
        {/* ===================================================================== */}
        {activeTab === 'preview' && (
          <MasterFormsPublicRenderer
            formData={formData}
            isPreview={true}
            onSubmitResponse={handleSubmitNewResponse}
          />
        )}
      </div>

      {/* ===================================================================== */}
      {/* MODALS                                                                */}
      {/* ===================================================================== */}
      <MasterFormsSettingsModal
        formData={formData}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaveSettings={(quiz, access) =>
          updateFormData((prev) => ({
            ...prev,
            quizSettings: quiz,
            accessSettings: access,
          }))
        }
      />

      <MasterFormsThemesModal
        currentTheme={formData.theme}
        isOpen={isThemesOpen}
        onClose={() => setIsThemesOpen(false)}
        onSaveTheme={(theme) => updateFormData((prev) => ({ ...prev, theme }))}
      />

      <MasterFormsTemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelectTemplate={(templateData) =>
          updateFormData((prev) => ({
            ...prev,
            ...templateData,
            title: templateData.title || prev.title,
            description: templateData.description || prev.description,
            questions: templateData.questions || prev.questions,
            sections: templateData.sections || prev.sections,
            theme: templateData.theme || prev.theme,
            quizSettings: templateData.quizSettings || prev.quizSettings,
            accessSettings: templateData.accessSettings || prev.accessSettings,
          }))
        }
      />

      <MasterFormsShareModal
        formData={formData}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />

      <MasterFormsLogicModal
        formData={formData}
        isOpen={isLogicOpen}
        onClose={() => setIsLogicOpen(false)}
        onSaveLogic={(updatedQuestions) =>
          updateFormData((prev) => ({
            ...prev,
            questions: updatedQuestions,
          }))
        }
      />
    </div>
  );
}

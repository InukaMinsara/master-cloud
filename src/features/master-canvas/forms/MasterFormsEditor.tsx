import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckSquare,
  Plus,
  Trash2,
  Copy,
  Eye,
  BarChart3,
  CheckCircle2,
  Clock,
  Star,
  Download,
  Share2,
  Send,
  HelpCircle,
} from 'lucide-react';
import { CanvasFormData, FormQuestion, FormResponse } from '@/types/canvas';
import { CanvasService } from '@/services/canvasService';
import { FileItem } from '@/types/file';
import { toast } from 'sonner';

interface MasterFormsEditorProps {
  initialFile?: FileItem | null;
  initialData?: CanvasFormData | null;
  onSave?: (data: CanvasFormData) => Promise<void>;
}

export function MasterFormsEditor({ initialFile, initialData, onSave }: MasterFormsEditorProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CanvasFormData>(() => initialData || CanvasService.getDefaultFormData());
  const [activeTab, setActiveTab] = useState<'editor' | 'responses' | 'preview'>('editor');
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, any>>({});
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const saveTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  // Debounced auto-save
  const triggerAutoSave = (updated: CanvasFormData) => {
    setSaveStatus('unsaved');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      if (onSave) {
        setSaveStatus('saving');
        try {
          await onSave(updated);
          setSaveStatus('saved');
        } catch (err) {
          setSaveStatus('unsaved');
          toast.error('Failed to save form');
        }
      }
    }, 1500);
  };

  const handleHeaderChange = (field: 'title' | 'description', value: string) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    triggerAutoSave(updated);
  };

  // Question CRUD
  const addQuestion = (type: FormQuestion['type'] = 'short-text') => {
    const newQ: FormQuestion = {
      id: 'q-' + Date.now(),
      title: 'Untitled Question',
      type,
      required: false,
      options: ['multiple-choice', 'checkbox', 'dropdown'].includes(type) ? ['Option 1', 'Option 2'] : undefined,
    };
    const updatedQuestions = [...formData.questions, newQ];
    const updated = { ...formData, questions: updatedQuestions };
    setFormData(updated);
    triggerAutoSave(updated);
    toast.success('Question added');
  };

  const updateQuestion = (qId: string, updates: Partial<FormQuestion>) => {
    const updatedQuestions = formData.questions.map(q => q.id === qId ? { ...q, ...updates } : q);
    const updated = { ...formData, questions: updatedQuestions };
    setFormData(updated);
    triggerAutoSave(updated);
  };

  const duplicateQuestion = (q: FormQuestion) => {
    const clone: FormQuestion = {
      ...q,
      id: 'q-' + Date.now(),
      title: `${q.title} (Copy)`,
    };
    const updatedQuestions = [...formData.questions, clone];
    const updated = { ...formData, questions: updatedQuestions };
    setFormData(updated);
    triggerAutoSave(updated);
  };

  const deleteQuestion = (qId: string) => {
    if (formData.questions.length <= 1) {
      toast.warning('A form must have at least one question.');
      return;
    }
    const updatedQuestions = formData.questions.filter(q => q.id !== qId);
    const updated = { ...formData, questions: updatedQuestions };
    setFormData(updated);
    triggerAutoSave(updated);
  };

  // Option management for choice questions
  const addOption = (qId: string) => {
    const q = formData.questions.find(item => item.id === qId);
    if (!q || !q.options) return;
    const newOptions = [...q.options, `Option ${q.options.length + 1}`];
    updateQuestion(qId, { options: newOptions });
  };

  const updateOptionText = (qId: string, index: number, text: string) => {
    const q = formData.questions.find(item => item.id === qId);
    if (!q || !q.options) return;
    const newOptions = [...q.options];
    newOptions[index] = text;
    updateQuestion(qId, { options: newOptions });
  };

  const removeOption = (qId: string, index: number) => {
    const q = formData.questions.find(item => item.id === qId);
    if (!q || !q.options || q.options.length <= 1) return;
    const newOptions = q.options.filter((_, i) => i !== index);
    updateQuestion(qId, { options: newOptions });
  };

  // Preview form submit simulation
  const handlePreviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newResponse: FormResponse = {
      id: 'resp-' + Date.now(),
      submittedAt: new Date().toISOString(),
      answers: { ...previewAnswers },
    };
    const updated = {
      ...formData,
      responses: [newResponse, ...formData.responses],
    };
    setFormData(updated);
    triggerAutoSave(updated);
    setPreviewAnswers({});
    toast.success('Response recorded successfully!');
    setActiveTab('responses');
  };

  // Export responses to CSV
  const exportResponsesCSV = () => {
    if (formData.responses.length === 0) {
      toast.info('No responses yet to export.');
      return;
    }
    const headers = ['Submitted At', ...formData.questions.map(q => `"${q.title.replace(/"/g, '""')}"`)];
    const rows = formData.responses.map(resp => {
      const row = [resp.submittedAt];
      formData.questions.forEach(q => {
        const ans = resp.answers[q.id];
        const valStr = Array.isArray(ans) ? ans.join('; ') : String(ans ?? '');
        row.push(`"${valStr.replace(/"/g, '""')}"`);
      });
      return row.join(',');
    });
    const csvContent = [headers.join(','), ...rows].join('\n');
    CanvasService.exportToLocalFile(`${formData.title}_responses.csv`, csvContent, 'text/csv');
    toast.success('Responses exported as CSV');
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground select-none">
      {/* Top Header */}
      <header className="h-14 border-b border-border/60 px-4 flex items-center justify-between bg-card/40 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/canvas')}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="Back to Master Canvas"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-500">
              <CheckSquare className="h-4 w-4" />
            </div>
            <div>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleHeaderChange('title', e.target.value)}
                className="font-bold text-sm bg-transparent border-b border-transparent hover:border-border/60 focus:border-primary focus:outline-none px-1 py-0.5 max-w-xs transition-colors"
                placeholder="Untitled Form"
              />
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground px-1">
                {saveStatus === 'saving' && (
                  <span className="flex items-center gap-1 text-amber-500">
                    <Clock className="h-3 w-3 animate-spin" /> Saving to Master Cloud...
                  </span>
                )}
                {saveStatus === 'saved' && (
                  <span className="flex items-center gap-1 text-emerald-500">
                    <CheckCircle2 className="h-3 w-3" /> All changes saved in Master Cloud
                  </span>
                )}
                {saveStatus === 'unsaved' && (
                  <span className="flex items-center gap-1 text-muted-foreground">Unsaved edits</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation & Mode */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'editor' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Questions ({formData.questions.length})
            </button>
            <button
              onClick={() => setActiveTab('responses')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'responses' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Responses ({formData.responses.length})
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
                activeTab === 'preview' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Eye className="h-3 w-3" />
              <span>Preview & Test</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-secondary/15 p-4 sm:p-8 flex justify-center">
        {/* TAB 1: FORM QUESTIONS DESIGNER */}
        {activeTab === 'editor' && (
          <div className="w-full max-w-2xl space-y-4">
            {/* Header Card */}
            <div className="bg-card border-t-4 border-t-purple-500 border border-border/70 rounded-2xl p-6 shadow-md space-y-3">
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleHeaderChange('title', e.target.value)}
                className="w-full text-2xl font-bold bg-transparent border-b border-transparent focus:border-primary focus:outline-none py-1"
                placeholder="Form Title"
              />
              <textarea
                value={formData.description}
                onChange={(e) => handleHeaderChange('description', e.target.value)}
                rows={2}
                className="w-full text-sm text-muted-foreground bg-transparent border-none outline-none resize-none"
                placeholder="Form description or instructions for respondents..."
              />
            </div>

            {/* Questions List */}
            {formData.questions.map((q, idx) => (
              <div
                key={q.id}
                className="bg-card border border-border/70 rounded-2xl p-6 shadow-sm space-y-4 transition-all hover:border-purple-500/50"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="font-bold text-xs text-muted-foreground">Q{idx + 1}.</span>
                    <input
                      type="text"
                      value={q.title}
                      onChange={(e) => updateQuestion(q.id, { title: e.target.value })}
                      className="font-semibold text-sm bg-transparent border-b border-border/50 focus:border-primary focus:outline-none flex-1 py-0.5"
                      placeholder="Question text..."
                    />
                  </div>

                  {/* Question Type Selector */}
                  <select
                    value={q.type}
                    onChange={(e) => updateQuestion(q.id, {
                      type: e.target.value as FormQuestion['type'],
                      options: ['multiple-choice', 'checkbox', 'dropdown'].includes(e.target.value) ? (q.options || ['Option 1', 'Option 2']) : undefined,
                    })}
                    className="bg-muted text-xs font-medium rounded-lg px-2.5 py-1.5 border border-border/60 focus:outline-none focus:border-primary"
                  >
                    <option value="short-text">Short Answer</option>
                    <option value="paragraph">Paragraph</option>
                    <option value="multiple-choice">Multiple Choice</option>
                    <option value="checkbox">Checkboxes</option>
                    <option value="dropdown">Dropdown</option>
                    <option value="rating">Rating (1-5 Stars)</option>
                  </select>
                </div>

                {/* Question Type Specific Body */}
                {['multiple-choice', 'checkbox', 'dropdown'].includes(q.type) && (
                  <div className="space-y-2 pt-2">
                    {q.options?.map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/40 shrink-0" />
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => updateOptionText(q.id, optIdx, e.target.value)}
                          className="text-xs bg-transparent border-b border-border/40 focus:border-primary focus:outline-none flex-1 py-0.5"
                        />
                        {q.options && q.options.length > 1 && (
                          <button
                            onClick={() => removeOption(q.id, optIdx)}
                            className="text-muted-foreground hover:text-destructive p-1"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => addOption(q.id)}
                      className="text-xs text-primary hover:underline font-semibold pt-1"
                    >
                      + Add Option
                    </button>
                  </div>
                )}

                {q.type === 'rating' && (
                  <div className="flex items-center gap-1.5 py-2 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-amber-500/20" />
                    ))}
                    <span className="text-xs text-muted-foreground ml-2">1 to 5 Stars</span>
                  </div>
                )}

                {/* Question Card Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={q.required}
                      onChange={(e) => updateQuestion(q.id, { required: e.target.checked })}
                      className="rounded border-border text-primary focus:ring-0"
                    />
                    <span className="text-muted-foreground">Required</span>
                  </label>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <button onClick={() => duplicateQuestion(q)} className="hover:text-foreground p-1" title="Duplicate">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => deleteQuestion(q.id)} className="hover:text-destructive p-1" title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Add Question Button */}
            <button
              onClick={() => addQuestion('short-text')}
              className="w-full py-3 rounded-2xl border-2 border-dashed border-border/80 hover:border-purple-500 hover:bg-purple-500/5 text-xs font-bold text-muted-foreground hover:text-purple-500 flex items-center justify-center gap-2 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Add Question</span>
            </button>
          </div>
        )}

        {/* TAB 2: RESPONSES ANALYTICS */}
        {activeTab === 'responses' && (
          <div className="w-full max-w-3xl space-y-6">
            <div className="bg-card border border-border/70 rounded-2xl p-6 shadow-md flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{formData.responses.length} Responses</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  All survey submissions are stored securely in Master Cloud.
                </p>
              </div>
              <button
                onClick={exportResponsesCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 hover:bg-accent text-xs font-semibold transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export CSV</span>
              </button>
            </div>

            {formData.responses.length === 0 ? (
              <div className="text-center py-16 bg-card rounded-2xl border border-border/60 p-8 space-y-3">
                <BarChart3 className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                <p className="text-sm font-semibold">No responses recorded yet</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Click the "Preview & Test" tab above to fill out and submit a response.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.responses.map((resp, i) => (
                  <div key={resp.id} className="bg-card border border-border/70 rounded-2xl p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/50 pb-2">
                      <span className="font-bold text-foreground">Response #{formData.responses.length - i}</span>
                      <span>{new Date(resp.submittedAt).toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {formData.questions.map((q) => (
                        <div key={q.id} className="space-y-0.5">
                          <p className="font-semibold text-muted-foreground">{q.title}</p>
                          <p className="font-medium text-foreground">
                            {Array.isArray(resp.answers[q.id])
                              ? resp.answers[q.id].join(', ')
                              : String(resp.answers[q.id] || '—')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PREVIEW & RESPOND MODE */}
        {activeTab === 'preview' && (
          <form onSubmit={handlePreviewSubmit} className="w-full max-w-xl space-y-4">
            <div className="bg-card border-t-4 border-t-purple-500 border border-border/70 rounded-2xl p-6 shadow-md space-y-2">
              <h1 className="text-2xl font-bold">{formData.title}</h1>
              <p className="text-xs text-muted-foreground">{formData.description}</p>
            </div>

            {formData.questions.map((q, idx) => (
              <div key={q.id} className="bg-card border border-border/70 rounded-2xl p-6 shadow-sm space-y-3">
                <label className="block text-sm font-bold text-foreground">
                  {idx + 1}. {q.title} {q.required && <span className="text-destructive">*</span>}
                </label>

                {q.type === 'short-text' && (
                  <input
                    type="text"
                    required={q.required}
                    value={previewAnswers[q.id] || ''}
                    onChange={(e) => setPreviewAnswers({ ...previewAnswers, [q.id]: e.target.value })}
                    className="w-full bg-background border border-border/70 rounded-xl px-3 py-2 text-xs focus:border-primary focus:outline-none"
                    placeholder="Your answer"
                  />
                )}

                {q.type === 'paragraph' && (
                  <textarea
                    rows={3}
                    required={q.required}
                    value={previewAnswers[q.id] || ''}
                    onChange={(e) => setPreviewAnswers({ ...previewAnswers, [q.id]: e.target.value })}
                    className="w-full bg-background border border-border/70 rounded-xl px-3 py-2 text-xs focus:border-primary focus:outline-none resize-none"
                    placeholder="Your answer"
                  />
                )}

                {q.type === 'multiple-choice' && (
                  <div className="space-y-2">
                    {q.options?.map((opt, oIdx) => (
                      <label key={oIdx} className="flex items-center gap-2.5 text-xs cursor-pointer">
                        <input
                          type="radio"
                          name={q.id}
                          required={q.required}
                          value={opt}
                          checked={previewAnswers[q.id] === opt}
                          onChange={(e) => setPreviewAnswers({ ...previewAnswers, [q.id]: e.target.value })}
                          className="text-primary focus:ring-0"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {q.type === 'checkbox' && (
                  <div className="space-y-2">
                    {q.options?.map((opt, oIdx) => {
                      const selected: string[] = previewAnswers[q.id] || [];
                      const isChecked = selected.includes(opt);
                      return (
                        <label key={oIdx} className="flex items-center gap-2.5 text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const updated = e.target.checked
                                ? [...selected, opt]
                                : selected.filter(x => x !== opt);
                              setPreviewAnswers({ ...previewAnswers, [q.id]: updated });
                            }}
                            className="rounded text-primary focus:ring-0"
                          />
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {q.type === 'dropdown' && (
                  <select
                    required={q.required}
                    value={previewAnswers[q.id] || ''}
                    onChange={(e) => setPreviewAnswers({ ...previewAnswers, [q.id]: e.target.value })}
                    className="w-full bg-background border border-border/70 rounded-xl px-3 py-2 text-xs focus:border-primary focus:outline-none"
                  >
                    <option value="">Select an option...</option>
                    {q.options?.map((opt, oIdx) => (
                      <option key={oIdx} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}

                {q.type === 'rating' && (
                  <div className="flex items-center gap-2 text-amber-500">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        type="button"
                        key={val}
                        onClick={() => setPreviewAnswers({ ...previewAnswers, [q.id]: val })}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            (previewAnswers[q.id] || 0) >= val
                              ? 'fill-amber-500 text-amber-500'
                              : 'text-muted-foreground/30'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-colors"
            >
              <Send className="h-4 w-4" />
              <span>Submit Response</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

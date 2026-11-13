import React, { useState } from 'react';
import {
  Trash2,
  Copy,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Plus,
  X,
  Star,
  CheckCircle2,
  HelpCircle,
  Upload,
  AlignLeft,
  List,
  CheckSquare,
  FileText,
  Calendar,
  Hash,
  Mail,
  Phone,
  Link,
  Sliders,
  Sparkles,
  Award,
  Grid,
  PenTool,
  ArrowUpDown,
  Image as ImageIcon,
  Video,
} from 'lucide-react';
import { MasterFormQuestion, QuestionType, ChoiceOption, FormQuizSettings } from '../types';

interface MasterFormsQuestionCardProps {
  question: MasterFormQuestion;
  index: number;
  totalQuestions: number;
  isQuiz: boolean;
  onUpdate: (updates: Partial<MasterFormQuestion>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onOpenLogic?: () => void;
}

const QUESTION_TYPES: Array<{ type: QuestionType; label: string; icon: any; category: string }> = [
  { type: 'short-text', label: 'Short Answer', icon: AlignLeft, category: 'Standard' },
  { type: 'paragraph', label: 'Paragraph', icon: FileText, category: 'Standard' },
  { type: 'multiple-choice', label: 'Multiple Choice', icon: CheckCircle2, category: 'Choices' },
  { type: 'checkbox', label: 'Checkboxes', icon: CheckSquare, category: 'Choices' },
  { type: 'dropdown', label: 'Dropdown List', icon: List, category: 'Choices' },
  { type: 'rating', label: 'Star Rating', icon: Star, category: 'Rating & Scale' },
  { type: 'linear-scale', label: 'Linear Scale', icon: Sliders, category: 'Rating & Scale' },
  { type: 'nps', label: 'Net Promoter Score (NPS)', icon: Award, category: 'Rating & Scale' },
  { type: 'likert-grid', label: 'Multiple Choice Grid', icon: Grid, category: 'Grid Matrix' },
  { type: 'checkbox-grid', label: 'Checkbox Grid', icon: Grid, category: 'Grid Matrix' },
  { type: 'file-upload', label: 'File Upload (Cloud)', icon: Upload, category: 'Advanced' },
  { type: 'date', label: 'Date Picker', icon: Calendar, category: 'Advanced' },
  { type: 'email', label: 'Email Address', icon: Mail, category: 'Contact' },
  { type: 'phone', label: 'Phone Number', icon: Phone, category: 'Contact' },
  { type: 'number', label: 'Number / Amount', icon: Hash, category: 'Advanced' },
  { type: 'url', label: 'Website URL', icon: Link, category: 'Contact' },
  { type: 'signature', label: 'Digital Signature', icon: PenTool, category: 'Advanced' },
  { type: 'ranking', label: 'Ranking / Ordering', icon: ArrowUpDown, category: 'Choices' },
  { type: 'section-header', label: 'Section Title Block', icon: FileText, category: 'Media & Layout' },
  { type: 'image-block', label: 'Image Showcase', icon: ImageIcon, category: 'Media & Layout' },
];

export function MasterFormsQuestionCard({
  question,
  index,
  totalQuestions,
  isQuiz,
  onUpdate,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onOpenLogic,
}: MasterFormsQuestionCardProps) {
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [showDescription, setShowDescription] = useState(Boolean(question.description));

  // Option CRUD
  const handleAddOption = () => {
    const currentOptions = question.options || [];
    const newOption: ChoiceOption = {
      id: 'opt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      label: `Option ${currentOptions.length + 1}`,
    };
    onUpdate({ options: [...currentOptions, newOption] });
  };

  const handleUpdateOption = (optId: string, label: string) => {
    const updated = (question.options || []).map(opt =>
      opt.id === optId ? { ...opt, label } : opt
    );
    onUpdate({ options: updated });
  };

  const handleRemoveOption = (optId: string) => {
    if ((question.options || []).length <= 1) return;
    const updated = (question.options || []).filter(opt => opt.id !== optId);
    // Also remove from correct answers if present
    const updatedCorrect = (question.correctAnswers || []).filter(id => id !== optId);
    onUpdate({ options: updated, correctAnswers: updatedCorrect });
  };

  const handleToggleCorrectOption = (optId: string) => {
    const current = question.correctAnswers || [];
    if (question.type === 'multiple-choice' || question.type === 'dropdown') {
      onUpdate({ correctAnswers: [optId] });
    } else {
      // Multiple correct for checkbox
      if (current.includes(optId)) {
        onUpdate({ correctAnswers: current.filter(id => id !== optId) });
      } else {
        onUpdate({ correctAnswers: [...current, optId] });
      }
    }
  };

  // Grid Rows & Columns CRUD
  const handleAddGridRow = () => {
    const rows = question.gridRows || [];
    const newRow = { id: 'row-' + Date.now(), label: `Row ${rows.length + 1}` };
    onUpdate({ gridRows: [...rows, newRow] });
  };

  const handleUpdateGridRow = (id: string, label: string) => {
    const rows = (question.gridRows || []).map(r => (r.id === id ? { ...r, label } : r));
    onUpdate({ gridRows: rows });
  };

  const handleRemoveGridRow = (id: string) => {
    const rows = (question.gridRows || []).filter(r => r.id !== id);
    onUpdate({ gridRows: rows });
  };

  const handleAddGridColumn = () => {
    const cols = question.gridColumns || [];
    const newCol = { id: 'col-' + Date.now(), label: `Column ${cols.length + 1}` };
    onUpdate({ gridColumns: [...cols, newCol] });
  };

  const handleUpdateGridColumn = (id: string, label: string) => {
    const cols = (question.gridColumns || []).map(c => (c.id === id ? { ...c, label } : c));
    onUpdate({ gridColumns: cols });
  };

  const handleRemoveGridColumn = (id: string) => {
    const cols = (question.gridColumns || []).filter(c => c.id !== id);
    onUpdate({ gridColumns: cols });
  };

  return (
    <div className="group relative bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-sm transition-all hover:border-primary/50 hover:shadow-md space-y-4">
      {/* Header: Drag handle, Q Number, Title, Type selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex items-center text-muted-foreground/50 hover:text-muted-foreground cursor-grab shrink-0">
            <GripVertical className="h-4 w-4" />
          </div>

          <span className="font-bold text-xs text-muted-foreground shrink-0">
            Q{index + 1}.
          </span>

          <input
            type="text"
            value={question.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Type your question or statement..."
            className="w-full font-semibold text-sm bg-transparent border-b border-border/40 focus:border-primary focus:outline-none py-1 transition-colors text-foreground"
          />
        </div>

        {/* Question Type Picker */}
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={question.type}
            onChange={(e) => {
              const newType = e.target.value as QuestionType;
              const updates: Partial<MasterFormQuestion> = { type: newType };

              if (['multiple-choice', 'checkbox', 'dropdown', 'ranking'].includes(newType) && (!question.options || question.options.length === 0)) {
                updates.options = [
                  { id: 'opt-1', label: 'Option 1' },
                  { id: 'opt-2', label: 'Option 2' },
                ];
              }

              if (['likert-grid', 'checkbox-grid'].includes(newType)) {
                if (!question.gridRows || question.gridRows.length === 0) {
                  updates.gridRows = [
                    { id: 'r-1', label: 'Row 1' },
                    { id: 'r-2', label: 'Row 2' },
                  ];
                }
                if (!question.gridColumns || question.gridColumns.length === 0) {
                  updates.gridColumns = [
                    { id: 'c-1', label: 'Strongly Disagree' },
                    { id: 'c-2', label: 'Neutral' },
                    { id: 'c-3', label: 'Strongly Agree' },
                  ];
                }
              }

              if (newType === 'rating') {
                updates.scaleMin = 1;
                updates.scaleMax = 5;
              }

              if (newType === 'linear-scale') {
                updates.scaleMin = 1;
                updates.scaleMax = 10;
                updates.scaleMinLabel = 'Low';
                updates.scaleMaxLabel = 'High';
              }

              if (newType === 'nps') {
                updates.scaleMin = 0;
                updates.scaleMax = 10;
                updates.scaleMinLabel = 'Not likely';
                updates.scaleMaxLabel = 'Extremely likely';
              }

              onUpdate(updates);
            }}
            className="bg-muted/70 hover:bg-muted text-xs font-semibold rounded-xl px-3 py-1.5 border border-border/60 focus:outline-none focus:border-primary cursor-pointer text-foreground"
          >
            {QUESTION_TYPES.map((t) => (
              <option key={t.type} value={t.type}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Optional Description / Instructions */}
      {showDescription ? (
        <div className="relative">
          <input
            type="text"
            value={question.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Add a helpful description, hint, or instructions..."
            className="w-full text-xs text-muted-foreground bg-muted/30 border border-border/40 rounded-lg px-3 py-1.5 focus:border-primary focus:outline-none"
          />
          <button
            onClick={() => {
              setShowDescription(false);
              onUpdate({ description: '' });
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive"
            title="Remove description"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowDescription(true)}
          className="text-[11px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
        >
          <Plus className="h-3 w-3" /> Add question description
        </button>
      )}

      {/* QUESTION BODY (Type-specific Editor) */}
      <div className="pt-2">
        {/* Short Text / Email / Phone / URL / Number */}
        {['short-text', 'email', 'phone', 'url', 'number'].includes(question.type) && (
          <div className="bg-muted/20 border border-dashed border-border/60 rounded-xl p-3 text-xs text-muted-foreground flex items-center gap-2">
            <AlignLeft className="h-4 w-4 text-muted-foreground/60" />
            <span>
              Respondent will type a single line answer (Format: {question.type})
            </span>
          </div>
        )}

        {/* Paragraph */}
        {question.type === 'paragraph' && (
          <div className="bg-muted/20 border border-dashed border-border/60 rounded-xl p-3 text-xs text-muted-foreground flex items-start gap-2">
            <FileText className="h-4 w-4 text-muted-foreground/60 mt-0.5" />
            <span>Respondent will type a multi-line long response</span>
          </div>
        )}

        {/* Multiple Choice, Checkboxes, Dropdown, Ranking */}
        {['multiple-choice', 'checkbox', 'dropdown', 'ranking'].includes(question.type) && (
          <div className="space-y-2.5">
            {question.options?.map((opt, optIdx) => (
              <div key={opt.id} className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full border border-muted-foreground/40 flex items-center justify-center shrink-0">
                  {question.type === 'checkbox' && <div className="h-2 w-2 bg-muted-foreground/40 rounded-sm" />}
                  {question.type === 'ranking' && <span className="text-[10px] font-bold text-muted-foreground">{optIdx + 1}</span>}
                </div>

                <input
                  type="text"
                  value={opt.label}
                  onChange={(e) => handleUpdateOption(opt.id, e.target.value)}
                  className="text-xs bg-transparent border-b border-border/40 focus:border-primary focus:outline-none flex-1 py-1 text-foreground"
                  placeholder={`Option ${optIdx + 1}`}
                />

                {/* Quiz Mode Answer Key Indicator */}
                {isQuiz && (
                  <button
                    onClick={() => handleToggleCorrectOption(opt.id)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                      question.correctAnswers?.includes(opt.id)
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-muted/50 text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-500'
                    }`}
                    title="Toggle Correct Answer"
                  >
                    {question.correctAnswers?.includes(opt.id) ? '✓ Correct Answer' : 'Mark Correct'}
                  </button>
                )}

                {question.options && question.options.length > 1 && (
                  <button
                    onClick={() => handleRemoveOption(opt.id)}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleAddOption}
                className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Add Option
              </button>

              {!question.allowOther && (
                <button
                  onClick={() => onUpdate({ allowOther: true })}
                  className="text-xs text-muted-foreground hover:text-foreground font-medium"
                >
                  or add "Other" write-in
                </button>
              )}
            </div>
          </div>
        )}

        {/* Rating (Stars) */}
        {question.type === 'rating' && (
          <div className="flex items-center gap-2 py-2">
            <div className="flex items-center gap-1 text-amber-500">
              {Array.from({ length: question.scaleMax || 5 }).map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-amber-500/20" />
              ))}
            </div>
            <div className="flex items-center gap-2 ml-4 text-xs text-muted-foreground">
              <span>Max Stars:</span>
              <select
                value={question.scaleMax || 5}
                onChange={(e) => onUpdate({ scaleMax: Number(e.target.value) })}
                className="bg-muted px-2 py-1 rounded border border-border/60 text-xs font-semibold"
              >
                <option value={3}>3 Stars</option>
                <option value={5}>5 Stars</option>
                <option value={10}>10 Stars</option>
              </select>
            </div>
          </div>
        )}

        {/* Linear Scale & NPS */}
        {['linear-scale', 'nps'].includes(question.type) && (
          <div className="space-y-3 py-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Scale Range:</span>
              <span className="font-bold">{question.scaleMin ?? 0}</span>
              <span className="text-muted-foreground">to</span>
              <span className="font-bold">{question.scaleMax ?? 10}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <input
                type="text"
                value={question.scaleMinLabel || ''}
                onChange={(e) => onUpdate({ scaleMinLabel: e.target.value })}
                placeholder="Lowest label (e.g. Strongly Disagree)"
                className="bg-muted/40 border border-border/50 rounded-lg px-3 py-1.5 focus:border-primary focus:outline-none"
              />
              <input
                type="text"
                value={question.scaleMaxLabel || ''}
                onChange={(e) => onUpdate({ scaleMaxLabel: e.target.value })}
                placeholder="Highest label (e.g. Strongly Agree)"
                className="bg-muted/40 border border-border/50 rounded-lg px-3 py-1.5 focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Grids (Likert Grid & Checkbox Grid) */}
        {['likert-grid', 'checkbox-grid'].includes(question.type) && (
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Rows */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Rows (Questions)
                </p>
                {question.gridRows?.map((row, rIdx) => (
                  <div key={row.id} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{rIdx + 1}.</span>
                    <input
                      type="text"
                      value={row.label}
                      onChange={(e) => handleUpdateGridRow(row.id, e.target.value)}
                      className="text-xs bg-transparent border-b border-border/40 focus:border-primary focus:outline-none flex-1 py-0.5"
                    />
                    {question.gridRows && question.gridRows.length > 1 && (
                      <button onClick={() => handleRemoveGridRow(row.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={handleAddGridRow}
                  className="text-xs text-primary font-semibold flex items-center gap-1 pt-1"
                >
                  <Plus className="h-3 w-3" /> Add Row
                </button>
              </div>

              {/* Columns */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Columns (Scale Options)
                </p>
                {question.gridColumns?.map((col) => (
                  <div key={col.id} className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full border border-muted-foreground/50 shrink-0" />
                    <input
                      type="text"
                      value={col.label}
                      onChange={(e) => handleUpdateGridColumn(col.id, e.target.value)}
                      className="text-xs bg-transparent border-b border-border/40 focus:border-primary focus:outline-none flex-1 py-0.5"
                    />
                    {question.gridColumns && question.gridColumns.length > 1 && (
                      <button onClick={() => handleRemoveGridColumn(col.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={handleAddGridColumn}
                  className="text-xs text-primary font-semibold flex items-center gap-1 pt-1"
                >
                  <Plus className="h-3 w-3" /> Add Column
                </button>
              </div>
            </div>
          </div>
        )}

        {/* File Upload Configuration */}
        {question.type === 'file-upload' && (
          <div className="bg-muted/30 border border-border/60 rounded-xl p-4 space-y-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <Upload className="h-4 w-4 text-primary" />
              <span>Cloud File Storage Settings (Master Cloud 10 TB)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">Max File Size</label>
                <select
                  value={question.maxFileSizeMB || 10}
                  onChange={(e) => onUpdate({ maxFileSizeMB: Number(e.target.value) })}
                  className="bg-background border border-border/60 rounded-lg px-2.5 py-1 text-xs w-full"
                >
                  <option value={10}>10 MB</option>
                  <option value={50}>50 MB</option>
                  <option value={100}>100 MB</option>
                  <option value={1024}>1 GB (Master Cloud High Speed)</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">Max Files Allowed</label>
                <select
                  value={question.maxFileCount || 1}
                  onChange={(e) => onUpdate({ maxFileCount: Number(e.target.value) })}
                  className="bg-background border border-border/60 rounded-lg px-2.5 py-1 text-xs w-full"
                >
                  <option value={1}>1 File</option>
                  <option value={5}>5 Files</option>
                  <option value={10}>10 Files</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Media Block / Image Showcase */}
        {question.type === 'image-block' && (
          <div className="space-y-2">
            <input
              type="text"
              value={question.mediaUrl || ''}
              onChange={(e) => onUpdate({ mediaUrl: e.target.value })}
              placeholder="Paste Image URL or Master Cloud link (e.g. https://...)"
              className="w-full text-xs bg-muted/30 border border-border/50 rounded-lg px-3 py-2 focus:border-primary focus:outline-none"
            />
            {question.mediaUrl && (
              <div className="max-h-48 overflow-hidden rounded-xl border border-border/50">
                <img src={question.mediaUrl} alt="Preview" className="w-full object-cover" />
              </div>
            )}
          </div>
        )}

        {/* Digital Signature */}
        {question.type === 'signature' && (
          <div className="bg-muted/20 border border-dashed border-border/60 rounded-xl p-3 text-xs text-muted-foreground flex items-center gap-2">
            <PenTool className="h-4 w-4 text-muted-foreground/60" />
            <span>Respondent will draw their digital e-signature in canvas box.</span>
          </div>
        )}
      </div>

      {/* Answer Key & Feedback Studio (Quiz Mode) */}
      {isQuiz && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
              <Award className="h-4 w-4" />
              <span>Quiz Grading & Feedback</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground font-semibold">Points:</span>
              <input
                type="number"
                min={0}
                value={question.points ?? 10}
                onChange={(e) => onUpdate({ points: Number(e.target.value) })}
                className="w-16 bg-background border border-border/60 rounded-lg px-2 py-0.5 text-xs font-bold text-center"
              />
            </div>
          </div>

          {/* Correct answer text field for short-text */}
          {question.type === 'short-text' && (
            <div className="space-y-1 pt-1">
              <label className="text-[11px] font-semibold text-muted-foreground">
                Accepted Exact Correct Answers (comma-separated):
              </label>
              <input
                type="text"
                value={(question.correctAnswers || []).join(', ')}
                onChange={(e) =>
                  onUpdate({
                    correctAnswers: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="e.g. 443, port 443"
                className="w-full text-xs bg-background border border-border/60 rounded-lg px-2.5 py-1.5 focus:border-primary focus:outline-none"
              />
            </div>
          )}

          {/* Answer explanation */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground">
              Explanation & Rational Feedback (Shown after test):
            </label>
            <input
              type="text"
              value={question.explanation || ''}
              onChange={(e) => onUpdate({ explanation: e.target.value })}
              placeholder="Why this answer is correct..."
              className="w-full text-xs bg-background border border-border/60 rounded-lg px-2.5 py-1.5 focus:border-primary focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Footer Controls: Move Up/Down, Required toggle, Duplicate, Delete */}
      <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-20"
            title="Move Question Up"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === totalQuestions - 1}
            className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-20"
            title="Move Question Down"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={question.required}
              onChange={(e) => onUpdate({ required: e.target.checked })}
              className="rounded border-border text-primary focus:ring-0"
            />
            <span className="font-semibold text-muted-foreground">Required</span>
          </label>

          <div className="h-4 w-[1px] bg-border/60" />

          <div className="flex items-center gap-1">
            <button
              onClick={onDuplicate}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Duplicate Question"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              title="Delete Question"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

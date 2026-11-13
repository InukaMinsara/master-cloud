import React, { useState } from 'react';
import { GitBranch, X, Plus, Trash2, ArrowRight, ShieldAlert, Check } from 'lucide-react';
import { MasterFormData, MasterFormQuestion, ConditionalLogicRule, LogicOperator, LogicAction } from '../types';
import { toast } from 'sonner';

interface MasterFormsLogicModalProps {
  formData: MasterFormData;
  isOpen: boolean;
  onClose: () => void;
  onSaveLogic: (updatedQuestions: MasterFormQuestion[]) => void;
}

export function MasterFormsLogicModal({
  formData,
  isOpen,
  onClose,
  onSaveLogic,
}: MasterFormsLogicModalProps) {
  const [questions, setQuestions] = useState(formData.questions);

  if (!isOpen) return null;

  const choiceQuestions = questions.filter(
    (q) => !['section-header', 'image-block', 'video-block'].includes(q.type)
  );

  const handleAddRule = (questionId: string) => {
    const q = questions.find((item) => item.id === questionId);
    if (!q) return;

    const newRule: ConditionalLogicRule = {
      id: 'rule-' + Date.now(),
      sourceQuestionId: questionId,
      operator: 'equals',
      value: q.options?.[0]?.id || '',
      action: 'jump_to_section',
      targetId: formData.sections?.[0]?.id || '',
    };

    const updated = questions.map((item) =>
      item.id === questionId
        ? { ...item, logicRules: [...(item.logicRules || []), newRule] }
        : item
    );
    setQuestions(updated);
  };

  const handleUpdateRule = (
    questionId: string,
    ruleId: string,
    updates: Partial<ConditionalLogicRule>
  ) => {
    const updated = questions.map((item) => {
      if (item.id !== questionId) return item;
      const updatedRules = (item.logicRules || []).map((r) =>
        r.id === ruleId ? { ...r, ...updates } : r
      );
      return { ...item, logicRules: updatedRules };
    });
    setQuestions(updated);
  };

  const handleRemoveRule = (questionId: string, ruleId: string) => {
    const updated = questions.map((item) => {
      if (item.id !== questionId) return item;
      const updatedRules = (item.logicRules || []).filter((r) => r.id !== ruleId);
      return { ...item, logicRules: updatedRules };
    });
    setQuestions(updated);
  };

  const handleSave = () => {
    onSaveLogic(questions);
    toast.success('Conditional logic rules updated successfully');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-card border border-border/80 rounded-3xl max-w-3xl w-full p-6 max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <GitBranch className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Conditional Logic & Branching</h2>
              <p className="text-xs text-muted-foreground">
                Route respondents to specific sections or show/hide questions based on their answers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-1 text-xs">
          {choiceQuestions.map((q, idx) => {
            const rules = q.logicRules || [];
            return (
              <div
                key={q.id}
                className="bg-muted/20 border border-border/60 rounded-2xl p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground">
                    Q{idx + 1}. {q.title}
                  </span>
                  <button
                    onClick={() => handleAddRule(q.id)}
                    className="px-3 py-1 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Rule</span>
                  </button>
                </div>

                {rules.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    No conditional logic configured for this question.
                  </p>
                ) : (
                  <div className="space-y-3 pt-1">
                    {rules.map((rule, rIdx) => (
                      <div
                        key={rule.id}
                        className="bg-card border border-border/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center gap-2 text-xs shadow-sm"
                      >
                        <span className="font-bold text-muted-foreground shrink-0">IF Answer</span>

                        {/* Operator */}
                        <select
                          value={rule.operator}
                          onChange={(e) =>
                            handleUpdateRule(q.id, rule.id, {
                              operator: e.target.value as LogicOperator,
                            })
                          }
                          className="bg-muted px-2 py-1 rounded-lg border border-border/60 font-semibold"
                        >
                          <option value="equals">is equal to</option>
                          <option value="not_equals">is not equal to</option>
                          <option value="contains">contains</option>
                          <option value="is_answered">is answered</option>
                          <option value="is_not_answered">is not answered</option>
                        </select>

                        {/* Value Input / Choice Option */}
                        {q.options && q.options.length > 0 ? (
                          <select
                            value={String(rule.value)}
                            onChange={(e) =>
                              handleUpdateRule(q.id, rule.id, { value: e.target.value })
                            }
                            className="bg-muted px-2 py-1 rounded-lg border border-border/60 font-medium flex-1 min-w-[120px]"
                          >
                            {q.options.map((opt) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={String(rule.value || '')}
                            onChange={(e) =>
                              handleUpdateRule(q.id, rule.id, { value: e.target.value })
                            }
                            placeholder="Value..."
                            className="bg-muted px-2 py-1 rounded-lg border border-border/60 flex-1 min-w-[100px]"
                          />
                        )}

                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 hidden sm:inline" />

                        {/* Action */}
                        <select
                          value={rule.action}
                          onChange={(e) =>
                            handleUpdateRule(q.id, rule.id, {
                              action: e.target.value as LogicAction,
                            })
                          }
                          className="bg-muted px-2 py-1 rounded-lg border border-border/60 font-semibold text-primary"
                        >
                          <option value="jump_to_section">Jump to Section</option>
                          <option value="skip_to_end">Submit form directly</option>
                          <option value="show_question">Show Question</option>
                          <option value="hide_question">Hide Question</option>
                        </select>

                        {/* Target selection */}
                        {rule.action === 'jump_to_section' && (
                          <select
                            value={rule.targetId || ''}
                            onChange={(e) =>
                              handleUpdateRule(q.id, rule.id, { targetId: e.target.value })
                            }
                            className="bg-muted px-2 py-1 rounded-lg border border-border/60 font-medium"
                          >
                            {formData.sections.map((s, sIdx) => (
                              <option key={s.id} value={s.id}>
                                Section {sIdx + 1}: {s.title || 'Untitled'}
                              </option>
                            ))}
                          </select>
                        )}

                        {['show_question', 'hide_question'].includes(rule.action) && (
                          <select
                            value={rule.targetId || ''}
                            onChange={(e) =>
                              handleUpdateRule(q.id, rule.id, { targetId: e.target.value })
                            }
                            className="bg-muted px-2 py-1 rounded-lg border border-border/60 font-medium"
                          >
                            {choiceQuestions
                              .filter((item) => item.id !== q.id)
                              .map((item, itemIdx) => (
                                <option key={item.id} value={item.id}>
                                  Q{itemIdx + 1}: {item.title || 'Untitled'}
                                </option>
                              ))}
                          </select>
                        )}

                        <button
                          onClick={() => handleRemoveRule(q.id, rule.id)}
                          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive ml-auto"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-border/60 flex items-center justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border/80 hover:bg-muted text-xs font-semibold text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md"
          >
            Apply Logic
          </button>
        </div>
      </div>
    </div>
  );
}

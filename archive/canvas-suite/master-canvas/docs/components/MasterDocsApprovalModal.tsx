import React, { useState } from 'react';
import { X, CheckCircle, Clock, Send, Shield, UserCheck, AlertCircle, FileCheck } from 'lucide-react';
import { DocApprovalWorkflow } from '../types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

interface MasterDocsApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  approval?: DocApprovalWorkflow;
  onUpdateApproval: (workflow: DocApprovalWorkflow) => void;
}

export function MasterDocsApprovalModal({
  isOpen,
  onClose,
  approval,
  onUpdateApproval,
}: MasterDocsApprovalModalProps) {
  const { user } = useAuthStore();
  const [workflow, setWorkflow] = useState<DocApprovalWorkflow>(
    () =>
      approval || {
        status: 'draft',
        assignedReviewers: [],
        history: [
          {
            action: 'Document Created',
            user: user?.email || 'Author',
            timestamp: new Date().toISOString(),
            note: 'Initial draft initialized',
          },
        ],
      }
  );

  const [newReviewerEmail, setNewReviewerEmail] = useState('');
  const [reviewNote, setReviewNote] = useState('');

  if (!isOpen) return null;

  const handleAddReviewer = () => {
    if (!newReviewerEmail.trim()) return;
    const reviewer = {
      email: newReviewerEmail.trim(),
      name: newReviewerEmail.split('@')[0],
      status: 'pending' as const,
    };
    const updated: DocApprovalWorkflow = {
      ...workflow,
      assignedReviewers: [...workflow.assignedReviewers, reviewer],
      history: [
        ...workflow.history,
        {
          action: 'Reviewer Assigned',
          user: user?.email || 'Owner',
          timestamp: new Date().toISOString(),
          note: `Assigned ${newReviewerEmail}`,
        },
      ],
    };
    setWorkflow(updated);
    onUpdateApproval(updated);
    setNewReviewerEmail('');
    toast.success(`Assigned reviewer ${reviewer.name}`);
  };

  const handleChangeStatus = (newStatus: DocApprovalWorkflow['status']) => {
    const updated: DocApprovalWorkflow = {
      ...workflow,
      status: newStatus,
      history: [
        ...workflow.history,
        {
          action: `Status Changed to ${newStatus.toUpperCase()}`,
          user: user?.email || 'User',
          timestamp: new Date().toISOString(),
          note: reviewNote || undefined,
        },
      ],
    };
    setWorkflow(updated);
    onUpdateApproval(updated);
    setReviewNote('');
    toast.success(`Workflow status updated to "${newStatus.toUpperCase()}"`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Document Approval & Review Workflow</h2>
              <p className="text-xs text-muted-foreground">Manage sign-off stages, assign reviewers, and track audit trails</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Status Stepper */}
          <div className="rounded-xl border border-border p-4 bg-muted/20">
            <div className="text-xs font-bold text-foreground mb-3 flex items-center justify-between">
              <span>Current Status</span>
              <Badge
                className={`uppercase text-[10px] font-black ${
                  workflow.status === 'approved'
                    ? 'bg-emerald-500 text-white'
                    : workflow.status === 'published'
                    ? 'bg-blue-600 text-white'
                    : workflow.status === 'review'
                    ? 'bg-amber-500 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {workflow.status}
              </Badge>
            </div>

            <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] font-semibold">
              {(['draft', 'review', 'revision', 'approved', 'published'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => handleChangeStatus(st)}
                  className={`p-2 rounded-lg capitalize border transition-all ${
                    workflow.status === st
                      ? 'bg-primary text-primary-foreground border-primary font-bold shadow-xs'
                      : 'bg-background text-muted-foreground border-border hover:bg-accent hover:text-foreground'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Reviewers Management */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-foreground">Assigned Reviewers</div>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="colleague@mastercloud.io"
                value={newReviewerEmail}
                onChange={(e) => setNewReviewerEmail(e.target.value)}
                className="flex-1 text-xs rounded-xl bg-background border border-border px-3 py-2 focus:ring-1 focus:ring-primary focus:outline-none"
              />
              <Button size="sm" variant="gradient" onClick={handleAddReviewer} className="rounded-xl text-xs font-bold">
                Assign
              </Button>
            </div>

            {workflow.assignedReviewers.length > 0 && (
              <div className="space-y-2 pt-1">
                {workflow.assignedReviewers.map((rev, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-border bg-card flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold text-foreground">{rev.email}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {rev.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Audit History Log */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-foreground">Workflow Audit Trail</div>
            <div className="rounded-xl border border-border bg-muted/10 divide-y divide-border/60 max-h-48 overflow-y-auto">
              {workflow.history.map((h, i) => (
                <div key={i} className="p-3 text-xs flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-foreground">{h.action}</div>
                    {h.note && <div className="text-[11px] text-muted-foreground">{h.note}</div>}
                  </div>
                  <div className="text-right text-[10px] text-muted-foreground shrink-0">
                    <div>{h.user.split('@')[0]}</div>
                    <div>{new Date(h.timestamp).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-border/80 bg-muted/40">
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

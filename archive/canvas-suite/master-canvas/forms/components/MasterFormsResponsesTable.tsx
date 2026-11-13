import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  Trash2,
  Eye,
  FileSpreadsheet,
  FileText,
  Printer,
  Star,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Award,
} from 'lucide-react';
import { MasterFormData, MasterFormResponse } from '../types';
import { FormExportService } from '../services/FormExportService';
import { toast } from 'sonner';

interface MasterFormsResponsesTableProps {
  formData: MasterFormData;
  onDeleteResponse: (responseId: string) => void;
  onClearAllResponses: () => void;
  onExportSheets?: () => void;
}

export function MasterFormsResponsesTable({
  formData,
  onDeleteResponse,
  onClearAllResponses,
  onExportSheets,
}: MasterFormsResponsesTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResponse, setSelectedResponse] = useState<MasterFormResponse | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'reviewed' | 'flagged'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const activeQuestions = useMemo(() => {
    return (formData.questions || []).filter(
      (q) => !['section-header', 'image-block', 'video-block'].includes(q.type)
    );
  }, [formData.questions]);

  // Filtered responses
  const filteredResponses = useMemo(() => {
    return (formData.responses || []).filter((resp) => {
      // Search
      const matchesSearch =
        !searchQuery ||
        resp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (resp.responderEmail && resp.responderEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
        Object.values(resp.answers || {}).some((ans) =>
          String(ans).toLowerCase().includes(searchQuery.toLowerCase())
        );

      // Status filter
      const matchesStatus = statusFilter === 'all' || resp.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [formData.responses, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredResponses.length / itemsPerPage) || 1;
  const paginatedResponses = filteredResponses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExportCSV = () => {
    FormExportService.exportToCSV(formData);
  };

  const handleExportJSON = () => {
    FormExportService.exportToJSON(formData);
  };

  const handlePrintReport = () => {
    FormExportService.printSummaryReport(formData);
  };

  return (
    <div className="w-full max-w-6xl mx-auto my-6 space-y-6 select-none">
      {/* Top Header Card: Summary KPIs & Export Actions */}
      <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-foreground">
              {formData.responses?.length || 0} Responses
            </h2>
            {formData.quizSettings?.isQuiz && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 text-[10px] font-bold">
                Graded Quiz
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time submissions stored securely with Master Cloud 10 TB storage.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Master Sheets Button */}
          <button
            onClick={onExportSheets || (() => FormExportService.exportToMasterSheets(formData))}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20 transition-all active:scale-95"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Open in Master Sheets</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border/80 hover:bg-accent text-xs font-semibold transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>CSV</span>
          </button>

          {/* Export JSON */}
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border/80 hover:bg-accent text-xs font-semibold transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>JSON</span>
          </button>

          {/* Print Report */}
          <button
            onClick={handlePrintReport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border/80 hover:bg-accent text-xs font-semibold transition-colors"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Report</span>
          </button>

          {formData.responses?.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to clear all responses? This cannot be undone.')) {
                  onClearAllResponses();
                  toast.success('All responses cleared');
                }
              }}
              className="p-2 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              title="Clear all responses"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search responses..."
            className="w-full bg-card border border-border/80 rounded-2xl pl-9 pr-4 py-2 text-xs focus:border-primary focus:outline-none text-foreground"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="bg-card border border-border/80 rounded-xl px-3 py-1.5 text-xs font-semibold text-foreground focus:outline-none"
          >
            <option value="all">All Responses</option>
            <option value="new">New</option>
            <option value="reviewed">Reviewed</option>
            <option value="flagged">Flagged</option>
          </select>
        </div>
      </div>

      {/* Responses Data Grid */}
      {filteredResponses.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-3xl border border-border/80 p-8 space-y-3 shadow-sm">
          <Clock className="h-12 w-12 text-muted-foreground/30 mx-auto" />
          <h3 className="text-base font-bold text-foreground">No submissions recorded yet</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Switch to the <strong>Preview & Test</strong> tab or share your public link to start receiving responses.
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border/80 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-muted/40 border-b border-border/80 text-muted-foreground uppercase font-bold text-[10px] tracking-wider">
                  <th className="p-4 w-12 text-center">#</th>
                  <th className="p-4 whitespace-nowrap">Submitted At</th>
                  {formData.quizSettings?.isQuiz && (
                    <th className="p-4 whitespace-nowrap">Score</th>
                  )}
                  {activeQuestions.slice(0, 4).map((q) => (
                    <th key={q.id} className="p-4 max-w-[200px] truncate">
                      {q.title}
                    </th>
                  ))}
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {paginatedResponses.map((resp, idx) => {
                  const itemIndex = (currentPage - 1) * itemsPerPage + idx + 1;
                  return (
                    <tr
                      key={resp.id}
                      className="hover:bg-muted/30 transition-colors group cursor-pointer"
                      onClick={() => setSelectedResponse(resp)}
                    >
                      <td className="p-4 text-center font-bold text-muted-foreground">
                        {itemIndex}
                      </td>

                      <td className="p-4 whitespace-nowrap text-foreground font-medium">
                        {new Date(resp.submittedAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Quiz Score Badge */}
                      {formData.quizSettings?.isQuiz && (
                        <td className="p-4 whitespace-nowrap">
                          {resp.totalScore !== undefined ? (
                            <span
                              className={`px-2 py-0.5 rounded-full font-black text-[10px] ${
                                resp.passed
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-destructive/15 text-destructive'
                              }`}
                            >
                              {resp.totalScore}/{resp.maxPossibleScore} ({resp.percentageScore}%)
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      )}

                      {/* Question Answer Previews */}
                      {activeQuestions.slice(0, 4).map((q) => {
                        const ans = resp.answers[q.id];
                        let previewStr = '-';
                        if (ans !== undefined && ans !== null) {
                          if (Array.isArray(ans)) previewStr = ans.join(', ');
                          else if (typeof ans === 'object') previewStr = JSON.stringify(ans);
                          else previewStr = String(ans);
                        }

                        return (
                          <td key={q.id} className="p-4 max-w-[200px] truncate text-muted-foreground">
                            {previewStr}
                          </td>
                        );
                      })}

                      {/* Actions */}
                      <td
                        className="p-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedResponse(resp)}
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                            title="Inspect Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              onDeleteResponse(resp.id);
                              toast.success('Response deleted');
                            }}
                            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                            title="Delete Response"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-border/70 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, filteredResponses.length)} of{' '}
                {filteredResponses.length} entries
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-20"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="font-bold text-foreground px-2">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-20"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Response Detail Inspector Modal */}
      {selectedResponse && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border/80 rounded-3xl max-w-2xl w-full p-6 sm:p-8 max-h-[85vh] overflow-y-auto space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div>
                <h3 className="text-xl font-bold text-foreground">Response Details</h3>
                <p className="text-xs text-muted-foreground">
                  Submitted on {new Date(selectedResponse.submittedAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedResponse(null)}
                className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            {/* Quiz Result summary in modal */}
            {selectedResponse.totalScore !== undefined && (
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-xs font-bold text-foreground">Quiz Score</div>
                    <div className="text-sm font-black text-primary">
                      {selectedResponse.totalScore} / {selectedResponse.maxPossibleScore} Points (
                      {selectedResponse.percentageScore}%)
                    </div>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black ${
                    selectedResponse.passed
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'bg-destructive/15 text-destructive'
                  }`}
                >
                  {selectedResponse.passed ? 'PASSED' : 'FAILED'}
                </span>
              </div>
            )}

            {/* Answer items */}
            <div className="space-y-4">
              {activeQuestions.map((q, idx) => {
                const ans = selectedResponse.answers[q.id];
                const detail = selectedResponse.detailedAnswers?.[q.id];

                return (
                  <div key={q.id} className="bg-muted/20 border border-border/60 rounded-2xl p-4 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">
                        {idx + 1}. {q.title}
                      </span>
                      {detail && detail.maxScore ? (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            detail.isCorrect
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : 'bg-destructive/15 text-destructive'
                          }`}
                        >
                          {detail.score} / {detail.maxScore} pts
                        </span>
                      ) : null}
                    </div>

                    <div className="text-xs text-foreground font-medium pt-1 bg-background/50 p-2.5 rounded-xl border border-border/40">
                      {ans !== undefined && ans !== null ? (
                        Array.isArray(ans) ? (
                          ans.join(', ')
                        ) : typeof ans === 'object' ? (
                          <pre className="text-[11px] whitespace-pre-wrap">{JSON.stringify(ans, null, 2)}</pre>
                        ) : (
                          String(ans)
                        )
                      ) : (
                        <span className="text-muted-foreground italic">No answer provided</span>
                      )}
                    </div>

                    {q.explanation && (
                      <p className="text-[11px] text-muted-foreground italic pt-1">
                        Explanation: {q.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-border/60 flex justify-end">
              <button
                onClick={() => setSelectedResponse(null)}
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

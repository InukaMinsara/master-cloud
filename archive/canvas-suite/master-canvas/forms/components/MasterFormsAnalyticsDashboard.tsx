import React, { useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Award,
  Users,
  CheckCircle2,
  PieChart,
  Activity,
  Smile,
  Meh,
  Frown,
  Star,
  FileSpreadsheet,
} from 'lucide-react';
import { MasterFormData, MasterFormQuestion, MasterFormResponse } from '../types';
import { FormExportService } from '../services/FormExportService';

interface MasterFormsAnalyticsDashboardProps {
  formData: MasterFormData;
}

export function MasterFormsAnalyticsDashboard({ formData }: MasterFormsAnalyticsDashboardProps) {
  const responses = formData.responses || [];
  const totalResponses = responses.length;

  const activeQuestions = useMemo(() => {
    return (formData.questions || []).filter(
      (q) => !['section-header', 'image-block', 'video-block'].includes(q.type)
    );
  }, [formData.questions]);

  // High-level KPI calculations
  const avgTimeSeconds = useMemo(() => {
    if (totalResponses === 0) return 0;
    const total = responses.reduce((acc, r) => acc + (r.timeSpentSeconds || 0), 0);
    return Math.round(total / totalResponses);
  }, [responses, totalResponses]);

  const quizMetrics = useMemo(() => {
    if (!formData.quizSettings?.isQuiz || totalResponses === 0) return null;
    const scores = responses.map((r) => r.percentageScore ?? 0);
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const maxScore = Math.max(...scores);
    const passedCount = responses.filter((r) => r.passed).length;
    const passRate = Math.round((passedCount / totalResponses) * 100);

    return { avgScore, maxScore, passRate, passedCount };
  }, [formData.quizSettings, responses, totalResponses]);

  // Render question-specific analytics
  const renderQuestionAnalytics = (q: MasterFormQuestion) => {
    // 1. Multiple Choice / Dropdown Analytics
    if (q.type === 'multiple-choice' || q.type === 'dropdown') {
      const counts: Record<string, number> = {};
      (q.options || []).forEach((opt) => (counts[opt.id] = 0));

      responses.forEach((r) => {
        const val = r.answers[q.id];
        if (val && counts[val] !== undefined) {
          counts[val]++;
        }
      });

      return (
        <div className="space-y-3 pt-2">
          {q.options?.map((opt) => {
            const count = counts[opt.id] || 0;
            const percentage = totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;
            return (
              <div key={opt.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                  <span>{opt.label}</span>
                  <span className="text-muted-foreground">
                    {count} ({percentage}%)
                  </span>
                </div>
                <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // 2. Checkbox Analytics (Multi-select)
    if (q.type === 'checkbox') {
      const counts: Record<string, number> = {};
      (q.options || []).forEach((opt) => (counts[opt.id] = 0));

      let totalSelections = 0;
      responses.forEach((r) => {
        const arr = r.answers[q.id];
        if (Array.isArray(arr)) {
          arr.forEach((optId) => {
            if (counts[optId] !== undefined) {
              counts[optId]++;
              totalSelections++;
            }
          });
        }
      });

      return (
        <div className="space-y-3 pt-2">
          {q.options?.map((opt) => {
            const count = counts[opt.id] || 0;
            const percentage = totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;
            return (
              <div key={opt.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                  <span>{opt.label}</span>
                  <span className="text-muted-foreground">
                    {count} responders ({percentage}%)
                  </span>
                </div>
                <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // 3. Star Rating & Linear Scale
    if (q.type === 'rating' || q.type === 'linear-scale') {
      const scores = responses
        .map((r) => Number(r.answers[q.id]))
        .filter((n) => !isNaN(n) && n > 0);
      const avgRating = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '0.0';

      return (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-3 bg-muted/20 p-4 rounded-2xl border border-border/50">
            <div className="text-3xl font-black text-amber-500 flex items-center gap-1">
              {avgRating} <Star className="h-6 w-6 fill-amber-500" />
            </div>
            <div className="text-xs text-muted-foreground">
              Average rating calculated from {scores.length} ratings.
            </div>
          </div>
        </div>
      );
    }

    // 4. Net Promoter Score (NPS) Gauge
    if (q.type === 'nps') {
      const scores = responses
        .map((r) => Number(r.answers[q.id]))
        .filter((n) => !isNaN(n) && n >= 0 && n <= 10);

      const promoters = scores.filter((s) => s >= 9).length;
      const passives = scores.filter((s) => s >= 7 && s <= 8).length;
      const detractors = scores.filter((s) => s <= 6).length;

      const totalNps = scores.length;
      const promoterPct = totalNps > 0 ? Math.round((promoters / totalNps) * 100) : 0;
      const passivePct = totalNps > 0 ? Math.round((passives / totalNps) * 100) : 0;
      const detractorPct = totalNps > 0 ? Math.round((detractors / totalNps) * 100) : 0;
      const npsScore = promoterPct - detractorPct;

      return (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between bg-muted/20 p-4 rounded-2xl border border-border/50">
            <div>
              <div className="text-3xl font-black text-foreground">{npsScore}</div>
              <div className="text-xs font-bold text-muted-foreground uppercase">NPS Index (-100 to +100)</div>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-emerald-500">
                <Smile className="h-4 w-4" />
                <span>{promoterPct}% Promoters</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-500">
                <Meh className="h-4 w-4" />
                <span>{passivePct}% Passives</span>
              </div>
              <div className="flex items-center gap-1.5 text-rose-500">
                <Frown className="h-4 w-4" />
                <span>{detractorPct}% Detractors</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 5. Open-ended text responses (Short text, Paragraph, Email)
    const textAnswers = responses
      .map((r) => r.answers[q.id])
      .filter((val) => val !== undefined && val !== null && String(val).trim() !== '');

    return (
      <div className="space-y-2 pt-2">
        <p className="text-xs text-muted-foreground">
          {textAnswers.length} responses recorded
        </p>
        <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
          {textAnswers.slice(0, 5).map((ans, aIdx) => (
            <div
              key={aIdx}
              className="bg-muted/30 border border-border/50 rounded-xl p-2.5 text-xs text-foreground font-medium"
            >
              "{String(ans)}"
            </div>
          ))}
          {textAnswers.length > 5 && (
            <p className="text-[11px] text-muted-foreground text-center font-medium pt-1">
              + {textAnswers.length - 5} more answers in Responses table
            </p>
          )}
        </div>
      </div>
    );
  };

  if (totalResponses === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto my-12 text-center p-8 bg-card rounded-3xl border border-border/80 space-y-4 shadow-sm select-none">
        <BarChart3 className="h-16 w-16 text-muted-foreground/30 mx-auto" />
        <h3 className="text-xl font-bold text-foreground">Analytics Unavailable</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Analytics, score distributions, and NPS gauges will be generated automatically once your form collects its first response.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto my-6 space-y-6 select-none">
      {/* Top High-level KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Responses */}
        <div className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Total Submissions</span>
            <Users className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-3xl font-black text-foreground">{totalResponses}</div>
          <p className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Live Real-Time Submissions
          </p>
        </div>

        {/* Avg Time Spent */}
        <div className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Avg Time Spent</span>
            <Clock className="h-4 w-4 text-sky-500" />
          </div>
          <div className="text-3xl font-black text-foreground">
            {avgTimeSeconds > 60
              ? `${Math.floor(avgTimeSeconds / 60)}m ${avgTimeSeconds % 60}s`
              : `${avgTimeSeconds}s`}
          </div>
          <p className="text-[11px] text-muted-foreground">Average respondent completion</p>
        </div>

        {/* Quiz Avg Score or Active Questions */}
        {quizMetrics ? (
          <>
            <div className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">Average Score</span>
                <Award className="h-4 w-4 text-amber-500" />
              </div>
              <div className="text-3xl font-black text-amber-500">{quizMetrics.avgScore}%</div>
              <p className="text-[11px] text-muted-foreground">
                Highest achieved: {quizMetrics.maxScore}%
              </p>
            </div>

            <div className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">Pass Rate</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="text-3xl font-black text-emerald-500">{quizMetrics.passRate}%</div>
              <p className="text-[11px] text-muted-foreground">
                {quizMetrics.passedCount} of {totalResponses} passed
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">Completion Rate</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="text-3xl font-black text-emerald-500">100%</div>
              <p className="text-[11px] text-muted-foreground">Validated submissions</p>
            </div>

            <div className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-bold uppercase tracking-wider">Active Questions</span>
                <PieChart className="h-4 w-4 text-indigo-500" />
              </div>
              <div className="text-3xl font-black text-foreground">{activeQuestions.length}</div>
              <p className="text-[11px] text-muted-foreground">Form questions evaluated</p>
            </div>
          </>
        )}
      </div>

      {/* Question Analytics Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-foreground">Question-by-Question Insights</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeQuestions.map((q, idx) => (
            <div
              key={q.id}
              className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <span className="text-xs font-bold text-foreground">
                  {idx + 1}. {q.title}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                  {q.type}
                </span>
              </div>

              {renderQuestionAnalytics(q)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

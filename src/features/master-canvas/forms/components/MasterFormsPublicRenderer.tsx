import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Star,
  Upload,
  FileCheck,
  Award,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckSquare,
} from 'lucide-react';
import { MasterFormData, MasterFormQuestion, MasterFormResponse, FormSubmissionAnswer } from '../types';
import { FormLogicEngine } from '../services/FormLogicEngine';
import { FormValidationService } from '../services/FormValidationService';
import { toast } from 'sonner';

interface MasterFormsPublicRendererProps {
  formData: MasterFormData;
  isPreview?: boolean;
  onSubmitResponse: (response: MasterFormResponse) => void;
  onResetTest?: () => void;
}

export function MasterFormsPublicRenderer({
  formData,
  isPreview = false,
  onSubmitResponse,
  onResetTest,
}: MasterFormsPublicRendererProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [lastSubmission, setLastSubmission] = useState<MasterFormResponse | null>(null);
  const [quizScoreResult, setQuizScoreResult] = useState<any>(null);

  // Password Lock state
  const [isPasswordUnlocked, setIsPasswordUnlocked] = useState(!formData.accessSettings?.passwordProtected);
  const [enteredPassword, setEnteredPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  // Time tracker
  const [startTime] = useState<number>(Date.now());

  const layoutMode = formData.theme?.layoutMode || 'single-page';
  const sections = formData.sections?.length > 0
    ? formData.sections
    : [{ id: 'sec-1', title: 'General', order: 1 }];

  const currentSection = sections[currentSectionIndex] || sections[0];

  // Filter visible questions in real-time
  const visibleQuestions = formData.questions.filter((q) =>
    FormLogicEngine.isQuestionVisible(q, formData.questions, answers)
  );

  const sectionQuestions = visibleQuestions.filter((q) =>
    sections.length === 1 ? true : (q.sectionId || sections[0].id) === currentSection.id
  );

  // Password check handler
  const handleUnlockForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPassword === (formData.accessSettings?.accessPassword || '')) {
      setIsPasswordUnlocked(true);
      setPasswordError(false);
      toast.success('Form unlocked');
    } else {
      setPasswordError(true);
      toast.error('Incorrect password');
    }
  };

  // Answer updater
  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    // Clear error for this question if any
    if (validationErrors[questionId]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    }
  };

  // Next section / Multi-page navigation
  const handleNextSection = () => {
    // Validate current section questions first
    const visibleIds = new Set(sectionQuestions.map((q) => q.id));
    const validation = FormValidationService.validateAnswers(sectionQuestions, answers, visibleIds);

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      toast.error('Please resolve the highlighted required fields.');
      return;
    }

    setValidationErrors({});

    // Evaluate Next Section via Logic Engine
    const nextDest = FormLogicEngine.getNextSectionId(
      currentSection.id,
      sections,
      formData.questions,
      answers
    );

    if (nextDest === 'submit') {
      handleSubmitForm();
    } else {
      const nextIndex = sections.findIndex((s) => s.id === nextDest);
      if (nextIndex >= 0) {
        setCurrentSectionIndex(nextIndex);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        handleSubmitForm();
      }
    }
  };

  const handlePrevSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Single card mode next
  const handleNextCard = () => {
    const currentQ = visibleQuestions[currentCardIndex];
    if (currentQ) {
      const val = FormValidationService.validateAnswers([currentQ], answers);
      if (!val.isValid) {
        setValidationErrors(val.errors);
        toast.error('Please complete this question.');
        return;
      }
    }
    setValidationErrors({});
    if (currentCardIndex < visibleQuestions.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
    } else {
      handleSubmitForm();
    }
  };

  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex((prev) => prev - 1);
    }
  };

  // Final Form Submit Handler
  const handleSubmitForm = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Full form validation
    const visibleIds = new Set(visibleQuestions.map((q) => q.id));
    const validation = FormValidationService.validateAnswers(visibleQuestions, answers, visibleIds);

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      toast.error('Please fill all required questions before submitting.');
      return;
    }

    const timeSpentSeconds = Math.round((Date.now() - startTime) / 1000);

    // If quiz mode, grade it
    let totalScore = undefined;
    let maxPossibleScore = undefined;
    let percentageScore = undefined;
    let passed = undefined;
    let detailedAnswers = undefined;

    if (formData.quizSettings?.isQuiz) {
      const grade = FormValidationService.gradeSubmission(
        formData.questions,
        formData.quizSettings,
        answers
      );
      totalScore = grade.totalScore;
      maxPossibleScore = grade.maxPossibleScore;
      percentageScore = grade.percentageScore;
      passed = grade.passed;
      detailedAnswers = grade.detailedAnswers;
      setQuizScoreResult(grade);
    }

    const newResponse: MasterFormResponse = {
      id: 'resp-' + Date.now(),
      formId: formData.id,
      submittedAt: new Date().toISOString(),
      responderEmail: answers['email'] || answers['q-email'] || undefined,
      timeSpentSeconds,
      totalScore,
      maxPossibleScore,
      percentageScore,
      passed,
      answers: { ...answers },
      detailedAnswers,
      status: 'new',
    };

    setLastSubmission(newResponse);
    setIsSubmitted(true);
    onSubmitResponse(newResponse);

    if (formData.accessSettings?.redirectUrl) {
      setTimeout(() => {
        window.open(formData.accessSettings.redirectUrl, '_blank');
      }, 2000);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentSectionIndex(0);
    setCurrentCardIndex(0);
    setValidationErrors({});
    setIsSubmitted(false);
    setLastSubmission(null);
    setQuizScoreResult(null);
    if (onResetTest) onResetTest();
  };

  // If password locked
  if (!isPasswordUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] p-6 max-w-md mx-auto text-center space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto shadow-inner">
          <Lock className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Password Protected Form</h2>
        <p className="text-xs text-muted-foreground">
          This Master Form requires an access password to view and submit responses.
        </p>

        <form onSubmit={handleUnlockForm} className="w-full space-y-3">
          <input
            type="password"
            value={enteredPassword}
            onChange={(e) => setEnteredPassword(e.target.value)}
            placeholder="Enter password..."
            className="w-full bg-card border border-border/80 rounded-xl px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
            autoFocus
          />
          {passwordError && (
            <p className="text-xs text-destructive font-medium">Incorrect password. Please try again.</p>
          )}
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-md transition-all"
          >
            Unlock Form
          </button>
        </form>
      </div>
    );
  }

  // Submission Completed Screen
  if (isSubmitted) {
    return (
      <div className="max-w-xl mx-auto my-8 p-6 sm:p-8 bg-card border border-border/80 rounded-3xl shadow-xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="h-20 w-20 rounded-3xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="h-10 w-10" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-foreground">
            {formData.quizSettings?.isQuiz ? 'Assessment Submitted!' : 'Thank You!'}
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {formData.accessSettings?.confirmationMessage ||
              'Your response has been recorded successfully in Master Cloud.'}
          </p>
        </div>

        {/* Quiz Grade Card (if Quiz & Results enabled) */}
        {formData.quizSettings?.isQuiz && quizScoreResult && formData.quizSettings.showResultsImmediately && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 space-y-3 text-left">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-primary">
                <Award className="h-5 w-5" />
                <span>Your Result</span>
              </div>
              <span
                className={`text-xs font-black px-2.5 py-1 rounded-full ${
                  quizScoreResult.passed
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'bg-destructive/15 text-destructive'
                }`}
              >
                {quizScoreResult.passed ? 'PASSED' : 'NOT PASSED'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center py-1">
              <div className="bg-card/60 p-2.5 rounded-xl border border-border/50">
                <div className="text-xl font-black text-foreground">
                  {quizScoreResult.totalScore}/{quizScoreResult.maxPossibleScore}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase font-semibold">Points Earned</div>
              </div>
              <div className="bg-card/60 p-2.5 rounded-xl border border-border/50">
                <div className="text-xl font-black text-foreground">{quizScoreResult.percentageScore}%</div>
                <div className="text-[10px] text-muted-foreground uppercase font-semibold">Percentage</div>
              </div>
              <div className="bg-card/60 p-2.5 rounded-xl border border-border/50">
                <div className="text-xl font-black text-foreground">{formData.quizSettings.passPercentage}%</div>
                <div className="text-[10px] text-muted-foreground uppercase font-semibold">Passing Mark</div>
              </div>
            </div>

            {quizScoreResult.passed && formData.quizSettings.customPassMessage && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                {formData.quizSettings.customPassMessage}
              </p>
            )}
            {!quizScoreResult.passed && formData.quizSettings.customFailMessage && (
              <p className="text-xs text-destructive font-medium">
                {formData.quizSettings.customFailMessage}
              </p>
            )}
          </div>
        )}

        <div className="pt-4 border-t border-border/60 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleReset}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-border/80 hover:bg-accent text-xs font-bold transition-colors flex items-center justify-center gap-2 text-foreground"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Submit Another Response</span>
          </button>
        </div>
      </div>
    );
  }

  // Calculate overall progress percentage
  const progressPercent =
    layoutMode === 'card-wizard'
      ? Math.round(((currentCardIndex + 1) / Math.max(visibleQuestions.length, 1)) * 100)
      : Math.round(((currentSectionIndex + 1) / Math.max(sections.length, 1)) * 100);

  return (
    <div
      className="w-full max-w-2xl mx-auto my-4 sm:my-8 space-y-6 select-none"
      style={{
        fontFamily: formData.theme?.fontFamily || 'Inter',
      }}
    >
      {/* Optional Top Header Banner / Preset */}
      {formData.theme?.headerBannerPreset && (
        <div
          className={`h-28 sm:h-36 rounded-3xl overflow-hidden shadow-md flex items-end p-6 text-white ${
            formData.theme.headerBannerPreset === 'gradient-purple'
              ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500'
              : formData.theme.headerBannerPreset === 'gradient-emerald'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-500'
              : formData.theme.headerBannerPreset === 'gradient-cyan'
              ? 'bg-gradient-to-r from-sky-600 to-cyan-500'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600'
          }`}
        >
          <div className="flex items-center gap-2 text-white/90 text-xs font-bold backdrop-blur-sm bg-black/20 px-3 py-1 rounded-full">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Master Cloud Certified Form</span>
          </div>
        </div>
      )}

      {/* Form Title & Description Card */}
      <div
        className="bg-card border-t-8 border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-3"
        style={{ borderTopColor: formData.theme?.primaryColor || '#8b5cf6' }}
      >
        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
          {formData.title}
        </h1>
        {formData.description && (
          <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
            {formData.description}
          </p>
        )}

        {/* Progress Bar (if enabled) */}
        {formData.accessSettings?.showProgressBar && (
          <div className="pt-3 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
              <span>Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-300 rounded-full"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: formData.theme?.primaryColor || '#8b5cf6',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODE A: SINGLE PAGE & MULTI-PAGE WIZARD                                  */}
      {/* ========================================================================= */}
      {layoutMode !== 'card-wizard' && (
        <form onSubmit={handleSubmitForm} className="space-y-4">
          {/* Section Heading Card in multi-page mode */}
          {sections.length > 1 && (
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  Section {currentSectionIndex + 1} of {sections.length}
                </span>
                <h3 className="text-base font-bold text-foreground">{currentSection.title}</h3>
                {currentSection.description && (
                  <p className="text-xs text-muted-foreground">{currentSection.description}</p>
                )}
              </div>
            </div>
          )}

          {/* Render Questions for Current View */}
          {(layoutMode === 'multi-page' ? sectionQuestions : visibleQuestions).map((q, qIdx) => (
            <QuestionItemRenderer
              key={q.id}
              question={q}
              index={qIdx}
              answer={answers[q.id]}
              error={validationErrors[q.id]}
              primaryColor={formData.theme?.primaryColor || '#8b5cf6'}
              onAnswerChange={(val) => handleAnswerChange(q.id, val)}
            />
          ))}

          {/* Form Action Controls */}
          <div className="flex items-center justify-between pt-4 gap-3">
            {layoutMode === 'multi-page' && currentSectionIndex > 0 ? (
              <button
                type="button"
                onClick={handlePrevSection}
                className="px-5 py-3 rounded-2xl border border-border/80 hover:bg-accent text-xs font-bold flex items-center gap-2 transition-all text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {layoutMode === 'multi-page' && currentSectionIndex < sections.length - 1 ? (
              <button
                type="button"
                onClick={handleNextSection}
                className="px-6 py-3 rounded-2xl text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95"
                style={{ backgroundColor: formData.theme?.primaryColor || '#8b5cf6' }}
              >
                <span>Next Section</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                className="px-8 py-3.5 rounded-2xl text-white font-black text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95 ml-auto"
                style={{ backgroundColor: formData.theme?.primaryColor || '#8b5cf6' }}
              >
                <Send className="h-4 w-4" />
                <span>Submit Response</span>
              </button>
            )}
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* MODE B: CARD-BY-CARD (TYPEFORM STYLE)                                     */}
      {/* ========================================================================= */}
      {layoutMode === 'card-wizard' && visibleQuestions.length > 0 && (
        <div className="space-y-4">
          <QuestionItemRenderer
            question={visibleQuestions[currentCardIndex]}
            index={currentCardIndex}
            answer={answers[visibleQuestions[currentCardIndex].id]}
            error={validationErrors[visibleQuestions[currentCardIndex].id]}
            primaryColor={formData.theme?.primaryColor || '#8b5cf6'}
            onAnswerChange={(val) =>
              handleAnswerChange(visibleQuestions[currentCardIndex].id, val)
            }
          />

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handlePrevCard}
              disabled={currentCardIndex === 0}
              className="px-4 py-2.5 rounded-xl border border-border/80 hover:bg-accent disabled:opacity-20 text-xs font-bold flex items-center gap-1.5 transition-all text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>

            <span className="text-xs text-muted-foreground font-semibold">
              {currentCardIndex + 1} of {visibleQuestions.length}
            </span>

            {currentCardIndex < visibleQuestions.length - 1 ? (
              <button
                onClick={handleNextCard}
                className="px-5 py-2.5 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                style={{ backgroundColor: formData.theme?.primaryColor || '#8b5cf6' }}
              >
                <span>Next</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                onClick={() => handleSubmitForm()}
                className="px-6 py-2.5 rounded-xl text-white text-xs font-black flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                style={{ backgroundColor: formData.theme?.primaryColor || '#8b5cf6' }}
              >
                <Send className="h-3.5 w-3.5" />
                <span>Submit</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <div className="text-center pt-8 pb-4 text-xs text-muted-foreground flex items-center justify-center gap-1.5">
        <ShieldCheck className="h-4 w-4 text-emerald-500" />
        <span>Secured by Master Cloud &bull; 10 TB Permanent Free Storage</span>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------------
// Internal helper component to render individual questions
// ----------------------------------------------------------------------------------
function QuestionItemRenderer({
  question,
  index,
  answer,
  error,
  primaryColor,
  onAnswerChange,
}: {
  question: MasterFormQuestion;
  index: number;
  answer: any;
  error?: string;
  primaryColor: string;
  onAnswerChange: (val: any) => void;
}) {
  const [customOtherText, setCustomOtherText] = useState('');
  const [signatureData, setSignatureData] = useState<string | null>(null);

  return (
    <div
      className={`bg-card border rounded-3xl p-6 sm:p-7 shadow-sm space-y-4 transition-all ${
        error ? 'border-destructive ring-1 ring-destructive' : 'border-border/80'
      }`}
    >
      {/* Title & Description */}
      <div className="space-y-1">
        <label className="block text-base font-bold text-foreground leading-snug">
          {index + 1}. {question.title}{' '}
          {question.required && <span className="text-destructive font-black">*</span>}
        </label>
        {question.description && (
          <p className="text-xs text-muted-foreground leading-normal">{question.description}</p>
        )}
      </div>

      {/* Field Renderers */}
      <div className="pt-1">
        {/* Short Text / Email / Phone / URL / Number */}
        {['short-text', 'email', 'phone', 'url', 'number'].includes(question.type) && (
          <input
            type={question.type === 'number' ? 'number' : question.type === 'email' ? 'email' : 'text'}
            value={answer ?? ''}
            onChange={(e) => onAnswerChange(e.target.value)}
            placeholder={question.placeholder || 'Type your answer...'}
            className="w-full bg-background border border-border/80 rounded-2xl px-4 py-3 text-xs sm:text-sm focus:border-primary focus:outline-none transition-colors text-foreground"
          />
        )}

        {/* Paragraph */}
        {question.type === 'paragraph' && (
          <textarea
            rows={4}
            value={answer ?? ''}
            onChange={(e) => onAnswerChange(e.target.value)}
            placeholder={question.placeholder || 'Type your response...'}
            className="w-full bg-background border border-border/80 rounded-2xl px-4 py-3 text-xs sm:text-sm focus:border-primary focus:outline-none transition-colors resize-none text-foreground"
          />
        )}

        {/* Multiple Choice */}
        {question.type === 'multiple-choice' && (
          <div className="space-y-2.5">
            {question.options?.map((opt) => (
              <label
                key={opt.id}
                onClick={() => onAnswerChange(opt.id)}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer text-xs sm:text-sm font-medium transition-all ${
                  answer === opt.id
                    ? 'border-primary bg-primary/5 text-foreground shadow-sm'
                    : 'border-border/70 hover:bg-muted/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                <div
                  className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                    answer === opt.id ? 'border-primary bg-primary' : 'border-muted-foreground/40'
                  }`}
                >
                  {answer === opt.id && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                </div>
                <span className="flex-1">{opt.label}</span>
              </label>
            ))}

            {question.allowOther && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={customOtherText}
                  onChange={(e) => {
                    setCustomOtherText(e.target.value);
                    onAnswerChange(e.target.value);
                  }}
                  placeholder="Other (please specify)..."
                  className="w-full bg-background border border-border/70 rounded-xl px-3 py-2 text-xs focus:border-primary focus:outline-none"
                />
              </div>
            )}
          </div>
        )}

        {/* Checkbox (Multi-select) */}
        {question.type === 'checkbox' && (
          <div className="space-y-2.5">
            {question.options?.map((opt) => {
              const selected: string[] = Array.isArray(answer) ? answer : [];
              const isChecked = selected.includes(opt.id);
              return (
                <label
                  key={opt.id}
                  onClick={() => {
                    const next = isChecked
                      ? selected.filter((x) => x !== opt.id)
                      : [...selected, opt.id];
                    onAnswerChange(next);
                  }}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer text-xs sm:text-sm font-medium transition-all ${
                    isChecked
                      ? 'border-primary bg-primary/5 text-foreground shadow-sm'
                      : 'border-border/70 hover:bg-muted/40 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div
                    className={`h-4 w-4 rounded-md border flex items-center justify-center shrink-0 ${
                      isChecked ? 'border-primary bg-primary text-white' : 'border-muted-foreground/40'
                    }`}
                  >
                    {isChecked && <CheckSquare className="h-3 w-3" />}
                  </div>
                  <span className="flex-1">{opt.label}</span>
                </label>
              );
            })}
          </div>
        )}

        {/* Dropdown */}
        {question.type === 'dropdown' && (
          <select
            value={answer ?? ''}
            onChange={(e) => onAnswerChange(e.target.value)}
            className="w-full bg-background border border-border/80 rounded-2xl px-4 py-3 text-xs sm:text-sm focus:border-primary focus:outline-none text-foreground cursor-pointer"
          >
            <option value="">Select an option...</option>
            {question.options?.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        {/* Star Rating */}
        {question.type === 'rating' && (
          <div className="flex items-center gap-2 py-2">
            {Array.from({ length: question.scaleMax || 5 }).map((_, i) => {
              const starVal = i + 1;
              const isFilled = (answer || 0) >= starVal;
              return (
                <button
                  type="button"
                  key={starVal}
                  onClick={() => onAnswerChange(starVal)}
                  className="p-1 hover:scale-125 transition-transform"
                >
                  <Star
                    className={`h-7 w-7 ${
                      isFilled
                        ? 'fill-amber-500 text-amber-500'
                        : 'text-muted-foreground/30 hover:text-amber-500/50'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        )}

        {/* NPS Scale (0 to 10) */}
        {question.type === 'nps' && (
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-11 gap-1 sm:gap-2">
              {Array.from({ length: 11 }).map((_, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => onAnswerChange(i)}
                  className={`py-2.5 sm:py-3 rounded-xl border text-xs sm:text-sm font-black transition-all ${
                    answer === i
                      ? 'bg-primary text-white border-primary shadow-md scale-105'
                      : 'bg-card border-border/70 hover:bg-accent text-foreground'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground px-1">
              <span>{question.scaleMinLabel || '0 = Not at all likely'}</span>
              <span>{question.scaleMaxLabel || '10 = Extremely likely'}</span>
            </div>
          </div>
        )}

        {/* Linear Scale (1-10) */}
        {question.type === 'linear-scale' && (
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between gap-1 sm:gap-2 overflow-x-auto pb-1">
              {Array.from({
                length: (question.scaleMax || 10) - (question.scaleMin || 1) + 1,
              }).map((_, i) => {
                const val = (question.scaleMin || 1) + i;
                return (
                  <button
                    type="button"
                    key={val}
                    onClick={() => onAnswerChange(val)}
                    className={`flex-1 min-w-[32px] py-2.5 rounded-xl border text-xs font-bold transition-all ${
                      answer === val
                        ? 'bg-primary text-white border-primary shadow-md'
                        : 'bg-card border-border/70 hover:bg-accent text-foreground'
                    }`}
                  >
                    {val}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground px-1">
              <span>{question.scaleMinLabel || 'Low'}</span>
              <span>{question.scaleMaxLabel || 'High'}</span>
            </div>
          </div>
        )}

        {/* Likert Grid */}
        {question.type === 'likert-grid' && (
          <div className="overflow-x-auto border border-border/70 rounded-2xl">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/40 border-b border-border/70">
                  <th className="p-3 text-left font-bold text-muted-foreground">Statement</th>
                  {question.gridColumns?.map((col) => (
                    <th key={col.id} className="p-3 text-center font-bold text-muted-foreground whitespace-nowrap">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {question.gridRows?.map((row) => (
                  <tr key={row.id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="p-3 font-medium text-foreground">{row.label}</td>
                    {question.gridColumns?.map((col) => (
                      <td key={col.id} className="p-3 text-center">
                        <input
                          type="radio"
                          name={`grid-${question.id}-${row.id}`}
                          checked={answer?.[row.id] === col.id}
                          onChange={() => {
                            const gridState = typeof answer === 'object' && answer !== null ? { ...answer } : {};
                            gridState[row.id] = col.id;
                            onAnswerChange(gridState);
                          }}
                          className="text-primary focus:ring-0 cursor-pointer"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Checkbox Grid */}
        {question.type === 'checkbox-grid' && (
          <div className="overflow-x-auto border border-border/70 rounded-2xl">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/40 border-b border-border/70">
                  <th className="p-3 text-left font-bold text-muted-foreground">Statement</th>
                  {question.gridColumns?.map((col) => (
                    <th key={col.id} className="p-3 text-center font-bold text-muted-foreground whitespace-nowrap">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {question.gridRows?.map((row) => (
                  <tr key={row.id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="p-3 font-medium text-foreground">{row.label}</td>
                    {question.gridColumns?.map((col) => {
                      const rowSelected: string[] = answer?.[row.id] || [];
                      const isColChecked = rowSelected.includes(col.id);
                      return (
                        <td key={col.id} className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isColChecked}
                            onChange={() => {
                              const gridState = typeof answer === 'object' && answer !== null ? { ...answer } : {};
                              const currentCols: string[] = gridState[row.id] || [];
                              gridState[row.id] = isColChecked
                                ? currentCols.filter((c) => c !== col.id)
                                : [...currentCols, col.id];
                              onAnswerChange(gridState);
                            }}
                            className="rounded text-primary focus:ring-0 cursor-pointer"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* File Upload to Master Cloud */}
        {question.type === 'file-upload' && (
          <div className="border-2 border-dashed border-border/80 hover:border-primary/60 rounded-2xl p-6 text-center space-y-2 bg-muted/10 transition-colors">
            <Upload className="h-8 w-8 text-primary mx-auto" />
            <p className="text-xs font-bold text-foreground">
              {answer ? `Attached: ${answer}` : 'Click to select or drag and drop file'}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Uploaded securely to Master Cloud (Max size: {question.maxFileSizeMB || 10} MB)
            </p>
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onAnswerChange(file.name);
                  toast.success(`Attached file: ${file.name}`);
                }
              }}
              className="hidden"
              id={`file-input-${question.id}`}
            />
            <label
              htmlFor={`file-input-${question.id}`}
              className="inline-block px-4 py-2 rounded-xl bg-card border border-border/80 text-xs font-bold cursor-pointer hover:bg-accent transition-colors"
            >
              Browse Files
            </label>
          </div>
        )}

        {/* Digital Signature */}
        {question.type === 'signature' && (
          <div className="space-y-2">
            <div className="h-32 border-2 border-dashed border-border/80 rounded-2xl bg-muted/10 flex flex-col items-center justify-center p-4">
              {signatureData ? (
                <div className="text-center space-y-1">
                  <div className="font-serif italic text-lg text-primary">{signatureData}</div>
                  <span className="text-[10px] text-muted-foreground">Digitally Signed & Timestamped</span>
                </div>
              ) : (
                <div className="text-center space-y-1">
                  <input
                    type="text"
                    placeholder="Type full legal name to generate digital signature..."
                    onChange={(e) => {
                      setSignatureData(e.target.value);
                      onAnswerChange(`Signature: ${e.target.value}`);
                    }}
                    className="bg-card border border-border/60 rounded-xl px-3 py-1.5 text-xs text-center w-64 focus:outline-none focus:border-primary"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Validation Error Banner */}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-destructive font-semibold pt-1">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

import { MasterFormQuestion, FormQuizSettings, FormSubmissionAnswer } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>; // questionId -> error message
}

export interface QuizGradeResult {
  totalScore: number;
  maxPossibleScore: number;
  percentageScore: number;
  passed: boolean;
  detailedAnswers: Record<string, FormSubmissionAnswer>;
}

export class FormValidationService {
  /**
   * Validate a set of answers against the form question schemas
   */
  public static validateAnswers(
    questions: MasterFormQuestion[],
    answers: Record<string, any>,
    visibleQuestionIds?: Set<string>
  ): ValidationResult {
    const errors: Record<string, string> = {};

    for (const q of questions) {
      // If question is currently hidden by conditional logic, skip validation
      if (visibleQuestionIds && !visibleQuestionIds.has(q.id)) {
        continue;
      }

      // Ignore structural decorative blocks
      if (['section-header', 'image-block', 'video-block'].includes(q.type)) {
        continue;
      }

      const val = answers[q.id];

      // 1. Required Check
      const isEmpty =
        val === undefined ||
        val === null ||
        (typeof val === 'string' && val.trim() === '') ||
        (Array.isArray(val) && val.length === 0) ||
        (typeof val === 'object' && Object.keys(val).length === 0);

      if (q.required && isEmpty) {
        errors[q.id] = 'This question is required.';
        continue;
      }

      if (isEmpty) {
        // Not required and empty: skip further value constraints
        continue;
      }

      // 2. Type-specific validations
      if (q.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(val))) {
          errors[q.id] = 'Please enter a valid email address.';
        }
      } else if (q.type === 'url') {
        try {
          const urlStr = String(val).startsWith('http') ? String(val) : `https://${String(val)}`;
          new URL(urlStr);
        } catch {
          errors[q.id] = 'Please enter a valid URL (e.g. https://example.com).';
        }
      } else if (q.type === 'phone') {
        const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im;
        if (!phoneRegex.test(String(val).replace(/[\s-]/g, ''))) {
          errors[q.id] = 'Please enter a valid phone number.';
        }
      } else if (q.type === 'number') {
        const num = Number(val);
        if (isNaN(num)) {
          errors[q.id] = 'Please enter a valid number.';
        }
      } else if (q.type === 'likert-grid' || q.type === 'checkbox-grid') {
        if (q.required && q.gridRows) {
          const gridVal = (typeof val === 'object' && val !== null) ? val : {};
          const unfulfilledRows = q.gridRows.filter(r => !gridVal[r.id] || (Array.isArray(gridVal[r.id]) && gridVal[r.id].length === 0));
          if (unfulfilledRows.length > 0) {
            errors[q.id] = 'Please complete a response for each row in this grid.';
          }
        }
      }

      // 3. Custom configured validation rules
      if (q.validations && q.validations.length > 0) {
        for (const rule of q.validations) {
          if (rule.type === 'min_length' && typeof val === 'string' && rule.value) {
            if (val.length < Number(rule.value)) {
              errors[q.id] = rule.customErrorMessage || `Must be at least ${rule.value} characters.`;
            }
          } else if (rule.type === 'max_length' && typeof val === 'string' && rule.value) {
            if (val.length > Number(rule.value)) {
              errors[q.id] = rule.customErrorMessage || `Cannot exceed ${rule.value} characters.`;
            }
          } else if (rule.type === 'min_val' && rule.value !== undefined) {
            if (Number(val) < Number(rule.value)) {
              errors[q.id] = rule.customErrorMessage || `Value must be at least ${rule.value}.`;
            }
          } else if (rule.type === 'max_val' && rule.value !== undefined) {
            if (Number(val) > Number(rule.value)) {
              errors[q.id] = rule.customErrorMessage || `Value cannot exceed ${rule.value}.`;
            }
          } else if (rule.type === 'exact_count' && Array.isArray(val) && rule.value) {
            if (val.length !== Number(rule.value)) {
              errors[q.id] = rule.customErrorMessage || `Please select exactly ${rule.value} options.`;
            }
          } else if (rule.type === 'max_count' && Array.isArray(val) && rule.value) {
            if (val.length > Number(rule.value)) {
              errors[q.id] = rule.customErrorMessage || `Please select at most ${rule.value} options.`;
            }
          } else if (rule.type === 'regex' && typeof val === 'string' && rule.value) {
            try {
              const reg = new RegExp(String(rule.value));
              if (!reg.test(val)) {
                errors[q.id] = rule.customErrorMessage || 'Invalid format.';
              }
            } catch {
              // Ignore broken regex configs safely
            }
          }
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Grade a submission if Quiz mode is enabled
   */
  public static gradeSubmission(
    questions: MasterFormQuestion[],
    quizSettings: FormQuizSettings,
    answers: Record<string, any>
  ): QuizGradeResult {
    let totalScore = 0;
    let maxPossibleScore = 0;
    const detailedAnswers: Record<string, FormSubmissionAnswer> = {};

    for (const q of questions) {
      if (['section-header', 'image-block', 'video-block'].includes(q.type)) continue;

      const qPoints = q.points || 0;
      maxPossibleScore += qPoints;
      const userAns = answers[q.id];

      let isCorrect = false;
      let earnedPoints = 0;

      if (q.correctAnswers && q.correctAnswers.length > 0) {
        if (q.type === 'multiple-choice' || q.type === 'dropdown') {
          isCorrect = q.correctAnswers.includes(String(userAns));
          earnedPoints = isCorrect ? qPoints : 0;
        } else if (q.type === 'checkbox') {
          const userArr = Array.isArray(userAns) ? userAns : [];
          // Check if arrays have identical elements
          const setsMatch =
            userArr.length === q.correctAnswers.length &&
            userArr.every(item => q.correctAnswers?.includes(item));
          isCorrect = setsMatch;
          earnedPoints = isCorrect ? qPoints : 0;
        } else if (q.type === 'short-text' || q.type === 'number') {
          const userStr = String(userAns ?? '').trim().toLowerCase();
          isCorrect = q.correctAnswers.some(ans => ans.trim().toLowerCase() === userStr);
          earnedPoints = isCorrect ? qPoints : 0;
        }
      }

      totalScore += earnedPoints;
      detailedAnswers[q.id] = {
        questionId: q.id,
        value: userAns,
        score: earnedPoints,
        maxScore: qPoints,
        isCorrect,
      };
    }

    const percentageScore = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 100;
    const passed = percentageScore >= (quizSettings.passPercentage || 70);

    return {
      totalScore,
      maxPossibleScore,
      percentageScore,
      passed,
      detailedAnswers,
    };
  }
}

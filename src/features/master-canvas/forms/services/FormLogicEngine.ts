import { MasterFormQuestion, FormSection, ConditionalLogicRule } from '../types';

export class FormLogicEngine {
  /**
   * Evaluate whether a specific rule condition matches the user's answers
   */
  public static evaluateCondition(
    rule: ConditionalLogicRule,
    answers: Record<string, any>
  ): boolean {
    const rawVal = answers[rule.sourceQuestionId];
    const ruleVal = rule.value;

    switch (rule.operator) {
      case 'is_answered':
        return rawVal !== undefined && rawVal !== null && rawVal !== '' && (!Array.isArray(rawVal) || rawVal.length > 0);

      case 'is_not_answered':
        return rawVal === undefined || rawVal === null || rawVal === '' || (Array.isArray(rawVal) && rawVal.length === 0);

      case 'equals':
        if (Array.isArray(rawVal)) {
          return rawVal.length === 1 && String(rawVal[0]).toLowerCase() === String(ruleVal).toLowerCase();
        }
        return String(rawVal ?? '').trim().toLowerCase() === String(ruleVal ?? '').trim().toLowerCase();

      case 'not_equals':
        if (Array.isArray(rawVal)) {
          return !(rawVal.length === 1 && String(rawVal[0]).toLowerCase() === String(ruleVal).toLowerCase());
        }
        return String(rawVal ?? '').trim().toLowerCase() !== String(ruleVal ?? '').trim().toLowerCase();

      case 'contains':
        if (Array.isArray(rawVal)) {
          return rawVal.some(item => String(item).toLowerCase().includes(String(ruleVal).toLowerCase()));
        }
        return String(rawVal ?? '').toLowerCase().includes(String(ruleVal).toLowerCase());

      case 'not_contains':
        if (Array.isArray(rawVal)) {
          return !rawVal.some(item => String(item).toLowerCase().includes(String(ruleVal).toLowerCase()));
        }
        return !String(rawVal ?? '').toLowerCase().includes(String(ruleVal).toLowerCase());

      case 'greater_than': {
        const numVal = Number(rawVal);
        const numRule = Number(ruleVal);
        return !isNaN(numVal) && !isNaN(numRule) && numVal > numRule;
      }

      case 'less_than': {
        const numVal = Number(rawVal);
        const numRule = Number(ruleVal);
        return !isNaN(numVal) && !isNaN(numRule) && numVal < numRule;
      }

      default:
        return false;
    }
  }

  /**
   * Determine whether a question should be visible given current answers
   */
  public static isQuestionVisible(
    question: MasterFormQuestion,
    allQuestions: MasterFormQuestion[],
    answers: Record<string, any>
  ): boolean {
    // Check if any previous question has a rule targeting this question
    for (const sourceQ of allQuestions) {
      if (!sourceQ.logicRules || sourceQ.logicRules.length === 0) continue;

      for (const rule of sourceQ.logicRules) {
        if (rule.targetId === question.id) {
          const isConditionMet = this.evaluateCondition(rule, answers);
          if (rule.action === 'show_question') {
            return isConditionMet;
          }
          if (rule.action === 'hide_question') {
            return !isConditionMet;
          }
        }
      }
    }

    return true; // default visible
  }

  /**
   * Compute which section comes after currentSectionId given current answers
   */
  public static getNextSectionId(
    currentSectionId: string,
    sections: FormSection[],
    questions: MasterFormQuestion[],
    answers: Record<string, any>
  ): string | 'submit' {
    const currentSection = sections.find(s => s.id === currentSectionId);
    if (!currentSection) return 'submit';

    const sectionQuestions = questions.filter(q => (q.sectionId || sections[0]?.id) === currentSectionId);

    // Look for jump_to_section or skip_to_end rules in this section's questions
    for (const q of sectionQuestions) {
      if (!q.logicRules) continue;
      for (const rule of q.logicRules) {
        if (this.evaluateCondition(rule, answers)) {
          if (rule.action === 'skip_to_end') {
            return 'submit';
          }
          if (rule.action === 'jump_to_section' && rule.targetId) {
            return rule.targetId;
          }
        }
      }
    }

    // Default section sequence fallback
    if (currentSection.nextSectionId) {
      return currentSection.nextSectionId;
    }

    const currentIndex = sections.findIndex(s => s.id === currentSectionId);
    if (currentIndex >= 0 && currentIndex < sections.length - 1) {
      return sections[currentIndex + 1].id;
    }

    return 'submit';
  }
}

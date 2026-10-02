import { MasterFormData, MasterFormResponse } from '../types';

const STORAGE_PREFIX = 'master_forms_draft_';
const RESPONSES_STORAGE_PREFIX = 'master_forms_responses_';

export class FormSyncService {
  /**
   * Save draft data to local cache
   */
  public static saveLocalDraft(formId: string, data: MasterFormData): void {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${formId}`, JSON.stringify(data));
    } catch (err) {
      console.warn('LocalStorage save failed:', err);
    }
  }

  /**
   * Retrieve cached draft data
   */
  public static getLocalDraft(formId: string): MasterFormData | null {
    try {
      const item = localStorage.getItem(`${STORAGE_PREFIX}${formId}`);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  /**
   * Record a new response locally and return updated response list
   */
  public static recordResponseLocally(formId: string, response: MasterFormResponse): MasterFormResponse[] {
    try {
      const key = `${RESPONSES_STORAGE_PREFIX}${formId}`;
      const existingStr = localStorage.getItem(key);
      const existing: MasterFormResponse[] = existingStr ? JSON.parse(existingStr) : [];
      const updated = [response, ...existing];
      localStorage.setItem(key, JSON.stringify(updated));
      return updated;
    } catch {
      return [response];
    }
  }

  /**
   * Retrieve all recorded responses for a form
   */
  public static getLocalResponses(formId: string): MasterFormResponse[] {
    try {
      const key = `${RESPONSES_STORAGE_PREFIX}${formId}`;
      const existingStr = localStorage.getItem(key);
      return existingStr ? JSON.parse(existingStr) : [];
    } catch {
      return [];
    }
  }

  /**
   * Create default form state
   */
  public static getDefaultFormData(title = 'Untitled Form'): MasterFormData {
    const defaultSectionId = 'sec-1';
    return {
      id: 'form-' + Date.now(),
      title: title,
      description: 'Please complete the questions below.',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sections: [
        {
          id: defaultSectionId,
          title: 'Section 1',
          description: 'Basic information',
          order: 1,
        },
      ],
      questions: [
        {
          id: 'q-1',
          sectionId: defaultSectionId,
          type: 'short-text',
          title: 'What is your full name?',
          required: true,
          placeholder: 'Enter your name...',
        },
        {
          id: 'q-2',
          sectionId: defaultSectionId,
          type: 'email',
          title: 'What is your email address?',
          required: true,
          placeholder: 'name@example.com',
        },
        {
          id: 'q-3',
          sectionId: defaultSectionId,
          type: 'multiple-choice',
          title: 'How did you discover Master Cloud?',
          required: false,
          options: [
            { id: 'opt-1', label: 'Recommendation from Colleague' },
            { id: 'opt-2', label: 'Social Media / YouTube' },
            { id: 'opt-3', label: 'Web Search / Article' },
            { id: 'opt-4', label: 'GitHub Open Source' },
          ],
        },
      ],
      theme: {
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
      quizSettings: {
        isQuiz: false,
        shuffleQuestions: false,
        shuffleChoices: false,
        showResultsImmediately: true,
        showCorrectAnswers: true,
        showPointsPerQuestion: true,
        passPercentage: 70,
      },
      accessSettings: {
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
      responses: [],
    };
  }
}

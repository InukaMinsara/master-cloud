export type QuestionType =
  | 'short-text'
  | 'paragraph'
  | 'multiple-choice'
  | 'checkbox'
  | 'dropdown'
  | 'rating'
  | 'linear-scale'
  | 'nps'
  | 'likert-grid'
  | 'checkbox-grid'
  | 'date'
  | 'time'
  | 'file-upload'
  | 'email'
  | 'phone'
  | 'number'
  | 'url'
  | 'signature'
  | 'ranking'
  | 'section-header'
  | 'image-block'
  | 'video-block';

export type LogicOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'is_answered'
  | 'is_not_answered';

export type LogicAction =
  | 'jump_to_section'
  | 'skip_to_end'
  | 'show_question'
  | 'hide_question';

export interface ConditionalLogicRule {
  id: string;
  sourceQuestionId: string;
  operator: LogicOperator;
  value: string | number;
  action: LogicAction;
  targetId?: string; // target question ID or target section ID
}

export interface ValidationRule {
  type: 'min_length' | 'max_length' | 'regex' | 'min_val' | 'max_val' | 'exact_count' | 'max_count' | 'email' | 'url';
  value?: string | number;
  customErrorMessage?: string;
}

export interface ChoiceOption {
  id: string;
  label: string;
  image?: string;
  points?: number;
  isCorrect?: boolean;
}

export interface GridRow {
  id: string;
  label: string;
}

export interface GridColumn {
  id: string;
  label: string;
  points?: number;
}

export interface MasterFormQuestion {
  id: string;
  sectionId?: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  placeholder?: string;
  options?: ChoiceOption[]; // for multiple-choice, checkbox, dropdown, ranking
  allowOther?: boolean; // allow user custom input
  shuffleOptions?: boolean;
  
  // Scale / Rating / NPS settings
  scaleMin?: number;
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
  scaleStep?: number;
  
  // Grid settings
  gridRows?: GridRow[];
  gridColumns?: GridColumn[];

  // File upload constraints
  allowedFileTypes?: string[]; // e.g. ['image/*', 'application/pdf', '.docx', '.xlsx']
  maxFileSizeMB?: number;
  maxFileCount?: number;

  // Validation rules
  validations?: ValidationRule[];

  // Quiz / Exam grading
  isGraded?: boolean;
  points?: number;
  correctAnswers?: string[]; // IDs of correct options or exact string for short text
  explanation?: string; // feedback for response

  // Media / Section Block properties
  mediaUrl?: string;
  mediaCaption?: string;
  mediaAlt?: string;

  // Logic rules attached to this question
  logicRules?: ConditionalLogicRule[];
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  order: number;
  nextSectionId?: string | 'submit'; // default navigation destination
}

export interface FormTheme {
  themeId: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  cardColor: string;
  textColor: string;
  fontFamily: 'Inter' | 'Roboto' | 'Poppins' | 'Playfair Display' | 'JetBrains Mono' | 'Outfit';
  borderRadius: 'sm' | 'md' | 'lg' | 'full';
  headerBannerUrl?: string;
  headerBannerPreset?: string;
  layoutMode: 'single-page' | 'multi-page' | 'card-wizard';
  darkMode: boolean;
}

export interface FormQuizSettings {
  isQuiz: boolean;
  shuffleQuestions: boolean;
  shuffleChoices: boolean;
  showResultsImmediately: boolean;
  showCorrectAnswers: boolean;
  showPointsPerQuestion: boolean;
  passPercentage: number;
  customPassMessage?: string;
  customFailMessage?: string;
}

export interface FormAccessSettings {
  isOpen: boolean;
  requireLogin: boolean;
  singleResponsePerUser: boolean;
  passwordProtected: boolean;
  accessPassword?: string;
  responseLimit?: number;
  opensAt?: string; // ISO date
  closesAt?: string; // ISO date
  closeMessage?: string;
  collectEmail: 'none' | 'optional' | 'required';
  showProgressBar: boolean;
  allowEditAfterSubmission: boolean;
  confirmationMessage: string;
  redirectUrl?: string;
  sendEmailNotification: boolean;
  notificationEmailAddress?: string;
  webhookUrl?: string;
}

export interface FormSubmissionAnswer {
  questionId: string;
  value: any; // string, number, string[], record for grid, etc.
  score?: number;
  maxScore?: number;
  isCorrect?: boolean;
}

export interface MasterFormResponse {
  id: string;
  formId: string;
  submittedAt: string;
  responderEmail?: string;
  responderName?: string;
  timeSpentSeconds?: number;
  totalScore?: number;
  maxPossibleScore?: number;
  percentageScore?: number;
  passed?: boolean;
  answers: Record<string, any>; // questionId -> answer
  detailedAnswers?: Record<string, FormSubmissionAnswer>;
  status?: 'new' | 'reviewed' | 'flagged' | 'archived';
  notes?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface MasterFormData {
  id: string;
  title: string;
  description: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  sections: FormSection[];
  questions: MasterFormQuestion[];
  theme: FormTheme;
  quizSettings: FormQuizSettings;
  accessSettings: FormAccessSettings;
  responses: MasterFormResponse[];
  collaborators?: Array<{
    userId: string;
    email: string;
    role: 'viewer' | 'editor' | 'owner';
  }>;
}

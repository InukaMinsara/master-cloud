import { CanvasDocData as BaseCanvasDocData, DocComment, DocChangeTrack, DocFootnote } from '@/types/canvas';

export type CitationStyle = 'APA' | 'MLA' | 'Chicago' | 'IEEE';

export interface DocStyleItem {
  id: string;
  name: string;
  tag: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'blockquote' | 'pre' | 'span';
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing?: string;
  color?: string;
  backgroundColor?: string;
  isAllCaps?: boolean;
  isSmallCaps?: boolean;
  isDropCap?: boolean;
  keepWithNext?: boolean;
  marginTop?: string;
  marginBottom?: string;
  textIndent?: string;
}

export interface DocTheme {
  id: string;
  name: string;
  description: string;
  headingFont: string;
  bodyFont: string;
  primaryColor: string;
  accentColor: string;
  bgColor: string;
  cardBg: string;
  headingDecoration: 'none' | 'underline' | 'left-bar' | 'bottom-border' | 'gradient-text';
  tableHeaderBg: string;
}

export interface DocCitationSource {
  id: string;
  type: 'book' | 'journal' | 'website' | 'article' | 'conference';
  title: string;
  authors: string[];
  year: number;
  publisherOrJournal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  url?: string;
  accessDate?: string;
}

export interface DocBookmark {
  id: string;
  name: string;
  targetId: string;
  createdAt: string;
}

export interface DocIndexTerm {
  id: string;
  term: string;
  category?: string;
  occurrences: number;
  pageNumbers: number[];
}

export interface DocCrossReference {
  id: string;
  type: 'heading' | 'figure' | 'table' | 'equation' | 'bookmark';
  targetId: string;
  label: string;
  pageNumber?: number;
}

export interface DocShapeElement {
  id: string;
  type: 'rectangle' | 'rounded' | 'circle' | 'arrow' | 'callout' | 'star' | 'textbox' | 'line';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  text?: string;
  textColor?: string;
  fontSize?: number;
  zIndex: number;
  pageIndex: number;
}

export interface DocFormField {
  id: string;
  type: 'text' | 'number' | 'date' | 'checkbox' | 'radio' | 'dropdown' | 'signature';
  label: string;
  name: string;
  required?: boolean;
  options?: string[];
  value: any;
  placeholder?: string;
}

export interface DocApprovalWorkflow {
  status: 'draft' | 'review' | 'revision' | 'approved' | 'published' | 'archived';
  assignedReviewers: Array<{
    email: string;
    name: string;
    status: 'pending' | 'approved' | 'rejected';
    comments?: string;
    date?: string;
  }>;
  deadline?: string;
  history: Array<{
    action: string;
    user: string;
    timestamp: string;
    note?: string;
  }>;
}

export interface DocSignatureField {
  id: string;
  signerName?: string;
  signerEmail?: string;
  signedAt?: string;
  signatureDataUrl?: string;
  status: 'pending' | 'signed' | 'declined';
  verificationHash?: string;
}

export interface DocSnapshot {
  id: string;
  name: string;
  timestamp: string;
  content: string;
  wordCount: number;
  description?: string;
}

export interface DocPropertyMetadata {
  project?: string;
  department?: string;
  client?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: string;
  category?: string;
  tags?: string[];
  referenceNumber?: string;
  customFields?: Record<string, string>;
}

export interface DocSecuritySettings {
  isPublic?: boolean;
  isPasswordProtected?: boolean;
  passwordHash?: string;
  allowDownload?: boolean;
  allowPrint?: boolean;
  allowComments?: boolean;
  allowCopy?: boolean;
  isLocked?: boolean;
  lockedBy?: string;
}

export interface DocBookChapter {
  id: string;
  title: string;
  order: number;
  type: 'cover' | 'preface' | 'toc' | 'chapter' | 'appendix' | 'bibliography' | 'index';
  contentHtml: string;
}

export interface DocQualityIssue {
  id: string;
  type: 'warning' | 'error' | 'info' | 'suggestion';
  category: 'headings' | 'links' | 'spelling' | 'alt-text' | 'empty-blocks' | 'readability';
  message: string;
  fixActionLabel?: string;
}

// Master Extended Document Interface
export interface ExtendedCanvasDocData extends BaseCanvasDocData {
  themeId?: string;
  customStyles?: DocStyleItem[];
  citations?: DocCitationSource[];
  citationStyle?: CitationStyle;
  bookmarks?: DocBookmark[];
  indexTerms?: DocIndexTerm[];
  crossReferences?: DocCrossReference[];
  shapes?: DocShapeElement[];
  formFields?: DocFormField[];
  isFormFillMode?: boolean;
  approval?: DocApprovalWorkflow;
  signatures?: DocSignatureField[];
  snapshots?: DocSnapshot[];
  properties?: DocPropertyMetadata;
  security?: DocSecuritySettings;
  bookChapters?: DocBookChapter[];
  isBookMode?: boolean;
  variables?: Record<string, string>;
  endnotes?: DocFootnote[];
}

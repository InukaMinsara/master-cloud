export type SlideAspect = '16:9' | '4:3' | 'portrait' | 'custom';

export type SlideObjectType =
  | 'text'
  | 'image'
  | 'shape'
  | 'line'
  | 'arrow'
  | 'connector'
  | 'table'
  | 'chart'
  | 'icon'
  | 'video'
  | 'audio'
  | 'button'
  | 'group'
  | 'sheets-table'
  | 'sheets-chart'
  | 'docs-snippet';

export type ShapeKind =
  | 'rectangle'
  | 'rounded'
  | 'circle'
  | 'ellipse'
  | 'triangle'
  | 'diamond'
  | 'arrow'
  | 'arrow-right'
  | 'arrow-double'
  | 'chevron'
  | 'star'
  | 'heart'
  | 'callout'
  | 'cloud'
  | 'database'
  | 'cylinder'
  | 'process'
  | 'decision'
  | 'banner'
  | 'hexagon';

export type TransitionType =
  | 'none'
  | 'fade'
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'slide-down'
  | 'zoom'
  | 'flip'
  | 'rotate'
  | 'dissolve'
  | 'wipe'
  | 'split'
  | 'reveal';

export type AnimationType =
  | 'none'
  | 'appear'
  | 'fade-in'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'zoom-in'
  | 'bounce'
  | 'flip'
  | 'spin'
  | 'pulse'
  | 'grow-shrink';

export interface SlideObjectFormat {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  highlightColor?: string;
  fillColor?: string;
  gradientFill?: string;
  strokeColor?: string;
  strokeWidth?: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  borderRadius?: number;
  align?: 'left' | 'center' | 'right' | 'justify';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  lineHeight?: number;
  letterSpacing?: number;
  opacity?: number;
  rotation?: number;
  shadow?: boolean;
  shadowBlur?: number;
  shadowColor?: string;
  glow?: boolean;
  linkUrl?: string;
  targetSlideId?: string;
  isActionNext?: boolean;
  isActionPrev?: boolean;
  isActionFirst?: boolean;
  isActionLast?: boolean;
}

export interface ConnectorConnection {
  startObjectId?: string;
  startPoint?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  endObjectId?: string;
  endPoint?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  style?: 'straight' | 'elbow' | 'curved';
}

export interface MasterSlideObject {
  id: string;
  name?: string;
  type: SlideObjectType;
  shapeKind?: ShapeKind;
  content: string; // Text content, image URL, SVG path, or JSON data for table/chart
  x: number; // percentage (0 - 100) or pixel
  y: number; // percentage (0 - 100) or pixel
  width: number;
  height: number;
  zIndex: number;
  opacity?: number;
  rotation?: number;
  format?: SlideObjectFormat;
  isLocked?: boolean;
  isHidden?: boolean;
  groupId?: string;
  altText?: string;
  readingOrder?: number;
  animation?: {
    type: AnimationType;
    trigger: 'on-click' | 'after-previous' | 'with-previous';
    delayMs?: number;
    durationMs?: number;
    order?: number;
  };
  connector?: ConnectorConnection;
  tableData?: {
    rows: number;
    cols: number;
    cells: string[][];
    cellBg?: string[][];
    colWidths?: number[];
  };
  chartData?: {
    type: 'column' | 'bar' | 'line' | 'area' | 'pie' | 'doughnut';
    title?: string;
    labels: string[];
    values: number[];
    colors?: string[];
  };
  mediaConfig?: {
    autoplay?: boolean;
    loop?: boolean;
    muted?: boolean;
    volume?: number;
    posterUrl?: string;
  };
  linkedDataSource?: {
    sourceApp: 'sheets' | 'docs' | 'canvas';
    sourceFileId?: string;
    sourceRangeOrElementId?: string;
    lastSyncedAt?: string;
    isLiveLinked?: boolean;
  };
}

export type SlideLayoutKind =
  | 'title'
  | 'title-content'
  | 'two-columns'
  | 'section-header'
  | 'comparison'
  | 'image-text'
  | 'quote'
  | 'big-stat'
  | 'table-focus'
  | 'chart-focus'
  | 'blank'
  | 'custom';

export type SlideThemeId =
  | 'dark-slate'
  | 'corporate-indigo'
  | 'emerald-nature'
  | 'crimson-bold'
  | 'sunset-amber'
  | 'minimal-light'
  | 'cyber-neon';

export interface SlideThemeConfig {
  id: SlideThemeId;
  name: string;
  description: string;
  bgGradient: string;
  textColor: string;
  subtextColor: string;
  accentColor: string;
  cardBg: string;
  fontFamily: string;
}

export interface SlideCommentReply {
  id: string;
  author: string;
  authorAvatar?: string;
  text: string;
  createdAt: string;
}

export interface SlideComment {
  id: string;
  slideId: string;
  targetObjectId?: string;
  author: string;
  authorAvatar?: string;
  text: string;
  createdAt: string;
  resolved: boolean;
  replies: SlideCommentReply[];
}

export interface SlideSection {
  id: string;
  name: string;
  slideIds: string[];
  isCollapsed?: boolean;
}

export interface SlideMaster {
  bgTheme: SlideThemeId;
  customBgColor?: string;
  headerText?: string;
  footerText?: string;
  logoUrl?: string;
  showSlideNumbers?: boolean;
  titleFont?: string;
  bodyFont?: string;
}

export interface MasterSlide {
  id: string;
  title: string;
  layout: SlideLayoutKind;
  bgTheme: SlideThemeId;
  customBgColor?: string;
  objects: MasterSlideObject[];
  notes?: string; // Speaker notes
  transition?: {
    type: TransitionType;
    durationSeconds: number;
  };
  isHidden?: boolean;
  sectionId?: string;
}

export interface SlideVersionHistoryItem {
  id: string;
  timestamp: string;
  author: string;
  title: string;
  description: string;
  slideCount: number;
  snapshotData: MasterPresentationData;
}

export interface SlideDocumentHealthIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  category: 'accessibility' | 'typography' | 'layout' | 'media' | 'links';
  slideIndex: number;
  slideId: string;
  objectId?: string;
  message: string;
  fixSuggestion: string;
}

export interface SlideHandoutConfig {
  layout: '1-slide' | '2-slides' | '3-slides-notes' | '4-slides' | '6-slides' | '9-slides';
  orientation: 'portrait' | 'landscape';
  showNotes: boolean;
  showSlideNumbers: boolean;
  headerText?: string;
  footerText?: string;
}

export interface MasterPresentationData {
  title: string;
  version: number;
  aspectRatio: SlideAspect;
  activeSlideId: string;
  slides: MasterSlide[];
  defaultTheme: SlideThemeId;
  master?: SlideMaster;
  sections?: SlideSection[];
  comments?: SlideComment[];
  versions?: SlideVersionHistoryItem[];
  headerText?: string;
  footerText?: string;
  showSlideNumbers?: boolean;
  lastSavedAt: string;
  offlineDirty?: boolean;
}

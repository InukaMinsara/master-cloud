export type SlideAspect = '16:9' | '4:3' | 'custom';

export type SlideObjectType =
  | 'text'
  | 'image'
  | 'shape'
  | 'line'
  | 'arrow'
  | 'table'
  | 'chart'
  | 'icon'
  | 'video'
  | 'audio'
  | 'button';

export type ShapeKind =
  | 'rectangle'
  | 'rounded'
  | 'circle'
  | 'ellipse'
  | 'triangle'
  | 'arrow'
  | 'chevron'
  | 'star'
  | 'heart'
  | 'callout'
  | 'cloud';

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
  | 'dissolve';

export type AnimationType =
  | 'none'
  | 'appear'
  | 'fade-in'
  | 'slide-up'
  | 'slide-down'
  | 'zoom-in'
  | 'bounce'
  | 'flip'
  | 'spin';

export interface SlideObjectFormat {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  borderRadius?: number;
  align?: 'left' | 'center' | 'right';
  opacity?: number;
  rotation?: number;
  shadow?: boolean;
  linkUrl?: string;
  targetSlideId?: string;
}

export interface MasterSlideObject {
  id: string;
  type: SlideObjectType;
  shapeKind?: ShapeKind;
  content: string; // Text content, image URL, SVG path, or JSON data for table/chart
  x: number; // percentage (0 - 100) or pixel
  y: number; // percentage (0 - 100) or pixel
  width: number;
  height: number;
  zIndex: number;
  format?: SlideObjectFormat;
  animation?: {
    type: AnimationType;
    trigger: 'on-click' | 'after-previous';
    delayMs?: number;
    durationMs?: number;
  };
  tableData?: {
    rows: number;
    cols: number;
    cells: string[][];
  };
  chartData?: {
    type: 'column' | 'bar' | 'line' | 'pie' | 'doughnut';
    labels: string[];
    values: number[];
  };
  isLocked?: boolean;
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
  | 'blank';

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
  sectionName?: string;
}

export interface MasterPresentationData {
  title: string;
  version: number;
  aspectRatio: SlideAspect;
  activeSlideId: string;
  slides: MasterSlide[];
  defaultTheme: SlideThemeId;
  headerText?: string;
  footerText?: string;
  showSlideNumbers?: boolean;
  lastSavedAt: string;
}

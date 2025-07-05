/**
 * Configuration options for creating a callout block
 */
export interface CalloutBlockOptions {
  /** Base position where the callout should be placed */
  position: {
    x: number;
    y: number;
  };
  
  /** Width of the entire callout block */
  width?: number;
  
  /** Height of the callout block (auto-calculated if not provided) */
  height?: number;
  
  /** Predefined callout type with preset styling */
  type?: CalloutType;
  
  /** Title text for the callout */
  title: string;
  
  /** Main content text */
  content: string;
  
  /** Custom styling overrides */
  style?: {
    backgroundColor?: string;
    borderColor?: string;
    titleColor?: string;
    contentColor?: string;
    borderRadius?: number;
    borderWidth?: number;
    iconColor?: string;
  };
  
  /** Custom icon override (SVG string) */
  customIcon?: string;
  
  /** Custom layout settings */
  layout?: {
    padding?: number;
    iconSize?: number;
    titleHeight?: number;
    iconTitleGap?: number;
    titleContentGap?: number;
  };
  
  /** Optional custom IDs */
  customIds?: {
    groupId?: string;
    backgroundId?: string;
    iconId?: string;
    titleId?: string;
    contentId?: string;
  };
}

/**
 * Predefined callout types with associated styling
 */
export type CalloutType = 'tip' | 'warning' | 'definition' | 'note' | 'important' | 'example';

/**
 * Result of creating a callout block
 */
export interface CalloutBlockResult {
  /** Array of schema objects to add to the template */
  schemas: any[];
  
  /** The group ID used for this callout (for manipulation) */
  groupId: string;
  
  /** Calculated dimensions of the callout */
  dimensions: {
    width: number;
    height: number;
  };
  
  /** Layout information for debugging/adjustment */
  layout: CalloutLayout;
}

/**
 * Layout positioning for all callout elements
 */
export interface CalloutLayout {
  /** Background rectangle position and size */
  background: ElementRect;
  
  /** Icon position and size */
  icon: ElementRect;
  
  /** Title text position and size */
  title: ElementRect;
  
  /** Content text position and size */
  content: ElementRect;
  
  /** Layout constants used */
  constants: LayoutConstants;
}

/**
 * Rectangle definition for element positioning
 */
export interface ElementRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Layout constants for consistent spacing
 */
export interface LayoutConstants {
  padding: number;
  iconSize: number;
  titleHeight: number;
  iconTitleGap: number;
  titleContentGap: number;
  borderRadius: number;
  borderWidth: number;
}

/**
 * Preset configuration for callout types
 */
export interface CalloutPreset {
  backgroundColor: string;
  borderColor: string;
  titleColor: string;
  contentColor: string;
  icon: string; // SVG string
  iconColor: string;
  title: string; // Default title
}

/**
 * Callout type presets with educational focus
 */
export const CALLOUT_PRESETS: Record<CalloutType, CalloutPreset> = {
  tip: {
    backgroundColor: '#F0F9FF',
    borderColor: '#0EA5E9',
    titleColor: '#0C4A6E',
    contentColor: '#1E293B',
    iconColor: '#0EA5E9',
    icon: 'lightbulb', // Will be resolved to SVG
    title: 'Mẹo hay',
  },
  
  warning: {
    backgroundColor: '#FFFBEB',
    borderColor: '#F59E0B',
    titleColor: '#92400E',
    contentColor: '#1E293B',
    iconColor: '#F59E0B',
    icon: 'alertTriangle',
    title: 'Lưu ý',
  },
  
  definition: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
    titleColor: '#064E3B',
    contentColor: '#1E293B',
    iconColor: '#10B981',
    icon: 'book',
    title: 'Định nghĩa',
  },
  
  note: {
    backgroundColor: '#F8FAFC',
    borderColor: '#64748B',
    titleColor: '#334155',
    contentColor: '#1E293B',
    iconColor: '#64748B',
    icon: 'info',
    title: 'Ghi chú',
  },
  
  important: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
    titleColor: '#991B1B',
    contentColor: '#1E293B',
    iconColor: '#EF4444',
    icon: 'exclamation',
    title: 'Quan trọng',
  },
  
  example: {
    backgroundColor: '#FAF5FF',
    borderColor: '#8B5CF6',
    titleColor: '#581C87',
    contentColor: '#1E293B',
    iconColor: '#8B5CF6',
    icon: 'clipboard',
    title: 'Ví dụ',
  },
};

/**
 * Default layout constants
 */
export const DEFAULT_LAYOUT: LayoutConstants = {
  padding: 5,
  iconSize: 12,
  titleHeight: 12,
  iconTitleGap: 3,
  titleContentGap: 5,
  borderRadius: 3,
  borderWidth: 1,
};
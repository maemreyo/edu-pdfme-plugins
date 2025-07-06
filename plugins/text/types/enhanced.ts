// REFACTORED: 2025-01-07 - Enhanced type definitions with better safety

import type { Schema } from '@pdfme/common';
import type { Font as FontKitFont } from 'fontkit';

/**
 * Text alignment options
 */
export type ALIGNMENT = 'left' | 'center' | 'right' | 'justify';

/**
 * Vertical alignment options
 */
export type VERTICAL_ALIGNMENT = 'top' | 'middle' | 'bottom';

/**
 * Dynamic font size fit modes
 */
export type DYNAMIC_FONT_SIZE_FIT = 'horizontal' | 'vertical';

/**
 * Dynamic font size configuration
 */
export interface DynamicFontSizeConfig {
  min: number;
  max: number;
  fit: DYNAMIC_FONT_SIZE_FIT;
}

/**
 * Font width calculation values for precise text measurement
 */
export interface FontWidthCalcValues {
  font: FontKitFont;
  fontSize: number;
  characterSpacing: number;
  boxWidthInPt: number;
}

/**
 * Enhanced TextSchema with strict typing
 */
export interface TextSchema extends Schema {
  fontName?: string;
  alignment: ALIGNMENT;
  verticalAlignment: VERTICAL_ALIGNMENT;
  fontSize: number;
  lineHeight: number;
  strikethrough?: boolean;
  underline?: boolean;
  characterSpacing: number;
  dynamicFontSize?: DynamicFontSizeConfig;
  fontColor: string;
  backgroundColor: string;
}

/**
 * Font metrics calculation result
 */
export interface FontMetrics {
  width: number;
  height: number;
  descent: number;
  ascent: number;
  unitsPerEm: number;
}

/**
 * Browser font adjustment values for WYSIWYG alignment
 */
export interface BrowserFontAdjustments {
  topAdj: number;
  bottomAdj: number;
}

/**
 * Text line processing result
 */
export interface ProcessedTextLines {
  lines: string[];
  totalHeight: number;
  maxWidth: number;
}

/**
 * Dynamic font sizing calculation parameters
 */
export interface DynamicSizingParams {
  textSchema: TextSchema;
  fontKitFont: FontKitFont;
  value: string;
  startingFontSize?: number;
}

/**
 * Text rendering context for UI
 */
export interface TextRenderContext {
  schema: TextSchema;
  fontKitFont: FontKitFont;
  value: string;
  isEditable: boolean;
  usePlaceholder: boolean;
  placeholder?: string;
}

/**
 * PDF text rendering parameters
 */
export interface PDFTextRenderParams {
  value: string;
  fontKitFont: FontKitFont;
  schema: TextSchema;
  fontSize: number;
  color: any; // PDF-lib color type
  alignment: ALIGNMENT;
  verticalAlignment: VERTICAL_ALIGNMENT;
  lineHeight: number;
  characterSpacing: number;
}

/**
 * Event handler configuration for UI elements
 */
export interface TextEventHandlers {
  onBlur?: (value: string) => void;
  onKeyup?: () => void;
  onFocus?: () => void;
  onChange?: (arg: { key: string; value: unknown }) => void;
  stopEditing?: () => void;
}

/**
 * Cache key types for performance optimization
 */
export type FontCacheKey = string;
export type PDFDocumentCacheKey = string;

/**
 * Validation result for text operations
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Text processing pipeline configuration
 */
export interface TextProcessingConfig {
  enableJapaneseRules: boolean;
  enableDynamicSizing: boolean;
  enableCharacterReplacement: boolean;
  segmentationGranularity: 'word' | 'sentence' | 'grapheme';
}

/**
 * Line breaking algorithm options
 */
export interface LineBreakingOptions {
  boxWidthInPt: number;
  characterSpacing: number;
  fontSize: number;
  fontKitFont: FontKitFont;
  useSegmenter: boolean;
  applyJapaneseRules: boolean;
}

/**
 * Type guards for runtime type checking
 */
export const isDynamicFontSizeConfig = (obj: any): obj is DynamicFontSizeConfig => {
  return obj && 
    typeof obj.min === 'number' && 
    typeof obj.max === 'number' && 
    typeof obj.fit === 'string' &&
    ['horizontal', 'vertical'].includes(obj.fit);
};

export const isTextSchema = (obj: any): obj is TextSchema => {
  return obj && 
    typeof obj.alignment === 'string' &&
    typeof obj.verticalAlignment === 'string' &&
    typeof obj.fontSize === 'number' &&
    typeof obj.lineHeight === 'number' &&
    typeof obj.characterSpacing === 'number' &&
    typeof obj.fontColor === 'string';
};

/**
 * Utility type for partial text schema updates
 */
export type PartialTextSchema = Partial<TextSchema>;

/**
 * Configuration for text plugin initialization
 */
export interface TextPluginConfig {
  defaultFontSize: number;
  defaultAlignment: ALIGNMENT;
  defaultVerticalAlignment: VERTICAL_ALIGNMENT;
  defaultLineHeight: number;
  defaultCharacterSpacing: number;
  defaultFontColor: string;
  enableCaching: boolean;
  enableJapaneseSupport: boolean;
  enableDynamicSizing: boolean;
}
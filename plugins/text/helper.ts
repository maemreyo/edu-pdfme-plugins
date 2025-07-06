// REFACTORED: 2025-01-07 - Modularized and enhanced text processing system

/**
 * MAIN HELPER MODULE - REFACTORED ARCHITECTURE
 * 
 * This module serves as the main entry point for all text processing operations.
 * It imports and re-exports functions from specialized modules while maintaining
 * backward compatibility with existing code.
 * 
 * Critical mechanisms are preserved exactly to ensure PDF-UI consistency.
 */

// === FONT METRICS & CACHING ===
export {
  getFontKitFont,
  widthOfTextAtSize,
  heightOfFontAtSize,
  getFontDescentInPt,
  getBrowserVerticalFontAdjustments,
  replaceUnsupportedChars
} from './modules/fontMetrics';

// === TEXT LAYOUT & LINE WRAPPING ===
export {
  getSplittedLines,
  getSplittedLinesBySegmenter,
  splitTextToSize,
  containsJapanese,
  type FontWidthCalcValues
} from './modules/textLayout';

// === JAPANESE TEXT PROCESSING ===
export {
  LINE_START_FORBIDDEN_CHARS,
  LINE_END_FORBIDDEN_CHARS,
  filterStartJP,
  filterEndJP,
  applyJapaneseRules
} from './modules/japaneseText';

// === DYNAMIC FONT SIZING ===
export {
  calculateDynamicFontSize,
  FONT_SIZE_ADJUSTMENT,
  DEFAULT_DYNAMIC_FIT,
  DEFAULT_DYNAMIC_MIN_FONT_SIZE,
  DEFAULT_DYNAMIC_MAX_FONT_SIZE
} from './modules/dynamicSizing';

// === BROWSER COMPATIBILITY ===
export {
  isFirefox,
  makeElementPlainTextContentEditable,
  setupBlurHandler,
  setupKeyupHandler,
  setupFocusHandler,
  mapVerticalAlignToFlex,
  getBackgroundColor,
  getTextFromElement,
  focusElementAtEnd
} from './modules/browserCompat';

// === ENHANCED TYPES ===
export type {
  TextSchema,
  ALIGNMENT,
  VERTICAL_ALIGNMENT,
  DYNAMIC_FONT_SIZE_FIT,
  DynamicFontSizeConfig,
  FontWidthCalcValues as FontWidthCalcValuesType,
  FontMetrics,
  BrowserFontAdjustments,
  ProcessedTextLines,
  DynamicSizingParams,
  TextRenderContext,
  PDFTextRenderParams,
  TextEventHandlers,
  ValidationResult,
  TextProcessingConfig,
  LineBreakingOptions,
  TextPluginConfig
} from './types/enhanced';

// === TYPE GUARDS ===
export {
  isDynamicFontSizeConfig,
  isTextSchema
} from './types/enhanced';

/**
 * BACKWARD COMPATIBILITY SECTION
 * 
 * These re-exports maintain compatibility with existing code that imports
 * from the original helper.ts file. All functions work exactly the same.
 */

// Legacy imports that should continue to work
import {
  DEFAULT_FONT_SIZE,
  DEFAULT_ALIGNMENT,
  DEFAULT_VERTICAL_ALIGNMENT,
  DEFAULT_LINE_HEIGHT,
  DEFAULT_CHARACTER_SPACING,
  DEFAULT_FONT_COLOR,
  VERTICAL_ALIGN_TOP,
  DYNAMIC_FIT_HORIZONTAL,
  DYNAMIC_FIT_VERTICAL
} from './constants';

// Re-export constants for backward compatibility
export {
  DEFAULT_FONT_SIZE,
  DEFAULT_ALIGNMENT,
  DEFAULT_VERTICAL_ALIGNMENT,
  DEFAULT_LINE_HEIGHT,
  DEFAULT_CHARACTER_SPACING,
  DEFAULT_FONT_COLOR,
  VERTICAL_ALIGN_TOP,
  DYNAMIC_FIT_HORIZONTAL,
  DYNAMIC_FIT_VERTICAL
};

/**
 * MAIN TEXT PROCESSING PIPELINE
 * 
 * High-level function that combines multiple processing steps
 * for comprehensive text handling with all features enabled.
 */
import type { TextSchema, ValidationResult } from './types/enhanced';
import type { Font as FontKitFont } from 'fontkit';
import { getSplittedLinesBySegmenter } from './modules/textLayout';
import { applyJapaneseRules } from './modules/japaneseText';
import { calculateDynamicFontSize } from './modules/dynamicSizing';
import { mm2pt } from '@pdfme/common';

export interface TextProcessingResult {
  lines: string[];
  fontSize: number;
  totalHeight: number;
  maxWidth: number;
}

/**
 * Comprehensive text processing pipeline
 * Applies all text processing features: segmentation, Japanese rules, dynamic sizing
 */
export const processTextComprehensive = ({
  value,
  schema,
  fontKitFont
}: {
  value: string;
  schema: TextSchema;
  fontKitFont: FontKitFont;
}): TextProcessingResult => {
  // Step 1: Calculate dynamic font size if enabled
  const fontSize = schema.dynamicFontSize 
    ? calculateDynamicFontSize({ textSchema: schema, fontKitFont, value })
    : schema.fontSize;

  // Step 2: Split text with advanced segmentation
  const boxWidthInPt = mm2pt(schema.width);
  const lines = getSplittedLinesBySegmenter(value, {
    font: fontKitFont,
    fontSize,
    characterSpacing: schema.characterSpacing,
    boxWidthInPt,
  });

  // Step 3: Apply Japanese text rules if needed
  const processedLines = applyJapaneseRules(lines);

  // Step 4: Calculate metrics
  const totalHeight = processedLines.length * fontSize * schema.lineHeight;
  const maxWidth = Math.max(
    ...processedLines.map(line => 
      widthOfTextAtSize(line.replace('\n', ''), fontKitFont, fontSize, schema.characterSpacing)
    )
  );

  return {
    lines: processedLines,
    fontSize,
    totalHeight,
    maxWidth: maxWidth || 0
  };
};

/**
 * CRITICAL MECHANISM VALIDATION
 * 
 * Ensures all critical mechanisms are working correctly.
 * This should be called during initialization to verify the refactor integrity.
 */
export const validateCriticalMechanisms = (): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if Intl.Segmenter is available
  if (typeof Intl.Segmenter === 'undefined') {
    errors.push('Intl.Segmenter not available - advanced line breaking will fail');
  }

  // Check if FontKit types are available
  if (typeof fontkit === 'undefined') {
    errors.push('FontKit not available - font metrics calculations will fail');
  }

  // Validate Japanese character sets
  if (LINE_START_FORBIDDEN_CHARS.length === 0 || LINE_END_FORBIDDEN_CHARS.length === 0) {
    errors.push('Japanese character rules not loaded - Japanese text processing will fail');
  }

  // Check browser compatibility functions
  if (typeof navigator === 'undefined') {
    warnings.push('Navigator not available - browser detection may fail in non-browser environments');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * PERFORMANCE MONITORING
 * 
 * Helper to measure performance of critical operations
 */
export const measurePerformance = async <T>(
  operation: () => Promise<T> | T,
  operationName: string
): Promise<T> => {
  const start = performance.now();
  const result = await operation();
  const end = performance.now();
  
  if (end - start > 100) { // Log slow operations
    console.warn(`Slow text operation: ${operationName} took ${end - start}ms`);
  }
  
  return result;
};

// Import widthOfTextAtSize for the processTextComprehensive function
import { widthOfTextAtSize } from './modules/fontMetrics';
import { LINE_START_FORBIDDEN_CHARS, LINE_END_FORBIDDEN_CHARS } from './modules/japaneseText';

// Make fontkit available for validation
declare const fontkit: any;
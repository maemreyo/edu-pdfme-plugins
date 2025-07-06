// REFACTORED: 2025-01-07 - Enhanced text plugin with modular architecture

import type { Plugin } from '@pdfme/common';
import { pdfRender } from './pdfRender';
import { propPanel } from './propPanel';
import { uiRender } from './uiRender';
import type { TextSchema } from './types/enhanced';
import { TextCursorInput } from 'lucide';
import { createSvgStr } from '../utils';

// Import validation helpers
import { validateCriticalMechanisms } from './helper';

/**
 * REFACTORED TEXT PLUGIN
 * 
 * Enhanced text plugin with:
 * - Modular architecture for better maintainability
 * - Preserved critical mechanisms for PDF-UI consistency
 * - Enhanced event handling system
 * - Advanced Japanese text support
 * - Dynamic font sizing with iterative algorithm
 * - Firefox compatibility workarounds
 * - Performance optimizations with caching
 * - Comprehensive error handling
 */
const textSchema: Plugin<TextSchema> = {
  pdf: pdfRender,
  ui: uiRender,
  propPanel,
  icon: createSvgStr(TextCursorInput),
  
  // Plugin metadata
  // name: 'text',
  // version: '2.0.0-refactored',
  // description: 'Enhanced text plugin with advanced features and better architecture',
  
  // Feature flags
  // features: {
  //   dynamicSizing: true,
  //   japaneseSupport: true,
  //   richText: true,
  //   firefoxCompat: true,
  //   performanceOptimized: true,
  // },
};

/**
 * Plugin initialization with validation
 */
const initializeTextPlugin = (): Plugin<TextSchema> => {
  // Validate critical mechanisms on initialization
  const validation = validateCriticalMechanisms();
  
  if (!validation.isValid) {
    console.error('Text plugin critical mechanisms validation failed:', validation.errors);
    throw new Error('Text plugin initialization failed due to missing dependencies');
  }
  
  if (validation.warnings.length > 0) {
    console.warn('Text plugin warnings:', validation.warnings);
  }
  
  console.log('✅ Text plugin initialized successfully with all critical mechanisms validated');
  
  return textSchema;
};

// Export initialized plugin
export default initializeTextPlugin();

// Export types for external use
export type { 
  TextSchema,
  ALIGNMENT,
  VERTICAL_ALIGNMENT,
  DYNAMIC_FONT_SIZE_FIT,
  DynamicFontSizeConfig,
  FontWidthCalcValues,
  TextRenderContext,
  PDFTextRenderParams,
  TextEventHandlers,
  ValidationResult,
  TextProcessingConfig,
  LineBreakingOptions,
  TextPluginConfig
} from './types/enhanced';

// Export constants for external configuration
export {
  DEFAULT_FONT_SIZE,
  DEFAULT_ALIGNMENT,
  DEFAULT_VERTICAL_ALIGNMENT,
  DEFAULT_LINE_HEIGHT,
  DEFAULT_CHARACTER_SPACING,
  DEFAULT_FONT_COLOR,
  DYNAMIC_FIT_HORIZONTAL,
  DYNAMIC_FIT_VERTICAL,
  DEFAULT_DYNAMIC_FIT,
  DEFAULT_DYNAMIC_MIN_FONT_SIZE,
  DEFAULT_DYNAMIC_MAX_FONT_SIZE,
  FONT_SIZE_ADJUSTMENT,
} from './constants';

// Export helper functions for advanced usage
export {
  processTextComprehensive,
  measurePerformance,
  validateCriticalMechanisms,
  getFontKitFont,
  calculateDynamicFontSize,
  splitTextToSize,
  widthOfTextAtSize,
  heightOfFontAtSize,
} from './helper';

// Export UI helpers
export {
  buildStyledTextContainer,
  makeElementPlainTextContentEditable,
  createDebouncedKeyupHandler,
  batchStyleUpdates,
  addAccessibilityAttributes,
  enableDebugMode,
} from './uiRender';

// Export PDF helpers
export {
  measurePdfRenderPerformance,
  validatePdfRenderParams,
  safePdfRender,
} from './pdfRender';
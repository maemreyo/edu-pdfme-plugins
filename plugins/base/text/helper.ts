/**
 * Text Plugin Helper Hub (Enterprise Edition)
 * 
 * Central coordination point for all text plugin business logic.
 * This hub orchestrates complex operations by delegating to specialized sub-modules.
 * 
 * Architecture:
 * - fontMetrics.ts: Font loading, caching, and measurement
 * - dynamicSizing.ts: Dynamic font size algorithms
 * - lineWrapping.ts: Advanced text wrapping with i18n support
 * - browserCompat.ts: Cross-browser compatibility layer
 * 
 * This design ensures:
 * - Clean separation of concerns
 * - Easy testing and maintenance
 * - Performance optimization through caching
 * - Type safety throughout the stack
 */

import type { Font as FontKitFont } from 'fontkit';
import type {
  TextSchema,
  TextSchemaInternal,
  WidthCalculationContext,
  DynamicFontSizeResult,
  FontMetrics,
  BrowserAdjustments,
  TextChangeEvent,
  LineWrappingConfig,
} from './types';

// Import specialized sub-modules
import {
  getFontKitFont,
  getFontMetrics,
  widthOfTextAtSize,
  heightOfFontAtSize,
  getFontDescentInPt,
  cacheFont,
  clearFontCache,
  getFontCacheStats,
} from './helper/fontMetrics';

import {
  calculateDynamicFontSize,
  validateDynamicConfig,
  optimizeDynamicCalculation,
  getDynamicSizeConstraints,
} from './helper/dynamicSizing';

import {
  wrapText,
  containsJapanese,
  containsComplexScript,
  detectPrimaryScript,
  getPerformanceMetrics as getLineWrappingPerformanceMetrics,
  resetPerformanceMetrics as resetLineWrappingPerformanceMetrics,
  getSegmenterCacheStats,
} from './helper/lineWrapping';

import {
  getBrowserVerticalFontAdjustments,
  makeElementPlainTextContentEditable,
  detectBrowserMode,
  supportsFeature,
  getTextFromElement,
  setTextInElement,
  getBrowserInfo,
  getCompatConfig,
  setCompatConfig,
  isModernBrowser,
  needsFirefoxWorkarounds,
  getRecommendedSettings,
} from './helper/browserCompat';

/**
 * ===========================================
 * MAIN HELPER EXPORTS
 * ===========================================
 */

// Re-export all specialized functions for easy access
export {
  // Font Metrics
  getFontKitFont,
  getFontMetrics,
  widthOfTextAtSize,
  heightOfFontAtSize,
  getFontDescentInPt,
  cacheFont,
  clearFontCache,
  getFontCacheStats,
  
  // Dynamic Sizing
  calculateDynamicFontSize,
  validateDynamicConfig,
  optimizeDynamicCalculation,
  getDynamicSizeConstraints,
  
  // Line Wrapping
  wrapText,
  containsJapanese,
  containsComplexScript,
  detectPrimaryScript,
  getLineWrappingPerformanceMetrics,
  resetLineWrappingPerformanceMetrics,
  getSegmenterCacheStats,
  
  // Browser Compatibility
  getBrowserVerticalFontAdjustments,
  makeElementPlainTextContentEditable,
  detectBrowserMode,
  supportsFeature,
  getTextFromElement,
  setTextInElement,
  getBrowserInfo,
  getCompatConfig,
  setCompatConfig,
  isModernBrowser,
  needsFirefoxWorkarounds,
  getRecommendedSettings,
};

/**
 * ===========================================
 * HIGH-LEVEL ORCHESTRATION FUNCTIONS
 * ===========================================
 */

/**
 * Comprehensive text schema validation and enhancement
 * 
 * Validates a text schema and enhances it with computed properties.
 * This is the main entry point for schema processing.
 * 
 * @param schema - Text schema to validate and enhance
 * @param options - Validation options
 * @returns Enhanced schema with computed properties
 */
export async function validateAndEnhanceSchema(
  schema: TextSchema,
  options: {
    fontData?: ArrayBuffer | string;
    enableCaching?: boolean;
    validateDynamic?: boolean;
  } = {}
): Promise<TextSchemaInternal> {
  const {
    fontData,
    enableCaching = true,
    validateDynamic = true
  } = options;

  // Start with the original schema
  const enhancedSchema: TextSchemaInternal = { ...schema };

  try {
    // Load and cache font if font data is provided
    if (fontData) {
      const fontKitFont = await getFontKitFont(fontData);
      if (enableCaching) {
        await cacheFont(schema.fontName || 'default', fontKitFont);
      }
      
      // Extract and cache font metrics
      enhancedSchema._cachedMetrics = getFontMetrics(fontKitFont);
    }

    // Validate dynamic font size configuration
    if (validateDynamic && schema.dynamicFontSize) {
      const validationResult = validateDynamicConfig(schema.dynamicFontSize);
      if (!validationResult.isValid) {
        throw new Error(`Invalid dynamic font size config: ${validationResult.errors.join(', ')}`);
      }
    }

    

    // Detect browser compatibility requirements
    enhancedSchema._browserMode = detectBrowserMode();

    // Initialize performance tracking
    enhancedSchema._performanceData = {
      renderCount: 0,
      totalRenderTime: 0,
      lastRenderTime: 0,
    };

    return enhancedSchema;

  } catch (error) {
    console.error('Schema validation and enhancement failed:', error);
    throw error;
  }
}

/**
 * Complete text processing pipeline
 * 
 * Processes text through the complete pipeline: font loading, dynamic sizing,
 * line wrapping, and browser adjustments.
 * 
 * @param text - Text content to process
 * @param schema - Text schema configuration
 * @param containerDimensions - Container dimensions in points
 * @returns Complete processing result
 */
export async function processTextComplete(
  text: string,
  schema: TextSchemaInternal,
  containerDimensions: { width: number; height: number }
): Promise<{
  processedText: string;
  lines: string[];
  fontKitFont: FontKitFont;
  finalFontSize: number;
  browserAdjustments: BrowserAdjustments;
  metrics: FontMetrics;
  performance: {
    processingTime: number;
    cacheHits: number;
    fontLoadTime: number;
  };
}> {
  const startTime = performance.now();
  let fontLoadTime = 0;
  let cacheHits = 0;

  try {
    // Step 1: Load font and get metrics
    const fontLoadStart = performance.now();
    const fontKitFont = await getFontKitFont(schema.fontName || 'Helvetica');
    fontLoadTime = performance.now() - fontLoadStart;

    const metrics = schema._cachedMetrics || getFontMetrics(fontKitFont);
    if (schema._cachedMetrics) {
      cacheHits++;
    }

    // Step 2: Calculate optimal font size
    let finalFontSize = schema.fontSize;
    
    if (schema.dynamicFontSize) {
      const dynamicResult = await calculateDynamicFontSize({
        textSchema: schema,
        fontKitFont,
        value: text,
        containerDimensions,
        startingFontSize: schema._cachedFontSize?.fontSize,
      });
      
      finalFontSize = dynamicResult.fontSize;
      
      // Cache result for future use
      schema._cachedFontSize = dynamicResult;
      if (dynamicResult.performance.wasCached) {
        cacheHits++;
      }
    }

    // Step 3: Perform line wrapping
    const calcValues: WidthCalculationContext = {
      font: fontKitFont,
      fontSize: finalFontSize,
      characterSpacing: schema.characterSpacing,
      boxWidth: containerDimensions.width,
    };

    const lines = await wrapText(text, calcValues, schema.lineWrapping);

    // Step 4: Apply Japanese line breaking rules if needed
    const processedLines = lines.lines;

    // Step 5: Calculate browser adjustments
    const browserAdjustments = getBrowserVerticalFontAdjustments(
      fontKitFont,
      finalFontSize,
      schema.lineHeight,
      schema.verticalAlignment,
      detectBrowserMode()
    );

    // Step 6: Update performance tracking
    const processingTime = performance.now() - startTime;
    if (schema._performanceData) {
      schema._performanceData.renderCount++;
      schema._performanceData.totalRenderTime += processingTime;
      schema._performanceData.lastRenderTime = processingTime;
    }

    return {
      processedText: processedLines.join('\n'),
      lines: processedLines,
      fontKitFont,
      finalFontSize,
      browserAdjustments,
      metrics,
      performance: {
        processingTime,
        cacheHits,
        fontLoadTime,
      },
    };

  } catch (error) {
    console.error('Text processing pipeline failed:', error);
    throw error;
  }
}

/**
 * ===========================================
 * UTILITY AND CONVENIENCE FUNCTIONS
 * ===========================================
 */

/**
 * Quick font size calculation for simple cases
 * 
 * Simplified interface for dynamic font size calculation when full
 * processing pipeline is not needed.
 */
export async function quickFontSizeCalculation(
  text: string,
  schema: TextSchema,
  containerWidth: number,
  containerHeight: number
): Promise<number> {
  if (!schema.dynamicFontSize) {
    return schema.fontSize;
  }

  const fontKitFont = await getFontKitFont(schema.fontName || 'Helvetica');
  
  const result = await calculateDynamicFontSize({
    textSchema: schema,
    fontKitFont,
    value: text,
    containerDimensions: { width: containerWidth, height: containerHeight },
  });

  return result.fontSize;
}

/**
 * Text change event processor
 * 
 * Processes text change events and determines what updates are needed.
 */
export function processTextChangeEvent(
  event: TextChangeEvent,
  schema: TextSchemaInternal
): {
  needsFontRecalculation: boolean;
  needsLineWrapping: boolean;
  needsBrowserAdjustment: boolean;
  optimizations: string[];
} {
  const needsFontRecalculation = Boolean(
    schema.dynamicFontSize && 
    event.newValue.length !== event.previousValue.length
  );

  const needsLineWrapping = Boolean(
    event.newValue.includes('\n') || 
    event.newValue.length > (schema.performanceHints?.expectedLength || 100)
  );

  const needsBrowserAdjustment = Boolean(
    needsFontRecalculation || 
    !schema._browserMode
  );

  const optimizations: string[] = [];
  
  if (event.source === 'user' && event.newValue.length < 50) {
    optimizations.push('real-time-preview');
  }
  
  if (schema._cachedFontSize && !needsFontRecalculation) {
    optimizations.push('use-cached-font-size');
  }
  
  if (schema._cachedMetrics) {
    optimizations.push('use-cached-metrics');
  }

  return {
    needsFontRecalculation,
    needsLineWrapping,
    needsBrowserAdjustment,
    optimizations,
  };
}

/**
 * Performance monitoring utilities
 */
export function getPerformanceReport(schema: TextSchemaInternal): {
  totalRenders: number;
  averageRenderTime: number;
  lastRenderTime: number;
  cacheEfficiency: number;
  recommendations: string[];
} {
  const perf = schema._performanceData;
  if (!perf) {
    return {
      totalRenders: 0,
      averageRenderTime: 0,
      lastRenderTime: 0,
      cacheEfficiency: 0,
      recommendations: ['Enable performance tracking'],
    };
  }

  const averageRenderTime = perf.totalRenderTime / perf.renderCount;
  const cacheStats = getFontCacheStats();
  const cacheEfficiency = cacheStats.hits / (cacheStats.hits + cacheStats.misses) * 100;

  const recommendations: string[] = [];
  
  if (averageRenderTime > 10) {
    recommendations.push('Consider enabling font caching');
  }
  
  if (cacheEfficiency < 80) {
    recommendations.push('Increase font cache size');
  }
  
  if (perf.renderCount > 1000) {
    recommendations.push('Consider implementing render debouncing');
  }

  return {
    totalRenders: perf.renderCount,
    averageRenderTime,
    lastRenderTime: perf.lastRenderTime,
    cacheEfficiency,
    recommendations,
  };
}

/**
 * ===========================================
 * LEGACY COMPATIBILITY FUNCTIONS
 * ===========================================
 */

/**
 * Legacy function for backward compatibility
 * @deprecated Use processTextComplete instead
 */
export const getSplittedLines = wrapText;

/**
 * Legacy dynamic font size function
 * @deprecated Use calculateDynamicFontSize instead
 */
export async function legacyCalculateDynamicFontSize(params: any): Promise<number> {
  console.warn('legacyCalculateDynamicFontSize is deprecated. Use calculateDynamicFontSize instead.');
  
  const result = await calculateDynamicFontSize({
    textSchema: params.textSchema,
    fontKitFont: params.fontKitFont,
    value: params.value,
    containerDimensions: {
      width: params.textSchema.width,
      height: params.textSchema.height,
    },
    startingFontSize: params.startingFontSize,
  });
  
  return result.fontSize;
}
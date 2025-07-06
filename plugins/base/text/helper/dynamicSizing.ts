/**
 * Dynamic Font Sizing Module (Enterprise Edition)
 * 
 * Advanced algorithms for automatic font size calculation to fit text within containers.
 * Implements multiple strategies:
 * - Iterative refinement (default)
 * - Binary search optimization
 * - Linear approximation
 * 
 * Features:
 * - High-performance calculation with caching
 * - Constraint-based optimization
 * - Multi-directional fitting (horizontal/vertical)
 * - Performance monitoring and optimization
 * - Graceful error handling and fallbacks
 */

import type { Font as FontKitFont } from 'fontkit';
import type {
  TextSchema,
  DynamicFontSizeConfig,
  DynamicFontSizeResult,
  WidthCalculationContext,
  DynamicFontSizeAlgorithm,
  DynamicFontSizeFit,
} from '../types';
import {
  DEFAULT_FONT_SIZE,
  DEFAULT_CHARACTER_SPACING,
  DEFAULT_LINE_HEIGHT,
  FONT_SIZE_ADJUSTMENT,
  MAX_DYNAMIC_FONT_ITERATIONS,
  DYNAMIC_FONT_PRECISION_THRESHOLD,
  DEFAULT_DYNAMIC_MIN_FONT_SIZE,
  DEFAULT_DYNAMIC_MAX_FONT_SIZE,
  DEFAULT_DYNAMIC_FIT,
  REALTIME_SIZING_THRESHOLD,
} from '../constants';
import { widthOfTextAtSize, heightOfFontAtSize } from './fontMetrics';
import { wrapText } from './lineWrapping';

/**
 * ===========================================
 * VALIDATION AND CONFIGURATION
 * ===========================================
 */

/**
 * Validates dynamic font size configuration
 * 
 * @param config - Dynamic font size configuration
 * @returns Validation result with errors if any
 */
export function validateDynamicConfig(config: DynamicFontSizeConfig): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate min/max range
  if (config.min <= 0) {
    errors.push('Minimum font size must be greater than 0');
  }
  
  if (config.max <= 0) {
    errors.push('Maximum font size must be greater than 0');
  }
  
  if (config.min >= config.max) {
    errors.push('Minimum font size must be less than maximum font size');
  }

  // Validate precision
  if (config.precision && config.precision <= 0) {
    errors.push('Precision must be greater than 0');
  }
  
  if (config.precision && config.precision > 1) {
    warnings.push('Precision greater than 1 may cause slow performance');
  }

  // Validate max iterations
  if (config.maxIterations && config.maxIterations <= 0) {
    errors.push('Max iterations must be greater than 0');
  }
  
  if (config.maxIterations && config.maxIterations > 1000) {
    warnings.push('Max iterations greater than 1000 may cause performance issues');
  }

  // Performance warnings
  if (config.min < 6) {
    warnings.push('Very small minimum font size may impact readability');
  }
  
  if (config.max > 100) {
    warnings.push('Very large maximum font size may cause layout issues');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Normalizes and applies defaults to dynamic font size configuration
 */
function normalizeDynamicConfig(config: Partial<DynamicFontSizeConfig>): DynamicFontSizeConfig {
  return {
    min: config.min ?? DEFAULT_DYNAMIC_MIN_FONT_SIZE,
    max: config.max ?? DEFAULT_DYNAMIC_MAX_FONT_SIZE,
    fit: config.fit ?? DEFAULT_DYNAMIC_FIT,
    algorithm: config.algorithm ?? 'iterative',
    precision: config.precision ?? FONT_SIZE_ADJUSTMENT,
    maxIterations: config.maxIterations ?? MAX_DYNAMIC_FONT_ITERATIONS,
    enableCaching: config.enableCaching ?? true,
  };
}

/**
 * ===========================================
 * CONSTRAINT CALCULATION
 * ===========================================
 */

/**
 * Calculates layout constraints for a given font size
 * 
 * @param text - Text content
 * @param fontKitFont - FontKit font instance
 * @param fontSize - Font size to test
 * @param schema - Text schema configuration
 * @param containerDimensions - Container dimensions in points
 * @returns Constraint calculation result
 */
async function calculateConstraints(
  text: string,
  fontKitFont: FontKitFont,
  fontSize: number,
  schema: TextSchema,
  containerDimensions: { width: number; height: number }
): Promise<{
  textWidth: number;
  textHeight: number;
  lineCount: number;
  fitsHorizontally: boolean;
  fitsVertically: boolean;
  overflowRatio: number;
}> { {
  const characterSpacing = schema.characterSpacing ?? DEFAULT_CHARACTER_SPACING;
  const lineHeight = schema.lineHeight ?? DEFAULT_LINE_HEIGHT;

  // Calculate values for line splitting
  const calcValues: WidthCalculationContext = {
    font: fontKitFont,
    fontSize,
    characterSpacing,
    boxWidth: containerDimensions.width,
  };

  // Split text into lines based on container width
  const paragraphs = text.split('\n');
  let allLines: string[] = [];
  
  for (const paragraph of paragraphs) {
    if (paragraph.trim() === '') {
      allLines.push('');
    } else {
      const lines = (await wrapText(paragraph, calcValues)).lines;
      allLines.push(...lines);
    }
  }

  // Calculate total dimensions
  const lineCount = allLines.length;
  const fontHeightInPt = heightOfFontAtSize(fontKitFont, fontSize);
  const textHeight = lineCount * fontHeightInPt * lineHeight;

  // Calculate maximum line width
  const maxLineWidth = Math.max(
    ...allLines.map(line => 
      widthOfTextAtSize(line, fontKitFont, fontSize, characterSpacing)
    )
  );

  // Check fit constraints
  const fitsHorizontally = maxLineWidth <= containerDimensions.width;
  const fitsVertically = textHeight <= containerDimensions.height;

  // Calculate overflow ratio for optimization
  const widthRatio = maxLineWidth / containerDimensions.width;
  const heightRatio = textHeight / containerDimensions.height;
  const overflowRatio = Math.max(widthRatio, heightRatio);

  return {
    textWidth: maxLineWidth,
    textHeight,
    lineCount,
    fitsHorizontally,
    fitsVertically,
    overflowRatio,
  };
}

/**
 * ===========================================
 * SIZING ALGORITHMS
 * ===========================================
 */

/**
 * Iterative refinement algorithm (default)
 * 
 * Gradually adjusts font size until optimal fit is found.
 * Most reliable but potentially slower for large ranges.
 */
async function calculateIterativeSize(
  text: string,
  fontKitFont: FontKitFont,
  schema: TextSchema,
  config: DynamicFontSizeConfig,
  containerDimensions: { width: number; height: number },
  startingSize?: number
): Promise<DynamicFontSizeResult> {
  const startTime = performance.now();
  let fontSize = startingSize ?? schema.fontSize ?? DEFAULT_FONT_SIZE;
  let iterations = 0;
  let lastDirection: 'grow' | 'shrink' | null = null;
  
  // Clamp to bounds
  fontSize = Math.max(config.min, Math.min(config.max, fontSize));

  while (iterations < config.maxIterations) {
    iterations++;
    
    const constraints = await calculateConstraints(
      text,
      fontKitFont,
      fontSize,
      schema,
      containerDimensions
    );

    const shouldFitHorizontally = config.fit === 'horizontal' || config.fit === 'vertical';
    const shouldFitVertically = config.fit === 'vertical' || config.fit === 'horizontal';
    
    const fitsRequired = 
      (!shouldFitHorizontally || constraints.fitsHorizontally) &&
      (!shouldFitVertically || constraints.fitsVertically);

    // Check if we've found the optimal size
    if (fitsRequired) {
      // Try to grow if we have room
      const nextSize = fontSize + config.precision;
      if (nextSize <= config.max) {
        const nextConstraints = await calculateConstraints(
          text,
          fontKitFont,
          nextSize,
          schema,
          containerDimensions
        );
        
        const nextFitsRequired = 
          (!shouldFitHorizontally || nextConstraints.fitsHorizontally) &&
          (!shouldFitVertically || nextConstraints.fitsVertically);
        
        if (nextFitsRequired) {
          fontSize = nextSize;
          lastDirection = 'grow';
          continue;
        }
      }
      
      // Current size is optimal
      break;
    } else {
      // Shrink if too large
      const nextSize = fontSize - config.precision;
      if (nextSize >= config.min) {
        fontSize = nextSize;
        lastDirection = 'shrink';
      } else {
        // Can't shrink further, use minimum
        fontSize = config.min;
        break;
      }
    }
    
    // Prevent oscillation
    if (iterations > 10 && lastDirection === 'grow') {
      fontSize -= config.precision;
      break;
    }
  }

  const finalConstraints = calculateConstraints(
    text,
    fontKitFont,
    fontSize,
    schema,
    containerDimensions
  );

  return {
    fontSize,
    iterations,
    converged: iterations < config.maxIterations,
    finalDimensions: {
      width: finalConstraints.textWidth,
      height: finalConstraints.textHeight,
      lineCount: finalConstraints.lineCount,
    },
    performance: {
      calculationTime: performance.now() - startTime,
      wasCached: false,
    },
  };
}

/**
 * Binary search algorithm for faster convergence
 * 
 * Uses binary search to quickly find optimal font size.
 * Faster than iterative for large ranges but may be less precise.
 */
async function calculateBinarySize(
  text: string,
  fontKitFont: FontKitFont,
  schema: TextSchema,
  config: DynamicFontSizeConfig,
  containerDimensions: { width: number; height: number }
): Promise<DynamicFontSizeResult> {
  const startTime = performance.now();
  let minSize = config.min;
  let maxSize = config.max;
  let fontSize = (minSize + maxSize) / 2;
  let iterations = 0;
  
  while (maxSize - minSize > config.precision && iterations < config.maxIterations) {
    iterations++;
    
    const constraints = await calculateConstraints(
      text,
      fontKitFont,
      fontSize,
      schema,
      containerDimensions
    );

    const shouldFitHorizontally = config.fit === 'horizontal' || config.fit === 'vertical';
    const shouldFitVertically = config.fit === 'vertical' || config.fit === 'horizontal';
    
    const fitsRequired = 
      (!shouldFitHorizontally || constraints.fitsHorizontally) &&
      (!shouldFitVertically || constraints.fitsVertically);

    if (fitsRequired) {
      // Text fits, try larger size
      minSize = fontSize;
      fontSize = (fontSize + maxSize) / 2;
    } else {
      // Text doesn't fit, try smaller size
      maxSize = fontSize;
      fontSize = (minSize + fontSize) / 2;
    }
  }

  const finalConstraints = calculateConstraints(
    text,
    fontKitFont,
    fontSize,
    schema,
    containerDimensions
  );

  return {
    fontSize,
    iterations,
    converged: maxSize - minSize <= config.precision,
    finalDimensions: {
      width: finalConstraints.textWidth,
      height: finalConstraints.textHeight,
      lineCount: finalConstraints.lineCount,
    },
    performance: {
      calculationTime: performance.now() - startTime,
      wasCached: false,
    },
  };
}

/**
 * Linear approximation algorithm for real-time performance
 * 
 * Uses linear approximation to quickly estimate optimal size.
 * Fastest but least accurate, good for real-time previews.
 */
async function calculateLinearSize(
  text: string,
  fontKitFont: FontKitFont,
  schema: TextSchema,
  config: DynamicFontSizeConfig,
  containerDimensions: { width: number; height: number }
): Promise<DynamicFontSizeResult> {
  const startTime = performance.now();
  
  // Sample at min and max sizes to create linear approximation
  const minConstraints = await calculateConstraints(
    text,
    fontKitFont,
    config.min,
    schema,
    containerDimensions
  );
  
  const maxConstraints = await calculateConstraints(
    text,
    fontKitFont,
    config.max,
    schema,
    containerDimensions
  );

  // Linear interpolation based on overflow ratio
  let targetRatio = 1.0; // Perfect fit
  let fontSize: number;
  
  if (config.fit === 'horizontal') {
    const minRatio = minConstraints.textWidth / containerDimensions.width;
    const maxRatio = maxConstraints.textWidth / containerDimensions.width;
    
    if (minRatio <= targetRatio) {
      fontSize = config.max; // Max size fits
    } else if (maxRatio >= targetRatio) {
      fontSize = config.min; // Min size doesn't fit
    } else {
      // Linear interpolation
      const t = (targetRatio - minRatio) / (maxRatio - minRatio);
      fontSize = config.min + t * (config.max - config.min);
    }
  } else {
    // Vertical fitting
    const minRatio = minConstraints.textHeight / containerDimensions.height;
    const maxRatio = maxConstraints.textHeight / containerDimensions.height;
    
    if (minRatio <= targetRatio) {
      fontSize = config.max;
    } else if (maxRatio >= targetRatio) {
      fontSize = config.min;
    } else {
      const t = (targetRatio - minRatio) / (maxRatio - minRatio);
      fontSize = config.min + t * (config.max - config.min);
    }
  }

  // Clamp to bounds
  fontSize = Math.max(config.min, Math.min(config.max, fontSize));

  const finalConstraints = calculateConstraints(
    text,
    fontKitFont,
    fontSize,
    schema,
    containerDimensions
  );

  return {
    fontSize,
    iterations: 2, // Only sampled min and max
    converged: true, // Always converges
    finalDimensions: {
      width: finalConstraints.textWidth,
      height: finalConstraints.textHeight,
      lineCount: finalConstraints.lineCount,
    },
    performance: {
      calculationTime: performance.now() - startTime,
      wasCached: false,
    },
  };
}

/**
 * ===========================================
 * CACHING SYSTEM
 * ===========================================
 */

/** Cache for dynamic size calculations */
const dynamicSizeCache = new Map<string, DynamicFontSizeResult>();

/**
 * Generates cache key for dynamic size calculations
 */
function generateDynamicCacheKey(
  text: string,
  schema: TextSchema,
  config: DynamicFontSizeConfig,
  containerDimensions: { width: number; height: number }
): string {
  const textHash = btoa(text.slice(0, 100)).slice(0, 16); // Hash first 100 chars
  const schemaKey = `${schema.fontSize}-${schema.characterSpacing}-${schema.lineHeight}`;
  const configKey = `${config.min}-${config.max}-${config.fit}-${config.algorithm}`;
  const dimensionsKey = `${containerDimensions.width}x${containerDimensions.height}`;
  
  return `${textHash}-${schemaKey}-${configKey}-${dimensionsKey}`;
}

/**
 * ===========================================
 * MAIN CALCULATION FUNCTION
 * ===========================================
 */

/**
 * Calculates optimal font size using dynamic sizing algorithms
 * 
 * @param params - Calculation parameters
 * @returns Promise resolving to dynamic font size result
 */
export async function calculateDynamicFontSize(params: {
  textSchema: TextSchema;
  fontKitFont: FontKitFont;
  value: string;
  containerDimensions: { width: number; height: number };
  startingFontSize?: number;
}): Promise<DynamicFontSizeResult> {
  const { textSchema, fontKitFont, value, containerDimensions, startingFontSize } = params;
  
  if (!textSchema.dynamicFontSize) {
    // Return current font size if dynamic sizing not enabled
    return {
      fontSize: textSchema.fontSize ?? DEFAULT_FONT_SIZE,
      iterations: 0,
      converged: true,
      finalDimensions: { width: 0, height: 0, lineCount: 1 },
      performance: { calculationTime: 0, wasCached: false },
    };
  }

  const config = normalizeDynamicConfig(textSchema.dynamicFontSize);
  
  // Validate configuration
  const validation = validateDynamicConfig(config);
  if (!validation.isValid) {
    throw new Error(`Invalid dynamic font config: ${validation.errors.join(', ')}`);
  }

  // Check cache if enabled
  if (config.enableCaching) {
    const cacheKey = generateDynamicCacheKey(value, textSchema, config, containerDimensions);
    const cached = dynamicSizeCache.get(cacheKey);
    if (cached) {
      return {
        ...cached,
        performance: {
          ...cached.performance,
          wasCached: true,
        },
      };
    }
  }

  // Choose algorithm based on text length and performance requirements
  let algorithm = config.algorithm;
  if (value.length > REALTIME_SIZING_THRESHOLD) {
    // Use faster algorithm for large texts
    algorithm = algorithm === 'iterative' ? 'binary' : algorithm;
  }

  // Calculate using selected algorithm
  let result: DynamicFontSizeResult;
  
  switch (algorithm) {
    case 'binary':
      result = await calculateBinarySize(value, fontKitFont, textSchema, config, containerDimensions);
      break;
      
    case 'linear':
      result = await calculateLinearSize(value, fontKitFont, textSchema, config, containerDimensions);
      break;
      
    case 'iterative':
    default:
      result = await calculateIterativeSize(value, fontKitFont, textSchema, config, containerDimensions, startingFontSize);
      break;
  }

  // Cache result if enabled
  if (config.enableCaching) {
    const cacheKey = generateDynamicCacheKey(value, textSchema, config, containerDimensions);
    dynamicSizeCache.set(cacheKey, result);
    
    // Limit cache size
    if (dynamicSizeCache.size > 100) {
      const firstKey = dynamicSizeCache.keys().next().value;
      dynamicSizeCache.delete(firstKey);
    }
  }

  return result;
}

/**
 * ===========================================
 * UTILITY FUNCTIONS
 * ===========================================
 */

/**
 * Gets constraint information for debugging
 */
export function getDynamicSizeConstraints(
  text: string,
  fontKitFont: FontKitFont,
  fontSize: number,
  schema: TextSchema,
  containerDimensions: { width: number; height: number }
): ReturnType<typeof calculateConstraints> {
  return calculateConstraints(text, fontKitFont, fontSize, schema, containerDimensions);
}

/**
 * Optimizes dynamic calculation settings based on text characteristics
 */
export function optimizeDynamicCalculation(
  text: string,
  currentConfig: DynamicFontSizeConfig
): DynamicFontSizeConfig {
  const optimized = { ...currentConfig };
  
  // Adjust precision based on text length
  if (text.length > REALTIME_SIZING_THRESHOLD) {
    optimized.precision = Math.max(0.5, optimized.precision ?? FONT_SIZE_ADJUSTMENT);
    optimized.algorithm = 'binary'; // Faster for large texts
  } else {
    optimized.precision = 0.25; // Higher precision for small texts
  }
  
  // Adjust max iterations based on size range
  const sizeRange = optimized.max - optimized.min;
  if (sizeRange > 50) {
    optimized.maxIterations = Math.min(200, optimized.maxIterations ?? MAX_DYNAMIC_FONT_ITERATIONS);
  } else {
    optimized.maxIterations = 50; // Fewer iterations for small ranges
  }
  
  return optimized;
}

/**
 * Clears the dynamic sizing cache
 */
export function clearDynamicSizeCache(): void {
  dynamicSizeCache.clear();
}

/**
 * Gets cache statistics for monitoring
 */
export function getDynamicSizeCacheStats(): {
  entryCount: number;
  hitRate: number;
  averageCalculationTime: number;
} {
  const entries = Array.from(dynamicSizeCache.values());
  const totalTime = entries.reduce((sum, entry) => sum + entry.performance.calculationTime, 0);
  const avgTime = entries.length > 0 ? totalTime / entries.length : 0;
  
  return {
    entryCount: dynamicSizeCache.size,
    hitRate: 0, // Would need to track hits/misses separately
    averageCalculationTime: avgTime,
  };
}
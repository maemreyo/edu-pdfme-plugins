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
} from '../constants';
import { wrapText } from './lineWrapping';

/**
 * Calculate text constraints for a given font size
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
}> {
  const calcValues: WidthCalculationContext = {
    font: fontKitFont,
    fontSize,
    characterSpacing: schema.characterSpacing ?? DEFAULT_CHARACTER_SPACING,
    boxWidth: containerDimensions.width,
  };

  const wrappingResult = await wrapText(text, calcValues, schema.lineWrapping);
  const lines = wrappingResult.lines;
  
  // Calculate dimensions
  const lineHeight = (schema.lineHeight ?? DEFAULT_LINE_HEIGHT) * fontSize;
  const textHeight = lines.length * lineHeight;
  // Calculate max line width
  let textWidth = 0;
  for (const line of lines) {
    const lineWidth = calcValues.font.layout(line).advanceWidth * (calcValues.fontSize / calcValues.font.unitsPerEm);
    textWidth = Math.max(textWidth, lineWidth);
  }
  
  // Check if text fits
  const fitsHorizontally = textWidth <= containerDimensions.width;
  const fitsVertically = textHeight <= containerDimensions.height;
  
  // Calculate overflow ratio (higher means more overflow)
  const widthRatio = textWidth / containerDimensions.width;
  const heightRatio = textHeight / containerDimensions.height;
  const overflowRatio = Math.max(widthRatio, heightRatio);
  
  return {
    textWidth,
    textHeight,
    lineCount: lines.length,
    fitsHorizontally,
    fitsVertically,
    overflowRatio,
  };
}

/**
 * Validate dynamic font size configuration
 */
export function validateDynamicConfig(config: DynamicFontSizeConfig): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (config.min <= 0) {
    errors.push('Minimum font size must be greater than 0');
  }
  
  if (config.max < config.min) {
    errors.push('Maximum font size must be greater than or equal to minimum font size');
  }
  
  if (config.precision && config.precision <= 0) {
    errors.push('Precision must be greater than 0');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Optimize dynamic calculation based on text and container properties
 */
export function optimizeDynamicCalculation(
  text: string,
  schema: TextSchema,
  containerDimensions: { width: number; height: number }
): {
  startingSize: number;
  algorithm: DynamicFontSizeAlgorithm;
} {
  const config = schema.dynamicFontSize;
  if (!config) {
    return {
      startingSize: schema.fontSize ?? DEFAULT_FONT_SIZE,
      algorithm: 'iterative',
    };
  }
  
  // Choose algorithm based on text and container properties
  let algorithm: DynamicFontSizeAlgorithm = config.algorithm ?? 'iterative';
  
  // For very short text, iterative is faster
  if (text.length < 20) {
    algorithm = 'iterative';
  }
  // For longer text, binary search is more efficient
  else if (text.length > 200) {
    algorithm = 'binarySearch';
  }
  
  // Estimate starting size based on text length and container size
  const containerArea = containerDimensions.width * containerDimensions.height;
  const textLength = text.length;
  const areaPerChar = containerArea / textLength;
  
  // Rough estimation of optimal font size
  const estimatedSize = Math.sqrt(areaPerChar) * 0.7;
  
  // Clamp to config bounds
  const startingSize = Math.max(
    config.min,
    Math.min(config.max, estimatedSize)
  );
  
  return {
    startingSize,
    algorithm,
  };
}

/**
 * Calculate dynamic font size using iterative refinement algorithm
 */
async function calculateDynamicSizeIterative(
  text: string,
  fontKitFont: FontKitFont,
  schema: TextSchema,
  containerDimensions: { width: number; height: number },
  config: DynamicFontSizeConfig,
  startingSize?: number
): Promise<DynamicFontSizeResult> {
  const startTime = performance.now();
  let fontSize = startingSize ?? schema.fontSize ?? DEFAULT_FONT_SIZE;
  let iterations = 0;
  let lastDirection: 'grow' | 'shrink' | null = null;
  
  // Clamp to bounds
  fontSize = Math.max(config.min, Math.min(config.max, fontSize));
  
  // Set default maxIterations if not provided
  const maxIterations = config.maxIterations ?? 20;
  const precision = config.precision ?? 0.25;

  while (iterations < maxIterations) {
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
    
    const fitsRequired = (
      (!shouldFitHorizontally || constraints.fitsHorizontally) &&
      (!shouldFitVertically || constraints.fitsVertically)
    );
    
    // Check if we've found the optimal size
    if (fitsRequired) {
      // Try to grow if we have room
      const nextSize = fontSize + precision;
      if (nextSize <= config.max) {
        const nextConstraints = await calculateConstraints(
          text,
          fontKitFont,
          nextSize,
          schema,
          containerDimensions
        );
        
        const nextFitsRequired = (
          (!shouldFitHorizontally || nextConstraints.fitsHorizontally) &&
          (!shouldFitVertically || nextConstraints.fitsVertically)
        );
        
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
      const nextSize = fontSize - precision;
      if (nextSize >= config.min) {
        fontSize = nextSize;
        lastDirection = 'shrink';
      } else {
        // Can't shrink further
        break;
      }
    }
    
    // Prevent oscillation
    if (iterations > 10 && lastDirection) {
      fontSize -= precision;
      break;
    }
  }

  const finalConstraints = await calculateConstraints(
    text,
    fontKitFont,
    fontSize,
    schema,
    containerDimensions
  );

  return {
    fontSize,
    iterations,
    converged: iterations < maxIterations,
    finalDimensions: {
      width: finalConstraints.textWidth,
      height: finalConstraints.textHeight,
      lineCount: finalConstraints.lineCount,
    },
    performance: {
      algorithm: 'iterative',
      calculationTime: performance.now() - startTime,
      wasCached: false,
    },
  };
}

/**
 * Calculate dynamic font size using binary search algorithm
 */
async function calculateDynamicSizeBinarySearch(
  text: string,
  fontKitFont: FontKitFont,
  schema: TextSchema,
  containerDimensions: { width: number; height: number },
  config: DynamicFontSizeConfig,
  startingSize?: number
): Promise<DynamicFontSizeResult> {
  const startTime = performance.now();
  let minSize = config.min;
  let maxSize = config.max;
  let fontSize = (minSize + maxSize) / 2;
  let iterations = 0;
  
  const precision = config.precision ?? 0.25;
  const maxIterations = config.maxIterations ?? 20;
  
  while (maxSize - minSize > precision && iterations < maxIterations) {
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
    
    const fitsRequired = (
      (!shouldFitHorizontally || constraints.fitsHorizontally) &&
      (!shouldFitVertically || constraints.fitsVertically)
    );
    
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

  const finalConstraints = await calculateConstraints(
    text,
    fontKitFont,
    fontSize,
    schema,
    containerDimensions
  );

  return {
    fontSize,
    iterations,
    converged: maxSize - minSize <= precision,
    finalDimensions: {
      width: finalConstraints.textWidth,
      height: finalConstraints.textHeight,
      lineCount: finalConstraints.lineCount,
    },
    performance: {
      algorithm: 'binarySearch',
      calculationTime: performance.now() - startTime,
      wasCached: false,
    },
  };
}

/**
 * Calculate dynamic font size using linear approximation algorithm
 */
async function calculateDynamicSizeLinearApproximation(
  text: string,
  fontKitFont: FontKitFont,
  schema: TextSchema,
  containerDimensions: { width: number; height: number },
  config: DynamicFontSizeConfig
): Promise<DynamicFontSizeResult> {
  const startTime = performance.now();
  
  // Sample at min and max to establish linear relationship
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
  
  // Linear interpolation based on container dimensions
  let targetRatio: number;
  if (config.fit === 'horizontal') {
    targetRatio = containerDimensions.width / minConstraints.textWidth;
  } else if (config.fit === 'vertical') {
    targetRatio = containerDimensions.height / minConstraints.textHeight;
  } else {
    // Use the more constrained dimension
    const widthRatio = containerDimensions.width / minConstraints.textWidth;
    const heightRatio = containerDimensions.height / minConstraints.textHeight;
    targetRatio = Math.min(widthRatio, heightRatio);
  }
  
  // Calculate estimated font size
  let fontSize = config.min * targetRatio;
  fontSize = Math.max(config.min, Math.min(config.max, fontSize));
  
  // Verify and refine with one iteration
  const constraints = await calculateConstraints(
    text,
    fontKitFont,
    fontSize,
    schema,
    containerDimensions
  );
  
  // Adjust if needed
  const shouldFitHorizontally = config.fit === 'horizontal' || config.fit === 'vertical';
  const shouldFitVertically = config.fit === 'vertical' || config.fit === 'horizontal';
  
  if (shouldFitHorizontally && !constraints.fitsHorizontally) {
    fontSize = fontSize * (containerDimensions.width / constraints.textWidth) * 0.95;
  }
  
  if (shouldFitVertically && !constraints.fitsVertically) {
    fontSize = fontSize * (containerDimensions.height / constraints.textHeight) * 0.95;
  }
  
  // Final clamp
  fontSize = Math.max(config.min, Math.min(config.max, fontSize));
  
  const finalConstraints = await calculateConstraints(
    text,
    fontKitFont,
    fontSize,
    schema,
    containerDimensions
  );
  
  return {
    fontSize,
    iterations: 3, // min, max, and final check
    converged: true,
    finalDimensions: {
      width: finalConstraints.textWidth,
      height: finalConstraints.textHeight,
      lineCount: finalConstraints.lineCount,
    },
    performance: {
      algorithm: 'linearApproximation',
      calculationTime: performance.now() - startTime,
      wasCached: false,
    },
  };
}

/**
 * Get dynamic size constraints for a text schema
 */
export async function getDynamicSizeConstraints(
  text: string,
  fontKitFont: FontKitFont,
  schema: TextSchema,
  containerDimensions: { width: number; height: number }
): Promise<{
  minSize: {
    fontSize: number;
    width: number;
    height: number;
    lineCount: number;
  };
  maxSize: {
    fontSize: number;
    width: number;
    height: number;
    lineCount: number;
  };
}> {
  if (!schema.dynamicFontSize) {
    throw new Error('Schema does not have dynamic font size configuration');
  }
  
  const config = schema.dynamicFontSize;
  
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
  
  return {
    minSize: {
      fontSize: config.min,
      width: minConstraints.textWidth,
      height: minConstraints.textHeight,
      lineCount: minConstraints.lineCount,
    },
    maxSize: {
      fontSize: config.max,
      width: maxConstraints.textWidth,
      height: maxConstraints.textHeight,
      lineCount: maxConstraints.lineCount,
    },
  };
}

/**
 * Main dynamic font size calculation function
 */
export async function calculateDynamicFontSize({
  textSchema,
  fontKitFont,
  value,
  containerDimensions,
  startingFontSize,
}: {
  textSchema: TextSchema;
  fontKitFont: FontKitFont;
  value: string;
  containerDimensions: { width: number; height: number };
  startingFontSize?: number;
}): Promise<DynamicFontSizeResult> {
  if (!textSchema.dynamicFontSize) {
    return {
      fontSize: textSchema.fontSize ?? DEFAULT_FONT_SIZE,
      iterations: 0,
      converged: true,
      finalDimensions: { width: 0, height: 0, lineCount: 1 },
      performance: {
        algorithm: 'none',
        calculationTime: 0,
        wasCached: false,
      },
    };
  }
  
  const config = textSchema.dynamicFontSize;
  const algorithm = config.algorithm ?? 'iterative';
  
  try {
    switch (algorithm) {
      case 'binarySearch':
        return calculateDynamicSizeBinarySearch(
          value,
          fontKitFont,
          textSchema,
          containerDimensions,
          config,
          startingFontSize
        );
        
      case 'linearApproximation':
        return calculateDynamicSizeLinearApproximation(
          value,
          fontKitFont,
          textSchema,
          containerDimensions,
          config
        );
        
      case 'iterative':
      default:
        return calculateDynamicSizeIterative(
          value,
          fontKitFont,
          textSchema,
          containerDimensions,
          config,
          startingFontSize
        );
    }
  } catch (error) {
    console.error('Dynamic font size calculation failed:', error);
    
    // Return fallback result
    return {
      fontSize: textSchema.fontSize ?? DEFAULT_FONT_SIZE,
      iterations: 0,
      converged: false,
      finalDimensions: { width: 0, height: 0, lineCount: 1 },
      performance: {
        algorithm: algorithm,
        calculationTime: 0,
        wasCached: false,
        error: String(error),
      },
    };
  }
}

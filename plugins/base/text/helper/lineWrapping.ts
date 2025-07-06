/**
 * Advanced Line Wrapping Module for Text Plugin
 * 
 * This module implements sophisticated text wrapping algorithms with:
 * - Intl.Segmenter integration for proper word boundaries
 * - Japanese Kinsoku Shori (禁則処理) typography rules
 * - Multi-language support with locale-aware breaking
 * - Performance optimization for large texts
 * - Customizable breaking strategies
 * - Hyphenation support (future enhancement)
 * 
 * The module handles complex typography rules to ensure professional
 * text layout that respects cultural and linguistic conventions.
 */

import type { Font as FontKitFont } from 'fontkit';
import type {
  WidthCalculationContext,
  LineWrappingConfig,
  LineWrappingGranularity,
} from '../types';

import {
  LINE_START_FORBIDDEN_CHARS,
  LINE_END_FORBIDDEN_CHARS,
  DEFAULT_LINE_WRAPPING_CONFIG,
} from '../constants';

import * as FontMetrics from './fontMetrics';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface SegmentInfo {
  text: string;
  width: number;
  isBreakable: boolean;
  isWhitespace: boolean;
  language?: string;
  script?: string;
}

interface LineInfo {
  text: string;
  width: number;
  segments: SegmentInfo[];
  canBreakAfter: boolean;
  canBreakBefore: boolean;
}

interface WrappingContext {
  font: FontKitFont;
  fontSize: number;
  characterSpacing: number;
  maxWidth: number;
  config: LineWrappingConfig;
  locale: string;
}

interface JapaneseRuleResult {
  lines: string[];
  rulesApplied: number;
  processingTime: number;
}

// =============================================================================
// GLOBAL STATE
// =============================================================================

let segmenterCache: Map<string, Intl.Segmenter> = new Map();
let performanceMetrics = {
  totalWraps: 0,
  totalTime: 0,
  japaneseRulesApplied: 0,
  segmenterUsage: 0,
};

// =============================================================================
// MODULE INITIALIZATION
// =============================================================================

/**
 * Initialize the line wrapping module
 */
export function initialize(): void {
  // Pre-cache common segmenters
  const commonLocales = ['en-US', 'ja-JP', 'ko-KR', 'zh-CN'];
  
  commonLocales.forEach(locale => {
    try {
      if (typeof Intl.Segmenter !== 'undefined') {
        segmenterCache.set(locale, new Intl.Segmenter(locale, { granularity: 'word' }));
      }
    } catch (error) {
      console.warn(`Failed to create segmenter for locale ${locale}:`, error);
    }
  });
}

/**
 * Clear segmenter cache and reset metrics
 */
export function clearCache(): void {
  segmenterCache.clear();
  performanceMetrics = {
    totalWraps: 0,
    totalTime: 0,
    japaneseRulesApplied: 0,
    segmenterUsage: 0,
  };
}

// =============================================================================
// MAIN WRAPPING API
// =============================================================================

/**
 * Wrap text using advanced line breaking algorithms
 */
export async function wrapText(
  text: string,
  calcValues: WidthCalculationContext,
  config: LineWrappingConfig = DEFAULT_LINE_WRAPPING_CONFIG
): Promise<{ lines: string[]; japaneseRulesApplied: boolean; processingTime: number; stats: { originalLength: number; processedLength: number; lineCount: number; averageLineLength: number; }; }> {
  const startTime = performance.now();
  
  try {
    // Handle edge cases
    if (!text || text.trim() === '') {
      return createEmptyResult(startTime);
    }

    // Detect content characteristics
    const hasJapanese = config.japaneseRules && containsJapanese(text);
    const hasComplexScript = containsComplexScript(text);

    // Choose wrapping strategy
    let lines: string[];
    let rulesApplied = 0;

    if (hasJapanese) {
      // Use Japanese-aware wrapping
      lines = await wrapWithJapaneseRules(text, calcValues, config);
      rulesApplied++;
      performanceMetrics.japaneseRulesApplied++;
    } else if (hasComplexScript) {
      // Use complex script wrapping
      lines = await wrapWithComplexScript(text, calcValues, config);
    } else if (config.granularity === 'word' && typeof Intl.Segmenter !== 'undefined') {
      // Use modern segmenter-based wrapping
      lines = await wrapWithSegmenter(text, calcValues, config);
      performanceMetrics.segmenterUsage++;
    } else {
      // Fall back to simple wrapping
      lines = wrapWithSimpleAlgorithm(text, calcValues, config);
    }

    // Post-process lines
    lines = postProcessLines(lines, config);

    // Calculate statistics
    const stats = calculateLineStats(text, lines);
    const processingTime = performance.now() - startTime;

    // Update performance metrics
    performanceMetrics.totalWraps++;
    performanceMetrics.totalTime += processingTime;

    return {
      lines,
      japaneseRulesApplied: rulesApplied > 0,
      processingTime,
      stats,
    };

  } catch (error) {
    console.warn('Line wrapping failed, using fallback:', error);
    
    // Fallback to simple splitting
    const fallbackLines = text.split(' ').reduce((lines, word, index) => {
      if (index === 0) {
        lines.push(word);
      } else {
        const lastLine = lines[lines.length - 1];
        const testLine = lastLine + ' ' + word;
        const width = FontMetrics.widthOfTextAtSize(
          testLine, 
          calcValues.font, 
          calcValues.fontSize, 
          calcValues.characterSpacing
        );
        
        if (width <= calcValues.boxWidth) {
          lines[lines.length - 1] = testLine;
        } else {
          lines.push(word);
        }
      }
      return lines;
    }, [] as string[]);

    return {
      lines: fallbackLines,
      japaneseRulesApplied: false,
      processingTime: performance.now() - startTime,
      stats: calculateLineStats(text, fallbackLines),
    };
  }
}

// =============================================================================
// SEGMENTER-BASED WRAPPING
// =============================================================================

/**
 * Wrap text using Intl.Segmenter for precise word boundaries
 */
async function wrapWithSegmenter(
  text: string,
  calcValues: WidthCalculationContext,
  config: LineWrappingConfig
): Promise<string[]> {
  const segmenter = getSegmenter(config.locale || 'en-US', config.granularity);
  
  if (!segmenter) {
    return wrapWithSimpleAlgorithm(text, calcValues, config);
  }

  const segments = Array.from(segmenter.segment(text.trimEnd()));
  const lines: string[] = [];
  let currentLine = '';
  let currentWidth = 0;

  for (const segment of segments) {
    const segmentText = segment.segment;
    const segmentWidth = FontMetrics.widthOfTextAtSize(
      segmentText,
      calcValues.font,
      calcValues.fontSize,
      calcValues.characterSpacing
    );

    // Check if adding this segment would exceed width
    if (currentWidth + segmentWidth <= calcValues.boxWidth) {
      currentLine += segmentText;
      currentWidth += segmentWidth;
    } else if (segmentText.trim() === '') {
      // Handle whitespace that overflows - start new line
      if (currentLine.trim()) {
        lines.push(currentLine.trimEnd());
      }
      currentLine = '';
      currentWidth = 0;
    } else if (segmentWidth <= calcValues.boxWidth) {
      // Start new line with this segment
      if (currentLine.trim()) {
        lines.push(currentLine.trimEnd());
      }
      currentLine = segmentText;
      currentWidth = segmentWidth;
    } else {
      // Segment is too large - need character-level breaking
      if (currentLine.trim()) {
        lines.push(currentLine.trimEnd());
        currentLine = '';
        currentWidth = 0;
      }
      
      const charLines = breakLongSegment(segmentText, calcValues);
      lines.push(...charLines.slice(0, -1));
      currentLine = charLines[charLines.length - 1] || '';
      currentWidth = FontMetrics.widthOfTextAtSize(
        currentLine,
        calcValues.font,
        calcValues.fontSize,
        calcValues.characterSpacing
      );
    }
  }

  // Add final line if not empty
  if (currentLine.trim()) {
    lines.push(currentLine.trimEnd());
  }

  return adjustEndOfLine(lines);
}

// =============================================================================
// JAPANESE TYPOGRAPHY RULES (KINSOKU SHORI)
// =============================================================================

/**
 * Wrap text with Japanese typography rules (Kinsoku Shori)
 */
async function wrapWithJapaneseRules(
  text: string,
  calcValues: WidthCalculationContext,
  config: LineWrappingConfig
): Promise<string[]> {
  // First pass: Use segmenter-based wrapping
  const baseConfig = { ...config, japaneseRules: false };
  let lines = await wrapWithSegmenter(text, calcValues, baseConfig);

  // Second pass: Apply Japanese rules
  if (lines.some(containsJapanese)) {
    lines = filterStartJP(lines);
    lines = filterEndJP(lines);
  }

  return lines;
}

/**
 * Apply Japanese line start rules (行頭禁則)
 */
function filterStartJP(lines: string[]): string[] {
  const filtered: string[] = [];
  let charToAppend: string | null = null;

  // Process lines in reverse order for proper character flow
  lines.slice().reverse().forEach((line) => {
    if (line.trim().length === 0) {
      filtered.push('');
      return;
    }

    const charAtStart = line.charAt(0);
    
    if (LINE_START_FORBIDDEN_CHARS.includes(charAtStart)) {
      if (line.trim().length === 1) {
        // Single forbidden character - keep as is
        filtered.push(line);
        charToAppend = null;
      } else {
        // Move forbidden character to previous line
        const lineWithoutFirst = line.slice(1);
        if (charToAppend) {
          filtered.push(lineWithoutFirst + charToAppend);
        } else {
          filtered.push(lineWithoutFirst);
        }
        charToAppend = charAtStart;
      }
    } else {
      // Normal character at start
      if (charToAppend) {
        filtered.push(line + charToAppend);
        charToAppend = null;
      } else {
        filtered.push(line);
      }
    }
  });

  // Handle remaining character
  if (charToAppend && filtered.length > 0) {
    const firstItem = filtered[0] || '';
    const combinedItem = String(charToAppend) + String(firstItem);
    return [combinedItem, ...filtered.slice(1)].reverse();
  }

  return filtered.reverse();
}

/**
 * Apply Japanese line end rules (行末禁則)
 */
function filterEndJP(lines: string[]): string[] {
  const filtered: string[] = [];
  let charToPrepend: string | null = null;

  lines.forEach((line) => {
    if (line.trim().length === 0) {
      filtered.push('');
      return;
    }

    const charAtEnd = line.slice(-1);

    if (LINE_END_FORBIDDEN_CHARS.includes(charAtEnd)) {
      if (line.trim().length === 1) {
        // Single forbidden character - keep as is
        filtered.push(line);
        charToPrepend = null;
      } else {
        // Move forbidden character to next line
        const lineWithoutLast = line.slice(0, -1);
        if (charToPrepend) {
          filtered.push(charToPrepend + lineWithoutLast);
        } else {
          filtered.push(lineWithoutLast);
        }
        charToPrepend = charAtEnd;
      }
    } else {
      // Normal character at end
      if (charToPrepend) {
        filtered.push(charToPrepend + line);
        charToPrepend = null;
      } else {
        filtered.push(line);
      }
    }
  });

  // Handle remaining character
  if (charToPrepend && filtered.length > 0) {
    const lastItem = filtered[filtered.length - 1] || '';
    const combinedItem = String(lastItem) + String(charToPrepend);
    return [...filtered.slice(0, -1), combinedItem];
  }

  return filtered;
}

// =============================================================================
// COMPLEX SCRIPT SUPPORT
// =============================================================================

/**
 * Wrap text containing complex scripts (Arabic, Thai, etc.)
 */
async function wrapWithComplexScript(
  text: string,
  calcValues: WidthCalculationContext,
  config: LineWrappingConfig
): Promise<string[]> {
  // For complex scripts, we need to be more conservative
  // and rely on Unicode properties and grapheme clusters
  
  const segmenter = getSegmenter(config.locale || 'en-US', 'grapheme');
  
  if (!segmenter) {
    return wrapWithSimpleAlgorithm(text, calcValues, config);
  }

  const graphemes = Array.from(segmenter.segment(text));
  const lines: string[] = [];
  let currentLine = '';
  let currentWidth = 0;

  for (const grapheme of graphemes) {
    const char = grapheme.segment;
    const charWidth = FontMetrics.widthOfTextAtSize(
      char,
      calcValues.font,
      calcValues.fontSize,
      calcValues.characterSpacing
    );

    if (currentWidth + charWidth <= calcValues.boxWidth) {
      currentLine += char;
      currentWidth += charWidth;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = char;
      currentWidth = charWidth;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return adjustEndOfLine(lines);
}

// =============================================================================
// SIMPLE ALGORITHM FALLBACK
// =============================================================================

/**
 * Simple word-based wrapping algorithm for fallback
 */
function wrapWithSimpleAlgorithm(
  text: string,
  calcValues: WidthCalculationContext,
  config: LineWrappingConfig
): string[] {
  const lines: string[] = [];
  const words = text.split(/\s+/);
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine ? currentLine + ' ' + word : word;
    const width = FontMetrics.widthOfTextAtSize(
      testLine,
      calcValues.font,
      calcValues.fontSize,
      calcValues.characterSpacing
    );

    if (width <= calcValues.boxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      
      // Check if single word is too long
      const wordWidth = FontMetrics.widthOfTextAtSize(
        word,
        calcValues.font,
        calcValues.fontSize,
        calcValues.characterSpacing
      );
      
      if (wordWidth > calcValues.boxWidth) {
        // Break long word
        const brokenLines = breakLongSegment(word, calcValues);
        lines.push(...brokenLines.slice(0, -1));
        currentLine = brokenLines[brokenLines.length - 1] || '';
      } else {
        currentLine = word;
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return adjustEndOfLine(lines);
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Break a long segment that doesn't fit on a single line
 */
function breakLongSegment(
  segment: string,
  calcValues: WidthCalculationContext
): string[] {
  const lines: string[] = [];
  let currentLine = '';
  let currentWidth = 0;

  for (const char of segment) {
    const charWidth = FontMetrics.widthOfTextAtSize(
      char,
      calcValues.font,
      calcValues.fontSize,
      calcValues.characterSpacing
    );

    if (currentWidth + charWidth <= calcValues.boxWidth) {
      currentLine += char;
      currentWidth += charWidth;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = char;
      currentWidth = charWidth;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [segment];
}

/**
 * Get or create segmenter for locale and granularity
 */
function getSegmenter(
  locale: string,
  granularity: LineWrappingGranularity = 'word'
): Intl.Segmenter | null {
  if (typeof Intl.Segmenter === 'undefined') {
    return null;
  }

  const cacheKey = `${locale}-${granularity}`;
  
  if (!segmenterCache.has(cacheKey)) {
    try {
      const segmenter = new Intl.Segmenter(locale, { granularity });
      segmenterCache.set(cacheKey, segmenter);
    } catch (error) {
      console.warn(`Failed to create segmenter for ${cacheKey}:`, error);
      return null;
    }
  }

  return segmenterCache.get(cacheKey) || null;
}

/**
 * Adjust line endings and add newline to final line
 */
function adjustEndOfLine(lines: string[]): string[] {
  return lines.map((line, index) => {
    if (index === lines.length - 1) {
      return line.trimEnd() + '\n';
    } else {
      return line.trimEnd();
    }
  });
}

/**
 * Post-process lines based on configuration
 */
function postProcessLines(lines: string[], config: LineWrappingConfig): string[] {
  let processed = lines;

  // Remove empty lines if configured
  if (config.customBreakChars && config.customBreakChars.length === 0) {
    processed = processed.filter(line => line.trim().length > 0);
  }

  // Apply custom post-processing rules here
  // Future enhancement: hyphenation, advanced typography rules

  return processed;
}

/**
 * Calculate statistics for wrapped lines
 */
function calculateLineStats(originalText: string, lines: string[]): {
  originalLength: number;
  processedLength: number;
  lineCount: number;
  averageLineLength: number;
} {
  const processedText = lines.join('');
  const totalLength = lines.reduce((sum, line) => sum + line.length, 0);
  
  return {
    originalLength: originalText.length,
    processedLength: processedText.length,
    lineCount: lines.length,
    averageLineLength: lines.length > 0 ? totalLength / lines.length : 0,
  };
}

/**
 * Create empty result for edge cases
 */
function createEmptyResult(startTime: number): { lines: string[]; japaneseRulesApplied: boolean; processingTime: number; stats: { originalLength: number; processedLength: number; lineCount: number; averageLineLength: number; }; } {
  return {
    lines: [''],
    japaneseRulesApplied: false,
    processingTime: performance.now() - startTime,
    stats: {
      originalLength: 0,
      processedLength: 0,
      lineCount: 1,
      averageLineLength: 0,
    },
  };
}

// =============================================================================
// CHARACTER DETECTION FUNCTIONS
// =============================================================================

/**
 * Check if text contains Japanese characters
 */
export function containsJapanese(text: string): boolean {
  return JAPANESE_CHAR_REGEX.test(text);
}

/**
 * Check if text contains complex scripts requiring special handling
 */
export function containsComplexScript(text: string): boolean {
  return containsRTL(text) || 
         /[\u0E00-\u0E7F]/.test(text) || // Thai
         /[\u1000-\u109F]/.test(text) || // Myanmar
         /[\u1780-\u17FF]/.test(text);   // Khmer
}

/**
 * Detect the primary script of text
 */
export function detectPrimaryScript(text: string): string {
  if (JAPANESE_CHAR_REGEX.test(text)) return 'japanese';
  if (/[\uAC00-\uD7AF]/.test(text)) return 'korean'; // Hangul
  if (/[\u4E00-\u9FFF]/.test(text)) return 'chinese'; // CJK Unified Ideographs
  if (containsRTL(text)) return 'rtl';
  return 'latin';
}

function containsRTL(text: string): boolean {
  return /[֐-׿؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/.test(text);
}

// =============================================================================
// PERFORMANCE MONITORING
// =============================================================================

/**
 * Get performance metrics for line wrapping
 */
export function getPerformanceMetrics(): typeof performanceMetrics {
  return { ...performanceMetrics };
}

/**
 * Reset performance metrics
 */
export function resetPerformanceMetrics(): void {
  performanceMetrics = {
    totalWraps: 0,
    totalTime: 0,
    japaneseRulesApplied: 0,
    segmenterUsage: 0,
  };
}

/**
 * Get segmenter cache statistics
 */
export function getSegmenterCacheStats(): {
  size: number;
  locales: string[];
  supported: boolean;
} {
  return {
    size: segmenterCache.size,
    locales: Array.from(segmenterCache.keys()),
    supported: typeof Intl.Segmenter !== 'undefined',
  };
}
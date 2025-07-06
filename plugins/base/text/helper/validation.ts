/**
 * Text Validation and Analysis Module for Text Plugin
 * 
 * This module provides comprehensive text validation, analysis, and sanitization:
 * - Content validation against schema rules
 * - Character support detection and replacement
 * - Text complexity analysis
 * - Security sanitization (XSS prevention)
 * - Performance impact assessment
 * - Accessibility compliance checking
 * - Internationalization validation
 * 
 * The module helps ensure text content is safe, supported, and optimized
 * for rendering while maintaining compatibility across all target browsers.
 */

import type { Font as FontKitFont } from 'fontkit';
import type {
  TextSchema,
  TextValidationResult,
  TextContentAnalysis,
} from '../types';

import {
  UNSUPPORTED_CHAR_REPLACEMENT,
  DEFAULT_FONT_SIZE,
  DEFAULT_LINE_HEIGHT,
  DEFAULT_CHARACTER_SPACING,
  ERROR_MESSAGES,
  JAPANESE_CHAR_REGEX,
  CJK_CHAR_REGEX,
} from '../constants';

import * as FontMetrics from './fontMetrics';

// Constants for validation
const MAX_TEXT_LENGTH = 10000; // Example limit
const MAX_LINE_COUNT = 500; // Example limit
const MAX_WORD_COUNT = 2000; // Example limit
const CONTROL_CHAR_PATTERN = /[\x00-\x1F\x7F-\x9F]/g; // ASCII control characters

// Regex patterns for language detection
const REGEX_PATTERNS = {
  JAPANESE: /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\u4E00-\u9FAF\u3400-\u4DBF]/,
  KOREAN: /[\uAC00-\uD7AF]/,
  CHINESE: /[\u4E00-\u9FFF]/,
  ARABIC: /[\u0600-\u06FF]/,
  HEBREW: /[\u0590-\u05FF]/,
  THAI: /[\u0E00-\u0E7F]/,
  DEVANAGARI: /[\u0900-\u097F]/
};
const EMOJI_PATTERN = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu;
const FONT_SIZE_RANGE = { min: 1, max: 500 };

const WARNING_MESSAGES = {
  VALIDATION_WARNING: 'Validation warning: {message}',
  FONT_FALLBACK: 'Font "{fontName}" not found, using fallback.',
  PERFORMANCE_WARNING: 'Large text content may impact performance.',
  COMPLEX_SCRIPT_WARNING: 'Complex script detected, may require additional processing.',
};

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface ValidationRule {
  name: string;
  check: (text: string, schema: TextSchema) => boolean | string;
  severity: 'error' | 'warning';
  category: 'content' | 'performance' | 'accessibility' | 'security';
}

interface SecurityScanResult {
  safe: boolean;
  threats: Array<{
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  sanitizedText?: string;
}

interface PerformanceAssessment {
  score: number; // 0-100
  factors: {
    textLength: number;
    complexityScore: number;
    renderingDifficulty: number;
    memoryUsage: number;
  };
  recommendations: string[];
}

// =============================================================================
// GLOBAL STATE
// =============================================================================

let customValidationRules: ValidationRule[] = [];
let validationCache: Map<string, TextValidationResult> = new Map();
let analysisCache: Map<string, TextContentAnalysis> = new Map();
let performanceCache: Map<string, PerformanceAssessment> = new Map();

// =============================================================================
// MAIN VALIDATION API
// =============================================================================

/**
 * Comprehensive text validation against schema and built-in rules
 */
export async function validateText(
  text: string,
  schema: TextSchema,
  options: {
    skipCache?: boolean;
    strictMode?: boolean;
    includePerformance?: boolean;
    includeSecurity?: boolean;
  } = {}
): Promise<TextValidationResult> {
  const cacheKey = generateValidationCacheKey(text, schema, options);
  
  // Check cache first unless explicitly skipped
  if (!options.skipCache && validationCache.has(cacheKey)) {
    return validationCache.get(cacheKey)!;
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  const unsupportedChars: string[] = [];
  const corrections: string[] = [];

  try {
    // Step 1: Basic content validation
    const contentValidation = validateBasicContent(text, schema);
    errors.push(...contentValidation.errors);
    warnings.push(...contentValidation.warnings);

    // Step 2: Schema validation
    const schemaValidation = validateSchema(schema);
    errors.push(...schemaValidation.errors);
    warnings.push(...schemaValidation.warnings);

    // Step 3: Character support validation
    if (schema.fontName) {
      try {
        const font = await FontMetrics.getFontKitFont(schema.fontName);
        const charValidation = validateCharacterSupport(text, font);
        unsupportedChars.push(...charValidation.unsupported);
        if (charValidation.unsupported.length > 0) {
          warnings.push(formatMessage(WARNING_MESSAGES.VALIDATION_WARNING, {
            message: `${charValidation.unsupported.length} unsupported characters found`
          }));
        }
      } catch (error) {
        errors.push(formatMessage(ERROR_MESSAGES.FONT_LOAD_FAILED, {
      fontName: schema.fontName || 'Unknown',
      originalError: error instanceof Error ? error.message : String(error),
    }));
      }
    }

    // Step 4: Performance validation
    if (options.includePerformance) {
      const perfValidation = validatePerformance(text, schema);
      warnings.push(...perfValidation.warnings);
      corrections.push(...perfValidation.recommendations);
    }

    // Step 5: Security validation
    if (options.includeSecurity) {
      const securityValidation = validateSecurity(text);
      if (!securityValidation.safe) {
        errors.push('Content contains potentially unsafe elements');
      }
    }

    // Step 6: Accessibility validation
    const a11yValidation = validateAccessibility(text, schema);
    warnings.push(...a11yValidation.warnings);
    corrections.push(...a11yValidation.corrections);

    // Step 7: Custom rules validation
    const customValidation = validateCustomRules(text, schema);
    errors.push(...customValidation.errors);
    warnings.push(...customValidation.warnings);

    // Step 8: Internationalization validation
    const i18nValidation = validateInternationalization(text, schema);
    warnings.push(...i18nValidation.warnings);

    const result: TextValidationResult = {
      isValid: errors.length === 0,
      errors: [...new Set(errors)], // Remove duplicates
      warnings: [...new Set(warnings)],
      unsupportedChars: [...new Set(unsupportedChars)],
      corrections: [...new Set(corrections)],
    };

    // Cache result
    validationCache.set(cacheKey, result);
    
    // Clean cache if it gets too large
    if (validationCache.size > 1000) {
      const oldestKeys = Array.from(validationCache.keys()).slice(0, 200);
      oldestKeys.forEach(key => validationCache.delete(key));
    }

    return result;

  } catch (error) {
    console.warn('Text validation error:', error);
    
    return {
      isValid: false,
      errors: ['Validation failed due to internal error'],
      warnings: [],
      unsupportedChars: [],
      corrections: [],
    };
  }
}

// =============================================================================
// CONTENT ANALYSIS
// =============================================================================

/**
 * Analyze text content characteristics and complexity
 */
export function analyzeTextContent(text: string): TextContentAnalysis {
  const cacheKey = `analysis:${simpleHash(text)}`;
  
  if (analysisCache.has(cacheKey)) {
    return analysisCache.get(cacheKey)!;
  }

  try {
    // Basic metrics
    const characterCount = text.length;
    const wordCount = estimateWordCount(text);
    const lineCount = text.split('\n').length;

    // Script detection
    const hasJapanese = JAPANESE_CHAR_REGEX.test(text);
    const hasComplexScript = detectComplexScript(text);

    // For analysis, we don't check unsupported characters (would need font)
    const unsupportedCharsList: string[] = [];

    // Complexity scoring
    const complexityScore = calculateComplexityScore(text);

    const analysis: TextContentAnalysis = {
      characterCount,
      wordCount,
      lineCount,
      hasJapanese,
      hasComplexScripts: hasComplexScript,
      complexityScore,
      primaryLanguage: detectPrimaryLanguage(text),
      hasUnsupportedChars: unsupportedCharsList.length > 0,
      supportedCharPercentage: calculateSupportedCharPercentage(text, unsupportedCharsList)
    };

    // Cache result
    analysisCache.set(cacheKey, analysis);
    
    return analysis;

  } catch (error) {
    console.warn('Text analysis error:', error);
    
    return {
      characterCount: text.length,
      wordCount: 0,
      lineCount: 1,
      hasJapanese: false,
      hasComplexScripts: false,
      complexityScore: 0,
      primaryLanguage: 'unknown',
      hasUnsupportedChars: false,
      supportedCharPercentage: 100
    };
  }
}

// Helper function to detect primary language
function detectPrimaryLanguage(text: string): string {
  if (REGEX_PATTERNS.JAPANESE.test(text)) return 'ja';
  if (REGEX_PATTERNS.KOREAN.test(text)) return 'ko';
  if (REGEX_PATTERNS.CHINESE.test(text)) return 'zh';
  if (REGEX_PATTERNS.ARABIC.test(text)) return 'ar';
  if (REGEX_PATTERNS.HEBREW.test(text)) return 'he';
  if (REGEX_PATTERNS.THAI.test(text)) return 'th';
  if (REGEX_PATTERNS.DEVANAGARI.test(text)) return 'hi';
  return 'en'; // Default to English
}

// Helper function to find unsupported characters in a font
function findUnsupportedChars(text: string, fontKitFont: FontKitFont): string[] {
  if (!text || !fontKitFont) return [];
  
  const unsupported: string[] = [];
  for (const char of text) {
    const codePoint = char.codePointAt(0) || 0;
    const glyphId = fontKitFont.glyphForCodePoint(codePoint);
    
    // If glyph is missing or is .notdef
    if (!glyphId) {
      unsupported.push(char);
    }
  }
  
  return unsupported;
}

// Helper function to calculate supported character percentage
function calculateSupportedCharPercentage(text: string, unsupportedChars: string[]): number {
  if (!text || text.length === 0) return 100;
  if (!unsupportedChars || unsupportedChars.length === 0) return 100;
  
  const uniqueUnsupportedChars = new Set(unsupportedChars);
  return 100 - (uniqueUnsupportedChars.size / text.length) * 100;
}

// =============================================================================
// CHARACTER SUPPORT VALIDATION
// =============================================================================

/**
 * Validate character support for a specific font
 */
export function validateCharacterSupport(
  text: string,
  font: FontKitFont
): { supported: string[]; unsupported: string[] } {
  const supported: string[] = [];
  const unsupported: string[] = [];
  const seenChars = new Set<string>();

  try {
    for (const char of text) {
      if (seenChars.has(char)) continue;
      seenChars.add(char);

      const codePoint = char.codePointAt(0);
      if (codePoint && font.hasGlyphForCodePoint(codePoint)) {
        supported.push(char);
      } else {
        unsupported.push(char);
      }
    }
  } catch (error) {
    console.warn('Character support validation error:', error);
  }

  return { supported, unsupported };
}

/**
 * Replace unsupported characters with fallback
 */
export function replaceUnsupportedChars(
  text: string,
  font: FontKitFont,
  replacement = UNSUPPORTED_CHAR_REPLACEMENT
): string {
  try {
    const { unsupported } = validateCharacterSupport(text, font);
    
    if (unsupported.length === 0) {
      return text;
    }

    let result = text;
    for (const char of unsupported) {
      const escapedChar = char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(new RegExp(escapedChar, 'g'), replacement);
    }
    
    return result;
  } catch (error) {
    console.warn('Error replacing unsupported characters:', error);
    return text;
  }
}

// =============================================================================
// VALIDATION RULES
// =============================================================================

/**
 * Validate basic content rules
 */
function validateBasicContent(text: string, schema: TextSchema): {
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Length validation
  if (text.length > MAX_TEXT_LENGTH) {
    errors.push(formatMessage(ERROR_MESSAGES.INVALID_SCHEMA, {
      message: `Text length exceeds maximum of ${MAX_TEXT_LENGTH}`
    }));
  }

  // Line count validation
  const lineCount = text.split('\n').length;
  if (lineCount > MAX_LINE_COUNT) {
    warnings.push(`Text has ${lineCount} lines, which may impact performance`);
  }

  // Word count validation
  const wordCount = estimateWordCount(text);
  if (wordCount > MAX_WORD_COUNT) {
    warnings.push(`Text has ${wordCount} words, which may impact performance`);
  }

  // Control character validation
  const controlChars = text.match(CONTROL_CHAR_PATTERN);
  if (controlChars) {
    const uniqueChars = [...new Set(controlChars)];
    errors.push(formatMessage(ERROR_MESSAGES.INVALID_SCHEMA, {
      message: `Unsupported control characters detected: ${uniqueChars.join(', ')}`
    }));
  }

  // Empty content check
  if (!text.trim()) {
    warnings.push('Text content is empty');
  }

  return { errors, warnings };
}

/**
 * Validate schema properties
 */
function validateSchema(schema: TextSchema): {
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Font size validation
  if (schema.fontSize < FONT_SIZE_RANGE.min || schema.fontSize > FONT_SIZE_RANGE.max) {
    errors.push(formatMessage(ERROR_MESSAGES.INVALID_SCHEMA, {
      message: `Font size must be between ${FONT_SIZE_RANGE.min} and ${FONT_SIZE_RANGE.max}`
    }));
  }

  // Line height validation
  if (schema.lineHeight < 0.5 || schema.lineHeight > 5) {
    errors.push(formatMessage(ERROR_MESSAGES.INVALID_SCHEMA, {
      message: `Line height must be between 0.5 and 5`
    }));
  }

  // Character spacing validation
  if (schema.characterSpacing < -5 || schema.characterSpacing > 20) {
    errors.push(formatMessage(ERROR_MESSAGES.INVALID_SCHEMA, {
      message: `Character spacing must be between -5 and 20`
    }));
  }

  // Dynamic font size validation
  if (schema.dynamicFontSize) {
    const { min, max } = schema.dynamicFontSize;
    if (min >= max) {
      errors.push('Dynamic font size minimum must be less than maximum');
    }
    if (min < FONT_SIZE_RANGE.min || max > FONT_SIZE_RANGE.max) {
      warnings.push('Dynamic font size range extends beyond recommended limits');
    }
  }

  // Alignment validation
  const validAlignments = ['left', 'center', 'right', 'justify'];
  if (!validAlignments.includes(schema.alignment)) {
    errors.push(formatMessage(ERROR_MESSAGES.INVALID_SCHEMA, {
      message: `Invalid alignment: ${schema.alignment}`
    }));
  }

  return { errors, warnings };
}

/**
 * Validate performance characteristics
 */
function validatePerformance(text: string, schema: TextSchema): {
  warnings: string[];
  recommendations: string[];
} {
  const warnings: string[] = [];
  const recommendations: string[] = [];

  const analysis = analyzeTextContent(text);

  // Text length performance warning
  if (analysis.characterCount > 5000) {
    warnings.push(WARNING_MESSAGES.PERFORMANCE_WARNING);
    recommendations.push('Consider breaking large text into smaller sections');
  }

  // Complex script warning
  if (analysis.hasComplexScripts) {
    warnings.push(WARNING_MESSAGES.COMPLEX_SCRIPT_WARNING);
    recommendations.push('Complex scripts may require additional processing time');
  }

  // High complexity warning
  if (analysis.complexityScore > 80) {
    warnings.push('Text has high complexity score, may impact rendering performance');
    recommendations.push('Simplify text structure or reduce special characters');
  }

  // Dynamic font size performance
  if (schema.dynamicFontSize && analysis.characterCount > 1000) {
    warnings.push('Dynamic font sizing with large text may impact performance');
    recommendations.push('Consider using fixed font size for large text blocks');
  }

  return { warnings, recommendations };
}

/**
 * Validate security aspects of text content
 */
function validateSecurity(text: string): SecurityScanResult {
  const threats: SecurityScanResult['threats'] = [];

  // Check for potential script injection patterns
  const scriptPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  ];

  scriptPatterns.forEach((pattern, index) => {
    if (pattern.test(text)) {
      threats.push({
        type: 'script_injection',
        description: 'Potential script injection detected',
        severity: 'high',
      });
    }
  });

  // Check for unusual control characters
  if (CONTROL_CHAR_PATTERN.test(text)) {
    threats.push({
      type: 'control_characters',
      description: 'Control characters detected',
      severity: 'medium',
    });
  }

  // Check for excessive Unicode variations
  const unicodeVariations = text.match(/[\uFE00-\uFE0F]/g) || text.match(/[\uDB40][\uDC20-\uDC7F]/g);
  if (unicodeVariations && unicodeVariations.length > 10) {
    threats.push({
      type: 'unicode_variation',
      description: 'Excessive Unicode variation selectors',
      severity: 'low',
    });
  }

  return {
    safe: threats.filter(t => t.severity === 'high').length === 0,
    threats,
    sanitizedText: threats.length > 0 ? sanitizeText(text) : undefined,
  };
}

/**
 * Sanitize text content for security
 */
function sanitizeText(text: string): string {
  let sanitized = text;

  // Remove control characters
  sanitized = sanitized.replace(CONTROL_CHAR_PATTERN, '');

  // Remove potential script patterns
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');

  return sanitized;
}

/**
 * Validate accessibility aspects
 */
function validateAccessibility(text: string, schema: TextSchema): {
  warnings: string[];
  corrections: string[];
} {
  const warnings: string[] = [];
  const corrections: string[] = [];

  // Font size accessibility
  if (schema.fontSize < 12) {
    warnings.push('Font size below 12pt may impact readability');
    corrections.push('Consider increasing font size to at least 12pt');
  }

  // Line height accessibility
  if (schema.lineHeight < 1.2) {
    warnings.push('Line height below 1.2 may impact readability');
    corrections.push('Consider increasing line height to at least 1.2');
  }

  // Color contrast (basic check if colors are provided)
  if (schema.fontColor && schema.backgroundColor) {
    const contrast = estimateColorContrast(schema.fontColor, schema.backgroundColor);
    if (contrast < 4.5) {
      warnings.push('Color contrast may not meet accessibility guidelines');
      corrections.push('Increase contrast between text and background colors');
    }
  }

  // Text length for readability
  const analysis = analyzeTextContent(text);
  if (analysis.characterCount > 0) {
    const avgWordsPerLine = analysis.wordCount / analysis.lineCount;
    if (avgWordsPerLine > 15) {
      warnings.push('Long lines may impact readability');
      corrections.push('Consider shorter line lengths for better readability');
    }
  }

  return { warnings, corrections };
}

/**
 * Validate internationalization aspects
 */
function validateInternationalization(text: string, schema: TextSchema): {
  warnings: string[];
} {
  const warnings: string[] = [];

  // Check if locale is supported
  // if (schema.locale && !SUPPORTED_LOCALES.includes(schema.locale as any)) {
  //   warnings.push(`Locale "${schema.locale}" is not in the supported locales list`);
  // }

  // Check for RTL text without proper direction setting
  if (/[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text) && schema.direction !== 'rtl') {
    warnings.push('RTL text detected but direction is not set to RTL');
  }

  // Check for mixed scripts
  const scripts = detectScripts(text);
  if (scripts.length > 2) {
    warnings.push('Multiple scripts detected, ensure proper font fallbacks are configured');
  }

  return { warnings };
}

/**
 * Validate custom rules
 */
function validateCustomRules(text: string, schema: TextSchema): {
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  customValidationRules.forEach(rule => {
    try {
      const result = rule.check(text, schema);
      if (typeof result === 'string') {
        if (rule.severity === 'error') {
          errors.push(result);
        } else {
          warnings.push(result);
        }
      } else if (!result) {
        const message = `Custom rule "${rule.name}" failed`;
        if (rule.severity === 'error') {
          errors.push(message);
        } else {
          warnings.push(message);
        }
      }
    } catch (error) {
      console.warn(`Custom validation rule "${rule.name}" failed:`, error);
    }
  });

  return { errors, warnings };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Estimate word count for different languages
 */
function estimateWordCount(text: string): number {
  if (!text.trim()) return 0;

  // For CJK languages, count characters as words
  if (CJK_CHAR_REGEX.test(text)) {
    return text.replace(/\s/g, '').length;
  }

  // For other languages, count space-separated words
  return text.trim().split(/\s+/).length;
}

/**
 * Calculate complexity score for text (0-100)
 */
function calculateComplexityScore(text: string): number {
  let score = 0;

  // Length factor
  score += Math.min(text.length / 1000 * 20, 20);

  // Script complexity
  if (JAPANESE_CHAR_REGEX.test(text)) score += 15;
  if (/[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text)) score += 15;
  if (detectComplexScript(text)) score += 10;

  // Unicode complexity
  const emojiMatches = text.match(EMOJI_PATTERN);
  if (emojiMatches) score += Math.min(emojiMatches.length * 2, 15);

  // Line breaks and formatting
  const lineBreaks = text.match(/\n/g);
  if (lineBreaks) score += Math.min(lineBreaks.length, 10);

  // Special characters
  const specialChars = text.match(/[^\w\s\p{L}\p{N}]/gu);
  if (specialChars) score += Math.min(specialChars.length / 10, 15);

  return Math.min(Math.round(score), 100);
}

/**
 * Detect complex scripts in text
 */
function detectComplexScript(text: string): boolean {
  // Arabic
  if (/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text)) return true;
  
  // Thai
  if (/[\u0E00-\u0E7F]/.test(text)) return true;
  
  // Devanagari (Hindi)
  if (/[\u0900-\u097F]/.test(text)) return true;
  
  // Other complex scripts
  if (/[\u1000-\u109F\u1700-\u171F\u1720-\u173F\u1740-\u175F\u1760-\u177F]/.test(text)) return true;

  return false;
}

/**
 * Detect scripts present in text
 */
function detectScripts(text: string): string[] {
  const scripts: string[] = [];

  if (/[a-zA-Z]/.test(text)) scripts.push('Latin');
  if (JAPANESE_CHAR_REGEX.test(text)) scripts.push('Japanese');
  if (/[\uAC00-\uD7AF]/.test(text)) scripts.push('Korean');
  if (CJK_CHAR_REGEX.test(text)) scripts.push('Chinese');
  if (/[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text)) scripts.push('RTL');
  if (/[\u0900-\u097F]/.test(text)) scripts.push('Devanagari');

  return scripts;
}

/**
 * Estimate color contrast ratio (simplified)
 */
function estimateColorContrast(color1: string, color2: string): number {
  // This is a simplified contrast estimation
  // In a real implementation, you'd convert to luminance and calculate proper contrast
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 4.5; // Assume acceptable if parsing fails

  const brightness1 = (rgb1.r * 299 + rgb1.g * 587 + rgb1.b * 114) / 1000;
  const brightness2 = (rgb2.r * 299 + rgb2.g * 587 + rgb2.b * 114) / 1000;
  
  const diff = Math.abs(brightness1 - brightness2);
  return diff / 255 * 21; // Rough conversion to contrast ratio scale
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  return match ? {
    r: parseInt(match[1], 16),
    g: parseInt(match[2], 16),
    b: parseInt(match[3], 16)
  } : null;
}

/**
 * Format message with parameters
 */
function formatMessage(template: string, params: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => params[key] || match);
}

/**
 * Generate cache key for validation
 */
function generateValidationCacheKey(
  text: string, 
  schema: TextSchema, 
  options: any
): string {
  const textHash = simpleHash(text);
  const schemaHash = simpleHash(JSON.stringify(schema));
  const optionsHash = simpleHash(JSON.stringify(options));
  return `validation:${textHash}:${schemaHash}:${optionsHash}`;
}

/**
 * Simple hash function
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

// =============================================================================
// CUSTOM RULES MANAGEMENT
// =============================================================================

/**
 * Add custom validation rule
 */
export function addValidationRule(rule: ValidationRule): void {
  customValidationRules.push(rule);
}

/**
 * Remove custom validation rule
 */
export function removeValidationRule(name: string): boolean {
  const index = customValidationRules.findIndex(rule => rule.name === name);
  if (index !== -1) {
    customValidationRules.splice(index, 1);
    return true;
  }
  return false;
}

/**
 * Get all custom validation rules
 */
export function getValidationRules(): ValidationRule[] {
  return [...customValidationRules];
}

/**
 * Clear all custom validation rules
 */
export function clearValidationRules(): void {
  customValidationRules = [];
}

// =============================================================================
// CACHE MANAGEMENT
// =============================================================================

/**
 * Clear all validation caches
 */
export function clearCache(): void {
  validationCache.clear();
  analysisCache.clear();
  performanceCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  validation: number;
  analysis: number;
  performance: number;
} {
  return {
    validation: validationCache.size,
    analysis: analysisCache.size,
    performance: performanceCache.size,
  };
}

// =============================================================================
// JAPANESE CHARACTER DETECTION
// =============================================================================

/**
 * Check if text contains Japanese characters (for line wrapping module)
 */
export function containsJapanese(text: string): boolean {
  return REGEX_PATTERNS.JAPANESE.test(text);
}

/**
 * Check if text contains complex scripts (for line wrapping module)
 */
export function containsComplexScript(text: string): boolean {
  return detectComplexScript(text);
}
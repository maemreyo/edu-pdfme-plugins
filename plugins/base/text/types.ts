import type { Schema } from '@pdfme/common';
import type { Font as FontKitFont } from 'fontkit';

/**
 * Represents a color in hexadecimal format (e.g., '#RRGGBB').
 */
export type HexColor = string;

/**
 * Text alignment options for horizontal positioning
 */
export type Alignment = 'left' | 'center' | 'right' | 'justify';

/**
 * Vertical alignment options for text positioning within the box
 */
export type VerticalAlignment = 'top' | 'middle' | 'bottom';

/**
 * Dynamic font size fitting strategy
 */
export type DynamicFontSizeFit = 'horizontal' | 'vertical';

/**
 * Algorithm types for dynamic font size calculation
 */
export type DynamicFontSizeAlgorithm = 'binary' | 'linear' | 'iterative';

/**
 * Browser compatibility mode for content editable handling
 */
export type BrowserCompatMode = 'standard' | 'firefox' | 'safari' | 'legacy';

/**
 * Line wrapping granularity options
 */
export type LineWrappingGranularity = 'word' | 'grapheme' | 'sentence';

/**
 * Configuration for dynamic font size calculation
 */
export interface DynamicFontSizeConfig {
  /** Minimum font size in points */
  min: number;
  /** Maximum font size in points */
  max: number;
  /** Fitting strategy - prioritize horizontal or vertical fitting */
  fit: DynamicFontSizeFit;
  /** Algorithm to use for size calculation */
  algorithm?: DynamicFontSizeAlgorithm;
  /** Precision step for size adjustments (default: 0.25) */
  precision?: number;
  /** Maximum iterations to prevent infinite loops */
  maxIterations?: number;
  /** Whether to cache calculation results */
  enableCaching?: boolean;
}

/**
 * Font metrics extracted from FontKit for precise calculations
 */
export interface FontMetrics {
  /** Font ascent in font units */
  ascent: number;
  /** Font descent in font units */
  descent: number;
  /** Recommended line height in font units */
  lineHeight: number;
  /** Capital letter height in font units */
  capHeight: number;
  /** X-height (lowercase letter height) in font units */
  xHeight: number;
  /** Units per em (scale factor) */
  unitsPerEm: number;
  /** Calculated baseline offset for browser alignment */
  baselineOffset: number;
}

/**
 * Performance cache entry for font calculations
 */
export interface FontCacheEntry {
  /** Cached FontKit font object */
  fontKitFont: FontKitFont;
  /** Extracted font metrics */
  metrics: FontMetrics;
  /** Timestamp of last access for LRU eviction */
  lastAccessed: number;
  /** Size of this cache entry in bytes (estimated) */
  sizeEstimate: number;
}

/**
 * Configuration for line wrapping behavior
 */
export interface LineWrappingConfig {
  /** Text segmentation granularity */
  granularity: LineWrappingGranularity;
  /** Locale for language-specific rules */
  locale?: string;
  /** Enable Japanese Kinsoku Shori rules */
  enableJapaneseRules: boolean;
  /** Enable hyphenation (future feature) */
  enableHyphenation?: boolean;
  /** Custom character sets for line breaking rules */
  customRules?: {
    /** Characters that cannot start a line */
    startForbidden?: string[];
    /** Characters that cannot end a line */
    endForbidden?: string[];
  };
}

/**
 * Browser-specific adjustments for WYSIWYG alignment
 */
export interface BrowserAdjustments {
  /** Top padding adjustment in pixels */
  topAdj: number;
  /** Bottom margin adjustment in pixels */
  bottomAdj: number;
  /** Left offset for text alignment */
  leftOffset: number;
  /** Additional line height compensation */
  lineHeightCompensation: number;
  /** Whether this browser needs special handling */
  requiresCompatMode: boolean;
  /** Additional line height adjustment */
  lineHeightAdj: number;
  /** Additional character spacing adjustment */
  charSpacingAdj: number;
}

/**
 * Values required for font width calculations
 */
export interface WidthCalculationContext {
  /** FontKit font instance */
  font: FontKitFont;
  /** Font size in points */
  fontSize: number;
  /** Character spacing in points */
  characterSpacing: number;
  /** Available box width in points */
  boxWidth: number;
}

/**
 * Result of dynamic font size calculation
 */
export interface DynamicFontSizeResult {
  /** Calculated optimal font size */
  fontSize: number;
  /** Number of iterations performed */
  iterations: number;
  /** Whether calculation converged successfully */
  converged: boolean;
  /** Final text dimensions with calculated size */
  finalDimensions: {
    width: number;
    height: number;
    lineCount: number;
  };
  /** Performance metrics */
  performance: {
    /** Calculation time in milliseconds */
    calculationTime: number;
    /** Whether result was cached */
    wasCached: boolean;
  };
}

/**
 * Advanced text rendering options for PDF output
 */
export interface PDFTextRenderOptions {
  /** Enable sub-pixel positioning for crisp text */
  subPixelPositioning?: boolean;
  /** Enable font hinting optimization */
  enableHinting?: boolean;
  /** Text rendering quality (0-100) */
  renderingQuality?: number;
  /** Enable automatic character spacing adjustment */
  autoAdjustSpacing?: boolean;
  /** Custom glyph substitution rules */
  glyphSubstitution?: Record<string, string>;
}

/**
 * Performance optimization hints for the text plugin.
 */
export interface PerformanceHints {
  expectedLength?: number;
  isDynamic?: boolean;
  priority?: 'low' | 'normal' | 'high';
}

/**
 * Main TextSchema interface with comprehensive type safety
 */
export interface TextSchema extends Schema {
  /** Font family name */
  fontName?: string;
  /** Horizontal text alignment */
  alignment: Alignment;
  /** Vertical text alignment within box */
  verticalAlignment: VerticalAlignment;
  /** Font size in points */
  fontSize: number;
  /** Line height multiplier */
  lineHeight: number;
  /** Enable strikethrough decoration */
  strikethrough?: boolean;
  /** Enable underline decoration */
  underline?: boolean;
  /** Character spacing in points */
  characterSpacing: number;
  /** Dynamic font size configuration */
  dynamicFontSize?: DynamicFontSizeConfig;
  /** Text color in hex format */
  fontColor: HexColor;
  /** Background color in hex format */
  backgroundColor: HexColor;
  /** Line wrapping configuration */
  lineWrapping?: LineWrappingConfig;
  /** PDF-specific rendering options */
  pdfRenderOptions?: PDFTextRenderOptions;
  /** Performance optimization hints */
  performanceHints?: PerformanceHints;
}

/**
 * Extended schema interface for internal operations
 */
export interface TextSchemaInternal extends TextSchema {
  /** Cached font metrics */
  _cachedMetrics?: FontMetrics;
  /** Cached dynamic font size result */
  _cachedFontSize?: DynamicFontSizeResult;
  /** Browser compatibility mode */
  _browserMode?: BrowserCompatMode;
  /** Performance tracking data */
  _performanceData?: {
    renderCount: number;
    totalRenderTime: number;
    lastRenderTime: number;
  };
}

/**
 * Configuration for text plugin behavior
 */
export interface TextPluginConfig {
  /** Default font name when none specified */
  defaultFontName: string;
  /** Font cache size limit in MB */
  fontCacheSize: number;
  /** Enable performance monitoring */
  enablePerformanceTracking: boolean;
  /** Default line wrapping configuration */
  defaultLineWrapping: LineWrappingConfig;
  /** Browser compatibility detection */
  autoDetectBrowser: boolean;
  /** Debug mode for troubleshooting */
  debugMode: boolean;
}

/**
 * Event payload for text content changes
 */
export interface TextChangeEvent {
  /** Previous text value */
  previousValue: string;
  /** New text value */
  newValue: string;
  /** Change source (user input, API, etc.) */
  source: 'user' | 'api' | 'internal';
  /** Timestamp of change */
  timestamp: number;
  /** Whether change triggered font size recalculation */
  triggeredResize: boolean;
}

/**
 * Type guards for runtime type checking
 */
export function isTextSchema(schema: any): schema is TextSchema {
  return (
    schema &&
    typeof schema === 'object' &&
    typeof schema.fontSize === 'number' &&
    typeof schema.alignment === 'string' &&
    typeof schema.verticalAlignment === 'string'
  );
}

export function hasDynamicFontSize(schema: TextSchema): schema is TextSchema & { dynamicFontSize: DynamicFontSizeConfig } {
  return schema.dynamicFontSize !== undefined;
}

export function isTextSchemaInternal(schema: any): schema is TextSchemaInternal {
  return isTextSchema(schema) && (
    schema._cachedMetrics !== undefined ||
    schema._cachedFontSize !== undefined ||
    schema._browserMode !== undefined
  );
}

/**
 * Utility types for advanced plugin development
 */
export type TextSchemaKeys = keyof TextSchema;
export type RequiredTextSchema = Required<TextSchema>;
export type PartialTextSchema = Partial<TextSchema>;
export type TextSchemaDefaults = Pick<TextSchema, 'fontSize' | 'alignment' | 'verticalAlignment' | 'lineHeight' | 'characterSpacing' | 'fontColor' | 'backgroundColor'>;

/**
 * Error types for text plugin operations
 */
export class TextPluginError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message);
    this.name = 'TextPluginError';
  }
}

export class FontLoadError extends TextPluginError {
  constructor(fontName: string, originalError?: Error) {
    super(`Failed to load font: ${fontName}`, 'FONT_LOAD_ERROR', { fontName, originalError });
  }
}

export class DynamicSizeCalculationError extends TextPluginError {
  constructor(reason: string, config: DynamicFontSizeConfig) {
    super(`Dynamic font size calculation failed: ${reason}`, 'DYNAMIC_SIZE_ERROR', { config });
  }
}

export class LineWrappingError extends TextPluginError {
  constructor(text: string, config: LineWrappingConfig, originalError?: Error) {
    super(`Line wrapping failed for text`, 'LINE_WRAPPING_ERROR', { 
      textLength: text.length, 
      config, 
      originalError 
    });
  }
}
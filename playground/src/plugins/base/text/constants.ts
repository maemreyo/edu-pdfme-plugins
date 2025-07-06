import type { 
  Alignment, 
  VerticalAlignment, 
  DynamicFontSizeFit,
  DynamicFontSizeAlgorithm,
  LineWrappingGranularity,
  TextPluginConfig,
  LineWrappingConfig
} from './types';

/**
 * ===========================================
 * CORE TEXT RENDERING CONSTANTS
 * ===========================================
 */

/** Default font size in points */
export const DEFAULT_FONT_SIZE = 12;

/** Default horizontal alignment */
export const DEFAULT_ALIGNMENT: Alignment = 'left';

/** Default vertical alignment */
export const DEFAULT_VERTICAL_ALIGNMENT: VerticalAlignment = 'top';

/** Default line height multiplier */
export const DEFAULT_LINE_HEIGHT = 1.2;

/** Default character spacing in points */
export const DEFAULT_CHARACTER_SPACING = 0;

/** Default font color (black) */
export const DEFAULT_FONT_COLOR = '#000000';

/** Default background color (transparent) */
export const DEFAULT_BACKGROUND_COLOR = 'rgba(0,0,0,0)';

/** Placeholder text color for empty inputs */
export const PLACEHOLDER_FONT_COLOR = '#a1a1a1';

/**
 * ===========================================
 * DYNAMIC FONT SIZING CONSTANTS
 * ===========================================
 */

/** Default minimum font size for dynamic sizing */
export const DEFAULT_DYNAMIC_MIN_FONT_SIZE = 8;

/** Default maximum font size for dynamic sizing */
export const DEFAULT_DYNAMIC_MAX_FONT_SIZE = 72;

/** Default dynamic font size fitting strategy */
export const DEFAULT_DYNAMIC_FIT: DynamicFontSizeFit = 'horizontal';

/** Horizontal fitting strategy identifier */
export const DYNAMIC_FIT_HORIZONTAL: DynamicFontSizeFit = 'horizontal';

/** Vertical fitting strategy identifier */
export const DYNAMIC_FIT_VERTICAL: DynamicFontSizeFit = 'vertical';

/** Default algorithm for dynamic font size calculation */
export const DEFAULT_DYNAMIC_ALGORITHM: DynamicFontSizeAlgorithm = 'iterative';

/** Font size adjustment step in points for iterative algorithm */
export const FONT_SIZE_ADJUSTMENT = 0.25;

/** Maximum iterations for dynamic font size calculation to prevent infinite loops */
export const MAX_DYNAMIC_FONT_ITERATIONS = 200;

/** Precision threshold for dynamic font size convergence */
export const DYNAMIC_FONT_PRECISION_THRESHOLD = 0.1;

/**
 * ===========================================
 * JAPANESE TEXT PROCESSING (KINSOKU SHORI)
 * ===========================================
 */

/**
 * Characters that cannot appear at the start of a line in Japanese text
 * Based on JIS X 4051 standard for Japanese text layout
 */
export const LINE_START_FORBIDDEN_CHARS = [
  // Closing punctuation
  ')',
  '）',
  ']',
  '］',
  '}',
  '｝',
  '〉',
  '》',
  '」',
  '』',
  '〕',
  '〗',
  '〙',
  '〛',
  
  // Comma and period variants
  ',',
  '，',
  '、',
  '.',
  '．',
  '。',
  
  // Question and exclamation marks
  '?',
  '？',
  '!',
  '！',
  
  // Colons and semicolons
  ':',
  '：',
  ';',
  '；',
  
  // Small kana characters
  'ぁ',
  'ぃ',
  'ぅ',
  'ぇ',
  'ぉ',
  'っ',
  'ゃ',
  'ゅ',
  'ょ',
  'ゎ',
  'ァ',
  'ィ',
  'ゥ',
  'ェ',
  'ォ',
  'ッ',
  'ャ',
  'ュ',
  'ョ',
  'ヮ',
  
  // Length marks and iteration marks
  'ー',
  '〜',
  '～',
  'ゝ',
  'ゞ',
  'ヽ',
  'ヾ',
  
  // Special Japanese punctuation
  '・',
  '‥',
  '…',
  '※',
] as const;

/**
 * Characters that cannot appear at the end of a line in Japanese text
 * Based on JIS X 4051 standard for Japanese text layout
 */
export const LINE_END_FORBIDDEN_CHARS = [
  // Opening punctuation
  '(',
  '（',
  '[',
  '［',
  '{',
  '｛',
  '〈',
  '《',
  '「',
  '『',
  '〔',
  '〖',
  '〘',
  '〚',
  
  // Currency and prefix symbols
  '¥',
  '￥',
  '$',
  '＄',
  '€',
  '£',
  '₩',
  
  // Number and letter prefixes
  'No.',
  'no.',
  'Mr.',
  'Mrs.',
  'Dr.',
  
  // Japanese specific prefixes
  '第',
  '約',
  '計',
  '総',
  '全',
] as const;

/**
 * ===========================================
 * PERFORMANCE OPTIMIZATION CONSTANTS
 * ===========================================
 */

/** Default font cache size in megabytes */
export const DEFAULT_FONT_CACHE_SIZE_MB = 50;

/** Maximum number of cached font entries */
export const MAX_FONT_CACHE_ENTRIES = 100;

/** Cache entry TTL in milliseconds (1 hour) */
export const FONT_CACHE_TTL = 60 * 60 * 1000;

/** Threshold for text length to enable performance optimizations */
export const LARGE_TEXT_THRESHOLD = 1000;

/** Maximum text length for real-time dynamic sizing */
export const REALTIME_SIZING_THRESHOLD = 500;

/** Debounce delay for dynamic font size recalculation in milliseconds */
export const DYNAMIC_SIZING_DEBOUNCE = 100;

/**
 * ===========================================
 * BROWSER COMPATIBILITY CONSTANTS
 * ===========================================
 */

/** User agent patterns for browser detection */
export const BROWSER_PATTERNS = {
  firefox: /Firefox\/(\d+)/,
  safari: /Safari\/(\d+)/,
  chrome: /Chrome\/(\d+)/,
  edge: /Edge\/(\d+)/,
  ie: /MSIE (\d+)|Trident\/.*; rv:(\d+)/,
} as const;

/** Minimum browser versions for full feature support */
export const MIN_BROWSER_VERSIONS = {
  firefox: 55,
  safari: 12,
  chrome: 60,
  edge: 79,
} as const;

/** CSS properties that require browser-specific handling */
export const BROWSER_SPECIFIC_CSS = {
  contentEditable: {
    standard: 'plaintext-only',
    firefox: 'true', // Firefox doesn't support plaintext-only
    legacy: 'true',
  },
  textRendering: {
    standard: 'optimizeLegibility',
    webkit: '-webkit-optimize-contrast',
    gecko: 'geometricPrecision',
  },
} as const;

/**
 * ===========================================
 * LINE WRAPPING AND TEXT PROCESSING
 * ===========================================
 */

/** Default line wrapping granularity */
export const DEFAULT_LINE_WRAPPING_GRANULARITY: LineWrappingGranularity = 'word';

/** Default locale for text segmentation */
export const DEFAULT_TEXT_LOCALE = 'en-US';

/** Regular expression for detecting Japanese characters */
export const JAPANESE_CHAR_REGEX = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;

/** Regular expression for detecting CJK (Chinese, Japanese, Korean) characters */
export const CJK_CHAR_REGEX = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\uAC00-\uD7AF]/;

/** Maximum line length before forcing character-level wrapping */
export const MAX_LINE_LENGTH_CHARS = 1000;

/** Default line wrapping configuration */
export const DEFAULT_LINE_WRAPPING_CONFIG: LineWrappingConfig = {
  granularity: DEFAULT_LINE_WRAPPING_GRANULARITY,
  locale: DEFAULT_TEXT_LOCALE,
  enableJapaneseRules: true,
  enableHyphenation: false,
} as const;

/**
 * ===========================================
 * PDF RENDERING CONSTANTS
 * ===========================================
 */

/** Default PDF text rendering quality (0-100) */
export const DEFAULT_PDF_RENDER_QUALITY = 95;

/** Default line width for strikethrough in points */
export const DEFAULT_STRIKETHROUGH_WIDTH = 0.5;

/** Default line width for underline in points */
export const DEFAULT_UNDERLINE_WIDTH = 0.5;

/** Strikethrough vertical offset as percentage of font size */
export const STRIKETHROUGH_OFFSET_RATIO = 0.3;

/** Underline vertical offset as percentage of font descent */
export const UNDERLINE_OFFSET_RATIO = 0.2;

/** Default character spacing for justify alignment */
export const JUSTIFY_SPACING_STEP = 0.1;

/** Maximum character spacing for justify alignment */
export const MAX_JUSTIFY_SPACING = 2.0;

/**
 * ===========================================
 * ERROR HANDLING AND DEBUGGING
 * ===========================================
 */

/** Default unsupported character replacement */
export const UNSUPPORTED_CHAR_REPLACEMENT = '〿';

/** Debug mode flag for development */
export const DEBUG_MODE = process.env.NODE_ENV === 'development';

/** Error message templates */
export const ERROR_MESSAGES = {
  FONT_LOAD_FAILED: 'Failed to load font: {fontName}',
  DYNAMIC_SIZE_FAILED: 'Dynamic font size calculation failed',
  LINE_WRAPPING_FAILED: 'Line wrapping failed for text',
  INVALID_SCHEMA: 'Invalid text schema configuration',
  BROWSER_NOT_SUPPORTED: 'Browser not supported for advanced features',
  CACHE_OVERFLOW: 'Font cache size limit exceeded',
} as const;

/**
 * ===========================================
 * PLUGIN CONFIGURATION DEFAULTS
 * ===========================================
 */

/** Default text plugin configuration */
export const DEFAULT_TEXT_PLUGIN_CONFIG: TextPluginConfig = {
  defaultFontName: 'Helvetica',
  fontCacheSize: DEFAULT_FONT_CACHE_SIZE_MB,
  enablePerformanceTracking: DEBUG_MODE,
  defaultLineWrapping: DEFAULT_LINE_WRAPPING_CONFIG,
  autoDetectBrowser: true,
  debugMode: DEBUG_MODE,
} as const;

/**
 * ===========================================
 * MEASUREMENT AND CONVERSION UTILITIES
 * ===========================================
 */

/** Points per inch conversion factor */
export const POINTS_PER_INCH = 72;

/** Millimeters per inch conversion factor */
export const MM_PER_INCH = 25.4;

/** Points per millimeter conversion factor */
export const POINTS_PER_MM = POINTS_PER_INCH / MM_PER_INCH;

/** Default DPI for screen rendering */
export const DEFAULT_SCREEN_DPI = 96;

/** Default DPI for PDF rendering */
export const DEFAULT_PDF_DPI = 72;

/**
 * ===========================================
 * ACCESSIBILITY CONSTANTS
 * ===========================================
 */

/** Minimum contrast ratio for accessibility compliance */
export const MIN_CONTRAST_RATIO = 4.5;

/** Minimum font size for accessibility (in points) */
export const MIN_ACCESSIBLE_FONT_SIZE = 9;

/** Maximum line length for readability (in characters) */
export const MAX_READABLE_LINE_LENGTH = 80;

/** Recommended line height range for readability */
export const READABLE_LINE_HEIGHT_RANGE = [1.2, 1.8] as const;

/**
 * ===========================================
 * FEATURE FLAGS
 * ===========================================
 */

/** Enable experimental features */
export const ENABLE_EXPERIMENTAL_FEATURES = false;

/** Enable advanced caching strategies */
export const ENABLE_ADVANCED_CACHING = true;

/** Enable performance monitoring */
export const ENABLE_PERFORMANCE_MONITORING = DEBUG_MODE;

/** Enable automatic font optimization */
export const ENABLE_FONT_OPTIMIZATION = true;

/**
 * Export commonly used constant groups for convenience
 */
export const JAPANESE_CONSTANTS = {
  START_FORBIDDEN: LINE_START_FORBIDDEN_CHARS,
  END_FORBIDDEN: LINE_END_FORBIDDEN_CHARS,
  CHAR_REGEX: JAPANESE_CHAR_REGEX,
  CJK_REGEX: CJK_CHAR_REGEX,
} as const;

export const DYNAMIC_FONT_CONSTANTS = {
  MIN_SIZE: DEFAULT_DYNAMIC_MIN_FONT_SIZE,
  MAX_SIZE: DEFAULT_DYNAMIC_MAX_FONT_SIZE,
  ADJUSTMENT: FONT_SIZE_ADJUSTMENT,
  MAX_ITERATIONS: MAX_DYNAMIC_FONT_ITERATIONS,
  PRECISION: DYNAMIC_FONT_PRECISION_THRESHOLD,
} as const;

export const PERFORMANCE_CONSTANTS = {
  CACHE_SIZE: DEFAULT_FONT_CACHE_SIZE_MB,
  MAX_ENTRIES: MAX_FONT_CACHE_ENTRIES,
  TTL: FONT_CACHE_TTL,
  LARGE_TEXT_THRESHOLD,
  REALTIME_THRESHOLD: REALTIME_SIZING_THRESHOLD,
} as const;
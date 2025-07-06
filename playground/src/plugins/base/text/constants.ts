// REFACTORED: 2025-01-07 - Organized constants with better categorization

import { ALIGNMENT, VERTICAL_ALIGNMENT, DYNAMIC_FONT_SIZE_FIT } from './types/enhanced';

// === FONT DEFAULTS ===
export const DEFAULT_FONT_SIZE = 13;
export const DEFAULT_LINE_HEIGHT = 1;
export const DEFAULT_CHARACTER_SPACING = 0;
export const DEFAULT_FONT_COLOR = '#000000';
export const PLACEHOLDER_FONT_COLOR = '#A0A0A0';

// === ALIGNMENT CONSTANTS ===
export const ALIGN_LEFT = 'left' as ALIGNMENT;
export const ALIGN_CENTER = 'center' as ALIGNMENT;
export const ALIGN_RIGHT = 'right' as ALIGNMENT;
export const ALIGN_JUSTIFY = 'justify' as ALIGNMENT;
export const DEFAULT_ALIGNMENT = ALIGN_LEFT;

export const VERTICAL_ALIGN_TOP = 'top' as VERTICAL_ALIGNMENT;
export const VERTICAL_ALIGN_MIDDLE = 'middle' as VERTICAL_ALIGNMENT;
export const VERTICAL_ALIGN_BOTTOM = 'bottom' as VERTICAL_ALIGNMENT;
export const DEFAULT_VERTICAL_ALIGNMENT = VERTICAL_ALIGN_TOP;

// === DYNAMIC FONT SIZING ===
export const DYNAMIC_FIT_VERTICAL = 'vertical' as DYNAMIC_FONT_SIZE_FIT;
export const DYNAMIC_FIT_HORIZONTAL = 'horizontal' as DYNAMIC_FONT_SIZE_FIT;
export const DEFAULT_DYNAMIC_FIT = DYNAMIC_FIT_VERTICAL;
export const DEFAULT_DYNAMIC_MIN_FONT_SIZE = 4;
export const DEFAULT_DYNAMIC_MAX_FONT_SIZE = 72;
export const FONT_SIZE_ADJUSTMENT = 0.25;

// === PERFORMANCE CONSTANTS ===
export const DEBOUNCE_DELAY_MS = 150;
export const SLOW_OPERATION_THRESHOLD_MS = 100;
export const CACHE_SIZE_LIMIT = 100;

// === JAPANESE TEXT PROCESSING ===
// Moved to japaneseText.ts module for better organization

// === UI EVENT CONSTANTS ===
export const UI_EVENTS = {
  BLUR: 'blur',
  KEYUP: 'keyup',
  KEYDOWN: 'keydown',
  PASTE: 'paste',
  FOCUS: 'focus',
} as const;

// === ERROR MESSAGES ===
export const ERROR_MESSAGES = {
  INVALID_FONT_SIZE: 'Invalid font size for rendering',
  MISSING_FONT: 'Font not found or failed to load',
  SEGMENTER_NOT_SUPPORTED: 'Intl.Segmenter not supported in this browser',
  FONTKIT_NOT_AVAILABLE: 'FontKit library not available',
  INVALID_SCHEMA: 'Invalid text schema provided',
} as const;

// === FEATURE FLAGS ===
export const FEATURES = {
  ENABLE_JAPANESE_RULES: true,
  ENABLE_DYNAMIC_SIZING: true,
  ENABLE_PERFORMANCE_MONITORING: true,
  ENABLE_DEBUG_MODE: false,
  ENABLE_ACCESSIBILITY: true,
} as const;

// === BROWSER COMPATIBILITY ===
export const BROWSER_SUPPORT = {
  FIREFOX_PLAINTEXT_WORKAROUND: true,
  INTL_SEGMENTER_FALLBACK: true,
  FONT_LOADING_TIMEOUT_MS: 5000,
} as const;

// === TEXT PROCESSING LIMITS ===
export const LIMITS = {
  MAX_LINE_COUNT: 1000,
  MAX_CHAR_COUNT: 10000,
  MAX_FONT_SIZE: 500,
  MIN_FONT_SIZE: 1,
} as const;
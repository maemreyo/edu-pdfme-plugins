/**
 * Browser Compatibility Module for Text Plugin
 * 
 * This module handles cross-browser compatibility issues and provides
 * a unified interface for text editing operations. Features include:
 * 
 * - Firefox contentEditable workarounds
 * - Cross-browser event handling normalization
 * - Feature detection and polyfills
 * - WYSIWYG font alignment calculations
 * - Platform-specific optimizations
 * - Accessibility enhancements
 * 
 * The module ensures consistent behavior across all supported browsers
 * while maintaining optimal performance and user experience.
 */

import type { Font as FontKitFont } from 'fontkit';
import type {
  BrowserAdjustments,
  BrowserCompatMode,
  VerticalAlignment,
} from '../types';



import { pt2px } from '@pdfme/common';
import * as FontMetrics from './fontMetrics';

/**
 * Configuration for browser compatibility adjustments.
 */
export interface BrowserCompatConfig {
  mode: BrowserCompatMode;
  firefoxWorkarounds: boolean;
  legacySupport: boolean;
  overrides?: {
    contentEditable?: string;
  };
}

const BROWSER_MODE_MODERN: BrowserCompatMode = 'standard';
const BROWSER_MODE_FIREFOX: BrowserCompatMode = 'firefox';
const BROWSER_MODE_LEGACY: BrowserCompatMode = 'legacy';

const DEFAULT_BROWSER_COMPAT_CONFIG: BrowserCompatConfig = {
  mode: BROWSER_MODE_MODERN,
  firefoxWorkarounds: false,
  legacySupport: false,
} as const;

const FIREFOX_COMPAT_CONFIG: BrowserCompatConfig = {
  mode: BROWSER_MODE_FIREFOX,
  firefoxWorkarounds: true,
  legacySupport: false,
} as const;

const VERTICAL_ALIGN_TOP: VerticalAlignment = 'top';
const VERTICAL_ALIGN_MIDDLE: VerticalAlignment = 'middle';
const VERTICAL_ALIGN_BOTTOM: VerticalAlignment = 'bottom';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface BrowserInfo {
  name: string;
  version: number;
  engine: string;
  platform: string;
  mobile: boolean;
  features: {
    contentEditablePlaintextOnly: boolean;
    execCommandInsertLineBreak: boolean;
    clipboardAPI: boolean;
    intlSegmenter: boolean;
    cssFontLoading: boolean;
    intersectionObserver: boolean;
  };
}

interface EventNormalization {
  keydown: (event: KeyboardEvent) => boolean;
  paste: (event: ClipboardEvent) => boolean;
  focus: (event: FocusEvent) => boolean;
  blur: (event: FocusEvent) => boolean;
}

// =============================================================================
// GLOBAL STATE
// =============================================================================

let browserInfo: BrowserInfo | null = null;
let compatConfig: BrowserCompatConfig = DEFAULT_BROWSER_COMPAT_CONFIG;
let eventHandlers: Map<HTMLElement, EventNormalization> = new Map();

// =============================================================================
// MODULE INITIALIZATION
// =============================================================================

/**
 * Initialize browser compatibility module
 */
export function initialize(): void {
  browserInfo = detectBrowserInfo();
  compatConfig = determineBrowserConfig(browserInfo);
  
  // Apply global polyfills if needed
  applyPolyfills();
  
  console.debug('Browser compatibility initialized:', {
    browser: browserInfo.name,
    version: browserInfo.version,
    mode: compatConfig.mode,
  });
}

/**
 * Detect current browser mode for compatibility
 */
export function detectBrowserMode(): BrowserCompatMode {
  if (!browserInfo) {
    browserInfo = detectBrowserInfo();
  }

  if (browserInfo.name === 'Firefox') {
    return "firefox";
  }

  if (browserInfo.version < 80 || 
      !browserInfo.features.contentEditablePlaintextOnly ||
      !browserInfo.features.clipboardAPI) {
    return "legacy";
  }

  return "standard";
}

/**
 * Check if browser supports a specific feature
 */
export function supportsFeature(feature: string): boolean {
  if (!browserInfo) {
    browserInfo = detectBrowserInfo();
  }

  switch (feature) {
    case 'contentEditablePlaintextOnly':
      return browserInfo.features.contentEditablePlaintextOnly;
    case 'execCommandInsertLineBreak':
      return browserInfo.features.execCommandInsertLineBreak;
    case 'clipboardAPI':
      return browserInfo.features.clipboardAPI;
    case 'intlSegmenter':
      return browserInfo.features.intlSegmenter;
    case 'cssFontLoading':
      return browserInfo.features.cssFontLoading;
    case 'intersectionObserver':
      return browserInfo.features.intersectionObserver;
    default:
      return false;
  }
}

// =============================================================================
// BROWSER DETECTION
// =============================================================================

/**
 * Comprehensive browser detection and feature analysis
 */
function detectBrowserInfo(): BrowserInfo {
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform.toLowerCase();
  
  // Detect browser name and version
  let name = 'Unknown';
  let version = 0;
  let engine = 'Unknown';

  if (userAgent.includes('firefox')) {
    name = 'Firefox';
    engine = 'Gecko';
    const match = userAgent.match(/firefox\/(\d+)/);
    version = match ? parseInt(match[1], 10) : 0;
  } else if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
    name = 'Chrome';
    engine = 'Blink';
    const match = userAgent.match(/chrome\/(\d+)/);
    version = match ? parseInt(match[1], 10) : 0;
  } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
    name = 'Safari';
    engine = 'WebKit';
    const match = userAgent.match(/version\/(\d+)/);
    version = match ? parseInt(match[1], 10) : 0;
  } else if (userAgent.includes('edg')) {
    name = 'Edge';
    engine = 'Blink';
    const match = userAgent.match(/edg\/(\d+)/);
    version = match ? parseInt(match[1], 10) : 0;
  }

  // Detect mobile
  const mobile = /mobile|android|iphone|ipad|tablet/.test(userAgent);

  // Feature detection
  const features = {
    contentEditablePlaintextOnly: testContentEditablePlaintextOnly(),
    execCommandInsertLineBreak: testExecCommandInsertLineBreak(),
    clipboardAPI: testClipboardAPI(),
    intlSegmenter: testIntlSegmenter(),
    cssFontLoading: testCSSFontLoading(),
    intersectionObserver: testIntersectionObserver(),
  };

  return {
    name,
    version,
    engine,
    platform,
    mobile,
    features,
  };
}

/**
 * Test for contentEditable plaintext-only support
 */
function testContentEditablePlaintextOnly(): boolean {
  try {
    const testEl = document.createElement('div');
    testEl.contentEditable = 'plaintext-only';
    return testEl.contentEditable === 'plaintext-only';
  } catch {
    return false;
  }
}

/**
 * Test for execCommand insertLineBreak support
 */
function testExecCommandInsertLineBreak(): boolean {
  try {
    return document.queryCommandSupported?.('insertLineBreak') || false;
  } catch {
    return false;
  }
}

/**
 * Test for modern Clipboard API
 */
function testClipboardAPI(): boolean {
  return typeof navigator.clipboard?.readText === 'function';
}

/**
 * Test for Intl.Segmenter support
 */
function testIntlSegmenter(): boolean {
  return typeof Intl.Segmenter !== 'undefined';
}

/**
 * Test for CSS Font Loading API
 */
function testCSSFontLoading(): boolean {
  return 'fonts' in document && typeof document.fonts.load === 'function';
}

/**
 * Test for Intersection Observer API
 */
function testIntersectionObserver(): boolean {
  return typeof IntersectionObserver === 'function';
}

/**
 * Determine browser configuration based on detected info
 */
function determineBrowserConfig(info: BrowserInfo): BrowserCompatConfig {
  if (info.name === 'Firefox') {
    return { mode: "firefox", firefoxWorkarounds: true, legacySupport: false };
  }

  if (info.version < 80 || !info.features.contentEditablePlaintextOnly) {
    return {
      mode: "legacy",
      firefoxWorkarounds: false,
      legacySupport: true,
    };
  }

  return { mode: "standard", firefoxWorkarounds: false, legacySupport: false };
}

// =============================================================================
// CONTENTEDITALE NORMALIZATION
// =============================================================================

/**
 * Make element work as plaintext-only contentEditable across browsers
 */
export function makeElementPlainTextContentEditable(element: HTMLElement): void {
  if (!browserInfo) {
    browserInfo = detectBrowserInfo();
  }

  // Set contentEditable based on browser support
  if (browserInfo.features.contentEditablePlaintextOnly && !compatConfig.firefoxWorkarounds) {
    element.contentEditable = 'plaintext-only';
  } else {
    element.contentEditable = 'true';
    
    // Add Firefox/legacy workarounds
    setupFirefoxWorkarounds(element);
  }

  // Apply common accessibility attributes
  element.setAttribute('role', 'textbox');
  element.setAttribute('aria-multiline', 'true');
  
  // Store element for cleanup
  if (!eventHandlers.has(element)) {
    eventHandlers.set(element, createEventNormalization(element));
  }
}

/**
 * Setup Firefox-specific workarounds for contentEditable
 */
function setupFirefoxWorkarounds(element: HTMLElement): void {
  const handlers = {
    keydown: createFirefoxKeydownHandler(element),
    paste: createFirefoxPasteHandler(element),
    focus: createFocusHandler(element),
    blur: createBlurHandler(element),
  };

  // Remove existing handlers to prevent duplicates
  removeEventHandlers(element);

  // Add new handlers
  element.addEventListener('keydown', handlers.keydown);
  element.addEventListener('paste', handlers.paste);
  element.addEventListener('focus', handlers.focus);
  element.addEventListener('blur', handlers.blur);

  // Store handlers for cleanup
  eventHandlers.set(element, handlers);
}

/**
 * Create Firefox-compatible keydown handler
 */
function createFirefoxKeydownHandler(element: HTMLElement): (event: KeyboardEvent) => boolean {
  return (event: KeyboardEvent) => {
    // Handle Enter key to insert line break instead of creating new elements
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      
      if (browserInfo?.features.execCommandInsertLineBreak) {
        document.execCommand('insertLineBreak', false);
      } else {
        // Fallback: insert \n character manually
        insertTextAtCursor('\n');
      }
      return false;
    }

    // Handle Tab key for consistent behavior
    if (event.key === 'Tab') {
      event.preventDefault();
      insertTextAtCursor('\t');
      return false;
    }

    return true;
  };
}

/**
 * Create Firefox-compatible paste handler
 */
function createFirefoxPasteHandler(element: HTMLElement): (event: ClipboardEvent) => boolean {
  return (event: ClipboardEvent) => {
    event.preventDefault();
    
    let pastedText = '';
    
    if (event.clipboardData) {
      // Modern approach
      pastedText = event.clipboardData.getData('text/plain') || 
                   event.clipboardData.getData('text');
    } else if ((window as any).clipboardData) {
      // Legacy IE approach
      pastedText = (window as any).clipboardData.getData('Text');
    }

    if (pastedText) {
      insertTextAtCursor(pastedText);
    }

    return false;
  };
}

/**
 * Create focus handler for consistent behavior
 */
function createFocusHandler(element: HTMLElement): (event: FocusEvent) => boolean {
  return (event: FocusEvent) => {
    // Ensure cursor is visible and properly positioned
    if (element.textContent === '') {
      // Add zero-width space for better cursor visibility in empty elements
      element.textContent = '\u200B';
      
      // Move cursor to end
      setTimeout(() => {
        const selection = window.getSelection();
        if (selection && element.firstChild) {
          const range = document.createRange();
          range.setStart(element.firstChild, 1);
          range.setEnd(element.firstChild, 1);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }, 0);
    }
    
    return true;
  };
}

/**
 * Create blur handler for cleanup
 */
function createBlurHandler(element: HTMLElement): (event: FocusEvent) => boolean {
  return (event: FocusEvent) => {
    // Clean up zero-width space if element is empty
    if (element.textContent === '\u200B') {
      element.textContent = '';
    }
    
    return true;
  };
}

/**
 * Insert text at current cursor position
 */
function insertTextAtCursor(text: string): void {
  const selection = window.getSelection();
  
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    range.deleteContents();
    
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);
    
    // Move cursor after inserted text
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

// =============================================================================
// EVENT NORMALIZATION
// =============================================================================

/**
 * Create normalized event handlers for cross-browser compatibility
 */
function createEventNormalization(element: HTMLElement): EventNormalization {
  return {
    keydown: (event: KeyboardEvent) => {
      // Normalize key codes and behavior
      return normalizeKeydownEvent(event, element);
    },
    paste: (event: ClipboardEvent) => {
      // Normalize paste behavior
      return normalizePasteEvent(event, element);
    },
    focus: (event: FocusEvent) => {
      // Normalize focus behavior
      return normalizeFocusEvent(event, element);
    },
    blur: (event: FocusEvent) => {
      // Normalize blur behavior
      return normalizeBlurEvent(event, element);
    },
  };
}

/**
 * Normalize keydown events across browsers
 */
function normalizeKeydownEvent(event: KeyboardEvent, element: HTMLElement): boolean {
  // Prevent unwanted browser shortcuts
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 'b': // Bold
      case 'i': // Italic
      case 'u': // Underline
        if (!event.shiftKey) {
          event.preventDefault();
          return false;
        }
        break;
    }
  }

  return true;
}

/**
 * Normalize paste events across browsers
 */
function normalizePasteEvent(event: ClipboardEvent, element: HTMLElement): boolean {
  // Let Firefox handler take precedence if active
  if (compatConfig.firefoxWorkarounds && browserInfo?.name === 'Firefox') {
    return true; // Let Firefox handler process
  }

  return true;
}

/**
 * Normalize focus events across browsers
 */
function normalizeFocusEvent(event: FocusEvent, element: HTMLElement): boolean {
  // Ensure consistent focus behavior
  element.setAttribute('aria-focused', 'true');
  return true;
}

/**
 * Normalize blur events across browsers
 */
function normalizeBlurEvent(event: FocusEvent, element: HTMLElement): boolean {
  // Ensure consistent blur behavior
  element.removeAttribute('aria-focused');
  return true;
}

// =============================================================================
// WYSIWYG FONT ALIGNMENT
// =============================================================================

/**
 * Calculate browser-specific font adjustments for WYSIWYG alignment
 */
export function getBrowserVerticalFontAdjustments(
  font: FontKitFont,
  fontSize: number,
  lineHeight: number,
  verticalAlignment: VerticalAlignment
): BrowserAdjustments {
  try {
    const metrics = FontMetrics.calculateFontMetrics(font, fontSize);
    const { ascent, descent, baseLineHeight } = metrics;

    // Calculate adjustments based on browser and alignment
    let topAdj = 0;
    let bottomAdj = 0;
    let lineHeightAdj = 0;
    let charSpacingAdj = 0;

    // Base adjustment for font metrics vs browser rendering
    const fontHeightDiff = (baseLineHeight * fontSize - fontSize) / 2;
    
    switch (verticalAlignment) {
      case "top":
        // For top alignment, adjust for font metrics difference
        topAdj = pt2px(fontHeightDiff);
        break;

      case "middle":
      case "bottom":
        // For middle/bottom alignment, handle browser line height differences
        const lineHeightDiff = Math.max(0, baseLineHeight - lineHeight);
        const adjustment = (lineHeightDiff * fontSize) / 2;
        
        if (verticalAlignment === "middle") {
          topAdj = pt2px(adjustment);
          bottomAdj = pt2px(adjustment);
        } else {
          bottomAdj = pt2px(adjustment * 2);
        }
        break;
    }

    // Browser-specific adjustments
    if (browserInfo?.name === 'Firefox') {
      // Firefox has different font rendering characteristics
      topAdj += 1;
      if (lineHeight < 1.2) {
        lineHeightAdj = 0.1;
      }
    } else if (browserInfo?.name === 'Safari') {
      // Safari adjustments for consistent rendering
      topAdj -= 0.5;
    }

    return {
      topAdj: Math.round(topAdj * 100) / 100,
      bottomAdj: Math.round(bottomAdj * 100) / 100,
      lineHeightCompensation: lineHeightAdj,
      requiresCompatMode: false,
      leftOffset: 0,
    };

  } catch (error) {
    console.warn('Error calculating browser font adjustments:', error);
    
    // Return safe fallback values
    return {
      topAdj: 0,
      bottomAdj: 0,
      lineHeightCompensation: 0,
      requiresCompatMode: false,
      leftOffset: 0,
    };
  }
}

// =============================================================================
// TEXT CONTENT UTILITIES
// =============================================================================

/**
 * Get text content from element in a cross-browser compatible way
 */
export function getTextFromElement(element: HTMLElement): string {
  // Use textContent for consistent plaintext extraction
  let text = element.textContent || '';
  
  // Clean up zero-width spaces that might be added for cursor management
  text = text.replace(/\u200B/g, '');
  
  // Normalize line endings
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Remove trailing newlines (common issue in contentEditable)
  text = text.replace(/\n+$/, '');
  
  return text;
}

/**
 * Set text content in element in a cross-browser compatible way
 */
export function setTextInElement(element: HTMLElement, text: string): void {
  // Clear existing content
  element.textContent = '';
  
  if (!text) {
    return;
  }

  // For single-line text, just set textContent
  if (!text.includes('\n')) {
    element.textContent = text;
    return;
  }

  // For multi-line text, handle line breaks properly
  const lines = text.split('\n');
  const fragment = document.createDocumentFragment();
  
  lines.forEach((line, index) => {
    if (index > 0) {
      fragment.appendChild(document.createElement('br'));
    }
    if (line) {
      fragment.appendChild(document.createTextNode(line));
    }
  });
  
  element.appendChild(fragment);
}

// =============================================================================
// CLEANUP AND POLYFILLS
// =============================================================================

/**
 * Remove event handlers from an element
 */
function removeEventHandlers(element: HTMLElement): void {
  const handlers = eventHandlers.get(element);
  if (handlers) {
    element.removeEventListener('keydown', handlers.keydown);
    element.removeEventListener('paste', handlers.paste);
    element.removeEventListener('focus', handlers.focus);
    element.removeEventListener('blur', handlers.blur);
    eventHandlers.delete(element);
  }
}

/**
 * Clean up all event handlers and resources
 */
export function cleanup(): void {
  eventHandlers.forEach((handlers, element) => {
    removeEventHandlers(element);
  });
  eventHandlers.clear();
}

/**
 * Apply polyfills for missing browser features
 */
function applyPolyfills(): void {
  // Polyfill for execCommand if not available
  if (!browserInfo?.features.execCommandInsertLineBreak) {
    // Define fallback behavior
    (document as any).execCommand = (document as any).execCommand || function(command: string) {
      if (command === 'insertLineBreak') {
        insertTextAtCursor('\n');
        return true;
      }
      return false;
    };
  }
}

// =============================================================================
// BROWSER INFO API
// =============================================================================

/**
 * Get current browser information
 */
export function getBrowserInfo(): BrowserInfo | null {
  return browserInfo ? { ...browserInfo } : null;
}

/**
 * Get current compatibility configuration
 */
export function getCompatConfig(): BrowserCompatConfig {
  return { ...compatConfig };
}

/**
 * Update compatibility configuration
 */
export function setCompatConfig(newConfig: Partial<BrowserCompatConfig>): void {
  compatConfig = { ...compatConfig, ...newConfig };
}

/**
 * Check if current browser is considered modern
 */
export function isModernBrowser(): boolean {
  return compatConfig.mode === "standard";
}

/**
 * Check if Firefox workarounds are needed
 */
export function needsFirefoxWorkarounds(): boolean {
  return compatConfig.firefoxWorkarounds && browserInfo?.name === 'Firefox';
}

/**
 * Get recommended settings for current browser
 */
export function getRecommendedSettings(): {
  contentEditable: string;
  useWorkarounds: boolean;
  features: string[];
} {
  const features: string[] = [];
  
  if (browserInfo?.features.intlSegmenter) features.push('intlSegmenter');
  if (browserInfo?.features.clipboardAPI) features.push('clipboardAPI');
  if (browserInfo?.features.cssFontLoading) features.push('cssFontLoading');

  return {
    contentEditable: compatConfig.overrides?.contentEditable || 'plaintext-only',
    useWorkarounds: needsFirefoxWorkarounds(),
    features,
  };
}
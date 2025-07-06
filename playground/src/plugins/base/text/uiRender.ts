// REFACTORED: 2025-01-07 - Enhanced UI rendering with comprehensive event system

import type * as CSS from 'csstype';
import type { Font as FontKitFont } from 'fontkit';
import { UIRenderProps, getDefaultFont } from '@pdfme/common';
import type { TextSchema } from './types/enhanced';

// Import refactored modules
import {
  getFontKitFont,
  getBrowserVerticalFontAdjustments,
  replaceUnsupportedChars,
  calculateDynamicFontSize
} from './helper';

import {
  makeElementPlainTextContentEditable,
  setupBlurHandler,
  setupKeyupHandler,
  setupFocusHandler,
  mapVerticalAlignToFlex,
  getBackgroundColor,
  getTextFromElement,
  focusElementAtEnd
} from './modules/browserCompat';

// Import constants
import {
  DEFAULT_FONT_SIZE,
  DEFAULT_ALIGNMENT,
  VERTICAL_ALIGN_TOP,
  VERTICAL_ALIGN_MIDDLE,
  VERTICAL_ALIGN_BOTTOM,
  DEFAULT_VERTICAL_ALIGNMENT,
  DEFAULT_LINE_HEIGHT,
  DEFAULT_CHARACTER_SPACING,
  DEFAULT_FONT_COLOR,
  PLACEHOLDER_FONT_COLOR,
} from './constants';

import { isEditable } from '../utils';

/**
 * MAIN UI RENDER FUNCTION WITH EXTENSION SUPPORT
 * 
 * Enhanced UI rendering with optional extension system integration.
 * Falls back to original behavior if extensions are not available.
 * 
 * CRITICAL UI Events Handled:
 * - blur: Sync content from contentEditable to schema
 * - keyup: Trigger dynamic font size recalculation
 * - keydown & paste: Firefox plaintext simulation
 * - focus: Placeholder logic management
 */
export const uiRender = async (arg: UIRenderProps<TextSchema>) => {
  // TRY EXTENSION-ENHANCED RENDERING FIRST
  try {
    if (typeof window !== 'undefined') {
      const { enhanceUIRender, areExtensionsEnabled } = await import('./extensions/integration');
      
      if (areExtensionsEnabled()) {
        // Use extension-enhanced rendering
        await enhanceUIRender(originalUIRender, arg);
        return;
      }
    }
  } catch (error) {
    console.debug('Extension system not available for UI render, using original:', error);
  }
  
  // FALLBACK TO ORIGINAL RENDERING
  await originalUIRender(arg);
};

/**
 * ORIGINAL UI RENDER IMPLEMENTATION
 * 
 * This is the original implementation that works without extensions.
 * Kept as a separate function to ensure clean fallback behavior.
 */
const originalUIRender = async (arg: UIRenderProps<TextSchema>) => {
  const { value, schema, mode, onChange, stopEditing, tabIndex, placeholder, options, _cache } = arg;
  
  const usePlaceholder = isEditable(mode, schema) && placeholder && !value;
  const font = options?.font || getDefaultFont();
  
  // Get FontKit font with caching
  const fontKitFont = await getFontKitFont(
    schema.fontName,
    font,
    _cache as Map<string, import('fontkit').Font>,
  );
  
  // Build styled text container with WYSIWYG alignment
  const textBlock = buildStyledTextContainer(
    arg,
    fontKitFont,
    usePlaceholder ? placeholder : value,
  );

  const processedText = replaceUnsupportedChars(value, fontKitFont);

  // === READ-ONLY MODE ===
  if (!isEditable(mode, schema)) {
    textBlock.innerHTML = processedText
      .split('')
      .map(
        (l, i) =>
          `<span style="letter-spacing:${
            String(value).length === i + 1 ? 0 : 'inherit'
          };">${l}</span>`,
      )
      .join('');
    return;
  }

  // === EDITABLE MODE - SETUP COMPREHENSIVE EVENT SYSTEM ===
  
  // Make contentEditable with Firefox compatibility
  makeElementPlainTextContentEditable(textBlock);
  textBlock.tabIndex = tabIndex || 0;
  textBlock.innerText = mode === 'designer' ? value : processedText;

  // 1. BLUR EVENT - Content Synchronization
  setupBlurHandler(textBlock, onChange, stopEditing);

  // 2. KEYUP EVENT - Dynamic Font Size Recalculation
  if (schema.dynamicFontSize) {
    let dynamicFontSize: number | undefined = undefined;

    setupKeyupHandler(textBlock, () => {
      if (!textBlock.textContent) return;
      
      dynamicFontSize = calculateDynamicFontSize({
        textSchema: schema,
        fontKitFont,
        value: getTextFromElement(textBlock),
        startingFontSize: dynamicFontSize,
      });
      
      // Apply new font size
      textBlock.style.fontSize = `${dynamicFontSize}pt`;

      // Recalculate browser adjustments for WYSIWYG
      const { topAdj: newTopAdj, bottomAdj: newBottomAdj } = getBrowserVerticalFontAdjustments(
        fontKitFont,
        dynamicFontSize ?? schema.fontSize ?? DEFAULT_FONT_SIZE,
        schema.lineHeight ?? DEFAULT_LINE_HEIGHT,
        schema.verticalAlignment ?? DEFAULT_VERTICAL_ALIGNMENT,
      );
      
      textBlock.style.paddingTop = `${newTopAdj}px`;
      textBlock.style.marginBottom = `${newBottomAdj}px`;
    });
  }

  // 3. FOCUS EVENT - Placeholder Management
  if (usePlaceholder) {
    textBlock.style.color = PLACEHOLDER_FONT_COLOR;
    setupFocusHandler(
      textBlock, 
      placeholder, 
      schema.fontColor ?? DEFAULT_FONT_COLOR
    );
  }

  // 4. DESIGNER MODE - Auto-focus with cursor at end
  if (mode === 'designer') {
    focusElementAtEnd(textBlock);
  }
};

/**
 * CRITICAL: WYSIWYG Font Alignment System
 * 
 * This function creates the styled text container with precise font metrics
 * alignment to ensure UI matches PDF output exactly.
 * 
 * Key techniques:
 * - Uses FontKit metrics for precise positioning
 * - Applies browser-specific adjustments
 * - Handles dynamic font sizing
 * - Manages text decorations (underline/strikethrough)
 */
export const buildStyledTextContainer = (
  arg: UIRenderProps<TextSchema>,
  fontKitFont: FontKitFont,
  value: string,
): HTMLDivElement => {
  const { schema, rootElement, mode } = arg;

  let dynamicFontSize: number | undefined = undefined;

  // Calculate dynamic font size if enabled and value exists
  if (schema.dynamicFontSize && value) {
    dynamicFontSize = calculateDynamicFontSize({
      textSchema: schema,
      fontKitFont,
      value,
      startingFontSize: dynamicFontSize,
    });
  }

  // CRITICAL: WYSIWYG Font Alignment Calculations
  // Browser-PDF font rendering synchronization
  const { topAdj, bottomAdj } = getBrowserVerticalFontAdjustments(
    fontKitFont,
    dynamicFontSize ?? schema.fontSize ?? DEFAULT_FONT_SIZE,
    schema.lineHeight ?? DEFAULT_LINE_HEIGHT,
    schema.verticalAlignment ?? DEFAULT_VERTICAL_ALIGNMENT,
  );

  const topAdjustment = topAdj.toString();
  const bottomAdjustment = bottomAdj.toString();

  // Create container with flex layout for vertical alignment
  const container = document.createElement('div');
  const containerStyle: CSS.Properties = {
    padding: 0,
    resize: 'none',
    backgroundColor: getBackgroundColor(value, schema),
    border: 'none',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: mapVerticalAlignToFlex(schema.verticalAlignment),
    width: '100%',
    height: '100%',
    cursor: isEditable(mode, schema) ? 'text' : 'default',
  };
  
  Object.assign(container.style, containerStyle);
  rootElement.innerHTML = '';
  rootElement.appendChild(container);

  // Text decorations setup
  const textDecorations = [];
  if (schema.strikethrough) textDecorations.push('line-through');
  if (schema.underline) textDecorations.push('underline');

  // Text block styles with comprehensive formatting
  const textBlockStyle: CSS.Properties = {
    // Font formatting styles
    fontFamily: schema.fontName ? `'${schema.fontName}'` : 'inherit',
    color: schema.fontColor ? schema.fontColor : DEFAULT_FONT_COLOR,
    fontSize: `${dynamicFontSize ?? schema.fontSize ?? DEFAULT_FONT_SIZE}pt`,
    letterSpacing: `${schema.characterSpacing ?? DEFAULT_CHARACTER_SPACING}pt`,
    lineHeight: `${schema.lineHeight ?? DEFAULT_LINE_HEIGHT}em`,
    textAlign: schema.alignment ?? DEFAULT_ALIGNMENT,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    // Block layout styles with WYSIWYG adjustments
    resize: 'none',
    border: 'none',
    outline: 'none',
    marginBottom: `${bottomAdjustment}px`,
    paddingTop: `${topAdjustment}px`,
    backgroundColor: 'transparent',
    textDecoration: textDecorations.join(' '),
  };

  const textBlock = document.createElement('div');
  textBlock.id = 'text-' + String(schema.id);
  Object.assign(textBlock.style, textBlockStyle);

  container.appendChild(textBlock);

  return textBlock;
};

/**
 * LEGACY COMPATIBILITY EXPORT
 * Maintains backward compatibility with existing code
 */
export { makeElementPlainTextContentEditable, mapVerticalAlignToFlex };

/**
 * PERFORMANCE OPTIMIZATION HELPERS
 */

/**
 * Debounced keyup handler for better performance
 */
export const createDebouncedKeyupHandler = (
  callback: () => void,
  delay: number = 150
): (() => void) => {
  let timeoutId: number;
  
  return () => {
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(callback, delay);
  };
};

/**
 * Batch style updates for better performance
 */
export const batchStyleUpdates = (
  element: HTMLElement,
  styles: Record<string, string>
): void => {
  // Use DocumentFragment to batch DOM updates
  Object.assign(element.style, styles);
};

/**
 * ACCESSIBILITY HELPERS
 */

/**
 * Add ARIA attributes for screen readers
 */
export const addAccessibilityAttributes = (
  element: HTMLElement,
  schema: TextSchema
): void => {
  element.setAttribute('role', 'textbox');
  element.setAttribute('aria-label', schema.name || 'Text field');
  if (schema.readOnly) {
    element.setAttribute('aria-readonly', 'true');
  }
};

/**
 * DEBUGGING HELPERS
 */

/**
 * Visual debug helper to show text boundaries
 */
export const enableDebugMode = (element: HTMLElement): void => {
  element.style.outline = '1px dashed red';
  element.style.position = 'relative';
  
  const debugInfo = document.createElement('div');
  debugInfo.style.position = 'absolute';
  debugInfo.style.top = '-20px';
  debugInfo.style.left = '0';
  debugInfo.style.fontSize = '10px';
  debugInfo.style.color = 'red';
  debugInfo.style.backgroundColor = 'white';
  debugInfo.style.padding = '2px';
  debugInfo.textContent = `${element.offsetWidth}x${element.offsetHeight}`;
  
  element.appendChild(debugInfo);
};
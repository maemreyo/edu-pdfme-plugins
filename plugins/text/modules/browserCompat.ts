// REFACTORED: 2025-01-07 - Firefox workarounds and browser compatibility features

/**
 * CRITICAL: Firefox Browser Detection
 * Firefox doesn't support 'plaintext-only' contentEditable mode
 */
export const isFirefox = (): boolean => {
  return navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
};

/**
 * CRITICAL: Firefox Compatibility Workaround
 * 
 * Firefox doesn't support 'plaintext-only' contentEditable mode, which we need to avoid markup.
 * This function adds manual event handling to simulate 'plaintext-only' behavior.
 * 
 * Key Events Handled:
 * - keydown: Custom Enter key behavior (insertLineBreak instead of paragraph)
 * - paste: Strip HTML markup and insert as plain text
 */
export const makeElementPlainTextContentEditable = (element: HTMLElement): void => {
  if (!isFirefox()) {
    element.contentEditable = 'plaintext-only';
    return;
  }

  // Firefox workaround: Manual plaintext simulation
  element.contentEditable = 'true';
  
  // Handle Enter key to prevent creating <div> or <p> elements
  element.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      document.execCommand('insertLineBreak', false, undefined);
    }
  });

  // Handle paste to strip HTML markup
  element.addEventListener('paste', (e: ClipboardEvent) => {
    e.preventDefault();
    const paste = e.clipboardData?.getData('text');
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    selection.deleteFromDocument();
    selection.getRangeAt(0).insertNode(document.createTextNode(paste || ''));
    selection.collapseToEnd();
  });
};

/**
 * CRITICAL: UI Event System for Text Editing
 * 
 * These event handlers maintain the WYSIWYG experience and sync with schema:
 * - blur: Sync content from contentEditable to schema
 * - keyup: Trigger dynamic font size recalculation
 * - focus: Handle placeholder logic
 */

/**
 * Setup blur event for content synchronization
 * CRITICAL: This ensures UI changes are persisted to schema
 */
export const setupBlurHandler = (
  element: HTMLElement,
  onChange?: (arg: { key: string; value: unknown }) => void,
  stopEditing?: () => void
): void => {
  element.addEventListener('blur', (e: Event) => {
    const target = e.target as HTMLDivElement;
    let text = target.innerText;
    
    // contenteditable adds additional newline char retrieved with innerText
    if (text.endsWith('\n')) {
      text = text.slice(0, -1);
    }
    
    if (onChange) onChange({ key: 'content', value: text });
    if (stopEditing) stopEditing();
  });
};

/**
 * Setup keyup event for dynamic font size updates
 * CRITICAL: Triggers recalculation when content changes
 */
export const setupKeyupHandler = (
  element: HTMLElement,
  onContentChange: () => void
): void => {
  element.addEventListener('keyup', () => {
    setTimeout(() => {
      onContentChange();
    }, 0);
  });
};

/**
 * Setup focus event for placeholder handling
 * CRITICAL: Manages placeholder visibility and styling
 */
export const setupFocusHandler = (
  element: HTMLElement,
  placeholder: string,
  fontColor: string
): void => {
  element.addEventListener('focus', () => {
    if (element.innerText === placeholder) {
      element.innerText = '';
      element.style.color = fontColor;
    }
  });
};

/**
 * Vertical alignment mapping for CSS flexbox
 * CRITICAL: Ensures UI matches PDF vertical alignment
 */
export const mapVerticalAlignToFlex = (verticalAlignmentValue: string | undefined): string => {
  switch (verticalAlignmentValue) {
    case 'top':
      return 'flex-start';
    case 'middle':
      return 'center';
    case 'bottom':
      return 'flex-end';
    default:
      return 'flex-start';
  }
};

/**
 * Background color helper for UI rendering
 */
export const getBackgroundColor = (value: string, schema: { backgroundColor?: string }): string => {
  if (!value || !schema.backgroundColor) return 'transparent';
  return schema.backgroundColor;
};

/**
 * Get text content from contentEditable element
 * Handles contentEditable quirks with trailing newlines
 */
export const getTextFromElement = (element: HTMLDivElement): string => {
  let text = element.innerText;
  if (text.endsWith('\n')) {
    // contenteditable adds additional newline char retrieved with innerText
    text = text.slice(0, -1);
  }
  return text;
};

/**
 * Focus element and set cursor to end
 * CRITICAL: Provides proper text editing experience in designer mode
 */
export const focusElementAtEnd = (element: HTMLElement): void => {
  setTimeout(() => {
    element.focus();
    // Set the focus to the end of the editable element when you focus, as we would for a textarea
    const selection = window.getSelection();
    const range = document.createRange();
    if (selection && range) {
      range.selectNodeContents(element);
      range.collapse(false); // Collapse range to the end
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  });
};
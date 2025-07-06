import type * as CSS from "csstype";
import { 
  Select, 
  SelectUIStyles, 
  OptionsValidationResult, 
  OptionsWidgetConfig,
  SELECT_CONSTANTS 
} from "./types";

/**
 * Validates an array of select options according to configuration rules
 * 
 * Performs comprehensive validation including:
 * - Duplicate detection and removal
 * - Empty option handling
 * - Length validation
 * - Custom validation rules
 * 
 * @param options - Array of option strings to validate
 * @param config - Optional configuration for validation rules
 * @returns Detailed validation result with errors, warnings, and sanitized options
 */
export function validateOptions(
  options: string[], 
  config: OptionsWidgetConfig = {}
): OptionsValidationResult {
  const {
    maxOptions = SELECT_CONSTANTS.DEFAULT_MAX_OPTIONS,
    minOptions = SELECT_CONSTANTS.DEFAULT_MIN_OPTIONS,
    allowEmptyOptions = false,
    validateOption = () => true
  } = config;

  const errors: string[] = [];
  const warnings: string[] = [];
  const sanitizedOptions: string[] = [];
  const seenOptions = new Set<string>();

  // Basic array validation
  if (!Array.isArray(options)) {
    errors.push("Options must be an array");
    return { isValid: false, errors };
  }

  // Length validation
  if (options.length < minOptions) {
    errors.push(`Minimum ${minOptions} option${minOptions === 1 ? '' : 's'} required`);
  }
  
  if (options.length > maxOptions) {
    errors.push(`Maximum ${maxOptions} options allowed`);
  }

  // Process each option
  for (let i = 0; i < options.length; i++) {
    const option = options[i];
    
    // Type validation
    if (typeof option !== 'string') {
      warnings.push(`Option at index ${i} is not a string, converting to string`);
      const stringOption = String(option);
      options[i] = stringOption;
    }

    const trimmedOption = option.trim();

    // Empty option handling
    if (!trimmedOption) {
      if (allowEmptyOptions) {
        warnings.push(`Empty option at index ${i} detected`);
      } else {
        warnings.push(`Empty option at index ${i} will be removed`);
        continue;
      }
    }

    // Duplicate detection
    if (seenOptions.has(trimmedOption)) {
      warnings.push(`Duplicate option "${trimmedOption}" will be removed`);
      continue;
    }

    // Custom validation
    const validationResult = validateOption(trimmedOption);
    if (typeof validationResult === 'string') {
      errors.push(`Option "${trimmedOption}": ${validationResult}`);
      continue;
    } else if (!validationResult) {
      errors.push(`Option "${trimmedOption}" failed custom validation`);
      continue;
    }

    // Option passed all validation
    seenOptions.add(trimmedOption);
    sanitizedOptions.push(trimmedOption);
  }

  // Final length check after sanitization
  if (sanitizedOptions.length < minOptions) {
    errors.push(`After validation, only ${sanitizedOptions.length} valid options remain (minimum: ${minOptions})`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedOptions: errors.length === 0 ? sanitizedOptions : undefined
  };
}

/**
 * Generates optimized CSS styles for select UI components
 * 
 * Creates consistent, responsive styling that adapts to different contexts.
 * Styles are optimized for performance and accessibility.
 * 
 * @param theme - Optional theme overrides for customization
 * @returns Complete style object for all select UI components
 */
export function getSelectUIStyles(theme: Partial<SelectUIStyles> = {}): SelectUIStyles {
  const defaultStyles: SelectUIStyles = {
    input: {
      width: "100%",
      padding: "6.25px 11px",
      border: "1px solid #ccc",
      borderRadius: "4px",
      fontSize: "14px",
      fontFamily: "inherit",
      outline: "none",
      transition: "border-color 0.2s ease",
      backgroundColor: "#fff",
      color: "#333",
      boxSizing: "border-box",
    },
    
    button: {
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500",
      transition: "all 0.2s ease",
      outline: "none",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#f5f5f5",
      color: "#333",
      userSelect: "none",
    },
    
    container: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      marginBottom: "10px",
      gap: "8px",
    },
    
    list: {
      listStyle: "none",
      padding: "0",
      margin: "0",
      backgroundColor: "#fff",
      border: "1px solid #e0e0e0",
      borderRadius: "4px",
      maxHeight: "200px",
      overflowY: "auto",
    }
  };

  // Deep merge with theme overrides
  return mergeStyles(defaultStyles, theme);
}

/**
 * Deep merges style objects while preserving type safety
 * 
 * @param target - Base styles object
 * @param source - Override styles object
 * @returns Merged styles object
 */
function mergeStyles<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = { ...result[key], ...source[key] };
    } else if (source[key] !== undefined) {
      result[key] = source[key] as T[typeof key];
    }
  }
  
  return result;
}

/**
 * Safely applies CSS styles to a DOM element
 * 
 * Handles both CSS Properties objects and partial style declarations.
 * Provides error boundary for invalid style values.
 * 
 * @param element - Target DOM element
 * @param styles - Style object to apply
 */
export function applyStylesToElement(
  element: HTMLElement, 
  styles: Partial<CSSStyleDeclaration> | CSS.Properties
): void {
  try {
    Object.assign(element.style, styles);
  } catch (error) {
    console.warn('Failed to apply styles to element:', error);
    
    // Fallback: apply styles individually
    for (const [property, value] of Object.entries(styles)) {
      try {
        if (value != null) {
          (element.style as any)[property] = value;
        }
      } catch (individualError) {
        console.warn(`Failed to apply style property ${property}:`, individualError);
      }
    }
  }
}

/**
 * Creates a properly configured select element with all options
 * 
 * Generates a native HTML select element with proper event handling,
 * accessibility attributes, and performance optimizations.
 * 
 * @param options - Array of option values
 * @param currentValue - Currently selected value
 * @param onChange - Change event handler
 * @returns Configured HTMLSelectElement
 */
export function createSelectElement(
  options: string[],
  currentValue: string,
  onChange: (value: string) => void
): HTMLSelectElement {
  const selectElement = document.createElement("select");
  
  // Apply base styles for overlay technique
  const overlayStyles: CSS.Properties = {
    opacity: "0",
    position: "absolute",
    width: `calc(100% + ${SELECT_CONSTANTS.DEFAULT_BUTTON_WIDTH}px)`,
    height: "100%",
    top: "0",
    left: "0",
    appearance: "none",
    border: "none",
    outline: "none",
    cursor: "pointer",
    zIndex: SELECT_CONSTANTS.OVERLAY_Z_INDEX.toString(),
  };
  
  applyStylesToElement(selectElement, overlayStyles);
  
  // Set initial value
  selectElement.value = currentValue;
  
  // Add event listener with error handling
  selectElement.addEventListener("change", (event) => {
    try {
      const target = event.target as HTMLSelectElement;
      if (target && typeof target.value === 'string') {
        onChange(target.value);
      }
    } catch (error) {
      console.error('Error handling select change:', error);
    }
  });
  
  // Generate options HTML with proper escaping
  selectElement.innerHTML = options
    .map(option => {
      const escapedOption = escapeHtml(option);
      const selected = option === currentValue ? 'selected' : '';
      return `<option value="${escapedOption}" ${selected}>${escapedOption}</option>`;
    })
    .join('');
  
  return selectElement;
}

/**
 * Escapes HTML special characters to prevent XSS
 * 
 * @param text - Text to escape
 * @returns HTML-safe text
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Generates a unique identifier for DOM elements
 * 
 * Creates collision-resistant IDs for form elements and labels.
 * Useful for accessibility and testing.
 * 
 * @param prefix - Optional prefix for the ID
 * @returns Unique identifier string
 */
export function generateUniqueId(prefix: string = 'select'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Validates if a value exists in the options array
 * 
 * @param value - Value to check
 * @param options - Array of valid options
 * @returns True if value is valid, false otherwise
 */
export function isValidOption(value: string, options: string[]): boolean {
  return options.includes(value);
}

/**
 * Gets the default value from options array
 * 
 * Returns the first option if available, empty string otherwise.
 * Used for initializing new select schemas.
 * 
 * @param options - Array of available options
 * @returns Default value string
 */
export function getDefaultValue(options: string[]): string {
  return Array.isArray(options) && options.length > 0 ? options[0] : '';
}

/**
 * Sanitizes and normalizes an options array
 * 
 * Performs basic cleanup without full validation.
 * Useful for quick normalization before display.
 * 
 * @param options - Raw options array
 * @returns Cleaned options array
 */
export function sanitizeOptions(options: string[]): string[] {
  if (!Array.isArray(options)) {
    return [];
  }
  
  return options
    .map(option => String(option).trim())
    .filter((option, index, array) => 
      option && array.indexOf(option) === index // Remove empty and duplicate options
    );
}

/**
 * Performance-optimized options comparison
 * 
 * Compares two options arrays for equality without deep iteration.
 * Useful for preventing unnecessary re-renders.
 * 
 * @param options1 - First options array
 * @param options2 - Second options array
 * @returns True if arrays are equal, false otherwise
 */
export function optionsEqual(options1: string[], options2: string[]): boolean {
  if (!Array.isArray(options1) || !Array.isArray(options2)) {
    return false;
  }
  
  if (options1.length !== options2.length) {
    return false;
  }
  
  return options1.every((option, index) => option === options2[index]);
}
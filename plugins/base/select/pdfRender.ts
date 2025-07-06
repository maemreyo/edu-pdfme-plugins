import { PDFRenderProps } from "@pdfme/common";
import text from "../text/index";
import { Select } from "./types";
import { isValidOption, sanitizeOptions, getDefaultValue } from "./helper";

/**
 * PDF rendering function for Select plugin
 * 
 * Renders the selected value as formatted text in PDF documents.
 * This function provides a clean, professional PDF output by:
 * 
 * 1. Validating the selected value against available options
 * 2. Falling back to default value if current selection is invalid
 * 3. Delegating to text plugin for full formatting support
 * 4. Preserving all text styling properties (font, color, alignment, etc.)
 * 
 * The PDF output shows only the selected text value without any dropdown
 * indicators, providing a clean, print-ready document.
 * 
 * @param arg - PDF render properties containing schema, value, and rendering context
 * @returns Promise that resolves when the select value is rendered to PDF
 */
export const pdfRender = async (arg: PDFRenderProps<Select>): Promise<void> => {
  const { schema, value } = arg;

  try {
    // Sanitize and validate options for security and consistency
    const sanitizedOptions = sanitizeOptions(schema.options || []);
    
    // Determine the value to render in the PDF
    const renderValue = determineRenderValue(value, sanitizedOptions);
    
    // Handle edge case of no valid options
    if (sanitizedOptions.length === 0) {
      console.warn('Select plugin PDF render: No valid options available, rendering empty value');
      await text.pdf({ ...arg, value: '' });
      return;
    }

    // Delegate to text plugin with the validated value
    // This preserves all text formatting: fonts, colors, alignment, etc.
    await text.pdf({
      ...arg,
      value: renderValue,
    });

  } catch (error) {
    console.error('Select plugin PDF render error:', error);
    
    // Graceful fallback: render error indicator or empty value
    await text.pdf({
      ...arg,
      value: '[Select Error]',
      schema: {
        ...arg.schema,
        fontColor: '#dc3545', // Red color to indicate error
      }
    });
  }
};

/**
 * Determines the appropriate value to render in the PDF
 * 
 * Implements validation logic with fallback behavior:
 * 1. Use current value if it's valid
 * 2. Use first option as fallback if current value is invalid
 * 3. Use empty string if no options are available
 * 
 * @param currentValue - The currently selected value
 * @param validOptions - Array of valid option values
 * @returns The value that should be rendered in the PDF
 */
function determineRenderValue(currentValue: string, validOptions: string[]): string {
  // If current value is valid, use it
  if (isValidOption(currentValue, validOptions)) {
    return currentValue;
  }

  // Log warning about invalid value
  if (currentValue && validOptions.length > 0) {
    console.warn(
      `Select plugin PDF render: Invalid value "${currentValue}" not found in options [${validOptions.join(', ')}]. Using default value.`
    );
  }

  // Fallback to default value (first option or empty string)
  return getDefaultValue(validOptions);
}

/**
 * Advanced PDF rendering with custom formatting options
 * 
 * This function can be used when additional PDF-specific formatting
 * is needed beyond standard text rendering. Currently delegates to
 * the standard pdfRender function but provides extension point.
 * 
 * @param arg - PDF render properties
 * @param options - Additional formatting options for future use
 * @returns Promise that resolves when rendering is complete
 */
export async function pdfRenderWithOptions(
  arg: PDFRenderProps<Select>,
  options: {
    /** Whether to show placeholder text when no valid value exists */
    showPlaceholder?: boolean;
    /** Custom placeholder text */
    placeholderText?: string;
    /** Whether to validate options strictly */
    strictValidation?: boolean;
  } = {}
): Promise<void> {
  const { showPlaceholder = false, placeholderText = '[No Selection]' } = options;
  
  // Use standard rendering by default
  if (!showPlaceholder) {
    return pdfRender(arg);
  }

  // Enhanced rendering with placeholder support
  const { schema, value } = arg;
  const sanitizedOptions = sanitizeOptions(schema.options || []);
  
  let renderValue = determineRenderValue(value, sanitizedOptions);
  
  // Show placeholder if no valid value and placeholder is enabled
  if (!renderValue && showPlaceholder) {
    renderValue = placeholderText;
    
    // Apply different styling for placeholder
    await text.pdf({
      ...arg,
      value: renderValue,
      schema: {
        ...schema,
        fontColor: '#6c757d', // Muted color for placeholder
        fontSize: (schema.fontSize || 12) * 0.9, // Slightly smaller
      }
    });
    return;
  }

  // Standard rendering
  await text.pdf({ ...arg, value: renderValue });
}
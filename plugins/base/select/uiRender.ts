import { UIRenderProps } from "@pdfme/common";
import text from "../text/index";
import { isEditable } from "../../utils";
import { Select, SELECT_CONSTANTS } from "./types";
import { 
  createSelectElement, 
  applyStylesToElement, 
  sanitizeOptions,
  isValidOption,
  getDefaultValue
} from "./helper";
import { ChevronDown } from "lucide";
import { createSvgStr } from "../../utils";
import type * as CSS from "csstype";

/**
 * UI rendering function for Select plugin
 * 
 * Implements the sophisticated overlay technique:
 * 1. Renders styled text display using text plugin
 * 2. Overlays transparent native select element for functionality
 * 3. Adds visual dropdown indicator button
 * 
 * This approach provides the best of both worlds:
 * - Beautiful, customizable text styling from text plugin
 * - Native browser dropdown functionality and accessibility
 * - Consistent behavior across all platforms and browsers
 * 
 * @param arg - UI render properties containing schema, value, onChange, etc.
 */
export const uiRender = async (arg: UIRenderProps<Select>): Promise<void> => {
  const { schema, value, onChange, rootElement, mode } = arg;

  try {
    // Phase 1: Render the styled text display layer
    await renderTextLayer(arg);

    // Phase 2: Add interactive elements only in editable modes
    if (isEditable(mode, schema) && onChange) {
      await renderInteractiveLayer(arg, onChange);
    }

  } catch (error) {
    console.error('Select UI render error:', error);
    renderErrorState(rootElement, error as Error);
  }
};

/**
 * Renders the background text layer using the text plugin
 * 
 * This layer provides the visual appearance with full text styling support.
 * We force 'viewer' mode to prevent text plugin from adding its own interactions.
 */
async function renderTextLayer(arg: UIRenderProps<Select>): Promise<void> {
  const { schema, value } = arg;

  // Validate and sanitize the current value
  const sanitizedOptions = sanitizeOptions(schema.options || []);
  const displayValue = isValidOption(value, sanitizedOptions) 
    ? value 
    : getDefaultValue(sanitizedOptions);

  // Delegate to text plugin for styled rendering
  await text.ui({
    ...arg,
    mode: "viewer", // Force viewer mode to prevent text interactions
    value: displayValue,
  });
}

/**
 * Renders the interactive overlay layer with dropdown functionality
 * 
 * Creates the transparent select element and visual dropdown indicator.
 * Uses advanced positioning and z-index management for perfect overlay.
 */
async function renderInteractiveLayer(
  arg: UIRenderProps<Select>, 
  onChange: (args: { key: string; value: string }) => void
): Promise<void> {
  const { schema, value, rootElement } = arg;

  // Sanitize options for security and consistency
  const sanitizedOptions = sanitizeOptions(schema.options || []);
  
  if (sanitizedOptions.length === 0) {
    console.warn('Select plugin: No valid options available');
    return;
  }

  // Create and configure the dropdown indicator button
  const dropdownButton = createDropdownButton();
  rootElement.appendChild(dropdownButton);

  // Create and configure the overlay select element
  const selectElement = createOverlaySelect(
    sanitizedOptions,
    value,
    (newValue: string) => {
      // Validate the new value before updating
      if (isValidOption(newValue, sanitizedOptions)) {
        onChange({ key: "content", value: newValue });
      } else {
        console.warn(`Select plugin: Invalid value "${newValue}" selected`);
      }
    }
  );

  rootElement.appendChild(selectElement);
}

/**
 * Creates the visual dropdown indicator button
 * 
 * This button provides visual feedback that the element is a dropdown.
 * Positioned outside the main content area for optimal UX.
 */
function createDropdownButton(): HTMLButtonElement {
  const button = document.createElement("button");
  button.innerHTML = createSvgStr(ChevronDown);
  button.setAttribute('aria-hidden', 'true'); // Decorative only
  button.setAttribute('tabindex', '-1'); // Not focusable
  
  const buttonStyles: CSS.Properties = {
    position: "absolute",
    zIndex: SELECT_CONSTANTS.OVERLAY_Z_INDEX.toString(),
    right: `-${SELECT_CONSTANTS.DEFAULT_BUTTON_WIDTH}px`,
    top: "0",
    padding: "0",
    margin: "0",
    cursor: "pointer",
    height: `${SELECT_CONSTANTS.DEFAULT_BUTTON_WIDTH}px`,
    width: `${SELECT_CONSTANTS.DEFAULT_BUTTON_WIDTH}px`,
    border: "1px solid #ccc",
    borderLeft: "none",
    borderRadius: "0 4px 4px 0",
    backgroundColor: "#f8f9fa",
    color: "#666",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
    outline: "none",
  };

  applyStylesToElement(button, buttonStyles);

  // Add hover effects
  button.addEventListener('mouseenter', () => {
    applyStylesToElement(button, {
      backgroundColor: "#e9ecef",
      color: "#495057",
    });
  });

  button.addEventListener('mouseleave', () => {
    applyStylesToElement(button, {
      backgroundColor: "#f8f9fa",
      color: "#666",
    });
  });

  return button;
}

/**
 * Creates the overlay select element with proper configuration
 * 
 * This is the core of the overlay technique - a fully functional
 * but invisible select element positioned over the text display.
 */
function createOverlaySelect(
  options: string[],
  currentValue: string,
  onChange: (value: string) => void
): HTMLSelectElement {
  const selectElement = createSelectElement(options, currentValue, onChange);

  // Enhanced overlay styles for perfect positioning
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
    fontSize: "inherit",
    fontFamily: "inherit",
    zIndex: "1", // Above text but below any modals
    backgroundColor: "transparent",
  };

  applyStylesToElement(selectElement, overlayStyles);

  // Add accessibility attributes
  selectElement.setAttribute('aria-label', 'Select option');
  if (options.length > 0) {
    selectElement.setAttribute('aria-describedby', 'select-options');
  }

  return selectElement;
}

/**
 * Renders an error state when the plugin fails to render properly
 * 
 * Provides graceful degradation with helpful error information.
 */
function renderErrorState(rootElement: HTMLElement, error: Error): void {
  rootElement.innerHTML = '';
  
  const errorContainer = document.createElement('div');
  const errorStyles: CSS.Properties = {
    padding: '8px',
    border: '2px solid #dc3545',
    borderRadius: '4px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    fontSize: '12px',
    fontFamily: 'monospace',
    wordBreak: 'break-word',
  };
  
  applyStylesToElement(errorContainer, errorStyles);
  
  errorContainer.innerHTML = `
    <strong>Select Plugin Error:</strong><br>
    ${escapeHtml(error.message)}
  `;
  
  rootElement.appendChild(errorContainer);
}

/**
 * Utility function to escape HTML for safe error display
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
import { TextSchema } from "../text/types";
import { PropPanelWidgetProps, SchemaForUI } from "@pdfme/common";

/**
 * Select plugin schema interface extending TextSchema
 *
 * This interface combines all text formatting capabilities with dropdown functionality.
 * The selected value inherits all text styling properties (font, color, alignment, etc.)
 *
 * @extends TextSchema - Inherits all text formatting properties
 */
export interface Select extends TextSchema {
  /** Array of selectable options displayed in the dropdown */
  options: string[];
}

/**
 * Extended schema interface for UI operations
 * Used internally for property panel and schema manipulation
 */
export interface SelectSchemaForUI extends SchemaForUI, Select {}

/**
 * Configuration interface for the options management widget
 * Provides type safety for the addOptions custom widget
 */
export interface OptionsWidgetConfig {
  /** Maximum number of options allowed (for validation) */
  maxOptions?: number;
  /** Minimum number of options required (for validation) */
  minOptions?: number;
  /** Whether to allow empty options */
  allowEmptyOptions?: boolean;
  /** Custom validation function for option values */
  validateOption?: (option: string) => boolean | string;
}

/**
 * Props interface for the addOptions custom widget
 * Extends base PropPanelWidgetProps with select-specific properties
 */
export interface AddOptionsWidgetProps extends PropPanelWidgetProps {
  /** Configuration for options management behavior */
  config?: OptionsWidgetConfig;
}

/**
 * CSS style properties interface for consistent styling
 * Used internally for DOM element styling
 */
export interface SelectUIStyles {
  /** Input field styling */
  input: Partial<CSSStyleDeclaration>;
  /** Button styling */
  button: Partial<CSSStyleDeclaration>;
  /** Container styling */
  container: Partial<CSSStyleDeclaration>;
  /** List styling */
  list: Partial<CSSStyleDeclaration>;
}

/**
 * Options validation result interface
 * Provides detailed feedback for option validation
 */
export interface OptionsValidationResult {
  /** Whether the options array is valid */
  isValid: boolean;
  /** Array of validation error messages */
  errors: string[];
  /** Sanitized/corrected options array */
  sanitizedOptions?: string[];
  /** Warnings that don't prevent usage but should be shown */
  warnings?: string[];
}

/**
 * Select element event handler types
 * Provides type safety for event handling
 */
export interface SelectEventHandlers {
  /** Handler for select element change events */
  onChange: (value: string) => void;
  /** Handler for option addition */
  onOptionAdd?: (option: string) => void;
  /** Handler for option removal */
  onOptionRemove?: (index: number) => void;
  /** Handler for option update */
  onOptionUpdate?: (index: number, newValue: string) => void;
}

/**
 * Internal state interface for options management
 * Used by the addOptions widget for state tracking
 */
export interface OptionsManagementState {
  /** Current array of options */
  currentOptions: string[];
  /** Whether the widget is in edit mode */
  isEditing: boolean;
  /** Index of currently editing option (-1 if none) */
  editingIndex: number;
  /** Temporary value during editing */
  tempValue: string;
}

/**
 * Constants for select plugin configuration
 */
export const SELECT_CONSTANTS = {
  /** Default width for the select button (in pixels) */
  DEFAULT_BUTTON_WIDTH: 30,
  /** Default maximum number of options */
  DEFAULT_MAX_OPTIONS: 50,
  /** Default minimum number of options */
  DEFAULT_MIN_OPTIONS: 1,
  /** Z-index for overlay elements */
  OVERLAY_Z_INDEX: -1,
  /** Default placeholder text for option input */
  DEFAULT_OPTION_PLACEHOLDER: "Enter option...",
} as const;

/**
 * Utility type for select plugin modes
 * Helps with type-safe mode checking
 */
export type SelectMode = "designer" | "form" | "viewer";

/**
 * Type guard to check if a schema is a Select schema
 * Useful for plugin composition and validation
 */
export function isSelectSchema(schema: any): schema is Select {
  return (
    schema &&
    typeof schema === "object" &&
    Array.isArray(schema.options) &&
    typeof schema.type === "string" &&
    schema.type === "select"
  );
}

/**
 * Type for select option with metadata
 * Extended option type for future enhancements
 */
export interface SelectOptionWithMetadata {
  /** The option value */
  value: string;
  /** Optional display label (if different from value) */
  label?: string;
  /** Whether this option is disabled */
  disabled?: boolean;
  /** Optional grouping information */
  group?: string;
  /** Optional metadata for custom extensions */
  metadata?: Record<string, any>;
}

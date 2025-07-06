import { Schema } from "@pdfme/common";

/**
 * RadioGroup schema interface extending base Schema
 * Defines the structure for radio button group elements
 */
export interface RadioGroup extends Schema {
  /** The group name that links radio buttons together - only one can be selected per group */
  group: string;
  /** The color of the radio button icon (both circle and dot) */
  color: string;
}

/**
 * State interface for managing individual radio button instances
 * Used internally for tracking state and onChange callbacks
 */
export interface RadioButtonState {
  /** Current value of the radio button ("true" or "false") */
  value: string;
  /** Callback function to update the radio button's state */
  onChange: (arg: { key: string; value: string }) => void;
}

/**
 * Properties for icon generation functions
 */
export interface IconProps {
  /** The current value of the radio button */
  value: string;
  /** The color to apply to the icon */
  color: string;
}
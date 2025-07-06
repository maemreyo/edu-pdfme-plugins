import { Plugin } from "@pdfme/common";
import { RadioGroup } from "./types";
import { uiRender } from "./uiRender";
import { pdfRender } from "./pdfRender";
import { propPanel } from "./propPanel";
import { getCheckedIcon } from "./utils";

/**
 * RadioGroup Plugin
 * 
 * A form control plugin that provides radio button functionality.
 * Radio buttons in the same group are mutually exclusive - only one can be selected at a time.
 * 
 * Features:
 * - Event-driven communication between radio buttons in the same group
 * - Customizable color and group assignment
 * - SVG-based rendering for crisp display at any size
 * - Full separation of concerns with modular architecture
 * 
 * Usage:
 * - Set the 'group' property to link radio buttons together
 * - Only one radio button per group can be selected
 * - Use in forms for multiple-choice questions or option selection
 */
const radioGroupSchema: Plugin<RadioGroup> = {
  /**
   * UI rendering function
   * Handles visual presentation and user interaction
   */
  ui: uiRender,

  /**
   * PDF rendering function  
   * Renders the radio button icon in PDF documents
   */
  pdf: pdfRender,

  /**
   * Property panel configuration
   * Provides form interface for configuring radio button properties
   */
  propPanel,

  /**
   * Plugin icon displayed in the design interface
   * Uses a checked radio button icon to represent the plugin
   */
  icon: getCheckedIcon(),
};

export default radioGroupSchema;
export { RadioGroup } from "./types";
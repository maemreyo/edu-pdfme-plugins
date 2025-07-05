import type { Plugin } from "@pdfme/common";
import { pdfRender } from "./pdfRender";
import { propPanel } from "./propPanel";
import { uiRender } from "./uiRender";
import type { LinedAnswerBoxSchema } from "./types";
import { FileText } from "lucide";
import { createSvgStr } from "../../utils";

/**
 * Lined Answer Box Plugin for pdfme
 * 
 * This plugin creates essay-style answer boxes with horizontal guide lines
 * to help students write neatly organized responses.
 * 
 * Key Features:
 * - Multi-layer UI with guide lines and text overlay
 * - Customizable line spacing, color, and style
 * - Smart text alignment with guide lines
 * - PDF output with optional line inclusion
 * - Responsive to box resizing in designer mode
 * 
 * Use Cases:
 * - Essay questions on exams
 * - Short answer sections
 * - Writing practice sheets
 * - Form fields requiring neat handwriting
 * 
 * Technical Architecture:
 * - Extends TextSchema for text formatting capabilities
 * - Custom UI rendering with DOM layers (lines + text)
 * - Advanced PDF rendering with optional guide lines
 * - Comprehensive property panel for customization
 * 
 * Usage Example:
 * ```typescript
 * const answerBox = {
 *   type: 'linedAnswerBox',
 *   position: { x: 20, y: 50 },
 *   width: 160,
 *   height: 60,
 *   lineSpacing: 8,
 *   lineColor: '#CCCCCC',
 *   padding: 5,
 *   showLinesInPdf: false,
 *   content: '' // Will be filled by students
 * };
 * ```
 */
const linedAnswerBoxSchema: Plugin<LinedAnswerBoxSchema> = {
  // Custom PDF rendering with optional guide lines
  pdf: pdfRender,
  
  // Multi-layer UI rendering with lines and text overlay
  ui: uiRender,
  
  // Extended property panel with line controls
  propPanel,
  
  // Use FileText icon to represent a document with lines
  icon: createSvgStr(FileText),
  
  // Enable smooth editing experience
  uninterruptedEditMode: true,
};

export default linedAnswerBoxSchema;

// Export types for external use
export type { LinedAnswerBoxSchema, LineCalculation, LineRenderConfig } from './types';

// Export utility functions for advanced usage
export {
  calculateLinePositions,
  validateSchema,
  mmToPx,
  pxToMm,
  renderLines,
  calculateTextAlignment,
  DEFAULT_VALUES,
} from './helpers';

// Export alternative rendering function
export { uiRenderWithGrid } from './uiRender';

// Export validation utilities
export { validatePropPanelValues } from './propPanel';
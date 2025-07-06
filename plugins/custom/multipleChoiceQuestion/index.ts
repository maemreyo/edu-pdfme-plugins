import type { Plugin } from "@pdfme/common";
import { pdfRender } from "./pdfRender";
import { propPanel } from "./propPanel";
import { uiRender } from "./uiRender";
import type { MultipleChoiceQuestionSchema } from "./types";
import { ListChecks } from "lucide";
import { createSvgStr } from "../../utils";

/**
 * Multiple Choice Question Plugin for pdfme
 * 
 * A self-contained plugin that manages complete multiple choice questions
 * as single, cohesive blocks with superior designer experience.
 * 
 * Features:
 * - **Self-Contained Design**: Entire question (text + choices) in one plugin
 * - **Automatic Layout**: Auto-adjusting height based on content
 * - **Designer Mode**: Inline editing of question and choices
 * - **Form Mode**: Interactive radio button selection
 * - **Advanced PropPanel**: Custom choice management with add/remove functionality
 * - **Layout Control**: Configurable spacing, styling, and positioning
 * - **Correct Answer Tracking**: Built-in support for answer validation
 * 
 * Usage:
 * 1. Designer mode: Drag plugin, edit question and choices inline
 * 2. PropPanel: Manage choices, set correct answer, configure styling
 * 3. Form mode: Students click choices to select answers
 * 4. PDF output: Clean rendering with proper layout and selected answers
 * 
 * Architecture:
 * - Custom UI rendering with calculated DOM positioning
 * - Custom PDF rendering with precise coordinate calculation
 * - Comprehensive property panel with choice management widgets
 * - Automatic height adjustment based on content
 */
const multipleChoiceQuestionSchema: Plugin<MultipleChoiceQuestionSchema> = {
  // Custom PDF rendering with calculated positioning
  pdf: pdfRender,
  
  // Custom UI rendering with automatic layout management
  ui: uiRender,
  
  // Advanced property panel with choice management
  propPanel,
  
  // Use ListChecks icon to represent multiple choice questions
  icon: createSvgStr(ListChecks),
  
  // Enable uninterrupted edit mode for smooth user experience
  uninterruptedEditMode: true,
};

export default multipleChoiceQuestionSchema;

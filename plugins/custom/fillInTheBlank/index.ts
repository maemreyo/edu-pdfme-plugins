import type { Plugin } from "@pdfme/common";
import { pdfRender } from "../../base/multiVariableText/pdfRender";
import { propPanel } from "./propPanel";
import { uiRender } from "./uiRender";
import type { FillInTheBlankSchema } from "./types";
import { Type } from "lucide";
import { createSvgStr } from "../../utils";

/**
 * Fill-In-The-Blank Plugin for pdfme
 * 
 * This plugin extends multiVariableText to provide educational forms with styled blank spaces.
 * 
 * Features:
 * - Designer Mode: Same interface as multiVariableText for creating templates with {variable} syntax
 * - Form Mode: Variables appear as styled blank spaces (underline or box) for student input
 * - Inherits all multiVariableText functionality (variable management, PDF rendering, etc.)
 * - Customizable blank styles through property panel
 * 
 * Usage:
 * 1. In designer mode, create text like "The capital of France is {answer}"
 * 2. In form mode, students see "The capital of France is ______" with editable blanks
 * 3. PDF output shows the completed text with student answers
 */
const fillInTheBlankSchema: Plugin<FillInTheBlankSchema> = {
  // Delegate PDF rendering to multiVariableText - it handles variable substitution perfectly
  pdf: pdfRender,
  
  // Custom UI rendering with styled blanks for form mode
  ui: uiRender,
  
  // Extended property panel with blank style options
  propPanel,
  
  // Use Type icon from lucide to represent text with variables
  icon: createSvgStr(Type),
  
  // Enable uninterrupted edit mode for smooth user experience
  uninterruptedEditMode: true,
};

export default fillInTheBlankSchema;
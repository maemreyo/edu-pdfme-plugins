import type { Plugin } from "@pdfme/common";
import { pdfRender } from "./pdfRender";
import { propPanel } from "./propPanel";
import { uiRender } from "./uiRender";
import type { CalloutBoxSchema } from "./types";
import { MessageSquare } from "lucide";
import { createSvgStr } from "../../utils";

/**
 * CalloutBox Plugin for pdfme
 * 
 * A self-contained plugin for educational highlights, definitions, tips, and warnings.
 * Solves the layout management issues of traditional template block approaches.
 * 
 * Features:
 * - **Self-Contained Design**: Background + icon + title + content in one unified plugin
 * - **Automatic Layout Management**: Auto-adjusting height based on content length
 * - **Measurement-Based Rendering**: Virtual rendering phase for precise height calculation
 * - **Designer Mode**: Inline editing with visual feedback and auto-resize
 * - **Educational Icon Library**: Curated collection of educational icons
 * - **Quick Style Presets**: Predefined styles for different callout types
 * - **Advanced Styling**: Independent control over background, borders, title, and body
 * - **Layout Controls**: Configurable padding, spacing, and icon sizing
 * 
 * Technical Architecture:
 * - **4-Phase Rendering**: Measurement → Calculation → Height Adjustment → DOM Rendering
 * - **Layered PDF Output**: Background → Icon → Title → Body with precise positioning
 * - **Custom PropPanel Widgets**: IconPicker and CalloutType managers
 * - **Type-Safe Configuration**: Full TypeScript support with predefined callout types
 * 
 * Usage:
 * 1. Designer mode: Drag plugin, edit title/content inline, auto-height adjustment
 * 2. PropPanel: Select icons, choose quick styles, configure layout and appearance
 * 3. PDF output: Clean layered rendering with proper spacing and styling
 * 
 * Comparison with Template Blocks:
 * - ✅ Unified management vs scattered schemas
 * - ✅ Automatic layout vs manual positioning
 * - ✅ Content-aware height vs fixed sizing
 * - ✅ Centralized styling vs distributed controls
 * - ✅ Professional UX vs fragmented workflow
 */
const calloutBoxSchema: Plugin<CalloutBoxSchema> = {
  // Custom PDF rendering with layered approach
  pdf: pdfRender,
  
  // Measurement-based UI rendering with automatic layout
  ui: uiRender,
  
  // Advanced property panel with custom widgets
  propPanel,
  
  // Use MessageSquare icon to represent callout/info boxes
  icon: createSvgStr(MessageSquare),
  
  // Enable uninterrupted edit mode for smooth content editing
  uninterruptedEditMode: true,
};

export default calloutBoxSchema;

/**
 * Block Composers for pdfme
 * 
 * This module provides high-level composition functions for creating
 * complex educational form elements by combining pdfme's base plugins.
 * 
 * Philosophy:
 * Instead of creating new plugins, we compose existing plugins (text, radioGroup, etc.)
 * into reusable "blocks" that serve specific educational purposes.
 * 
 * Benefits:
 * - Faster development by reusing existing, tested plugins
 * - Easier maintenance since we don't duplicate plugin logic
 * - Teaches proper pdfme SDK usage patterns
 * - Enables rapid prototyping of new educational elements
 */

// Main block generators
export { 
  createMultipleChoiceBlock,
  createPresetMultipleChoiceBlock,
  findMultipleChoiceBlocks,
  removeMultipleChoiceBlock
} from './multipleChoiceBlock';

// Types for external use
export type { 
  MultipleChoiceBlockOptions,
  MultipleChoiceBlockResult,
  ElementPosition,
  BlockLayout
} from './types';

// Helper utilities
export { 
  generateBlockIds,
  calculateBlockLayout,
  calculateBlockDimensions,
  validateBlockOptions,
  addChoiceLabels,
  DEFAULT_STYLE
} from './helpers';

/**
 * Convenience object for easy import of all block composers
 * 
 * @example
 * ```typescript
 * import { blockComposers } from './utils/blockComposers';
 * 
 * const questionBlock = blockComposers.createMultipleChoiceBlock({
 *   position: { x: 10, y: 20 },
 *   questionText: "Sample question?",
 *   choices: ["Option A", "Option B", "Option C"]
 * });
 * ```
 */
export const blockComposers = {
  createMultipleChoiceBlock,
  createPresetMultipleChoiceBlock,
  findMultipleChoiceBlocks,
  removeMultipleChoiceBlock,
};
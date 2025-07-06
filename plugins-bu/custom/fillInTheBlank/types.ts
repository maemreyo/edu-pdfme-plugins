import type { MultiVariableTextSchema } from '../../base/multiVariableText/types';

/**
 * Schema interface for FillInTheBlank plugin
 * Extends MultiVariableTextSchema with custom styling options for blank spaces
 */
export interface FillInTheBlankSchema extends MultiVariableTextSchema {
  /**
   * Visual style for blank spaces in form mode
   * - 'underline': Shows blanks as underlined spaces
   * - 'box': Shows blanks as bordered boxes
   * @default 'underline'
   */
  blankStyle?: 'underline' | 'box';
}
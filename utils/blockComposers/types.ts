/**
 * Configuration options for creating a multiple choice question block
 */
export interface MultipleChoiceBlockOptions {
  /** Base position where the block should be placed */
  position: {
    x: number;
    y: number;
  };
  
  /** Width of the entire block */
  width?: number;
  
  /** Question text content */
  questionText: string;
  
  /** Array of choice options (A, B, C, D) */
  choices: string[];
  
  /** Custom styling options */
  style?: {
    questionFontSize?: number;
    choiceFontSize?: number;
    spacing?: number;
    radioSize?: number;
    choiceIndent?: number;
  };
  
  /** Optional custom IDs for the block */
  customIds?: {
    groupId?: string;
    radioGroupName?: string;
  };
}

/**
 * Result of creating a multiple choice block
 * Contains all the schema objects that make up the block
 */
export interface MultipleChoiceBlockResult {
  /** Array of schema objects to add to the template */
  schemas: any[];
  
  /** The group ID used for this block (for future manipulation) */
  groupId: string;
  
  /** The radio group name used (for form data collection) */
  radioGroupName: string;
  
  /** Calculated dimensions of the entire block */
  dimensions: {
    width: number;
    height: number;
  };
}

/**
 * Individual element positioning within the block
 */
export interface ElementPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Layout configuration for positioning elements
 */
export interface BlockLayout {
  question: ElementPosition;
  choices: ElementPosition[];
  radios: ElementPosition[];
}
import type { 
  MultipleChoiceBlockOptions, 
  MultipleChoiceBlockResult 
} from './types';
import { 
  generateBlockIds, 
  calculateBlockLayout, 
  calculateBlockDimensions,
  validateBlockOptions,
  addChoiceLabels,
  DEFAULT_STYLE 
} from './helpers';

/**
 * Create a Multiple Choice Question Block
 * 
 * This function generates a complete multiple choice question using pdfme's 
 * composition approach. It creates an array of schema objects that work together
 * as a unified block.
 * 
 * Features:
 * - Uses `text` plugin for question and choice labels
 * - Uses `radioGroup` plugin for selectable options
 * - Automatic positioning and layout calculation
 * - Unified `groupId` for moving/manipulating as single unit
 * - Shared radio `group` for mutual exclusion
 * 
 * @param options Configuration for the multiple choice block
 * @returns Object containing schemas array and metadata
 * 
 * @example
 * ```typescript
 * const questionBlock = createMultipleChoiceBlock({
 *   position: { x: 10, y: 20 },
 *   questionText: "What is the capital of France?",
 *   choices: ["London", "Berlin", "Paris", "Madrid"],
 *   width: 200
 * });
 * 
 * // Add to pdfme template
 * const newSchemas = [...template.schemas, ...questionBlock.schemas];
 * designer.updateTemplate({ ...template, schemas: newSchemas });
 * ```
 */
export function createMultipleChoiceBlock(
  options: MultipleChoiceBlockOptions
): MultipleChoiceBlockResult {
  // Validate input options
  validateBlockOptions(options);
  
  // Generate unique IDs for all elements
  const ids = generateBlockIds(options.customIds);
  
  // Calculate layout positions for all elements
  const layout = calculateBlockLayout(options);
  
  // Calculate total block dimensions
  const dimensions = calculateBlockDimensions(layout);
  
  // Generate choice labels with letters (A, B, C, D...)
  const labeledChoices = addChoiceLabels(options.choices);
  
  // Build schema array
  const schemas: any[] = [];
  
  // 1. Create question text schema
  schemas.push({
    id: ids.questionId,
    type: "text",
    position: { 
      x: layout.question.x, 
      y: layout.question.y 
    },
    width: layout.question.width,
    height: layout.question.height,
    content: options.questionText,
    fontSize: options.style?.questionFontSize || DEFAULT_STYLE.questionFontSize,
    fontName: "Helvetica-Bold", // Make question text bold
    groupId: ids.groupId,
  });
  
  // 2. Create radio buttons and choice text for each option
  options.choices.forEach((choice, index) => {
    const radioPos = layout.radios[index];
    const choicePos = layout.choices[index];
    
    // Create radio button schema
    schemas.push({
      id: ids.getRadioId(index),
      type: "radioGroup",
      position: { 
        x: radioPos.x, 
        y: radioPos.y 
      },
      width: radioPos.width,
      height: radioPos.height,
      group: ids.radioGroupName, // CRITICAL: Same group for mutual exclusion
      groupId: ids.groupId,
    });
    
    // Create choice text schema
    schemas.push({
      id: ids.getChoiceTextId(index),
      type: "text",
      position: { 
        x: choicePos.x, 
        y: choicePos.y 
      },
      width: choicePos.width,
      height: choicePos.height,
      content: labeledChoices[index],
      fontSize: options.style?.choiceFontSize || DEFAULT_STYLE.choiceFontSize,
      verticalAlignment: "middle",
      groupId: ids.groupId,
    });
  });
  
  return {
    schemas,
    groupId: ids.groupId,
    radioGroupName: ids.radioGroupName,
    dimensions,
  };
}

/**
 * Create a preset multiple choice question with common educational topics
 * 
 * @param type Preset question type
 * @param position Where to place the block
 * @returns Complete question block ready to use
 */
export function createPresetMultipleChoiceBlock(
  type: 'geography' | 'science' | 'math' | 'history',
  position: { x: number; y: number }
): MultipleChoiceBlockResult {
  const presets = {
    geography: {
      questionText: "What is the capital of France?",
      choices: ["London", "Berlin", "Paris", "Madrid"]
    },
    science: {
      questionText: "What is the chemical symbol for water?",
      choices: ["H2O", "CO2", "NaCl", "O2"]
    },
    math: {
      questionText: "What is 15 + 27?",
      choices: ["32", "42", "52", "62"]
    },
    history: {
      questionText: "In which year did World War II end?",
      choices: ["1944", "1945", "1946", "1947"]
    }
  };
  
  const preset = presets[type];
  
  return createMultipleChoiceBlock({
    position,
    questionText: preset.questionText,
    choices: preset.choices,
    width: 200,
  });
}

/**
 * Helper function to find all multiple choice blocks in a template by groupId pattern
 * 
 * @param schemas Array of existing schemas
 * @returns Array of group IDs that appear to be multiple choice blocks
 */
export function findMultipleChoiceBlocks(schemas: any[]): string[] {
  const groupIds = new Set<string>();
  
  schemas.forEach(schema => {
    if (schema.groupId && schema.groupId.includes('question_group_')) {
      groupIds.add(schema.groupId);
    }
  });
  
  return Array.from(groupIds);
}

/**
 * Remove a multiple choice block from template by groupId
 * 
 * @param schemas Current template schemas
 * @param groupId Group ID of the block to remove
 * @returns New schemas array without the specified block
 */
export function removeMultipleChoiceBlock(schemas: any[], groupId: string): any[] {
  return schemas.filter(schema => schema.groupId !== groupId);
}
import type { 
  MultipleChoiceBlockOptions, 
  BlockLayout, 
  ElementPosition 
} from './types';

/**
 * Default styling constants for multiple choice blocks
 */
export const DEFAULT_STYLE = {
  questionFontSize: 12,
  choiceFontSize: 10,
  spacing: 8,
  radioSize: 8,
  choiceIndent: 15,
  questionHeight: 20,
  choiceHeight: 12,
  radioVerticalOffset: 2, // Offset to align radio with text baseline
} as const;

/**
 * Generate unique IDs for a multiple choice block
 * @param customIds Optional custom ID overrides
 * @returns Object containing unique IDs for the block
 */
export function generateBlockIds(customIds?: { groupId?: string; radioGroupName?: string }) {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  
  return {
    groupId: customIds?.groupId || `question_group_${timestamp}_${random}`,
    radioGroupName: customIds?.radioGroupName || `answer_for_q${timestamp}_${random}`,
    questionId: `question_text_${timestamp}_${random}`,
    getRadioId: (choiceIndex: number) => `radio_${String.fromCharCode(65 + choiceIndex)}_${timestamp}_${random}`,
    getChoiceTextId: (choiceIndex: number) => `text_${String.fromCharCode(65 + choiceIndex)}_${timestamp}_${random}`,
  };
}

/**
 * Calculate layout positions for all elements in the block
 * @param options Block configuration options
 * @returns Layout object with positions for all elements
 */
export function calculateBlockLayout(options: MultipleChoiceBlockOptions): BlockLayout {
  const style = { ...DEFAULT_STYLE, ...options.style };
  const { position, width = 180, choices } = options;
  
  // Question positioning (at the top)
  const question: ElementPosition = {
    x: position.x,
    y: position.y,
    width: width,
    height: style.questionHeight,
  };
  
  // Calculate positions for choices and radios
  const choiceElements: ElementPosition[] = [];
  const radioElements: ElementPosition[] = [];
  
  let currentY = position.y + style.questionHeight + style.spacing;
  
  choices.forEach((_, index) => {
    // Radio button positioning (left side)
    radioElements.push({
      x: position.x + style.choiceIndent,
      y: currentY + style.radioVerticalOffset,
      width: style.radioSize,
      height: style.radioSize,
    });
    
    // Choice text positioning (right of radio)
    choiceElements.push({
      x: position.x + style.choiceIndent + style.radioSize + 5, // 5px gap between radio and text
      y: currentY,
      width: width - style.choiceIndent - style.radioSize - 5,
      height: style.choiceHeight,
    });
    
    currentY += style.choiceHeight + style.spacing;
  });
  
  return {
    question,
    choices: choiceElements,
    radios: radioElements,
  };
}

/**
 * Calculate the total dimensions of the block
 * @param layout Block layout with all element positions
 * @returns Total width and height of the block
 */
export function calculateBlockDimensions(layout: BlockLayout): { width: number; height: number } {
  const allElements = [layout.question, ...layout.choices, ...layout.radios];
  
  let maxX = 0;
  let maxY = 0;
  let minX = Infinity;
  let minY = Infinity;
  
  allElements.forEach(element => {
    minX = Math.min(minX, element.x);
    minY = Math.min(minY, element.y);
    maxX = Math.max(maxX, element.x + element.width);
    maxY = Math.max(maxY, element.y + element.height);
  });
  
  return {
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Validate block options and provide helpful error messages
 * @param options Block configuration to validate
 * @throws Error if options are invalid
 */
export function validateBlockOptions(options: MultipleChoiceBlockOptions): void {
  if (!options.position) {
    throw new Error('Position is required for multiple choice block');
  }
  
  if (typeof options.position.x !== 'number' || typeof options.position.y !== 'number') {
    throw new Error('Position must have numeric x and y coordinates');
  }
  
  if (!options.questionText || options.questionText.trim() === '') {
    throw new Error('Question text is required and cannot be empty');
  }
  
  if (!Array.isArray(options.choices) || options.choices.length === 0) {
    throw new Error('Choices array is required and must contain at least one choice');
  }
  
  if (options.choices.length > 8) {
    throw new Error('Maximum of 8 choices supported (A-H)');
  }
  
  if (options.choices.some(choice => !choice || choice.trim() === '')) {
    throw new Error('All choices must be non-empty strings');
  }
  
  if (options.width && options.width < 50) {
    throw new Error('Block width must be at least 50 units');
  }
}

/**
 * Generate choice labels with letters (A, B, C, D, etc.)
 * @param choices Array of choice texts
 * @returns Array of choices with letter prefixes
 */
export function addChoiceLabels(choices: string[]): string[] {
  return choices.map((choice, index) => {
    const letter = String.fromCharCode(65 + index); // A, B, C, D...
    return `${letter}. ${choice}`;
  });
}
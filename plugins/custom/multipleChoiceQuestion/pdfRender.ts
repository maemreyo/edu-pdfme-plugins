import { PDFRenderProps } from "@pdfme/common";
import type { MultipleChoiceQuestionSchema } from "./types";
import { pdfRender as textPdfRender } from "../../base/text/pdfRender";
import { pdfRender as radioGroupPdfRender } from "../../base/radioGroup/pdfRender";

/**
 * PDF rendering function for MultipleChoiceQuestion plugin
 * Renders the complete question block with calculated positioning
 */
export const pdfRender = async (arg: PDFRenderProps<MultipleChoiceQuestionSchema>) => {
  const { value, schema, page, ...rest } = arg;

  let currentY = schema.position.y;

  // 1. Render Question
  const questionHeight = await renderQuestionPDF({
    ...arg,
    currentY,
  });
  currentY += questionHeight + schema.layout.questionSpacing;

  // 2. Render Choices
  await renderChoicesPDF({
    ...arg,
    currentY,
  });
};

/**
 * Render the question text in PDF
 */
async function renderQuestionPDF(arg: PDFRenderProps<MultipleChoiceQuestionSchema> & {
  currentY: number;
}): Promise<number> {
  const { schema, currentY, ...rest } = arg;

  // Render question using text plugin
  await textPdfRender({
    ...rest,
    value: schema.question,
    schema: {
      ...schema,
      ...schema.questionStyle,
      type: 'text',
      id: `question-${schema.id}`,
      position: {
        x: schema.position.x,
        y: currentY,
      },
      width: schema.width,
      height: 20, // Will be calculated properly by text plugin
    },
  });

  // For now, return estimated height - in a real implementation,
  // you'd need to calculate the actual text height
  const estimatedHeight = calculateTextHeight(schema.question, schema.questionStyle, schema.width);
  return estimatedHeight;
}

/**
 * Render all choices with radio buttons in PDF
 */
async function renderChoicesPDF(arg: PDFRenderProps<MultipleChoiceQuestionSchema> & {
  currentY: number;
}): Promise<void> {
  const { schema, value, currentY, ...rest } = arg;

  let choicesY = currentY;

  for (let i = 0; i < schema.choices.length; i++) {
    const choice = schema.choices[i];
    const isSelected = value === choice.id;

    // 1. Render radio button
    await radioGroupPdfRender({
      ...rest,
      value: isSelected ? 'true' : 'false',
      schema: {
        ...schema,
        type: 'radioGroup',
        id: `radio-${choice.id}`,
        position: {
          x: schema.position.x,
          y: choicesY,
        },
        width: schema.layout.radioSize,
        height: schema.layout.radioSize,
        group: `mcq-${schema.id}`,
      },
    });

    // 2. Render choice text
    const textX = schema.position.x + schema.layout.radioSize + schema.layout.radioTextSpacing;
    const textWidth = schema.width - schema.layout.radioSize - schema.layout.radioTextSpacing;

    await textPdfRender({
      ...rest,
      value: choice.text,
      schema: {
        ...schema,
        ...schema.choiceStyle,
        type: 'text',
        id: `choice-text-${choice.id}`,
        position: {
          x: textX,
          y: choicesY,
        },
        width: textWidth,
        height: 15, // Will be calculated by text plugin
      },
    });

    // Calculate height for this choice and move to next position
    const choiceHeight = Math.max(
      calculateTextHeight(choice.text, schema.choiceStyle, textWidth),
      schema.layout.radioSize
    );
    
    choicesY += choiceHeight + schema.layout.choiceSpacing;
  }
}

/**
 * Estimate text height based on content and styling
 * This is a simplified calculation - in a real implementation,
 * you'd use more sophisticated text measurement
 */
function calculateTextHeight(
  text: string,
  style: any,
  width: number
): number {
  const fontSize = style?.fontSize || 11;
  const lineHeight = fontSize * 1.2;
  
  // Rough estimation - you'd need proper text measurement here
  const charsPerLine = Math.floor(width * 2.5 / fontSize); // Rough approximation
  const lines = Math.max(1, Math.ceil(text.length / charsPerLine));
  
  return lines * lineHeight;
}
import { UIRenderProps } from "@pdfme/common";
import type { MultipleChoiceQuestionSchema, Choice } from "./types";
import { uiRender as textUiRender } from "../../base/text/uiRender";
import { createSvgStr } from "../../utils";
import { Circle, CircleDot } from "lucide";

/**
 * Main UI render function for MultipleChoiceQuestion plugin
 * Creates a self-contained question block with automatic layout management
 */
export const uiRender = async (arg: UIRenderProps<MultipleChoiceQuestionSchema>) => {
  const { value, schema, rootElement, mode, onChange, ...rest } = arg;

  // Clear any existing content
  rootElement.innerHTML = '';
  
  // Set up container styles
  rootElement.style.position = 'relative';
  rootElement.style.overflow = 'visible';
  rootElement.style.border = mode === 'designer' ? '1px dashed #ccc' : 'none';
  rootElement.style.borderRadius = '4px';
  rootElement.style.padding = '8px';
  rootElement.style.backgroundColor = mode === 'designer' ? '#fafafa' : 'transparent';

  // Create main container
  const container = document.createElement('div');
  container.style.width = '100%';
  container.style.position = 'relative';
  rootElement.appendChild(container);

  let currentY = 0;

  // 1. Render Question
  const questionHeight = await renderQuestion({
    ...arg,
    container,
    currentY,
  });
  currentY += questionHeight + schema.layout.questionSpacing;

  // 2. Render Choices
  const choicesHeight = await renderChoices({
    ...arg,
    container,
    currentY,
  });
  currentY += choicesHeight;

  // 3. Auto-adjust height if needed
  const totalRequiredHeight = currentY + 16; // Add padding
  const currentHeight = schema.height || 0;
  
  if (Math.abs(totalRequiredHeight - currentHeight) > 5) { // Allow 5mm tolerance
    if (onChange) {
      onChange({ key: 'height', value: totalRequiredHeight });
    }
  }
};

/**
 * Render the question text portion
 */
async function renderQuestion(arg: UIRenderProps<MultipleChoiceQuestionSchema> & {
  container: HTMLElement;
  currentY: number;
}): Promise<number> {
  const { schema, container, currentY, mode, onChange } = arg;

  // Create question div
  const questionDiv = document.createElement('div');
  questionDiv.style.position = 'absolute';
  questionDiv.style.left = '0px';
  questionDiv.style.top = `${currentY}mm`;
  questionDiv.style.width = `${schema.width}mm`;
  questionDiv.style.minHeight = '15mm';
  questionDiv.id = `question-${schema.id}`;
  
  if (mode === 'designer') {
    questionDiv.style.border = '1px dashed #999';
    questionDiv.style.borderRadius = '2px';
  }
  
  container.appendChild(questionDiv);

  // Render question text using text plugin
  await textUiRender({
    ...arg,
    value: schema.question,
    schema: {
      ...schema.questionStyle,
      type: 'text',
      name: `question-${schema.id}`,
      id: `question-${schema.id}`,
      width: schema.width,
      height: 20,
      position: { x: 0, y: 0 },
      readOnly: false,
    },
    rootElement: questionDiv,
    onChange: (changeArg: { key: string; value: unknown }) => {
      if (changeArg.key === 'content' && onChange) {
        onChange({ key: 'question', value: changeArg.value });
      }
    },
  });

  // Calculate actual height needed
  const questionHeight = Math.max(15, questionDiv.scrollHeight / 3.78); // Convert px to mm
  
  return questionHeight;
}

/**
 * Render the choices list with radio buttons
 */
async function renderChoices(arg: UIRenderProps<MultipleChoiceQuestionSchema> & {
  container: HTMLElement;
  currentY: number;
}): Promise<number> {
  const { schema, container, currentY, mode, onChange, value } = arg;

  let choicesY = currentY;
  let totalChoicesHeight = 0;

  for (let i = 0; i < schema.choices.length; i++) {
    const choice = schema.choices[i];
    const isSelected = value === choice.id;

    // Create choice row container
    const choiceRow = document.createElement('div');
    choiceRow.style.position = 'absolute';
    choiceRow.style.left = '0px';
    choiceRow.style.top = `${choicesY}mm`;
    choiceRow.style.width = `${schema.width}mm`;
    choiceRow.style.display = 'flex';
    choiceRow.style.alignItems = 'flex-start';
    choiceRow.style.cursor = mode === 'form' ? 'pointer' : 'default';
    choiceRow.style.minHeight = `${schema.layout.radioSize + 2}mm`;
    choiceRow.dataset.choiceId = choice.id;
    
    if (mode === 'designer') {
      choiceRow.style.border = '1px dashed #ddd';
      choiceRow.style.borderRadius = '2px';
      choiceRow.style.padding = '2px';
    }
    
    container.appendChild(choiceRow);

    // 1. Radio button div
    const radioDiv = document.createElement('div');
    radioDiv.style.width = `${schema.layout.radioSize}mm`;
    radioDiv.style.height = `${schema.layout.radioSize}mm`;
    radioDiv.style.marginRight = `${schema.layout.radioTextSpacing}mm`;
    radioDiv.style.marginTop = '1mm';
    radioDiv.style.flexShrink = '0';
    radioDiv.style.display = 'flex';
    radioDiv.style.alignItems = 'center';
    radioDiv.style.justifyContent = 'center';
    choiceRow.appendChild(radioDiv);

    // Render radio button icon directly
    const radioIcon = document.createElement('div');
    radioIcon.innerHTML = isSelected ? 
      createSvgStr(CircleDot, { stroke: '#1890ff', fill: '#1890ff' }) :
      createSvgStr(Circle, { stroke: '#666', fill: 'none' });
    radioIcon.style.width = '100%';
    radioIcon.style.height = '100%';
    radioDiv.appendChild(radioIcon);

    // 2. Choice text div
    const textDiv = document.createElement('div');
    textDiv.style.flex = '1';
    textDiv.style.minHeight = `${schema.layout.radioSize}mm`;
    choiceRow.appendChild(textDiv);

    // Render choice text using text plugin
    const textWidth = schema.width - schema.layout.radioSize - schema.layout.radioTextSpacing - 4;
    await textUiRender({
      ...arg,
      value: choice.text,
      schema: {
        ...schema.choiceStyle,
        type: 'text',
        name: `choice-text-${choice.id}`,
        id: `choice-text-${choice.id}`,
        width: textWidth,
        height: 15,
        position: { x: 0, y: 0 },
        readOnly: false,
      },
      rootElement: textDiv,
      onChange: (changeArg: { key: string; value: unknown }) => {
        if (changeArg.key === 'content' && onChange) {
          // Update the specific choice text
          const updatedChoices = [...schema.choices];
          updatedChoices[i] = { ...choice, text: changeArg.value as string };
          onChange({ key: 'choices', value: updatedChoices });
        }
      },
    });

    // Handle choice selection (form mode only)
    if (mode === 'form') {
      choiceRow.addEventListener('click', () => {
        if (onChange) {
          onChange({ key: 'content', value: choice.id });
        }
      });

      // Add visual feedback for selection
      if (isSelected) {
        choiceRow.style.backgroundColor = '#e6f7ff';
        choiceRow.style.border = '2px solid #1890ff';
        choiceRow.style.borderRadius = '4px';
      }

      // Hover effects
      choiceRow.addEventListener('mouseenter', () => {
        if (!isSelected) {
          choiceRow.style.backgroundColor = '#f5f5f5';
          choiceRow.style.borderRadius = '4px';
        }
      });

      choiceRow.addEventListener('mouseleave', () => {
        if (!isSelected) {
          choiceRow.style.backgroundColor = 'transparent';
        }
      });
    }

    // Calculate choice height (convert px to mm)
    const choiceHeight = Math.max(
      textDiv.scrollHeight / 3.78, // Convert px to mm roughly
      schema.layout.radioSize + 2
    );

    // Update position for next choice
    choicesY += choiceHeight + schema.layout.choiceSpacing;
    totalChoicesHeight += choiceHeight + (i < schema.choices.length - 1 ? schema.layout.choiceSpacing : 0);
  }

  return totalChoicesHeight;
}
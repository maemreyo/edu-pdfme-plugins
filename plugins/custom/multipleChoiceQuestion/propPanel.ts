import { PropPanel, PropPanelWidgetProps } from "@pdfme/common";
import type { MultipleChoiceQuestionSchema, Choice } from "./types";

/**
 * Custom widget for managing multiple choice options
 * Allows adding, removing, and editing choices
 */
const choiceManagerWidget = (arg: PropPanelWidgetProps) => {
  const { rootElement, value, onChange } = arg;
  const schema = value as MultipleChoiceQuestionSchema;

  // Clear existing content
  rootElement.innerHTML = '';

  // Create container
  const container = document.createElement('div');
  container.style.width = '100%';
  rootElement.appendChild(container);

  // Title
  const title = document.createElement('div');
  title.textContent = 'Answer Choices';
  title.style.fontWeight = 'bold';
  title.style.marginBottom = '8px';
  title.style.fontSize = '14px';
  container.appendChild(title);

  // Choices list container
  const choicesContainer = document.createElement('div');
  choicesContainer.style.marginBottom = '12px';
  container.appendChild(choicesContainer);

  // Render existing choices
  function renderChoices() {
    choicesContainer.innerHTML = '';
    
    schema.choices.forEach((choice, index) => {
      const choiceRow = document.createElement('div');
      choiceRow.style.display = 'flex';
      choiceRow.style.alignItems = 'center';
      choiceRow.style.marginBottom = '8px';
      choiceRow.style.padding = '8px';
      choiceRow.style.border = '1px solid #d9d9d9';
      choiceRow.style.borderRadius = '4px';
      choiceRow.style.backgroundColor = '#fafafa';

      // Choice label (A, B, C, D...)
      const label = document.createElement('div');
      label.textContent = String.fromCharCode(65 + index) + '.';
      label.style.fontWeight = 'bold';
      label.style.marginRight = '8px';
      label.style.minWidth = '20px';
      label.style.color = '#666';
      choiceRow.appendChild(label);

      // Text input for choice content
      const input = document.createElement('input');
      input.type = 'text';
      input.value = choice.text;
      input.style.flex = '1';
      input.style.padding = '4px 8px';
      input.style.border = '1px solid #d9d9d9';
      input.style.borderRadius = '4px';
      input.style.marginRight = '8px';

      input.addEventListener('blur', () => {
        const updatedChoices = [...schema.choices];
        updatedChoices[index] = { ...choice, text: input.value };
        onChange({ 
          key: 'choices', 
          value: updatedChoices 
        });
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          input.blur();
        }
      });

      choiceRow.appendChild(input);

      // Remove button
      const removeBtn = document.createElement('button');
      removeBtn.textContent = '×';
      removeBtn.style.width = '24px';
      removeBtn.style.height = '24px';
      removeBtn.style.border = '1px solid #ff4d4f';
      removeBtn.style.backgroundColor = '#fff2f0';
      removeBtn.style.color = '#ff4d4f';
      removeBtn.style.borderRadius = '4px';
      removeBtn.style.cursor = 'pointer';
      removeBtn.style.fontSize = '16px';
      removeBtn.style.display = 'flex';
      removeBtn.style.alignItems = 'center';
      removeBtn.style.justifyContent = 'center';

      removeBtn.addEventListener('click', () => {
        if (schema.choices.length > 2) { // Minimum 2 choices
          const updatedChoices = schema.choices.filter((_, i) => i !== index);
          onChange({ key: 'choices', value: updatedChoices });
          
          // If we removed the correct answer, reset it to first choice
          if (schema.correctAnswerId === choice.id && updatedChoices.length > 0) {
            onChange({ key: 'correctAnswerId', value: updatedChoices[0].id });
          }
          
          renderChoices();
        } else {
          alert('Must have at least 2 answer choices');
        }
      });

      choiceRow.appendChild(removeBtn);
      choicesContainer.appendChild(choiceRow);
    });
  }

  // Add choice button
  const addBtn = document.createElement('button');
  addBtn.textContent = '+ Add Choice';
  addBtn.style.width = '100%';
  addBtn.style.padding = '8px 16px';
  addBtn.style.border = '1px dashed #1890ff';
  addBtn.style.backgroundColor = '#f0f8ff';
  addBtn.style.color = '#1890ff';
  addBtn.style.borderRadius = '4px';
  addBtn.style.cursor = 'pointer';
  addBtn.style.fontSize = '14px';

  addBtn.addEventListener('click', () => {
    const newChoiceId = `choice_${Date.now()}`;
    const newChoice: Choice = {
      id: newChoiceId,
      text: `Option ${String.fromCharCode(65 + schema.choices.length)}`,
    };
    
    const updatedChoices = [...schema.choices, newChoice];
    onChange({ key: 'choices', value: updatedChoices });
    renderChoices();
  });

  container.appendChild(addBtn);

  // Initial render
  renderChoices();
};

/**
 * Property panel configuration for MultipleChoiceQuestion plugin
 */
export const propPanel: PropPanel<MultipleChoiceQuestionSchema> = {
  schema: (propPanelProps) => {
    const { value } = propPanelProps;
    const schema = value as MultipleChoiceQuestionSchema;
    
    // Generate options for correct answer dropdown
    const correctAnswerOptions = schema.choices.map((choice, index) => ({
      label: `${String.fromCharCode(65 + index)}. ${choice.text.substring(0, 30)}${choice.text.length > 30 ? '...' : ''}`,
      value: choice.id,
    }));

    return {
      // Question Management
      question: {
        title: 'Question Text',
        type: 'string',
        format: 'textarea',
        props: {
          autoSize: { minRows: 2, maxRows: 4 },
        },
        span: 24,
      },

      // Choices Management
      '-------choices': { type: 'void', widget: 'Divider' },
      choicesTitle: {
        title: 'Answer Choices',
        type: 'void',
        widget: 'Card',
        span: 24,
        properties: {
          choicesManager: {
            type: 'object',
            widget: 'choicesManager',
            bind: false,
            span: 24,
          },
        },
      },

      // Correct Answer Selection
      correctAnswerId: {
        title: 'Correct Answer',
        type: 'string',
        widget: 'select',
        props: {
          options: correctAnswerOptions,
        },
        span: 24,
      },

      // Layout Configuration
      '-------layout': { type: 'void', widget: 'Divider' },
      layoutTitle: {
        title: 'Layout & Spacing',
        type: 'void',
        widget: 'Card',
        span: 24,
        properties: {
          'layout.choiceSpacing': {
            title: 'Choice Spacing (mm)',
            type: 'number',
            props: { min: 2, max: 20, step: 1 },
            span: 12,
          },
          'layout.questionSpacing': {
            title: 'Question Spacing (mm)',
            type: 'number',
            props: { min: 2, max: 20, step: 1 },
            span: 12,
          },
          'layout.radioSize': {
            title: 'Radio Size (mm)',
            type: 'number',
            props: { min: 2, max: 10, step: 0.5 },
            span: 12,
          },
          'layout.radioTextSpacing': {
            title: 'Radio-Text Spacing (mm)',
            type: 'number',
            props: { min: 1, max: 10, step: 0.5 },
            span: 12,
          },
        },
      },

      // Question Style
      '-------question-style': { type: 'void', widget: 'Divider' },
      questionStyleTitle: {
        title: 'Question Style',
        type: 'void',
        widget: 'Card',
        span: 24,
        properties: {
          'questionStyle.fontSize': {
            title: 'Font Size',
            type: 'number',
            props: { min: 8, max: 24, step: 1 },
            span: 12,
          },
          'questionStyle.fontColor': {
            title: 'Font Color',
            type: 'string',
            widget: 'color',
            span: 12,
          },
          'questionStyle.fontName': {
            title: 'Font Family',
            type: 'string',
            widget: 'select',
            props: {
              options: [
                { label: 'Helvetica', value: 'Helvetica' },
                { label: 'Helvetica Bold', value: 'Helvetica-Bold' },
                { label: 'Times Roman', value: 'Times-Roman' },
                { label: 'Times Bold', value: 'Times-Bold' },
              ],
            },
            span: 24,
          },
        },
      },

      // Choice Style
      '-------choice-style': { type: 'void', widget: 'Divider' },
      choiceStyleTitle: {
        title: 'Choice Style',
        type: 'void',
        widget: 'Card',
        span: 24,
        properties: {
          'choiceStyle.fontSize': {
            title: 'Font Size',
            type: 'number',
            props: { min: 8, max: 24, step: 1 },
            span: 12,
          },
          'choiceStyle.fontColor': {
            title: 'Font Color',
            type: 'string',
            widget: 'color',
            span: 12,
          },
          'choiceStyle.fontName': {
            title: 'Font Family',
            type: 'string',
            widget: 'select',
            props: {
              options: [
                { label: 'Helvetica', value: 'Helvetica' },
                { label: 'Helvetica Bold', value: 'Helvetica-Bold' },
                { label: 'Times Roman', value: 'Times-Roman' },
                { label: 'Times Bold', value: 'Times-Bold' },
              ],
            },
            span: 24,
          },
        },
      },
    };
  },

  widgets: { 
    choicesManager: choiceManagerWidget,
  },

  defaultSchema: {
    name: 'Multiple Choice Question',
    position: { x: 0, y: 0 },
    type: 'multipleChoiceQuestion',
    question: 'Enter your question here',
    choices: [
      { id: 'choice_a', text: 'Option A' },
      { id: 'choice_b', text: 'Option B' },
      { id: 'choice_c', text: 'Option C' },
      { id: 'choice_d', text: 'Option D' },
    ],
    correctAnswerId: 'choice_a',
    questionStyle: {
      fontSize: 12,
      fontColor: '#000000',
      fontName: 'Helvetica-Bold',
    },
    choiceStyle: {
      fontSize: 11,
      fontColor: '#000000',
      fontName: 'Helvetica',
    },
    layout: {
      choiceSpacing: 5,
      questionSpacing: 8,
      radioSize: 4,
      radioTextSpacing: 3,
    },
    width: 180,
    height: 80,
    content: '',
    readOnly: false,
  },
};
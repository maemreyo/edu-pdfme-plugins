/**
 * USAGE EXAMPLES: Multiple Choice Question Blocks
 * 
 * This file demonstrates how to integrate multiple choice blocks into
 * your Docubrand application or any pdfme-based system.
 */

import { 
  createMultipleChoiceBlock, 
  createPresetMultipleChoiceBlock,
  findMultipleChoiceBlocks,
  removeMultipleChoiceBlock 
} from '../utils/blockComposers';

// ============================================================================
// EXAMPLE 1: Basic Usage in Docubrand UI
// ============================================================================

/**
 * This function would be called when user clicks "Add Multiple Choice Question"
 * button in the Docubrand interface.
 */
function handleAddMultipleChoiceQuestion(
  designer: any, // pdfme designer instance
  clickPosition: { x: number; y: number }
) {
  try {
    // Create a multiple choice block
    const questionBlock = createMultipleChoiceBlock({
      position: clickPosition,
      questionText: "New Multiple Choice Question",
      choices: ["Option A", "Option B", "Option C", "Option D"],
      width: 180,
      style: {
        questionFontSize: 12,
        choiceFontSize: 10,
        spacing: 8
      }
    });

    // Get current template
    const currentTemplate = designer.getTemplate();
    
    // Add new schemas to template
    const newTemplate = {
      ...currentTemplate,
      schemas: [...currentTemplate.schemas, ...questionBlock.schemas]
    };
    
    // Update the designer
    designer.updateTemplate(newTemplate);
    
    console.log(`Added multiple choice question with group ID: ${questionBlock.groupId}`);
    
  } catch (error) {
    console.error('Failed to add multiple choice question:', error);
    alert('Error adding question: ' + error.message);
  }
}

// ============================================================================
// EXAMPLE 2: Creating Educational Templates Programmatically
// ============================================================================

/**
 * Create a complete exam template with multiple questions
 */
function createExamTemplate() {
  const baseTemplate = {
    basePdf: { width: 210, height: 297 }, // A4 size
    schemas: []
  };

  let currentY = 20; // Start position
  const questionSpacing = 80; // Space between questions
  
  // Question 1: Geography
  const question1 = createMultipleChoiceBlock({
    position: { x: 20, y: currentY },
    questionText: "1. What is the capital of Japan?",
    choices: ["Seoul", "Tokyo", "Beijing", "Bangkok"],
    width: 170
  });
  baseTemplate.schemas.push(...question1.schemas);
  currentY += questionSpacing;

  // Question 2: Science  
  const question2 = createMultipleChoiceBlock({
    position: { x: 20, y: currentY },
    questionText: "2. Which planet is closest to the Sun?",
    choices: ["Venus", "Mercury", "Earth", "Mars"],
    width: 170
  });
  baseTemplate.schemas.push(...question2.schemas);
  currentY += questionSpacing;

  // Question 3: Math
  const question3 = createMultipleChoiceBlock({
    position: { x: 20, y: currentY },
    questionText: "3. What is the square root of 64?",
    choices: ["6", "7", "8", "9"],
    width: 170
  });
  baseTemplate.schemas.push(...question3.schemas);

  return baseTemplate;
}

// ============================================================================
// EXAMPLE 3: Using Presets for Quick Development
// ============================================================================

/**
 * Add preset questions quickly during development
 */
function addPresetQuestions(designer: any) {
  const positions = [
    { x: 20, y: 30 },
    { x: 20, y: 120 },
    { x: 20, y: 210 },
    { x: 20, y: 300 }
  ];

  const presetTypes = ['geography', 'science', 'math', 'history'] as const;
  
  presetTypes.forEach((type, index) => {
    const questionBlock = createPresetMultipleChoiceBlock(type, positions[index]);
    
    const currentTemplate = designer.getTemplate();
    const newTemplate = {
      ...currentTemplate,
      schemas: [...currentTemplate.schemas, ...questionBlock.schemas]
    };
    designer.updateTemplate(newTemplate);
  });
}

// ============================================================================
// EXAMPLE 4: Template Management Functions
// ============================================================================

/**
 * Find and list all multiple choice questions in current template
 */
function listAllQuestions(designer: any) {
  const template = designer.getTemplate();
  const questionGroupIds = findMultipleChoiceBlocks(template.schemas);
  
  console.log(`Found ${questionGroupIds.length} multiple choice questions:`);
  questionGroupIds.forEach((groupId, index) => {
    console.log(`${index + 1}. Group ID: ${groupId}`);
  });
  
  return questionGroupIds;
}

/**
 * Remove a specific question by its group ID
 */
function removeQuestion(designer: any, groupId: string) {
  const currentTemplate = designer.getTemplate();
  const newSchemas = removeMultipleChoiceBlock(currentTemplate.schemas, groupId);
  
  const newTemplate = {
    ...currentTemplate,
    schemas: newSchemas
  };
  
  designer.updateTemplate(newTemplate);
  console.log(`Removed question with group ID: ${groupId}`);
}

/**
 * Clear all multiple choice questions from template
 */
function clearAllQuestions(designer: any) {
  const questionGroupIds = listAllQuestions(designer);
  
  questionGroupIds.forEach(groupId => {
    removeQuestion(designer, groupId);
  });
  
  console.log('Cleared all multiple choice questions');
}

// ============================================================================
// EXAMPLE 5: React Component Integration
// ============================================================================

/**
 * React component that provides UI for adding multiple choice questions
 */
/*
import React, { useState } from 'react';

interface AddQuestionDialogProps {
  onAddQuestion: (questionData: any) => void;
  onCancel: () => void;
}

export const AddQuestionDialog: React.FC<AddQuestionDialogProps> = ({ 
  onAddQuestion, 
  onCancel 
}) => {
  const [questionText, setQuestionText] = useState('');
  const [choices, setChoices] = useState(['', '', '', '']);

  const handleSubmit = () => {
    if (!questionText.trim()) {
      alert('Please enter a question');
      return;
    }

    const validChoices = choices.filter(choice => choice.trim() !== '');
    if (validChoices.length < 2) {
      alert('Please enter at least 2 choices');
      return;
    }

    onAddQuestion({
      questionText: questionText.trim(),
      choices: validChoices.map(choice => choice.trim())
    });
  };

  return (
    <div className="dialog">
      <h3>Add Multiple Choice Question</h3>
      
      <div className="form-group">
        <label>Question:</label>
        <textarea 
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="Enter your question here..."
        />
      </div>

      <div className="form-group">
        <label>Choices:</label>
        {choices.map((choice, index) => (
          <input
            key={index}
            type="text"
            value={choice}
            onChange={(e) => {
              const newChoices = [...choices];
              newChoices[index] = e.target.value;
              setChoices(newChoices);
            }}
            placeholder={`Choice ${String.fromCharCode(65 + index)}`}
          />
        ))}
      </div>

      <div className="dialog-actions">
        <button onClick={handleSubmit}>Add Question</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
};
*/

// ============================================================================
// EXAMPLE 6: Advanced Positioning and Layout
// ============================================================================

/**
 * Create a two-column exam layout with multiple choice questions
 */
function createTwoColumnExam() {
  const template = {
    basePdf: { width: 210, height: 297 },
    schemas: []
  };

  const leftColumn = { x: 15, startY: 30, width: 85 };
  const rightColumn = { x: 110, startY: 30, width: 85 };
  const questionHeight = 70;

  // Left column questions
  for (let i = 0; i < 3; i++) {
    const question = createMultipleChoiceBlock({
      position: { 
        x: leftColumn.x, 
        y: leftColumn.startY + (i * questionHeight) 
      },
      questionText: `Question ${i + 1}: Sample question text here?`,
      choices: ["Option A", "Option B", "Option C"],
      width: leftColumn.width,
      style: { questionFontSize: 10, choiceFontSize: 8 }
    });
    template.schemas.push(...question.schemas);
  }

  // Right column questions
  for (let i = 0; i < 3; i++) {
    const question = createMultipleChoiceBlock({
      position: { 
        x: rightColumn.x, 
        y: rightColumn.startY + (i * questionHeight) 
      },
      questionText: `Question ${i + 4}: Sample question text here?`,
      choices: ["Option A", "Option B", "Option C"],
      width: rightColumn.width,
      style: { questionFontSize: 10, choiceFontSize: 8 }
    });
    template.schemas.push(...question.schemas);
  }

  return template;
}

// ============================================================================
// EXPORT ALL EXAMPLES
// ============================================================================

export {
  handleAddMultipleChoiceQuestion,
  createExamTemplate,
  addPresetQuestions,
  listAllQuestions,
  removeQuestion,
  clearAllQuestions,
  createTwoColumnExam
};
// Example: How to use the MultipleChoiceQuestion Plugin


/**
 * Example 1: Basic Usage in pdfme Template
 */
const exampleTemplate = {
  basePdf: 'data:application/pdf;base64,...', // Your base PDF
  schemas: [
    {
      // Basic Multiple Choice Question
      type: 'multipleChoiceQuestion',
      id: 'question_1',
      name: 'question_1',
      position: { x: 20, y: 50 },
      width: 160,
      height: 60, // Will auto-adjust based on content
      
      // Question content
      question: 'What is the capital of France?',
      choices: [
        { id: 'q1_a', text: 'London' },
        { id: 'q1_b', text: 'Berlin' },
        { id: 'q1_c', text: 'Paris' },
        { id: 'q1_d', text: 'Madrid' },
      ],
      correctAnswerId: 'q1_c', // For grading purposes
      
      // Styling
      questionStyle: {
        fontSize: 12,
        fontColor: '#000000',
        fontName: 'Helvetica-Bold',
      },
      choiceStyle: {
        fontSize: 11,
        fontColor: '#333333',
        fontName: 'Helvetica',
      },
      
      // Layout configuration
      layout: {
        choiceSpacing: 6,
        questionSpacing: 10,
        radioSize: 4,
        radioTextSpacing: 4,
      },
      
      // Initial answer (empty = no selection)
      content: '',
    } as MultipleChoiceQuestionSchema,
  ],
};

/**
 * Example 2: Advanced Science Question with Custom Styling
 */
const scienceQuestionSchema: MultipleChoiceQuestionSchema = {
  type: 'multipleChoiceQuestion',
  id: 'science_q1',
  name: 'science_q1',
  position: { x: 15, y: 100 },
  width: 170,
  height: 80,
  
  question: 'Which of the following is NOT a renewable energy source?',
  choices: [
    { id: 'sci_a', text: 'Solar power from photovoltaic panels' },
    { id: 'sci_b', text: 'Wind energy from turbines' },
    { id: 'sci_c', text: 'Natural gas combustion' },
    { id: 'sci_d', text: 'Hydroelectric power from dams' },
  ],
  correctAnswerId: 'sci_c',
  
  // Enhanced styling for science content
  questionStyle: {
    fontSize: 13,
    fontColor: '#1a472a',
    fontName: 'Helvetica-Bold',
  },
  choiceStyle: {
    fontSize: 10,
    fontColor: '#2d5a3d',
    fontName: 'Helvetica',
  },
  
  layout: {
    choiceSpacing: 8,
    questionSpacing: 12,
    radioSize: 5,
    radioTextSpacing: 6,
  },
  
  content: '',
  readOnly: false,
};

/**
 * Example 3: Using with pdfme Designer
 */
import { Designer } from '@pdfme/ui';

const plugins = {
  // Include your custom plugin
  multipleChoiceQuestion,
  // ... other plugins
};

const designer = new Designer({
  domContainer: document.getElementById('container'),
  template: exampleTemplate,
  plugins,
});

/**
 * Example 4: Using with pdfme Form
 */
import { Form } from '@pdfme/ui';

// Student form with initial values
const studentForm = new Form({
  domContainer: document.getElementById('form-container'),
  template: exampleTemplate,
  inputs: [
    {
      question_1: 'q1_c', // Student selected answer C
    }
  ],
  plugins,
});

/**
 * Example 5: PDF Generation with Student Answers
 */
import { generate } from '@pdfme/generator';
import multipleChoiceQuestion from '../plugins/custom/multipleChoiceQuestion';
import { MultipleChoiceQuestionSchema } from '../plugins/custom/multipleChoiceQuestion/types';

const generateStudentAnswerSheet = async () => {
  const pdf = await generate({
    template: exampleTemplate,
    inputs: [
      {
        question_1: 'q1_b', // Student's answer
        science_q1: 'sci_c', // Another answer
      }
    ],
    plugins,
  });
  
  return pdf; // Returns Uint8Array of PDF
};

/**
 * Example 6: Programmatic Question Creation
 */
function createMathQuestion(): MultipleChoiceQuestionSchema {
  return {
    type: 'multipleChoiceQuestion',
    id: `math_${Date.now()}`,
    name: `math_${Date.now()}`,
    position: { x: 20, y: 200 },
    width: 150,
    height: 70,
    
    question: 'What is 15 × 7?',
    choices: [
      { id: 'math_a', text: '95' },
      { id: 'math_b', text: '105' },
      { id: 'math_c', text: '110' },
      { id: 'math_d', text: '115' },
    ],
    correctAnswerId: 'math_b',
    
    questionStyle: {
      fontSize: 12,
      fontColor: '#8B4513',
      fontName: 'Helvetica-Bold',
    },
    choiceStyle: {
      fontSize: 11,
      fontColor: '#A0522D',
      fontName: 'Helvetica',
    },
    
    layout: {
      choiceSpacing: 5,
      questionSpacing: 8,
      radioSize: 4,
      radioTextSpacing: 3,
    },
    
    content: '',
    readOnly: false,
  };
}

/**
 * Example 7: Grading System Integration
 */
interface GradingResult {
  questionId: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  points: number;
}

function gradeMultipleChoiceQuestion(
  schema: MultipleChoiceQuestionSchema,
  studentAnswer: string
): GradingResult {
  const isCorrect = studentAnswer === schema.correctAnswerId;
  
  return {
    questionId: schema.id,
    studentAnswer,
    correctAnswer: schema.correctAnswerId,
    isCorrect,
    points: isCorrect ? 1 : 0,
  };
}

// Grade an entire test
function gradeTest(
  template: any,
  studentAnswers: Record<string, string>
): GradingResult[] {
  const results: GradingResult[] = [];
  
  template.schemas.forEach((schema: any) => {
    if (schema.type === 'multipleChoiceQuestion') {
      const studentAnswer = studentAnswers[schema.name] || '';
      const result = gradeMultipleChoiceQuestion(schema, studentAnswer);
      results.push(result);
    }
  });
  
  return results;
}

export {
  exampleTemplate,
  scienceQuestionSchema,
  createMathQuestion,
  gradeMultipleChoiceQuestion,
  gradeTest,
};
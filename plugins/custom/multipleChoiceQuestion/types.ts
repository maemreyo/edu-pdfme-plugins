import type { Schema } from "@pdfme/common";
import type { TextSchema } from "../../base/text/types";

/**
 * Individual choice/option in a multiple choice question
 */
export interface Choice {
  /** Unique identifier for this choice */
  id: string;
  /** Display text for this choice */
  text: string;
}

/**
 * Layout configuration for the multiple choice question
 */
export interface MultipleChoiceLayout {
  /** Spacing between each choice option in mm */
  choiceSpacing: number;
  /** Spacing between question and first choice in mm */
  questionSpacing: number;
  /** Size of radio button icons in mm */
  radioSize: number;
  /** Spacing between radio button and choice text in mm */
  radioTextSpacing: number;
}

/**
 * Schema interface for MultipleChoiceQuestion plugin
 * Self-contained plugin that manages entire question block internally
 */
export interface MultipleChoiceQuestionSchema extends Schema {
  // Core data
  /** The main question text */
  question: string;
  /** Array of available choices */
  choices: Choice[];
  /** ID of the correct answer (for grading/validation) */
  correctAnswerId: string;

  // Styling
  /** Style configuration for the question text */
  questionStyle: Partial<TextSchema>;
  /** Style configuration for choice text */
  choiceStyle: Partial<TextSchema>;

  // Layout
  /** Layout and spacing configuration */
  layout: MultipleChoiceLayout;

  // The content field (inherited from Schema) stores the selected choice ID
  // content: string; // ID of selected choice
}

/**
 * Default values for new multiple choice questions
 */
export const DEFAULT_MULTIPLE_CHOICE: Partial<MultipleChoiceQuestionSchema> = {
  question: "Enter your question here",
  choices: [
    { id: "choice_a", text: "Option A" },
    { id: "choice_b", text: "Option B" },
    { id: "choice_c", text: "Option C" },
    { id: "choice_d", text: "Option D" },
  ],
  correctAnswerId: "choice_a",
  questionStyle: {
    fontSize: 12,
    fontColor: "#000000",
    fontName: "Helvetica-Bold",
  },
  choiceStyle: {
    fontSize: 11,
    fontColor: "#000000",
    fontName: "Helvetica",
  },
  layout: {
    choiceSpacing: 5,
    questionSpacing: 8,
    radioSize: 4,
    radioTextSpacing: 3,
  },
  content: "", // No selection by default
};
import fillInTheBlank from "./fillInTheBlank";
import linedAnswerBox from "./linedAnswerBox";
import multipleChoiceQuestion from "./multipleChoiceQuestion";
import calloutBox from "./calloutBox";

/**
 * Custom plugins for pdfme
 *
 * This module exports all custom plugins developed for the educational
 * document generation system. These plugins extend pdfme's capabilities
 * with specialized educational form elements.
 */

export { fillInTheBlank, linedAnswerBox, multipleChoiceQuestion, calloutBox };

/**
 * Custom plugins object for convenient import
 * Usage: import { customPlugins } from './plugins/custom'
 */
export const customPlugins = {
  fillInTheBlank,
  linedAnswerBox,
  multipleChoiceQuestion,
  calloutBox,
};

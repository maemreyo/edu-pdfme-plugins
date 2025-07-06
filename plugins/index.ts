import {
  barcodes,
  checkbox,
  date,
  dateTime,
  ellipse,
  image,
  line,
  multiVariableText,
  radioGroup,
  rectangle,
  select,
  svg,
  table,
  text,
  time,
} from "@pdfme/schemas";

// Import custom plugins
import { customPlugins, linedAnswerBox } from "./custom";

const builtInPlugins = { Text: text };

export {
  builtInPlugins,
  // Built-in schemas from @pdfme/schemas
  text,
  multiVariableText,
  image,
  svg,
  table,
  barcodes,
  line,
  rectangle,
  ellipse,
  dateTime,
  date,
  time,
  select,
  radioGroup,
  checkbox,
  // Custom schemas
  customPlugins,
};

/**
 * All available plugins including custom ones
 * Usage: import { allPlugins } from './plugins'
 */
export const allPlugins = {
  // Built-in plugins
  text,
  multiVariableText,
  image,
  svg,
  table,
  barcodes,
  line,
  rectangle,
  ellipse,
  dateTime,
  date,
  time,
  select,
  radioGroup,
  checkbox,
  // Custom plugins
  ...customPlugins,
};

/**
 * Educational plugins specifically
 * Usage: import { educationalPlugins } from './plugins'
 */
export const educationalPlugins = {
  fillInTheBlank: customPlugins.fillInTheBlank,
  linedAnswerBox: customPlugins.linedAnswerBox,
  multipleChoiceQuestion: customPlugins.multipleChoiceQuestion,
  calloutBox: customPlugins.calloutBox,
};
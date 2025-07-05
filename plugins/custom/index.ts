import fillInTheBlank from './fillInTheBlank';

/**
 * Custom plugins for pdfme
 * 
 * This module exports all custom plugins developed for the educational
 * document generation system. These plugins extend pdfme's capabilities
 * with specialized educational form elements.
 */

export {
  fillInTheBlank,
};

/**
 * Custom plugins object for convenient import
 * Usage: import { customPlugins } from './plugins/custom'
 */
export const customPlugins = {
  fillInTheBlank,
};
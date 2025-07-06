// REFACTORED: 2025-01-07 - Enhanced text plugin with modular architecture

import type { Plugin } from '@pdfme/common';
import { pdfRender } from './pdfRender';
import { propPanel } from './propPanel';
import { uiRender } from './uiRender';
import type { TextSchema } from './types/enhanced';
import { TextCursorInput } from 'lucide';
import { createSvgStr } from '../utils';

// Import validation helpers
import { validateCriticalMechanisms } from './helper';

/**
 * REFACTORED TEXT PLUGIN
 * 
 * Enhanced text plugin with:
 * - Modular architecture for better maintainability
 * - Preserved critical mechanisms for PDF-UI consistency
 * - Enhanced event handling system
 * - Advanced Japanese text support
 * - Dynamic font sizing with iterative algorithm
 * - Firefox compatibility workarounds
 * - Performance optimizations with caching
 * - Comprehensive error handling
 */
const textSchema: Plugin<TextSchema> = {
  pdf: pdfRender,
  ui: uiRender,
  propPanel,
  icon: createSvgStr(TextCursorInput),
  
  // Plugin metadata
  name: 'text',
  version: '2.0.0-refactored',
  description: 'Enhanced text plugin with advanced features and better architecture',
  
  // Feature flags
  features: {
    dynamicSizing: true,
    japaneseSupport: true,
    richText: true,
    firefoxCompat: true,
    performanceOptimized: true,
  },
};
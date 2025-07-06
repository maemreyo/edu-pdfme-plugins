// plugins/text/index.ts
// REFACTORED: 2025-01-07 - Enhanced text plugin with modular architecture + Extension System

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
 * ENHANCED TEXT PLUGIN WITH EXTENSION SYSTEM
 * 
 * Features:
 * - ✅ Modular architecture for better maintainability
 * - ✅ Preserved critical mechanisms for PDF-UI consistency
 * - ✅ Enhanced event handling system
 * - ✅ Advanced Japanese text support
 * - ✅ Dynamic font sizing with iterative algorithm
 * - ✅ Firefox compatibility workarounds
 * - ✅ Performance optimizations with caching
 * - ✅ Comprehensive error handling
 * - 🆕 Plugin Extension System for advanced customization
 */
const textSchema: Plugin<TextSchema> = {
  pdf: pdfRender,
  ui: uiRender,
  propPanel,
  icon: createSvgStr(TextCursorInput),
  
  // // Plugin metadata
  // name: 'text',
  // version: '2.1.0-extensions',
  // description: 'Enhanced text plugin with extension system and advanced features',
  
  // // Feature flags
  // features: {
  //   dynamicSizing: true,
  //   japaneseSupport: true,
  //   richText: true,
  //   firefoxCompat: true,
  //   performanceOptimized: true,
  //   extensionSystem: true, // 🆕 New feature
  // },
};

/**
 * EXTENSION SYSTEM INITIALIZATION
 * 
 * Initialize extension system with proper error handling
 */
const initializeExtensionSystem = async (): Promise<void> => {
  try {
    // Dynamically import extension system to avoid bundle size impact
    const { extensionManager } = await import('./extensions/manager');
    const { registerExampleExtensions } = await import('./extensions/examples');
    const { registerDemoExtensions } = await import('./extensions/demoExtensions');
    
    // Configure extension manager
    extensionManager.configure({
      globalMaxExecutionTime: 100,
      performanceMonitoringEnabled: true,
      errorRecoveryEnabled: true,
      debugMode: false,
      logLevel: 'warn',
    });
    
    // Register example and demo extensions in development
    if (process.env.NODE_ENV === 'development') {
      await registerExampleExtensions();
      await registerDemoExtensions(); // Register demo extensions
      console.log('🔌 Extension system initialized with example and demo extensions');
    } else {
      console.log('🔌 Extension system initialized (production mode)');
    }
    
  } catch (error) {
    console.warn('Extension system initialization failed (will use fallback):', error);
  }
};

/**
 * PLUGIN INITIALIZATION WITH COMPREHENSIVE VALIDATION
 */
const initializeTextPlugin = async (): Promise<Plugin<TextSchema>> => {
  console.log('🚀 Initializing enhanced text plugin...');
  
  // 1. Validate critical mechanisms
  const validation = validateCriticalMechanisms();
  
  if (!validation.isValid) {
    console.error('❌ Text plugin critical mechanisms validation failed:', validation.errors);
    throw new Error('Text plugin initialization failed due to missing dependencies');
  }
  
  if (validation.warnings.length > 0) {
    console.warn('⚠️ Text plugin warnings:', validation.warnings);
  }
  
  // 2. Initialize extension system (optional - won't break if fails)
  await initializeExtensionSystem();
  
  // 3. Setup performance monitoring (if available)
  if (typeof window !== 'undefined' && window.performance) {
    const startTime = performance.now();
    
    // Monitor plugin performance
    window.addEventListener('beforeunload', () => {
      const totalTime = performance.now() - startTime;
      console.log(`📊 Text plugin session: ${totalTime.toFixed(2)}ms total runtime`);
    });
  }
  
  console.log('✅ Text plugin initialized successfully with all features');
  
  return textSchema;
};

// Export initialized plugin
export default await initializeTextPlugin();

// === EXTENSION SYSTEM EXPORTS ===

/**
 * Extension system utilities for advanced usage
 */
export const extensionSystem = {
  // Lazy-loaded extension manager
  async getManager() {
    const { extensionManager } = await import('./extensions/manager');
    return extensionManager;
  },
  
  // Register custom extension
  async registerExtension(extension: any) {
    const manager = await this.getManager();
    return manager.register(extension);
  },
  
  // Get extension statistics
  async getStats() {
    try {
      const { getExtensionStats } = await import('./extensions/integration');
      return getExtensionStats();
    } catch (error) {
      return null;
    }
  },
  
  // Check if extensions are available
  async isAvailable() {
    try {
      const { areExtensionsEnabled } = await import('./extensions/integration');
      return areExtensionsEnabled();
    } catch (error) {
      return false;
    }
  },
};

// === TYPE EXPORTS ===

// Export enhanced types for external use
export type { 
  TextSchema,
  ALIGNMENT,
  VERTICAL_ALIGNMENT,
  DYNAMIC_FONT_SIZE_FIT,
  DynamicFontSizeConfig,
  FontWidthCalcValues,
  TextRenderContext,
  PDFTextRenderParams,
  TextEventHandlers,
  ValidationResult,
  TextProcessingConfig,
  LineBreakingOptions,
  TextPluginConfig
} from './types/enhanced';

// Export extension types
export type {
  TextPluginExtension,
  TextPluginHooks,
  ExtensionManagerConfig,
  PerformanceMetric,
} from './extensions/types';

// === CONFIGURATION EXPORTS ===

// Export constants for external configuration
export {
  DEFAULT_FONT_SIZE,
  DEFAULT_ALIGNMENT,
  DEFAULT_VERTICAL_ALIGNMENT,
  DEFAULT_LINE_HEIGHT,
  DEFAULT_CHARACTER_SPACING,
  DEFAULT_FONT_COLOR,
  DYNAMIC_FIT_HORIZONTAL,
  DYNAMIC_FIT_VERTICAL,
  DEFAULT_DYNAMIC_FIT,
  DEFAULT_DYNAMIC_MIN_FONT_SIZE,
  DEFAULT_DYNAMIC_MAX_FONT_SIZE,
  FONT_SIZE_ADJUSTMENT,
} from './constants';

// === UTILITY EXPORTS ===

// Export helper functions for advanced usage
export {
  processTextComprehensive,
  processTextComprehensiveAsync, // 🆕 New async version with extensions
  measurePerformance,
  validateCriticalMechanisms,
  getFontKitFont,
  calculateDynamicFontSize,
  splitTextToSize,
  widthOfTextAtSize,
  heightOfFontAtSize,
  isExtensionSystemAvailable, // 🆕 Extension system utilities
  getExtensionSystemStats,
} from './helper';

// Export UI helpers
export {
  buildStyledTextContainer,
  makeElementPlainTextContentEditable,
  createDebouncedKeyupHandler,
  batchStyleUpdates,
  addAccessibilityAttributes,
  enableDebugMode,
} from './uiRender';

// Export PDF helpers
export {
  measurePdfRenderPerformance,
  validatePdfRenderParams,
  safePdfRender,
} from './pdfRender';

// === EXAMPLE EXTENSIONS EXPORT ===

/**
 * Example extensions for demonstration and testing
 */
export const examples = {
  // Lazy-load example extensions
  async getExamples() {
    const { exampleExtensions } = await import('./extensions/examples');
    return exampleExtensions;
  },
  
  // Register all example extensions
  async registerAll() {
    const { registerExampleExtensions } = await import('./extensions/examples');
    return registerExampleExtensions();
  },
  
  // Create custom extension helper
  async createCustom(name: string) {
    const { createCustomExtension } = await import('./extensions/examples');
    return createCustomExtension(name);
  },
};

/**
 * Demo extensions for comprehensive demonstration
 */
export const demo = {
  // Lazy-load demo extensions
  async getDemos() {
    const { demoExtensions } = await import('./extensions/demoExtensions');
    return demoExtensions;
  },
  
  // Register all demo extensions
  async registerAll() {
    const { registerDemoExtensions } = await import('./extensions/demoExtensions');
    return registerDemoExtensions();
  },
  
  // Unregister all demo extensions
  async unregisterAll() {
    const { unregisterDemoExtensions } = await import('./extensions/demoExtensions');
    return unregisterDemoExtensions();
  },
};

// === DEVELOPMENT HELPERS ===

/**
 * Development and debugging utilities
 */
export const dev = {
  // Run comprehensive validation
  async validate() {
    const { runComprehensiveValidation } = await import('./testing/validation');
    return runComprehensiveValidation();
  },
  
  // Performance benchmarks
  async benchmark() {
    const { runPerformanceBenchmarks } = await import('./testing/validation');
    return runPerformanceBenchmarks();
  },
  
  // Extension system diagnostics
  async diagnoseExtensions() {
    try {
      const manager = await extensionSystem.getManager();
      const registry = manager.getRegistry();
      const metrics = manager.getPerformanceMetrics();
      
      return {
        extensions: Array.from(registry.entries()).map(([name, entry]) => ({
          name,
          enabled: entry.isEnabled,
          healthy: entry.isHealthy,
          statistics: entry.statistics,
        })),
        metrics: metrics.slice(-10), // Last 10 metrics
        summary: {
          total: registry.size,
          enabled: Array.from(registry.values()).filter(e => e.isEnabled).length,
          healthy: Array.from(registry.values()).filter(e => e.isHealthy).length,
        }
      };
    } catch (error) {
      return { error: error.message };
    }
  },
};

// === FEATURE DETECTION ===

/**
 * Feature detection for capability checks
 */
export const features = {
  // Check if specific features are available
  hasExtensionSystem: () => extensionSystem.isAvailable(),
  hasJapaneseSupport: () => true, // Always available
  hasDynamicSizing: () => true, // Always available
  hasFirefoxCompat: () => true, // Always available
  hasPerformanceMonitoring: () => typeof performance !== 'undefined',
  hasIntlSegmenter: () => typeof Intl.Segmenter !== 'undefined',
  
  // Get all available features
  getAll: async () => ({
    extensionSystem: await extensionSystem.isAvailable(),
    japaneseSupport: true,
    dynamicSizing: true,
    firefoxCompat: true,
    performanceMonitoring: typeof performance !== 'undefined',
    intlSegmenter: typeof Intl.Segmenter !== 'undefined',
  }),
};

/**
 * PLUGIN INFORMATION
 */
export const info = {
  name: textSchema.name,
  version: textSchema.version,
  description: textSchema.description,
  features: textSchema.features,
  
  // Get runtime information
  getRuntime: () => ({
    timestamp: Date.now(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    platform: typeof process !== 'undefined' ? process.platform : 'browser',
    features: features.getAll(),
  }),
};
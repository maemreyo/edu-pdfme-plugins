// plugins/index.ts
// UPDATED: 2025-01-07 - Integrated enhanced text plugin with extension system

import {
  multiVariableText,
  barcodes,
  image,
  svg,
  line,
  table,
  rectangle,
  ellipse,
  dateTime,
  date,
  time,
  select,
  checkbox,
  radioGroup,
} from '@pdfme/schemas';
import { signature } from './signature';

// 🆕 Import enhanced text plugin with extension system
import textSchema, { 
  extensionSystem,
  examples,
  dev,
  features,
  info
} from './base/text';

/**
 * ENHANCED PLUGIN COLLECTION
 * 
 * Now includes the enhanced text plugin with extension system support
 */
export const getPlugins = () => {
  return {
    Text: textSchema, // 🆕 Enhanced with extension system
    'Multi-Variable Text': multiVariableText,
    Table: table,
    Line: line,
    Rectangle: rectangle,
    Ellipse: ellipse,
    Image: image,
    SVG: svg,
    Signature: signature,
    QR: barcodes.qrcode,
    DateTime: dateTime,
    Date: date,
    Time: time,
    Select: select,
    Checkbox: checkbox,
    RadioGroup: radioGroup,
    EAN13: barcodes.ean13,
    Code128: barcodes.code128,
  };
};

/**
 * 🆕 EXTENSION SYSTEM UTILITIES
 * 
 * Export extension system utilities for Designer integration
 */
export const textExtensionSystem = {
  // Core extension management
  extensionSystem,
  
  // Development tools
  dev,
  
  // Feature detection
  features,
  
  // Plugin information
  info,
  
  // Example extensions
  examples,
  
  // Initialize with example extensions for playground
  async initializePlayground() {
    try {
      console.log('🔌 Initializing Text Plugin Extension System...');
      
      // 🐛 FIX: Better initialization handling
      const manager = await extensionSystem.getManager();
      
      // Clear existing extensions first to avoid conflicts
      const existingRegistry = manager.getRegistry();
      const existingNames = Array.from(existingRegistry.keys());
      
      if (existingNames.length > 0) {
        console.log(`🔄 Clearing ${existingNames.length} existing extensions...`);
        for (const name of existingNames) {
          try {
            await manager.unregister(name);
          } catch (error) {
            console.warn(`Warning: Failed to unregister ${name}:`, error.message);
          }
        }
      }
      
      // Register example extensions for demonstration
      const registrationResult = await examples.registerAll();
      
      // Get final stats
      const stats = await extensionSystem.getStats();
      
      console.log(`✅ Extension system initialized: ${registrationResult.successful}/${registrationResult.total} extensions registered`);
      
      return {
        success: registrationResult.success,
        stats,
        registrationResult,
        message: `Extension system ready with ${registrationResult.successful}/${registrationResult.total} extensions`
      };
      
    } catch (error) {
      console.warn('⚠️ Extension system initialization failed:', error);
      return {
        success: false,
        error: error.message,
        message: 'Extension system not available (fallback mode)'
      };
    }
  },
  
  // Get extension diagnostics for UI display
  async getDiagnostics() {
    try {
      return await dev.diagnoseExtensions();
    } catch (error) {
      return {
        error: error.message,
        extensions: [],
        summary: { total: 0, enabled: 0, healthy: 0 }
      };
    }
  },
  
  // Quick health check
  async healthCheck() {
    try {
      const isAvailable = await features.hasExtensionSystem();
      const stats = await extensionSystem.getStats();
      const allFeatures = await features.getAll();
      
      return {
        available: isAvailable,
        stats,
        features: allFeatures,
        status: isAvailable ? 'healthy' : 'unavailable'
      };
    } catch (error) {
      return {
        available: false,
        error: error.message,
        status: 'error'
      };
    }
  }
};

/**
 * 🆕 PLUGIN METADATA
 * 
 * Enhanced plugin information for Designer UI
 */
export const getEnhancedPluginInfo = async () => {
  const basePlugins = getPlugins();
  
  // Get extension system info for text plugin
  const textInfo = await textExtensionSystem.healthCheck();
  
  return {
    plugins: basePlugins,
    enhanced: {
      Text: {
        ...info,
        extensionSystem: textInfo,
        features: await features.getAll(),
      }
    },
    stats: {
      total: Object.keys(basePlugins).length,
      enhanced: textInfo.available ? 1 : 0,
    }
  };
};

/**
 * 🆕 DEVELOPMENT UTILITIES FOR PLAYGROUND
 */
export const playgroundUtils = {
  // Validate all enhanced features
  async runComprehensiveValidation() {
    try {
      return await dev.validate();
    } catch (error) {
      return {
        isValid: false,
        errors: [error.message],
        warnings: ['Validation system not available']
      };
    }
  },
  
  // Performance benchmarks
  async runBenchmarks() {
    try {
      await dev.benchmark();
      return { success: true };
    } catch (error) {
      console.warn('Benchmarks not available:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Create custom extension for demonstration
  async createDemoExtension(name: string) {
    try {
      const demoExtension = await examples.createCustom(name);
      await extensionSystem.registerExtension(demoExtension);
      return { success: true, extension: demoExtension };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

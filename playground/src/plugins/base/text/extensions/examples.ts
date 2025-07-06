// plugins/text/extensions/examples.ts
// CREATED: 2025-01-07 - Example extensions demonstrating the extension system

import type {
  TextPluginExtension,
  TextProcessingContext,
  UIRenderContext,
  PDFRenderContext,
  ValidationContext,
  PerformanceMetric,
} from './types';

/**
 * EXAMPLE EXTENSIONS
 * 
 * These examples demonstrate how to create extensions for the text plugin
 * and showcase various capabilities of the extension system.
 */

// === 1. TEXT TRANSFORMATION EXTENSION ===

/**
 * Example: Text transformation extension
 * Demonstrates beforeTextProcessing hook
 */
export const textTransformExtension: TextPluginExtension = {
  name: 'text-transform',
  version: '1.0.0',
  description: 'Provides text transformation capabilities',
  
  config: {
    maxExecutionTime: 50,
    enablePerformanceMonitoring: true,
    enableErrorRecovery: true,
  },
  
  hooks: {
    beforeTextProcessing: (context: TextProcessingContext) => {
      // Example transformations
      let transformedValue = context.value;
      
      // Auto-capitalize sentences
      transformedValue = transformedValue.replace(/\.\s+([a-z])/g, (match, letter) => {
        return match.replace(letter, letter.toUpperCase());
      });
      
      // Smart quotes
      transformedValue = transformedValue
        .replace(/"/g, '"')
        .replace(/"/g, '"')
        .replace(/'/g, '\'')
        .replace(/'/g, '\'');
      
      // Add modification metadata
      const modifications = [];
      if (transformedValue !== context.value) {
        modifications.push({
          type: 'text-transform' as const,
          description: 'Applied smart formatting (capitalization, quotes)',
          data: { originalLength: context.value.length, newLength: transformedValue.length }
        });
      }
      
      return {
        ...context,
        value: transformedValue,
        metadata: {
          ...context.metadata,
          transformations: modifications,
        }
      };
    },
  },
};

// === 2. ACCESSIBILITY EXTENSION ===

/**
 * Example: Accessibility validation extension
 * Demonstrates validation hook
 */
export const accessibilityExtension: TextPluginExtension = {
  name: 'accessibility',
  version: '1.0.0',
  description: 'Validates text for accessibility compliance',
  
  config: {
    maxExecutionTime: 30,
    enablePerformanceMonitoring: true,
  },
  
  hooks: {
    validate: (context: ValidationContext) => {
      const errors = [];
      const { schema, value } = context;
      
      // Check font size accessibility
      if (schema.fontSize < 12) {
        errors.push({
          code: 'A11Y_FONT_SIZE',
          message: 'Font size below 12pt may not be accessible',
          severity: 'warning' as const,
          field: 'fontSize' as const,
          suggestion: 'Consider using font size of 12pt or larger'
        });
      }
      
      // Check color contrast (simplified check)
      if (schema.fontColor === schema.backgroundColor) {
        errors.push({
          code: 'A11Y_COLOR_CONTRAST',
          message: 'Text and background colors are identical',
          severity: 'error' as const,
          field: 'fontColor' as const,
          suggestion: 'Ensure sufficient color contrast between text and background'
        });
      }
      
      // Check text length for readability
      if (value && value.length > 1000) {
        errors.push({
          code: 'A11Y_TEXT_LENGTH',
          message: 'Very long text blocks may be difficult to read',
          severity: 'info' as const,
          suggestion: 'Consider breaking long text into smaller paragraphs'
        });
      }
      
      return {
        isValid: !errors.some(e => e.severity === 'error'),
        errors,
        metadata: {
          validatedBy: 'accessibility-extension',
          executionTime: performance.now(),
        }
      };
    },
  },
};

// === 3. PERFORMANCE MONITORING EXTENSION ===

/**
 * Example: Performance monitoring extension
 * Demonstrates performance monitoring hook
 */
export const performanceMonitorExtension: TextPluginExtension = {
  name: 'performance-monitor',
  version: '1.0.0',
  description: 'Monitors and logs performance metrics',
  
  config: {
    maxExecutionTime: 10, // Very fast for monitoring
    enablePerformanceMonitoring: false, // Don't monitor the monitor
  },
  
  hooks: {
    onPerformanceMetric: (metric: PerformanceMetric) => {
      // Log slow operations
      if (metric.executionTime > 50) {
        console.warn(`Slow extension operation detected:`, {
          extension: metric.extensionName,
          hook: metric.hookName,
          time: metric.executionTime,
          timestamp: new Date(metric.timestamp).toISOString(),
        });
      }
      
      // Could send to analytics service
      // analytics.track('extension_performance', metric);
    },
  },
};

// === 4. UI ENHANCEMENT EXTENSION ===

/**
 * Example: UI enhancement extension
 * Demonstrates UI rendering hooks
 */
export const uiEnhancementExtension: TextPluginExtension = {
  name: 'ui-enhancement',
  version: '1.0.0',
  description: 'Adds UI enhancements like tooltips and helpers',
  
  config: {
    maxExecutionTime: 100,
    enableAsyncExecution: true,
  },
  
  hooks: {
    afterUIRender: (context: UIRenderContext, result) => {
      // Add character counter
      const counterElement = document.createElement('div');
      counterElement.style.cssText = `
        position: absolute;
        bottom: -20px;
        right: 0;
        font-size: 10px;
        color: #666;
        background: white;
        padding: 2px 4px;
        border-radius: 2px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      `;
      counterElement.textContent = `${context.value.length} chars`;
      
      // Add accessibility info tooltip
      const tooltipElement = document.createElement('div');
      tooltipElement.style.cssText = `
        position: absolute;
        top: -25px;
        left: 0;
        font-size: 10px;
        color: white;
        background: #333;
        padding: 2px 6px;
        border-radius: 3px;
        opacity: 0;
        transition: opacity 0.2s;
        pointer-events: none;
      `;
      tooltipElement.textContent = `Font: ${context.schema.fontSize}pt, Alignment: ${context.schema.alignment}`;
      
      // Show tooltip on hover
      context.element.addEventListener('mouseenter', () => {
        tooltipElement.style.opacity = '1';
      });
      
      context.element.addEventListener('mouseleave', () => {
        tooltipElement.style.opacity = '0';
      });
      
      return {
        ...result,
        additionalElements: [
          ...(result.additionalElements || []),
          counterElement,
          tooltipElement,
        ],
        eventHandlers: [
          ...(result.eventHandlers || []),
          {
            event: 'keyup',
            handler: (e: Event) => {
              const target = e.target as HTMLElement;
              counterElement.textContent = `${target.textContent?.length || 0} chars`;
            },
            element: context.element,
          },
        ],
      };
    },
  },
};

// === 5. PDF ANNOTATION EXTENSION ===

/**
 * Example: PDF annotation extension
 * Demonstrates PDF rendering hooks
 */
export const pdfAnnotationExtension: TextPluginExtension = {
  name: 'pdf-annotation',
  version: '1.0.0',
  description: 'Adds annotations to PDF text elements',
  
  config: {
    maxExecutionTime: 75,
  },
  
  hooks: {
    afterPDFRender: (context: PDFRenderContext, result) => {
      const { page, schema } = context;
      
      return {
        ...result,
        additionalOperations: [
          ...(result.additionalOperations || []),
          {
            type: 'add-annotation' as const,
            description: 'Add accessibility metadata',
            operation: () => {
              // Add annotation with schema information
              // This is a simplified example - real implementation would use pdf-lib's annotation APIs
              const annotationText = `Text element: ${schema.name || 'Unnamed'}, Font: ${schema.fontSize}pt`;
              
              // In real implementation, you would use:
              // page.node.addAnnot(...)
              console.log('PDF Annotation added:', annotationText);
            },
          },
          {
            type: 'set-metadata' as const,
            description: 'Set PDF metadata for accessibility',
            operation: () => {
              // Set PDF metadata for screen readers
              // This would typically involve setting StructTreeRoot and other accessibility features
              console.log('PDF accessibility metadata set for text element');
            },
          },
        ],
      };
    },
  },
};

// === 6. MARKDOWN SUPPORT EXTENSION ===

/**
 * Example: Markdown support extension
 * Demonstrates complex text processing
 */
export const markdownExtension: TextPluginExtension = {
  name: 'markdown-support',
  version: '1.0.0',
  description: 'Adds basic markdown support to text processing',
  
  config: {
    maxExecutionTime: 150,
    enableAsyncExecution: true,
  },
  
  hooks: {
    beforeTextProcessing: (context: TextProcessingContext) => {
      const { value, schema } = context;
      
      // Simple markdown processing
      let processedValue = value;
      const modifications = [];
      
      // Bold text **text** -> Apply bold styling to schema
      const boldMatches = value.match(/\*\*(.*?)\*\*/g);
      if (boldMatches) {
        processedValue = processedValue.replace(/\*\*(.*?)\*\*/g, '$1');
        modifications.push({
          type: 'text-transform' as const,
          description: 'Processed markdown bold syntax',
          data: { boldCount: boldMatches.length }
        });
        
        // Note: In a real implementation, you'd need to track which parts are bold
        // and apply rich text formatting
      }
      
      // Italic text *text* -> Apply italic styling
      const italicMatches = value.match(/\*(.*?)\*/g);
      if (italicMatches) {
        processedValue = processedValue.replace(/\*(.*?)\*/g, '$1');
        modifications.push({
          type: 'text-transform' as const,
          description: 'Processed markdown italic syntax',
          data: { italicCount: italicMatches.length }
        });
      }
      
      return {
        ...context,
        value: processedValue,
        metadata: {
          ...context.metadata,
          markdownProcessed: modifications.length > 0,
          modifications,
        }
      };
    },
  },
};

// === EXTENSION COLLECTION ===

/**
 * Collection of all example extensions for easy registration
 */
export const exampleExtensions = [
  textTransformExtension,
  accessibilityExtension,
  performanceMonitorExtension,
  uiEnhancementExtension,
  pdfAnnotationExtension,
  markdownExtension,
];

/**
 * Helper function to register all example extensions
 */
export const registerExampleExtensions = async () => {
  const { extensionManager } = await import('./manager');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const extension of exampleExtensions) {
    try {
      await extensionManager.register(extension);
      console.log(`✅ Registered example extension: ${extension.name}`);
      successCount++;
    } catch (error) {
      console.warn(`⚠️ Failed to register extension ${extension.name}:`, error.message);
      errorCount++;
      
      // 🐛 FIX: Continue with other extensions instead of failing completely
      // Don't throw, just log and continue
    }
  }
  
  console.log(`🔌 Extension registration complete: ${successCount} successful, ${errorCount} failed`);
  
  // 🐛 FIX: Return success info instead of throwing on any failure
  return {
    total: exampleExtensions.length,
    successful: successCount,
    failed: errorCount,
    success: successCount > 0, // Consider success if at least one extension registered
  };
};

/**
 * Helper function to unregister all example extensions
 */
export const unregisterExampleExtensions = async () => {
  const { extensionManager } = await import('./manager');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const extension of exampleExtensions) {
    try {
      await extensionManager.unregister(extension.name);
      console.log(`✅ Unregistered example extension: ${extension.name}`);
      successCount++;
    } catch (error) {
      console.warn(`⚠️ Failed to unregister extension ${extension.name}:`, error.message);
      errorCount++;
      
      // 🐛 FIX: Continue with other extensions instead of failing completely
    }
  }
  
  console.log(`🔌 Extension unregistration complete: ${successCount} successful, ${errorCount} failed`);
  
  return {
    total: exampleExtensions.length,
    successful: successCount,
    failed: errorCount,
    success: true, // Always consider unregistration successful
  };
};

// === USAGE EXAMPLES ===

/**
 * Example: How to create a custom extension
 */
export const createCustomExtension = (name: string): TextPluginExtension => {
  return {
    name: `custom-${name}`,
    version: '1.0.0',
    description: `Custom extension: ${name}`,
    
    config: {
      maxExecutionTime: 100,
      enablePerformanceMonitoring: true,
    },
    
    hooks: {
      beforeTextProcessing: (context) => {
        console.log(`Custom extension ${name} processing text:`, context.value);
        return context;
      },
      
      validate: (context) => {
        return {
          isValid: true,
          errors: [],
          metadata: {
            validatedBy: `custom-${name}`,
            executionTime: performance.now(),
          }
        };
      },
    },
    
    onInstall: () => {
      console.log(`Custom extension ${name} installed`);
    },
    
    onUninstall: () => {
      console.log(`Custom extension ${name} uninstalled`);
    },
    
    healthCheck: () => {
      return true; // Always healthy for this example
    },
  };
};

/**
 * Example: How to create a conditional extension
 */
export const createConditionalExtension = (condition: () => boolean): TextPluginExtension => {
  return {
    name: 'conditional-extension',
    version: '1.0.0',
    description: 'Extension that only runs when condition is met',
    
    config: {
      maxExecutionTime: 50,
    },
    
    hooks: {
      beforeTextProcessing: (context) => {
        if (!condition()) {
          return context; // Skip processing
        }
        
        // Apply conditional processing
        return {
          ...context,
          value: `[Conditional] ${context.value}`,
        };
      },
    },
    
    healthCheck: condition, // Extension is healthy when condition is met
  };
};
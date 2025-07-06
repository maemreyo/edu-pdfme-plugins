// CREATED: 2025-01-07 - Integration points for extension system with existing code

import type { TextSchema } from '../types/enhanced';
import type { Font as FontKitFont } from 'fontkit';
import type { UIRenderProps, PDFRenderProps } from '@pdfme/common';
import { extensionManager } from './manager';
import type {
  TextProcessingContext,
  UIRenderContext,
  PDFRenderContext,
  SchemaUpdateContext,
  ValidationContext,
  TextProcessingResult,
  UIRenderResult,
  PDFRenderResult,
} from './types';

/**
 * EXTENSION SYSTEM INTEGRATION
 * 
 * This module provides integration points between the extension system
 * and existing text plugin functionality without breaking existing code.
 */

// === TEXT PROCESSING INTEGRATION ===

/**
 * Enhanced text processing with extension hooks
 * This wraps the existing processTextComprehensive function
 */
export const processTextWithExtensions = async ({
  value,
  schema,
  fontKitFont
}: {
  value: string;
  schema: TextSchema;
  fontKitFont: FontKitFont;
}): Promise<{
  value: string;
  schema: TextSchema;
  fontKitFont: FontKitFont;
  extensionData?: any;
}> => {
  
  // Create processing context
  const context: TextProcessingContext = {
    value,
    schema,
    fontKitFont,
    metadata: {
      processingStage: 'pre',
      timestamp: Date.now(),
      requestId: generateRequestId(),
    }
  };
  
  try {
    // Execute beforeTextProcessing hooks
    const preProcessedContext = await extensionManager.executeHook(
      'beforeTextProcessing',
      context
    );
    
    // Import and call original processing (to avoid circular dependency)
    const { processTextComprehensive } = await import('../helper');
    const originalResult = processTextComprehensive({
      value: preProcessedContext.value,
      schema: preProcessedContext.schema,
      fontKitFont: preProcessedContext.fontKitFont,
    });
    
    // Create result context for post-processing
    const resultContext: TextProcessingContext = {
      ...preProcessedContext,
      value: preProcessedContext.value, // Extensions might have modified this
      metadata: {
        ...preProcessedContext.metadata,
        processingStage: 'post',
      }
    };
    
    const processedResult: TextProcessingResult = {
      value: preProcessedContext.value,
      schema: preProcessedContext.schema,
      modifications: [],
      performance: {
        executionTime: 0, // Will be calculated by extensions
      }
    };
    
    // Execute afterTextProcessing hooks
    const finalResult = await extensionManager.executeHook(
      'afterTextProcessing',
      processedResult
    );
    
    return {
      value: finalResult.value,
      schema: finalResult.schema,
      fontKitFont,
      extensionData: finalResult.modifications,
    };
    
  } catch (error) {
    console.warn('Extension processing failed, falling back to original:', error);
    
    // Fallback to original processing
    const { processTextComprehensive } = await import('../helper');
    const fallbackResult = processTextComprehensive({ value, schema, fontKitFont });
    
    return {
      value,
      schema,
      fontKitFont,
    };
  }
};

// === UI RENDERING INTEGRATION ===

/**
 * Enhanced UI rendering with extension hooks
 */
export const enhanceUIRender = async (
  originalRenderFn: (arg: UIRenderProps<TextSchema>) => Promise<void>,
  arg: UIRenderProps<TextSchema>
): Promise<void> => {
  
  const { schema, rootElement, mode, value, _cache } = arg;
  
  // Get font for context
  let fontKitFont: FontKitFont;
  try {
    const { getFontKitFont } = await import('../helper');
    const { getDefaultFont } = await import('@pdfme/common');
    const font = arg.options?.font || getDefaultFont();
    fontKitFont = await getFontKitFont(schema.fontName, font, _cache as Map<string, any>);
  } catch (error) {
    console.warn('Failed to get font for extension context:', error);
    // Continue without font context
    return originalRenderFn(arg);
  }
  
  // Create UI render context
  const context: UIRenderContext = {
    element: rootElement,
    schema,
    mode,
    value,
    fontKitFont,
    metadata: {
      renderStage: 'pre',
      timestamp: Date.now(),
    }
  };
  
  try {
    // Execute beforeUIRender hooks
    const preRenderContext = await extensionManager.executeHook(
      'beforeUIRender',
      context
    );
    
    // Execute original render function
    await originalRenderFn({
      ...arg,
      schema: preRenderContext.schema,
      // Note: We can't easily modify other args without breaking existing code
    });
    
    // Create post-render context
    const postRenderContext: UIRenderContext = {
      ...preRenderContext,
      metadata: {
        ...preRenderContext.metadata,
        renderStage: 'post',
      }
    };
    
    const renderResult: UIRenderResult = {
      element: rootElement,
      eventHandlers: [],
    };
    
    // Execute afterUIRender hooks
    const finalResult = await extensionManager.executeHook(
      'afterUIRender',
      renderResult
    );
    
    // Apply additional elements and event handlers from extensions
    if (finalResult.additionalElements) {
      finalResult.additionalElements.forEach(el => {
        rootElement.appendChild(el);
      });
    }
    
    if (finalResult.eventHandlers) {
      finalResult.eventHandlers.forEach(({ event, handler, element }) => {
        element.addEventListener(event, handler);
      });
    }
    
  } catch (error) {
    console.warn('UI render extension failed, using original render:', error);
    await originalRenderFn(arg);
  }
};

// === PDF RENDERING INTEGRATION ===

/**
 * Enhanced PDF rendering with extension hooks
 */
export const enhancePDFRender = async (
  originalRenderFn: (arg: PDFRenderProps<TextSchema>) => Promise<void>,
  arg: PDFRenderProps<TextSchema>
): Promise<void> => {
  
  const { value, schema, page, pdfDoc, _cache } = arg;
  
  // Get font for context
  let fontKitFont: FontKitFont;
  try {
    const { getFontKitFont } = await import('../helper');
    const { getDefaultFont } = await import('@pdfme/common');
    const font = arg.options?.font || getDefaultFont();
    fontKitFont = await getFontKitFont(schema.fontName, font, _cache as Map<string, any>);
  } catch (error) {
    console.warn('Failed to get font for PDF extension context:', error);
    return originalRenderFn(arg);
  }
  
  // Create PDF render context
  const context: PDFRenderContext = {
    page,
    pdfDoc,
    schema,
    value,
    fontKitFont,
    renderParams: {
      x: 0, y: 0, width: 0, height: 0, // Will be calculated by original render
      fontSize: schema.fontSize,
      color: null,
    },
    metadata: {
      renderStage: 'pre',
      timestamp: Date.now(),
    }
  };
  
  try {
    // Execute beforePDFRender hooks
    const preRenderContext = await extensionManager.executeHook(
      'beforePDFRender',
      context
    );
    
    // Execute original render function
    await originalRenderFn({
      ...arg,
      schema: preRenderContext.schema,
      value: preRenderContext.value,
    });
    
    // Create post-render context and result
    const postRenderContext: PDFRenderContext = {
      ...preRenderContext,
      metadata: {
        ...preRenderContext.metadata,
        renderStage: 'post',
      }
    };
    
    const renderResult: PDFRenderResult = {
      additionalOperations: [],
    };
    
    // Execute afterPDFRender hooks
    const finalResult = await extensionManager.executeHook(
      'afterPDFRender',
      renderResult
    );
    
    // Execute additional PDF operations from extensions
    if (finalResult.additionalOperations) {
      finalResult.additionalOperations.forEach(op => {
        try {
          op.operation();
        } catch (error) {
          console.warn(`PDF operation failed: ${op.description}`, error);
        }
      });
    }
    
  } catch (error) {
    console.warn('PDF render extension failed, using original render:', error);
    await originalRenderFn(arg);
  }
};

// === SCHEMA UPDATE INTEGRATION ===

/**
 * Enhanced schema updates with extension hooks
 */
export const enhanceSchemaUpdate = async (
  oldSchema: TextSchema,
  newSchema: TextSchema,
  originalUpdateFn?: (schema: TextSchema) => void
): Promise<TextSchema> => {
  
  // Calculate change set
  const changeSet = calculateSchemaChanges(oldSchema, newSchema);
  
  const context: SchemaUpdateContext = {
    oldSchema,
    newSchema,
    changeSet,
    metadata: {
      source: 'user', // Could be enhanced to detect source
      timestamp: Date.now(),
    }
  };
  
  try {
    // Execute beforeSchemaUpdate hooks
    const preUpdateContext = await extensionManager.executeHook(
      'beforeSchemaUpdate',
      context
    );
    
    // Apply original update logic
    if (originalUpdateFn) {
      originalUpdateFn(preUpdateContext.newSchema);
    }
    
    // Execute afterSchemaUpdate hooks
    await extensionManager.executeHook(
      'afterSchemaUpdate',
      preUpdateContext
    );
    
    return preUpdateContext.newSchema;
    
  } catch (error) {
    console.warn('Schema update extension failed, using original schema:', error);
    
    if (originalUpdateFn) {
      originalUpdateFn(newSchema);
    }
    
    return newSchema;
  }
};

// === VALIDATION INTEGRATION ===

/**
 * Enhanced validation with extension hooks
 */
export const enhanceValidation = async (
  schema: TextSchema,
  value?: string,
  originalValidationFn?: (schema: TextSchema) => boolean
): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> => {
  
  const context: ValidationContext = {
    schema,
    value,
    environment: {
      platform: 'web', // Could be detected
      capabilities: [], // Could be populated
    },
    metadata: {
      validationLevel: 'basic',
      timestamp: Date.now(),
    }
  };
  
  const allErrors: string[] = [];
  const allWarnings: string[] = [];
  let isValid = true;
  
  try {
    // Execute original validation
    if (originalValidationFn) {
      const originalResult = originalValidationFn(schema);
      if (!originalResult) {
        isValid = false;
        allErrors.push('Original validation failed');
      }
    }
    
    // Execute extension validation hooks
    const validationResults = await Promise.allSettled(
      Array.from(extensionManager.getRegistry().entries())
        .filter(([_, entry]) => entry.isEnabled && entry.extension.hooks.validate)
        .map(async ([name, entry]) => {
          try {
            return await extensionManager.executeExtensionHook(name, 'validate', context);
          } catch (error) {
            console.warn(`Validation extension ${name} failed:`, error);
            return null;
          }
        })
    );
    
    // Collect results
    validationResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        const validationResult = result.value;
        
        if (!validationResult.isValid) {
          isValid = false;
        }
        
        validationResult.errors.forEach(error => {
          if (error.severity === 'error') {
            allErrors.push(error.message);
          } else if (error.severity === 'warning') {
            allWarnings.push(error.message);
          }
        });
      }
    });
    
  } catch (error) {
    console.warn('Validation extension processing failed:', error);
  }
  
  return {
    isValid,
    errors: allErrors,
    warnings: allWarnings,
  };
};

// === UTILITY FUNCTIONS ===

/**
 * Generate unique request ID for tracking
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate changes between schemas
 */
function calculateSchemaChanges(
  oldSchema: TextSchema,
  newSchema: TextSchema
): Array<{ field: keyof TextSchema; oldValue: any; newValue: any }> {
  const changes: Array<{ field: keyof TextSchema; oldValue: any; newValue: any }> = [];
  
  // Compare all schema fields
  const allKeys = new Set([
    ...Object.keys(oldSchema) as Array<keyof TextSchema>,
    ...Object.keys(newSchema) as Array<keyof TextSchema>
  ]);
  
  allKeys.forEach(key => {
    const oldValue = oldSchema[key];
    const newValue = newSchema[key];
    
    // Simple comparison (could be enhanced for deep objects)
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes.push({
        field: key,
        oldValue,
        newValue,
      });
    }
  });
  
  return changes;
}

/**
 * Check if extensions are available and enabled
 */
export const areExtensionsEnabled = (): boolean => {
  try {
    return extensionManager.getRegistry().size > 0;
  } catch (error) {
    return false;
  }
};

/**
 * Get extension statistics for debugging
 */
export const getExtensionStats = () => {
  const registry = extensionManager.getRegistry();
  const stats = {
    total: registry.size,
    enabled: 0,
    healthy: 0,
    totalExecutions: 0,
    totalErrors: 0,
  };
  
  registry.forEach(entry => {
    if (entry.isEnabled) stats.enabled++;
    if (entry.isHealthy) stats.healthy++;
    stats.totalExecutions += entry.statistics.totalExecutions;
    stats.totalErrors += entry.statistics.errorCount;
  });
  
  return stats;
};
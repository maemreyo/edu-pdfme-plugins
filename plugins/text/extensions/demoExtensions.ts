// CREATED: 2025-01-07 - Complete demo của extension system với tất cả hooks

import type {
  TextPluginExtension,
  TextProcessingContext,
  UIRenderContext,
  PDFRenderContext,
  ValidationContext,
  PerformanceMetric,
} from './types';

/**
 * 🎯 COMPLETE EXTENSION DEMO SUITE
 * 
 * Comprehensive demonstration của tất cả extension capabilities:
 * 1. Real-time text transformation
 * 2. UI enhancements và event handling
 * 3. PDF annotations và custom rendering
 * 4. Validation và accessibility checks
 * 5. Performance monitoring
 */

// === 1. ENHANCED TEXT TRANSFORM EXTENSION ===

/**
 * ✨ DEMO: Real-time Text Transformation
 * - Auto-capitalization for sentences
 * - Smart quotes replacement
 * - Text cleanup và formatting
 * - INTEGRATION: Works in both UI editing AND PDF generation
 */
export const enhancedTextTransformExtension: TextPluginExtension = {
  name: 'enhanced-text-transform',
  version: '1.0.0',
  description: '✨ Real-time text transformation với auto-formatting',
  
  config: {
    maxExecutionTime: 50,
    enablePerformanceMonitoring: true,
    enableErrorRecovery: true,
  },
  
  hooks: {
    // 🎯 HOOK 1: Transform text before processing
    beforeTextProcessing: (context: TextProcessingContext) => {
      console.log('🔄 BEFORE TEXT PROCESSING:', context.value);
      
      let transformedValue = context.value;
      const transformations = [];
      
      // Auto-capitalize sentences
      const originalValue = transformedValue;
      transformedValue = transformedValue.replace(/(?:^|\.\s+)([a-z])/g, (match, letter) => {
        return match.replace(letter, letter.toUpperCase());
      });
      
      if (transformedValue !== originalValue) {
        transformations.push('Auto-capitalization applied');
      }
      
      // Smart quotes
      const beforeQuotes = transformedValue;
      transformedValue = transformedValue
        .replace(/"/g, '"') // Start quote
        .replace(/"/g, '"') // End quote
        .replace(/'/g, '\'') // Start single quote
        .replace(/'/g, '\''); // End single quote
      
      if (transformedValue !== beforeQuotes) {
        transformations.push('Smart quotes applied');
      }
      
      // Text cleanup
      const beforeCleanup = transformedValue;
      transformedValue = transformedValue
        .replace(/\s+/g, ' ') // Multiple spaces -> single space
        .replace(/\s+\./g, '.') // Space before period
        .replace(/\.\s*\./g, '.') // Multiple periods
        .trim();
      
      if (transformedValue !== beforeCleanup) {
        transformations.push('Text cleanup applied');
      }
      
      console.log('✅ TEXT TRANSFORMED:', {
        original: context.value,
        transformed: transformedValue,
        transformations
      });
      
      return {
        ...context,
        value: transformedValue,
        metadata: {
          ...context.metadata,
          transformations,
          processedBy: 'enhanced-text-transform',
        }
      };
    },
    
    // 🎯 HOOK 2: Add metadata after processing
    afterTextProcessing: (context: TextProcessingContext, result) => {
      console.log('📋 AFTER TEXT PROCESSING - Adding metadata');
      
      return {
        ...result,
        modifications: [
          ...(result.modifications || []),
          {
            type: 'text-transform' as const,
            description: 'Enhanced text transformations applied',
            data: {
              extensionName: 'enhanced-text-transform',
              transformations: context.metadata?.transformations || [],
              timestamp: Date.now(),
            }
          }
        ]
      };
    },
  },
  
  onInstall: () => {
    console.log('✅ Enhanced Text Transform Extension installed');
    // Could setup global listeners here
  },
  
  onUninstall: () => {
    console.log('❌ Enhanced Text Transform Extension uninstalled');
    // Cleanup global listeners
  },
};

// === 2. ADVANCED UI ENHANCEMENT EXTENSION ===

/**
 * 🎨 DEMO: Advanced UI Enhancements
 * - Real-time character và word counting
 * - Live formatting preview
 * - Interactive tooltips với detailed info
 * - Keyboard shortcuts và auto-complete
 */
export const advancedUIExtension: TextPluginExtension = {
  name: 'advanced-ui-enhancement',
  version: '1.0.0',
  description: '🎨 Advanced UI enhancements với real-time features',
  
  config: {
    maxExecutionTime: 100,
    enableAsyncExecution: true,
  },
  
  hooks: {
    // 🎯 HOOK 3: Enhance UI before rendering
    beforeUIRender: (context: UIRenderContext) => {
      console.log('🎨 BEFORE UI RENDER - Preparing enhancements for:', context.schema.id);
      
      return {
        ...context,
        metadata: {
          ...context.metadata,
          uiEnhancements: {
            showCharCount: true,
            showWordCount: true,
            showFormatPreview: true,
            enableTooltips: true,
          }
        }
      };
    },
    
    // 🎯 HOOK 4: Add UI elements after rendering
    afterUIRender: (context: UIRenderContext, result) => {
      console.log('🎨 AFTER UI RENDER - Adding interactive elements');
      
      const { element, schema, value } = context;
      
      // Create character counter
      const charCounter = document.createElement('div');
      charCounter.className = 'extension-char-counter';
      charCounter.style.cssText = `
        position: absolute;
        bottom: -25px;
        right: 0;
        font-size: 11px;
        color: #666;
        background: rgba(255,255,255,0.9);
        padding: 2px 6px;
        border-radius: 3px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        z-index: 10;
        font-family: monospace;
      `;
      
      const updateCounter = (text: string) => {
        const charCount = text.length;
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
        charCounter.textContent = `${charCount} chars, ${wordCount} words`;
        
        // Color coding based on length
        if (charCount > 1000) {
          charCounter.style.background = 'rgba(255,0,0,0.1)';
          charCounter.style.color = '#d32f2f';
        } else if (charCount > 500) {
          charCounter.style.background = 'rgba(255,193,7,0.1)';
          charCounter.style.color = '#f57c00';
        } else {
          charCounter.style.background = 'rgba(76,175,80,0.1)';
          charCounter.style.color = '#388e3c';
        }
      };
      
      updateCounter(value);
      
      // Create formatting info tooltip
      const tooltipElement = document.createElement('div');
      tooltipElement.className = 'extension-tooltip';
      tooltipElement.style.cssText = `
        position: absolute;
        top: -35px;
        left: 0;
        font-size: 10px;
        color: white;
        background: rgba(0,0,0,0.8);
        padding: 4px 8px;
        border-radius: 4px;
        opacity: 0;
        transition: opacity 0.2s;
        pointer-events: none;
        white-space: nowrap;
        z-index: 20;
        font-family: monospace;
      `;
      
      const updateTooltip = () => {
        tooltipElement.textContent = `${schema.fontName || 'Default'} ${schema.fontSize}pt | ${schema.alignment} | ${schema.verticalAlignment}`;
      };
      
      updateTooltip();
      
      // Create live preview badge
      const previewBadge = document.createElement('div');
      previewBadge.className = 'extension-preview';
      previewBadge.style.cssText = `
        position: absolute;
        top: -30px;
        right: 0;
        font-size: 10px;
        color: white;
        background: linear-gradient(45deg, #25c2a0, #1a8a76);
        padding: 2px 6px;
        border-radius: 3px;
        opacity: 0;
        transition: opacity 0.2s;
        z-index: 15;
      `;
      previewBadge.textContent = '✨ Enhanced';
      
      // Event handlers
      const eventHandlers = [
        {
          event: 'input',
          handler: (e: Event) => {
            const target = e.target as HTMLElement;
            updateCounter(target.textContent || '');
          },
          element: element,
        },
        {
          event: 'mouseenter',
          handler: () => {
            tooltipElement.style.opacity = '1';
            previewBadge.style.opacity = '1';
          },
          element: element,
        },
        {
          event: 'mouseleave',
          handler: () => {
            tooltipElement.style.opacity = '0';
            previewBadge.style.opacity = '0';
          },
          element: element,
        },
        {
          event: 'keydown',
          handler: (e: KeyboardEvent) => {
            // Keyboard shortcuts
            if (e.ctrlKey || e.metaKey) {
              switch (e.key) {
                case 'u':
                  e.preventDefault();
                  console.log('🔤 Keyboard shortcut: Uppercase transformation');
                  // Could trigger text transformation here
                  break;
                case 'l':
                  e.preventDefault();
                  console.log('🔤 Keyboard shortcut: Lowercase transformation');
                  break;
              }
            }
          },
          element: element,
        }
      ];
      
      console.log('🎨 UI Enhancement added:', {
        charCounter: charCounter.textContent,
        tooltip: tooltipElement.textContent,
        eventHandlers: eventHandlers.length
      });
      
      return {
        ...result,
        additionalElements: [
          ...(result.additionalElements || []),
          charCounter,
          tooltipElement,
          previewBadge,
        ],
        eventHandlers: [
          ...(result.eventHandlers || []),
          ...eventHandlers,
        ],
        cleanup: () => {
          // Cleanup function for when element is removed
          console.log('🧹 Cleaning up UI enhancements');
        }
      };
    },
    
    // 🎯 HOOK 5: Handle UI events
    onUIEvent: (event: Event, context: UIRenderContext) => {
      if (event.type === 'keydown') {
        const keyEvent = event as KeyboardEvent;
        if (keyEvent.key === 'Tab' && !keyEvent.shiftKey) {
          console.log('⚡ UI Event: Tab key - could trigger auto-complete');
          // Could show auto-complete suggestions
          return false; // Prevent default to show we handled it
        }
      }
      
      if (event.type === 'paste') {
        console.log('📋 UI Event: Paste detected - could enhance pasted content');
      }
      
      return true; // Allow default behavior
    },
  },
};

// === 3. COMPREHENSIVE PDF ENHANCEMENT EXTENSION ===

/**
 * 📄 DEMO: Advanced PDF Enhancements
 * - Custom PDF annotations
 * - Accessibility metadata
 * - Advanced positioning và effects
 * - PDF/A compliance features
 */
export const comprehensivePDFExtension: TextPluginExtension = {
  name: 'comprehensive-pdf-enhancement',
  version: '1.0.0',
  description: '📄 Comprehensive PDF enhancements và accessibility',
  
  config: {
    maxExecutionTime: 150,
  },
  
  hooks: {
    // 🎯 HOOK 6: Modify PDF render parameters
    beforePDFRender: (context: PDFRenderContext) => {
      console.log('📄 BEFORE PDF RENDER - Enhancing render parameters');
      
      // Could modify colors for print optimization
      const enhancedParams = {
        ...context.renderParams,
        // Example: Enhance contrast for better print quality
        color: adjustColorForPrint(context.renderParams.color),
      };
      
      return {
        ...context,
        renderParams: enhancedParams,
        metadata: {
          ...context.metadata,
          pdfEnhancements: {
            printOptimized: true,
            accessibilityEnabled: true,
            annotationsEnabled: true,
          }
        }
      };
    },
    
    // 🎯 HOOK 7: Add PDF operations after rendering
    afterPDFRender: (context: PDFRenderContext, result) => {
      console.log('📄 AFTER PDF RENDER - Adding annotations và metadata');
      
      const { page, schema, value } = context;
      
      return {
        ...result,
        additionalOperations: [
          ...(result.additionalOperations || []),
          
          // Add accessibility annotation
          {
            type: 'add-annotation' as const,
            description: 'Add screen reader annotation',
            operation: () => {
              console.log('♿ Adding accessibility annotation for text:', value.substring(0, 50));
              // In real implementation: page.addAnnotation(...)
            },
          },
          
          // Add structure tags for PDF/A compliance
          {
            type: 'set-metadata' as const,
            description: 'Set PDF structure metadata',
            operation: () => {
              console.log('📋 Setting PDF structure metadata for:', schema.id);
              // In real implementation: set StructTreeRoot
            },
          },
          
          // Add print optimization
          {
            type: 'print-optimization' as const,
            description: 'Optimize for printing',
            operation: () => {
              console.log('🖨️ Applying print optimizations');
              // Could adjust colors, fonts for better print quality
            },
          },
          
          // Add watermark if needed
          {
            type: 'add-watermark' as const,
            description: 'Add document watermark',
            operation: () => {
              if (schema.name?.includes('draft')) {
                console.log('🏷️ Adding DRAFT watermark');
                // Could add watermark for draft documents
              }
            },
          },
        ],
      };
    },
  },
};

// === 4. ADVANCED VALIDATION EXTENSION ===

/**
 * ✅ DEMO: Comprehensive Validation
 * - Accessibility compliance checking
 * - Content quality validation
 * - Performance impact assessment
 * - Best practices recommendations
 */
export const advancedValidationExtension: TextPluginExtension = {
  name: 'advanced-validation',
  version: '1.0.0',
  description: '✅ Advanced validation với accessibility và quality checks',
  
  config: {
    maxExecutionTime: 75,
  },
  
  hooks: {
    // 🎯 HOOK 8: Comprehensive validation
    validate: (context: ValidationContext) => {
      console.log('✅ RUNNING ADVANCED VALIDATION for:', context.schema.id);
      
      const errors = [];
      const { schema, value } = context;
      
      // Accessibility validation
      if (schema.fontSize < 12) {
        errors.push({
          code: 'A11Y_FONT_SIZE',
          message: `Font size ${schema.fontSize}pt below recommended 12pt minimum`,
          severity: 'warning' as const,
          field: 'fontSize' as const,
          suggestion: 'Increase font size to 12pt or larger for better readability',
        });
      }
      
      // Color contrast validation (simplified)
      if (schema.fontColor === schema.backgroundColor) {
        errors.push({
          code: 'A11Y_COLOR_CONTRAST',
          message: 'Text và background colors are identical - no contrast',
          severity: 'error' as const,
          field: 'fontColor' as const,
          suggestion: 'Ensure sufficient color contrast between text và background',
        });
      }
      
      // Content quality checks
      if (value && value.length > 1000) {
        errors.push({
          code: 'CONTENT_LENGTH',
          message: `Text is very long (${value.length} characters) - may impact readability`,
          severity: 'info' as const,
          suggestion: 'Consider breaking long text into smaller sections',
        });
      }
      
      // Performance validation
      if (schema.characterSpacing > 5) {
        errors.push({
          code: 'PERF_CHAR_SPACING',
          message: `Very high character spacing (${schema.characterSpacing}pt) may impact performance`,
          severity: 'warning' as const,
          field: 'characterSpacing' as const,
          suggestion: 'Consider reducing character spacing for better performance',
        });
      }
      
      // Typography best practices
      if (schema.alignment === 'justify' && value && value.length < 50) {
        errors.push({
          code: 'TYPO_JUSTIFY_SHORT',
          message: 'Justify alignment not recommended for short text',
          severity: 'info' as const,
          field: 'alignment' as const,
          suggestion: 'Use left alignment for short text content',
        });
      }
      
      console.log('✅ VALIDATION COMPLETE:', {
        totalChecks: 5,
        errorsFound: errors.length,
        errors: errors.map(e => `${e.code}: ${e.message}`)
      });
      
      return {
        isValid: !errors.some(e => e.severity === 'error'),
        errors,
        metadata: {
          validatedBy: 'advanced-validation',
          executionTime: performance.now(),
          checksPerformed: ['accessibility', 'content-quality', 'performance', 'typography'],
        }
      };
    },
  },
};

// === 5. PERFORMANCE MONITORING EXTENSION ===

/**
 * ⚡ DEMO: Advanced Performance Monitoring
 * - Real-time performance tracking
 * - Memory usage monitoring
 * - Performance alerts và recommendations
 * - Detailed metrics collection
 */
export const performanceMonitoringExtension: TextPluginExtension = {
  name: 'performance-monitoring',
  version: '1.0.0',
  description: '⚡ Advanced performance monitoring và optimization',
  
  config: {
    maxExecutionTime: 25, // Very fast for monitoring
    enablePerformanceMonitoring: false, // Don't monitor the monitor
  },
  
  hooks: {
    // 🎯 HOOK 9: Performance metric analysis
    onPerformanceMetric: (metric: PerformanceMetric) => {
      console.log('⚡ PERFORMANCE METRIC RECEIVED:', metric);
      
      // Performance thresholds
      const SLOW_THRESHOLD = 50; // ms
      const VERY_SLOW_THRESHOLD = 100; // ms
      
      if (metric.executionTime > VERY_SLOW_THRESHOLD) {
        console.warn('🐌 VERY SLOW OPERATION DETECTED:', {
          extension: metric.extensionName,
          hook: metric.hookName,
          time: `${metric.executionTime.toFixed(2)}ms`,
          recommendation: 'Consider optimizing this extension or increasing timeout',
        });
        
        // Could trigger UI notification
        // toast.warn(`Slow extension: ${metric.extensionName}`);
        
      } else if (metric.executionTime > SLOW_THRESHOLD) {
        console.warn('⚠️ Slow operation:', {
          extension: metric.extensionName,
          hook: metric.hookName,
          time: `${metric.executionTime.toFixed(2)}ms`,
        });
      } else {
        console.log('✅ Good performance:', {
          extension: metric.extensionName,
          hook: metric.hookName,
          time: `${metric.executionTime.toFixed(2)}ms`,
        });
      }
      
      // Collect performance statistics
      const stats = {
        timestamp: metric.timestamp,
        extension: metric.extensionName,
        hook: metric.hookName,
        duration: metric.executionTime,
        performanceCategory: metric.executionTime > VERY_SLOW_THRESHOLD ? 'very-slow' :
                            metric.executionTime > SLOW_THRESHOLD ? 'slow' : 'good',
      };
      
      // Could send to analytics service
      // analytics.track('extension_performance', stats);
      
      // Store in performance history
      if (typeof window !== 'undefined') {
        const perfHistory = JSON.parse(localStorage.getItem('extension-perf-history') || '[]');
        perfHistory.push(stats);
        
        // Keep only last 100 entries
        if (perfHistory.length > 100) {
          perfHistory.splice(0, perfHistory.length - 100);
        }
        
        localStorage.setItem('extension-perf-history', JSON.stringify(perfHistory));
      }
    },
  },
};

// === UTILITY FUNCTIONS ===

function adjustColorForPrint(color: any): any {
  // Example: Enhance contrast for better print quality
  console.log('🎨 Adjusting color for print optimization');
  // In real implementation, could adjust RGB values for better printing
  return color;
}

// === DEMO EXTENSION COLLECTION ===

/**
 * Complete collection of demo extensions
 */
export const demoExtensions = [
  enhancedTextTransformExtension,
  advancedUIExtension,
  comprehensivePDFExtension,
  advancedValidationExtension,
  performanceMonitoringExtension,
];

/**
 * Register all demo extensions
 */
export const registerDemoExtensions = async () => {
  const { extensionManager } = await import('./manager');
  
  let successCount = 0;
  let errorCount = 0;
  
  console.log('🎯 REGISTERING DEMO EXTENSIONS...');
  
  for (const extension of demoExtensions) {
    try {
      await extensionManager.register(extension);
      console.log(`✅ Demo extension registered: ${extension.name}`);
      successCount++;
    } catch (error) {
      console.warn(`⚠️ Failed to register demo extension ${extension.name}:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`🎯 DEMO EXTENSIONS READY: ${successCount} successful, ${errorCount} failed`);
  
  return {
    total: demoExtensions.length,
    successful: successCount,
    failed: errorCount,
    success: successCount > 0,
  };
};

/**
 * Unregister all demo extensions
 */
export const unregisterDemoExtensions = async () => {
  const { extensionManager } = await import('./manager');
  
  let successCount = 0;
  
  for (const extension of demoExtensions) {
    try {
      await extensionManager.unregister(extension.name);
      console.log(`✅ Demo extension unregistered: ${extension.name}`);
      successCount++;
    } catch (error) {
      console.warn(`⚠️ Failed to unregister demo extension ${extension.name}:`, error.message);
    }
  }
  
  console.log(`🎯 DEMO EXTENSIONS CLEANUP: ${successCount} unregistered`);
  
  return { successful: successCount };
};
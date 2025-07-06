# Plugin Extension System - Usage Guide

## 🎯 Overview

The Text Plugin Extension System allows you to extend text functionality without modifying core code. It provides safe, performant, and isolated extension execution with comprehensive error handling.

## 🚀 Quick Start

### 1. Basic Extension Creation

```typescript
import type { TextPluginExtension } from './plugins/text';

const myExtension: TextPluginExtension = {
  name: 'my-custom-extension',
  version: '1.0.0',
  description: 'My custom text processing extension',
  
  config: {
    maxExecutionTime: 100, // 100ms timeout
    enablePerformanceMonitoring: true,
  },
  
  hooks: {
    // Transform text before processing
    beforeTextProcessing: (context) => {
      return {
        ...context,
        value: context.value.toUpperCase(), // Example: uppercase text
      };
    },
    
    // Validate text schema
    validate: (context) => {
      const errors = [];
      if (context.schema.fontSize < 8) {
        errors.push({
          code: 'FONT_TOO_SMALL',
          message: 'Font size should be at least 8pt',
          severity: 'warning',
        });
      }
      
      return {
        isValid: errors.length === 0,
        errors,
        metadata: {
          validatedBy: 'my-custom-extension',
          executionTime: performance.now(),
        }
      };
    },
  },
};
```

### 2. Register Extension

```typescript
import { extensionSystem } from './plugins/text';

// Register extension
await extensionSystem.registerExtension(myExtension);

// Check if registration was successful
const stats = await extensionSystem.getStats();
console.log('Extensions registered:', stats.total);
```

### 3. Use with Text Plugin

```typescript
import textPlugin from './plugins/text';

// Plugin automatically uses registered extensions
// No changes needed to existing code!

const pdfData = await generate({
  template: myTemplate,
  inputs: [{ text: 'hello world' }], // Will be transformed to 'HELLO WORLD'
  plugins: { text: textPlugin },
});
```

## 🔧 Extension Types & Hooks

### Text Processing Hooks

```typescript
hooks: {
  // Before text processing
  beforeTextProcessing: (context) => {
    // Modify text, schema, or metadata
    return {
      ...context,
      value: processText(context.value),
      schema: enhanceSchema(context.schema),
    };
  },
  
  // After text processing
  afterTextProcessing: (context, result) => {
    // Modify processing results
    return {
      ...result,
      modifications: [...result.modifications, myModification],
    };
  },
}
```

### UI Rendering Hooks

```typescript
hooks: {
  // Before UI rendering
  beforeUIRender: (context) => {
    // Modify UI rendering context
    return {
      ...context,
      schema: addUIEnhancements(context.schema),
    };
  },
  
  // After UI rendering
  afterUIRender: (context, result) => {
    // Add UI elements or event handlers
    const tooltip = createTooltip(context.schema);
    
    return {
      ...result,
      additionalElements: [tooltip],
      eventHandlers: [
        {
          event: 'mouseover',
          handler: showTooltip,
          element: context.element,
        }
      ],
    };
  },
  
  // Handle UI events
  onUIEvent: (event, context) => {
    if (event.type === 'keydown' && event.key === 'Tab') {
      // Custom tab handling
      insertAutoCompletion();
      return false; // Prevent default
    }
    return true; // Allow default
  },
}
```

### PDF Rendering Hooks

```typescript
hooks: {
  // Before PDF rendering
  beforePDFRender: (context) => {
    // Modify PDF rendering parameters
    return {
      ...context,
      renderParams: {
        ...context.renderParams,
        color: adjustColorForPrint(context.renderParams.color),
      },
    };
  },
  
  // After PDF rendering
  afterPDFRender: (context, result) => {
    // Add PDF operations (annotations, metadata, etc.)
    return {
      ...result,
      additionalOperations: [
        {
          type: 'add-annotation',
          description: 'Add accessibility annotation',
          operation: () => {
            // Add PDF annotation
            addA11yAnnotation(context.page, context.schema);
          },
        },
      ],
    };
  },
}
```

### Schema Management Hooks

```typescript
hooks: {
  // Before schema update
  beforeSchemaUpdate: (context) => {
    // Validate or transform schema changes
    const validatedSchema = validateSchemaUpdate(
      context.oldSchema,
      context.newSchema
    );
    
    return {
      ...context,
      newSchema: validatedSchema,
    };
  },
  
  // After schema update
  afterSchemaUpdate: (context) => {
    // React to schema changes
    logSchemaChange(context.changeSet);
    notifyDependentSystems(context.newSchema);
  },
}
```

### Validation Hooks

```typescript
hooks: {
  validate: (context) => {
    const errors = [];
    
    // Custom validation rules
    if (context.schema.fontSize > 100) {
      errors.push({
        code: 'FONT_TOO_LARGE',
        message: 'Font size should not exceed 100pt',
        severity: 'error',
        suggestion: 'Use a smaller font size for better readability',
      });
    }
    
    // Accessibility checks
    if (hasLowContrast(context.schema.fontColor, context.schema.backgroundColor)) {
      errors.push({
        code: 'LOW_CONTRAST',
        message: 'Text color contrast is too low',
        severity: 'warning',
        suggestion: 'Increase contrast for better accessibility',
      });
    }
    
    return {
      isValid: !errors.some(e => e.severity === 'error'),
      errors,
      metadata: {
        validatedBy: 'accessibility-validator',
        executionTime: performance.now(),
      }
    };
  },
}
```

### Performance Monitoring Hooks

```typescript
hooks: {
  onPerformanceMetric: (metric) => {
    // Monitor extension performance
    if (metric.executionTime > 50) {
      console.warn(`Slow extension: ${metric.extensionName}.${metric.hookName}`);
      
      // Send to analytics
      analytics.track('slow_extension', {
        extension: metric.extensionName,
        hook: metric.hookName,
        time: metric.executionTime,
      });
    }
    
    // Update performance dashboard
    updatePerformanceDashboard(metric);
  },
}
```

## 🛡️ Safety & Error Handling

### Extension Configuration

```typescript
const extension: TextPluginExtension = {
  name: 'safe-extension',
  version: '1.0.0',
  
  config: {
    // Execution limits
    maxExecutionTime: 100,        // 100ms timeout
    maxMemoryUsage: 10,           // 10MB limit (future)
    
    // Error handling
    enableErrorRecovery: true,    // Continue on errors
    enableAsyncExecution: true,   // Allow async hooks
    
    // Performance
    enablePerformanceMonitoring: true,
    
    // Dependencies
    requiredCapabilities: ['intl-segmenter'],
    conflictsWith: ['other-text-extension'],
    environments: ['web', 'node'],
    
    // Debug
    debugMode: false,
  },
  
  // Lifecycle hooks
  onInstall: () => console.log('Extension installed'),
  onUninstall: () => console.log('Extension uninstalled'),
  onEnable: () => console.log('Extension enabled'),
  onDisable: () => console.log('Extension disabled'),
  
  // Health check
  healthCheck: () => {
    // Return false if extension is unhealthy
    return checkDependencies() && checkResources();
  },
  
  hooks: {
    // Your hooks here
  },
};
```

### Error Handling Best Practices

```typescript
hooks: {
  beforeTextProcessing: (context) => {
    try {
      // Extension logic here
      return processContext(context);
    } catch (error) {
      // Log error but don't break the system
      console.error('Extension processing failed:', error);
      
      // Return original context as fallback
      return context;
    }
  },
  
  validate: (context) => {
    try {
      return performValidation(context);
    } catch (error) {
      // Return safe validation result
      return {
        isValid: true, // Don't block on validation errors
        errors: [{
          code: 'VALIDATION_ERROR',
          message: `Validation failed: ${error.message}`,
          severity: 'warning',
        }],
        metadata: {
          validatedBy: 'extension-with-error',
          executionTime: performance.now(),
        }
      };
    }
  },
}
```

## 📊 Monitoring & Debugging

### Extension Manager API

```typescript
import { extensionSystem } from './plugins/text';

// Get extension manager
const manager = await extensionSystem.getManager();

// Registry management
const registry = manager.getRegistry();
console.log('Registered extensions:', Array.from(registry.keys()));

// Extension statistics
const stats = await extensionSystem.getStats();
console.log('Extension stats:', stats);

// Performance metrics
const metrics = manager.getPerformanceMetrics();
console.log('Recent performance:', metrics.slice(-10));

// Health status
for (const [name, entry] of registry.entries()) {
  console.log(`${name}: ${entry.isEnabled ? 'enabled' : 'disabled'}, ${entry.isHealthy ? 'healthy' : 'unhealthy'}`);
}
```

### Development Tools

```typescript
import { dev } from './plugins/text';

// Run comprehensive validation
const validation = await dev.validate();
console.log('Validation result:', validation);

// Performance benchmarks
await dev.benchmark();

// Extension diagnostics
const diagnostics = await dev.diagnoseExtensions();
console.log('Extension diagnostics:', diagnostics);
```

### Feature Detection

```typescript
import { features } from './plugins/text';

// Check feature availability
const hasExtensions = await features.hasExtensionSystem();
const hasJapanese = features.hasJapaneseSupport();

// Get all features
const allFeatures = await features.getAll();
console.log('Available features:', allFeatures);
```

## 🎨 Advanced Examples

### Rich Text Extension

```typescript
const richTextExtension: TextPluginExtension = {
  name: 'rich-text',
  version: '1.0.0',
  
  config: { maxExecutionTime: 150 },
  
  hooks: {
    beforeTextProcessing: (context) => {
      // Parse markdown-like syntax
      let processedText = context.value;
      
      // **bold** -> track bold spans
      const boldSpans = [];
      processedText = processedText.replace(/\*\*(.*?)\*\*/g, (match, content, offset) => {
        boldSpans.push({ start: offset, end: offset + content.length, style: 'bold' });
        return content;
      });
      
      // *italic* -> track italic spans
      const italicSpans = [];
      processedText = processedText.replace(/\*(.*?)\*/g, (match, content, offset) => {
        italicSpans.push({ start: offset, end: offset + content.length, style: 'italic' });
        return content;
      });
      
      return {
        ...context,
        value: processedText,
        metadata: {
          ...context.metadata,
          richTextSpans: [...boldSpans, ...italicSpans],
        }
      };
    },
    
    afterPDFRender: (context, result) => {
      // Apply rich text formatting to PDF
      const spans = context.metadata?.richTextSpans || [];
      
      return {
        ...result,
        additionalOperations: spans.map(span => ({
          type: 'apply-formatting',
          description: `Apply ${span.style} formatting`,
          operation: () => applyRichTextToPDF(context.page, span),
        })),
      };
    },
  },
};
```

### Conditional Rendering Extension

```typescript
const conditionalExtension: TextPluginExtension = {
  name: 'conditional-rendering',
  version: '1.0.0',
  
  config: { maxExecutionTime: 100 },
  
  hooks: {
    beforeTextProcessing: (context) => {
      // Check for conditional syntax: {{if condition}}text{{/if}}
      const conditionalRegex = /\{\{if\s+(.+?)\}\}(.*?)\{\{\/if\}\}/g;
      
      let processedText = context.value;
      let match;
      
      while ((match = conditionalRegex.exec(context.value)) !== null) {
        const [fullMatch, condition, content] = match;
        
        // Evaluate condition (simplified)
        const shouldShow = evaluateCondition(condition, context);
        
        processedText = processedText.replace(fullMatch, shouldShow ? content : '');
      }
      
      return {
        ...context,
        value: processedText,
      };
    },
  },
};

function evaluateCondition(condition: string, context: any): boolean {
  // Simplified condition evaluation
  // In real implementation, use a safe expression evaluator
  if (condition === 'debug') {
    return process.env.NODE_ENV === 'development';
  }
  if (condition.startsWith('fontSize >')) {
    const value = parseInt(condition.split('>')[1].trim());
    return context.schema.fontSize > value;
  }
  return false;
}
```

## 🔧 Best Practices

### 1. Performance
- Keep hook execution under 50ms
- Use async hooks for I/O operations
- Cache expensive computations
- Monitor performance metrics

### 2. Error Handling
- Always handle errors gracefully
- Return fallback values on failure
- Don't throw unhandled exceptions
- Log errors for debugging

### 3. Compatibility
- Test with different browsers
- Handle missing browser APIs
- Provide graceful degradation
- Check feature availability

### 4. Security
- Validate all inputs
- Sanitize text content
- Avoid eval() or similar functions
- Use CSP-compatible code

### 5. Testing
- Write unit tests for hooks
- Test error conditions
- Validate performance
- Test browser compatibility

## 📚 API Reference

### Types
- `TextPluginExtension` - Main extension interface
- `TextPluginHooks` - Available hook definitions
- `ExtensionManagerConfig` - Manager configuration
- `PerformanceMetric` - Performance monitoring data

### Manager API
- `register(extension)` - Register extension
- `unregister(name)` - Unregister extension
- `enable(name)` - Enable extension
- `disable(name)` - Disable extension
- `executeHook(hook, context)` - Execute hook

### Integration API
- `processTextWithExtensions()` - Enhanced text processing
- `enhanceUIRender()` - Enhanced UI rendering
- `enhancePDFRender()` - Enhanced PDF rendering
- `enhanceSchemaUpdate()` - Enhanced schema updates

This extension system provides a powerful, safe, and flexible foundation for building advanced text functionality while maintaining backward compatibility and performance.
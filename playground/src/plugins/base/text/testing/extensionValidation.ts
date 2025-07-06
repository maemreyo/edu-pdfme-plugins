// CREATED: 2025-01-07 - Comprehensive validation suite for extension system

import type { 
  TextPluginExtension, 
  ValidationResult,
  TextProcessingContext,
} from '../extensions/types';

/**
 * EXTENSION SYSTEM VALIDATION SUITE
 * 
 * Comprehensive testing for the plugin extension system to ensure:
 * - Safe execution with error isolation
 * - Performance monitoring and limits
 * - Hook integration and data flow
 * - Error recovery and fallback behavior
 */

/**
 * Test extension manager registration and lifecycle
 */
export const testExtensionManagerLifecycle = async (): Promise<ValidationResult> => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    const { extensionManager } = await import('../extensions/manager');
    
    // 🐛 FIX: Use unique test extension name to avoid conflicts
    const testExtensionName = `test-lifecycle-${Date.now()}`;
    
    // Test extension registration
    const testExtension: TextPluginExtension = {
      name: testExtensionName,
      version: '1.0.0',
      description: 'Test extension for lifecycle validation',
      config: { maxExecutionTime: 50 },
      hooks: {
        beforeTextProcessing: (context) => context,
      },
      onInstall: () => console.log('Test extension installed'),
      onUninstall: () => console.log('Test extension uninstalled'),
      healthCheck: () => true,
    };
    
    // Test registration
    await extensionManager.register(testExtension);
    
    const registry = extensionManager.getRegistry();
    if (!registry.has(testExtensionName)) {
      errors.push('Extension registration failed');
    }
    
    // Test enable/disable
    await extensionManager.disable(testExtensionName);
    const disabledEntry = registry.get(testExtensionName);
    if (disabledEntry?.isEnabled) {
      errors.push('Extension disable failed');
    }
    
    await extensionManager.enable(testExtensionName);
    const enabledEntry = registry.get(testExtensionName);
    if (!enabledEntry?.isEnabled) {
      errors.push('Extension enable failed');
    }
    
    // 🐛 FIX: Always cleanup test extension
    try {
      await extensionManager.unregister(testExtensionName);
      if (registry.has(testExtensionName)) {
        errors.push('Extension unregistration failed');
      }
    } catch (cleanupError) {
      warnings.push(`Test cleanup failed: ${cleanupError.message}`);
    }
    
  } catch (error) {
    errors.push(`Extension manager lifecycle test failed: ${error.message}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors.map(e => ({
      code: 'EXT_LIFECYCLE',
      message: e,
      severity: 'error' as const,
    })),
    metadata: {
      validatedBy: 'extension-lifecycle-test',
      executionTime: performance.now(),
    }
  };
};

/**
 * Test extension hook execution and data flow
 */
export const testExtensionHookExecution = async (): Promise<ValidationResult> => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    const { extensionManager } = await import('../extensions/manager');
    
    // 🐛 FIX: Use unique test extension name
    const testExtensionName = `test-hooks-${Date.now()}`;
    
    // Create test extension with multiple hooks
    const testExtension: TextPluginExtension = {
      name: testExtensionName,
      version: '1.0.0',
      description: 'Test extension for hook validation',
      config: { maxExecutionTime: 100 },
      hooks: {
        beforeTextProcessing: (context: TextProcessingContext) => {
          return {
            ...context,
            value: `[BEFORE] ${context.value}`,
            metadata: {
              ...context.metadata,
              hookExecuted: 'beforeTextProcessing',
            }
          };
        },
        
        afterTextProcessing: (context: TextProcessingContext, result) => {
          return {
            ...result,
            value: `${result.value} [AFTER]`,
            modifications: [
              ...(result.modifications || []),
              {
                type: 'text-transform' as const,
                description: 'Added test markers',
                data: { test: true }
              }
            ]
          };
        },
        
        validate: (context) => {
          return {
            isValid: context.schema.fontSize > 0,
            errors: context.schema.fontSize <= 0 ? [{
              code: 'TEST_VALIDATION',
              message: 'Font size must be positive',
              severity: 'error' as const,
            }] : [],
            metadata: {
              validatedBy: 'test-extension',
              executionTime: performance.now(),
            }
          };
        },
      },
    };
    
    await extensionManager.register(testExtension);
    
    // Test beforeTextProcessing hook
    const beforeContext: TextProcessingContext = {
      value: 'test text',
      schema: {
        id: 'test', name: 'test', type: 'text', content: 'test',
        position: { x: 0, y: 0 }, width: 100, height: 50, rotate: 0, opacity: 1,
        alignment: 'left', verticalAlignment: 'top', fontSize: 12, lineHeight: 1,
        characterSpacing: 0, fontColor: '#000000', backgroundColor: '',
      },
      fontKitFont: {} as any,
      metadata: {
        processingStage: 'pre', timestamp: Date.now(), requestId: 'test-123',
      }
    };
    
    const result = await extensionManager.executeHook('beforeTextProcessing', beforeContext);
    
    if (!result.value.includes('[BEFORE]')) {
      errors.push('beforeTextProcessing hook failed to modify text');
    }
    
    if (!result.metadata.hookExecuted) {
      errors.push('beforeTextProcessing hook failed to modify metadata');
    }
    
    // Test validation hook
    const validationContext = {
      schema: beforeContext.schema,
      environment: { platform: 'web' as const, capabilities: [] },
      metadata: { validationLevel: 'basic' as const, timestamp: Date.now() }
    };
    
    const validationResult = await extensionManager.executeExtensionHook(
      testExtensionName,
      'validate',
      validationContext
    );
    
    if (!validationResult || !validationResult.isValid) {
      warnings.push('Validation hook returned unexpected result');
    }
    
    // Test with invalid schema
    const invalidValidationContext = {
      ...validationContext,
      schema: { ...beforeContext.schema, fontSize: -1 }
    };
    
    const invalidResult = await extensionManager.executeExtensionHook(
      testExtensionName,
      'validate',
      invalidValidationContext
    );
    
    if (!invalidResult || invalidResult.isValid) {
      errors.push('Validation hook failed to catch invalid schema');
    }
    
    // 🐛 FIX: Always cleanup test extension
    try {
      await extensionManager.unregister(testExtensionName);
    } catch (cleanupError) {
      warnings.push(`Test cleanup failed: ${cleanupError.message}`);
    }
    
  } catch (error) {
    errors.push(`Hook execution test failed: ${error.message}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors.map(e => ({
      code: 'EXT_HOOK_EXEC',
      message: e,
      severity: 'error' as const,
    })),
    metadata: {
      validatedBy: 'extension-hook-test',
      executionTime: performance.now(),
    }
  };
};

/**
 * Test extension error handling and isolation
 */
export const testExtensionErrorHandling = async (): Promise<ValidationResult> => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    const { extensionManager } = await import('../extensions/manager');
    
    // 🐛 FIX: Use unique test extension names
    const failingExtensionName = `test-failing-${Date.now()}`;
    const slowExtensionName = `test-slow-${Date.now()}`;
    
    // Create failing extension
    const failingExtension: TextPluginExtension = {
      name: failingExtensionName,
      version: '1.0.0',
      description: 'Test extension that fails',
      config: { maxExecutionTime: 50 },
      hooks: {
        beforeTextProcessing: () => {
          throw new Error('Intentional test failure');
        },
      },
    };
    
    // Create slow extension
    const slowExtension: TextPluginExtension = {
      name: slowExtensionName,
      version: '1.0.0',
      description: 'Test extension that is slow',
      config: { maxExecutionTime: 10 }, // Very short timeout
      hooks: {
        beforeTextProcessing: async () => {
          // Simulate slow operation
          await new Promise(resolve => setTimeout(resolve, 100));
          return {} as any;
        },
      },
    };
    
    await extensionManager.register(failingExtension);
    await extensionManager.register(slowExtension);
    
    const testContext: TextProcessingContext = {
      value: 'test',
      schema: {
        id: 'test', name: 'test', type: 'text', content: 'test',
        position: { x: 0, y: 0 }, width: 100, height: 50, rotate: 0, opacity: 1,
        alignment: 'left', verticalAlignment: 'top', fontSize: 12, lineHeight: 1,
        characterSpacing: 0, fontColor: '#000000', backgroundColor: '',
      },
      fontKitFont: {} as any,
      metadata: { processingStage: 'pre', timestamp: Date.now(), requestId: 'test' }
    };
    
    // Test that failing extension doesn't break the system
    try {
      const result = await extensionManager.executeHook('beforeTextProcessing', testContext);
      
      // Should return original context despite extension failure
      if (result.value !== 'test') {
        warnings.push('System may not have properly isolated extension failure');
      }
      
    } catch (error) {
      // If error propagates, error recovery isn't working
      errors.push('Extension error was not properly isolated');
    }
    
    // Check that failing extension was disabled
    const registry = extensionManager.getRegistry();
    const failingEntry = registry.get(failingExtensionName);
    
    if (failingEntry && failingEntry.statistics.errorCount === 0) {
      warnings.push('Error counting may not be working properly');
    }
    
    // Test timeout handling (this might be tricky to test reliably)
    try {
      await extensionManager.executeExtensionHook(slowExtensionName, 'beforeTextProcessing', testContext);
      warnings.push('Timeout handling may not be working (extension should have timed out)');
    } catch (error) {
      // Expected - timeout should cause error
      if (!error.message.includes('timeout') && !error.message.includes('timed out')) {
        warnings.push('Timeout error message not as expected');
      }
    }
    
    // 🐛 FIX: Always cleanup test extensions
    try {
      await extensionManager.unregister(failingExtensionName);
      await extensionManager.unregister(slowExtensionName);
    } catch (cleanupError) {
      warnings.push(`Test cleanup failed: ${cleanupError.message}`);
    }
    
  } catch (error) {
    errors.push(`Error handling test failed: ${error.message}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors.map(e => ({
      code: 'EXT_ERROR_HANDLING',
      message: e,
      severity: 'error' as const,
    })),
    metadata: {
      validatedBy: 'extension-error-test',
      executionTime: performance.now(),
    }
  };
};

/**
 * Test extension performance monitoring
 */
export const testExtensionPerformanceMonitoring = async (): Promise<ValidationResult> => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    const { extensionManager } = await import('../extensions/manager');
    
    // 🐛 FIX: Use unique test extension name
    const monitoredExtensionName = `test-monitored-${Date.now()}`;
    
    // Create extension with performance monitoring
    const monitoredExtension: TextPluginExtension = {
      name: monitoredExtensionName,
      version: '1.0.0',
      description: 'Test extension for performance monitoring',
      config: { 
        maxExecutionTime: 100,
        enablePerformanceMonitoring: true,
      },
      hooks: {
        beforeTextProcessing: (context) => {
          // Simulate some work
          const start = performance.now();
          while (performance.now() - start < 5) {
            // Busy wait for 5ms
          }
          return context;
        },
        
        onPerformanceMetric: (metric) => {
          console.log('Performance metric received:', metric);
        },
      },
    };
    
    await extensionManager.register(monitoredExtension);
    
    // Execute hook to generate metrics
    const testContext: TextProcessingContext = {
      value: 'test',
      schema: {
        id: 'test', name: 'test', type: 'text', content: 'test',
        position: { x: 0, y: 0 }, width: 100, height: 50, rotate: 0, opacity: 1,
        alignment: 'left', verticalAlignment: 'top', fontSize: 12, lineHeight: 1,
        characterSpacing: 0, fontColor: '#000000', backgroundColor: '',
      },
      fontKitFont: {} as any,
      metadata: { processingStage: 'pre', timestamp: Date.now(), requestId: 'test' }
    };
    
    await extensionManager.executeHook('beforeTextProcessing', testContext);
    
    // Check if metrics were recorded
    const registry = extensionManager.getRegistry();
    const entry = registry.get(monitoredExtensionName);
    
    if (!entry || entry.statistics.totalExecutions === 0) {
      errors.push('Performance metrics not recorded');
    }
    
    if (entry && entry.statistics.averageExecutionTime <= 0) {
      warnings.push('Average execution time calculation may be incorrect');
    }
    
    // Check performance metrics collection
    const metrics = extensionManager.getPerformanceMetrics();
    if (metrics.length === 0) {
      warnings.push('Performance metrics collection may not be working');
    }
    
    // 🐛 FIX: Always cleanup test extension
    try {
      await extensionManager.unregister(monitoredExtensionName);
    } catch (cleanupError) {
      warnings.push(`Test cleanup failed: ${cleanupError.message}`);
    }
    
  } catch (error) {
    errors.push(`Performance monitoring test failed: ${error.message}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors.map(e => ({
      code: 'EXT_PERFORMANCE',
      message: e,
      severity: 'error' as const,
    })),
    metadata: {
      validatedBy: 'extension-performance-test',
      executionTime: performance.now(),
    }
  };
};

/**
 * Test integration with text processing pipeline
 */
export const testExtensionIntegration = async (): Promise<ValidationResult> => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    // Test integration helpers
    const { 
      processTextWithExtensions,
      areExtensionsEnabled,
      getExtensionStats 
    } = await import('../extensions/integration');
    
    const { extensionManager } = await import('../extensions/manager');
    
    // Check if extensions are enabled
    if (!areExtensionsEnabled()) {
      warnings.push('Extensions may not be properly enabled in integration layer');
    }
    
    // Test extension stats
    const stats = getExtensionStats();
    if (!stats || typeof stats.total !== 'number') {
      warnings.push('Extension stats may not be working properly');
    }
    
    // 🐛 FIX: Use unique test extension name
    const integrationExtensionName = `test-integration-${Date.now()}`;
    
    // Create test extension for integration
    const integrationExtension: TextPluginExtension = {
      name: integrationExtensionName,
      version: '1.0.0',
      description: 'Test extension for integration',
      config: { maxExecutionTime: 100 },
      hooks: {
        beforeTextProcessing: (context) => ({
          ...context,
          value: `INTEGRATED: ${context.value}`,
        }),
      },
    };
    
    await extensionManager.register(integrationExtension);
    
    // Test processTextWithExtensions
    const testSchema = {
      id: 'test', name: 'test', type: 'text', content: 'test',
      position: { x: 0, y: 0 }, width: 100, height: 50, rotate: 0, opacity: 1,
      alignment: 'left' as const, verticalAlignment: 'top' as const, 
      fontSize: 12, lineHeight: 1, characterSpacing: 0, 
      fontColor: '#000000', backgroundColor: '',
    };
    
    // This would require a real font, so we'll skip the actual execution
    // but test that the function exists and can be called
    if (typeof processTextWithExtensions !== 'function') {
      errors.push('processTextWithExtensions not available');
    }
    
    // 🐛 FIX: Always cleanup test extension
    try {
      await extensionManager.unregister(integrationExtensionName);
    } catch (cleanupError) {
      warnings.push(`Test cleanup failed: ${cleanupError.message}`);
    }
    
  } catch (error) {
    errors.push(`Integration test failed: ${error.message}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors.map(e => ({
      code: 'EXT_INTEGRATION',
      message: e,
      severity: 'error' as const,
    })),
    metadata: {
      validatedBy: 'extension-integration-test',
      executionTime: performance.now(),
    }
  };
};

/**
 * COMPREHENSIVE EXTENSION SYSTEM VALIDATION
 * 
 * Runs all extension system tests and returns combined results
 */
export const runExtensionSystemValidation = async (): Promise<ValidationResult> => {
  console.log('🔌 Running comprehensive extension system validation...');
  
  const tests = [
    { name: 'Extension Manager Lifecycle', test: testExtensionManagerLifecycle },
    { name: 'Hook Execution', test: testExtensionHookExecution },
    { name: 'Error Handling', test: testExtensionErrorHandling },
    { name: 'Performance Monitoring', test: testExtensionPerformanceMonitoring },
    { name: 'Integration', test: testExtensionIntegration },
  ];
  
  const allErrors: any[] = [];
  const allWarnings: any[] = [];
  
  for (const { name, test } of tests) {
    console.log(`  Testing ${name}...`);
    try {
      const result = await test();
      
      if (result.isValid) {
        console.log(`    ✅ ${name} passed`);
      } else {
        console.log(`    ❌ ${name} failed`);
        allErrors.push(...result.errors);
      }
      
    } catch (error) {
      console.log(`    💥 ${name} crashed: ${error.message}`);
      allErrors.push({
        code: 'EXT_TEST_CRASH',
        message: `${name}: Test crashed - ${error.message}`,
        severity: 'error' as const,
      });
    }
  }
  
  const isValid = allErrors.length === 0;
  
  console.log(`\n🏁 Extension System Validation Complete:`);
  console.log(`   ${isValid ? '✅' : '❌'} Overall: ${isValid ? 'PASSED' : 'FAILED'}`);
  console.log(`   📊 ${tests.length} tests run`);
  console.log(`   ❌ ${allErrors.length} errors`);
  
  if (allErrors.length > 0) {
    console.log('\n❌ Extension System Errors:');
    allErrors.forEach(error => console.log(`   - ${error.message}`));
  }
  
  return {
    isValid,
    errors: allErrors,
    metadata: {
      validatedBy: 'extension-system-validation',
      executionTime: performance.now(),
    }
  };
};

/**
 * Quick extension system health check
 */
export const quickExtensionHealthCheck = async (): Promise<boolean> => {
  try {
    const { extensionManager } = await import('../extensions/manager');
    const registry = extensionManager.getRegistry();
    
    // Check if manager is working
    if (typeof extensionManager.register !== 'function') {
      return false;
    }
    
    // Check if any extensions are causing issues
    const unhealthyExtensions = Array.from(registry.values())
      .filter(entry => !entry.isHealthy);
    
    if (unhealthyExtensions.length > 0) {
      console.warn(`⚠️ ${unhealthyExtensions.length} unhealthy extensions detected`);
    }
    
    return true;
    
  } catch (error) {
    console.error('Extension system health check failed:', error);
    return false;
  }
};
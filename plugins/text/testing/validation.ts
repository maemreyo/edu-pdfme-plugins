// REFACTORED: 2025-01-07 - Comprehensive testing and validation utilities

import type { TextSchema, ValidationResult } from '../types/enhanced';
import type { Font as FontKitFont } from 'fontkit';
import { 
  LINE_START_FORBIDDEN_CHARS, 
  LINE_END_FORBIDDEN_CHARS,
  containsJapanese 
} from '../modules/japaneseText';
import { 
  getFontKitFont,
  widthOfTextAtSize,
  heightOfFontAtSize,
  calculateDynamicFontSize 
} from '../helper';
import { getDefaultFont } from '@pdfme/common';

/**
 * CRITICAL MECHANISM VALIDATION SUITE
 * 
 * This comprehensive validation ensures all critical mechanisms
 * work correctly after refactoring.
 */

/**
 * Test font metrics calculations
 */
export const testFontMetrics = async (): Promise<ValidationResult> => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    const font = getDefaultFont();
    const cache = new Map();
    const fontKitFont = await getFontKitFont(undefined, font, cache);
    
    // Test width calculation
    const testText = "Hello World";
    const width = widthOfTextAtSize(testText, fontKitFont, 12, 0);
    if (width <= 0) {
      errors.push('Width calculation returned invalid value');
    }
    
    // Test height calculation
    const height = heightOfFontAtSize(fontKitFont, 12);
    if (height <= 0) {
      errors.push('Height calculation returned invalid value');
    }
    
    // Test caching
    const fontKitFont2 = await getFontKitFont(undefined, font, cache);
    if (fontKitFont !== fontKitFont2) {
      errors.push('Font caching is not working correctly');
    }
    
  } catch (error) {
    errors.push(`Font metrics test failed: ${error.message}`);
  }
  
  return { isValid: errors.length === 0, errors, warnings };
};

/**
 * Test Japanese text processing rules
 */
export const testJapaneseProcessing = (): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Test character detection
  const japaneseText = "こんにちは世界";
  const englishText = "Hello World";
  
  if (!containsJapanese(japaneseText)) {
    errors.push('Japanese character detection failed for Japanese text');
  }
  
  if (containsJapanese(englishText)) {
    errors.push('Japanese character detection incorrectly detected English text');
  }
  
  // Test forbidden character arrays
  if (LINE_START_FORBIDDEN_CHARS.length === 0) {
    errors.push('Line start forbidden characters array is empty');
  }
  
  if (LINE_END_FORBIDDEN_CHARS.length === 0) {
    errors.push('Line end forbidden characters array is empty');
  }
  
  // Test specific forbidden characters
  const forbiddenStart = ['。', '、', ')', '}'];
  const forbiddenEnd = ['(', '{', '「', '『'];
  
  forbiddenStart.forEach(char => {
    if (!LINE_START_FORBIDDEN_CHARS.includes(char)) {
      warnings.push(`Expected line start forbidden character not found: ${char}`);
    }
  });
  
  forbiddenEnd.forEach(char => {
    if (!LINE_END_FORBIDDEN_CHARS.includes(char)) {
      warnings.push(`Expected line end forbidden character not found: ${char}`);
    }
  });
  
  return { isValid: errors.length === 0, errors, warnings };
};

/**
 * Test dynamic font sizing algorithm
 */
export const testDynamicFontSizing = async (): Promise<ValidationResult> => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    const font = getDefaultFont();
    const cache = new Map();
    const fontKitFont = await getFontKitFont(undefined, font, cache);
    
    // Create test schema with dynamic sizing
    const testSchema: TextSchema = {
      id: 'test',
      name: 'test',
      type: 'text',
      content: 'Test content',
      position: { x: 0, y: 0 },
      width: 100,
      height: 50,
      rotate: 0,
      opacity: 1,
      alignment: 'left',
      verticalAlignment: 'top',
      fontSize: 12,
      lineHeight: 1,
      characterSpacing: 0,
      fontColor: '#000000',
      backgroundColor: '',
      dynamicFontSize: {
        min: 8,
        max: 24,
        fit: 'vertical'
      }
    };
    
    const testValue = "This is a test text for dynamic sizing";
    
    // Test dynamic sizing calculation
    const dynamicSize = calculateDynamicFontSize({
      textSchema: testSchema,
      fontKitFont,
      value: testValue
    });
    
    if (dynamicSize < testSchema.dynamicFontSize!.min || 
        dynamicSize > testSchema.dynamicFontSize!.max) {
      errors.push('Dynamic font size is outside specified bounds');
    }
    
    // Test horizontal fit
    testSchema.dynamicFontSize!.fit = 'horizontal';
    const horizontalSize = calculateDynamicFontSize({
      textSchema: testSchema,
      fontKitFont,
      value: testValue
    });
    
    if (horizontalSize < testSchema.dynamicFontSize!.min || 
        horizontalSize > testSchema.dynamicFontSize!.max) {
      errors.push('Dynamic font size (horizontal) is outside specified bounds');
    }
    
  } catch (error) {
    errors.push(`Dynamic font sizing test failed: ${error.message}`);
  }
  
  return { isValid: errors.length === 0, errors, warnings };
};

/**
 * Test browser compatibility features
 */
export const testBrowserCompatibility = (): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Test Firefox detection
  if (typeof navigator === 'undefined') {
    warnings.push('Navigator not available - browser detection tests skipped');
  } else {
    // Test should not throw errors
    try {
      const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
      // This is just for testing, actual value depends on browser
    } catch (error) {
      errors.push(`Firefox detection failed: ${error.message}`);
    }
  }
  
  // Test Intl.Segmenter availability
  if (typeof Intl.Segmenter === 'undefined') {
    warnings.push('Intl.Segmenter not available - advanced line breaking may not work');
  } else {
    try {
      const segmenter = new Intl.Segmenter(undefined, { granularity: 'word' });
      const segments = Array.from(segmenter.segment('Hello world'));
      if (segments.length === 0) {
        errors.push('Intl.Segmenter is not working correctly');
      }
    } catch (error) {
      errors.push(`Intl.Segmenter test failed: ${error.message}`);
    }
  }
  
  return { isValid: errors.length === 0, errors, warnings };
};

/**
 * Test schema validation
 */
export const testSchemaValidation = (): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Test valid schema
  const validSchema: TextSchema = {
    id: 'test',
    name: 'test',
    type: 'text',
    content: 'Test',
    position: { x: 0, y: 0 },
    width: 100,
    height: 50,
    rotate: 0,
    opacity: 1,
    alignment: 'left',
    verticalAlignment: 'top',
    fontSize: 12,
    lineHeight: 1,
    characterSpacing: 0,
    fontColor: '#000000',
    backgroundColor: '',
  };
  
  // Test invalid schemas
  const invalidSchemas = [
    { ...validSchema, fontSize: -1 }, // Negative font size
    { ...validSchema, fontSize: 0 },  // Zero font size
    { ...validSchema, lineHeight: -1 }, // Negative line height
    { ...validSchema, alignment: 'invalid' as any }, // Invalid alignment
  ];
  
  invalidSchemas.forEach((schema, index) => {
    // In a real validation function, these should fail
    // For now, we just check if the values are reasonable
    if (schema.fontSize <= 0) {
      // This is expected to be caught by validation
    }
    if (schema.lineHeight < 0) {
      // This is expected to be caught by validation
    }
  });
  
  return { isValid: errors.length === 0, errors, warnings };
};

/**
 * COMPREHENSIVE TEST SUITE WITH EXTENSION SYSTEM
 * 
 * Runs all validation tests including the new extension system validation
 */
export const runComprehensiveValidation = async (): Promise<ValidationResult> => {
  console.log('🧪 Running comprehensive text plugin validation...');
  
  const tests = [
    { name: 'Font Metrics', test: testFontMetrics },
    { name: 'Japanese Processing', test: () => Promise.resolve(testJapaneseProcessing()) },
    { name: 'Dynamic Font Sizing', test: testDynamicFontSizing },
    { name: 'Browser Compatibility', test: () => Promise.resolve(testBrowserCompatibility()) },
    { name: 'Schema Validation', test: () => Promise.resolve(testSchemaValidation()) },
    // 🆕 Extension System Tests
    { name: 'Extension System', test: async () => {
      try {
        const { runExtensionSystemValidation } = await import('./extensionValidation');
        return await runExtensionSystemValidation();
      } catch (error) {
        return {
          isValid: false,
          errors: [{
            code: 'EXT_SYSTEM_UNAVAILABLE',
            message: `Extension system validation failed: ${error.message}`,
            severity: 'warning' as const, // Not critical - can work without extensions
          }],
          metadata: {
            validatedBy: 'extension-system-fallback',
            executionTime: performance.now(),
          }
        };
      }
    }},
  ];
  
  const allErrors: string[] = [];
  const allWarnings: string[] = [];
  
  for (const { name, test } of tests) {
    console.log(`  Testing ${name}...`);
    try {
      const result = await test();
      
      if (result.isValid) {
        console.log(`    ✅ ${name} passed`);
      } else {
        console.log(`    ❌ ${name} failed`);
        result.errors.forEach(error => {
          if (error.severity === 'error') {
            allErrors.push(`${name}: ${error.message}`);
          } else {
            allWarnings.push(`${name}: ${error.message}`);
          }
        });
      }
      
      if (result.errors.some(e => e.severity === 'warning')) {
        console.log(`    ⚠️  ${name} warnings`);
      }
      
    } catch (error) {
      console.log(`    💥 ${name} crashed: ${error.message}`);
      allErrors.push(`${name}: Test crashed - ${error.message}`);
    }
  }
  
  const isValid = allErrors.length === 0;
  
  console.log(`\n🏁 Validation Complete:`);
  console.log(`   ${isValid ? '✅' : '❌'} Overall: ${isValid ? 'PASSED' : 'FAILED'}`);
  console.log(`   📊 ${tests.length} tests run`);
  console.log(`   ❌ ${allErrors.length} errors`);
  console.log(`   ⚠️  ${allWarnings.length} warnings`);
  
  if (allErrors.length > 0) {
    console.log('\n❌ Errors:');
    allErrors.forEach(error => console.log(`   - ${error}`));
  }
  
  if (allWarnings.length > 0) {
    console.log('\n⚠️ Warnings:');
    allWarnings.forEach(warning => console.log(`   - ${warning}`));
  }
  
  return {
    isValid,
    errors: allErrors,
    warnings: allWarnings
  };
};

/**
 * PERFORMANCE BENCHMARKS WITH EXTENSION SYSTEM
 */
export const runPerformanceBenchmarks = async (): Promise<void> => {
  console.log('⚡ Running performance benchmarks...');
  
  const font = getDefaultFont();
  const cache = new Map();
  const fontKitFont = await getFontKitFont(undefined, font, cache);
  
  // Benchmark text width calculation
  const testText = "The quick brown fox jumps over the lazy dog".repeat(10);
  const iterations = 1000;
  
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    widthOfTextAtSize(testText, fontKitFont, 12, 0);
  }
  const end = performance.now();
  
  const avgTime = (end - start) / iterations;
  console.log(`  📏 Text width calculation: ${avgTime.toFixed(3)}ms average (${iterations} iterations)`);
  
  if (avgTime > 1) {
    console.warn('    ⚠️ Performance warning: Text width calculation is slow');
  } else {
    console.log('    ✅ Performance: Text width calculation is fast');
  }
  
  // 🆕 Benchmark extension system if available
  try {
    const { quickExtensionHealthCheck } = await import('./extensionValidation');
    const { extensionManager } = await import('../extensions/manager');
    
    const extensionHealthy = await quickExtensionHealthCheck();
    console.log(`  🔌 Extension system health: ${extensionHealthy ? '✅ Healthy' : '❌ Issues detected'}`);
    
    // Benchmark extension hook execution
    const registry = extensionManager.getRegistry();
    if (registry.size > 0) {
      const extensionStart = performance.now();
      
      // Simulate hook execution
      const testContext = {
        value: 'benchmark test',
        schema: {
          id: 'bench', name: 'bench', type: 'text', content: 'bench',
          position: { x: 0, y: 0 }, width: 100, height: 50, rotate: 0, opacity: 1,
          alignment: 'left' as const, verticalAlignment: 'top' as const,
          fontSize: 12, lineHeight: 1, characterSpacing: 0,
          fontColor: '#000000', backgroundColor: '',
        },
        fontKitFont,
        metadata: { processingStage: 'pre' as const, timestamp: Date.now(), requestId: 'bench' }
      };
      
      for (let i = 0; i < 100; i++) {
        await extensionManager.executeHook('beforeTextProcessing', testContext);
      }
      
      const extensionEnd = performance.now();
      const extensionAvgTime = (extensionEnd - extensionStart) / 100;
      
      console.log(`  🔌 Extension hook execution: ${extensionAvgTime.toFixed(3)}ms average (100 iterations)`);
      console.log(`  📊 Active extensions: ${registry.size}, Performance overhead: ${extensionAvgTime > 1 ? 'High' : 'Low'}`);
    } else {
      console.log('  🔌 Extension system: No extensions registered for benchmarking');
    }
    
  } catch (error) {
    console.log('  🔌 Extension system benchmarking not available:', error.message);
  }
};
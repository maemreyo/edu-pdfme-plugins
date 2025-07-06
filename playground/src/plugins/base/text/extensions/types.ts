// CREATED: 2025-01-07 - Plugin Extension System Core Types

import type { TextSchema } from '../types/enhanced';
import type { Font as FontKitFont } from 'fontkit';
import type { PDFPage, PDFDocument } from '@pdfme/pdf-lib';

/**
 * PLUGIN EXTENSION SYSTEM - CORE TYPES
 * 
 * This system allows advanced plugins to extend text functionality
 * while maintaining core stability and performance.
 */

// === EXTENSION CONTEXTS ===

/**
 * Context passed to text processing hooks
 */
export interface TextProcessingContext {
  value: string;
  schema: TextSchema;
  fontKitFont: FontKitFont;
  metadata: {
    processingStage: 'pre' | 'post' | 'validation';
    timestamp: number;
    requestId: string;
  };
}

/**
 * Context for UI rendering hooks
 */
export interface UIRenderContext {
  element: HTMLElement;
  schema: TextSchema;
  mode: 'designer' | 'form' | 'viewer';
  value: string;
  fontKitFont: FontKitFont;
  metadata: {
    renderStage: 'pre' | 'post' | 'event-setup';
    timestamp: number;
  };
}

/**
 * Context for PDF rendering hooks
 */
export interface PDFRenderContext {
  page: PDFPage;
  pdfDoc: PDFDocument;
  schema: TextSchema;
  value: string;
  fontKitFont: FontKitFont;
  renderParams: {
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize: number;
    color: any;
  };
  metadata: {
    renderStage: 'pre' | 'post' | 'line-render';
    timestamp: number;
  };
}

/**
 * Context for schema update hooks
 */
export interface SchemaUpdateContext {
  oldSchema: TextSchema;
  newSchema: TextSchema;
  changeSet: Array<{
    field: keyof TextSchema;
    oldValue: any;
    newValue: any;
  }>;
  metadata: {
    source: 'user' | 'system' | 'extension';
    timestamp: number;
  };
}

/**
 * Context for validation hooks
 */
export interface ValidationContext {
  schema: TextSchema;
  value?: string;
  environment: {
    platform: 'web' | 'node' | 'mobile';
    capabilities: string[];
  };
  metadata: {
    validationLevel: 'basic' | 'strict' | 'accessibility';
    timestamp: number;
  };
}

// === EXTENSION RESULTS ===

/**
 * Result from text processing extensions
 */
export interface TextProcessingResult {
  value: string;
  schema: TextSchema;
  modifications: Array<{
    type: 'text-transform' | 'schema-update' | 'metadata-add';
    description: string;
    data?: any;
  }>;
  performance: {
    executionTime: number;
    memoryUsed?: number;
  };
}

/**
 * Result from UI rendering extensions
 */
export interface UIRenderResult {
  element: HTMLElement;
  additionalElements?: HTMLElement[];
  eventHandlers: Array<{
    event: string;
    handler: EventListener;
    element: HTMLElement;
  }>;
  cleanup?: () => void;
}

/**
 * Result from PDF rendering extensions
 */
export interface PDFRenderResult {
  additionalOperations: Array<{
    type: 'draw-shape' | 'add-annotation' | 'set-metadata';
    operation: () => void;
    description: string;
  }>;
  modifiedParams?: Partial<PDFRenderContext['renderParams']>;
}

/**
 * Result from validation extensions
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    code: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
    field?: keyof TextSchema;
    suggestion?: string;
  }>;
  metadata: {
    validatedBy: string;
    executionTime: number;
  };
}

// === EXTENSION HOOKS DEFINITION ===

/**
 * All available hooks for text plugin extensions
 */
export interface TextPluginHooks {
  // Text Processing Hooks
  beforeTextProcessing?: (context: TextProcessingContext) => Promise<TextProcessingContext> | TextProcessingContext;
  afterTextProcessing?: (context: TextProcessingContext, result: TextProcessingResult) => Promise<TextProcessingResult> | TextProcessingResult;
  
  // UI Rendering Hooks
  beforeUIRender?: (context: UIRenderContext) => Promise<UIRenderContext> | UIRenderContext;
  afterUIRender?: (context: UIRenderContext, result: UIRenderResult) => Promise<UIRenderResult> | UIRenderResult;
  onUIEvent?: (event: Event, context: UIRenderContext) => Promise<boolean> | boolean; // return false to prevent default
  
  // PDF Rendering Hooks
  beforePDFRender?: (context: PDFRenderContext) => Promise<PDFRenderContext> | PDFRenderContext;
  afterPDFRender?: (context: PDFRenderContext, result: PDFRenderResult) => Promise<PDFRenderResult> | PDFRenderResult;
  
  // Schema Management Hooks
  beforeSchemaUpdate?: (context: SchemaUpdateContext) => Promise<SchemaUpdateContext> | SchemaUpdateContext;
  afterSchemaUpdate?: (context: SchemaUpdateContext) => Promise<void> | void;
  
  // Validation Hooks
  validate?: (context: ValidationContext) => Promise<ValidationResult> | ValidationResult;
  
  // Performance Hooks
  onPerformanceMetric?: (metric: PerformanceMetric) => Promise<void> | void;
}

// === EXTENSION DEFINITION ===

/**
 * Performance metric for monitoring extensions
 */
export interface PerformanceMetric {
  extensionName: string;
  hookName: string;
  executionTime: number;
  memoryUsage?: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Extension configuration and capabilities
 */
export interface ExtensionConfig {
  // Performance limits
  maxExecutionTime?: number; // ms
  maxMemoryUsage?: number;   // MB
  
  // Feature flags
  enableAsyncExecution?: boolean;
  enablePerformanceMonitoring?: boolean;
  enableErrorRecovery?: boolean;
  
  // Dependencies
  requiredCapabilities?: string[];
  conflictsWith?: string[];
  
  // Environment
  environments?: Array<'web' | 'node' | 'mobile'>;
  
  // Debug
  debugMode?: boolean;
}

/**
 * Main text plugin extension interface
 */
export interface TextPluginExtension {
  // Metadata
  readonly name: string;
  readonly version: string;
  readonly description?: string;
  readonly author?: string;
  readonly license?: string;
  
  // Configuration
  config: ExtensionConfig;
  
  // Hooks implementation
  hooks: TextPluginHooks;
  
  // Dependencies
  dependencies?: string[];
  peerDependencies?: string[];
  
  // Lifecycle methods
  onInstall?: () => Promise<void> | void;
  onUninstall?: () => Promise<void> | void;
  onEnable?: () => Promise<void> | void;
  onDisable?: () => Promise<void> | void;
  
  // Health check
  healthCheck?: () => Promise<boolean> | boolean;
}

// === EXTENSION MANAGER TYPES ===

/**
 * Extension execution context with safety measures
 */
export interface ExtensionExecutionContext {
  extension: TextPluginExtension;
  startTime: number;
  timeoutId?: number;
  abortController?: AbortController;
  memoryBaseline?: number;
}

/**
 * Extension registry entry
 */
export interface ExtensionRegistryEntry {
  extension: TextPluginExtension;
  isEnabled: boolean;
  isHealthy: boolean;
  statistics: {
    totalExecutions: number;
    totalExecutionTime: number;
    errorCount: number;
    lastExecution?: number;
    averageExecutionTime: number;
  };
  metadata: {
    registeredAt: number;
    lastHealthCheck?: number;
  };
}

/**
 * Extension manager configuration
 */
export interface ExtensionManagerConfig {
  // Global performance limits
  globalMaxExecutionTime: number;
  globalMaxMemoryUsage: number;
  
  // Health monitoring
  healthCheckInterval: number;
  autoDisableUnhealthy: boolean;
  
  // Error handling
  maxErrorsBeforeDisable: number;
  errorRecoveryEnabled: boolean;
  
  // Performance monitoring
  performanceMonitoringEnabled: boolean;
  performanceReportInterval: number;
  
  // Debug
  debugMode: boolean;
  logLevel: 'none' | 'error' | 'warn' | 'info' | 'debug';
}

// === ERROR TYPES ===

/**
 * Extension-specific error types
 */
export class ExtensionError extends Error {
  constructor(
    public extensionName: string,
    public hookName: string,
    message: string,
    public originalError?: Error
  ) {
    super(`[${extensionName}:${hookName}] ${message}`);
    this.name = 'ExtensionError';
  }
}

export class ExtensionTimeoutError extends ExtensionError {
  constructor(extensionName: string, hookName: string, timeoutMs: number) {
    super(extensionName, hookName, `Execution timed out after ${timeoutMs}ms`);
    this.name = 'ExtensionTimeoutError';
  }
}

export class ExtensionValidationError extends ExtensionError {
  constructor(extensionName: string, validationErrors: string[]) {
    super(extensionName, 'validation', `Validation failed: ${validationErrors.join(', ')}`);
    this.name = 'ExtensionValidationError';
  }
}

// === UTILITY TYPES ===

/**
 * Type helper for hook function extraction
 */
export type HookFunction<K extends keyof TextPluginHooks> = NonNullable<TextPluginHooks[K]>;

/**
 * Type helper for hook context extraction
 */
export type HookContext<K extends keyof TextPluginHooks> = 
  K extends 'beforeTextProcessing' | 'afterTextProcessing' ? TextProcessingContext :
  K extends 'beforeUIRender' | 'afterUIRender' | 'onUIEvent' ? UIRenderContext :
  K extends 'beforePDFRender' | 'afterPDFRender' ? PDFRenderContext :
  K extends 'beforeSchemaUpdate' | 'afterSchemaUpdate' ? SchemaUpdateContext :
  K extends 'validate' ? ValidationContext :
  K extends 'onPerformanceMetric' ? PerformanceMetric :
  never;

/**
 * Type helper for hook result extraction
 */
export type HookResult<K extends keyof TextPluginHooks> = 
  K extends 'beforeTextProcessing' | 'afterTextProcessing' ? TextProcessingResult :
  K extends 'beforeUIRender' | 'afterUIRender' ? UIRenderResult :
  K extends 'beforePDFRender' | 'afterPDFRender' ? PDFRenderResult :
  K extends 'validate' ? ValidationResult :
  K extends 'onUIEvent' ? boolean :
  void;

// === FEATURE FLAGS ===

/**
 * Feature flags for extension system
 */
export interface ExtensionSystemFeatures {
  asyncHookExecution: boolean;
  performanceMonitoring: boolean;
  errorRecovery: boolean;
  memoryMonitoring: boolean;
  extensionSandboxing: boolean;
  hotReloading: boolean;
  dependencyResolution: boolean;
}

export const DEFAULT_EXTENSION_FEATURES: ExtensionSystemFeatures = {
  asyncHookExecution: true,
  performanceMonitoring: true,
  errorRecovery: true,
  memoryMonitoring: false, // Requires advanced browser APIs
  extensionSandboxing: false, // Future feature
  hotReloading: false, // Development feature
  dependencyResolution: true,
};
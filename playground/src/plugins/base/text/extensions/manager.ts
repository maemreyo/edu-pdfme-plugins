// plugins/text/extensions/manager.ts
// CREATED: 2025-01-07 - Plugin Extension Manager with Safe Execution

import {
  TextPluginExtension,
  TextPluginHooks,
  ExtensionRegistryEntry,
  ExtensionManagerConfig,
  ExtensionExecutionContext,
  PerformanceMetric,
  ExtensionError,
  ExtensionTimeoutError,
  ExtensionValidationError,
  ExtensionSystemFeatures,
  DEFAULT_EXTENSION_FEATURES,
  HookContext,
  HookResult,
} from './types';

/**
 * PLUGIN EXTENSION MANAGER
 * 
 * Core manager for text plugin extensions with:
 * - Safe execution with timeouts and error isolation
 * - Performance monitoring and health checks
 * - Dependency resolution and conflict detection
 * - Comprehensive error handling and recovery
 */
export class TextPluginExtensionManager {
  private static instance: TextPluginExtensionManager;
  
  private registry = new Map<string, ExtensionRegistryEntry>();
  private executionQueue = new Map<string, Promise<any>>();
  private performanceMetrics: PerformanceMetric[] = [];
  private healthCheckInterval?: number;
  
  private config: ExtensionManagerConfig = {
    globalMaxExecutionTime: 100, // 100ms max per hook
    globalMaxMemoryUsage: 50,    // 50MB max
    healthCheckInterval: 30000,  // 30 seconds
    autoDisableUnhealthy: true,
    maxErrorsBeforeDisable: 3,
    errorRecoveryEnabled: true,
    performanceMonitoringEnabled: true,
    performanceReportInterval: 60000, // 1 minute
    debugMode: false,
    logLevel: 'warn',
  };
  
  private features: ExtensionSystemFeatures = { ...DEFAULT_EXTENSION_FEATURES };
  
  private constructor() {
    this.setupHealthMonitoring();
    this.setupPerformanceReporting();
  }
  
  /**
   * Singleton pattern for global extension management
   */
  public static getInstance(): TextPluginExtensionManager {
    if (!this.instance) {
      this.instance = new TextPluginExtensionManager();
    }
    return this.instance;
  }
  
  // === CONFIGURATION ===
  
  /**
   * Update manager configuration
   */
  public configure(config: Partial<ExtensionManagerConfig>): void {
    this.config = { ...this.config, ...config };
    this.log('info', 'Extension manager configured', config);
  }
  
  /**
   * Enable/disable features
   */
  public setFeatures(features: Partial<ExtensionSystemFeatures>): void {
    this.features = { ...this.features, ...features };
    this.log('info', 'Extension features updated', features);
  }
  
  // === EXTENSION REGISTRATION ===
  
  /**
   * Register a new extension with validation
   */
  public async register(extension: TextPluginExtension): Promise<void> {
    try {
      // Validate extension
      this.validateExtension(extension);
      
      // 🐛 FIX: Handle re-registration gracefully
      if (this.registry.has(extension.name)) {
        this.log('warn', `Extension ${extension.name} is already registered, re-registering...`);
        // Unregister existing first
        await this.unregister(extension.name);
      }
      
      // Check for conflicts
      this.checkConflicts(extension);
      
      // Resolve dependencies
      if (this.features.dependencyResolution) {
        await this.resolveDependencies(extension);
      }
      
      // Create registry entry
      const entry: ExtensionRegistryEntry = {
        extension,
        isEnabled: true,
        isHealthy: true,
        statistics: {
          totalExecutions: 0,
          totalExecutionTime: 0,
          errorCount: 0,
          averageExecutionTime: 0,
        },
        metadata: {
          registeredAt: Date.now(),
        },
      };
      
      // Call install hook
      if (extension.onInstall) {
        await this.safeExecute(
          extension,
          'onInstall',
          () => extension.onInstall!(),
          {}
        );
      }
      
      // Register extension
      this.registry.set(extension.name, entry);
      
      this.log('info', `Extension registered: ${extension.name} v${extension.version}`);
      
    } catch (error) {
      this.log('error', `Failed to register extension ${extension.name}`, error);
      throw error;
    }
  }
  
  /**
   * Unregister extension
   */
  public async unregister(extensionName: string): Promise<void> {
    const entry = this.registry.get(extensionName);
    if (!entry) {
      this.log('warn', `Extension not found for unregistration: ${extensionName}`);
      return; // 🐛 FIX: Don't throw error, just warn and return
    }
    
    try {
      // Call uninstall hook
      if (entry.extension.onUninstall) {
        await this.safeExecute(
          entry.extension,
          'onUninstall',
          () => entry.extension.onUninstall!(),
          {}
        );
      }
      
      // Remove from registry
      this.registry.delete(extensionName);
      
      this.log('info', `Extension unregistered: ${extensionName}`);
      
    } catch (error) {
      this.log('error', `Failed to unregister extension ${extensionName}`, error);
      // 🐛 FIX: Still remove from registry even if uninstall hook fails
      this.registry.delete(extensionName);
      throw error;
    }
  }
  
  /**
   * Enable extension
   */
  public async enable(extensionName: string): Promise<void> {
    const entry = this.registry.get(extensionName);
    if (!entry) {
      throw new Error(`Extension not found: ${extensionName}`);
    }
    
    if (entry.extension.onEnable) {
      await this.safeExecute(
        entry.extension,
        'onEnable',
        () => entry.extension.onEnable!(),
        {}
      );
    }
    
    entry.isEnabled = true;
    this.log('info', `Extension enabled: ${extensionName}`);
  }
  
  /**
   * Disable extension
   */
  public async disable(extensionName: string): Promise<void> {
    const entry = this.registry.get(extensionName);
    if (!entry) {
      throw new Error(`Extension not found: ${extensionName}`);
    }
    
    if (entry.extension.onDisable) {
      await this.safeExecute(
        entry.extension,
        'onDisable',
        () => entry.extension.onDisable!(),
        {}
      );
    }
    
    entry.isEnabled = false;
    this.log('info', `Extension disabled: ${extensionName}`);
  }
  
  // === HOOK EXECUTION ===
  
  /**
   * Execute hook across all enabled extensions
   */
  public async executeHook<K extends keyof TextPluginHooks>(
    hookName: K,
    context: HookContext<K>
  ): Promise<HookContext<K>> {
    const enabledExtensions = Array.from(this.registry.values())
      .filter(entry => entry.isEnabled && entry.isHealthy)
      .map(entry => entry.extension)
      .filter(ext => ext.hooks[hookName]);
    
    if (enabledExtensions.length === 0) {
      return context;
    }
    
    this.log('debug', `Executing hook ${hookName} for ${enabledExtensions.length} extensions`);
    
    let currentContext = context;
    
    for (const extension of enabledExtensions) {
      try {
        const hookFn = extension.hooks[hookName];
        if (hookFn) {
          const result = await this.safeExecute(
            extension,
            hookName,
            () => hookFn(currentContext as any),
            currentContext
          );
          
          // Update context with result (if hook returns modified context)
          if (result && typeof result === 'object' && result !== currentContext) {
            currentContext = result as HookContext<K>;
          }
        }
      } catch (error) {
        this.handleExtensionError(extension, hookName, error);
        
        // Continue with other extensions if error recovery is enabled
        if (!this.config.errorRecoveryEnabled) {
          throw error;
        }
      }
    }
    
    return currentContext;
  }
  
  /**
   * Execute hook for specific extension
   */
  public async executeExtensionHook<K extends keyof TextPluginHooks>(
    extensionName: string,
    hookName: K,
    context: HookContext<K>
  ): Promise<HookResult<K> | null> {
    const entry = this.registry.get(extensionName);
    
    if (!entry || !entry.isEnabled || !entry.isHealthy) {
      return null;
    }
    
    const hookFn = entry.extension.hooks[hookName];
    if (!hookFn) {
      return null;
    }
    
    try {
      return await this.safeExecute(
        entry.extension,
        hookName,
        () => hookFn(context as any),
        context
      );
    } catch (error) {
      this.handleExtensionError(entry.extension, hookName, error);
      return null;
    }
  }
  
  // === SAFE EXECUTION ===
  
  /**
   * Execute extension code with safety measures
   */
  private async safeExecute<T>(
    extension: TextPluginExtension,
    hookName: string,
    execution: () => Promise<T> | T,
    context: any
  ): Promise<T> {
    const startTime = performance.now();
    const entry = this.registry.get(extension.name);
    
    if (!entry) {
      throw new Error(`Extension not registered: ${extension.name}`);
    }
    
    // Setup execution context
    const executionContext: ExtensionExecutionContext = {
      extension,
      startTime,
    };
    
    // Setup timeout
    const maxTime = extension.config.maxExecutionTime || this.config.globalMaxExecutionTime;
    
    if (this.features.asyncHookExecution) {
      executionContext.abortController = new AbortController();
      executionContext.timeoutId = window.setTimeout(() => {
        executionContext.abortController?.abort();
      }, maxTime);
    }
    
    try {
      // Execute with timeout
      const result = await Promise.race([
        Promise.resolve(execution()),
        new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new ExtensionTimeoutError(extension.name, hookName, maxTime));
          }, maxTime);
        })
      ]);
      
      // Record successful execution
      const executionTime = performance.now() - startTime;
      this.recordExecution(extension.name, hookName, executionTime, true);
      
      return result;
      
    } catch (error) {
      const executionTime = performance.now() - startTime;
      this.recordExecution(extension.name, hookName, executionTime, false);
      
      if (error instanceof ExtensionTimeoutError) {
        this.log('error', `Extension ${extension.name} timed out in ${hookName}`);
      }
      
      throw error;
      
    } finally {
      // Cleanup
      if (executionContext.timeoutId) {
        clearTimeout(executionContext.timeoutId);
      }
    }
  }
  
  // === ERROR HANDLING ===
  
  /**
   * Handle extension errors with recovery
   */
  private handleExtensionError(
    extension: TextPluginExtension,
    hookName: string,
    error: any
  ): void {
    const entry = this.registry.get(extension.name);
    if (!entry) return;
    
    entry.statistics.errorCount++;
    
    this.log('error', 
      `Extension ${extension.name} failed in ${hookName}:`, 
      error
    );
    
    // Auto-disable if too many errors
    if (entry.statistics.errorCount >= this.config.maxErrorsBeforeDisable) {
      entry.isEnabled = false;
      this.log('warn', 
        `Extension ${extension.name} disabled due to ${entry.statistics.errorCount} errors`
      );
    }
  }
  
  // === VALIDATION ===
  
  /**
   * Validate extension before registration
   */
  private validateExtension(extension: TextPluginExtension): void {
    const errors: string[] = [];
    
    if (!extension.name || typeof extension.name !== 'string') {
      errors.push('Extension name is required and must be a string');
    }
    
    if (!extension.version || typeof extension.version !== 'string') {
      errors.push('Extension version is required and must be a string');
    }
    
    if (!extension.hooks || typeof extension.hooks !== 'object') {
      errors.push('Extension hooks are required and must be an object');
    }
    
    if (!extension.config || typeof extension.config !== 'object') {
      errors.push('Extension config is required and must be an object');
    }
    
    // 🐛 FIX: Don't check for existing extension here, allow re-registration
    // This will be handled in the register method
    
    if (errors.length > 0) {
      throw new ExtensionValidationError(extension.name, errors);
    }
  }
  
  /**
   * Check for extension conflicts
   */
  private checkConflicts(extension: TextPluginExtension): void {
    const conflicts = extension.config.conflictsWith || [];
    
    for (const conflictName of conflicts) {
      if (this.registry.has(conflictName)) {
        throw new Error(
          `Extension ${extension.name} conflicts with ${conflictName}`
        );
      }
    }
  }
  
  /**
   * Resolve extension dependencies
   */
  private async resolveDependencies(extension: TextPluginExtension): Promise<void> {
    const dependencies = extension.dependencies || [];
    
    for (const depName of dependencies) {
      if (!this.registry.has(depName)) {
        throw new Error(
          `Extension ${extension.name} requires dependency ${depName}`
        );
      }
    }
  }
  
  // === MONITORING ===
  
  /**
   * Record execution metrics
   */
  private recordExecution(
    extensionName: string,
    hookName: string,
    executionTime: number,
    success: boolean
  ): void {
    const entry = this.registry.get(extensionName);
    if (!entry) return;
    
    // Update statistics
    entry.statistics.totalExecutions++;
    entry.statistics.totalExecutionTime += executionTime;
    entry.statistics.lastExecution = Date.now();
    entry.statistics.averageExecutionTime = 
      entry.statistics.totalExecutionTime / entry.statistics.totalExecutions;
    
    // Record performance metric
    if (this.config.performanceMonitoringEnabled) {
      const metric: PerformanceMetric = {
        extensionName,
        hookName,
        executionTime,
        timestamp: Date.now(),
      };
      
      this.performanceMetrics.push(metric);
      
      // Trigger performance hook
      this.executePerformanceHook(metric);
    }
  }
  
  /**
   * Execute performance monitoring hooks
   */
  private async executePerformanceHook(metric: PerformanceMetric): Promise<void> {
    for (const entry of this.registry.values()) {
      if (entry.isEnabled && entry.extension.hooks.onPerformanceMetric) {
        try {
          await entry.extension.hooks.onPerformanceMetric(metric);
        } catch (error) {
          this.log('error', 'Performance hook failed', error);
        }
      }
    }
  }
  
  /**
   * Setup health monitoring
   */
  private setupHealthMonitoring(): void {
    if (this.config.healthCheckInterval > 0) {
      this.healthCheckInterval = window.setInterval(
        () => this.performHealthCheck(),
        this.config.healthCheckInterval
      );
    }
  }
  
  /**
   * Perform health check on all extensions
   */
  private async performHealthCheck(): Promise<void> {
    for (const [name, entry] of this.registry.entries()) {
      try {
        if (entry.extension.healthCheck) {
          const isHealthy = await entry.extension.healthCheck();
          
          if (!isHealthy && this.config.autoDisableUnhealthy) {
            entry.isEnabled = false;
            this.log('warn', `Extension ${name} disabled due to health check failure`);
          }
          
          entry.isHealthy = isHealthy;
        }
        
        entry.metadata.lastHealthCheck = Date.now();
        
      } catch (error) {
        entry.isHealthy = false;
        this.log('error', `Health check failed for ${name}`, error);
      }
    }
  }
  
  /**
   * Setup performance reporting
   */
  private setupPerformanceReporting(): void {
    if (this.config.performanceReportInterval > 0) {
      setInterval(() => {
        this.generatePerformanceReport();
      }, this.config.performanceReportInterval);
    }
  }
  
  /**
   * Generate performance report
   */
  private generatePerformanceReport(): void {
    if (!this.config.performanceMonitoringEnabled) return;
    
    const report = {
      timestamp: Date.now(),
      totalExtensions: this.registry.size,
      enabledExtensions: Array.from(this.registry.values()).filter(e => e.isEnabled).length,
      totalMetrics: this.performanceMetrics.length,
      extensions: Array.from(this.registry.entries()).map(([name, entry]) => ({
        name,
        statistics: entry.statistics,
        isEnabled: entry.isEnabled,
        isHealthy: entry.isHealthy,
      })),
    };
    
    this.log('info', 'Performance report generated', report);
    
    // Cleanup old metrics (keep last 1000)
    if (this.performanceMetrics.length > 1000) {
      this.performanceMetrics = this.performanceMetrics.slice(-1000);
    }
  }
  
  // === UTILITY METHODS ===
  
  /**
   * Get extension registry information
   */
  public getRegistry(): Map<string, ExtensionRegistryEntry> {
    return new Map(this.registry);
  }
  
  /**
   * Get extension by name
   */
  public getExtension(name: string): TextPluginExtension | null {
    return this.registry.get(name)?.extension || null;
  }
  
  /**
   * Get performance metrics
   */
  public getPerformanceMetrics(): PerformanceMetric[] {
    return [...this.performanceMetrics];
  }
  
  /**
   * Internal logging with level support
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    const levels = { debug: 0, info: 1, warn: 2, error: 3, none: 4 };
    const configLevel = levels[this.config.logLevel];
    const messageLevel = levels[level];
    
    if (messageLevel >= configLevel) {
      const logFn = console[level] || console.log;
      logFn(`[TextExtensionManager] ${message}`, data || '');
    }
  }
  
  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    this.registry.clear();
    this.performanceMetrics.length = 0;
    
    this.log('info', 'Extension manager destroyed');
  }
}

// Export singleton instance
export const extensionManager = TextPluginExtensionManager.getInstance();
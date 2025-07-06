// components/ExtensionManager.tsx
// CREATED: 2025-01-07 - Extension management UI components

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { textExtensionSystem, playgroundUtils } from '../plugins';

// === EXTENSION STATUS INDICATOR ===

interface ExtensionStatusProps {
  className?: string;
}

export const ExtensionStatus: React.FC<ExtensionStatusProps> = ({ className = '' }) => {
  const [status, setStatus] = useState<{
    available: boolean;
    stats?: any;
    status: string;
  }>({ available: false, status: 'loading' });

  const checkStatus = useCallback(async () => {
    const health = await textExtensionSystem.healthCheck();
    setStatus(health);
  }, []);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [checkStatus]);

  const getStatusColor = () => {
    switch (status.status) {
      case 'healthy': return 'text-green-600';
      case 'unavailable': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = () => {
    switch (status.status) {
      case 'healthy': return '✅';
      case 'unavailable': return '⚠️';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={`text-sm font-medium ${getStatusColor()}`}>
        {getStatusIcon()} Extensions
      </span>
      {status.stats && (
        <span className="text-xs text-gray-500">
          ({status.stats.enabled}/{status.stats.total})
        </span>
      )}
    </div>
  );
};

// === EXTENSION DASHBOARD ===

interface ExtensionDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExtensionDashboard: React.FC<ExtensionDashboardProps> = ({ isOpen, onClose }) => {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [validationResults, setValidationResults] = useState<any>(null);
  const [demoExtensionsRegistered, setDemoExtensionsRegistered] = useState(false);

  const refreshDiagnostics = useCallback(async () => {
    setLoading(true);
    try {
      const diag = await textExtensionSystem.getDiagnostics();
      setDiagnostics(diag);
      // Check if demo extensions are currently registered
      const demoExts = diag.extensions.filter((ext: any) => ext.name.startsWith('enhanced-text-transform') || ext.name.startsWith('advanced-ui-enhancement') || ext.name.startsWith('comprehensive-pdf-enhancement') || ext.name.startsWith('advanced-validation') || ext.name.startsWith('performance-monitoring'));
      setDemoExtensionsRegistered(demoExts.length > 0);
    } catch (error) {
      console.error('Failed to get diagnostics:', error);
    }
    setLoading(false);
  }, []);

  const registerDemoExtensions = useCallback(async () => {
    setLoading(true);
    try {
      const result = await textExtensionSystem.demo.registerAll();
      if (result.success) {
        toast.success(`✅ Registered ${result.successful} demo extensions!`);
        setDemoExtensionsRegistered(true);
        await refreshDiagnostics();
      } else {
        toast.error('❌ Failed to register demo extensions: ' + result.message);
      }
    } catch (error) {
      toast.error('❌ Error registering demo extensions: ' + error.message);
    }
    setLoading(false);
  }, [refreshDiagnostics]);

  const unregisterDemoExtensions = useCallback(async () => {
    setLoading(true);
    try {
      const result = await textExtensionSystem.demo.unregisterAll();
      if (result.success) {
        toast.success(`✅ Unregistered ${result.successful} demo extensions!`);
        setDemoExtensionsRegistered(false);
        await refreshDiagnostics();
      } else {
        toast.error('❌ Failed to unregister demo extensions: ' + result.message);
      }
    } catch (error) {
      toast.error('❌ Error unregistering demo extensions: ' + error.message);
    }
    setLoading(false);
  }, [refreshDiagnostics]);

  const runValidation = useCallback(async () => {
    setLoading(true);
    try {
      const results = await playgroundUtils.runComprehensiveValidation();
      setValidationResults(results);
      
      if (results.isValid) {
        toast.success('✅ All extension validations passed!');
      } else {
        toast.warn(`⚠️ ${results.errors.length} validation issues found`);
      }
    } catch (error) {
      toast.error('❌ Validation failed: ' + error.message);
    }
    setLoading(false);
  }, []);

  const runBenchmarks = useCallback(async () => {
    setLoading(true);
    try {
      const results = await playgroundUtils.runBenchmarks();
      if (results.success) {
        toast.success('⚡ Performance benchmarks completed (check console)');
      } else {
        toast.warn('⚠️ Benchmarks not available: ' + results.error);
      }
    } catch (error) {
      toast.error('❌ Benchmarks failed: ' + error.message);
    }
    setLoading(false);
  }, []);

  const createDemoExtension = useCallback(async () => {
    const name = prompt('Enter demo extension name:');
    if (!name) return;

    setLoading(true);
    try {
      const result = await playgroundUtils.createDemoExtension(name);
      if (result.success) {
        toast.success(`✅ Demo extension "${name}" created and registered!`);
        await refreshDiagnostics();
      } else {
        toast.error('❌ Failed to create demo extension: ' + result.error);
      }
    } catch (error) {
      toast.error('❌ Demo extension creation failed: ' + error.message);
    }
    setLoading(false);
  }, [refreshDiagnostics]);

  useEffect(() => {
    if (isOpen) {
      refreshDiagnostics();
    }
  }, [isOpen, refreshDiagnostics]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">🔌 Extension System Dashboard</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={refreshDiagnostics}
            disabled={loading}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            🔄 Refresh
          </button>
          <button
            onClick={runValidation}
            disabled={loading}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            ✅ Validate
          </button>
          <button
            onClick={runBenchmarks}
            disabled={loading}
            className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
          >
            ⚡ Benchmark
          </button>
          <button
            onClick={createDemoExtension}
            disabled={loading}
            className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            🧪 Create Custom Demo
          </button>
          {!demoExtensionsRegistered ? (
            <button
              onClick={registerDemoExtensions}
              disabled={loading}
              className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50"
            >
              ➕ Register All Demos
            </button>
          ) : (
            <button
              onClick={unregisterDemoExtensions}
              disabled={loading}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
            >
              ➖ Unregister All Demos
            </button>
          )}
        </div>

        {/* Extension Summary */}
        {diagnostics && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">📊 Summary</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-2xl font-bold text-blue-600">
                  {diagnostics.summary?.total || 0}
                </div>
                <div className="text-sm text-blue-800">Total Extensions</div>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <div className="text-2xl font-bold text-green-600">
                  {diagnostics.summary?.enabled || 0}
                </div>
                <div className="text-sm text-green-800">Enabled</div>
              </div>
              <div className="bg-red-50 p-3 rounded">
                <div className="text-2xl font-bold text-red-600">
                  {(diagnostics.summary?.total || 0) - (diagnostics.summary?.healthy || 0)}
                </div>
                <div className="text-sm text-red-800">Issues</div>
              </div>
            </div>
          </div>
        )}

        {/* Extensions List */}
        {diagnostics?.extensions && diagnostics.extensions.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">🔌 Registered Extensions</h3>
            <div className="space-y-2">
              {diagnostics.extensions.map((ext: any) => (
                <div
                  key={ext.name}
                  className="border rounded p-3 flex justify-between items-center"
                >
                  <div>
                    <div className="font-medium">{ext.name}</div>
                    <div className="text-sm text-gray-600">
                      Executions: {ext.statistics.totalExecutions} | 
                      Avg: {ext.statistics.averageExecutionTime.toFixed(2)}ms |
                      Errors: {ext.statistics.errorCount}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      ext.enabled 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {ext.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      ext.healthy 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {ext.healthy ? 'Healthy' : 'Unhealthy'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Validation Results */}
        {validationResults && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">
              {validationResults.isValid ? '✅' : '❌'} Validation Results
            </h3>
            
            {validationResults.errors && validationResults.errors.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-red-600 mb-2">Errors:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {validationResults.errors.map((error: string, index: number) => (
                    <li key={index} className="text-sm text-red-700">{error}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {validationResults.warnings && validationResults.warnings.length > 0 && (
              <div>
                <h4 className="font-medium text-yellow-600 mb-2">Warnings:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {validationResults.warnings.map((warning: string, index: number) => (
                    <li key={index} className="text-sm text-yellow-700">{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Error State */}
        {diagnostics?.error && (
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <h3 className="text-lg font-semibold text-red-800 mb-2">❌ Extension System Error</h3>
            <p className="text-red-700">{diagnostics.error}</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600">Processing...</p>
          </div>
        )}
      </div>
    </div>
  );
};

// === EXTENSION QUICK CONTROLS ===

interface ExtensionQuickControlsProps {
  className?: string;
}

export const ExtensionQuickControls: React.FC<ExtensionQuickControlsProps> = ({ 
  className = '' 
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(false);

  const initializeExtensions = useCallback(async () => {
    setLoading(true);
    try {
      const result = await textExtensionSystem.initializePlayground();
      setIsInitialized(true);
      
      if (result.success) {
        toast.success(`🔌 ${result.message}`);
      } else {
        toast.warn(`⚠️ ${result.message}`);
      }
    } catch (error) {
      toast.error('❌ Extension initialization failed: ' + error.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Auto-initialize on component mount
    initializeExtensions();
  }, [initializeExtensions]);

  const resetExtensions = useCallback(async () => {
    setLoading(true);
    try {
      // Unregister example extensions
      await textExtensionSystem.examples.unregisterAll();
      toast.success('🔄 Extensions reset');
      setIsInitialized(false);
    } catch (error) {
      toast.error('❌ Reset failed: ' + error.message);
    }
    setLoading(false);
  }, []);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={initializeExtensions}
        disabled={loading || isInitialized}
        className={`px-2 py-1 text-xs rounded border ${
          isInitialized 
            ? 'bg-green-50 text-green-700 border-green-200' 
            : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
        } disabled:opacity-50`}
      >
        {loading ? '⏳' : isInitialized ? '✅ Ready' : '🔌 Init'}
      </button>
      
      {isInitialized && (
        <button
          onClick={resetExtensions}
          disabled={loading}
          className="px-2 py-1 text-xs rounded border bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 disabled:opacity-50"
        >
          🔄 Reset
        </button>
      )}
    </div>
  );
};

// === EXTENSION FEATURE INDICATOR ===

export const ExtensionFeatureIndicator: React.FC = () => {
  const [features, setFeatures] = useState<any>(null);

  useEffect(() => {
    const loadFeatures = async () => {
      try {
        const allFeatures = await textExtensionSystem.features.getAll();
        setFeatures(allFeatures);
      } catch (error) {
        console.warn('Failed to load features:', error);
      }
    };

    loadFeatures();
  }, []);

  if (!features) return null;

  const featureList = [
    { key: 'extensionSystem', label: 'Extensions', icon: '🔌' },
    { key: 'japaneseSupport', label: 'Japanese', icon: '🇯🇵' },
    { key: 'dynamicSizing', label: 'Dynamic', icon: '📏' },
    { key: 'performanceMonitoring', label: 'Perf', icon: '⚡' },
  ];

  return (
    <div className="flex items-center gap-1">
      {featureList.map(({ key, label, icon }) => (
        <span
          key={key}
          className={`text-xs px-1 py-0.5 rounded ${
            features[key] 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-500'
          }`}
          title={`${label}: ${features[key] ? 'Available' : 'Unavailable'}`}
        >
          {icon}
        </span>
      ))}
    </div>
  );
};
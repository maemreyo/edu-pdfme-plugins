// Designer.tsx
// ENHANCED: 2025-01-07 - Integrated with Extension Management System

import React, { useRef, useEffect, useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from 'react-toastify';
import { cloneDeep, Template, checkTemplate, Lang, isBlankPdf } from "@pdfme/common";
import { Designer } from "@pdfme/ui";
import {
  getFontsData,
  getTemplateById,
  getBlankTemplate,
  readFile,
  handleLoadTemplate,
  generatePDF,
  downloadJsonFile,
  translations,
} from "../helper";

// 🆕 Enhanced plugins with extension system
import { 
  getPlugins, 
  textExtensionSystem, 
  getEnhancedPluginInfo,
  playgroundUtils 
} from '../plugins';

import { NavBar, NavItem } from "../components/NavBar";
import ExternalButton from "../components/ExternalButton";

// 🆕 Extension management components
import {
  ExtensionStatus,
  ExtensionDashboard,
  ExtensionQuickControls,
  ExtensionFeatureIndicator,
} from "../components/ExtensionManager";

function DesignerApp() {
  const [searchParams, setSearchParams] = useSearchParams();
  const designerRef = useRef<HTMLDivElement | null>(null);
  const designer = useRef<Designer | null>(null);

  const [editingStaticSchemas, setEditingStaticSchemas] = useState(false);
  const [originalTemplate, setOriginalTemplate] = useState<Template | null>(null);
  
  // 🆕 Extension system state
  const [extensionDashboardOpen, setExtensionDashboardOpen] = useState(false);
  const [pluginInfo, setPluginInfo] = useState<any>(null);
  const [extensionInitialized, setExtensionInitialized] = useState(false);

  // 🆕 Initialize extension system
  const initializeExtensionSystem = useCallback(async () => {
    try {
      console.log('🔌 Initializing extension system in Designer...');
      
      // Initialize playground extensions
      const initResult = await textExtensionSystem.initializePlayground();
      
      // Get enhanced plugin info
      const info = await getEnhancedPluginInfo();
      setPluginInfo(info);
      
      if (initResult.success) {
        setExtensionInitialized(true);
        toast.success(
          <div>
            <p>🔌 Extension System Ready!</p>
            <p className="text-sm">{initResult.message}</p>
          </div>,
          { autoClose: 3000 }
        );
      } else {
        toast.warn(
          <div>
            <p>⚠️ Extension System Warning</p>
            <p className="text-sm">{initResult.message}</p>
          </div>,
          { autoClose: 5000 }
        );
      }
      
    } catch (error) {
      console.warn('Extension system initialization failed:', error);
      toast.error('❌ Extension system initialization failed');
    }
  }, []);

  const buildDesigner = useCallback(async () => {
    if (!designerRef.current) return;
    try {
      let template: Template = getBlankTemplate();
      const templateIdFromQuery = searchParams.get("template");
      searchParams.delete("template");
      setSearchParams(searchParams, { replace: true });
      const templateFromLocal = localStorage.getItem("template");

      if (templateIdFromQuery) {
        const templateJson = await getTemplateById(templateIdFromQuery);
        checkTemplate(templateJson);
        template = templateJson;
        if (!templateFromLocal) {
          localStorage.setItem("template", JSON.stringify(templateJson));
        }
      } else if (templateFromLocal) {
        const templateJson = JSON.parse(templateFromLocal) as Template;
        checkTemplate(templateJson);
        template = templateJson;
      }

      // 🆕 Enhanced designer with extension-powered plugins
      designer.current = new Designer({
        domContainer: designerRef.current,
        template,
        options: {
          font: getFontsData(),
          lang: 'en',
          labels: {
            'signature.clear': "🗑️",
            // 🆕 Extension-related labels
            'text.extensionStatus': "Extension Status",
          },
          theme: {
            token: { colorPrimary: "#25c2a0" },
          },
          icons: {
            multiVariableText:
              '<svg fill="#000000" width="24px" height="24px" viewBox="0 0 24 24"><path d="M6.643,13.072,17.414,2.3a1.027,1.027,0,0,1,1.452,0L20.7,4.134a1.027,1.027,0,0,1,0,1.452L9.928,16.357,5,18ZM21,20H3a1,1,0,0,0,0,2H21a1,1,0,0,0,0-2Z"/></svg>',
            // 🆕 Extension system icon
            Text: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14,2 14,8 20,8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10,9 9,9 8,9"></polyline><circle cx="18" cy="4" r="2" fill="#25c2a0"></circle></svg>',
          },
          maxZoom: 250,
          // 🆕 Extension system callback
          // onSchemaUpdate: async (schemas) => {
          //   // Trigger extension hooks for schema updates
          //   try {
          //     if (extensionInitialized) {
          //       // Future: Could trigger schema update extensions here
          //       console.log('Schema updated with extension system active');
          //     }
          //   } catch (error) {
          //     console.warn('Extension schema update hook failed:', error);
          //   }
          // },
        },
        plugins: getPlugins(), // 🆕 Now includes enhanced text plugin
      });
      
      designer.current.onSaveTemplate(onSaveTemplate);

    } catch (error) {
      localStorage.removeItem("template");
      console.error(error);
      toast.error('❌ Designer initialization failed');
    }
  }, [searchParams, setSearchParams, extensionInitialized]);

  const onChangeBasePDF = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      readFile(e.target.files[0], "dataURL").then(async (basePdf) => {
        if (designer.current) {
          const newTemplate = cloneDeep(designer.current.getTemplate());
          newTemplate.basePdf = basePdf;
          designer.current.updateTemplate(newTemplate);
        }
      });
    }
  };

  const onDownloadTemplate = () => {
    if (designer.current) {
      downloadJsonFile(designer.current.getTemplate(), "template");
      toast.success(
        <div>
          <p>📄 Template downloaded! Can you share it? ❤️</p>
          <a
            className="text-blue-500 underline"
            target="_blank"
            rel="noopener noreferrer"
            href="https://pdfme.com/docs/template-contribution-guide"
          >
            See: Template Contribution Guide
          </a>
        </div>
      );
    }
  };

  const onSaveTemplate = (template?: Template) => {
    if (designer.current) {
      localStorage.setItem(
        "template",
        JSON.stringify(template || designer.current.getTemplate())
      );
      toast.success("💾 Saved to local storage");
    }
  };

  const onResetTemplate = () => {
    localStorage.removeItem("template");
    if (designer.current) {
      designer.current.updateTemplate(getBlankTemplate());
    }
    toast.info("🔄 Template reset");
  };

  const toggleEditingStaticSchemas = () => {
    if (!designer.current) return;

    if (!editingStaticSchemas) {
      const currentTemplate = cloneDeep(designer.current.getTemplate());
      if (!isBlankPdf(currentTemplate.basePdf)) {
        toast.error(<div>
          <p>⚠️ The current template cannot edit the static schema.</p>
          <a
            className="text-blue-500 underline"
            target="_blank"
            rel="noopener noreferrer"
            href="https://pdfme.com/docs/headers-and-footers"
          >
            See: Headers and Footers
          </a>
        </div>);
        return;
      }

      setOriginalTemplate(currentTemplate);

      const { width, height } = currentTemplate.basePdf;
      const staticSchema = currentTemplate.basePdf.staticSchema || [];
      designer.current.updateTemplate({
        ...currentTemplate,
        schemas: [staticSchema],
        basePdf: { width, height, padding: [0, 0, 0, 0] },
      });

      setEditingStaticSchemas(true);

    } else {
      const editedTemplate = designer.current.getTemplate();
      if (!originalTemplate) return;
      const merged = cloneDeep(originalTemplate);
      if (!isBlankPdf(merged.basePdf)) {
        toast.error("❌ Invalid basePdf format");
        return;
      }

      merged.basePdf.staticSchema = editedTemplate.schemas[0];
      designer.current.updateTemplate(merged);

      setOriginalTemplate(null);
      setEditingStaticSchemas(false);
    }
  };

  // 🆕 Extension-specific handlers
  const openExtensionDashboard = useCallback(() => {
    setExtensionDashboardOpen(true);
  }, []);

  const runExtensionValidation = useCallback(async () => {
    try {
      const results = await playgroundUtils.runComprehensiveValidation();
      if (results.isValid) {
        toast.success('✅ All extension validations passed!');
      } else {
        toast.warn(`⚠️ Found ${results.errors.length} validation issues`);
      }
    } catch (error) {
      toast.error('❌ Validation failed: ' + error.message);
    }
  }, []);

  // 🆕 Initialize extension system on component mount
  useEffect(() => {
    initializeExtensionSystem();
  }, [initializeExtensionSystem]);

  useEffect(() => {
    if (designerRef.current) {
      buildDesigner();
    }
    return () => {
      designer.current?.destroy();
    };
  }, [designerRef, buildDesigner]);

  // 🆕 Enhanced navigation items with extension controls
  const navItems: NavItem[] = [
    // 🆕 Extension System Status (always visible)
    {
      label: "Extension System",
      content: (
        <div className="flex items-center justify-between w-full">
          <ExtensionStatus />
          <ExtensionQuickControls />
        </div>
      ),
    },
    
    // 🆕 Extension Features Indicator
    {
      label: "Features",
      content: <ExtensionFeatureIndicator />,
    },
    
    // Original navigation items
    {
      label: "Language",
      content: (
        <select
          disabled={editingStaticSchemas}
          className={`w-full border rounded px-2 py-1 ${
            editingStaticSchemas ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onChange={(e) => {
            designer.current?.updateOptions({ lang: e.target.value as Lang });
          }}
        >
          {translations.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      ),
    },
    
    {
      label: "Change BasePDF",
      content: (
        <input
          disabled={editingStaticSchemas}
          type="file"
          accept="application/pdf"
          className={`w-full text-sm border rounded ${
            editingStaticSchemas ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onChange={onChangeBasePDF}
        />
      ),
    },
    
    {
      label: "Load Template",
      content: (
        <input
          disabled={editingStaticSchemas}
          type="file"
          accept="application/json"
          className={`w-full text-sm border rounded ${
            editingStaticSchemas ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onChange={(e) => handleLoadTemplate(e, designer.current)}
        />
      ),
    },
    
    {
      label: "Edit Static Schema",
      content: (
        <button
          className={`px-2 py-1 border rounded hover:bg-gray-100 w-full disabled:opacity-50 disabled:cursor-not-allowed`}
          onClick={toggleEditingStaticSchemas}
        >
          {editingStaticSchemas ? "🔚 End Editing" : "✏️ Start Editing"}
        </button>
      ),
    },
    
    {
      label: "Template Actions",
      content: (
        <div className="flex gap-2">
          <button
            id="save-local"
            disabled={editingStaticSchemas}
            className={`px-2 py-1 border rounded hover:bg-gray-100 w-full ${
              editingStaticSchemas ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={() => onSaveTemplate()}
          >
            💾 Save
          </button>
          <button
            id="reset-template"
            disabled={editingStaticSchemas}
            className={`px-2 py-1 border rounded hover:bg-gray-100 w-full ${
              editingStaticSchemas ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={onResetTemplate}
          >
            🔄 Reset
          </button>
        </div>
      ),
    },
    
    {
      label: "Generate & Download",
      content: (
        <div className="flex gap-2">
          <button
            disabled={editingStaticSchemas}
            className={`px-2 py-1 border rounded hover:bg-gray-100 w-full ${
              editingStaticSchemas ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={onDownloadTemplate}
          >
            📄 Template
          </button>
          <button
            id="generate-pdf"
            disabled={editingStaticSchemas}
            className={`px-2 py-1 border rounded hover:bg-gray-100 w-full ${
              editingStaticSchemas ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={async () => {
              const startTimer = performance.now();
              await generatePDF(designer.current);
              const endTimer = performance.now();
              toast.info(`📄 Generated PDF in ${Math.round(endTimer - startTimer)}ms ⚡️`);
            }}
          >
            📄 PDF
          </button>
        </div>
      ),
    },
    
    // 🆕 Extension Development Tools
    {
      label: "Extension Tools",
      content: (
        <div className="flex gap-2">
          <button
            onClick={openExtensionDashboard}
            className="px-2 py-1 border rounded hover:bg-gray-100 w-full"
          >
            🔌 Dashboard
          </button>
          <button
            onClick={runExtensionValidation}
            className="px-2 py-1 border rounded hover:bg-gray-100 w-full"
          >
            ✅ Validate
          </button>
        </div>
      ),
    },
    
    {
      label: "",
      content: React.createElement(ExternalButton, {
        href: "https://github.com/pdfme/pdfme/issues/new?template=template_feedback.yml&title=TEMPLATE_NAME",
        title: "💬 Feedback this template"
      }),
    },
  ];

  return (
    <>
      <NavBar items={navItems} />
      <div ref={designerRef} className="flex-1 w-full" />
      
      {/* 🆕 Extension Dashboard Modal */}
      <ExtensionDashboard
        isOpen={extensionDashboardOpen}
        onClose={() => setExtensionDashboardOpen(false)}
      />
      
      {/* 🆕 Plugin Info Display (Development) */}
      {process.env.NODE_ENV === 'development' && pluginInfo && (
        <div className="fixed bottom-4 right-4 bg-white border rounded shadow-lg p-3 max-w-sm">
          <div className="text-sm">
            <div className="font-semibold">📊 Plugin Stats</div>
            <div>Total: {pluginInfo.stats.total}</div>
            <div>Enhanced: {pluginInfo.stats.enhanced}</div>
            <div>Extension Status: {pluginInfo.enhanced.Text?.extensionSystem?.status || 'Unknown'}</div>
          </div>
        </div>
      )}
    </>
  );
}

export default DesignerApp;
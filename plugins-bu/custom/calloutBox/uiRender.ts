import { UIRenderProps } from "@pdfme/common";
import type { CalloutBoxSchema } from "./types";
import { uiRender as textUiRender } from "../../base/text/uiRender";

/**
 * Main UI render function for CalloutBox plugin
 * Implements measurement-based rendering for automatic layout management
 */
export const uiRender = async (arg: UIRenderProps<CalloutBoxSchema>) => {
  const { schema, rootElement, mode, onChange, ...rest } = arg;

  // Clear any existing content
  rootElement.innerHTML = '';
  
  // Set up container styles
  rootElement.style.position = 'relative';
  rootElement.style.overflow = 'visible';
  rootElement.style.border = mode === 'designer' ? '1px dashed #ccc' : 'none';
  rootElement.style.borderRadius = '4px';

  // Phase 1: Measurement Phase - Render "virtual" elements to measure heights
  const measurements = await measureContentHeights(arg);
  
  // Phase 2: Layout Calculation - Calculate total required height
  const calculatedLayout = calculateLayout(schema, measurements);
  
  // Phase 3: Auto-adjust height if needed
  if (Math.abs(calculatedLayout.totalHeight - schema.height) > 3) { // 3mm tolerance
    if (onChange) {
      onChange({ key: 'height', value: calculatedLayout.totalHeight });
    }
    return; // Re-render will be triggered by onChange
  }
  
  // Phase 4: Actual DOM Rendering with calculated positions
  await renderActualDOM(arg, calculatedLayout);
};

/**
 * Phase 1: Measure content heights by rendering virtual elements
 */
async function measureContentHeights(arg: UIRenderProps<CalloutBoxSchema>) {
  const { schema } = arg;
  
  // Create temporary container for measurement (not added to DOM)
  const measurementContainer = document.createElement('div');
  measurementContainer.style.position = 'absolute';
  measurementContainer.style.visibility = 'hidden';
  measurementContainer.style.top = '-9999px';
  measurementContainer.style.width = `${schema.width}mm`;
  document.body.appendChild(measurementContainer);

  try {
    // Measure title height
    const titleDiv = document.createElement('div');
    titleDiv.style.width = `${getTextAreaWidth(schema)}mm`;
    measurementContainer.appendChild(titleDiv);

    await textUiRender({
      ...arg,
      value: schema.title,
      schema: {
        ...schema.titleStyle,
        type: 'text',
        name: `title-measure-${schema.id}`,
        id: `title-measure-${schema.id}`,
        width: getTextAreaWidth(schema),
        height: 20,
        position: { x: 0, y: 0 },
        readOnly: true,
      },
      rootElement: titleDiv,
      onChange: () => {}, // No-op for measurement
    });

    // Measure body height
    const bodyDiv = document.createElement('div');
    bodyDiv.style.width = `${getTextAreaWidth(schema)}mm`;
    measurementContainer.appendChild(bodyDiv);

    await textUiRender({
      ...arg,
      value: schema.body,
      schema: {
        ...schema.bodyStyle,
        type: 'text',
        name: `body-measure-${schema.id}`,
        id: `body-measure-${schema.id}`,
        width: getTextAreaWidth(schema),
        height: 40,
        position: { x: 0, y: 0 },
        readOnly: true,
      },
      rootElement: bodyDiv,
      onChange: () => {}, // No-op for measurement
    });

    // Convert pixel measurements to mm (rough conversion: 1mm ≈ 3.78px)
    const titleHeight = Math.max(titleDiv.scrollHeight / 3.78, 5);
    const bodyHeight = Math.max(bodyDiv.scrollHeight / 3.78, 8);

    return {
      titleHeight,
      bodyHeight,
    };

  } finally {
    // Clean up measurement container
    document.body.removeChild(measurementContainer);
  }
}

/**
 * Phase 2: Calculate layout positions and total height
 */
function calculateLayout(schema: CalloutBoxSchema, measurements: { titleHeight: number; bodyHeight: number }) {
  const { layout } = schema;
  const { titleHeight, bodyHeight } = measurements;
  
  // Calculate positions
  const iconY = layout.padding;
  const titleY = layout.padding;
  const bodyY = layout.padding + titleHeight + layout.spacingAfterTitle;
  
  // Calculate total height needed
  const totalHeight = 
    layout.padding + // Top padding
    titleHeight + 
    layout.spacingAfterTitle + 
    bodyHeight + 
    layout.padding; // Bottom padding

  return {
    iconY,
    titleY,
    bodyY,
    titleHeight,
    bodyHeight,
    totalHeight,
  };
}

/**
 * Phase 4: Render the actual DOM structure with calculated positions
 */
async function renderActualDOM(
  arg: UIRenderProps<CalloutBoxSchema>, 
  layout: ReturnType<typeof calculateLayout>
) {
  const { schema, rootElement, mode, onChange } = arg;

  // Create main container
  const container = document.createElement('div');
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.position = 'relative';
  rootElement.appendChild(container);

  // 1. Render Background
  const backgroundDiv = document.createElement('div');
  backgroundDiv.style.position = 'absolute';
  backgroundDiv.style.top = '0';
  backgroundDiv.style.left = '0';
  backgroundDiv.style.width = '100%';
  backgroundDiv.style.height = '100%';
  backgroundDiv.style.backgroundColor = schema.backgroundColor;
  backgroundDiv.style.border = `${schema.borderWidth}mm solid ${schema.borderColor}`;
  backgroundDiv.style.borderRadius = `${schema.radius}mm`;
  backgroundDiv.style.boxSizing = 'border-box';
  container.appendChild(backgroundDiv);

  // 2. Render Icon
  const iconDiv = document.createElement('div');
  iconDiv.style.position = 'absolute';
  iconDiv.style.left = `${schema.layout.padding}mm`;
  iconDiv.style.top = `${layout.iconY}mm`;
  iconDiv.style.width = `${schema.layout.iconSize}mm`;
  iconDiv.style.height = `${schema.layout.iconSize}mm`;
  iconDiv.style.display = 'flex';
  iconDiv.style.alignItems = 'center';
  iconDiv.style.justifyContent = 'center';
  iconDiv.style.color = schema.titleStyle.fontColor || '#333';
  iconDiv.innerHTML = schema.icon;
  container.appendChild(iconDiv);

  // 3. Render Title
  const titleDiv = document.createElement('div');
  titleDiv.style.position = 'absolute';
  titleDiv.style.left = `${schema.layout.padding + schema.layout.iconSize + schema.layout.spacingAfterIcon}mm`;
  titleDiv.style.top = `${layout.titleY}mm`;
  titleDiv.style.width = `${getTextAreaWidth(schema)}mm`;
  titleDiv.style.height = `${layout.titleHeight}mm`;
  
  if (mode === 'designer') {
    titleDiv.style.border = '1px dashed rgba(0,0,0,0.3)';
    titleDiv.style.borderRadius = '2px';
  }
  
  container.appendChild(titleDiv);

  await textUiRender({
    ...arg,
    value: schema.title,
    schema: {
      ...schema.titleStyle,
      type: 'text',
      name: `title-${schema.id}`,
      id: `title-${schema.id}`,
      width: getTextAreaWidth(schema),
      height: layout.titleHeight,
      position: { x: 0, y: 0 },
      readOnly: false,
    },
    rootElement: titleDiv,
    onChange: (changeArg: { key: string; value: unknown }) => {
      if (changeArg.key === 'content' && onChange) {
        onChange({ key: 'title', value: changeArg.value });
      }
    },
  });

  // 4. Render Body Content
  const bodyDiv = document.createElement('div');
  bodyDiv.style.position = 'absolute';
  bodyDiv.style.left = `${schema.layout.padding}mm`;
  bodyDiv.style.top = `${layout.bodyY}mm`;
  bodyDiv.style.width = `${schema.width - (schema.layout.padding * 2)}mm`;
  bodyDiv.style.height = `${layout.bodyHeight}mm`;
  
  if (mode === 'designer') {
    bodyDiv.style.border = '1px dashed rgba(0,0,0,0.3)';
    bodyDiv.style.borderRadius = '2px';
  }
  
  container.appendChild(bodyDiv);

  await textUiRender({
    ...arg,
    value: schema.body,
    schema: {
      ...schema.bodyStyle,
      type: 'text',
      name: `body-${schema.id}`,
      id: `body-${schema.id}`,
      width: schema.width - (schema.layout.padding * 2),
      height: layout.bodyHeight,
      position: { x: 0, y: 0 },
      readOnly: false,
    },
    rootElement: bodyDiv,
    onChange: (changeArg: { key: string; value: unknown }) => {
      if (changeArg.key === 'content' && onChange) {
        onChange({ key: 'body', value: changeArg.value });
      }
    },
  });
}

/**
 * Calculate the available width for text content (title)
 * Title shares space with icon, body uses full width minus padding
 */
function getTextAreaWidth(schema: CalloutBoxSchema): number {
  return schema.width - 
    (schema.layout.padding * 2) - 
    schema.layout.iconSize - 
    schema.layout.spacingAfterIcon;
}
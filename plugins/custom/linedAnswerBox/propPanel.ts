import { PropPanel } from "@pdfme/common";
import type { LinedAnswerBoxSchema } from "./types";
import { propPanel as parentPropPanel } from "../../base/text/propPanel";
import { DEFAULT_VALUES } from "./helpers";

/**
 * Property panel for LinedAnswerBox plugin
 * Extends text propPanel with line-specific controls
 */
export const propPanel: PropPanel<LinedAnswerBoxSchema> = {
  ...parentPropPanel,
  
  schema: (propPanelProps) => {
    // Get the parent schema from text plugin
    const parentSchema = (parentPropPanel as any).schema(propPanelProps);
    
    // Add our custom line-related fields
    return {
      ...parentSchema,
      
      // Divider before line settings
      '-------lines': { 
        type: 'void', 
        widget: 'Divider',
        title: 'Line Settings' 
      },
      
      // Line spacing control
      lineSpacing: {
        title: 'Line Spacing (mm)',
        type: 'number',
        widget: 'inputNumber',
        props: {
          min: DEFAULT_VALUES.minLineSpacing,
          max: DEFAULT_VALUES.maxLineSpacing,
          step: 0.5,
          precision: 1,
        },
        default: DEFAULT_VALUES.lineSpacing,
        span: 12,
        description: 'Distance between horizontal guide lines',
      },
      
      // Padding control
      padding: {
        title: 'Padding (mm)',
        type: 'number',
        widget: 'inputNumber',
        props: {
          min: 0,
          max: 20,
          step: 0.5,
          precision: 1,
        },
        default: DEFAULT_VALUES.padding,
        span: 12,
        description: 'Space between box edge and content',
      },
      
      // Line color picker
      lineColor: {
        title: 'Line Color',
        type: 'string',
        widget: 'color',
        default: DEFAULT_VALUES.lineColor,
        span: 8,
        description: 'Color of the guide lines',
      },
      
      // Line style selector
      lineStyle: {
        title: 'Line Style',
        type: 'string',
        widget: 'select',
        props: {
          options: [
            { label: 'Solid', value: 'solid' },
            { label: 'Dashed', value: 'dashed' },
            { label: 'Dotted', value: 'dotted' },
          ],
        },
        default: DEFAULT_VALUES.lineStyle,
        span: 8,
        description: 'Visual style of guide lines',
      },
      
      // Line width control
      lineWidth: {
        title: 'Line Width (pt)',
        type: 'number',
        widget: 'inputNumber',
        props: {
          min: 0.1,
          max: 3,
          step: 0.1,
          precision: 1,
        },
        default: DEFAULT_VALUES.lineWidth,
        span: 8,
        description: 'Thickness of guide lines',
      },
      
      // Divider before PDF settings
      '-------pdf': { 
        type: 'void', 
        widget: 'Divider',
        title: 'PDF Output' 
      },
      
      // PDF output options
      showLinesInPdf: {
        title: 'Show Lines in PDF',
        type: 'boolean',
        widget: 'switch',
        default: DEFAULT_VALUES.showLinesInPdf,
        span: 24,
        description: 'Include guide lines in the final PDF output',
      },
    };
  },
  
  // Default schema values for new instances
  defaultSchema: {
    ...parentPropPanel.defaultSchema,
    type: 'linedAnswerBox',
    width: 80,
    height: 40,
    content: '',
    lineSpacing: DEFAULT_VALUES.lineSpacing,
    lineColor: DEFAULT_VALUES.lineColor,
    padding: DEFAULT_VALUES.padding,
    showLinesInPdf: DEFAULT_VALUES.showLinesInPdf,
    lineStyle: DEFAULT_VALUES.lineStyle,
    lineWidth: DEFAULT_VALUES.lineWidth,
    fontSize: 10, // Smaller default font for lined boxes
    fontName: 'Helvetica',
  },
};

/**
 * Custom widget for advanced line settings (future enhancement)
 * This could provide a visual preview of the line layout
 */
export const linePreviewWidget = {
  name: 'linePreview',
  component: (props: any) => {
    // This would be implemented as a React component showing
    // a mini preview of how the lines will look
    return null; // Placeholder for future implementation
  },
};

/**
 * Validation function for property panel values
 * Called when user changes values in the property panel
 */
export function validatePropPanelValues(values: Partial<LinedAnswerBoxSchema>): {
  isValid: boolean;
  errors: string[];
  correctedValues?: Partial<LinedAnswerBoxSchema>;
} {
  const errors: string[] = [];
  const corrected: Partial<LinedAnswerBoxSchema> = { ...values };
  
  // Validate line spacing
  if (values.lineSpacing !== undefined) {
    if (values.lineSpacing < DEFAULT_VALUES.minLineSpacing) {
      errors.push(`Line spacing must be at least ${DEFAULT_VALUES.minLineSpacing}mm`);
      corrected.lineSpacing = DEFAULT_VALUES.minLineSpacing;
    }
    if (values.lineSpacing > DEFAULT_VALUES.maxLineSpacing) {
      errors.push(`Line spacing cannot exceed ${DEFAULT_VALUES.maxLineSpacing}mm`);
      corrected.lineSpacing = DEFAULT_VALUES.maxLineSpacing;
    }
  }
  
  // Validate padding vs dimensions
  if (values.padding !== undefined && values.height !== undefined) {
    if (values.padding * 2 >= values.height) {
      errors.push('Padding is too large for box height');
      corrected.padding = Math.max(0, values.height / 4);
    }
  }
  
  // Validate line width
  if (values.lineWidth !== undefined) {
    if (values.lineWidth < 0.1) {
      errors.push('Line width must be at least 0.1pt');
      corrected.lineWidth = 0.1;
    }
    if (values.lineWidth > 3) {
      errors.push('Line width cannot exceed 3pt');
      corrected.lineWidth = 3;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    correctedValues: errors.length > 0 ? corrected : undefined,
  };
}
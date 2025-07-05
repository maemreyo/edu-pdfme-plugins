import { PropPanel } from "@pdfme/common";
import type { FillInTheBlankSchema } from "./types";
import { propPanel as parentPropPanel } from "../../base/multiVariableText/propPanel";

/**
 * Property panel for FillInTheBlank plugin
 * Extends multiVariableText propPanel with additional blankStyle option
 */
export const propPanel: PropPanel<FillInTheBlankSchema> = {
  ...parentPropPanel,
  
  schema: (propPanelProps) => {
    // Get the parent schema from multiVariableText
    // Check if schema is a function before calling it
    const parentSchema = typeof parentPropPanel.schema === 'function' 
      ? parentPropPanel.schema(propPanelProps) 
      : {};
    
    // Add our custom blankStyle field
    return {
      ...parentSchema,
      blankStyle: {
        title: 'Blank Style',
        type: 'string',
        widget: 'select',
        props: {
          options: [
            { label: 'Underline', value: 'underline' },
            { label: 'Box Border', value: 'box' },
          ],
        },
        default: 'underline',
        span: 24,
      },
    };
  },
};

// Example: How to use the CalloutBox Plugin

import { calloutBox } from '../plugins/custom';
import type { CalloutBoxSchema, CalloutType } from '../plugins/custom/calloutBox/types';
import { EDUCATIONAL_ICONS, CALLOUT_TYPE_CONFIGS } from '../plugins/custom/calloutBox/types';

/**
 * Example 1: Basic Tip Callout Box
 */
const tipCalloutExample: CalloutBoxSchema = {
  type: 'calloutBox',
  id: 'tip_1',
  name: 'tip_1',
  position: { x: 20, y: 30 },
  width: 150,
  height: 40, // Will auto-adjust based on content
  
  // Content
  icon: EDUCATIONAL_ICONS.lightbulb,
  title: 'Study Tip',
  body: 'Remember to review your notes within 24 hours of taking them for better retention!',
  
  // Visual styling
  backgroundColor: '#f6ffed',
  borderColor: '#b7eb8f',
  borderWidth: 1,
  radius: 4,
  
  // Text styles
  titleStyle: {
    fontSize: 12,
    fontColor: '#389e0d',
    fontName: 'Helvetica-Bold',
  },
  bodyStyle: {
    fontSize: 10,
    fontColor: '#237804',
    fontName: 'Helvetica',
  },
  
  // Layout
  layout: {
    padding: 8,
    iconSize: 5,
    spacingAfterIcon: 4,
    spacingAfterTitle: 6,
  },
  
  calloutType: 'tip',
  readOnly: false,
};

/**
 * Example 2: Warning Callout with Custom Content
 */
const warningCalloutExample: CalloutBoxSchema = {
  type: 'calloutBox',
  id: 'warning_1',
  name: 'warning_1',
  position: { x: 20, y: 100 },
  width: 160,
  height: 50,
  
  icon: EDUCATIONAL_ICONS.alert,
  title: 'Important Warning',
  body: 'Always wear safety goggles when conducting chemistry experiments. Chemical splashes can cause serious eye injuries.',
  
  backgroundColor: '#fff7e6',
  borderColor: '#ffd591',
  borderWidth: 2,
  radius: 6,
  
  titleStyle: {
    fontSize: 13,
    fontColor: '#d46b08',
    fontName: 'Helvetica-Bold',
  },
  bodyStyle: {
    fontSize: 11,
    fontColor: '#ad4e00',
    fontName: 'Helvetica',
  },
  
  layout: {
    padding: 10,
    iconSize: 6,
    spacingAfterIcon: 5,
    spacingAfterTitle: 8,
  },
  
  calloutType: 'warning',
  readOnly: false,
};

/**
 * Example 3: Definition Box for Educational Content
 */
const definitionCalloutExample: CalloutBoxSchema = {
  type: 'calloutBox',
  id: 'definition_1',
  name: 'definition_1',
  position: { x: 20, y: 180 },
  width: 140,
  height: 45,
  
  icon: EDUCATIONAL_ICONS.book,
  title: 'Definition',
  body: 'Photosynthesis: The process by which green plants use sunlight to synthesize nutrients from carbon dioxide and water.',
  
  backgroundColor: '#f9f0ff',
  borderColor: '#d3adf7',
  borderWidth: 1,
  radius: 4,
  
  titleStyle: {
    fontSize: 12,
    fontColor: '#531dab',
    fontName: 'Helvetica-Bold',
  },
  bodyStyle: {
    fontSize: 10,
    fontColor: '#391085',
    fontName: 'Helvetica',
  },
  
  layout: {
    padding: 8,
    iconSize: 5,
    spacingAfterIcon: 4,
    spacingAfterTitle: 6,
  },
  
  calloutType: 'definition',
  readOnly: false,
};

/**
 * Example 4: Using with pdfme Template
 */
const educationalWorksheetTemplate = {
  basePdf: 'data:application/pdf;base64,...', // Your base PDF
  schemas: [
    // Main content areas
    {
      type: 'text',
      id: 'main_title',
      position: { x: 20, y: 20 },
      width: 170,
      height: 15,
      content: 'Biology Worksheet: Plant Processes',
      fontSize: 16,
      fontName: 'Helvetica-Bold',
    },

    // Educational callouts
    tipCalloutExample,
    warningCalloutExample,
    definitionCalloutExample,

    // Multiple choice question
    {
      type: 'multipleChoiceQuestion',
      id: 'mcq_1',
      position: { x: 20, y: 250 },
      width: 160,
      height: 70,
      question: 'Which organelle is responsible for photosynthesis?',
      choices: [
        { id: 'a', text: 'Nucleus' },
        { id: 'b', text: 'Chloroplast' },
        { id: 'c', text: 'Mitochondria' },
        { id: 'd', text: 'Ribosome' },
      ],
      correctAnswerId: 'b',
    },
  ],
};

/**
 * Example 5: Programmatic Callout Creation
 */
function createInfoCallout(
  position: { x: number; y: number },
  title: string,
  content: string,
  width: number = 150
): CalloutBoxSchema {
  return {
    type: 'calloutBox',
    id: `info_${Date.now()}`,
    name: `info_${Date.now()}`,
    position,
    width,
    height: 40, // Will auto-adjust
    
    ...CALLOUT_TYPE_CONFIGS.info, // Apply info preset
    
    title,
    body: content,
    
    layout: {
      padding: 8,
      iconSize: 5,
      spacingAfterIcon: 4,
      spacingAfterTitle: 6,
    },
    
    readOnly: false,
  };
}

/**
 * Example 6: Dynamic Callout Type Application
 */
function applyCalloutType(schema: CalloutBoxSchema, type: CalloutType): CalloutBoxSchema {
  const typeConfig = CALLOUT_TYPE_CONFIGS[type];
  
  return {
    ...schema,
    ...typeConfig,
    calloutType: type,
    titleStyle: {
      ...schema.titleStyle,
      ...typeConfig.titleStyle,
    },
    bodyStyle: {
      ...schema.bodyStyle,
      ...typeConfig.bodyStyle,
    },
  };
}

/**
 * Example 7: Using with pdfme Designer
 */
import { Designer } from '@pdfme/ui';

const plugins = {
  calloutBox,
  // ... other plugins
};

const designer = new Designer({
  domContainer: document.getElementById('designer-container'),
  template: educationalWorksheetTemplate,
  plugins,
});

/**
 * Example 8: Custom Icon Integration
 */
const customIconCallout: CalloutBoxSchema = {
  type: 'calloutBox',
  id: 'custom_icon',
  name: 'custom_icon',
  position: { x: 20, y: 60 },
  width: 140,
  height: 35,
  
  // Custom SVG icon
  icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>`,
  
  title: 'Star Fact',
  body: 'Did you know that our Sun is actually a medium-sized star?',
  
  backgroundColor: '#fff7e6',
  borderColor: '#ffb347',
  borderWidth: 1,
  radius: 3,
  
  titleStyle: {
    fontSize: 11,
    fontColor: '#cc7a00',
    fontName: 'Helvetica-Bold',
  },
  bodyStyle: {
    fontSize: 9,
    fontColor: '#996600',
    fontName: 'Helvetica',
  },
  
  layout: {
    padding: 6,
    iconSize: 4,
    spacingAfterIcon: 3,
    spacingAfterTitle: 4,
  },
  
  readOnly: false,
};

/**
 * Example 9: PDF Generation with Callouts
 */
import { generate } from '@pdfme/generator';

const generateEducationalPDF = async () => {
  const pdf = await generate({
    template: educationalWorksheetTemplate,
    inputs: [{}], // No form inputs needed for callouts
    plugins: { calloutBox },
  });
  
  return pdf; // Returns Uint8Array of PDF
};

export {
  tipCalloutExample,
  warningCalloutExample,
  definitionCalloutExample,
  educationalWorksheetTemplate,
  createInfoCallout,
  applyCalloutType,
  customIconCallout,
  generateEducationalPDF,
};
import { PDFRenderProps } from '@pdfme/common';
import { LinedAnswerBoxSchema } from './types';
import { pdfRender as parentPdfRender } from '../../base/text/pdfRender';
import { calculateLinePositions, validateSchema } from './helpers';

/**
 * PDF render function for LinedAnswerBox plugin
 * 
 * Handles two rendering modes:
 * 1. Text only (default) - clean output without guide lines
 * 2. Text with lines - preserves visual guide lines in PDF
 */
export const pdfRender = async (arg: PDFRenderProps<LinedAnswerBoxSchema>) => {
  const { value, schema, pdfDoc, pdfLib, page, options, ...rest } = arg;

  // Validate schema
  const validatedSchema = validateSchema(schema);

  // If showLinesInPdf is true, render the guide lines first
  if (validatedSchema.showLinesInPdf) {
    await renderGuideLines({
      schema: validatedSchema,
      page,
      pdfLib,
    });
  }

  // Render the text content using the parent text renderer
  // Adjust the schema to account for padding
  const textSchema = {
    ...validatedSchema,
    // Adjust position to account for padding
    position: {
      x: validatedSchema.position.x + validatedSchema.padding,
      y: validatedSchema.position.y + validatedSchema.padding,
    },
    // Adjust dimensions to account for padding
    width: validatedSchema.width - (validatedSchema.padding * 2),
    height: validatedSchema.height - (validatedSchema.padding * 2),
  };

  // Calculate optimal font size and line height for alignment
  const lineCalc = calculateLinePositions(validatedSchema);
  if (lineCalc.lineCount > 0 && validatedSchema.showLinesInPdf) {
    // Adjust line height to match line spacing
    textSchema.lineHeight = validatedSchema.lineSpacing / validatedSchema.fontSize;
  }

  // Delegate text rendering to parent
  await parentPdfRender({
    value,
    schema: textSchema,
    pdfDoc,
    pdfLib,
    page,
    options,
    ...rest,
  });
};

/**
 * Render horizontal guide lines on the PDF page
 */
async function renderGuideLines({
  schema,
  page,
  pdfLib,
}: {
  schema: LinedAnswerBoxSchema;
  page: any; // PDFPage
  pdfLib: any; // pdf-lib
}) {
  const lineCalc = calculateLinePositions(schema);
  
  if (lineCalc.lineCount === 0) {
    return; // No lines to render
  }

  // Convert line color to RGB
  const rgb = parseColorToRgb(schema.lineColor);
  
  // Get page dimensions for coordinate conversion
  const { height: pageHeight } = page.getSize();
  
  // Render each horizontal line
  lineCalc.linePositions.forEach((yOffset) => {
    // Calculate actual Y position on page (PDF coordinates are bottom-up)
    const lineY = pageHeight - (schema.position.y + yOffset);
    
    // Calculate line start and end X positions
    const lineStartX = schema.position.x + schema.padding;
    const lineEndX = schema.position.x + schema.width - schema.padding;
    
    // Draw the line
    page.drawLine({
      start: { x: lineStartX, y: lineY },
      end: { x: lineEndX, y: lineY },
      thickness: schema.lineWidth || 0.5,
      color: pdfLib.rgb(rgb.r, rgb.g, rgb.b),
      dashArray: getLineDashArray(schema.lineStyle),
    });
  });

  // Optionally draw a border around the entire box
  if (schema.showLinesInPdf) {
    const boxY = pageHeight - schema.position.y;
    const boxBottomY = pageHeight - (schema.position.y + schema.height);
    
    page.drawRectangle({
      x: schema.position.x,
      y: boxBottomY,
      width: schema.width,
      height: schema.height,
      borderColor: pdfLib.rgb(rgb.r * 0.7, rgb.g * 0.7, rgb.b * 0.7), // Slightly darker
      borderWidth: 1,
    });
  }
}

/**
 * Parse color string to RGB values
 */
function parseColorToRgb(color: string): { r: number; g: number; b: number } {
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    return { r, g, b };
  }
  
  // Handle rgb/rgba colors
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]) / 255;
    const g = parseInt(rgbMatch[2]) / 255;
    const b = parseInt(rgbMatch[3]) / 255;
    return { r, g, b };
  }
  
  // Handle named colors (basic set)
  const namedColors: Record<string, { r: number; g: number; b: number }> = {
    black: { r: 0, g: 0, b: 0 },
    white: { r: 1, g: 1, b: 1 },
    red: { r: 1, g: 0, b: 0 },
    green: { r: 0, g: 1, b: 0 },
    blue: { r: 0, g: 0, b: 1 },
    gray: { r: 0.5, g: 0.5, b: 0.5 },
    grey: { r: 0.5, g: 0.5, b: 0.5 },
  };
  
  return namedColors[color.toLowerCase()] || { r: 0.8, g: 0.8, b: 0.8 }; // Default gray
}

/**
 * Get dash array for different line styles
 */
function getLineDashArray(style?: 'solid' | 'dashed' | 'dotted'): number[] | undefined {
  switch (style) {
    case 'dashed':
      return [3, 2]; // 3 units line, 2 units gap
    case 'dotted':
      return [1, 1]; // 1 unit dot, 1 unit gap
    case 'solid':
    default:
      return undefined; // Solid line (no dash array)
  }
}

/**
 * Alternative PDF render approach - text only (no lines)
 * This is the default behavior when showLinesInPdf is false
 */
export const pdfRenderTextOnly = async (arg: PDFRenderProps<LinedAnswerBoxSchema>) => {
  const { value, schema, ...rest } = arg;
  
  // Create a text-only schema by stripping line-specific properties
  const textOnlySchema = {
    ...schema,
    // Remove lined answer box specific properties
    lineSpacing: undefined,
    lineColor: undefined,
    showLinesInPdf: undefined,
    lineStyle: undefined,
    lineWidth: undefined,
    // Adjust for padding
    position: {
      x: schema.position.x + schema.padding,
      y: schema.position.y + schema.padding,
    },
    width: schema.width - (schema.padding * 2),
    height: schema.height - (schema.padding * 2),
  };

  // Render as regular text
  await parentPdfRender({
    value,
    schema: textOnlySchema,
    ...rest,
  });
};
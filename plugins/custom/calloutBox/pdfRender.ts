import { PDFRenderProps } from "@pdfme/common";
import type { CalloutBoxSchema } from "./types";
import { pdfRender as textPdfRender } from "../../base/text/pdfRender";
import { pdfRender as rectanglePdfRender } from "../../base/graphics/rectangle/pdfRender";
import { pdfRender as svgPdfRender } from "../../base/graphics/svg/pdfRender";

/**
 * PDF rendering function for CalloutBox plugin
 * Renders layered elements: background → icon → title → body
 */
export const pdfRender = async (arg: PDFRenderProps<CalloutBoxSchema>) => {
  const { schema, ...rest } = arg;

  // Calculate layout positions for PDF
  const layout = calculatePDFLayout(schema);

  // Layer 1: Render Background Rectangle
  await renderBackground({ ...rest, schema, layout });

  // Layer 2: Render Icon
  await renderIcon({ ...rest, schema, layout });

  // Layer 3: Render Title Text
  await renderTitle({ ...rest, schema, layout });

  // Layer 4: Render Body Text
  await renderBody({ ...rest, schema, layout });
};

/**
 * Calculate layout positions for PDF rendering
 */
function calculatePDFLayout(schema: CalloutBoxSchema) {
  const { layout, position } = schema;

  return {
    // Background covers the entire schema area
    backgroundX: position.x,
    backgroundY: position.y,
    backgroundWidth: schema.width,
    backgroundHeight: schema.height,

    // Icon position (top-left with padding)
    iconX: position.x + layout.padding,
    iconY: position.y + layout.padding,

    // Title position (next to icon)
    titleX: position.x + layout.padding + layout.iconSize + layout.spacingAfterIcon,
    titleY: position.y + layout.padding,
    titleWidth: schema.width - (layout.padding * 2) - layout.iconSize - layout.spacingAfterIcon,

    // Body position (below title, full width minus padding)
    bodyX: position.x + layout.padding,
    bodyY: position.y + layout.padding + calculateTitleHeight(schema) + layout.spacingAfterTitle,
    bodyWidth: schema.width - (layout.padding * 2),
    bodyHeight: schema.height - layout.padding - calculateTitleHeight(schema) - layout.spacingAfterTitle - layout.padding,
  };
}

/**
 * Render the background rectangle
 */
async function renderBackground(arg: PDFRenderProps<CalloutBoxSchema> & { layout: ReturnType<typeof calculatePDFLayout> }) {
  const { schema, layout, ...rest } = arg;

  await rectanglePdfRender({
    ...rest,
    value: '', // Rectangle doesn't use content value
    schema: {
      type: 'rectangle',
      id: `bg-${schema.id}`,
      name: `bg-${schema.id}`,
      position: {
        x: layout.backgroundX,
        y: layout.backgroundY,
      },
      width: layout.backgroundWidth,
      height: layout.backgroundHeight,
      color: schema.backgroundColor,
      borderColor: schema.borderColor,
      borderWidth: schema.borderWidth,
      radius: schema.radius,
    },
  });
}

/**
 * Render the icon SVG
 */
async function renderIcon(arg: PDFRenderProps<CalloutBoxSchema> & { layout: ReturnType<typeof calculatePDFLayout> }) {
  const { schema, layout, ...rest } = arg;

  await svgPdfRender({
    ...rest,
    value: schema.icon,
    schema: {
      type: 'svg',
      id: `icon-${schema.id}`,
      name: `icon-${schema.id}`,
      position: {
        x: layout.iconX,
        y: layout.iconY,
      },
      width: schema.layout.iconSize,
      height: schema.layout.iconSize,
    },
  });
}

/**
 * Render the title text
 */
async function renderTitle(arg: PDFRenderProps<CalloutBoxSchema> & { layout: ReturnType<typeof calculatePDFLayout> }) {
  const { schema, layout, ...rest } = arg;

  await textPdfRender({
    ...rest,
    value: schema.title,
    schema: {
      ...schema.titleStyle,
      type: 'text',
      id: `title-${schema.id}`,
      name: `title-${schema.id}`,
      position: {
        x: layout.titleX,
        y: layout.titleY,
      },
      width: layout.titleWidth,
      height: calculateTitleHeight(schema),
    },
  });
}

/**
 * Render the body text
 */
async function renderBody(arg: PDFRenderProps<CalloutBoxSchema> & { layout: ReturnType<typeof calculatePDFLayout> }) {
  const { schema, layout, ...rest } = arg;

  await textPdfRender({
    ...rest,
    value: schema.body,
    schema: {
      ...schema.bodyStyle,
      type: 'text',
      id: `body-${schema.id}`,
      name: `body-${schema.id}`,
      position: {
        x: layout.bodyX,
        y: layout.bodyY,
      },
      width: layout.bodyWidth,
      height: layout.bodyHeight,
    },
  });
}

/**
 * Estimate title height based on content and styling
 * This is a simplified calculation for PDF layout
 */
function calculateTitleHeight(schema: CalloutBoxSchema): number {
  const fontSize = schema.titleStyle?.fontSize || 12;
  const lineHeight = fontSize * 1.2;
  
  // Rough estimation - you'd need proper text measurement for production
  const titleWidth = schema.width - (schema.layout.padding * 2) - schema.layout.iconSize - schema.layout.spacingAfterIcon;
  const charsPerLine = Math.floor(titleWidth * 2.5 / fontSize); // Rough approximation
  const lines = Math.max(1, Math.ceil(schema.title.length / charsPerLine));
  
  return Math.max(lines * lineHeight, schema.layout.iconSize); // At least as tall as icon
}
// REFACTORED: 2025-01-07 - Enhanced PDF rendering with manual rich text simulation

import { PDFFont, PDFDocument } from '@pdfme/pdf-lib';
import type { Font as FontKitFont } from 'fontkit';
import type { TextSchema } from './types/enhanced';
import {
  PDFRenderProps,
  ColorType,
  Font,
  getDefaultFont,
  getFallbackFontName,
  mm2pt,
} from '@pdfme/common';

// Import refactored modules
import {
  calculateDynamicFontSize,
  heightOfFontAtSize,
  getFontDescentInPt,
  getFontKitFont,
  widthOfTextAtSize,
  splitTextToSize,
} from './helper';

import {
  VERTICAL_ALIGN_TOP,
  VERTICAL_ALIGN_MIDDLE,
  VERTICAL_ALIGN_BOTTOM,
  DEFAULT_FONT_SIZE,
  DEFAULT_ALIGNMENT,
  DEFAULT_VERTICAL_ALIGNMENT,
  DEFAULT_LINE_HEIGHT,
  DEFAULT_CHARACTER_SPACING,
  DEFAULT_FONT_COLOR,
} from './constants';

import { convertForPdfLayoutProps, rotatePoint, hex2PrintingColor } from '../utils';

/**
 * CRITICAL: Font Embedding and Caching System
 * 
 * Performance optimization: Cache embedded PDF fonts to avoid re-processing
 * This is essential for performance when rendering multiple text elements
 */
const embedAndGetFontObj = async (arg: {
  pdfDoc: PDFDocument;
  font: Font;
  _cache: Map<PDFDocument, { [key: string]: PDFFont }>;
}) => {
  const { pdfDoc, font, _cache } = arg;
  
  if (_cache.has(pdfDoc)) {
    return _cache.get(pdfDoc) as { [key: string]: PDFFont };
  }

  const fontValues = await Promise.all(
    Object.values(font).map(async (v) => {
      let fontData = v.data;
      if (typeof fontData === 'string' && fontData.startsWith('http')) {
        fontData = await fetch(fontData).then((res) => res.arrayBuffer());
      }
      return pdfDoc.embedFont(fontData, {
        subset: typeof v.subset === 'undefined' ? true : v.subset,
      });
    }),
  );

  const fontObj = Object.keys(font).reduce(
    (acc, cur, i) => Object.assign(acc, { [cur]: fontValues[i] }),
    {} as { [key: string]: PDFFont },
  );

  _cache.set(pdfDoc, fontObj);
  return fontObj;
};

/**
 * Get font properties with dynamic sizing support
 */
const getFontProp = ({
  value,
  fontKitFont,
  schema,
  colorType,
}: {
  value: string;
  fontKitFont: FontKitFont;
  colorType?: ColorType;
  schema: TextSchema;
}) => {
  const fontSize = schema.dynamicFontSize
    ? calculateDynamicFontSize({ textSchema: schema, fontKitFont, value })
    : (schema.fontSize ?? DEFAULT_FONT_SIZE);
  const color = hex2PrintingColor(schema.fontColor || DEFAULT_FONT_COLOR, colorType);

  return {
    alignment: schema.alignment ?? DEFAULT_ALIGNMENT,
    verticalAlignment: schema.verticalAlignment ?? DEFAULT_VERTICAL_ALIGNMENT,
    lineHeight: schema.lineHeight ?? DEFAULT_LINE_HEIGHT,
    characterSpacing: schema.characterSpacing ?? DEFAULT_CHARACTER_SPACING,
    fontSize,
    color,
  };
};

/**
 * MAIN PDF RENDER FUNCTION WITH EXTENSION SUPPORT
 * 
 * Enhanced PDF rendering with optional extension system integration.
 * Falls back to original behavior if extensions are not available.
 * 
 * Key Features:
 * - Manual Rich Text Simulation (strikethrough/underline via drawLine)
 * - Justify Alignment Implementation with character spacing
 * - Precise coordinate system conversion (UI top-left ↔ PDF bottom-left)
 * - Advanced rotation handling with pivot points
 */
export const pdfRender = async (arg: PDFRenderProps<TextSchema>) => {
  // TRY EXTENSION-ENHANCED RENDERING FIRST
  try {
    const { enhancePDFRender, areExtensionsEnabled } = await import('./extensions/integration');
    
    if (areExtensionsEnabled()) {
      // Use extension-enhanced rendering
      await enhancePDFRender(originalPDFRender, arg);
      return;
    }
  } catch (error) {
    console.debug('Extension system not available for PDF render, using original:', error);
  }
  
  // FALLBACK TO ORIGINAL RENDERING
  await originalPDFRender(arg);
};

/**
 * ORIGINAL PDF RENDER IMPLEMENTATION
 * 
 * This is the original implementation that works without extensions.
 * Kept as a separate function to ensure clean fallback behavior.
 */
const originalPDFRender = async (arg: PDFRenderProps<TextSchema>) => {
  const { value, pdfDoc, pdfLib, page, options, schema, _cache } = arg;
  if (!value) return;

  const { font = getDefaultFont(), colorType } = options;

  // Get fonts and font properties
  const [pdfFontObj, fontKitFont] = await Promise.all([
    embedAndGetFontObj({
      pdfDoc,
      font,
      _cache: _cache as unknown as Map<PDFDocument, { [key: string]: PDFFont }>,
    }),
    getFontKitFont(schema.fontName, font, _cache as Map<string, FontKitFont>),
  ]);
  
  const fontProp = getFontProp({ value, fontKitFont, schema, colorType });
  const { fontSize, color, alignment, verticalAlignment, lineHeight, characterSpacing } = fontProp;

  const fontName = (
    schema.fontName ? schema.fontName : getFallbackFontName(font)
  ) as keyof typeof pdfFontObj;
  const pdfFontValue = pdfFontObj && pdfFontObj[fontName];

  // CRITICAL: Coordinate System Conversion (UI top-left ↔ PDF bottom-left)
  const pageHeight = page.getHeight();
  const {
    width,
    height,
    rotate,
    position: { x, y },
    opacity,
  } = convertForPdfLayoutProps({ schema, pageHeight, applyRotateTranslate: false });

  // Background rendering
  if (schema.backgroundColor) {
    const backgroundColor = hex2PrintingColor(schema.backgroundColor, colorType);
    page.drawRectangle({ x, y, width, height, rotate, color: backgroundColor });
  }

  // Font metrics calculations for positioning
  const firstLineTextHeight = heightOfFontAtSize(fontKitFont, fontSize);
  const descent = getFontDescentInPt(fontKitFont, fontSize);
  const halfLineHeightAdjustment = lineHeight === 0 ? 0 : ((lineHeight - 1) * fontSize) / 2;

  // Split text into lines with advanced wrapping
  const lines = splitTextToSize({
    value,
    characterSpacing,
    fontSize,
    fontKitFont,
    boxWidthInPt: width,
  });

  // CRITICAL: Vertical Alignment Calculations
  // Text lines are rendered from the bottom upwards, we need to adjust the position down
  let yOffset = 0;
  if (verticalAlignment === VERTICAL_ALIGN_TOP) {
    yOffset = firstLineTextHeight + halfLineHeightAdjustment;
  } else {
    const otherLinesHeight = lineHeight * fontSize * (lines.length - 1);

    if (verticalAlignment === VERTICAL_ALIGN_BOTTOM) {
      yOffset = height - otherLinesHeight + descent - halfLineHeightAdjustment;
    } else if (verticalAlignment === VERTICAL_ALIGN_MIDDLE) {
      yOffset =
        (height - otherLinesHeight - firstLineTextHeight + descent) / 2 + firstLineTextHeight;
    }
  }

  // Rotation pivot point for consistent UI-PDF alignment
  const pivotPoint = { x: x + width / 2, y: pageHeight - mm2pt(schema.position.y) - height / 2 };
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

  // Render each line with comprehensive formatting
  lines.forEach((line, rowIndex) => {
    const trimmed = line.replace('\n', '');
    const textWidth = widthOfTextAtSize(trimmed, fontKitFont, fontSize, characterSpacing);
    const textHeight = heightOfFontAtSize(fontKitFont, fontSize);
    const rowYOffset = lineHeight * fontSize * rowIndex;

    // Adobe Acrobat Reader shows an error if `drawText` is called with an empty text
    if (line === '') {
      line = '\r\n';
    }

    // CRITICAL: Horizontal Alignment Implementation
    let xLine = x;
    if (alignment === 'center') {
      xLine += (width - textWidth) / 2;
    } else if (alignment === 'right') {
      xLine += width - textWidth;
    }

    let yLine = pageHeight - mm2pt(schema.position.y) - yOffset - rowYOffset;

    // CRITICAL: Manual Rich Text Simulation
    // Draw strikethrough manually using drawLine
    if (schema.strikethrough && textWidth > 0) {
      const _x = xLine + textWidth + 1;
      const _y = yLine + textHeight / 3;
      page.drawLine({
        start: rotatePoint({ x: xLine, y: _y }, pivotPoint, rotate.angle),
        end: rotatePoint({ x: _x, y: _y }, pivotPoint, rotate.angle),
        thickness: (1 / 12) * fontSize,
        color: color,
        opacity,
      });
    }

    // Draw underline manually using drawLine
    if (schema.underline && textWidth > 0) {
      const _x = xLine + textWidth + 1;
      const _y = yLine - textHeight / 12;
      page.drawLine({
        start: rotatePoint({ x: xLine, y: _y }, pivotPoint, rotate.angle),
        end: rotatePoint({ x: _x, y: _y }, pivotPoint, rotate.angle),
        thickness: (1 / 12) * fontSize,
        color: color,
        opacity,
      });
    }

    // Handle rotation with pivot point translation
    if (rotate.angle !== 0) {
      // As we draw each line individually from different points, we must translate each lines position
      // relative to the UI rotation pivot point. see comments in convertForPdfLayoutProps() for more info.
      const rotatedPoint = rotatePoint({ x: xLine, y: yLine }, pivotPoint, rotate.angle);
      xLine = rotatedPoint.x;
      yLine = rotatedPoint.y;
    }

    // CRITICAL: Justify Alignment Implementation
    // Custom character spacing calculation for justified text
    let spacing = characterSpacing;
    if (alignment === 'justify' && line.slice(-1) !== '\n') {
      // if alignment is `justify` but the end of line is not newline, then adjust the spacing
      const iterator = segmenter.segment(trimmed)[Symbol.iterator]();
      const len = Array.from(iterator).length;
      if (len > 1) { // Avoid division by zero
        spacing += (width - textWidth) / (len - 1);
      }
    }
    
    // Apply character spacing to PDF
    page.pushOperators(pdfLib.setCharacterSpacing(spacing));

    // Render the text line
    page.drawText(trimmed, {
      x: xLine,
      y: yLine,
      rotate,
      size: fontSize,
      color,
      lineHeight: lineHeight * fontSize,
      font: pdfFontValue,
      opacity,
    });
  });
};

/**
 * PERFORMANCE MONITORING for PDF operations
 */
export const measurePdfRenderPerformance = async (
  renderFunction: () => Promise<void>,
  context: string
): Promise<void> => {
  const start = performance.now();
  await renderFunction();
  const end = performance.now();
  
  if (end - start > 50) { // Log slow PDF operations
    console.warn(`Slow PDF render: ${context} took ${end - start}ms`);
  }
};

/**
 * VALIDATION helpers for PDF rendering
 */
export const validatePdfRenderParams = (arg: PDFRenderProps<TextSchema>): boolean => {
  const { value, pdfDoc, page, schema } = arg;
  
  if (!value || !pdfDoc || !page || !schema) {
    console.error('Missing required PDF render parameters');
    return false;
  }
  
  if (schema.fontSize <= 0) {
    console.error('Invalid font size for PDF rendering');
    return false;
  }
  
  return true;
};

/**
 * ERROR HANDLING wrapper for PDF rendering
 */
export const safePdfRender = async (arg: PDFRenderProps<TextSchema>): Promise<void> => {
  try {
    if (!validatePdfRenderParams(arg)) {
      throw new Error('Invalid PDF render parameters');
    }
    
    await measurePdfRenderPerformance(
      () => pdfRender(arg),
      `Text render for schema ${arg.schema.id || 'unknown'}`
    );
  } catch (error) {
    console.error('PDF render error:', error);
    // Optionally render error indicator
    const { page, schema } = arg;
    const pageHeight = page.getHeight();
    const { x, y, width, height } = convertForPdfLayoutProps({ 
      schema, 
      pageHeight, 
      applyRotateTranslate: false 
    });
    
    // Draw error rectangle
    page.drawRectangle({
      x,
      y,
      width,
      height,
      color: { r: 1, g: 0, b: 0 }, // Red
      opacity: 0.3,
    });
  }
};
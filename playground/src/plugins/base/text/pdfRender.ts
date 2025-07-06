import { PDFFont, PDFDocument } from "@pdfme/pdf-lib";
import type { Font as FontKitFont } from "fontkit";
import type { TextSchema } from "./types";
import {
  PDFRenderProps,
  ColorType,
  Font,
  getDefaultFont,
  getFallbackFontName,
  mm2pt,
} from "@pdfme/common";
import {
  DEFAULT_FONT_SIZE,
  DEFAULT_ALIGNMENT,
  DEFAULT_VERTICAL_ALIGNMENT,
  DEFAULT_LINE_HEIGHT,
  DEFAULT_CHARACTER_SPACING,
  DEFAULT_FONT_COLOR,
} from "./constants";
import { calculateDynamicFontSize, getFontKitFont, heightOfFontAtSize, getFontDescentInPt, widthOfTextAtSize, wrapText } from './helper';
import {
  convertForPdfLayoutProps,
  rotatePoint,
  hex2PrintingColor,
} from "../../utils";

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
      if (typeof fontData === "string" && fontData.startsWith("http")) {
        fontData = await fetch(fontData).then((res) => res.arrayBuffer());
      }
      return pdfDoc.embedFont(fontData, {
        subset: typeof v.subset === "undefined" ? true : v.subset,
      });
    })
  );

  const fontObj = Object.keys(font).reduce(
    (acc, cur, i) => Object.assign(acc, { [cur]: fontValues[i] }),
    {} as { [key: string]: PDFFont }
  );

  _cache.set(pdfDoc, fontObj);
  return fontObj;
};

const getFontProp = async ({
  value,
  fontKitFont,
  schema,
  colorType,
  width,
  height,
}: {
  value: string;
  fontKitFont: FontKitFont;
  colorType?: ColorType;
  schema: TextSchema;
  width: number;
  height: number;
}) => {
  const fontSize = schema.dynamicFontSize
    ? (await calculateDynamicFontSize({ textSchema: schema, fontKitFont, value, containerDimensions: { width: width, height: height } })).fontSize
    : schema.fontSize ?? DEFAULT_FONT_SIZE;
  const color = hex2PrintingColor(
    schema.fontColor || DEFAULT_FONT_COLOR,
    colorType
  );

  return {
    alignment: schema.alignment ?? DEFAULT_ALIGNMENT,
    verticalAlignment: schema.verticalAlignment ?? DEFAULT_VERTICAL_ALIGNMENT,
    lineHeight: schema.lineHeight ?? DEFAULT_LINE_HEIGHT,
    characterSpacing: schema.characterSpacing ?? DEFAULT_CHARACTER_SPACING,
    fontSize,
    color,
  };
};

export const pdfRender = async (arg: PDFRenderProps<TextSchema>) => {
  const { value, pdfDoc, pdfLib, page, options, schema, _cache } = arg;
  if (!value) return;

  const { font = getDefaultFont(), colorType } = options;

  // Get the layout properties from the schema
  const { width, height } = convertForPdfLayoutProps({
    schema,
    pageHeight: page.getHeight(),
    applyRotateTranslate: false,
  });

  // Get the PDF font object
  const pdfFontObj = await embedAndGetFontObj({
    pdfDoc,
    font,
    _cache: _cache as unknown as Map<PDFDocument, { [key: string]: PDFFont }>,
  });
  
  // Try to load the specified font, fall back to Helvetica if it fails
  let fontName = schema.fontName || 'Helvetica';
  let fontKitFont;
  
  try {
    // Check if the font exists in the font object
    if (!font[fontName]) {
      console.warn(`Font "${fontName}" not found in font object, falling back to Helvetica`);
      fontName = 'Helvetica';
    }
    
    fontKitFont = await getFontKitFont(
      font[fontName].data,
      fontName
    );
  } catch (error) {
    console.warn(`Failed to load font "${fontName}", falling back to Helvetica:`, error);
    // Fall back to Helvetica
    fontName = 'Helvetica';
    fontKitFont = await getFontKitFont(
      font[fontName].data,
      fontName
    );
  }
  const fontProp = await getFontProp({ value, fontKitFont, schema, colorType, width, height });

  const {
    fontSize,
    color,
    alignment,
    verticalAlignment,
    lineHeight,
    characterSpacing,
  } = fontProp;

  // Use the fontName we've already validated and potentially fallen back from
  const pdfFontValue = pdfFontObj && pdfFontObj[fontName];

  const pageHeight = page.getHeight();
  
  // Extract position and rotation from schema
  const x = schema.position.x;
  const y = pageHeight - mm2pt(schema.position.y) - height;
  // Create a proper rotation object for pdf-lib
  const rotationAngle = Number(schema.rotation || 0);
  // Import the degrees function from pdf-lib
  const { degrees } = pdfLib;
  const rotate = rotationAngle ? degrees(Number(rotationAngle) * 180 / Math.PI) : undefined;
  const opacity = schema.opacity !== undefined ? schema.opacity : 1;

  if (schema.backgroundColor) {
    const bgColor = hex2PrintingColor(schema.backgroundColor, colorType);
    page.drawRectangle({ x, y, width, height, rotate, color: bgColor });
  }

  const firstLineTextHeight = heightOfFontAtSize(fontKitFont, fontSize);
  const descent = getFontDescentInPt(fontKitFont, fontSize);
  const halfLineHeightAdjustment =
    lineHeight === 0 ? 0 : ((lineHeight - 1) * fontSize) / 2;

  const lines = (await wrapText(value, {
    font: fontKitFont,
    fontSize,
    characterSpacing,
    boxWidth: width,
  }, schema.lineWrapping)).lines;

  // Text lines are rendered from the bottom upwards, we need to adjust the position down
  let yOffset = 0;
  if (verticalAlignment === "top") {
    yOffset = firstLineTextHeight + halfLineHeightAdjustment;
  } else {
    const otherLinesHeight = lineHeight * fontSize * (lines.length - 1);

    if (verticalAlignment === "bottom") {
      yOffset = height - otherLinesHeight + descent - halfLineHeightAdjustment;
    } else if (verticalAlignment === "middle") {
      yOffset =
        (height - otherLinesHeight - firstLineTextHeight + descent) / 2 +
        firstLineTextHeight;
    }
  }

  const pivotPoint = {
    x: x + width / 2,
    y: pageHeight - mm2pt(schema.position.y) - height / 2,
  };
  const segmenter = typeof Intl.Segmenter !== 'undefined' ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : undefined;

  lines.forEach((line, rowIndex) => {
    const trimmed = line.replace("\n", "");
    const textWidth = widthOfTextAtSize(
      trimmed,
      fontKitFont,
      fontSize,
      characterSpacing
    );
    const textHeight = heightOfFontAtSize(fontKitFont, fontSize);
    const rowYOffset = lineHeight * fontSize * rowIndex;

    // Adobe Acrobat Reader shows an error if `drawText` is called with an empty text
    if (line === "") {
      // return; // this also works
      line = "\r\n";
    }

    let xLine = x;
    if (alignment === "center") {
      xLine += (width - textWidth) / 2;
    } else if (alignment === "right") {
      xLine += width - textWidth;
    }

    let yLine = pageHeight - mm2pt(schema.position.y) - yOffset - rowYOffset;

    // Convert rotation angle from radians to degrees for rotatePoint
    const rotationDegrees = rotationAngle ? Number(rotationAngle) * 180 / Math.PI : 0;

    // draw strikethrough
    if (schema.strikethrough && textWidth > 0) {
      const _x = xLine + textWidth + 1;
      const _y = yLine + textHeight / 3;
      page.drawLine({
        start: rotatePoint({ x: xLine, y: _y }, pivotPoint, rotationDegrees),
        end: rotatePoint({ x: _x, y: _y }, pivotPoint, rotationDegrees),
        thickness: (1 / 12) * fontSize,
        color: color,
        opacity: opacity,
      });
    }

    // draw underline
    if (schema.underline && textWidth > 0) {
      const _x = xLine + textWidth + 1;
      const _y = yLine - textHeight / 12;
      page.drawLine({
        start: rotatePoint({ x: xLine, y: _y }, pivotPoint, rotationDegrees),
        end: rotatePoint({ x: _x, y: _y }, pivotPoint, rotationDegrees),
        thickness: (1 / 12) * fontSize,
        color: color,
        opacity: opacity,
      });
    }

    if (rotationAngle !== 0) {
      // As we draw each line individually from different points, we must translate each lines position
      // relative to the UI rotation pivot point. see comments in convertForPdfLayoutProps() for more info.
      const rotatedPoint = rotatePoint(
        { x: xLine, y: yLine },
        pivotPoint,
        rotationDegrees
      );
      xLine = rotatedPoint.x;
      yLine = rotatedPoint.y;
    }

    let spacing = characterSpacing;
    if (alignment === "justify" && line.slice(-1) !== "\n" && segmenter) {
      // if alignment is `justify` but the end of line is not newline, then adjust the spacing
      const iterator = segmenter.segment(trimmed)[Symbol.iterator]();
      const len = Array.from(iterator).length;
      spacing += (width - textWidth) / len;
    }
    page.pushOperators(pdfLib.setCharacterSpacing(spacing));

    page.drawText(trimmed, {
      x: xLine,
      y: yLine,
      rotate: rotate,
      size: fontSize,
      color,
      lineHeight: lineHeight * fontSize,
      font: pdfFontValue,
      opacity: opacity,
    });
  });
};

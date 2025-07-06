import { PDFRenderProps, mm2pt } from "@pdfme/common";
import { toRadians } from "@pdfme/pdf-lib";
import { convertForPdfLayoutProps, hex2PrintingColor } from "../../../utils";

/**
 * Rectangle schema interface
 */
export interface RectangleSchema {
  type: "rectangle";
  position: { x: number; y: number };
  width: number;
  height: number;
  rotate?: number;
  opacity?: number;
  borderWidth?: number;
  borderColor?: string;
  color?: string;
  radius?: number;
}

/**
 * PDF rendering function for Rectangle plugin
 * Extracted from the shapes/rectAndEllipse.ts implementation
 */
export const pdfRender = (arg: PDFRenderProps<RectangleSchema>) => {
  const { schema, page, options } = arg;
  if (!schema.color && !schema.borderColor) return;
  
  const { colorType } = options;
  const pageHeight = page.getHeight();
  const cArg = { schema, pageHeight };
  const { position, width, height, rotate, opacity } = convertForPdfLayoutProps(cArg);
  const borderWidth = schema.borderWidth ? mm2pt(schema.borderWidth) : 0;

  const drawOptions = {
    rotate,
    borderWidth,
    borderColor: schema.borderColor ? hex2PrintingColor(schema.borderColor, colorType) : undefined,
    color: schema.color ? hex2PrintingColor(schema.color, colorType) : undefined,
    opacity,
    borderOpacity: opacity,
  };

  const radius = schema.radius ?? 0;

  page.drawRectangle({
    x:
      position.x +
      borderWidth * ((1 - Math.sin(toRadians(rotate.angle || 0))) / 2) +
      Math.tan(toRadians(rotate.angle || 0)) * Math.PI ** 2,
    y:
      position.y +
      borderWidth * ((1 + Math.sin(toRadians(rotate.angle || 0))) / 2) +
      Math.tan(toRadians(rotate.angle || 0)) * Math.PI ** 2,
    width: width - borderWidth,
    height: height - borderWidth,
    ...(radius ? { radius: mm2pt(radius) } : {}),
    ...drawOptions,
  });
};
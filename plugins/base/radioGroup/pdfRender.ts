import { PDFRenderProps } from "@pdfme/common";
import svg from "../graphics/svg";
import { getIcon } from "./utils";
import { RadioGroup } from "./types";

/**
 * PDF rendering function for RadioGroup plugin
 * 
 * This function handles the rendering of radio button icons in PDF documents.
 * It delegates the actual SVG rendering to the svg plugin while providing
 * the appropriate icon based on the radio button's current state.
 * 
 * @param arg - PDF render properties containing schema, value, and rendering context
 * @returns Promise that resolves when the radio button is rendered to PDF
 */
export const pdfRender = (arg: PDFRenderProps<RadioGroup>) => {
  const { value, schema } = arg;
  
  // Generate the appropriate SVG icon based on current state and color
  const iconSvg = getIcon({ value, color: schema.color });
  
  // Delegate to svg plugin for actual PDF rendering
  return svg.pdf(
    Object.assign(arg, {
      value: iconSvg,
    })
  );
};
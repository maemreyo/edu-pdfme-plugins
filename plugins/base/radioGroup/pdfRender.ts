import { PDFRenderProps } from "@pdfme/common";
import svg from "../graphics/svg";
import { getIcon } from "./utils";
import { RadioGroup } from "./index";

/**
 * PDF rendering function for RadioGroup plugin
 * This is a wrapper around the svg plugin's PDF rendering function
 */
export const pdfRender = (arg: PDFRenderProps<RadioGroup>) => {
  const { value, schema } = arg;
  
  return svg.pdf(
    Object.assign(arg, {
      value: getIcon({ value, color: schema.color }),
    })
  );
};
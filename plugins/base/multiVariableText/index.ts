import type { Plugin } from "@pdfme/common";
import { pdfRender } from "./pdfRender";
import { propPanel } from "./propPanel";
import { uiRender } from "./uiRender";
import type { MultiVariableTextSchema } from "./types";
import { Type } from "lucide";
import { createSvgStr } from "../../utils";

const schema: Plugin<MultiVariableTextSchema> = {
  pdf: pdfRender,
  ui: uiRender,
  propPanel,
  icon: createSvgStr(Type),
  uninterruptedEditMode: true,
};
export default schema;

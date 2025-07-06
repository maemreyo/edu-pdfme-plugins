import { Circle, CircleDot } from "lucide";
import { createSvgStr } from "../../utils";

const defaultStroke = "currentColor";

/**
 * Get the SVG icon for a radio button based on its state
 */
export const getCheckedIcon = (stroke = defaultStroke) =>
  createSvgStr(CircleDot, { stroke });

export const getUncheckedIcon = (stroke = defaultStroke) =>
  createSvgStr(Circle, { stroke });

/**
 * Get the appropriate icon based on the radio button's value and color
 */
export const getIcon = ({ value, color }: { value: string; color: string }) =>
  value === "true" ? getCheckedIcon(color) : getUncheckedIcon(color);
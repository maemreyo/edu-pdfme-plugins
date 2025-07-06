import { Circle, CircleDot } from "lucide";
import { createSvgStr } from "../../utils";
import { IconProps } from "./types";

const defaultStroke = "currentColor";

/**
 * Generate SVG string for a checked radio button (filled circle with dot)
 * 
 * @param stroke - The stroke color for the icon (defaults to currentColor)
 * @returns SVG string for checked radio button icon
 */
export const getCheckedIcon = (stroke = defaultStroke): string =>
  createSvgStr(CircleDot, { stroke });

/**
 * Generate SVG string for an unchecked radio button (empty circle)
 * 
 * @param stroke - The stroke color for the icon (defaults to currentColor)  
 * @returns SVG string for unchecked radio button icon
 */
export const getUncheckedIcon = (stroke = defaultStroke): string =>
  createSvgStr(Circle, { stroke });

/**
 * Get the appropriate radio button icon based on current state and color
 * 
 * This is the main utility function used by both UI and PDF rendering
 * to determine which icon should be displayed based on the radio button's value.
 * 
 * @param props - Object containing value and color properties
 * @param props.value - Current value of the radio button ("true" or "false")
 * @param props.color - Color to apply to the icon
 * @returns SVG string for the appropriate radio button icon
 */
export const getIcon = ({ value, color }: IconProps): string =>
  value === "true" ? getCheckedIcon(color) : getUncheckedIcon(color);
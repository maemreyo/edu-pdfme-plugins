import { UIRenderProps } from "@pdfme/common";
import svg from "../graphics/svg";
import { isEditable } from "../../utils";
import { RadioGroup } from "./types";
import { getIcon } from "./utils";
import { 
  registerRadioButton, 
  handleRadioSelection 
} from "./helper";

/**
 * UI rendering function for RadioGroup plugin
 * Handles the visual presentation and user interaction for radio buttons
 * 
 * @param arg - UI render properties containing schema, value, onChange, etc.
 */
export const uiRender = async (arg: UIRenderProps<RadioGroup>): Promise<void> => {
  const { schema, value, onChange, rootElement, mode } = arg;
  
  // Create main container element
  const container = document.createElement("div");
  container.style.width = "100%";
  container.style.height = "100%";

  // Register this radio button with the global state management system
  // This enables communication between radio buttons in the same group
  if (onChange) {
    registerRadioButton(schema.name, schema.group, { value, onChange });
  }

  // Set up click event handler for editable mode
  if (isEditable(mode, schema) && onChange) {
    container.addEventListener("click", () => {
      handleRadioSelection(schema.name, schema.group, value, onChange);
    });
  }

  // Delegate the actual visual rendering to the SVG plugin
  // We use 'viewer' mode to prevent the SVG plugin from adding its own interactions
  await svg.ui({
    ...arg,
    rootElement: container,
    mode: "viewer", // Force viewer mode to prevent SVG plugin interactions
    value: getIcon({ value, color: schema.color }), // Get appropriate icon based on state
  });

  // Append the container to the root element
  rootElement.appendChild(container);
};
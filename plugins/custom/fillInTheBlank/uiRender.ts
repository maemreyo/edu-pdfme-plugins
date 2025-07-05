import { getDefaultFont, UIRenderProps } from "@pdfme/common";
import type { FillInTheBlankSchema } from "./types";
import { 
  uiRender as parentUiRender,
  buildStyledTextContainer,
  makeElementPlainTextContentEditable,
} from "../../base/text/uiRender";
import { substituteVariables } from "../../base/multiVariableText/helper";
import { isEditable } from "../../utils";
import { getFontKitFont } from "../../base/text/helper";

/**
 * Main UI render function for FillInTheBlank plugin
 * Branches behavior based on mode: designer uses MVT, form uses custom styling
 */
export const uiRender = async (arg: UIRenderProps<FillInTheBlankSchema>) => {
  const { value, schema, rootElement, mode, onChange, ...rest } = arg;

  let text = schema.text;
  let numVariables = schema.variables.length;

  // If in form mode and has variables, use custom form rendering
  if (mode === "form" && numVariables > 0) {
    await formUiRenderForBlanks(arg);
    return;
  }

  // For designer mode or form mode without variables, delegate to parent
  await parentUiRender({
    value: isEditable(mode, schema) ? text : text, // Use text as-is for designer
    schema,
    mode: mode === "form" ? "viewer" : mode,
    rootElement,
    onChange: (changeArg: { key: string; value: unknown }) => {
      if (onChange) {
        onChange({ key: "text", value: changeArg.value });
      }
    },
    ...rest,
  });

  // Add keyup listener for designer mode to detect variable changes
  if (mode === "designer") {
    const textBlock = rootElement.querySelector(
      "#text-" + String(schema.id)
    ) as HTMLDivElement;
    
    if (textBlock) {
      textBlock.addEventListener("keyup", (event: KeyboardEvent) => {
        text = textBlock.textContent || "";
        if (keyPressShouldBeChecked(event)) {
          const newNumVariables = countUniqueVariableNames(text);
          if (numVariables !== newNumVariables) {
            if (onChange) {
              onChange({ key: "text", value: text });
            }
            numVariables = newNumVariables;
          }
        }
      });
    }
  }
};

/**
 * Custom form UI renderer that shows styled blank spaces for variables
 * Based on multiVariableText formUiRender but with custom styling
 */
const formUiRenderForBlanks = async (arg: UIRenderProps<FillInTheBlankSchema>) => {
  const {
    value,
    schema,
    rootElement,
    onChange,
    stopEditing,
    theme,
    _cache,
    options,
  } = arg;

  const rawText = schema.text;
  const blankStyle = schema.blankStyle || 'underline';

  // Remove outline from parent element since we'll style individual spans
  if (rootElement.parentElement) {
    rootElement.parentElement.style.outline = "";
  }

  // Parse existing variable values from JSON
  const variables: Record<string, string> = value
    ? (JSON.parse(value as string) as Record<string, string>)
    : {};

  // Get variable positions and substituted text
  const variableIndices = getVariableIndices(rawText);
  const substitutedText = substituteVariables(rawText, variables);
  const font = options?.font || getDefaultFont();
  const fontKitFont = await getFontKitFont(
    schema.fontName,
    font,
    _cache as Map<string, import("fontkit").Font>
  );

  // Build the base styled text container
  const textBlock = buildStyledTextContainer(arg, fontKitFont, substitutedText);

  // Clear and rebuild with custom editable spans for variables
  textBlock.innerHTML = '';
  
  let inVarString = false;

  for (let i = 0; i < rawText.length; i++) {
    if (variableIndices[i]) {
      inVarString = true;
      let span = document.createElement("span");
      
      // Apply custom styling based on blankStyle
      applyBlankStyle(span, blankStyle, theme);
      makeElementPlainTextContentEditable(span);
      span.textContent = variables[variableIndices[i]];
      
      span.addEventListener("blur", (e: Event) => {
        const newValue = (e.target as HTMLSpanElement).textContent || "";
        if (newValue !== variables[variableIndices[i]]) {
          variables[variableIndices[i]] = newValue;
          if (onChange)
            onChange({ key: "content", value: JSON.stringify(variables) });
          if (stopEditing) stopEditing();
        }
      });
      textBlock.appendChild(span);
    } else if (inVarString) {
      if (rawText[i] === "}") {
        inVarString = false;
      }
    } else {
      let span = document.createElement("span");
      span.style.letterSpacing = rawText.length === i + 1 ? "0" : "inherit";
      span.textContent = rawText[i];
      textBlock.appendChild(span);
    }
  }
};

/**
 * Get variable positions from text content
 * Returns object with index as key and variable name as value
 */
const getVariableIndices = (content: string) => {
  const regex = /\{([^}]+)}/g;
  const indices: Record<number, string> = {};
  let match;

  while ((match = regex.exec(content)) !== null) {
    indices[match.index] = match[1];
  }

  return indices;
};

/**
 * Count unique variable names in content
 */
const countUniqueVariableNames = (content: string) => {
  const regex = /\{([^}]+)}/g;
  const uniqueMatchesSet = new Set();
  let match;

  while ((match = regex.exec(content)) !== null) {
    uniqueMatchesSet.add(match[1]);
  }

  return uniqueMatchesSet.size;
};

/**
 * Optimize keypress checking to avoid unnecessary regex on every keypress
 */
const keyPressShouldBeChecked = (event: KeyboardEvent) => {
  if (
    event.key === "ArrowUp" ||
    event.key === "ArrowDown" ||
    event.key === "ArrowLeft" ||
    event.key === "ArrowRight"
  ) {
    return false;
  }

  const selection = window.getSelection();
  const contenteditable = event.target as HTMLDivElement;

  const isCursorAtEnd =
    selection?.focusOffset === contenteditable?.textContent?.length;
  if (isCursorAtEnd) {
    return (
      event.key === "}" || event.key === "Backspace" || event.key === "Delete"
    );
  }

  const isCursorAtStart = selection?.anchorOffset === 0;
  if (isCursorAtStart) {
    return (
      event.key === "{" || event.key === "Backspace" || event.key === "Delete"
    );
  }

  return true;
};

/**
 * Apply visual styling to blank spans based on the selected style
 */
function applyBlankStyle(span: HTMLSpanElement, style: 'underline' | 'box', theme: any) {
  // Common styles
  span.style.display = 'inline-block';
  span.style.minWidth = '50px';
  span.style.minHeight = '1em';
  span.style.textAlign = 'center';
  span.style.margin = '0 2px';
  span.style.verticalAlign = 'baseline';
  span.style.outline = 'none';

  if (style === 'box') {
    span.style.border = '1px solid #999';
    span.style.borderRadius = '3px';
    span.style.padding = '2px 6px';
    span.style.backgroundColor = '#fafafa';
  } else { // underline style
    span.style.borderBottom = '2px solid #333';
    span.style.paddingBottom = '1px';
  }

  // Focus styles
  span.addEventListener('focus', () => {
    if (style === 'box') {
      span.style.borderColor = theme?.colorPrimary || '#1890ff';
      span.style.backgroundColor = '#ffffff';
    } else {
      span.style.borderBottomColor = theme?.colorPrimary || '#1890ff';
    }
  });

  span.addEventListener('blur', () => {
    if (style === 'box') {
      span.style.borderColor = '#999';
      span.style.backgroundColor = '#fafafa';
    } else {
      span.style.borderBottomColor = '#333';
    }
  });
}
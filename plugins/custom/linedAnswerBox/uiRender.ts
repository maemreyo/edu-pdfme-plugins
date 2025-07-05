import { UIRenderProps } from "@pdfme/common";
import type { LinedAnswerBoxSchema } from "./types";
import { isEditable } from "../../utils";
import {
  calculateLinePositions,
  renderLines,
  validateSchema,
  createContainerStyles,
  createTextStyles,
  mmToPx,
} from "./helpers";

/**
 * Main UI render function for LinedAnswerBox plugin
 * Creates a multi-layer interface with guide lines and text overlay
 */
export const uiRender = async (arg: UIRenderProps<LinedAnswerBoxSchema>) => {
  const { value, schema, rootElement, mode, onChange } = arg;

  // Validate and correct schema values
  const validatedSchema = validateSchema(schema);

  // Calculate line positions
  const lineCalc = calculateLinePositions(validatedSchema);

  // Clear root element
  rootElement.innerHTML = '';

  // Create main container
  const container = document.createElement('div');
  container.className = 'lined-answer-box-container';
  
  // Apply container styles
  const containerStyles = createContainerStyles(validatedSchema);
  Object.assign(container.style, containerStyles);

  // Create lines background layer
  const linesLayer = document.createElement('div');
  linesLayer.className = 'lines-layer';
  linesLayer.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    pointer-events: none;
  `;

  // Render guide lines
  if (lineCalc.lineCount > 0) {
    renderLines({
      container: linesLayer,
      width: validatedSchema.width,
      height: validatedSchema.height,
      color: validatedSchema.lineColor,
      style: validatedSchema.lineStyle || 'solid',
      lineWidth: validatedSchema.lineWidth || 0.5,
      positions: lineCalc.linePositions,
    });
  }

  // Create text overlay layer
  let textElement: HTMLElement;
  
  if (isEditable(mode, validatedSchema)) {
    // Create textarea for editable modes
    textElement = document.createElement('textarea');
    const textarea = textElement as HTMLTextAreaElement;
    
    textarea.value = (value as string) || '';
    textarea.placeholder = 'Enter your answer here...';
    
    // Handle text changes
    textarea.addEventListener('input', (e) => {
      const target = e.target as HTMLTextAreaElement;
      if (onChange) {
        onChange({ key: 'content', value: target.value });
      }
    });

    // Prevent default textarea resize
    textarea.style.resize = 'none';
    
  } else {
    // Create div for non-editable modes
    textElement = document.createElement('div');
    textElement.textContent = (value as string) || '';
  }

  // Apply text styles
  const textStyles = createTextStyles(validatedSchema);
  Object.assign(textElement.style, textStyles);
  
  // Add responsive text sizing based on container size
  textElement.style.width = `calc(100% - ${mmToPx(validatedSchema.padding * 2)}px)`;
  textElement.style.height = `calc(100% - ${mmToPx(validatedSchema.padding * 2)}px)`;

  // Special handling for different modes
  if (mode === 'designer') {
    // In designer mode, add visual feedback
    container.style.borderColor = '#007acc';
    container.style.borderWidth = '2px';
    
    // Add resize handles (if needed by pdfme framework)
    container.style.cursor = 'move';
  } else if (mode === 'form') {
    // In form mode, focus on text input
    container.style.borderColor = '#d9d9d9';
    textElement.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    
    // Add focus effects for textarea
    if (textElement.tagName === 'TEXTAREA') {
      textElement.addEventListener('focus', () => {
        container.style.borderColor = '#40a9ff';
        container.style.boxShadow = '0 0 0 2px rgba(24, 144, 255, 0.2)';
      });
      
      textElement.addEventListener('blur', () => {
        container.style.borderColor = '#d9d9d9';
        container.style.boxShadow = 'none';
      });
    }
  } else {
    // Viewer mode - minimal styling
    container.style.borderColor = 'transparent';
    textElement.style.backgroundColor = 'transparent';
  }

  // Assemble the layers
  container.appendChild(linesLayer);
  container.appendChild(textElement);
  rootElement.appendChild(container);

  // // Add debug info in development
  // if (process.env.NODE_ENV === 'development') {
  //   console.log('LinedAnswerBox rendered:', {
  //     mode,
  //     lineCount: lineCalc.lineCount,
  //     linePositions: lineCalc.linePositions,
  //     dimensions: { width: validatedSchema.width, height: validatedSchema.height },
  //   });
  // }
};

/**
 * Alternative rendering approach for complex layouts
 * Uses CSS Grid to align text with lines more precisely
 */
export const uiRenderWithGrid = async (arg: UIRenderProps<LinedAnswerBoxSchema>) => {
  const { value, schema, rootElement, mode, onChange } = arg;
  
  const validatedSchema = validateSchema(schema);
  const lineCalc = calculateLinePositions(validatedSchema);
  
  rootElement.innerHTML = '';
  
  // Create CSS Grid container
  const container = document.createElement('div');
  container.className = 'lined-answer-box-grid';
  
  // Calculate grid rows based on line positions
  const gridRows = lineCalc.linePositions.map((_, index) => 
    `${validatedSchema.lineSpacing}mm`
  ).join(' ');
  
  container.style.cssText = `
    display: grid;
    grid-template-rows: ${gridRows};
    width: ${mmToPx(validatedSchema.width)}px;
    height: ${mmToPx(validatedSchema.height)}px;
    border: 1px solid #ddd;
    position: relative;
    padding: ${mmToPx(validatedSchema.padding)}px;
    background: linear-gradient(
      transparent calc(${validatedSchema.lineSpacing}mm - 1px),
      ${validatedSchema.lineColor} calc(${validatedSchema.lineSpacing}mm - 1px),
      ${validatedSchema.lineColor} ${validatedSchema.lineSpacing}mm,
      transparent ${validatedSchema.lineSpacing}mm
    );
    background-size: 100% ${validatedSchema.lineSpacing}mm;
  `;
  
  // Create text input spanning all grid rows
  const textElement = isEditable(mode, validatedSchema) 
    ? document.createElement('textarea')
    : document.createElement('div');
    
  textElement.style.cssText = `
    grid-row: 1 / -1;
    grid-column: 1;
    background: transparent;
    border: none;
    outline: none;
    resize: none;
    font-family: ${validatedSchema.fontName || 'Arial'};
    font-size: ${Math.floor(mmToPx(validatedSchema.lineSpacing) * 0.6)}px;
    line-height: ${mmToPx(validatedSchema.lineSpacing)}px;
    padding: 0;
    margin: 0;
    width: 100%;
    height: 100%;
  `;
  
  if (textElement.tagName === 'TEXTAREA') {
    const textarea = textElement as HTMLTextAreaElement;
    textarea.value = (value as string) || '';
    textarea.addEventListener('input', (e) => {
      if (onChange) {
        onChange({ key: 'content', value: (e.target as HTMLTextAreaElement).value });
      }
    });
  } else {
    textElement.textContent = (value as string) || '';
  }
  
  container.appendChild(textElement);
  rootElement.appendChild(container);
};
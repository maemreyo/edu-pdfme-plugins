import type { TextSchema } from '../../base/text/types';

/**
 * Schema interface for LinedAnswerBox plugin
 * Extends TextSchema with line-specific properties for creating essay answer boxes
 */
export interface LinedAnswerBoxSchema extends TextSchema {
  /**
   * Spacing between horizontal guide lines in mm
   * @default 8
   */
  lineSpacing: number;
  
  /**
   * Color of the horizontal guide lines
   * @default '#CCCCCC'
   */
  lineColor: string;
  
  /**
   * Padding inside the box (top, right, bottom, left) in mm
   * @default 5
   */
  padding: number;
  
  /**
   * Whether to show lines in PDF output
   * @default false
   */
  showLinesInPdf?: boolean;
  
  /**
   * Style of the lines
   * @default 'solid'
   */
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  
  /**
   * Thickness of the lines in points
   * @default 0.5
   */
  lineWidth?: number;
}

/**
 * Internal calculation result for line positioning
 */
export interface LineCalculation {
  /** Number of lines that fit in the box */
  lineCount: number;
  
  /** Y positions of each line relative to box top */
  linePositions: number[];
  
  /** Actual usable height after padding */
  usableHeight: number;
  
  /** Adjusted line spacing to fit lines perfectly */
  adjustedSpacing?: number;
}

/**
 * Configuration for rendering lines in the UI
 */
export interface LineRenderConfig {
  /** Container element to render lines into */
  container: HTMLElement;
  
  /** Box dimensions */
  width: number;
  height: number;
  
  /** Line styling */
  color: string;
  style: 'solid' | 'dashed' | 'dotted';
  lineWidth: number;
  
  /** Calculated line positions */
  positions: number[];
}
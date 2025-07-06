// REFACTORED: 2025-01-07 - Advanced line wrapping and text positioning logic

import type { Font as FontKitFont } from 'fontkit';
import { widthOfTextAtSize } from './fontMetrics';

/**
 * Font width calculation values for line breaking
 */
export interface FontWidthCalcValues {
  font: FontKitFont;
  fontSize: number;
  characterSpacing: number;
  boxWidthInPt: number;
}

/**
 * Check if text exceeds box width
 */
const isTextExceedingBoxWidth = (text: string, calcValues: FontWidthCalcValues): boolean => {
  const { font, fontSize, characterSpacing, boxWidthInPt } = calcValues;
  const textWidth = widthOfTextAtSize(text, font, fontSize, characterSpacing);
  return textWidth > boxWidthInPt;
};

/**
 * Incrementally checks the current line for its real length
 * and returns the position where it exceeds the box width.
 * Returns `null` to indicate if textLine is shorter than the available box.
 */
const getOverPosition = (textLine: string, calcValues: FontWidthCalcValues): number | null => {
  for (let i = 0; i <= textLine.length; i++) {
    if (isTextExceedingBoxWidth(textLine.slice(0, i + 1), calcValues)) {
      return i;
    }
  }
  return null;
};

/**
 * Line breakable chars depend on the language and writing system.
 * Western writing systems typically use spaces and hyphens as line breakable chars.
 * Other writing systems often break on word boundaries so the following
 * does not negatively impact them.
 * However, this might need to be revisited for broader language support.
 */
const isLineBreakableChar = (char: string): boolean => {
  const lineBreakableChars = [' ', '-', '\u2014', '\u2013'];
  return lineBreakableChars.includes(char);
};

/**
 * Gets the position of the split. Splits the exceeding line at
 * the last breakable char prior to it exceeding the bounding box width.
 */
const getSplitPosition = (textLine: string, calcValues: FontWidthCalcValues): number => {
  const overPos = getOverPosition(textLine, calcValues);
  if (overPos === null) return textLine.length; // input line is shorter than the available space

  if (textLine[overPos] === ' ') {
    // if the character immediately beyond the boundary is a space, split
    return overPos;
  }

  let overPosTmp = overPos - 1;
  while (overPosTmp >= 0) {
    if (isLineBreakableChar(textLine[overPosTmp])) {
      return overPosTmp + 1;
    }
    overPosTmp--;
  }

  // For very long lines with no breakable chars use the original overPos
  return overPos;
};

/**
 * Recursively splits the line at getSplitPosition.
 * If there is some leftover, split the rest again in the same manner.
 */
export const getSplittedLines = (textLine: string, calcValues: FontWidthCalcValues): string[] => {
  const splitPos = getSplitPosition(textLine, calcValues);
  const splittedLine = textLine.substring(0, splitPos).trimEnd();
  const rest = textLine.substring(splitPos).trimStart();

  if (rest === textLine) {
    // if we went so small that we want to split on the first char
    // then end recursion to avoid infinite loop
    return [textLine];
  }

  if (rest.length === 0) {
    // end recursion if there is no leftover
    return [splittedLine];
  }

  return [splittedLine, ...getSplittedLines(rest, calcValues)];
};

/**
 * CRITICAL: Advanced Line Wrapping with Intl.Segmenter
 * Modern Unicode-aware text segmentation with Japanese support
 */
export const getSplittedLinesBySegmenter = (line: string, calcValues: FontWidthCalcValues): string[] => {
  // nothing to process but need to keep this for new lines.
  if (line.trim() === '') {
    return [''];
  }

  const { font, fontSize, characterSpacing, boxWidthInPt } = calcValues;
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'word' });
  const iterator = segmenter.segment(line.trimEnd())[Symbol.iterator]();

  let lines: string[] = [];
  let lineCounter: number = 0;
  let currentTextSize: number = 0;

  while (true) {
    const chunk = iterator.next();
    if (chunk.done) break;
    
    const segment = chunk.value.segment;
    const textWidth = widthOfTextAtSize(segment, font, fontSize, characterSpacing);
    
    if (currentTextSize + textWidth <= boxWidthInPt) {
      // the size of boxWidth is large enough to add the segment
      if (lines[lineCounter]) {
        lines[lineCounter] += segment;
        currentTextSize += textWidth + characterSpacing;
      } else {
        lines[lineCounter] = segment;
        currentTextSize = textWidth + characterSpacing;
      }
    } else if (segment.trim() === '') {
      // a segment can be consist of multiple spaces like '     '
      // if they overflow the box, treat them as a line break and move to the next line
      lines[++lineCounter] = '';
      currentTextSize = 0;
    } else if (textWidth <= boxWidthInPt) {
      // the segment is small enough to be added to the next line
      lines[++lineCounter] = segment;
      currentTextSize = textWidth + characterSpacing;
    } else {
      // the segment is too large to fit in the boxWidth, we wrap the segment
      for (const char of segment) {
        const size = widthOfTextAtSize(char, font, fontSize, characterSpacing);
        if (currentTextSize + size <= boxWidthInPt) {
          if (lines[lineCounter]) {
            lines[lineCounter] += char;
            currentTextSize += size + characterSpacing;
          } else {
            lines[lineCounter] = char;
            currentTextSize = size + characterSpacing;
          }
        } else {
          lines[++lineCounter] = char;
          currentTextSize = size + characterSpacing;
        }
      }
    }
  }

  return adjustEndOfLine(lines);
};

/**
 * Add a newline if the line is the end of the paragraph
 */
const adjustEndOfLine = (lines: string[]): string[] => {
  return lines.map((line, index) => {
    if (index === lines.length - 1) {
      return line.trimEnd() + '\n';
    } else {
      return line.trimEnd();
    }
  });
};

/**
 * CRITICAL: Main text splitting function
 * Handles multiple line break formats and applies segmentation
 */
export const splitTextToSize = (arg: {
  value: string;
  characterSpacing: number;
  boxWidthInPt: number;
  fontSize: number;
  fontKitFont: FontKitFont;
}): string[] => {
  const { value, characterSpacing, fontSize, fontKitFont, boxWidthInPt } = arg;
  const fontWidthCalcValues: FontWidthCalcValues = {
    font: fontKitFont,
    fontSize,
    characterSpacing,
    boxWidthInPt,
  };
  
  let lines: string[] = [];
  value.split(/\r\n|\r|\n|\f|\u000B/g).forEach((line: string) => {
    lines = lines.concat(getSplittedLinesBySegmenter(line, fontWidthCalcValues));
  });
  
  return lines;
};

/**
 * Check if text contains Japanese characters
 */
export const containsJapanese = (text: string): boolean => {
  return /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u.test(text);
};
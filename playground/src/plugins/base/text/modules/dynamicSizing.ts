// REFACTORED: 2025-01-07 - Iterative dynamic font sizing algorithm

import type { Font as FontKitFont } from 'fontkit';
import { mm2pt, pt2mm } from '@pdfme/common';
import type { TextSchema } from '../types';
import { heightOfFontAtSize, widthOfTextAtSize } from './fontMetrics';
import { getSplittedLinesBySegmenter, FontWidthCalcValues } from './textLayout';

/**
 * CRITICAL: Dynamic Font Sizing Configuration
 * These constants control the iterative sizing algorithm
 */
export const FONT_SIZE_ADJUSTMENT = 0.25;
export const DEFAULT_DYNAMIC_FIT = 'vertical';
export const DEFAULT_DYNAMIC_MIN_FONT_SIZE = 4;
export const DEFAULT_DYNAMIC_MAX_FONT_SIZE = 72;
export const DEFAULT_LINE_HEIGHT = 1;
export const DEFAULT_CHARACTER_SPACING = 0;

export type DYNAMIC_FONT_SIZE_FIT = 'horizontal' | 'vertical';

/**
 * CRITICAL: Iterative Dynamic Font Sizing Algorithm
 * 
 * This algorithm iteratively adjusts font size to fit content within bounds.
 * Process:
 * 1. Start with initial font size (or schema fontSize)
 * 2. Clamp to min/max bounds
 * 3. Calculate constraints (width/height usage)
 * 4. Iteratively grow font if content fits
 * 5. Iteratively shrink font if content overflows
 * 6. Use FONT_SIZE_ADJUSTMENT increments for precision
 */
export const calculateDynamicFontSize = ({
  textSchema,
  fontKitFont,
  value,
  startingFontSize,
}: {
  textSchema: TextSchema;
  fontKitFont: FontKitFont;
  value: string;
  startingFontSize?: number | undefined;
}): number => {
  const {
    fontSize: schemaFontSize,
    dynamicFontSize: dynamicFontSizeSetting,
    characterSpacing: schemaCharacterSpacing,
    width: boxWidth,
    height: boxHeight,
    lineHeight = DEFAULT_LINE_HEIGHT,
  } = textSchema;
  
  const fontSize = startingFontSize || schemaFontSize || 13; // DEFAULT_FONT_SIZE from constants
  
  // Early return if dynamic sizing not enabled or invalid configuration
  if (!dynamicFontSizeSetting) return fontSize;
  if (dynamicFontSizeSetting.max < dynamicFontSizeSetting.min) return fontSize;

  const characterSpacing = schemaCharacterSpacing ?? DEFAULT_CHARACTER_SPACING;
  const paragraphs = value.split('\n');

  // Initialize dynamic font size within bounds
  let dynamicFontSize = fontSize;
  if (dynamicFontSize < dynamicFontSizeSetting.min) {
    dynamicFontSize = dynamicFontSizeSetting.min;
  } else if (dynamicFontSize > dynamicFontSizeSetting.max) {
    dynamicFontSize = dynamicFontSizeSetting.max;
  }
  
  const dynamicFontFit = dynamicFontSizeSetting.fit ?? DEFAULT_DYNAMIC_FIT;

  /**
   * Calculate space constraints at given font size
   * Returns total width and height usage in mm
   */
  const calculateConstraints = (size: number) => {
    let totalWidthInMm = 0;
    let totalHeightInMm = 0;

    const boxWidthInPt = mm2pt(boxWidth);
    const firstLineTextHeight = heightOfFontAtSize(fontKitFont, size);
    const firstLineHeightInMm = pt2mm(firstLineTextHeight * lineHeight);
    const otherRowHeightInMm = pt2mm(size * lineHeight);

    paragraphs.forEach((paragraph, paraIndex) => {
      const lines = getSplittedLinesBySegmenter(paragraph, {
        font: fontKitFont,
        fontSize: size,
        characterSpacing,
        boxWidthInPt,
      });

      lines.forEach((line, lineIndex) => {
        if (dynamicFontFit === 'vertical') {
          // For vertical fit we want to consider the width of text lines where we detect a split
          const textWidth = widthOfTextAtSize(
            line.replace('\n', ''),
            fontKitFont,
            size,
            characterSpacing,
          );
          const textWidthInMm = pt2mm(textWidth);
          totalWidthInMm = Math.max(totalWidthInMm, textWidthInMm);
        }

        if (paraIndex + lineIndex === 0) {
          totalHeightInMm += firstLineHeightInMm;
        } else {
          totalHeightInMm += otherRowHeightInMm;
        }
      });
      
      if (dynamicFontFit === 'horizontal') {
        // For horizontal fit we want to consider the line's width 'unsplit'
        const textWidth = widthOfTextAtSize(paragraph, fontKitFont, size, characterSpacing);
        const textWidthInMm = pt2mm(textWidth);
        totalWidthInMm = Math.max(totalWidthInMm, textWidthInMm);
      }
    });

    return { totalWidthInMm, totalHeightInMm };
  };

  /**
   * Check if font should grow to fit better
   */
  const shouldFontGrowToFit = (totalWidthInMm: number, totalHeightInMm: number): boolean => {
    if (dynamicFontSize >= dynamicFontSizeSetting.max) {
      return false;
    }
    if (dynamicFontFit === 'horizontal') {
      return totalWidthInMm < boxWidth;
    }
    return totalHeightInMm < boxHeight;
  };

  /**
   * Check if font should shrink to fit
   */
  const shouldFontShrinkToFit = (totalWidthInMm: number, totalHeightInMm: number): boolean => {
    if (dynamicFontSize <= dynamicFontSizeSetting.min || dynamicFontSize <= 0) {
      return false;
    }
    return totalWidthInMm > boxWidth || totalHeightInMm > boxHeight;
  };

  let { totalWidthInMm, totalHeightInMm } = calculateConstraints(dynamicFontSize);

  // PHASE 1: Attempt to increase the font size up to desired fit
  while (shouldFontGrowToFit(totalWidthInMm, totalHeightInMm)) {
    dynamicFontSize += FONT_SIZE_ADJUSTMENT;
    const { totalWidthInMm: newWidth, totalHeightInMm: newHeight } =
      calculateConstraints(dynamicFontSize);

    if (newHeight < boxHeight) {
      totalWidthInMm = newWidth;
      totalHeightInMm = newHeight;
    } else {
      dynamicFontSize -= FONT_SIZE_ADJUSTMENT;
      break;
    }
  }

  // PHASE 2: Attempt to decrease the font size down to desired fit
  while (shouldFontShrinkToFit(totalWidthInMm, totalHeightInMm)) {
    dynamicFontSize -= FONT_SIZE_ADJUSTMENT;
    ({ totalWidthInMm, totalHeightInMm } = calculateConstraints(dynamicFontSize));
  }

  return dynamicFontSize;
};
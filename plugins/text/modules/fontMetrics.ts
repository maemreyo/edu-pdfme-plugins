// REFACTORED: 2025-01-07 - Extracted font metrics calculations and caching logic

import * as fontkit from 'fontkit';
import type { Font as FontKitFont } from 'fontkit';
import {
  b64toUint8Array,
  pt2px,
  Font,
  getFallbackFontName,
  getDefaultFont,
  DEFAULT_FONT_NAME,
} from '@pdfme/common';
import { Buffer } from 'buffer';

/**
 * CRITICAL: Performance Caching System
 * Cache FontKit objects to avoid expensive re-parsing
 */
const getCacheKey = (fontName: string) => `getFontKitFont-${fontName}`;

/**
 * Get FontKit font object with caching strategy
 * CRITICAL MECHANISM: Must maintain exact same caching behavior
 */
export const getFontKitFont = async (
  fontName: string | undefined,
  font: Font,
  _cache: Map<string | number, fontkit.Font>,
): Promise<fontkit.Font> => {
  const fntNm = fontName || getFallbackFontName(font);
  const cacheKey = getCacheKey(fntNm);
  
  if (_cache.has(cacheKey)) {
    return _cache.get(cacheKey) as fontkit.Font;
  }

  const currentFont = font[fntNm] || getFallbackFont(font) || getDefaultFont()[DEFAULT_FONT_NAME];
  let fontData = currentFont.data;
  
  if (typeof fontData === 'string') {
    fontData = fontData.startsWith('http')
      ? await fetch(fontData).then((res) => res.arrayBuffer())
      : b64toUint8Array(fontData);
  }

  // Convert fontData to Buffer if it's not already a Buffer
  let fontDataBuffer: Buffer;
  if (fontData instanceof Buffer) {
    fontDataBuffer = fontData;
  } else {
    fontDataBuffer = Buffer.from(fontData as ArrayBufferLike);
  }
  
  const fontKitFont = fontkit.create(fontDataBuffer) as fontkit.Font;
  _cache.set(cacheKey, fontKitFont);

  return fontKitFont;
};

/**
 * Get fallback font when primary font not available
 */
const getFallbackFont = (font: Font) => {
  const fallbackFontName = getFallbackFontName(font);
  return font[fallbackFontName];
};

/**
 * CRITICAL: Font Metrics Calculations
 * These calculations must remain EXACTLY the same for PDF-UI consistency
 */

/**
 * Calculate character spacing for text
 */
const calculateCharacterSpacing = (textContent: string, textCharacterSpacing: number): number => {
  return (textContent.length - 1) * textCharacterSpacing;
};

/**
 * Calculate text width at specific size with character spacing
 * CRITICAL: Glyph-level precision for accurate text measurement
 */
export const widthOfTextAtSize = (
  text: string,
  fontKitFont: FontKitFont,
  fontSize: number,
  characterSpacing: number,
): number => {
  const { glyphs } = fontKitFont.layout(text);
  const scale = 1000 / fontKitFont.unitsPerEm;
  const standardWidth =
    glyphs.reduce((totalWidth, glyph) => totalWidth + glyph.advanceWidth * scale, 0) *
    (fontSize / 1000);
  return standardWidth + calculateCharacterSpacing(text, characterSpacing);
};

/**
 * Calculate font height at specific size
 * CRITICAL: Uses ascent, descent, bbox for accurate height calculation
 */
export const heightOfFontAtSize = (fontKitFont: FontKitFont, fontSize: number): number => {
  const { ascent, descent, bbox, unitsPerEm } = fontKitFont;

  const scale = 1000 / unitsPerEm;
  const yTop = (ascent || bbox.maxY) * scale;
  const yBottom = (descent || bbox.minY) * scale;

  let height = yTop - yBottom;
  height -= Math.abs(descent * scale) || 0;

  return (height / 1000) * fontSize;
};

/**
 * Get font descent in points
 * CRITICAL: Used for accurate text baseline positioning
 */
export const getFontDescentInPt = (fontKitFont: FontKitFont, fontSize: number): number => {
  const { descent, unitsPerEm } = fontKitFont;
  return (descent / unitsPerEm) * fontSize;
};

/**
 * CRITICAL: WYSIWYG Font Alignment System
 * Browser-PDF font rendering synchronization
 * This algorithm ensures UI matches PDF output exactly
 */
export const getBrowserVerticalFontAdjustments = (
  fontKitFont: FontKitFont,
  fontSize: number,
  lineHeight: number,
  verticalAlignment: string,
) => {
  const { ascent, descent, unitsPerEm } = fontKitFont;

  // Fonts have a designed line height that the browser renders when using `line-height: normal`
  const fontBaseLineHeight = (ascent - descent) / unitsPerEm;

  // For vertical alignment top
  // To achieve consistent positioning between browser and PDF, we apply the difference between
  // the font's actual height and the font size in pixels.
  // Browsers middle the font within this height, so we only need half of it to apply to the top.
  // This means the font renders a bit lower in the browser, but achieves PDF alignment
  const topAdjustment = (fontBaseLineHeight * fontSize - fontSize) / 2;

  if (verticalAlignment === 'top') {
    return { topAdj: pt2px(topAdjustment), bottomAdj: 0 };
  }

  // For vertical alignment bottom and middle
  // When browsers render text in a non-form element (such as a <div>), some of the text may be
  // lowered below and outside the containing element if the line height used is less than
  // the base line-height of the font.
  // This behaviour does not happen in a <textarea> though, so we need to adjust the positioning
  // for consistency between editing and viewing to stop text jumping up and down.
  // This portion of text is half of the difference between the base line height and the used
  // line height. If using the same or higher line-height than the base font, then line-height
  // takes over in the browser and this adjustment is not needed.
  // Unlike the top adjustment - this is only driven by browser behaviour, not PDF alignment.
  let bottomAdjustment = 0;
  if (lineHeight < fontBaseLineHeight) {
    bottomAdjustment = ((fontBaseLineHeight - lineHeight) * fontSize) / 2;
  }

  return { topAdj: 0, bottomAdj: pt2px(bottomAdjustment) };
};

/**
 * Character replacement system for unsupported glyphs
 * Performance optimized with caching
 */
export const replaceUnsupportedChars = (text: string, fontKitFont: FontKitFont): string => {
  const charSupportCache: { [char: string]: boolean } = {};

  const isCharSupported = (char: string): boolean => {
    if (char in charSupportCache) {
      return charSupportCache[char];
    }
    const isSupported = fontKitFont.hasGlyphForCodePoint(char.codePointAt(0) || 0);
    charSupportCache[char] = isSupported;
    return isSupported;
  };

  const segments = text.split(/(\r\n|\n|\r)/);

  return segments
    .map((segment) => {
      if (/\r\n|\n|\r/.test(segment)) {
        return segment;
      }

      return segment
        .split('')
        .map((char) => {
          if (/\s/.test(char) || char.charCodeAt(0) < 32) {
            return char;
          }

          return isCharSupported(char) ? char : '〿';
        })
        .join('');
    })
    .join('');
};
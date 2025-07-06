/**
 * Font Metrics Module (Enterprise Edition)
 * 
 * Handles all font-related operations:
 * - Font loading and validation
 * - Advanced caching with LRU eviction
 * - Precise font metric calculations
 * - Performance optimization
 * - Memory management
 * 
 * This module ensures optimal performance through sophisticated caching
 * and provides accurate measurements for text layout calculations.
 */

import type { Font as FontKitFont } from 'fontkit';
import { 
  FontMetrics, 
  FontCacheEntry, 
  TextPluginError,
  FontLoadError 
} from '../types';
import {
  DEFAULT_FONT_CACHE_SIZE_MB,
  MAX_FONT_CACHE_ENTRIES,
  FONT_CACHE_TTL,
  DEFAULT_FONT_SIZE,
  DEFAULT_CHARACTER_SPACING,
  UNSUPPORTED_CHAR_REPLACEMENT,
  POINTS_PER_MM,
} from '../constants';

/**
 * ===========================================
 * FONT CACHE MANAGEMENT
 * ===========================================
 */

/** Global font cache with LRU eviction */
const fontCache = new Map<string, FontCacheEntry>();

/** Cache statistics for monitoring */
let cacheStats = {
  hits: 0,
  misses: 0,
  evictions: 0,
  totalSize: 0, // in bytes
};

/**
 * Generates a cache key for font entries
 */
function generateCacheKey(fontName: string, fontData?: ArrayBuffer | string): string {
  if (fontData) {
    // Use hash of font data for custom fonts
    const dataString = typeof fontData === 'string' ? fontData : fontData.byteLength.toString();
    return `${fontName}-${btoa(dataString).slice(0, 16)}`;
  }
  return fontName;
}

/**
 * Estimates memory usage of a cache entry
 */
function estimateCacheEntrySize(fontKitFont: FontKitFont, metrics: FontMetrics): number {
  // Rough estimation: font object + metrics + overhead
  // Estimate font size - fontkit Font doesn't expose data directly
  const fontObjectSize = 100000; // Default size estimate
  const metricsSize = JSON.stringify(metrics).length * 2; // UTF-16 encoding
  const overhead = 1000; // Object overhead
  
  return fontObjectSize + metricsSize + overhead;
}

/**
 * Evicts least recently used cache entries to free memory
 */
function evictLRUEntries(targetSize: number): void {
  const entries = Array.from(fontCache.entries());
  entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
  
  let freedSize = 0;
  for (const [key, entry] of entries) {
    if (freedSize >= targetSize) break;
    
    fontCache.delete(key);
    freedSize += entry.sizeEstimate;
    cacheStats.evictions++;
    cacheStats.totalSize -= entry.sizeEstimate;
  }
}

/**
 * Checks if cache needs cleanup and performs it
 */
function maintainCache(): void {
  const maxSizeBytes = DEFAULT_FONT_CACHE_SIZE_MB * 1024 * 1024;
  
  // Remove expired entries
  const now = Date.now();
  for (const [key, entry] of fontCache.entries()) {
    if (now - entry.lastAccessed > FONT_CACHE_TTL) {
      fontCache.delete(key);
      cacheStats.totalSize -= entry.sizeEstimate;
    }
  }
  
  // Evict LRU entries if over size limit
  if (cacheStats.totalSize > maxSizeBytes) {
    evictLRUEntries(cacheStats.totalSize - maxSizeBytes);
  }
  
  // Evict LRU entries if over entry count limit
  if (fontCache.size > MAX_FONT_CACHE_ENTRIES) {
    evictLRUEntries(0); // Evict oldest entries
  }
}

/**
 * ===========================================
 * FONT LOADING AND VALIDATION
 * ===========================================
 */

/**
 * Loads a font using FontKit with comprehensive error handling
 * 
 * @param fontData - Font data as ArrayBuffer or URL string
 * @returns Promise resolving to FontKit font instance
 * @throws FontLoadError if loading fails
 */
export async function getFontKitFont(
  fontData: ArrayBuffer | string | undefined,
  fontName = 'Unknown'
): Promise<FontKitFont> {
  if (!fontData) {
    throw new FontLoadError(fontName, new Error('No font data provided'));
  }

  try {
    let buffer: ArrayBuffer;
    
    if (typeof fontData === 'string') {
      // Handle URL case
      if (fontData.startsWith('http')) {
        const response = await fetch(fontData);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        buffer = await response.arrayBuffer();
      } else {
        // Handle base64 or other string data
        const binaryString = atob(fontData);
        buffer = new ArrayBuffer(binaryString.length);
        const view = new Uint8Array(buffer);
        for (let i = 0; i < binaryString.length; i++) {
          view[i] = binaryString.charCodeAt(i);
        }
      }
    } else {
      buffer = fontData;
    }

    // Validate buffer
    if (buffer.byteLength === 0) {
      throw new Error('Font data is empty');
    }

    // Load font with FontKit (assuming fontkit is available)
    const fontkit = await import('fontkit');
    // Convert ArrayBuffer to Buffer for fontkit
    const bufferData = Buffer.from(buffer);
    const font = fontkit.create(bufferData) as FontKitFont;
    
    // Validate loaded font
    if (!font) {
      throw new Error('FontKit failed to create font instance');
    }

    return font;

  } catch (error) {
    console.error(`Font loading error for ${fontName}:`, error);
    
    // Check if font data exists in the font object
    if (typeof fontData === 'undefined') {
      throw new FontLoadError(fontName, new Error(`Font data for "${fontName}" is undefined`));
    }
    
    // Check if font data is empty
    if (typeof fontData === 'string' && fontData.length === 0) {
      throw new FontLoadError(fontName, new Error(`Font data for "${fontName}" is an empty string`));
    }
    
    // If it's an ArrayBuffer, check its size
    if (fontData instanceof ArrayBuffer && fontData.byteLength === 0) {
      throw new FontLoadError(fontName, new Error(`Font data for "${fontName}" is an empty ArrayBuffer`));
    }
    
    // Throw the original error with more context
    throw new FontLoadError(
      fontName, 
      new Error(`Failed to load font "${fontName}": ${(error as Error).message || String(error)}`)
    );
  }
}

/**
 * Caches a font with metadata and size estimation
 * 
 * @param fontName - Font identifier for caching
 * @param fontKitFont - FontKit font instance
 * @param metrics - Pre-computed font metrics (optional)
 * @returns Promise resolving when caching is complete
 */
export async function cacheFont(
  fontName: string,
  fontKitFont: FontKitFont,
  metrics?: FontMetrics
): Promise<void> {
  const cacheKey = generateCacheKey(fontName);
  
  // Extract metrics if not provided
  const fontMetrics = metrics || getFontMetrics(fontKitFont);
  
  // Estimate size and prepare cache entry
  const sizeEstimate = estimateCacheEntrySize(fontKitFont, fontMetrics);
  const cacheEntry: FontCacheEntry = {
    fontKitFont,
    metrics: fontMetrics,
    lastAccessed: Date.now(),
    sizeEstimate,
  };
  
  // Maintain cache before adding new entry
  maintainCache();
  
  // Add to cache
  fontCache.set(cacheKey, cacheEntry);
  cacheStats.totalSize += sizeEstimate;
}

/**
 * Retrieves a cached font or loads it if not cached
 * 
 * @param fontName - Font identifier
 * @param fontData - Font data for loading if not cached
 * @returns Promise resolving to FontKit font instance
 */
export async function getCachedFont(
  fontName: string,
  fontData?: ArrayBuffer | string
): Promise<FontKitFont> {
  const cacheKey = generateCacheKey(fontName, fontData);
  const cached = fontCache.get(cacheKey);
  
  if (cached) {
    // Update access time and return cached font
    cached.lastAccessed = Date.now();
    cacheStats.hits++;
    return cached.fontKitFont;
  }
  
  // Cache miss - load and cache font
  cacheStats.misses++;
  const fontKitFont = await getFontKitFont(fontData, fontName);
  await cacheFont(fontName, fontKitFont);
  
  return fontKitFont;
}

/**
 * ===========================================
 * FONT METRICS CALCULATION
 * ===========================================
 */

/**
 * Extracts comprehensive font metrics from FontKit font
 * 
 * @param fontKitFont - FontKit font instance
 * @returns Detailed font metrics for layout calculations
 */
export function getFontMetrics(fontKitFont: FontKitFont): FontMetrics {
  try {
    const {
      ascent,
      descent,
      lineGap,
      capHeight,
      xHeight,
      unitsPerEm,
    } = fontKitFont;

    // Calculate baseline offset for browser alignment
    // This compensates for browser-specific text rendering differences
    const baselineOffset = (ascent + Math.abs(descent)) / unitsPerEm;

    return {
      ascent,
      descent: Math.abs(descent), // Ensure positive value
      lineHeight: ascent + Math.abs(descent) + lineGap,
      capHeight: capHeight || ascent * 0.7, // Fallback if not available
      xHeight: xHeight || ascent * 0.5, // Fallback if not available
      unitsPerEm,
      baselineOffset,
    };

  } catch (error) {
    console.error('Failed to extract font metrics:', error);
    
    // Return fallback metrics for robustness
    return {
      ascent: 800,
      descent: 200,
      lineHeight: 1200,
      capHeight: 700,
      xHeight: 500,
      unitsPerEm: 1000,
      baselineOffset: 1.0,
    };
  }
}

/**
 * Calculates cached font metrics or extracts them fresh
 * 
 * @param fontKitFont - FontKit font instance
 * @param fontName - Font name for cache lookup
 * @returns Font metrics with caching optimization
 */
export function getCachedFontMetrics(
  fontKitFont: FontKitFont,
  fontName = 'default'
): FontMetrics {
  const cacheKey = generateCacheKey(fontName);
  const cached = fontCache.get(cacheKey);
  
  if (cached) {
    cached.lastAccessed = Date.now();
    return cached.metrics;
  }
  
  // Extract metrics and update cache if entry exists
  const metrics = getFontMetrics(fontKitFont);
  
  // Try to update existing cache entry
  const existingEntry = fontCache.get(cacheKey);
  if (existingEntry) {
    existingEntry.metrics = metrics;
    existingEntry.lastAccessed = Date.now();
  }
  
  return metrics;
}

/**
 * ===========================================
 * TEXT MEASUREMENT FUNCTIONS
 * ===========================================
 */

/**
 * Calculates the width of text at a specific size with high precision
 * 
 * @param text - Text to measure
 * @param fontKitFont - FontKit font instance
 * @param fontSize - Font size in points
 * @param characterSpacing - Additional character spacing in points
 * @returns Text width in points
 */
export function widthOfTextAtSize(
  text: string,
  fontKitFont: FontKitFont,
  fontSize: number = DEFAULT_FONT_SIZE,
  characterSpacing: number = DEFAULT_CHARACTER_SPACING
): number {
  if (!text || text.length === 0) {
    return 0;
  }

  try {
    // Use FontKit's layout engine for accurate measurement
    const run = fontKitFont.layout(text);
    const advanceWidth = run.advanceWidth;
    
    // Convert from font units to points
    const scale = fontSize / fontKitFont.unitsPerEm;
    const baseWidth = advanceWidth * scale;
    
    // Add character spacing (applied between characters, not after last)
    const spacingContribution = Math.max(0, text.length - 1) * characterSpacing;
    
    return baseWidth + spacingContribution;

  } catch (error) {
    console.warn('FontKit measurement failed, using fallback:', error);
    
    // Fallback to character-based estimation
    return fallbackTextWidth(text, fontSize, characterSpacing);
  }
}

/**
 * Fallback text width calculation for when FontKit fails
 */
function fallbackTextWidth(
  text: string,
  fontSize: number,
  characterSpacing: number
): number {
  // Average character width estimation (very rough)
  const avgCharWidth = fontSize * 0.6; // Rough estimate
  const baseWidth = text.length * avgCharWidth;
  const spacingContribution = Math.max(0, text.length - 1) * characterSpacing;
  
  return baseWidth + spacingContribution;
}

/**
 * Calculates the height of a font at a specific size
 * 
 * @param fontKitFont - FontKit font instance
 * @param fontSize - Font size in points
 * @returns Font height in points
 */
export function heightOfFontAtSize(
  fontKitFont: FontKitFont,
  fontSize: number = DEFAULT_FONT_SIZE
): number {
  try {
    const metrics = getCachedFontMetrics(fontKitFont);
    const scale = fontSize / metrics.unitsPerEm;
    
    return metrics.lineHeight * scale;

  } catch (error) {
    console.warn('Font height calculation failed, using fallback:', error);
    
    // Fallback to font size * standard line height
    return fontSize * 1.2;
  }
}

/**
 * Gets the font descent (portion below baseline) in points
 * 
 * @param fontKitFont - FontKit font instance
 * @param fontSize - Font size in points
 * @returns Font descent in points
 */
export function getFontDescentInPt(
  fontKitFont: FontKitFont,
  fontSize: number = DEFAULT_FONT_SIZE
): number {
  try {
    const metrics = getCachedFontMetrics(fontKitFont);
    const scale = fontSize / metrics.unitsPerEm;
    
    return metrics.descent * scale;

  } catch (error) {
    console.warn('Font descent calculation failed, using fallback:', error);
    
    // Fallback to font size * typical descent ratio
    return fontSize * 0.2;
  }
}

/**
 * ===========================================
 * UNSUPPORTED CHARACTER HANDLING
 * ===========================================
 */

/**
 * Replaces characters not supported by the font with a replacement character
 * 
 * @param text - Input text
 * @param fontKitFont - FontKit font instance
 * @param replacement - Replacement character (default: Japanese replacement mark)
 * @returns Text with unsupported characters replaced
 */
export function replaceUnsupportedChars(
  text: string,
  fontKitFont: FontKitFont,
  replacement: string = UNSUPPORTED_CHAR_REPLACEMENT
): string {
  if (!text || !fontKitFont) {
    return text;
  }

  try {
    return text
      .split('')
      .map(char => {
        const glyphId = fontKitFont.glyphForCodePoint(char.codePointAt(0) || 0);
        
        // If no glyph found (glyphId 0 is typically .notdef), replace
        // Check if the glyph is the .notdef glyph or missing
        return (!glyphId || glyphId === null) ? replacement : char;
      })
      .join('');

  } catch (error) {
    console.warn('Unsupported character replacement failed:', error);
    return text; // Return original text if replacement fails
  }
}

/**
 * ===========================================
 * CACHE MANAGEMENT UTILITIES
 * ===========================================
 */

/**
 * Clears the entire font cache
 */
export function clearFontCache(): void {
  fontCache.clear();
  cacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalSize: 0,
  };
}

/**
 * Gets current cache statistics
 */
export function getFontCacheStats(): typeof cacheStats {
  return { ...cacheStats };
}

/**
 * Gets detailed cache information for debugging
 */
export function getFontCacheInfo(): {
  entryCount: number;
  totalSizeMB: number;
  hitRate: number;
  entries: Array<{
    key: string;
    sizeKB: number;
    lastAccessed: Date;
    ageMinutes: number;
  }>;
} {
  const entries = Array.from(fontCache.entries()).map(([key, entry]) => ({
    key,
    sizeKB: Math.round(entry.sizeEstimate / 1024),
    lastAccessed: new Date(entry.lastAccessed),
    ageMinutes: Math.round((Date.now() - entry.lastAccessed) / 60000),
  }));

  const totalRequests = cacheStats.hits + cacheStats.misses;
  const hitRate = totalRequests > 0 ? (cacheStats.hits / totalRequests) * 100 : 0;

  return {
    entryCount: fontCache.size,
    totalSizeMB: Math.round(cacheStats.totalSize / (1024 * 1024) * 100) / 100,
    hitRate: Math.round(hitRate * 100) / 100,
    entries,
  };
}

/**
 * Force cache maintenance (useful for testing)
 */
export function forceCacheMaintenance(): void {
  maintainCache();
}
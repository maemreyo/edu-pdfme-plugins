// REFACTORED: 2025-01-07 - Japanese text processing with Kinsoku Shori rules

/**
 * CRITICAL: Japanese Text Processing Rules (Kinsoku Shori)
 * These rules MUST remain exactly the same for proper Japanese typography
 * Reference: https://www.morisawa.co.jp/blogs/MVP/8760
 */

/**
 * Characters that cannot appear at the beginning of a line
 * 行頭禁則文字 (Line Start Forbidden Characters)
 */
export const LINE_START_FORBIDDEN_CHARS = [
  // 句読点 (Punctuation)
  '、',
  '。',
  ',',
  '.',

  // 閉じカッコ類 (Closing brackets)
  '」',
  '』',
  ')',
  '}',
  '】',
  '>',
  '≫',
  ']',

  // 記号 (Symbols)
  '・',
  'ー',
  '―',
  '-',

  // 約物 (Yakumono - punctuation marks)
  '!',
  '！',
  '?',
  '？',
  ':',
  '：',
  ';',
  '；',
  '/',
  '／',

  // 繰り返し記号 (Iteration marks)
  'ゝ',
  '々',
  '〃',

  // 拗音・促音（小書きのかな） (Small kana)
  'ぁ',
  'ぃ',
  'ぅ',
  'ぇ',
  'ぉ',
  'っ',
  'ゃ',
  'ゅ',
  'ょ',
  'ァ',
  'ィ',
  'ゥ',
  'ェ',
  'ォ',
  'ッ',
  'ャ',
  'ュ',
  'ョ',
];

/**
 * Characters that cannot appear at the end of a line
 * 行末禁則文字 (Line End Forbidden Characters)
 */
export const LINE_END_FORBIDDEN_CHARS = [
  // 始め括弧類 (Opening brackets)
  '「',
  '『',
  '（',
  '｛',
  '【',
  '＜',
  '≪',
  '［',
  '〘',
  '〖',
  '〝',
  '\'',
  '"',
  '｟',
  '«',
];

/**
 * CRITICAL: Line Start Prohibition Processing (行頭禁則)
 * Moves forbidden characters from line start to previous line
 */
export const filterStartJP = (lines: string[]): string[] => {
  const filtered: string[] = [];
  let charToAppend: string | null = null;

  lines
    .slice()
    .reverse()
    .forEach((line) => {
      if (line.trim().length === 0) {
        filtered.push('');
      } else {
        const charAtStart: string = line.charAt(0);
        if (LINE_START_FORBIDDEN_CHARS.includes(charAtStart)) {
          if (line.trim().length === 1) {
            filtered.push(line);
            charToAppend = null;
          } else {
            if (charToAppend) {
              filtered.push(line.slice(1) + charToAppend);
            } else {
              filtered.push(line.slice(1));
            }
            charToAppend = charAtStart;
          }
        } else {
          if (charToAppend) {
            filtered.push(line + charToAppend);
            charToAppend = null;
          } else {
            filtered.push(line);
          }
        }
      }
    });

  if (charToAppend) {
    // Handle the case where filtered might be empty
    const firstItem = filtered.length > 0 ? filtered[0] : '';
    // Ensure we're concatenating strings
    const combinedItem = String(charToAppend) + String(firstItem);
    return [combinedItem, ...filtered.slice(1)].reverse();
  } else {
    return filtered.reverse();
  }
};

/**
 * CRITICAL: Line End Prohibition Processing (行末禁則)
 * Moves forbidden characters from line end to next line
 */
export const filterEndJP = (lines: string[]): string[] => {
  const filtered: string[] = [];
  let charToPrepend: string | null = null;

  lines.forEach((line) => {
    if (line.trim().length === 0) {
      filtered.push('');
    } else {
      const chartAtEnd = line.slice(-1);

      if (LINE_END_FORBIDDEN_CHARS.includes(chartAtEnd)) {
        if (line.trim().length === 1) {
          filtered.push(line);
          charToPrepend = null;
        } else {
          if (charToPrepend) {
            filtered.push(charToPrepend + line.slice(0, -1));
          } else {
            filtered.push(line.slice(0, -1));
          }
          charToPrepend = chartAtEnd;
        }
      } else {
        if (charToPrepend) {
          filtered.push(charToPrepend + line);
          charToPrepend = null;
        } else {
          filtered.push(line);
        }
      }
    }
  });

  if (charToPrepend) {
    // Handle the case where filtered might be empty
    const lastItem = filtered.length > 0 ? filtered[filtered.length - 1] : '';
    // Ensure we're concatenating strings
    const combinedItem = String(lastItem) + String(charToPrepend);
    return [...filtered.slice(0, -1), combinedItem];
  } else {
    return filtered;
  }
};

/**
 * Check if text contains Japanese characters
 */
export const containsJapanese = (text: string): boolean => {
  return /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u.test(text);
};

/**
 * Apply Japanese text processing rules to lines
 * CRITICAL: Must be applied when Japanese text is detected
 */
export const applyJapaneseRules = (lines: string[]): string[] => {
  if (lines.some(containsJapanese)) {
    return filterEndJP(filterStartJP(lines));
  }
  return lines;
};
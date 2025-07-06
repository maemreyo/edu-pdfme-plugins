declare namespace Intl {
  interface SegmentData {
    segment: string;
    index: number;
    input: string;
    isWordLike: boolean;
  }

  interface SegmenterOptions {
    granularity?: "grapheme" | "word" | "sentence";
  }

  interface Segmenter {
    resolvedOptions(): SegmenterOptions;
    segment(text: string): IterableIterator<SegmentData>;
  }

  interface SegmenterConstructor {
    new(locales?: string | string[], options?: SegmenterOptions): Segmenter;
    supportedLocalesOf(locales: string | string[], options?: SegmenterOptions): string[];
  }

  var Segmenter: SegmenterConstructor;
}
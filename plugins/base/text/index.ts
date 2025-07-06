import type { Plugin } from '@pdfme/common';
import { pdfRender } from './pdfRender';
import { propPanel } from './propPanel';
import { uiRender } from './uiRender';
import type { TextSchema } from './types';
import { TextCursorInput } from 'lucide';
import { createSvgStr } from '../utils';

const textSchema: Plugin<TextSchema> = {
  pdf: pdfRender,
  ui: uiRender,
  propPanel,
  icon: createSvgStr(TextCursorInput),
};

export default textSchema;

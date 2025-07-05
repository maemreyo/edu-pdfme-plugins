import type { Plugin } from '@pdfme/common';
import type { TableSchema } from './types';
import { pdfRender } from './pdfRender';
import { uiRender } from './uiRender';
import { propPanel } from './propPanel';
import { Table } from 'lucide';
import { createSvgStr } from '../../utils';

const tableSchema: Plugin<TableSchema> = {
  pdf: pdfRender,
  ui: uiRender,
  propPanel,
  icon: createSvgStr(Table),
};
export default tableSchema;

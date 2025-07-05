import { getPlugin } from './helper';
import { createSvgStr } from '../utils';
import { Calendar } from 'lucide';

const type = 'date';

const icon = createSvgStr(Calendar);

export default getPlugin({ type, icon });

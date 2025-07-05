import { getPlugin } from './helper';
import { createSvgStr } from '../utils';
import { CalendarClock } from 'lucide';

const type = 'dateTime';

const icon = createSvgStr(CalendarClock);

export default getPlugin({ type, icon });

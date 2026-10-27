import raw from '../../data/items.json';
import { itemSchema } from './schema';
export const items = itemSchema.array().parse(raw);
export const activeItems = items.filter(item => item.status === 'active').sort((a, b) => b.added_at.localeCompare(a.added_at));
const labels: Record<string, string> = { ecg: 'ECG', ep: 'EP', mcs: 'MCS', acs: 'ACS', ai: 'AI', 'ultrasound/pocus': 'Ultrasound / POCUS', ios: 'iOS', pdf: 'PDF', 'clinician-built': 'Clinician-built' };
export const label = (value: string) => labels[value] ?? value.replaceAll('-', ' ');
export const pluralLabel = (type: string) => type === 'clinician-built' ? label(type) : label(type).replace(/^./, c => c.toUpperCase()) + 's';
export const date = (value: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));

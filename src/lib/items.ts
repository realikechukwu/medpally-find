import raw from '../../data/items.json';
import { itemSchema, types, type Item } from './schema';
export const items = itemSchema.array().parse(raw);
export const activeItems = items.filter(item => item.status === 'active').sort((a, b) => b.added_at.localeCompare(a.added_at));
export const MIN_INDEXABLE_ITEMS = 3;
export const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const labels: Record<string, string> = { ecg: 'ECG', ep: 'EP', mcs: 'MCS', acs: 'ACS', ai: 'AI', 'ultrasound/pocus': 'Ultrasound / POCUS', ios: 'iOS', pdf: 'PDF', 'clinician-built': 'Clinician-built' };
export const label = (value: string) => labels[value] ?? value.replaceAll('-', ' ');
export const pluralLabel = (type: string) => type === CLINICIAN_BUILT ? label(type) : label(type).replace(/^./, c => c.toUpperCase()) + 's';
// Format (app, course…) and maker (clinician or not) are separate; "clinician-built" is browsable like a type but backed by the flag.
export const CLINICIAN_BUILT = 'clinician-built';
export const typeKeys = types.flatMap(type => type === 'app' ? [type, CLINICIAN_BUILT] : [type]);
export const inType = (item: Item, key: string) => key === CLINICIAN_BUILT ? item.clinician_built : item.type === key;
export const usedTypes = typeKeys.filter(key => activeItems.some(item => inType(item, key)));
export const date = (value: string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));

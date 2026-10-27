import MiniSearch from 'minisearch';
import { activeItems } from '../lib/items';
const index = new MiniSearch({ fields: ['title', 'tags', 'summary', 'maker', 'built'], storeFields: [] });
index.addAll(activeItems.map(item => ({ ...item, tags: item.tags.join(' '), maker: item.maker ?? '', built: item.clinician_built ? 'clinician built' : '' })));
export const GET = () => new Response(JSON.stringify(index), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });

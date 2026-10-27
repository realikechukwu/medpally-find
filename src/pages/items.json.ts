import { activeItems } from '../lib/items';
export const GET = () => new Response(JSON.stringify(activeItems), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });

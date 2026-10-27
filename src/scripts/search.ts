import MiniSearch from 'minisearch';
const input = document.querySelector<HTMLInputElement>('#search')!;
const cards = [...document.querySelectorAll<HTMLElement>('#cards .card')];
const categories = [...document.querySelectorAll<HTMLButtonElement>('[data-category]')];
const categoryBar = document.querySelector<HTMLElement>('.category-bar')!;
const chips = [...document.querySelectorAll<HTMLButtonElement>('[data-tag]')];
const empty = document.querySelector<HTMLElement>('#empty')!;
const count = document.querySelector<HTMLElement>('#result-count')!;
const recent = document.querySelector<HTMLElement>('#new-section');
let index: MiniSearch | null = null;
let category = '', selected = new Set<string>();
const params = new URLSearchParams(location.search);
input.value = params.get('q') ?? '';
category = params.get('type') ?? '';
if (!categories.some(button => button.dataset.category === category)) category = '';
selected = new Set(params.getAll('tag').filter(tag => chips.some(button => button.dataset.tag === tag)));
function sync() {
 const url = new URL(location.href); url.searchParams.delete('q'); url.searchParams.delete('type'); url.searchParams.delete('tag');
 if (input.value.trim()) url.searchParams.set('q', input.value.trim()); if (category) url.searchParams.set('type', category); selected.forEach(tag => url.searchParams.append('tag', tag));
 history.replaceState(null, '', url);
}
function render() {
 const query = input.value.trim();
 const matches = query && index ? new Set(index.search(query, { prefix: true, fuzzy: 0.2, boost: { title: 4, tags: 3, summary: 2, maker: 1 }, combineWith: 'AND' }).map(result => String(result.id))) : null;
 let visible = 0;
 for (const card of cards) { const show = (!query || (matches ? matches.has(card.dataset.id!) : card.textContent!.toLowerCase().includes(query.toLowerCase()))) && (!category || card.dataset.type === category) && [...selected].every(tag => card.dataset.tags!.split('|').includes(tag)); card.hidden = !show; if (show) visible++; }
 categories.forEach(button => { const active = button.dataset.category === category; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
 chips.forEach(button => { const active = selected.has(button.dataset.tag!); button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
 empty.hidden = visible > 0; if (recent) recent.hidden = Boolean(query || category || selected.size);
 count.textContent = `${visible} ${visible === 1 ? 'resource' : 'resources'}${query || category || selected.size ? ' found' : ''}`;
}
function update() { sync(); render(); }
function revealCategory(smooth: boolean) {
 const button = categories.find(b => b.dataset.category === category); if (!button) return;
 const bar = categoryBar.getBoundingClientRect(), box = button.getBoundingClientRect(), pad = parseFloat(getComputedStyle(categoryBar).paddingLeft);
 if (box.left >= bar.left + pad && box.right <= bar.right - pad) return;
 categoryBar.scrollTo({ left: categoryBar.scrollLeft + box.left - bar.left - (bar.width - box.width) / 2, behavior: smooth && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'auto' });
}
input.addEventListener('input', update);
document.querySelector('form[role="search"]')!.addEventListener('submit', event => { event.preventDefault(); update(); input.blur(); document.querySelector('.all-section')!.scrollIntoView({ behavior: 'smooth' }); });
categories.forEach(button => button.addEventListener('click', () => { category = button.dataset.category!; update(); revealCategory(true); }));
chips.forEach(button => button.addEventListener('click', () => { const tag = button.dataset.tag!; selected.has(tag) ? selected.delete(tag) : selected.add(tag); update(); }));
document.querySelector('#clear-filters')!.addEventListener('click', () => { input.value = ''; category = ''; selected.clear(); update(); input.focus(); });
document.addEventListener('keydown', event => { if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey && !(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || (event.target as HTMLElement).isContentEditable)) { event.preventDefault(); input.focus(); } });
render();
revealCategory(false);
fetch('/search-index.json').then(response => { if (!response.ok) throw new Error('Search index unavailable'); return response.text(); }).then(json => { index = MiniSearch.loadJSON(json, { fields: ['title', 'tags', 'summary', 'maker'] }); render(); }).catch(() => { count.textContent += ' · basic search'; });

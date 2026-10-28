import MiniSearch from 'minisearch';
const input = document.querySelector<HTMLInputElement>('#search')!;
const cards = [...document.querySelectorAll<HTMLElement>('#cards .card')];
const categories = [...document.querySelectorAll<HTMLButtonElement>('[data-category]')];
const categoryBar = document.querySelector<HTMLElement>('.category-bar')!;
const chips = [...document.querySelectorAll<HTMLButtonElement>('[data-tag]')];
const grid = document.querySelector<HTMLElement>('#cards')!;
const empty = document.querySelector<HTMLElement>('#empty')!;
const count = document.querySelector<HTMLElement>('#result-count')!;
const more = document.querySelector<HTMLElement>('#show-more')!;
const moreButton = document.querySelector<HTMLButtonElement>('#more-button')!;
const shownCount = document.querySelector<HTMLElement>('#shown-count')!;
// 12 fills whole rows in the 4, 3, 2 and 1 column layouts.
const PAGE_SIZE = 12;
let index: MiniSearch | null = null;
let category = '', selected = new Set<string>(), shown = PAGE_SIZE;
const params = new URLSearchParams(location.search);
input.value = params.get('q') ?? '';
category = params.get('type') ?? '';
if (!categories.some(button => button.dataset.category === category)) category = '';
selected = new Set(params.getAll('tag').filter(tag => chips.some(button => button.dataset.tag === tag)));
// ?show= keeps the list length in the URL, so coming back from a resource restores it and the browser can put the scroll back. ?page= is from the old pager.
shown = Math.max(PAGE_SIZE, Math.floor(Number(params.get('show'))) || Math.floor(Number(params.get('page'))) * PAGE_SIZE || 0);
function listUrl() {
 const url = new URL(location.href); url.searchParams.delete('q'); url.searchParams.delete('type'); url.searchParams.delete('tag'); url.searchParams.delete('page'); url.searchParams.delete('show');
 if (input.value.trim()) url.searchParams.set('q', input.value.trim()); if (category) url.searchParams.set('type', category); selected.forEach(tag => url.searchParams.append('tag', tag)); if (shown > PAGE_SIZE) url.searchParams.set('show', String(shown));
 return url;
}
function sync() { history.replaceState(null, '', listUrl()); }
function render() {
 const query = input.value.trim();
 const matches = query && index ? new Set(index.search(query, { prefix: true, fuzzy: 0.2, boost: { title: 4, tags: 3, summary: 2, maker: 1 }, combineWith: 'AND' }).map(result => String(result.id))) : null;
 const found = cards.filter(card => (!query || (matches ? matches.has(card.dataset.id!) : card.textContent!.toLowerCase().includes(query.toLowerCase()))) && (!category || (category === 'clinician-built' ? card.dataset.clinician === 'true' : card.dataset.type === category)) && [...selected].every(tag => card.dataset.tags!.split('|').includes(tag)));
 const visible = found.length;
 const onList = new Set(found.slice(0, shown));
 for (const card of cards) card.hidden = !onList.has(card);
 // Full cards for browsing; compact rows once a search or filter narrows the list, so matches are quicker to scan.
 grid.classList.toggle('rows', Boolean(query || category || selected.size));
 more.hidden = visible <= shown;
 shownCount.textContent = `Showing ${Math.min(shown, visible)} of ${visible}`;
 categories.forEach(button => { const active = button.dataset.category === category; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
 chips.forEach(button => { const active = selected.has(button.dataset.tag!); button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
 empty.hidden = visible > 0;
 count.textContent = `${visible} ${visible === 1 ? 'resource' : 'resources'}${query || category || selected.size ? ' found' : ''}${visible > shown ? ` · showing ${shown}` : ''}`;
}
// A new search or filter starts again from the first batch.
function update() { shown = PAGE_SIZE; render(); sync(); }
function revealCategory(smooth: boolean) {
 const button = categories.find(b => b.dataset.category === category); if (!button) return;
 const bar = categoryBar.getBoundingClientRect(), box = button.getBoundingClientRect(), pad = parseFloat(getComputedStyle(categoryBar).paddingLeft);
 if (box.left >= bar.left + pad && box.right <= bar.right - pad) return;
 categoryBar.scrollTo({ left: categoryBar.scrollLeft + box.left - bar.left - (bar.width - box.width) / 2, behavior: smooth && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'auto' });
}
input.addEventListener('input', update);
input.form!.addEventListener('submit', event => { event.preventDefault(); update(); input.blur(); document.querySelector('.all-section')!.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); });
categories.forEach(button => button.addEventListener('click', () => { category = button.dataset.category!; update(); revealCategory(true); }));
chips.forEach(button => button.addEventListener('click', () => { const tag = button.dataset.tag!; selected.has(tag) ? selected.delete(tag) : selected.add(tag); update(); }));
// Reveal the next batch in place: no scroll jump. Focus moves to the first new card so keyboard and screen reader users carry on from there.
moreButton.addEventListener('click', () => {
 const before = new Set(cards.filter(card => !card.hidden));
 shown += PAGE_SIZE; render(); sync();
 const added = cards.filter(card => !card.hidden && !before.has(card));
 added.forEach(card => { card.classList.add('revealed'); card.addEventListener('animationend', () => card.classList.remove('revealed'), { once: true }); });
 added[0]?.querySelector<HTMLAnchorElement>('h3 a')?.focus({ preventScroll: true });
});
document.querySelector('#clear-filters')!.addEventListener('click', () => { input.value = ''; category = ''; selected.clear(); update(); input.focus(); });
document.addEventListener('keydown', event => { if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey && !(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || (event.target as HTMLElement).isContentEditable)) { event.preventDefault(); input.focus(); } });
render();
sync();
revealCategory(false);
fetch('/search-index.json').then(response => { if (!response.ok) throw new Error('Search index unavailable'); return response.text(); }).then(json => { index = MiniSearch.loadJSON(json, { fields: ['title', 'tags', 'summary', 'maker', 'built'] }); render(); }).catch(() => { count.textContent += ' · basic search'; });

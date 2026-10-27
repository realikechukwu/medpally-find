import MiniSearch from 'minisearch';
const input = document.querySelector<HTMLInputElement>('#search')!;
const cards = [...document.querySelectorAll<HTMLElement>('#cards .card')];
const categories = [...document.querySelectorAll<HTMLButtonElement>('[data-category]')];
const categoryBar = document.querySelector<HTMLElement>('.category-bar')!;
const chips = [...document.querySelectorAll<HTMLButtonElement>('[data-tag]')];
const grid = document.querySelector<HTMLElement>('#cards')!;
const empty = document.querySelector<HTMLElement>('#empty')!;
const count = document.querySelector<HTMLElement>('#result-count')!;
const pagination = document.querySelector<HTMLElement>('#pagination')!;
const PAGE_SIZE = 10;
let index: MiniSearch | null = null;
let category = '', selected = new Set<string>(), page = 1;
const params = new URLSearchParams(location.search);
input.value = params.get('q') ?? '';
category = params.get('type') ?? '';
if (!categories.some(button => button.dataset.category === category)) category = '';
selected = new Set(params.getAll('tag').filter(tag => chips.some(button => button.dataset.tag === tag)));
page = Math.max(1, Math.floor(Number(params.get('page'))) || 1);
function pageUrl(n: number) {
 const url = new URL(location.href); url.searchParams.delete('q'); url.searchParams.delete('type'); url.searchParams.delete('tag'); url.searchParams.delete('page');
 if (input.value.trim()) url.searchParams.set('q', input.value.trim()); if (category) url.searchParams.set('type', category); selected.forEach(tag => url.searchParams.append('tag', tag)); if (n > 1) url.searchParams.set('page', String(n));
 return url;
}
function sync() { history.replaceState(null, '', pageUrl(page)); }
// 1 … 4 5 6 … 12: always the first, last and neighbours of the current page.
function pageList(pages: number): (number | null)[] {
 const shown = [...new Set([1, pages, page - 1, page, page + 1])].filter(n => n >= 1 && n <= pages).sort((a, b) => a - b);
 return shown.flatMap((n, i) => i && n - shown[i - 1] > 1 ? (n - shown[i - 1] === 2 ? [n - 1, n] : [null, n]) : [n]);
}
function renderPagination(pages: number) {
 pagination.hidden = pages < 2; if (pages < 2) { pagination.replaceChildren(); return; }
 const link = (n: number, text: string, extra: Record<string, string> = {}) => { const a = document.createElement('a'); const url = pageUrl(n); a.href = url.pathname + url.search; a.dataset.page = String(n); a.textContent = text; Object.entries(extra).forEach(([k, v]) => a.setAttribute(k, v)); return a; };
 const step = (n: number, text: string, rel: string, label: string) => { const el = n < 1 || n > pages ? Object.assign(document.createElement('span'), { textContent: text, ariaHidden: 'true' }) : link(n, text, { rel, 'aria-label': label }); el.className = 'page-step'; el.dataset.arrow = text.includes('‹') ? '‹' : '›'; return el; };
 pagination.replaceChildren(step(page - 1, '‹ Previous', 'prev', 'Previous page'), ...pageList(pages).map(n => n === null ? Object.assign(document.createElement('span'), { className: 'page-gap', textContent: '…' }) : link(n, String(n), n === page ? { 'aria-current': 'page', 'aria-label': `Page ${n}, current` } : { 'aria-label': `Page ${n}` })), step(page + 1, 'Next ›', 'next', 'Next page'));
}
function render() {
 const query = input.value.trim();
 const matches = query && index ? new Set(index.search(query, { prefix: true, fuzzy: 0.2, boost: { title: 4, tags: 3, summary: 2, maker: 1 }, combineWith: 'AND' }).map(result => String(result.id))) : null;
 const found = cards.filter(card => (!query || (matches ? matches.has(card.dataset.id!) : card.textContent!.toLowerCase().includes(query.toLowerCase()))) && (!category || (category === 'clinician-built' ? card.dataset.clinician === 'true' : card.dataset.type === category)) && [...selected].every(tag => card.dataset.tags!.split('|').includes(tag)));
 const visible = found.length, pages = Math.max(1, Math.ceil(visible / PAGE_SIZE));
 page = Math.min(page, pages);
 const onPage = new Set(found.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE));
 for (const card of cards) card.hidden = !onPage.has(card);
 // Full cards for browsing; compact rows once a search or filter narrows the list, so matches are quicker to scan.
 grid.classList.toggle('rows', Boolean(query || category || selected.size));
 renderPagination(pages);
 categories.forEach(button => { const active = button.dataset.category === category; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
 chips.forEach(button => { const active = selected.has(button.dataset.tag!); button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
 empty.hidden = visible > 0;
 count.textContent = `${visible} ${visible === 1 ? 'resource' : 'resources'}${query || category || selected.size ? ' found' : ''}${pages > 1 ? ` · page ${page} of ${pages}` : ''}`;
}
// A new search or filter starts again from page 1.
function update() { page = 1; render(); sync(); }
function revealCategory(smooth: boolean) {
 const button = categories.find(b => b.dataset.category === category); if (!button) return;
 const bar = categoryBar.getBoundingClientRect(), box = button.getBoundingClientRect(), pad = parseFloat(getComputedStyle(categoryBar).paddingLeft);
 if (box.left >= bar.left + pad && box.right <= bar.right - pad) return;
 categoryBar.scrollTo({ left: categoryBar.scrollLeft + box.left - bar.left - (bar.width - box.width) / 2, behavior: smooth && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'auto' });
}
input.addEventListener('input', update);
input.form!.addEventListener('submit', event => { event.preventDefault(); update(); input.blur(); document.querySelector('.all-section')!.scrollIntoView({ behavior: 'smooth' }); });
categories.forEach(button => button.addEventListener('click', () => { category = button.dataset.category!; update(); revealCategory(true); }));
chips.forEach(button => button.addEventListener('click', () => { const tag = button.dataset.tag!; selected.has(tag) ? selected.delete(tag) : selected.add(tag); update(); }));
pagination.addEventListener('click', event => {
 const target = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[data-page]'); if (!target || event.metaKey || event.ctrlKey || event.shiftKey) return;
 event.preventDefault(); page = Number(target.dataset.page); render(); history.pushState(null, '', pageUrl(page));
 document.querySelector('.all-section')!.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
});
addEventListener('popstate', () => { page = Math.max(1, Math.floor(Number(new URLSearchParams(location.search).get('page'))) || 1); render(); });
document.querySelector('#clear-filters')!.addEventListener('click', () => { input.value = ''; category = ''; selected.clear(); update(); input.focus(); });
document.addEventListener('keydown', event => { if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey && !(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || (event.target as HTMLElement).isContentEditable)) { event.preventDefault(); input.focus(); } });
render();
sync();
revealCategory(false);
fetch('/search-index.json').then(response => { if (!response.ok) throw new Error('Search index unavailable'); return response.text(); }).then(json => { index = MiniSearch.loadJSON(json, { fields: ['title', 'tags', 'summary', 'maker', 'built'] }); render(); }).catch(() => { count.textContent += ' · basic search'; });

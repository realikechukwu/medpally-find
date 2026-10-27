// Saved resources live only in this browser, as item IDs (newest first). Stable IDs let them move to an account later.
const KEY = 'mpf:saved';

function storageAvailable() {
 try { localStorage.setItem(`${KEY}:test`, '1'); localStorage.removeItem(`${KEY}:test`); return true; } catch { return false; }
}
function read(): string[] {
 try { const value = JSON.parse(localStorage.getItem(KEY) ?? '[]'); return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : []; } catch { return []; }
}
function write(ids: string[]) {
 try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* storage became unavailable; the UI still reflects the attempted change */ }
}

const available = storageAvailable();
const buttons = [...document.querySelectorAll<HTMLButtonElement>('[data-save]')];
const counts = [...document.querySelectorAll<HTMLElement>('[data-saved-count]')];
const list = document.querySelector<HTMLElement>('#saved-cards');

function render() {
 const ids = read();
 const saved = new Set(ids);
 for (const button of buttons) {
  const on = saved.has(button.dataset.save!);
  button.setAttribute('aria-pressed', String(on));
  button.classList.toggle('saved', on);
  if (button.hasAttribute('data-save-label')) button.querySelector('span')!.textContent = on ? 'Saved' : 'Save';
  else button.setAttribute('aria-label', `${on ? 'Remove' : 'Save'} ${button.closest('.card')?.querySelector('h3')?.textContent ?? 'resource'}${on ? ' from saved' : ''}`);
 }
 // Only count IDs that still match a listed resource on pages that render them all.
 const visible = list ? ids.filter(id => list.querySelector(`.card[data-id="${CSS.escape(id)}"]`)) : ids;
 for (const count of counts) { count.textContent = String(visible.length); count.hidden = visible.length === 0; }
 if (list) renderSavedPage(visible);
}

function renderSavedPage(ids: string[]) {
 const cards = new Map([...list!.querySelectorAll<HTMLElement>('.card')].map(card => [card.dataset.id!, card]));
 for (const card of cards.values()) card.hidden = true;
 for (const id of ids) { const card = cards.get(id)!; list!.append(card); card.hidden = false; }
 document.querySelector<HTMLElement>('#saved-empty')!.hidden = ids.length > 0 || !available;
 document.querySelector<HTMLElement>('#saved-unavailable')!.hidden = available;
 document.querySelector<HTMLElement>('#saved-total')!.textContent = `${ids.length} ${ids.length === 1 ? 'resource' : 'resources'}`;
 list!.classList.add('ready');
}

if (available) {
 for (const button of buttons) {
  button.hidden = false;
  button.addEventListener('click', () => {
   const id = button.dataset.save!;
   const ids = read();
   write(ids.includes(id) ? ids.filter(other => other !== id) : [id, ...ids]);
   render();
  });
 }
 // Keep other open tabs in step.
 addEventListener('storage', event => { if (event.key === KEY || event.key === null) render(); });
}
render();

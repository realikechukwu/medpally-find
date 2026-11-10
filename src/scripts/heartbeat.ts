// Runs one ECG complex along the home headline when the page loads. Letters lift as the R wave passes and the full stop swells where
// the beat lands. After that the trace fades and only the full stop keeps beating, at 60 bpm (.is-resting in global.css).
// Hovering the headline replays the sweep. The headline stays real text for screen readers (sr-only copy); the animated letters are aria-hidden.
const title = document.querySelector<HTMLElement>('[data-heartbeat]');
if (title) {
 const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
 // Markup is "first line<br/><em>second line<span class="beat-dot">.</span></em>"
 const first = title.firstChild?.textContent?.trim() ?? '';
 const second = title.querySelector('em')?.firstChild?.textContent?.trim() ?? '';
 const letters = (s: string) => s.split(' ').map(w => `<span class="beat-word">${[...w].map(c => `<span class="beat-ch">${c}</span>`).join('')}</span>`).join(' ');
 title.innerHTML = `<span class="sr-only">${first} ${second}.</span><canvas class="beat-trace" aria-hidden="true"></canvas><span aria-hidden="true">${letters(first)}<br/><em>${letters(second)}<span class="beat-dot">.</span></em></span>`;
 const canvas = title.querySelector<HTMLCanvasElement>('.beat-trace')!;
 const ctx = canvas.getContext('2d')!;
 const dot = title.querySelector<HTMLElement>('.beat-dot')!;
 const g = (x: number, m: number, s: number) => Math.exp(-((x - m) ** 2) / (2 * s * s));
 // PQRST in em units behind the moving front: P, then QRS, then T
 const complex = (d: number) => 0.12 * g(d, -2, 0.12) - 0.1 * g(d, -1.42, 0.04) + g(d, -1.3, 0.05) - 0.3 * g(d, -1.17, 0.045) + 0.25 * g(d, -0.55, 0.17);
 const SPEED = 4; // em per second along the headline
 const TAIL = 2.6; // em of complex behind the front: the sweep ends once all of it has left the last letter
 const BASE = 0.22; // opacity of the faint baseline while the sweep runs
 type Line = { y: number; x0: number; x1: number; off: number; items: { el: HTMLElement; cx: number }[] };
 let lines: Line[] = [], total = 0, em = 16, dpr = 1, colour = '#f3a79e', s = 0, fade = 0, sweeping = false, last = 0, raf = 0;

 const measure = () => {
  dpr = Math.min(2, devicePixelRatio || 1);
  em = parseFloat(getComputedStyle(title).fontSize);
  colour = getComputedStyle(title).getPropertyValue('--beat').trim() || colour;
  const box = title.getBoundingClientRect(), padX = em * 1.2, padY = em * 0.9;
  Object.assign(canvas.style, { left: `${-padX}px`, top: `${-padY}px`, width: `${box.width + 2 * padX}px`, height: `${box.height + 2 * padY}px` });
  canvas.width = Math.round((box.width + 2 * padX) * dpr); canvas.height = Math.round((box.height + 2 * padY) * dpr);
  const chars = [...title.querySelectorAll<HTMLElement>('.beat-ch'), dot];
  chars.forEach(el => el.style.transform = '');
  const rows: { top: number; h: number; items: { el: HTMLElement; cx: number; l: number; r: number }[] }[] = [];
  for (const el of chars) {
   const r = el.getBoundingClientRect(), top = r.top - box.top;
   let row = rows.find(x => Math.abs(x.top - top) < em * 0.3);
   if (!row) rows.push(row = { top, h: r.height, items: [] });
   row.items.push({ el, cx: r.left - box.left + r.width / 2 + padX, l: r.left - box.left + padX, r: r.right - box.left + padX });
  }
  total = 0;
  lines = rows.map(row => {
   const x0 = Math.min(...row.items.map(i => i.l)) - em * 0.6, x1 = Math.max(...row.items.map(i => i.r)) + em * 0.25;
   const line = { y: row.top + row.h * 0.86 + padY, x0, x1, off: total, items: row.items };
   total += x1 - x0;
   return line;
  });
 };

 const paint = () => {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = colour; ctx.lineJoin = 'round';
  for (const line of lines) {
   const front = line.x0 + s - line.off, a = Math.max(line.x0, front - em * 2.5), b = Math.min(line.x1, front);
   if (fade > 0) {
    ctx.globalAlpha = BASE * fade; ctx.lineWidth = Math.max(1.5, em * 0.03);
    ctx.beginPath(); ctx.moveTo(line.x0, line.y); ctx.lineTo(line.x1, line.y); ctx.stroke();
   }
   ctx.globalAlpha = 1;
   if (b > a) {
    ctx.lineWidth = Math.max(2, em * 0.045); ctx.beginPath();
    for (let x = a; x <= b; x++) { const y = line.y - em * 0.85 * complex((x - front) / em); x === a ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.stroke();
   }
   if (reduce) continue;
   const r = front - 1.3 * em;
   for (const { el, cx } of line.items) {
    const k = g(cx - r, 0, em * 0.32);
    el.style.transform = k <= 0.01 ? '' : el === dot ? `scale(${1 + 0.55 * k})` : `translateY(${-0.13 * k}em)`;
   }
  }
 };

 const tick = (t: number) => {
  const dt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t;
  if (sweeping) {
   s += em * SPEED * dt;
   if (s >= total + em * TAIL) { sweeping = false; title.classList.add('is-resting'); }
  }
  fade = Math.min(1, Math.max(0, fade + (sweeping ? 4 : -1.5) * dt));
  paint();
  raf = sweeping || fade > 0 ? requestAnimationFrame(tick) : 0;
 };

 const sweep = () => {
  if (sweeping || !lines.length) return;
  sweeping = true; s = 0; title.classList.remove('is-resting');
  if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
 };

 const start = () => {
  measure();
  if (reduce) { const end = lines[lines.length - 1]; s = end ? end.off + end.x1 - end.x0 + em * 0.2 : 0; fade = 1; paint(); }
  else sweep();
 };

 if (!reduce) title.addEventListener('pointerenter', sweep);
 let timer = 0;
 new ResizeObserver(() => { clearTimeout(timer); timer = window.setTimeout(() => { measure(); paint(); }, 60); }).observe(title);
 document.fonts.ready.then(start);
}

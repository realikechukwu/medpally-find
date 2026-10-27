import type { Item } from './schema';

// Card art for listings without an image: a dark panel coloured by the item's main topic, with a faint line motif.
// The topic itself isn't printed, since most items span several; the tag chips under the card list them all.
// Motif paths are drawn in a 350×219 box and cropped to the card.
const wave = Array.from({ length: 6 }, (_, i) => { const x = 40 + i * 70; return `M${x - 70} 150 C${x - 58} 150 ${x - 54} 100 ${x - 40} 100 C${x - 26} 100 ${x - 23} 128 ${x - 17} 131 C${x - 12} 133 ${x - 9} 124 ${x - 3} 126 C${x + 4} 129 ${x - 4} 150 ${x} 150`; }).join(' ');
const motifs = {
  fan: 'M262 -10 L150 238 M262 -10 L374 238 M230 63 A80 80 0 0 0 294 63 M206 117 A140 140 0 0 0 318 117 M182 171 A200 200 0 0 0 342 171 M158 225 A260 260 0 0 0 366 225',
  trace: 'M-4 96 H40 L48 88 L56 96 H76 L82 104 L90 42 L98 122 L104 96 H130 Q142 78 154 96 H196 L204 88 L212 96 H232 L238 104 L246 42 L254 122 L260 96 H286 Q298 78 310 96 H356',
  vessels: 'M262 -6 C272 58 300 90 280 148 S298 200 316 228 M280 148 C252 168 240 196 222 228 M272 58 C302 66 326 58 356 76 M290 100 C318 112 330 130 356 136 M200 -6 C206 30 190 54 168 70',
  rings: 'M310 96 A34 34 0 1 0 242 96 A34 34 0 1 0 310 96 M342 96 A66 66 0 1 0 210 96 A66 66 0 1 0 342 96 M374 96 A98 98 0 1 0 178 96 A98 98 0 1 0 374 96 M276 -40 V232 M140 96 H412',
  wave,
  grid: 'M196 -4 V223 M238 -4 V223 M280 -4 V223 M322 -4 V223 M154 40 H354 M154 82 H354 M154 124 H354 M154 166 H354 M154 208 H354'
};
type Motif = keyof typeof motifs;
const topics: Record<string, [colour: string, motif: Motif]> = {
  echo: ['#1f2f57', 'fan'], 'ultrasound/pocus': ['#1d3d63', 'fan'],
  ecg: ['#7a2e29', 'trace'], ep: ['#5c4413', 'trace'], 'critical-care': ['#2c3644', 'trace'],
  interventional: ['#0f3d3b', 'vessels'], acs: ['#7a3a12', 'vessels'], 'cardiac-surgery': ['#4a2d24', 'vessels'],
  imaging: ['#33294f', 'rings'], congenital: ['#46306a', 'rings'],
  'heart-failure': ['#5a2747', 'wave'], haemodynamics: ['#1c4656', 'wave'], mcs: ['#3b3f46', 'wave'], 'pulmonary-hypertension': ['#3d3a1c', 'wave'], valve: ['#2a3c66', 'wave'],
  pharmacology: ['#234a30', 'grid'], ai: ['#2b2f3a', 'grid']
};

// The main topic is the item's first tag, as the curator orders them (it is also the first tag chip on the card).
export const mainTopic = (item: Item) => item.tags[0];
export function topicArt(item: Item) {
  const topic = mainTopic(item);
  const [colour, motif] = topics[topic] ?? ['#2c3644', 'grid'];
  return { topic, colour, motif: motifs[motif], name: item.short_title ?? item.title };
}

import { activeItems } from './items';

// "Start here" sets on the home page: short hand-picked lists for common starting points, in the order to work through them.
// A listing that is hidden or removed drops out of its set, and a set left with fewer than two listings isn't shown,
// so intake changes never break the build.
const sets: { title: string; blurb: string; ids: string[] }[] = [
  { title: 'ECG from scratch', blurb: 'Learn the basics, then keep a library open while you practise on real cases.', ids: ['intro2ekg', 'litfl-ecg-library', 'ecg-weekly', 'ecg-toolkit'] },
  { title: 'Starting echo', blurb: 'Get the standard views in your head before you pick up a probe.', ids: ['intro2echo', 'how-to-perform-a-transthoracic-echocardiogram-tte', '123sonography', 'ase-guidelines'] },
  { title: 'New to cardiac ITU', blurb: 'Shock, mechanical support and bedside ultrasound, before your first night on call.', ids: ['internet-book-of-critical-care', 'pulmcritcare-simulators', 'pulmonary-pocus', 'night-float-cardiology'] },
  { title: 'First weeks in the cath lab', blurb: 'Learn the projections and the coronary anatomy before you scrub in.', ids: ['introductory-guide-to-angiography', 'learncoronary', 'angioview', 'coronary-physiology-mentor'] }
];

export const starterSets = sets
  .map(set => ({ ...set, items: set.ids.flatMap(id => activeItems.find(item => item.id === id) ?? []) }))
  .filter(set => set.items.length >= 2);

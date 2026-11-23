// Pirento Intern: the exam in a few numbers, read from the live tracks (admin sets each one's questions, minutes
// and pass mark), so a range shows when tracks differ.
import {useApi} from '../../../lib/api/useApi';

const range = (tracks, key, unit = '') => {
  const v = [...new Set(tracks.map((t) => t[key]))].sort((a, b) => a - b);
  return !v.length ? '—' : v.length > 1 ? `${v[0]}–${v.at(-1)}${unit}` : `${v[0]}${unit}`;
};

export function ExamFacts() {
  const tracks = useApi('/learning/tracks').data ?? [];
  const facts = [
    {value: tracks.length ? String(tracks.length) : '—', label: 'tracks'},
    {value: range(tracks, 'questions'), label: 'questions, drawn at random'},
    {value: range(tracks, 'minutes', ' min'), label: 'to finish'},
    {value: range(tracks, 'passPercent', '%'), label: 'to pass'},
    {value: '₹0', label: 'exam and certificate'},
  ];
  return (
    <dl className="grid grid-cols-2 border-t border-rule sm:grid-cols-3 lg:grid-cols-5">
      {facts.map((f) => (
        <div key={f.label} className="border-b border-rule py-6 pr-4 text-left lg:border-b-0" data-reveal>
          <dd className="num text-[clamp(2rem,4vw,3.25rem)]!">{f.value}</dd>
          <dt className="mt-2 text-sm text-muted">{f.label}</dt>
        </div>
      ))}
    </dl>
  );
}

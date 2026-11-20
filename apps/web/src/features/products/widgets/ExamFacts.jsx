// Pirento Intern: the exam in four numbers, straight from the rules the learning service enforces.
import {EXAM_RULES} from '@pirento/shared';

export function ExamFacts({product}) {
  const facts = [
    {value: String(product.tracks.length), label: 'tracks'},
    {value: String(EXAM_RULES.questions), label: 'questions per exam'},
    {value: `${EXAM_RULES.minutes} min`, label: 'to finish'},
    {value: `${EXAM_RULES.passPercent}%`, label: 'to pass'},
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

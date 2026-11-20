// The step list and the current step of the Bharat ID application.
import {useState} from 'react';
import {ID_SECTIONS} from '@pirento/shared';
import {Label} from '../../components/ui/Heading';
import {Review} from './ReviewStep';
import {StepForm} from './StepForm';
import {VideoKycStep} from './VideoKycStep';

// The form's sections, then video verification, then review.
export const STEPS = [
  ...ID_SECTIONS,
  {id: 'video', title: 'Video verification'},
  {id: 'review', title: 'Review and submit'},
];
const VIDEO = ID_SECTIONS.length;
const REVIEW = VIDEO + 1;

const isDone = (doc, step) => (step.id === 'video' ? Boolean(doc?.kyc?.recordedAt) : Boolean(doc?.sections?.[step.id]));

/** The first step still to do (review once everything is done). */
export const firstOpen = (doc) => {
  const i = STEPS.slice(0, REVIEW).findIndex((s) => !isDone(doc, s));
  return i === -1 ? REVIEW : i;
};

export function Wizard({doc, email, onChange}) {
  const [step, setStep] = useState(() => firstOpen(doc));
  const done = (i) => isDone(doc, STEPS[i]);
  // After saving a step, go on; after an edit made from review, go straight back to it.
  const advance = (next) => {
    if (next) onChange(next);
    setStep(Math.max(step + 1, firstOpen(next ?? doc)));
  };
  const canOpen = (i) => i <= firstOpen(doc);
  const current = STEPS[step];

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <nav aria-label="Application steps" className="lg:col-span-4">
        <p className="text-sm text-muted lg:hidden">
          Step {step + 1} of {STEPS.length} · {current.title}
        </p>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-stone lg:hidden" aria-hidden>
          <div
            className="h-full bg-accent transition-[width] duration-500"
            style={{width: `${((step + 1) / STEPS.length) * 100}%`}}
          />
        </div>
        <ol className="relative mt-2 hidden border-l border-rule lg:block">
          {STEPS.map((s, i) => (
            <li key={s.id} className="relative pb-6 pl-6 last:pb-0">
              <span
                aria-hidden
                className={`absolute top-1.5 -left-[7px] size-3 rounded-full border-2 ${
                  done(i) ? 'border-accent bg-accent' : i === step ? 'border-ink bg-paper' : 'border-rule bg-paper'
                }`}
              />
              <button
                onClick={() => setStep(i)}
                disabled={!canOpen(i)}
                aria-current={i === step ? 'step' : undefined}
                className={`text-left ${i === step ? 'font-medium text-ink' : canOpen(i) ? 'text-muted hover:text-ink' : 'text-muted opacity-60'}`}
              >
                <span className="tabular-nums">{String(i + 1).padStart(2, '0')}</span> {s.title}
                {done(i) && <span className="sr-only"> (done)</span>}
              </button>
            </li>
          ))}
        </ol>
      </nav>
      <div className="min-w-0 lg:col-span-8">
        <Label n={step + 1}>{current.title}</Label>
        <div className="mt-6">
          {current.id === 'review' ? (
            <Review doc={doc} email={email} onEdit={setStep} onSubmitted={onChange} />
          ) : current.id === 'video' ? (
            <VideoKycStep doc={doc} onSaved={advance} onBack={() => setStep(step - 1)} />
          ) : (
            <StepForm
              key={current.id}
              section={current}
              initial={doc?.sections?.[current.id]}
              onBack={step > 0 ? () => setStep(step - 1) : null}
              onSaved={advance}
            />
          )}
        </div>
      </div>
    </div>
  );
}
